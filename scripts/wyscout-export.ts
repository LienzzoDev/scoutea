#!/usr/bin/env tsx

/**
 * 📥 (VÍA API) DESCARGA + IMPORT DE STATS DESDE WYSCOUT
 *
 * ⚠️ El export usa searchapi `/api/v1/search/fluid.xlsx` (per-90), NO el `getExcelByList` nativo de
 *    la web (que solo da totales). El login se hace por navegador (SSO Hudl) y el export es un POST
 *    HTTP autenticado con el token capturado. Verificado funcionando (2026-07): produce el .xlsx con
 *    las 26 columnas del preset "gino" + la columna `id`. Nota: llamar getExcelByList o
 *    /v1/lists/{id}.json con solo el token (sin la sesión del navegador) devuelve 400/404 — por eso
 *    se usa fluid.xlsx + getAllLists(fetch=elements) para descubrir los IDs.
 *
 * Se autentica (login por navegador SSO Hudl), descubre todas las listas de 100 jugadores, y por
 * cada lista descarga un Excel por periodo (3M/6M/1Y/2Y) con el preset "gino". Cada Excel se
 * importa a player_stats_{3m,6m,1y,2y} reutilizando period-stats-import, y al final recalcula
 * normalizaciones/rankings de cada periodo tocado. Match jugador por Wyscout ID.
 *
 * Uso:
 *   npx tsx scripts/wyscout-export.ts                      # todo end-to-end (descarga + import)
 *   npx tsx scripts/wyscout-export.ts --limit 1            # solo las primeras N listas (prueba)
 *   npx tsx scripts/wyscout-export.ts --only-download      # descarga .xlsx a exports/wyscout, sin BD
 *   npx tsx scripts/wyscout-export.ts --list-id 319877     # una sola lista
 *   npx tsx scripts/wyscout-export.ts --period 3m          # un solo periodo (3m|6m|1y|2y)
 *   npx tsx scripts/wyscout-export.ts --out ./exports/wy   # guardar .xlsx además de importar
 *   npx tsx scripts/wyscout-export.ts --delay 2000         # ms de pausa entre exports (def. 1500)
 *
 * Requiere en .env: WYSCOUT_USERNAME, WYSCOUT_PASSWORD (y opcional WYSCOUT_GROUP_ID / _SUBGROUP_ID).
 */

import 'dotenv/config'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import axios from 'axios'
import * as XLSX from 'xlsx'

import { prisma } from '../src/lib/db'
import {
  importParsedRows,
  loadWyscoutMaps,
  recalcPeriodNormalizations,
  type WyscoutMaps,
} from '../src/lib/services/period-stats-import'
import { type StatsPeriod, isValidPeriod } from '../src/lib/utils/stats-period-utils'
import { getWyscoutTokenViaBrowser } from './wyscout-browser-auth'
import {
  EXPORT_HEADERS,
  PERIODS,
  SEARCHAPI,
  customRange,
  fluidExportBody,
  getAllLists,
  listPlayerIds,
  outFileName,
  sleep,
  type PeriodSpec,
  type WyscoutList,
} from './wyscout-shared'

// ─── CONFIG ──────────────────────────────────────────────────────────────────
// Las constantes del preset, periodos y descubrimiento de listas viven en wyscout-shared.ts.

const TOKEN_FILE = join(process.cwd(), '.wyscout-tokens.json')
/** Sesión de navegador persistida (cookies Hudl). Permite reautenticar sin credenciales. */
const SESSION_FILE = join(process.cwd(), '.wyscout-session.json')
const USERNAME = process.env.WYSCOUT_USERNAME
const PASSWORD = process.env.WYSCOUT_PASSWORD

// ─── AUTENTICACIÓN (SSO Hudl/Auth0 vía navegador headless) ────────────────────
// La cuenta usa SSO de Hudl, que no permite login usuario/contraseña por API. El token
// de 40 chars se obtiene conduciendo el login real con Playwright (ver wyscout-browser-auth.ts).

interface CachedToken {
  access_token: string
  captured_ms: number
}

/** TTL conservador para reusar el token entre runs rápidos (su expiry real es desconocido). */
const TOKEN_TTL_MS = 25 * 60 * 1000

function loadCachedToken(): CachedToken | null {
  if (!existsSync(TOKEN_FILE)) return null
  try {
    const t = JSON.parse(readFileSync(TOKEN_FILE, 'utf8')) as CachedToken
    return t && typeof t.access_token === 'string' && t.access_token ? t : null
  } catch {
    return null
  }
}

