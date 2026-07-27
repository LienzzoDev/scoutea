/**
 * 🛟 FALLBACK DE SCRAPING: RED ZEROZERO (ceroacero.es / playmakerstats.com)
 *
 * ZeroZero mantiene la misma base de datos de jugadores bajo varios espejos
 * por país. Se usan como fuente de respaldo cuando Transfermarkt falla:
 *
 *   1. ceroacero.es      — espejo español, ACCESIBLE sin Cloudflare (verificado)
 *   2. playmakerstats.com — espejo inglés, tras challenge de Cloudflare
 *
 * Si un espejo sirve el challenge de Cloudflare ("Just a moment..."), se
 * prueba el siguiente; si todos fallan se lanza PlaymakerUnavailableError.
 *
 * Estructuras soportadas (verificadas contra HTML real):
 *
 * Diseño nuevo (ceroacero.es 2026):
 *   <div class="card-data bio">
 *     <div class="card-data__row">
 *       <span class="card-data__label">Fecha de nacimiento</span>
 *       <span class="card-data__value">2007-07-13 (19 años)</span>
 *     </div>
 *     ... Nacionalidad/Club actual/Agente usan <div class="text">valor</div>
 *   </div>
 *
 * Diseño legacy (playmakerstats 2023):
 *   <div id="entity_bio">
 *     <div class="bio_half"><span>Born/Age</span>1997-11-16...</div>
 *   </div>
 *
 * Búsqueda: GET /pesquisa?search_txt=<nombre> en cualquier espejo.
 */

import * as cheerio from 'cheerio'

import { parseDateString } from './scraper'
import { getRealisticHeaders } from './user-agents'

export interface ZerozeroMirror {
  baseUrl: string
  /** Ruta de perfil de jugador en este espejo (para filtrar links de búsqueda) */
  playerPathPattern: RegExp
}

/** Espejos en orden de preferencia (el primero accesible gana) */
export const MIRRORS: ZerozeroMirror[] = [
  {
    baseUrl: 'https://www.ceroacero.es',
    playerPathPattern: /\/jugador\/[^/?"]+\/\d+/,
  },
  {
    baseUrl: 'https://www.playmakerstats.com',
    playerPathPattern: /(?:player\.php\?(?:&)?id=\d+|\/player\/[^/?"]+\/\d+|\/jogador\/[^/?"]+\/\d+)/,
  },
]

const REQUEST_TIMEOUT = 20000

/** El fallback no está disponible (Cloudflare challenge, bloqueo, etc.) */
export class PlaymakerUnavailableError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PlaymakerUnavailableError'
  }
}

/**
 * Detectar el challenge de Cloudflare en una respuesta
 */
export function isCloudflareChallenge(html: string): boolean {
  return html.includes('Just a moment') ||
    html.includes('challenges.cloudflare.com') ||
    html.includes('cf-chl-')
}

/**
 * Decodificar la respuesta respetando el charset: los espejos de zerozero
 * han servido históricamente ISO-8859-1 y response.text() siempre decodifica
 * UTF-8, lo que destrozaría acentos ("São José" → "S�o Jos�").
 */
export async function decodeHtmlResponse(
  buffer: ArrayBuffer,
  contentType: string | null
): Promise<string> {
  const charsetMatch = contentType?.match(/charset=([^;]+)/i)
  const declaredCharset = charsetMatch?.[1]?.trim().toLowerCase()

  if (declaredCharset && declaredCharset !== 'utf-8') {
    try {
      return new TextDecoder(declaredCharset).decode(buffer)
    } catch {
      // Charset desconocido → seguir con la heurística de abajo
    }
  }

  const utf8 = new TextDecoder('utf-8').decode(buffer)
  // Si la decodificación UTF-8 produjo caracteres de reemplazo, el HTML
  // probablemente es latin-1 sin declarar
  if (utf8.includes('�')) {
    return new TextDecoder('iso-8859-1').decode(buffer)
  }
  return utf8
}

async function fetchMirrorHtml(url: string, referer: string): Promise<string> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT)

  try {
    const response = await fetch(url, {
      headers: {
        ...getRealisticHeaders(referer),
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
      },
      signal: controller.signal,
      redirect: 'follow',
    })

    const html = await decodeHtmlResponse(
      await response.arrayBuffer(),
      response.headers.get('content-type')
    )

    if (response.status === 403 || isCloudflareChallenge(html)) {
      throw new PlaymakerUnavailableError(
        `Espejo bloqueado por Cloudflare (challenge JS): ${new URL(url).hostname}`
      )
    }

    if (!response.ok) {
      throw new Error(`ZeroZero HTTP ${response.status}: ${response.statusText}`)
    }

    return html
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`ZeroZero timeout después de ${REQUEST_TIMEOUT / 1000}s`)
    }
    throw error
  } finally {
    clearTimeout(timeoutId)
  }
}

