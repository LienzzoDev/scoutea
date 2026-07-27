/**
 * 🕷️ MÓDULO DE SCRAPING COMPARTIDO
 *
 * Única implementación del scraping de jugadores/equipos de Transfermarkt,
 * con fallback a PlaymakerStats cuando Transfermarkt falla.
 *
 * Los parsers son funciones puras (reciben HTML) para poder testearlas
 * con fixtures reales sin red.
 */

import * as cheerio from 'cheerio'

import { scrapePlayerFromPlaymaker } from './playmaker'
import { getRealisticHeaders } from './user-agents'

const SCRAPING_CONFIG = {
  REQUEST_TIMEOUT: 30000, // 30 segundos
}

/** Error HTTP con status accesible (para distinguir 404 de errores temporales) */
export class ScrapingHttpError extends Error {
  readonly status: number

  constructor(status: number, statusText: string) {
    super(`HTTP Error ${status}: ${statusText}`)
    this.name = 'ScrapingHttpError'
    this.status = status
  }
}

export interface PlayerScrapeResult {
  data: Record<string, unknown>
  /** De dónde salieron los datos */
  source: 'transfermarkt' | 'playmakerstats'
  /** true si se usó el fallback de PlaymakerStats */
  fallbackUsed: boolean
  /** Error de Transfermarkt si lo hubo (aunque el fallback funcionara) */
  transfermarktError?: string
}

/**
 * 🌐 Fetch con timeout y headers realistas
 */