/** Devuelve un access_token de Wyscout: reusa el cacheado si es reciente, si no login por navegador. */
async function getToken(forceFresh = false): Promise<string> {
  if (!forceFresh) {
    const cached = loadCachedToken()
    if (cached && Date.now() - cached.captured_ms < TOKEN_TTL_MS) {
      console.log('Token en caché reciente, reusando.')
      return cached.access_token
    }
  }
  console.log('Autenticando en Wyscout (sesión guardada o login SSO)...')
  const token = await getWyscoutTokenViaBrowser({
    username: USERNAME,
    password: PASSWORD,
    headless: process.env.WYSCOUT_HEADFUL !== '1',
    storageStatePath: SESSION_FILE,
    onLog: (m) => console.log(`  ${m}`),
  })
  writeFileSync(
    TOKEN_FILE,
    JSON.stringify({ access_token: token, captured_ms: Date.now() } satisfies CachedToken)
  )
  console.log('  Token capturado y cacheado.')
  return token
}

// ─── EXPORT ──────────────────────────────────────────────────────────────────
// CONFIRMADO en discovery (Fase 2). El navegador solo sirve para el login (token); el export es un
// POST HTTP autenticado a searchapi (fluid.xlsx) con ventana de fechas rodante, que devuelve los
// bytes .xlsx con stats per-90 + columna id directamente.

/** Error de export que preserva el status HTTP (para reintentar en 401/403 con token fresco). */
class ExportError extends Error {
  constructor(message: string, readonly status: number) {
    super(message)
    this.name = 'ExportError'
  }
}

/** Exporta una lista a xlsx (bytes) para un periodo dado (ventana rodante de spec.monthsBack). */
async function exportListExcel(list: WyscoutList, spec: PeriodSpec, token: string): Promise<Buffer> {
  const playerIds = listPlayerIds(list)
  const { from, to } = customRange(spec.monthsBack)

  const res = await axios.post(
    `${SEARCHAPI}/api/v1/search/fluid.xlsx`,
    fluidExportBody(playerIds, from, to, token),
    {
      params: { access_token: token },
      headers: EXPORT_HEADERS,
      responseType: 'arraybuffer',
      validateStatus: () => true,
    }
  )
  if (res.status !== 200) {
    const text = Buffer.from(res.data as ArrayBuffer).toString('utf8').slice(0, 300)
    throw new ExportError(`Export ${res.status}: ${text}`, res.status)
  }
  return Buffer.from(res.data as ArrayBuffer)
}

// ─── CLI ─────────────────────────────────────────────────────────────────────

interface Args {
  limit?: number
  onlyDownload: boolean
  listId?: number
  period?: StatsPeriod
  out?: string
  delay: number
}

function parseArgs(): Args {
  const argv = process.argv.slice(2)
  const a: Args = { onlyDownload: false, delay: 1500 }
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i]
    const next = () => argv[++i]
    switch (k) {
      case '--limit':
        a.limit = parseInt(next()!, 10)
        break
      case '--only-download':
        a.onlyDownload = true
        break
      case '--list-id':
        a.listId = parseInt(next()!, 10)
        break
      case '--period': {
        const p = next()
        if (!p || !isValidPeriod(p)) throw new Error(`--period inválido: ${p} (usa 3m|6m|1y|2y)`)
        a.period = p
        break
      }
      case '--out': {
        const v = next()
        if (v) a.out = v
        break
      }
      case '--delay':
        a.delay = parseInt(next()!, 10)
        break
      default:
        throw new Error(`Flag desconocido: ${k}`)
    }
  }
  return a
}