/**
 * Extraer el primer link de perfil de jugador de una página de resultados
 */
export function extractFirstPlayerLink(html: string, mirror?: ZerozeroMirror): string | null {
  const activeMirror = mirror ?? MIRRORS[0]!
  const $ = cheerio.load(html)

  let href: string | undefined
  $('a[href]').each((_i, el) => {
    if (href) return
    const candidate = $(el).attr('href')
    if (candidate && activeMirror.playerPathPattern.test(candidate)) {
      href = candidate
    }
  })

  if (!href) return null
  // Quitar parámetros de tracking de la búsqueda (?search=1)
  const cleanHref = href.replace(/\?search=\d+$/, '')
  return cleanHref.startsWith('http')
    ? cleanHref
    : `${activeMirror.baseUrl}${cleanHref.startsWith('/') ? '' : '/'}${cleanHref}`
}

/**
 * 📅 Parsear fin de contrato en formato zerozero "2031/06" (año/mes)
 * → último día de ese mes
 */
export function parseContractYearMonth(value: string): Date | null {
  const match = value.trim().match(/^(\d{4})\/(\d{1,2})$/)
  if (!match?.[1] || !match[2]) return null
  const year = parseInt(match[1])
  const month = parseInt(match[2])
  if (month < 1 || month > 12) return null
  return new Date(year, month, 0) // día 0 del mes siguiente = último día del mes
}

/** Mapeo de labels (ES del diseño nuevo + EN del legacy) a campos */
const LABEL_FIELDS: Record<string, string> = {
  // Español (ceroacero.es, diseño nuevo)
  'fecha de nacimiento': 'date_of_birth',
  'nacionalidad': 'nationality',
  'posición': 'position_player',
  'pie': 'foot',
  'altura / peso': 'height',
  'club actual': 'team_name',
  'contrato': 'contract_end',
  'agente': 'agency',
  // Inglés (playmakerstats, ambos diseños)
  'born/age': 'date_of_birth',
  'date of birth': 'date_of_birth',
  'nationality': 'nationality',
  'position': 'position_player',
  'preferred foot': 'foot',
  'foot': 'foot',
  'height': 'height',
  'height / weight': 'height',
  'current club': 'team_name',
  'contract': 'contract_end',
  'agent': 'agency',
}

function assignField(
  data: Record<string, unknown>,
  field: string,
  value: string,
  secondValue?: string
): void {
  if (!value) return

  switch (field) {
    case 'date_of_birth': {
      const parsed = parseDateString(value)
      if (parsed) data.date_of_birth = parsed
      break
    }
    case 'nationality': {
      data.nationality_1 = value
      if (secondValue && secondValue !== value) data.nationality_2 = secondValue
      break
    }
    case 'position_player':
      data.position_player = value
      break
    case 'foot':
      data.foot = value
      break
    case 'height': {
      const cmMatch = value.match(/(\d{2,3})\s*cm/)
      if (cmMatch?.[1]) data.height = parseInt(cmMatch[1])
      break
    }
    case 'team_name':
      data.team_name = value
      break
    case 'contract_end': {
      const parsed = parseContractYearMonth(value) ?? parseDateString(value)
      if (parsed) data.contract_end = parsed
      break
    }
    case 'agency':
      data.agency = value
      break
  }
}

/**
 * 📊 Parsear el diseño nuevo (.card-data.bio con card-data__row)
 */
function parseCardDataLayout($: cheerio.CheerioAPI, data: Record<string, unknown>): void {
  $('.card-data.bio .card-data__row').each((_i, el) => {
    const $el = $(el)
    const label = $el.find('.card-data__label').first().text().trim().toLowerCase()
    const field = LABEL_FIELDS[label]
    if (!field) return

    // Valores con logo (nacionalidad, club, agente) → <div class="text">
    const texts = $el.find('.text').map((_j, t) => $(t).text().trim()).get().filter(Boolean)
    // Valores planos → <span class="card-data__value">
    const values = $el.find('.card-data__value')
      .map((_j, v) => $(v).clone().children().remove().end().text().trim())
      .get()
      .filter(Boolean)

    const value = texts[0] ?? values[0] ?? ''
    const second = texts[1] ?? undefined
    assignField(data, field, value, second)
  })
}

