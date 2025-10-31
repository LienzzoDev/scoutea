/**
 * 🕷️ MÓDULO DE SCRAPING COMPARTIDO
 *
 * Funciones de scraping reutilizables para jugadores y equipos
 */

import { getRealisticHeaders } from './user-agents'

// Configuración de scraping
const SCRAPING_CONFIG = {
  REQUEST_TIMEOUT: 30000, // 30 segundos
}

/**
 * Parsear fecha en formato DD/MM/YYYY o similar
 */
function parseDateString(dateStr: string): Date | null {
  try {
    // Formato: "31 ene. 1995" o "31/01/1995"
    const cleanStr = dateStr.trim()

    // Si viene en formato DD/MM/YYYY
    if (cleanStr.includes('/')) {
      const [day, month, year] = cleanStr.split('/')
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
      return isNaN(date.getTime()) ? null : date
    }

    // Si viene en formato "31 ene. 1995"
    const months: Record<string, number> = {
      'ene': 0, 'feb': 1, 'mar': 2, 'abr': 3, 'may': 4, 'jun': 5,
      'jul': 6, 'ago': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dic': 11
    }

    const parts = cleanStr.split(' ')
    if (parts.length >= 3) {
      const day = parseInt(parts[0])
      const monthStr = parts[1].toLowerCase().replace('.', '').substring(0, 3)
      const year = parseInt(parts[2])

      if (months[monthStr] !== undefined) {
        const date = new Date(year, months[monthStr], day)
        return isNaN(date.getTime()) ? null : date
      }
    }

    return null
  } catch {
    return null
  }
}

/**
 * Scrapear datos de un jugador desde Transfermarkt
 */
export async function scrapePlayerData(url: string): Promise<Record<string, any>> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), SCRAPING_CONFIG.REQUEST_TIMEOUT)

  try {
    const response = await fetch(url, {
      headers: getRealisticHeaders('https://www.transfermarkt.es/'),
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`HTTP Error ${response.status}: ${response.statusText}`)
    }

    const html = await response.text()

    // Extraer datos usando regex
    const data: Record<string, any> = {}

    // 1. URL del advisor
    const advisorMatch = html.match(/<a href="(\/berater\/[^"]+)"/)
    if (advisorMatch) {
      data.url_trfm_advisor = `https://www.transfermarkt.es${advisorMatch[1]}`
    }

    // 2. Fecha de nacimiento
    const birthDateMatch = html.match(/<span itemprop="birthDate">([^<]+)<\/span>/)
    if (birthDateMatch) {
      const parsedDate = parseDateString(birthDateMatch[1].trim())
      if (parsedDate) {
        data.date_of_birth = parsedDate
      }
    }

    // 3. Equipo actual
    const teamMatch = html.match(/<span class="[^"]*hauptverein[^"]*"[^>]*>([^<]+)<\/span>/)
    if (teamMatch) {
      data.team_name = teamMatch[1].trim()
    }

    // 4. Posición
    const positionMatch = html.match(/<span class="[^"]*position[^"]*"[^>]*>([^<]+)<\/span>/)
    if (positionMatch) {
      data.position_player = positionMatch[1].trim()
    }

    // 5. Pie
    const footMatch = html.match(/Pie:<\/span>\s*<span[^>]*>([^<]+)<\/span>/)
    if (footMatch) {
      data.foot = footMatch[1].trim()
    }

    // 6. Altura (formato "1,85 m" → convertir a 185)
    const heightMatch = html.match(/Altura:<\/span>\s*<span[^>]*>([0-9,]+)\s*m<\/span>/)
    if (heightMatch) {
      const heightStr = heightMatch[1].replace(',', '.')
      const heightM = parseFloat(heightStr)
      if (!isNaN(heightM)) {
        data.height = Math.round(heightM * 100) // Convertir a cm
      }
    }

    // 7. Nacionalidad 1
    const nat1Match = html.match(/Nacionalidad:<\/span>[\s\S]*?title="([^"]+)"/)
    if (nat1Match) {
      data.nationality_1 = nat1Match[1].trim()
    }

    // 8. Nacionalidad 2
    const nat2Match = html.match(/Nacionalidad:<\/span>[\s\S]*?title="[^"]+"[\s\S]*?title="([^"]+)"/)
    if (nat2Match) {
      data.nationality_2 = nat2Match[1].trim()
    }

    // 9. Agencia
    const agencyMatch = html.match(/Agente:<\/span>[\s\S]*?<a[^>]*>([^<]+)<\/a>/)
    if (agencyMatch) {
      data.agency = agencyMatch[1].trim()
    }

    // 10. Fin de contrato
    const contractMatch = html.match(/Contrato hasta:<\/span>\s*<span[^>]*>([^<]+)<\/span>/)
    if (contractMatch) {
      const contractStr = contractMatch[1].trim()
      const parsedDate = parseDateString(contractStr)
      if (parsedDate) {
        data.contract_end = parsedDate
      }
    }

    // 11. Valor de mercado
    const valueMatch = html.match(/Valor de mercado:<\/span>\s*<[^>]*>([^<]+)<\//)
    if (valueMatch) {
      data.player_trfm_value = valueMatch[1].trim()
    }

    return data
  } catch (error) {
    clearTimeout(timeoutId)
    throw error
  }
}

/**
 * Scrapear datos de un equipo desde Transfermarkt
 */
export async function scrapeTeamData(url: string): Promise<Record<string, any>> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), SCRAPING_CONFIG.REQUEST_TIMEOUT)

  try {
    const response = await fetch(url, {
      headers: getRealisticHeaders('https://www.transfermarkt.es/'),
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`HTTP Error ${response.status}: ${response.statusText}`)
    }

    const html = await response.text()

    const data: Record<string, any> = {}

    // 1. Nombre del equipo
    const teamNameMatch = html.match(/<h1[^>]*itemprop="name"[^>]*>([^<]+)<\/h1>/)
    if (teamNameMatch) {
      data.team_name = teamNameMatch[1].trim()
    }

    // 2. País
    const countryMatch = html.match(/País:<\/span>[\s\S]*?title="([^"]+)"/)
    if (countryMatch) {
      data.team_country = countryMatch[1].trim()
    }

    // 3. Liga/Competición
    const competitionMatch = html.match(/Liga:<\/span>[\s\S]*?<a[^>]*>([^<]+)<\/a>/)
    if (competitionMatch) {
      data.competition = competitionMatch[1].trim()
    }

    // 4. Valor de mercado del equipo
    const teamValueMatch = html.match(/Valor de mercado total:<\/span>\s*<[^>]*>([^<]+)<\//)
    if (teamValueMatch) {
      data.team_trfm_value = teamValueMatch[1].trim()
    }

    return data
  } catch (error) {
    clearTimeout(timeoutId)
    throw error
  }
}