// ─── MAIN ────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const args = parseArgs()
  // Con sesión guardada válida no hacen falta credenciales; solo se exigen si no hay sesión.
  if ((!USERNAME || !PASSWORD) && !existsSync(SESSION_FILE)) {
    console.error(
      '❌ Falta WYSCOUT_USERNAME / WYSCOUT_PASSWORD en .env (o una sesión guardada .wyscout-session.json)'
    )
    process.exit(1)
  }

  const periods = args.period ? PERIODS.filter((p) => p.period === args.period) : PERIODS
  const outDir = args.out ?? (args.onlyDownload ? join(process.cwd(), 'exports', 'wyscout') : undefined)
  if (outDir) mkdirSync(outDir, { recursive: true })

  console.log('='.repeat(55))
  console.log(`  Wyscout export (vía API) — ${new Date().toISOString()}`)
  console.log(
    `  Periodos: ${periods.map((p) => p.label).join(', ')}` +
      (args.onlyDownload ? '  (solo descarga)' : '  (descarga + import)')
  )
  console.log('='.repeat(55))

  let token = await getToken()

  // 1) Descubrir listas (con IDs de jugador inline vía fetch=elements)
  console.log('Obteniendo listas (con IDs de jugador)...')
  const all = await getAllLists(token, { withElements: true })
  let lists: WyscoutList[]
  if (args.listId) {
    lists = all.filter((l) => l.id === args.listId)
    if (!lists.length) throw new Error(`Lista ${args.listId} no encontrada en el grupo`)
  } else {
    lists = all.filter((l) => l.count === 100)
  }
  console.log(`  ${all.length} listas totales, ${lists.length} seleccionadas`)
  if (args.limit) lists = lists.slice(0, args.limit)

  // 2) Precargar mapas de matching (salvo en solo-descarga)
  const maps: WyscoutMaps | null = args.onlyDownload ? null : await loadWyscoutMaps()
  if (maps) console.log(`  ${maps.wyMap.size} Wyscout IDs en BD`)

  // 3) Descargar (+ importar) por lista × periodo
  const touched = new Set<StatsPeriod>()
  const summary = { lists: 0, downloadsOk: 0, downloadsFail: 0, success: 0, notFound: 0, failed: 0 }

  console.log(`\nProcesando ${lists.length} lista(s)...\n`)
  for (let i = 0; i < lists.length; i++) {
    const list = lists[i]!
    console.log(`[${i + 1}/${lists.length}] ${list.name} (ID: ${list.id})`)

    // Renovar token cada 50 listas
    if (i > 0 && i % 50 === 0) token = await getToken(true)

    const playerIds = listPlayerIds(list)
    if (playerIds.length === 0) {
      console.log('  ✗ sin IDs de jugador, se omite')
      continue
    }
    if (playerIds.length !== 100 && !args.listId) {
      console.log(`  ⚠ ${playerIds.length} IDs (≠100), se omite`)
      continue
    }

    for (const spec of periods) {
      try {
        // El TTL real del token es desconocido; si caducó a mitad de run, renuévalo y reintenta 1 vez.
        let buffer: Buffer
        try {
          buffer = await exportListExcel(list, spec, token)
        } catch (e) {
          if (e instanceof ExportError && (e.status === 401 || e.status === 403)) {
            console.log(`  🔑 ${spec.label}: token rechazado (${e.status}), renovando y reintentando...`)
            token = await getToken(true)
            buffer = await exportListExcel(list, spec, token)
          } else {
            throw e
          }
        }
        summary.downloadsOk++

        if (outDir) {
          writeFileSync(join(outDir, outFileName(list, spec.label)), buffer)
        }

        if (maps) {
          const wb = XLSX.read(buffer, { type: 'buffer' })
          const ws = wb.Sheets[wb.SheetNames[0]!]
          if (!ws) {
            console.log(`  ⚠ ${spec.label}: xlsx sin hoja, se omite`)
            continue
          }
          const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: null })
          const res = await importParsedRows(rows, spec.period, maps, undefined, `${list.name} ${spec.label}`)
          summary.success += res.success
          summary.notFound += res.notFound
          summary.failed += res.failed
          touched.add(spec.period)
          for (const w of res.warnings) console.log(`  ⚠ ${w}`)
          // Aborto por cabeceras irreconocibles (0 matches con filas presentes).
          if (res.matched === 0 && rows.length > 0 && res.errors.length > 0) {
            console.log(`  ✗ ${spec.label}: ${res.errors[0]}`)
            continue
          }
          console.log(
            `  ${spec.label}: ${res.success} ok, ${res.notFound} sin jugador (${rows.length} filas, ${res.matched} únicos)`
          )
        } else {
          console.log(`  ${spec.label}: descargado (${buffer.length.toLocaleString()} bytes)`)
        }
      } catch (e) {
        summary.downloadsFail++
        console.log(`  ✗ ${spec.label}: ${e instanceof Error ? e.message : e}`)
        await sleep(3000)
      }
      await sleep(args.delay)
    }
    summary.lists++
  }

  // 4) Recalcular normalizaciones/rankings por periodo tocado (una vez)
  if (maps && touched.size > 0) {
    console.log('\nRecalculando normalizaciones...')
    for (const period of touched) {
      try {
        const n = await recalcPeriodNormalizations(period, (m) => console.log(`  ${m}`))
        console.log(`  ✅ ${period.toUpperCase()}: ${n} jugadores`)
      } catch (e) {
        console.log(`  ❌ ${period.toUpperCase()}: ${e instanceof Error ? e.message : e}`)
      }
    }
  }

  // 5) Resumen
  console.log(`\n${'='.repeat(55)}`)
  console.log('  RESUMEN')
  console.log(`  Listas procesadas:  ${summary.lists}`)
  console.log(`  Descargas OK / fail: ${summary.downloadsOk} / ${summary.downloadsFail}`)
  if (maps) {
    console.log(`  Filas importadas:    ${summary.success}`)
    console.log(`  Sin jugador en BD:   ${summary.notFound}`)
    console.log(`  Con error de upsert: ${summary.failed - summary.notFound}`)
  }
  console.log('='.repeat(55))
}

main()
  .catch((e) => {
    console.error('\n❌ Error fatal:', e)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