/**
 * 📊 Parsear el diseño legacy (#entity_bio con .bio/.bio_half)
 */
function parseEntityBioLayout($: cheerio.CheerioAPI, data: Record<string, unknown>): void {
  $('#entity_bio .bio, #entity_bio .bio_half').each((_i, el) => {
    const $el = $(el)
    const label = $el.find('span').first().text().trim().toLowerCase()
    const field = LABEL_FIELDS[label]
    if (!field) return

    // Ojo: un mismo div puede contener varios pares label/valor
    // (ej. "Born/Age" + "Country of Birth"). Para campos inline, el valor es
    // el primer nodo de texto inmediatamente después del span del label.
    let inlineValue = ''
    let seenLabel = false
    for (const node of $el.contents().toArray()) {
      if (!seenLabel) {
        if (node.type === 'tag' && node.name === 'span') seenLabel = true
        continue
      }
      if (node.type === 'text') {
        const text = $(node).text().trim()
        if (text) {
          inlineValue = text
          break
        }
      } else {
        break
      }
    }

    const nestedTexts = $el.find('.text').map((_j, t) => $(t).text().trim()).get().filter(Boolean)
    const $clone = $el.clone()
    $clone.find('span').remove()
    const plainText = $clone.text().trim()

    // Campos con logo (nacionalidad, club) usan .text; el resto, texto inline
    const value = (field === 'nationality' || field === 'team_name')
      ? (nestedTexts[0] ?? '')
      : (inlineValue || plainText)
    const second = nestedTexts[1] ?? undefined
    assignField(data, field, value, second)
  })
}

/**
 * 📊 Parsear el HTML de un perfil de jugador de cualquier espejo zerozero
 *
 * Devuelve campos con los mismos nombres que el scraper de Transfermarkt
 * para poder aplicar las mismas reglas de actualización.
 */
export function parsePlaymakerPlayerHtml(html: string): Record<string, unknown> {
  const $ = cheerio.load(html)
  const data: Record<string, unknown> = {}

  parseCardDataLayout($, data)
  if (Object.keys(data).length === 0) {
    parseEntityBioLayout($, data)
  }

  return data
}

/**
 * 🔍 Buscar un jugador por nombre en un espejo y devolver la URL de su perfil
 */
export async function searchPlaymakerPlayer(
  playerName: string,
  mirror?: ZerozeroMirror
): Promise<string | null> {
  const activeMirror = mirror ?? MIRRORS[0]!
  const searchUrl = `${activeMirror.baseUrl}/pesquisa?search_txt=${encodeURIComponent(playerName.trim())}`
  const html = await fetchMirrorHtml(searchUrl, activeMirror.baseUrl + '/')
  return extractFirstPlayerLink(html, activeMirror)
}

/**
 * 🛟 Scrapear un jugador desde la red zerozero por nombre
 *
 * Recorre los espejos en orden: si uno está bloqueado por Cloudflare o
 * inaccesible, prueba el siguiente. Lanza PlaymakerUnavailableError si
 * ninguno responde, o Error si el jugador no aparece en la base de datos.
 */
export async function scrapePlayerFromPlaymaker(playerName: string): Promise<Record<string, unknown>> {
  let lastAvailabilityError: Error | null = null

  for (const mirror of MIRRORS) {
    let profileUrl: string | null
    try {
      profileUrl = await searchPlaymakerPlayer(playerName, mirror)
    } catch (error) {
      // Espejo caído/bloqueado → probar el siguiente
      lastAvailabilityError = error instanceof Error ? error : new Error(String(error))
      continue
    }

    if (!profileUrl) {
      // La base de datos es la misma en todos los espejos: si la búsqueda
      // respondió y no hay resultados, no tiene sentido probar otro espejo
      throw new Error(`ZeroZero: sin resultados para "${playerName}"`)
    }

    const html = await fetchMirrorHtml(profileUrl, mirror.baseUrl + '/')
    const data = parsePlaymakerPlayerHtml(html)

    if (Object.keys(data).length === 0) {
      throw new Error(`ZeroZero: el perfil de "${playerName}" no devolvió ningún campo`)
    }

    return data
  }

  throw lastAvailabilityError ?? new PlaymakerUnavailableError('Ningún espejo de ZeroZero disponible')
}
