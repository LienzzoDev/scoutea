/**
 * 🔐 SESIÓN DE WYSCOUT VÍA NAVEGADOR (Playwright)
 *
 * La cuenta usa SSO de Hudl (Auth0), que NO permite grant de contraseña por API (ROPG
 * bloqueado). Conducimos el login real: email → password → (si aparece) botón "Forzar la
 * sesión" (Wyscout limita a 1 sesión concurrente) → y capturamos el access_token legacy de
 * 40 chars hex que la app usa contra rest.wyscout.com.
 *
 * Exporta:
 *   - openWyscoutSession()      → sesión VIVA {browser,context,page,token} para seguir operando.
 *   - getWyscoutTokenViaBrowser → wrapper fino: abre, coge token, cierra.
 *   - attachNetworkCapture()    → registra el tráfico de Wyscout (para discovery / replay).
 *
 * ⚠️ Frágil POR DISEÑO: si Auth0/Hudl cambian el HTML del login, meten MFA o detección de bots
 *    (probable desde una IP de datacenter), este flujo se rompe y hay que reajustarlo.
 */
import { existsSync } from 'node:fs'

import { chromium, type Browser, type BrowserContext, type Page } from 'playwright'

// El token legacy de Wyscout es 40 chars hex. Aparece como `accessToken=` (socket.io de
// notificationslive) o `access_token=` (rest.wyscout.com).
const TOKEN_RE = /access_?token=([a-f0-9]{40})\b/i
const APP_URL = 'https://wyscout.hudl.com/app/'
const UA =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

export interface BrowserAuthOpts {
  /** Opcional si hay una sesión guardada válida (storageStatePath). Requerido si no. */
  username?: string
  password?: string
  /** headless por defecto; poner false para depurar viendo el navegador */
  headless?: boolean
  /** timeout global del login (ms) */
  timeoutMs?: number
  onLog?: (msg: string) => void
  /**
   * Ruta a un storageState de Playwright (cookies de sesión Hudl/Auth0). Si el fichero existe y la
   * sesión sigue viva, se reutiliza para autenticar SIN credenciales; se (re)guarda tras cada login
   * exitoso. Es lo que evita reintroducir el login SSO en cada ejecución.
   */
  storageStatePath?: string
}

/** Sesión autenticada viva. Recuerda cerrarla con `close()`. */
export interface WyscoutSession {
  browser: Browser
  context: BrowserContext
  page: Page
  /** Último access_token (40 hex) visto en el tráfico (se mantiene fresco si la app lo renueva). */
  getToken(): string | null
  /** Espera hasta `timeoutMs` a que haya un token capturado. */
  waitForToken(timeoutMs?: number): Promise<string>
  close(): Promise<void>
}

/**
 * Hace login y devuelve una sesión VIVA (no cierra el navegador). El token se captura del
 * tráfico y se mantiene fresco. Lanza si no consigue autenticar (timeout / MFA / cambio de flujo).
 */
export async function openWyscoutSession(opts: BrowserAuthOpts): Promise<WyscoutSession> {
  const { username, password, headless = true, timeoutMs = 120_000, onLog = () => {}, storageStatePath } = opts

  const browser: Browser = await chromium.launch({
    headless,
    args: ['--disable-blink-features=AutomationControlled', '--no-sandbox'],
  })

  // Siempre nos quedamos con el token MÁS reciente (la app puede renovarlo en sesiones largas).
  let token: string | null = null
  const grab = (url: string) => {
    const m = url.match(TOKEN_RE)
    if (m) token = m[1]!
  }

  try {
    const hasSaved = !!storageStatePath && existsSync(storageStatePath)
    const context = await browser.newContext({
      userAgent: UA,
      viewport: { width: 1440, height: 900 },
      acceptDownloads: true,
      // Reutiliza cookies de sesión Hudl guardadas: la app se autentica sola, sin credenciales.
      ...(hasSaved ? { storageState: storageStatePath } : {}),
    })
    const page = await context.newPage()
    page.on('request', (r) => grab(r.url()))
    page.on('response', (r) => grab(r.url()))
    page.on('websocket', (ws) => grab(ws.url()))

    const buildSession = (): WyscoutSession => ({
      browser,
      context,
      page,
      getToken: () => token,
      async waitForToken(t = 30_000) {
        const dl = Date.now() + t
        while (Date.now() < dl) {
          if (token) return token
          await page.waitForTimeout(500)
        }
        throw new Error('waitForToken: timeout sin token capturado')
      },
      async close() {
        await browser.close().catch(() => {})
      },
    })

    // Persiste las cookies de sesión para reutilizarlas en próximos runs (login credential-free).
    const saveSession = async () => {
      if (!storageStatePath) return
      try {
        await context.storageState({ path: storageStatePath })
        onLog('Sesión de navegador guardada (reutilizable sin credenciales).')
      } catch {
        /* noop */
      }
    }

    // Espera hasta `ms` a que aparezca un token en el tráfico; corta antes si nos rebota al login.
    const waitTokenOrLogin = async (ms: number): Promise<string | null> => {
      const dl = Date.now() + ms
      while (Date.now() < dl && !token) {
        if (page.url().includes('identity.hudl.com')) return null
        await page.waitForTimeout(500)
      }
      return token
    }

    onLog('Abriendo Wyscout...')
    await page.goto(APP_URL, { waitUntil: 'domcontentloaded', timeout: timeoutMs })

    // 1) VÍA RÁPIDA: sesión guardada válida → la app emite el token sola, sin credenciales.
    if (hasSaved) {
      onLog('Reutilizando sesión guardada (sin credenciales)...')
      const t = await waitTokenOrLogin(Math.min(timeoutMs, 45_000))
      if (t) {
        onLog('Token capturado desde la sesión guardada.')
        await saveSession() // refresca la expiración de las cookies
        return buildSession()
      }
      onLog('La sesión guardada caducó; se requiere login con credenciales.')
    }

    // 2) LOGIN CON CREDENCIALES (email → contraseña → forzar sesión).
    if (!username || !password) {
      throw new Error(
        'No hay sesión guardada válida y faltan WYSCOUT_USERNAME / WYSCOUT_PASSWORD para el login.'
      )
    }

    onLog(hasSaved ? 'Login con credenciales...' : 'Login SSO Hudl (primer acceso)...')
    // Paso 1 — email
    const emailSel = 'input[name="username"], input#username, input[type="email"]'
    await page.waitForSelector(emailSel, { timeout: timeoutMs })
    await page.fill(emailSel, username)
    await page.keyboard.press('Enter')
    onLog('Email enviado.')

    // Paso 2 — contraseña
    const passSel = 'input[name="password"], input#password, input[type="password"]'
    await page.waitForSelector(passSel, { timeout: timeoutMs })
    await page.fill(passSel, password)
    await page.keyboard.press('Enter')
    onLog('Contraseña enviada.')

    // Paso 3 — esperar el token; por el camino, pulsar "Forzar la sesión" si aparece, y abortar
    // pronto si detectamos credenciales incorrectas.
    const forceBtn = page.getByRole('button', { name: /forzar|force/i })
    const credError = page.getByText(/incorrect|contraseña|wrong email|invalid|no coincide/i)
    const deadline = Date.now() + timeoutMs
    let forced = false

    while (Date.now() < deadline && !token) {
      if (!forced && (await forceBtn.isVisible().catch(() => false))) {
        onLog('Sesión múltiple detectada → "Forzar la sesión".')
        await forceBtn.click().catch(() => {})
        forced = true
      }
      if (page.url().includes('identity.hudl.com') && (await credError.isVisible().catch(() => false))) {
        throw new Error('Login rechazado (credenciales incorrectas o MFA requerido).')
      }
      await page.waitForTimeout(1000)
    }

    if (!token) {
      throw new Error(
        `No se capturó el token tras el login (url actual: ${page.url()}). Posible MFA/anti-bot o cambio del flujo.`
      )
    }
    onLog('Token de Wyscout capturado; sesión abierta.')
    await saveSession()
    return buildSession()
  } catch (e) {
    await browser.close().catch(() => {})
    throw e
  }
}