async function fetchHtml(url: string, referer: string): Promise<string> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), SCRAPING_CONFIG.REQUEST_TIMEOUT)

  try {
    const response = await fetch(url, {
      headers: getRealisticHeaders(referer),
      signal: controller.signal,
    })

    if (!response.ok) {
      throw new ScrapingHttpError(response.status, response.statusText)
    }

    return await response.text()
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Timeout después de ${SCRAPING_CONFIG.REQUEST_TIMEOUT / 1000}s`)
    }
    throw error
  } finally {
    clearTimeout(timeoutId)
  }
}

/**
 * 💰 Parsear texto de valor de mercado de Transfermarkt a número (euros)
 *
 * Soporta ambos formatos:
 * - Español: "220,00 mill. €", "800 mil €", "1,5 mill. €"
 * - Inglés:  "€220.00m", "€800k", "€1.5m", "€1.10bn"
 */
export function parseMarketValue(text: string): number | null {
  const clean = text.replace(/\s+/g, ' ').trim()
  const match = clean.match(/€?\s*([0-9][0-9.,]*)\s*(mill?\.?|mil\b|bn|m\b|k\b)?/i)
  if (!match?.[1]) return null

  let numStr = match[1]
  // Normalizar separadores: si hay coma, es decimal español (los puntos son miles)
  if (numStr.includes(',')) {
    numStr = numStr.replace(/\./g, '').replace(',', '.')
  } else if (numStr.includes('.')) {
    // Solo puntos: "1.500.000" (miles) vs "220.00" (decimal)
    const dotCount = (numStr.match(/\./g) || []).length
    const afterLastDot = numStr.split('.').pop()
    if (dotCount > 1 || afterLastDot?.length === 3) {
      numStr = numStr.replace(/\./g, '')
    }
  }

  const value = parseFloat(numStr)
  if (isNaN(value)) return null

  const unit = (match[2] || '').toLowerCase()
  let multiplier = 1
  if (unit.startsWith('bn')) multiplier = 1_000_000_000
  else if (unit.startsWith('mill') || unit === 'm') multiplier = 1_000_000
  else if (unit === 'mil' || unit === 'k') multiplier = 1_000

  return value * multiplier
}

/**
 * 📅 Parsear fecha en formatos de Transfermarkt (ES y EN)
 *
 * - "13/07/2007" (dominio .es)
 * - "Jul 13, 2007" (dominio .com / .co.uk)
 * - "13 de julio de 2007"
 */
export function parseDateString(dateStr: string): Date | null {
  try {
    const clean = dateStr.trim()

    // DD/MM/YYYY
    const slashMatch = clean.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/)
    if (slashMatch?.[1] && slashMatch[2] && slashMatch[3]) {
      const date = new Date(
        parseInt(slashMatch[3]),
        parseInt(slashMatch[2]) - 1,
        parseInt(slashMatch[1])
      )
      return isNaN(date.getTime()) ? null : date
    }

    // Inglés: "Jul 13, 2007" o "July 13, 2007"
    const englishMonths: Record<string, number> = {
      jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
      jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
    }
    const enMatch = clean.match(/([A-Za-z]{3,})\s+(\d{1,2}),\s*(\d{4})/)
    if (enMatch?.[1] && enMatch[2] && enMatch[3]) {
      const monthIndex = englishMonths[enMatch[1].toLowerCase().substring(0, 3)]
      if (monthIndex !== undefined) {
        return new Date(parseInt(enMatch[3]), monthIndex, parseInt(enMatch[2]))
      }
    }

    // Español: "13 de julio de 2007"
    const spanishMonths: Record<string, number> = {
      enero: 0, febrero: 1, marzo: 2, abril: 3, mayo: 4, junio: 5,
      julio: 6, agosto: 7, septiembre: 8, octubre: 9, noviembre: 10, diciembre: 11,
    }
    const esMatch = clean.match(/(\d{1,2})\s+de\s+(\w+)\s+de\s+(\d{4})/)
    if (esMatch?.[1] && esMatch[2] && esMatch[3]) {
      const monthIndex = spanishMonths[esMatch[2].toLowerCase()]
      if (monthIndex !== undefined) {
        return new Date(parseInt(esMatch[3]), monthIndex, parseInt(esMatch[1]))
      }
    }

    // ISO: "2007-07-13"
    const isoMatch = clean.match(/(\d{4})-(\d{2})-(\d{2})/)
    if (isoMatch?.[1] && isoMatch[2] && isoMatch[3]) {
      return new Date(parseInt(isoMatch[1]), parseInt(isoMatch[2]) - 1, parseInt(isoMatch[3]))
    }

    return null
  } catch {
    return null
  }
}

/** Alias semántico: las fechas de contrato usan los mismos formatos */
export const parseContractDate = parseDateString

/**
 * 📊 Parsear el HTML de un perfil de jugador de Transfermarkt
 *
 * Los labels dependen del idioma del dominio (.es → español, .com → inglés),
 * así que cada regex acepta ambas variantes.
 */
export function parsePlayerHtml(html: string, sourceUrl?: string): Record<string, unknown> {
  const data: Record<string, unknown> = {}
  const origin = getOrigin(sourceUrl) ?? 'https://www.transfermarkt.es'

  // 1. Fecha de nacimiento — itemprop="birthDate" (formato depende del idioma)
  const birthDateMatch = html.match(/itemprop="birthDate"[^>]*>\s*([^<]{4,40}?)\s*(?:\(|<)/)
  if (birthDateMatch?.[1]) {
    const parsedDate = parseDateString(birthDateMatch[1])
    if (parsedDate) {
      data.date_of_birth = parsedDate
    }
  }

  // 2. Equipo actual — link del club en el data-header
  const teamMatch = html.match(
    /data-header__club-info[\s\S]*?<a[^>]*title="([^"]+)"[^>]*href="[^"]*\/startseite\/verein/
  ) || html.match(
    /(?:Club actual|Current club):\s*<\/span>[\s\S]{0,600}?<a[^>]*title="([^"]+)"[^>]*href="[^"]*\/startseite\/verein/
  )
  if (teamMatch?.[1]) {
    data.team_name = teamMatch[1].trim()
  }

  // 3. Equipo de cesión
  const loanMatch = html.match(/(?:cedido de|on loan from)[^>]*>([^<]+)</i)
  if (loanMatch?.[1]) {
    data.team_loan_from = loanMatch[1].trim()
  }

  // 4. Posición — preferir el data-header (sin prefijo genérico), fallback a info-table
  const positionMatch = html.match(
    /data-header__label">\s*(?:Posición|Position):\s*<span class="data-header__content">\s*([^<]+?)\s*<\/span>/
  ) || html.match(
    /(?:Posición|Position):\s*<\/span>\s*<span[^>]*info-table__content--bold[^>]*>\s*([^<]+?)\s*<\/span>/
  )
  if (positionMatch?.[1]) {
    data.position_player = positionMatch[1].trim()
  }

  // 5. Pie dominante — info-table
  const footMatch = html.match(
    /(?:Pie|Foot):\s*<\/span>\s*<span[^>]*info-table__content--bold[^>]*>\s*([^<]+?)\s*<\/span>/
  )
  if (footMatch?.[1]) {
    data.foot = footMatch[1].trim()
  }

  // 6. Altura — itemprop="height" ("1,83 m" o "1.83 m")
  const heightMatch = html.match(/itemprop="height"[^>]*>\s*([0-9][0-9.,]*)\s*m/)
  if (heightMatch?.[1]) {
    const heightInMeters = parseFloat(heightMatch[1].replace(',', '.'))
    if (!isNaN(heightInMeters)) {
      data.height = Math.round(heightInMeters * 100)
    }
  }

  // 7-8. Nacionalidades — banderas dentro del bloque "Nacionalidad:"/"Citizenship:" del info-table
  const natBlockMatch = html.match(
    /(?:Nacionalidad|Citizenship):\s*<\/span>\s*<span[^>]*info-table__content--bold[^>]*>([\s\S]*?)<\/span>/
  )
  if (natBlockMatch?.[1]) {
    const flags = Array.from(natBlockMatch[1].matchAll(/<img[^>]+title="([^"]+)"/g))
      .map(m => m[1]?.trim())
      .filter((n): n is string => Boolean(n))
    if (flags[0]) data.nationality_1 = flags[0]
    if (flags[1]) data.nationality_2 = flags[1]
  }

  // 9. Selección nacional — data-header "Selección:" (ES) / "Current international:" (EN)
  const nationalTeamMatch = html.match(
    /(?:Selección|Current international):\s*<span[^>]*class="data-header__content"[^>]*>[\s\S]{0,400}?<a[^>]*>([^<]+)<\/a>/
  )
  if (nationalTeamMatch?.[1]) {
    data.national_tier = nationalTeamMatch[1].trim()
  }

  // 10-12. Agencia — bloque "Agente:"/"Player agent:" del info-table
  // El nombre del agente se guarda en `agency` (Jugador no tiene columna `advisor`;
  // sólo `agency` + `url_trfm_advisor`).
  const agentBlockMatch = html.match(
    /(?:Agente|Player agent):\s*<\/span>\s*<span[^>]*info-table__content--bold[^>]*>([\s\S]*?)<\/span>/
  )
  if (agentBlockMatch?.[1]) {
    const linkMatch = agentBlockMatch[1].match(/<a[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>/)
    if (linkMatch?.[2]) {
      const agentName = linkMatch[2].trim()
      data.agency = agentName
      if (linkMatch[1] && linkMatch[1].includes('berater')) {
        data.url_trfm_advisor = linkMatch[1].startsWith('http')
          ? linkMatch[1]
          : `${origin}${linkMatch[1]}`
      }
    } else {
      // Agente sin link (ej. "Relatives")
      const plainText = agentBlockMatch[1].replace(/<[^>]*>/g, '').trim()
      if (plainText) {
        data.agency = plainText
      }
    }
  }

  // 13. Fin de contrato — "Contrato hasta:"/"Contract expires:" del info-table
  const contractMatch = html.match(
    /(?:Contrato hasta|Contract expires):\s*<\/span>\s*<span[^>]*>([^<]+)<\/span>/
  )
  if (contractMatch?.[1]) {
    const parsedDate = parseContractDate(contractMatch[1].trim())
    if (parsedDate) {
      data.contract_end = parsedDate
    }
  }

  // 14. Valor de mercado — header ("220,00 mill. €" / "€220.00m")
  const valueMatch = html.match(
    /data-header__market-value-wrapper[^>]*>([\s\S]*?)<(?:p|\/a)/
  )
  if (valueMatch?.[1]) {
    const valueText = valueMatch[1].replace(/<[^>]*>/g, ' ')
    const value = parseMarketValue(valueText)
    if (value !== null && value > 0) {
      data.player_trfm_value = value
    }
  }

  return data
}

/**
 * 🕷️ Scrapear un jugador desde Transfermarkt (solo Transfermarkt, sin fallback)
 */
export async function scrapePlayerData(url: string): Promise<Record<string, unknown>> {
  const html = await fetchHtml(url, 'https://www.transfermarkt.es/')
  return parsePlayerHtml(html, url)
}

/**
 * 🛟 Scrapear un jugador con fallback a PlaymakerStats
 *
 * 1. Intenta Transfermarkt con la URL del jugador.
 * 2. Si falla (HTTP error, timeout) o no devuelve ningún campo,
 *    busca al jugador por nombre en PlaymakerStats y extrae lo que haya.
 */
export async function scrapePlayerWithFallback(params: {
  url: string
  playerName?: string | null
}): Promise<PlayerScrapeResult> {
  let transfermarktError: string | undefined

  try {
    const data = await scrapePlayerData(params.url)
    if (Object.keys(data).length > 0) {
      return { data, source: 'transfermarkt', fallbackUsed: false }
    }
    transfermarktError = 'Transfermarkt no devolvió ningún campo reconocible'
  } catch (error) {
    // Un 429 es temporal: debe propagarse para que el rate limiter haga
    // backoff/pausa en vez de camuflarse con el fallback.
    if (error instanceof ScrapingHttpError && error.status === 429) {
      throw error
    }
    transfermarktError = error instanceof Error ? error.message : 'Error desconocido'
  }

  // Fallback: PlaymakerStats por nombre
  if (params.playerName && params.playerName.trim() !== '') {
    try {
      const fallbackData = await scrapePlayerFromPlaymaker(params.playerName)
      return {
        data: fallbackData,
        source: 'playmakerstats',
        fallbackUsed: true,
        transfermarktError,
      }
    } catch (fallbackError) {
      const fallbackMsg = fallbackError instanceof Error ? fallbackError.message : 'Error desconocido'
      // Conservar el mensaje original de TM (incluye el status HTTP, que el
      // caller usa para clasificar la alerta y evitar reintentos de 404)
      throw new Error(`${transfermarktError} | Fallback PlaymakerStats: ${fallbackMsg}`)
    }
  }

  throw new Error(transfermarktError ?? 'Error desconocido durante el scraping')
}

/**
 * 📊 Parsear el HTML de un perfil de equipo de Transfermarkt
 */
export function parseTeamHtml(html: string): Record<string, unknown> {
  const $ = cheerio.load(html)
  const data: Record<string, unknown> = {}

  // 1. Nombre del equipo
  const teamName = $('h1.data-header__headline-wrapper').first().text().trim()
    || $('h1[itemprop="name"]').first().text().trim()
  if (teamName) {
    data.team_name = teamName
  }

  // 2. País del equipo
  const country = $('span.data-header__club span[class*="flag"]').first().attr('title')?.trim()
    || $('.data-header__club-info img.flaggenrahmen').first().attr('title')?.trim()
  if (country) {
    data.team_country = country
  }

  // 3. Competición
  const competition = $('span.data-header__club a').first().text().trim()
    || $('span.data-header__club span.data-header__content').first().text().trim()
  if (competition) {
    data.competition = competition
  }

  // 4. Valor de mercado del equipo
  const valueText = $('a.data-header__market-value-wrapper').first().text().trim()
  if (valueText) {
    const value = parseMarketValue(valueText)
    if (value !== null && value > 0) {
      data.team_trfm_value = value
    }
  }

  return data
}

/**
 * 🕷️ Scrapear datos de un equipo desde Transfermarkt
 */
export async function scrapeTeamData(url: string): Promise<Record<string, unknown>> {
  const html = await fetchHtml(url, 'https://www.transfermarkt.es/')
  return parseTeamHtml(html)
}

function getOrigin(url?: string): string | null {
  if (!url) return null
  try {
    return new URL(url).origin
  } catch {
    return null
  }
}