/**
 * Compat: hace login y devuelve solo el access_token, cerrando el navegador.
 * Se mantiene para wyscout-export.ts (vía API) y cachés de token.
 */
export async function getWyscoutTokenViaBrowser(opts: BrowserAuthOpts): Promise<string> {
  const session = await openWyscoutSession(opts)
  try {
    return session.getToken()!
  } finally {
    await session.close()
  }
}

// ─── CAPTURA DE RED (discovery / replay) ──────────────────────────────────────

/** Hosts de interés de Wyscout para instrumentación. */
const CAPTURE_HOSTS =
  /(rest\.wyscout\.com|searchapi\.wyscout\.com|wyscout-apps\.hudl\.com|aengine-service\.php)/i

export interface CapturedRecord {
  kind: 'request' | 'response'
  ts: number
  url: string
  method?: string
  resourceType?: string
  status?: number
  contentType?: string
  /** cuerpo de la request (JSON del export, etc.), recortado a maxBodyBytes */
  postData?: string | null
  /** cuerpo de la response si es textual/JSON y pequeño, recortado a maxBodyBytes */
  bodyPreview?: string
}

/**
 * Registra el tráfico de red de Wyscout en `page`. Para requests captura método + postData
 * (clave para el export POST); para responses textuales/JSON pequeñas captura el body. El binario
 * (xlsx) se registra solo por metadata (url/status/content-type). No lanza: los errores de lectura
 * de body se ignoran.
 */
export function attachNetworkCapture(
  page: Page,
  onRecord: (rec: CapturedRecord) => void,
  opts: { maxBodyBytes?: number } = {}
): void {
  const maxBody = opts.maxBodyBytes ?? 20_000
  const cap = (s: string) => (s.length > maxBody ? `${s.slice(0, maxBody)}…[truncated ${s.length}B]` : s)
  // Nunca persistir el access_token (40 hex) en claro en los logs de captura.
  const redact = (s: string) => s.replace(/(access_?token=)[a-f0-9]{40}\b/gi, '$1<redacted>')

  page.on('request', (req) => {
    const url = req.url()
    if (!CAPTURE_HOSTS.test(url)) return
    let postData: string | null = null
    try {
      postData = req.postData()
    } catch {
      postData = null
    }
    onRecord({
      kind: 'request',
      ts: Date.now(),
      url: redact(url),
      method: req.method(),
      resourceType: req.resourceType(),
      postData: postData ? redact(cap(postData)) : null,
    })
  })

  page.on('response', (res) => {
    const url = res.url()
    if (!CAPTURE_HOSTS.test(url)) return
    const contentType = res.headers()['content-type'] || ''
    const rec: CapturedRecord = {
      kind: 'response',
      ts: Date.now(),
      url: redact(url),
      status: res.status(),
      contentType,
    }
    if (/json|text|javascript|xml/i.test(contentType)) {
      res
        .text()
        .then((t) => {
          rec.bodyPreview = redact(cap(t))
          onRecord(rec)
        })
        .catch(() => onRecord(rec))
    } else {
      onRecord(rec)
    }
  })
}
