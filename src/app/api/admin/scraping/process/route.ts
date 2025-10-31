/**
 * ⚙️ ENDPOINT PARA PROCESAR UN BATCH DE SCRAPING (MEJORADO ANTI-DDOS)
 *
 * ✅ PROPÓSITO: Procesar un lote pequeño de jugadores con protección anti-DDoS
 * ✅ BENEFICIO: Evita detección como ataque mediante pausas aleatorias, rotación de UA y manejo de rate limits
 * ✅ RUTA: POST /api/admin/scraping/process
 */

import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

import { prisma } from '@/lib/db'
import { RateLimiter, AdaptiveThrottler } from '@/lib/scraping/rate-limiter'
import { getRealisticHeaders, randomSleep } from '@/lib/scraping/user-agents'
import { isDefaultTransfermarktImage } from '@/lib/utils/image-utils'
import { addJobLog } from '@/app/api/admin/scraping/logs/route'

// ⏱️ Configuración: 5 minutos máximo (Vercel límite)
export const maxDuration = 300

interface ScrapingResult {
  playerId: string
  playerName: string
  url: string
  success: boolean
  fieldsUpdated: string[]
  error?: string
  retries?: number
}

// 🎛️ CONFIGURACIÓN DE SCRAPING (optimizada para velocidad)
const SCRAPING_CONFIG = {
  MIN_DELAY_BETWEEN_PLAYERS: 2000,  // 2 segundos mínimo
  MAX_DELAY_BETWEEN_PLAYERS: 5000,  // 5 segundos máximo
  REQUEST_TIMEOUT: 30000,            // 30 segundos timeout
  MAX_RETRIES_PER_PLAYER: 3,
}

/**
 * 🚨 REGISTRAR ALERTA DE URL NO FUNCIONANDO
 */
async function registerScrapingAlert(params: {
  entityType: 'player' | 'team'
  entityId: string
  entityName: string | null
  url: string
  errorType: string
  errorMessage?: string
  httpStatus?: number
}) {
  try {
    // Buscar si ya existe una alerta para esta entidad
    const existing = await prisma.scrapingAlert.findFirst({
      where: {
        entityType: params.entityType,
        entityId: params.entityId,
        status: 'pending'
      }
    })

    if (existing) {
      // Actualizar contador y última vez vista
      await prisma.scrapingAlert.update({
        where: { id: existing.id },
        data: {
          lastSeenAt: new Date(),
          seenCount: { increment: 1 },
          errorType: params.errorType,
          errorMessage: params.errorMessage,
          httpStatus: params.httpStatus
        }
      })
    } else {
      // Crear nueva alerta
      await prisma.scrapingAlert.create({
        data: {
          entityType: params.entityType,
          entityId: params.entityId,
          entityName: params.entityName,
          url: params.url,
          errorType: params.errorType,
          errorMessage: params.errorMessage,
          httpStatus: params.httpStatus
        }
      })
    }
  } catch (error) {
    console.error('Error registrando alerta de scraping:', error)
    // No lanzar error para no interrumpir el scraping
  }
}

/**
 * 📅 VALIDAR SI DEBE ACTUALIZARSE LA FECHA DE NACIMIENTO
 *
 * Reglas:
 * 1. Si la celda está en blanco → escribir la info del scraping
 * 2. Si la celda tiene fecha diferente a 01/01 → NO escribir si scraping es 01/01
 * 3. Si la celda tiene fecha igual a 01/01 → escribir si scraping es diferente a 01/01
 */
function shouldUpdateDateOfBirth(
  existingDate: Date | null,
  scrapedDate: Date | null
): boolean {
  // 1. Si no hay fecha existente, siempre actualizar
  if (!existingDate) {
    return true
  }

  // Si no hay fecha scrapeada, no actualizar
  if (!scrapedDate) {
    return false
  }

  // Verificar si es fecha genérica 01/01
  const isExistingGeneric = existingDate.getMonth() === 0 && existingDate.getDate() === 1
  const isScrapedGeneric = scrapedDate.getMonth() === 0 && scrapedDate.getDate() === 1

  // 2. Si fecha existente NO es genérica y scraping SÍ es genérica → NO actualizar
  if (!isExistingGeneric && isScrapedGeneric) {
    return false
  }

  // 3. Si fecha existente ES genérica y scraping NO es genérica → SÍ actualizar
  if (isExistingGeneric && !isScrapedGeneric) {
    return true
  }

  // En cualquier otro caso, actualizar si son diferentes
  return existingDate.getTime() !== scrapedDate.getTime()
}

/**
 * 🏟️ MAPEO DE EQUIPOS DUPLICADOS CON SUS PAÍSES
 *
 * Para resolver ambigüedades cuando hay múltiples equipos con el mismo nombre
 * Basado en los datos reales de la base de datos
 */
const DUPLICATE_TEAM_MAPPINGS: Record<string, Record<string, string>> = {
  // Arsenal: Inglaterra vs Argentina
  'Arsenal': {
    'England': 'Arsenal FC',
    'Argentina': 'Arsenal Fútbol Club'
  },
  'Arsenal FC': {
    'England': 'Arsenal FC',
    'Argentina': 'Arsenal Fútbol Club'
  },

  // Independiente: Argentina (principal) vs otros países
  'Independiente': {
    'Argentina': 'CA Independiente',
    'Ecuador': 'Independiente del Valle',
    'Colombia': 'Independiente Medellín'
  },
  'CA Independiente': {
    'Argentina': 'CA Independiente'
  },
  'Independiente del Valle': {
    'Ecuador': 'Independiente del Valle'
  },
  'Independiente Medellín': {
    'Colombia': 'Independiente Medellín'
  },

  // Universidad Católica: Chile (principal) vs Ecuador
  'Universidad Católica': {
    'Chile': 'CD Universidad Católica',
    'Ecuador': 'Universidad Católica (Ecuador)'
  },
  'CD Universidad Católica': {
    'Chile': 'CD Universidad Católica'
  }
}

/**
 * 🏟️ VALIDAR SI DEBE ACTUALIZARSE EL NOMBRE DEL EQUIPO
 *
 * Reglas:
 * 1. Si la celda está en blanco → escribir la info del scraping
 * 2. Si la celda contiene info diferente a valores "desconocidos" → NO escribir si scraping es "desconocido"
 * 3. Si la celda contiene valor "desconocido" → escribir si scraping es diferente a "desconocido"
 * 4. Para equipos duplicados (Arsenal, Independiente, Universidad Católica) → usar el país para decidir el nombre correcto
 */
function shouldUpdateTeamName(
  existingTeamName: string | null,
  scrapedTeamName: string | null,
  teamCountry: string | null
): { shouldUpdate: boolean; finalTeamName: string | null } {
  // Valores "desconocidos" que no queremos que sobrescriban info real
  const unknownValues = ['Unknown', 'None', 'Unk', 'unknown club', 'Sin club', 'Without Club']

  const isUnknownValue = (value: string | null): boolean => {
    if (!value) return false
    return unknownValues.some(unknown =>
      value.toLowerCase().includes(unknown.toLowerCase())
    )
  }

  // 1. Si no hay equipo existente, siempre actualizar
  if (!existingTeamName || existingTeamName.trim() === '') {
    // Si el scraped es un equipo duplicado, resolver con el país
    if (scrapedTeamName && teamCountry) {
      const resolvedName = resolveTeamNameByCountry(scrapedTeamName, teamCountry)
      return { shouldUpdate: true, finalTeamName: resolvedName }
    }
    return { shouldUpdate: true, finalTeamName: scrapedTeamName }
  }

  // Si no hay equipo scrapeado, no actualizar
  if (!scrapedTeamName) {
    return { shouldUpdate: false, finalTeamName: null }
  }

  // 2. Si equipo existente NO es "desconocido" y scraping SÍ es "desconocido" → NO actualizar
  if (!isUnknownValue(existingTeamName) && isUnknownValue(scrapedTeamName)) {
    return { shouldUpdate: false, finalTeamName: null }
  }

  // 3. Si equipo existente ES "desconocido" y scraping NO es "desconocido" → SÍ actualizar
  if (isUnknownValue(existingTeamName) && !isUnknownValue(scrapedTeamName)) {
    // Si el scraped es un equipo duplicado, resolver con el país
    if (teamCountry) {
      const resolvedName = resolveTeamNameByCountry(scrapedTeamName, teamCountry)
      return { shouldUpdate: true, finalTeamName: resolvedName }
    }
    return { shouldUpdate: true, finalTeamName: scrapedTeamName }
  }

  // 4. Para equipos duplicados, verificar si necesitamos actualizar basado en el país
  if (teamCountry) {
    const resolvedName = resolveTeamNameByCountry(scrapedTeamName, teamCountry)

    // Si el nombre resuelto es diferente al existente, actualizar
    if (resolvedName !== existingTeamName) {
      return { shouldUpdate: true, finalTeamName: resolvedName }
    }
  }

  // En cualquier otro caso, actualizar si son diferentes
  if (existingTeamName !== scrapedTeamName) {
    // Último check: si es equipo duplicado, resolver con país
    if (teamCountry) {
      const resolvedName = resolveTeamNameByCountry(scrapedTeamName, teamCountry)
      return { shouldUpdate: true, finalTeamName: resolvedName }
    }
    return { shouldUpdate: true, finalTeamName: scrapedTeamName }
  }

  return { shouldUpdate: false, finalTeamName: null }
}

/**
 * 🌍 RESOLVER NOMBRE DE EQUIPO BASADO EN EL PAÍS
 *
 * Para equipos con nombres duplicados (Arsenal, Independiente, Universidad Católica),
 * retorna el nombre correcto basado en el país del equipo
 */
function resolveTeamNameByCountry(teamName: string, teamCountry: string): string {
  // Normalizar el nombre del equipo (quitar espacios extra, etc.)
  const normalizedName = teamName.trim()

  // Buscar en el mapeo de duplicados
  const mapping = DUPLICATE_TEAM_MAPPINGS[normalizedName]

  if (mapping) {
    // Si hay mapeo para este país, usarlo
    const resolvedName = mapping[teamCountry]
    if (resolvedName) {
      return resolvedName
    }
  }

  // Si no hay mapeo específico, retornar el nombre original
  return normalizedName
}

/**
 * 🏟️ VALIDAR SI DEBE ACTUALIZARSE EL EQUIPO DE CESIÓN (LOAN FROM)
 *
 * Aplica las mismas reglas que team_name:
 * 1. Si la celda está en blanco → escribir la info del scraping
 * 2. Si la celda contiene info diferente a valores "desconocidos" → NO escribir si scraping es "desconocido"
 * 3. Si la celda contiene valor "desconocido" → escribir si scraping es diferente a "desconocido"
 * 4. Para equipos duplicados (Arsenal, Independiente, Universidad Católica) → usar el país para decidir el nombre correcto
 */
function shouldUpdateLoanTeam(
  existingLoanTeam: string | null,
  scrapedLoanTeam: string | null,
  teamCountry: string | null
): { shouldUpdate: boolean; finalLoanTeam: string | null } {
  // Reutilizar la misma lógica que team_name
  return shouldUpdateTeamName(existingLoanTeam, scrapedLoanTeam, teamCountry)
}

/**
 * ⚽ LIMPIAR Y VALIDAR POSICIÓN DEL JUGADOR
 *
 * Reglas:
 * 1. Eliminar prefijos genéricos: "Defender -", "Midfield -", "Attack -", "Striker -"
 * 2. No sobrescribir si el scraping encuentra un valor en blanco
 * 3. Si la celda está vacía → SÍ sobrescribir incluso si es un valor genérico
 * 4. Si la celda tiene info → NO sobrescribir si scraping es un valor genérico
 */
function shouldUpdatePosition(
  existingPosition: string | null,
  scrapedPosition: string | null
): { shouldUpdate: boolean; finalPosition: string | null } {
  // Si no hay posición scrapeada o está en blanco, no actualizar
  if (!scrapedPosition || scrapedPosition.trim() === '') {
    return { shouldUpdate: false, finalPosition: null }
  }

  // 1. LIMPIAR LA POSICIÓN: Eliminar prefijos genéricos antes del guión
  let cleanedPosition = scrapedPosition.trim()

  // Eliminar "Defender - ", "Midfield - ", "Attack - ", etc.
  const prefixesToRemove = [
    /^Defender\s*-\s*/i,
    /^Midfield\s*-\s*/i,
    /^Midfielder\s*-\s*/i,
    /^Attack\s*-\s*/i,
    /^Striker\s*-\s*/i,
    /^Forward\s*-\s*/i,
    /^Goalkeeper\s*-\s*/i
  ]

  for (const prefix of prefixesToRemove) {
    cleanedPosition = cleanedPosition.replace(prefix, '')
  }

  cleanedPosition = cleanedPosition.trim()

  // 2. DETECTAR SI ES UN VALOR GENÉRICO (solo la categoría, sin posición específica)
  const genericValues = ['Defender', 'Midfield', 'Midfielder', 'Attack', 'Striker', 'Forward', 'Goalkeeper']

  const isGenericValue = (value: string): boolean => {
    if (!value) return false
    const normalized = value.trim()
    return genericValues.some(generic =>
      normalized.toLowerCase() === generic.toLowerCase()
    )
  }

  // 3. SI LA CELDA ESTÁ VACÍA → SÍ actualizar (incluso si es genérico)
  if (!existingPosition || existingPosition.trim() === '') {
    return { shouldUpdate: true, finalPosition: cleanedPosition }
  }

  // 4. SI LA CELDA TIENE INFO y el scraped es GENÉRICO → NO actualizar
  if (isGenericValue(cleanedPosition)) {
    return { shouldUpdate: false, finalPosition: null }
  }

  // 5. En cualquier otro caso, actualizar si son diferentes
  if (existingPosition !== cleanedPosition) {
    return { shouldUpdate: true, finalPosition: cleanedPosition }
  }

  return { shouldUpdate: false, finalPosition: null }
}

/**
 * 🌍 MAPEO DE CORRECCIÓN DE NACIONALIDADES
 *
 * Mapea nombres alternativos/incorrectos a los nombres correctos estándar
 */
const NATIONALITY_CORRECTIONS: Record<string, string> = {
  // Correcciones específicas de Transfermarkt
  'Botsuana': 'Botswana',
  'Hongkong': 'Hong Kong',
  'Curacao': 'Curaçao',
  'Neukaledonien': 'New Caledonia',
  "Cote d'Ivoire": 'Ivory Coast',
  'Timor-Leste': 'East Timor',
  'Federated States of Micronesia': 'Micronesia',
  'St. Kitts & Nevis': 'Saint Kitts & Nevis',
  'St. Lucia': 'Saint Lucia',
  'St. Vincent and Grenadinen': 'Saint Vincent & Grenadines',
  'Southern Sudan': 'South Sudan',
  'Chinese Taipei': 'Taiwan',
  'Macao': 'Macau',
  'Turks- and Caicosinseln': 'Turks & Caicos Islands',
  'Antigua and Barbuda': 'Antigua & Barbuda',
  'Sao Tome and Principe': 'Sao Tome & Principe',
  'Trinidad and Tobago': 'Trinidad & Tobago',
  'Korea, South': 'South Korea'
}

/**
 * 🌍 CORREGIR Y NORMALIZAR NACIONALIDAD
 *
 * Aplica correcciones automáticas a los nombres de nacionalidades
 * basándose en el mapeo NATIONALITY_CORRECTIONS
 */
function correctNationality(nationality: string | null): string | null {
  if (!nationality || nationality.trim() === '') {
    return null
  }

  const trimmedNationality = nationality.trim()

  // Buscar coincidencia exacta (case-sensitive)
  if (NATIONALITY_CORRECTIONS[trimmedNationality]) {
    return NATIONALITY_CORRECTIONS[trimmedNationality]
  }

  // Buscar coincidencia case-insensitive
  const lowerNationality = trimmedNationality.toLowerCase()
  for (const [incorrect, correct] of Object.entries(NATIONALITY_CORRECTIONS)) {
    if (incorrect.toLowerCase() === lowerNationality) {
      return correct
    }
  }

  // Si no hay corrección, retornar el valor original
  return trimmedNationality
}

/**
 * ⚽ MAPEO DE CORRECCIÓN DE CATEGORÍAS INTERNACIONALES (NATIONAL TIER)
 *
 * Mapea nombres alternativos/abreviados de selecciones nacionales a los nombres correctos estándar
 * Incluye selecciones absolutas y categorías juveniles (U15, U16, U17, U18, U19, U20, U21, U23)
 */
const NATIONAL_TIER_CORRECTIONS: Record<string, string> = {
  // Antigua & Barbuda
  'Antigua and B.': 'Antigua & Barbuda',

  // Bosnia-Herzegovina (todas las categorías)
  'Bosnia': 'Bosnia-Herzegovina',
  'Bosnia U15': 'Bosnia-Herzegovina U15',
  'Bosnia U16': 'Bosnia-Herzegovina U16',
  'Bosnia U17': 'Bosnia-Herzegovina U17',
  'Bosnia U18': 'Bosnia-Herzegovina U18',
  'Bosnia U19': 'Bosnia-Herzegovina U19',
  'Bosnia U21': 'Bosnia-Herzegovina U21',

  // Burkina Faso
  'Burkina U17': 'Burkina Faso U17',
  'Burkina U20': 'Burkina Faso U20',

  // Central African Republic
  'C. Africa U20': 'Central African Republic U20',

  // Czech Republic (todas las categorías)
  'Czechia': 'Czech Republic',
  'Czechia U15': 'Czech Republic U15',
  'Czechia U16': 'Czech Republic U16',
  'Czechia U17': 'Czech Republic U17',
  'Czechia U18': 'Czech Republic U18',
  'Czechia U19': 'Czech Republic U19',
  'Czechia U20': 'Czech Republic U20',
  'Czechia U21': 'Czech Republic U21',

  // Dominican Republic
  'Dom. Rep.': 'Dominican Republic',
  'Dominican Rep.': 'Dominican Republic',
  'Dominican U15': 'Dominican Republic U15',
  'Dominican U20': 'Dominican Republic U20',
  'Dominican U23': 'Dominican Republic U23',

  // DR Congo
  'DR Kongo U23': 'DR Congo U23',

  // Equatorial Guinea
  'Equat. Guinea': 'Equatorial Guinea',

  // Faroe Islands
  'Faroe U21': 'Faroe Islands U21',

  // Iceland
  'Island U20': 'Iceland U20',

  // Jamaica
  'Jamaika U22': 'Jamaica U22',

  // Comoros
  'Komoren U23': 'Comoros U23',

  // Liechtenstein
  'Liechtenst. U17': 'Liechtenstein U17',
  'Liechtenst. U21': 'Liechtenstein U21',

  // North Macedonia
  'Macedonia U17': 'North Macedonia U17',
  'Macedonia U18': 'North Macedonia U18',
  'Macedonia U19': 'North Macedonia U19',
  'Macedonia U21': 'North Macedonia U21',

  // Mauritania
  'Mauretanien U20': 'Mauritania U20',

  // Poland
  'Polska U14': 'Poland U14',

  // Zambia
  'Sambia U17': 'Zambia U17',

  // Saint Kitts & Nevis
  'St. Kitts/Nevis': 'Saint Kitts & Nevis',

  // Gambia
  'The Gambia': 'Gambia',
  'The Gambia U20': 'Gambia U20',

  // East Timor
  'Timor-Leste U23': 'East Timor U23',

  // Trinidad & Tobago
  'Trinidad': 'Trinidad & Tobago',
  'Trinidad U20': 'Trinidad & Tobago U20',

  // Turkey (todas las categorías)
  'Türkiye': 'Turkey',
  'Türkiye U14': 'Turkey U14',
  'Türkiye U15': 'Turkey U15',
  'Türkiye U17': 'Turkey U17',
  'Türkiye U18': 'Turkey U18',
  'Türkiye U19': 'Turkey U19',
  'Türkiye U21': 'Turkey U21',
  'Türkiye U23': 'Turkey U23',

  // United Arab Emirates
  'U. A. E.': 'United Arab Emirates',
  'U. A. E. U23': 'United Arab Emirates U23',

  // United States (todas las categorías)
  'USA': 'United States',
  'USA U15': 'United States U15',
  'USA U16': 'United States U16',
  'USA U17': 'United States U17',
  'USA U19': 'United States U19',
  'USA U20': 'United States U20',
  'USA U23': 'United States U23',

  // Venezuela
  'Vnzla U15': 'Venezuela U15'
}

/**
 * ⚽ CORREGIR Y NORMALIZAR CATEGORÍA INTERNACIONAL (NATIONAL TIER)
 *
 * Aplica correcciones automáticas a los nombres de selecciones nacionales
 * basándose en el mapeo NATIONAL_TIER_CORRECTIONS
 */
function correctNationalTier(nationalTier: string | null): string | null {
  if (!nationalTier || nationalTier.trim() === '') {
    return null
  }

  const trimmedTier = nationalTier.trim()

  // Buscar coincidencia exacta (case-sensitive)
  if (NATIONAL_TIER_CORRECTIONS[trimmedTier]) {
    return NATIONAL_TIER_CORRECTIONS[trimmedTier]
  }

  // Buscar coincidencia case-insensitive
  const lowerTier = trimmedTier.toLowerCase()
  for (const [incorrect, correct] of Object.entries(NATIONAL_TIER_CORRECTIONS)) {
    if (incorrect.toLowerCase() === lowerTier) {
      return correct
    }
  }

  // Si no hay corrección, retornar el valor original
  return trimmedTier
}

/**
 * 🤝 LIMPIAR Y VALIDAR AGENCIA (AGENCY)
 *
 * Reglas:
 * 1. No sobrescribir si el scraping detecta valores genéricos:
 *    - "Agent is known - Player under 18"
 *    - "No Agent"
 * 2. Eliminar puntos suspensivos (...) al final del nombre de la agencia
 * 3. Si la celda tiene información manual, no sobrescribir con valores genéricos
 */
function shouldUpdateAgency(
  existingAgency: string | null,
  scrapedAgency: string | null
): { shouldUpdate: boolean; finalAgency: string | null } {
  // Valores genéricos que no deben sobrescribir información existente
  const genericValues = [
    'Agent is known - Player under 18',
    'No Agent',
    'Unknown',
    'N/A',
    '-'
  ]

  const isGenericValue = (value: string | null): boolean => {
    if (!value) return false
    const normalized = value.trim()
    return genericValues.some(generic =>
      normalized.toLowerCase() === generic.toLowerCase()
    )
  }

  // Si no hay valor scrapeado o está en blanco, no actualizar
  if (!scrapedAgency || scrapedAgency.trim() === '') {
    return { shouldUpdate: false, finalAgency: null }
  }

  // Si el valor scrapeado es genérico, no actualizar
  if (isGenericValue(scrapedAgency)) {
    return { shouldUpdate: false, finalAgency: null }
  }

  // Limpiar puntos suspensivos al final
  let cleanedAgency = scrapedAgency.trim()

  // Eliminar "..." al final (puede ser ..., .., o ...)
  cleanedAgency = cleanedAgency.replace(/\.{2,}$/g, '').trim()

  // Si después de limpiar queda vacío, no actualizar
  if (!cleanedAgency || cleanedAgency === '') {
    return { shouldUpdate: false, finalAgency: null }
  }

  // Si no hay agencia existente, actualizar con la limpia
  if (!existingAgency || existingAgency.trim() === '') {
    return { shouldUpdate: true, finalAgency: cleanedAgency }
  }

  // Si son diferentes, actualizar
  if (existingAgency !== cleanedAgency) {
    return { shouldUpdate: true, finalAgency: cleanedAgency }
  }

  return { shouldUpdate: false, finalAgency: null }
}

/**
 * 📏 VALIDAR ALTURA DEL JUGADOR
 *
 * Reglas:
 * 1. No sobrescribir si el valor scrapeado es inválido (null, 0, negativo, muy bajo < 140 cm, muy alto > 220 cm)
 * 2. Si la celda está vacía o es 0 → actualizar con el valor scrapeado (si es válido)
 * 3. Si la celda tiene un valor válido → actualizar solo si el nuevo valor es diferente y válido
 *
 * Nota: La transformación de "1,85 m" → 185 ya se hace en scrapePlayerData()
 */
function shouldUpdateHeight(
  existingHeight: number | null,
  scrapedHeight: number | null
): { shouldUpdate: boolean; finalHeight: number | null } {
  // Validar que el valor scrapeado sea válido (rango típico: 140 cm - 220 cm)
  const isValidHeight = (height: number | null): boolean => {
    if (height === null || height === undefined) return false
    if (height <= 0) return false
    if (height < 140 || height > 220) return false // Rango razonable para futbolistas
    return true
  }

  // Si el valor scrapeado no es válido, no actualizar
  if (!isValidHeight(scrapedHeight)) {
    return { shouldUpdate: false, finalHeight: null }
  }

  // Si no hay altura existente o es inválida (0 o null), actualizar con el valor scrapeado (que ya validamos arriba)
  if (!existingHeight || existingHeight === 0) {
    // Ya sabemos que scrapedHeight es válido por el check anterior
    return { shouldUpdate: true, finalHeight: scrapedHeight }
  }

  // Si la altura existente es válida, solo actualizar si el nuevo valor es diferente
  if (existingHeight !== scrapedHeight) {
    return { shouldUpdate: true, finalHeight: scrapedHeight }
  }

  return { shouldUpdate: false, finalHeight: null }
}

/**
 * POST /api/admin/scraping/process - Procesar un batch del job activo
 */
export async function POST(request: Request) {
  console.log('🎯 [PROCESS] Endpoint /process ejecutándose...')

  const rateLimiter = new RateLimiter({
    maxRetriesPerRequest: SCRAPING_CONFIG.MAX_RETRIES_PER_PLAYER,
    baseRetryDelay: 5000,
    maxRetryDelay: 120000,
    errorThresholdPercent: 20
  })

  const throttler = new AdaptiveThrottler(
    SCRAPING_CONFIG.MIN_DELAY_BETWEEN_PLAYERS,
    SCRAPING_CONFIG.MAX_DELAY_BETWEEN_PLAYERS
  )

  try {
    // 🔐 VERIFICAR AUTENTICACIÓN - MÉTODO SEGURO
    // Verificar si es una llamada interna del backend usando API key secreta
    const internalApiKey = request.headers.get('X-Internal-API-Key')
    const expectedApiKey = process.env.SCRAPING_INTERNAL_API_KEY

    const isInternalCall = internalApiKey && expectedApiKey && internalApiKey === expectedApiKey
    console.log(`🔐 [PROCESS] isInternalCall: ${isInternalCall}`)

    if (!isInternalCall) {
      // Si no es llamada interna, verificar autenticación normal de usuario admin
      const { userId, sessionClaims } = await auth()

      if (!userId) {
        return NextResponse.json(
          { error: 'No autorizado. Debes iniciar sesión.' },
          { status: 401 }
        )
      }

      // 👮‍♂️ VERIFICAR PERMISOS DE ADMIN
      const userRole = sessionClaims?.public_metadata?.role
      if (userRole !== 'admin') {
        return NextResponse.json(
          { error: 'Acceso denegado. Solo los administradores pueden ejecutar scraping.' },
          { status: 403 }
        )
      }

      console.log('✅ [PROCESS] Autenticación de usuario admin exitosa')
    } else {
      console.log('✅ [PROCESS] Autenticación de llamada interna exitosa')
    }

    // 🔍 OBTENER JOB ACTIVO
    const job = await prisma.scrapingJob.findFirst({
      where: {
        status: {
          in: ['pending', 'running']
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    if (!job) {
      return NextResponse.json(
        { error: 'No hay ningún trabajo de scraping activo.' },
        { status: 404 }
      )
    }

    // ✅ VERIFICAR SI YA SE COMPLETÓ
    if (job.processedCount >= job.totalPlayers) {
      await prisma.scrapingJob.update({
        where: { id: job.id },
        data: {
          status: 'completed',
          completedAt: new Date()
        }
      })

      return NextResponse.json({
        success: true,
        completed: true,
        message: 'Scraping completado',
        job: {
          id: job.id,
          status: 'completed',
          totalPlayers: job.totalPlayers,
          processedCount: job.processedCount,
          successCount: job.successCount,
          errorCount: job.errorCount,
          rateLimitCount: job.rateLimitCount,
          errorRate: job.errorRate
        }
      })
    }

    // 🔄 MARCAR COMO RUNNING
    await prisma.scrapingJob.update({
      where: { id: job.id },
      data: { status: 'running' }
    })

    // 📊 OBTENER SIGUIENTE BATCH DE JUGADORES
    const playersToProcess = await prisma.jugador.findMany({
      where: {
        url_trfm: {
          not: null,
          not: ''
        }
      },
      select: {
        id_player: true,
        player_name: true,
        url_trfm: true,
        date_of_birth: true, // Necesario para validar fecha genérica 01/01
        team_name: true, // Necesario para validar equipos desconocidos y duplicados
        team_country: true, // Necesario para resolver equipos duplicados (Arsenal, Independiente, etc.)
        team_loan_from: true, // Necesario para validar equipos de cesión desconocidos
        position_player: true, // Necesario para validar posiciones genéricas
        height: true, // Necesario para validar altura válida
        agency: true // Necesario para validar agencias genéricas
      },
      skip: job.processedCount,
      take: job.batchSize,
      orderBy: {
        player_name: 'asc'
      }
    })

    if (playersToProcess.length === 0) {
      await prisma.scrapingJob.update({
        where: { id: job.id },
        data: {
          status: 'completed',
          completedAt: new Date()
        }
      })

      return NextResponse.json({
        success: true,
        completed: true,
        message: 'No hay más jugadores para procesar'
      })
    }

    console.log(`\n📦 Procesando batch ${job.currentBatch + 1}: ${playersToProcess.length} jugadores`)
    addJobLog(job.id, '')
    addJobLog(job.id, `📦 Procesando batch ${job.currentBatch + 1}: ${playersToProcess.length} jugadores`)
    addJobLog(job.id, '')

    const results: ScrapingResult[] = []
    let batchSuccessCount = 0
    let batchErrorCount = 0
    let batchRetryCount = 0
    let batchRateLimitCount = 0

    // 🔄 PROCESAR CADA JUGADOR DEL BATCH
    for (let i = 0; i < playersToProcess.length; i++) {
      const player = playersToProcess[i]

      console.log(`[${i + 1}/${playersToProcess.length}] ${player.player_name || player.id_player}`)
      addJobLog(job.id, `🔍 [${i + 1}/${playersToProcess.length}] Scrapeando: ${player.player_name || player.id_player}`)
      addJobLog(job.id, `   🌐 URL: ${player.url_trfm}`)

      // 🌐 HACER SCRAPING CON RETRY LOGIC Y RATE LIMITING
      console.log(`  🌐 Iniciando petición HTTP a: ${player.url_trfm}`)
      const result = await rateLimiter.executeWithRetry(
        async () => {
          return await scrapePlayerData(player.url_trfm!)
        },
        (attempt, delay) => {
          console.log(`  🔄 Reintento ${attempt} en ${delay / 1000}s para ${player.player_name}`)
          addJobLog(job.id, `  🔄 Reintento ${attempt} en ${delay / 1000}s para ${player.player_name}`)
        }
      )

      if (result.success && result.data) {
        // ✅ ÉXITO - Aplicar lógica condicional antes de actualizar
        const scrapedData = result.data

        // 📅 VALIDAR FECHA DE NACIMIENTO ANTES DE ACTUALIZAR
        if (scrapedData.date_of_birth !== undefined) {
          const shouldUpdate = shouldUpdateDateOfBirth(
            player.date_of_birth,
            scrapedData.date_of_birth
          )

          if (!shouldUpdate) {
            // NO actualizar la fecha - eliminarla del objeto de datos
            delete scrapedData.date_of_birth
            console.log(`  ⚠️  Fecha genérica 01/01 ignorada - manteniendo fecha existente`)
          }
        }

        // 🏟️ VALIDAR NOMBRE DEL EQUIPO ANTES DE ACTUALIZAR
        if (scrapedData.team_name !== undefined) {
          const { shouldUpdate, finalTeamName } = shouldUpdateTeamName(
            player.team_name,
            scrapedData.team_name,
            player.team_country
          )

          if (!shouldUpdate) {
            // NO actualizar el equipo - eliminarla del objeto de datos
            delete scrapedData.team_name
            console.log(`  ⚠️  Equipo "desconocido" ignorado - manteniendo equipo existente`)
          } else if (finalTeamName && finalTeamName !== scrapedData.team_name) {
            // Actualizar con el nombre resuelto (para casos de duplicados)
            scrapedData.team_name = finalTeamName
            console.log(`  🔄 Nombre de equipo resuelto: "${scrapedData.team_name}" (país: ${player.team_country || 'desconocido'})`)
          }
        }

        // 🏟️ VALIDAR EQUIPO DE CESIÓN (LOAN FROM) ANTES DE ACTUALIZAR
        if (scrapedData.team_loan_from !== undefined) {
          const { shouldUpdate, finalLoanTeam } = shouldUpdateLoanTeam(
            player.team_loan_from,
            scrapedData.team_loan_from,
            player.team_country
          )

          if (!shouldUpdate) {
            // NO actualizar el equipo de cesión - eliminarla del objeto de datos
            delete scrapedData.team_loan_from
            console.log(`  ⚠️  Equipo de cesión "desconocido" ignorado - manteniendo equipo existente`)
          } else if (finalLoanTeam && finalLoanTeam !== scrapedData.team_loan_from) {
            // Actualizar con el nombre resuelto (para casos de duplicados)
            scrapedData.team_loan_from = finalLoanTeam
            console.log(`  🔄 Equipo de cesión resuelto: "${scrapedData.team_loan_from}" (país: ${player.team_country || 'desconocido'})`)
          }
        }

        // ⚽ VALIDAR Y LIMPIAR POSICIÓN DEL JUGADOR ANTES DE ACTUALIZAR
        if (scrapedData.position_player !== undefined) {
          const { shouldUpdate, finalPosition } = shouldUpdatePosition(
            player.position_player,
            scrapedData.position_player
          )

          if (!shouldUpdate) {
            // NO actualizar la posición - eliminarla del objeto de datos
            delete scrapedData.position_player
            console.log(`  ⚠️  Posición genérica o en blanco ignorada - manteniendo posición existente`)
          } else if (finalPosition && finalPosition !== scrapedData.position_player) {
            // Actualizar con la posición limpia (sin prefijos como "Defender -")
            scrapedData.position_player = finalPosition
            console.log(`  🔄 Posición limpiada: "${scrapedData.position_player}"`)
          }
        }

        // 📏 VALIDAR ALTURA DEL JUGADOR ANTES DE ACTUALIZAR
        if (scrapedData.height !== undefined) {
          const { shouldUpdate, finalHeight } = shouldUpdateHeight(
            player.height,
            scrapedData.height
          )

          if (!shouldUpdate) {
            // NO actualizar la altura - eliminarla del objeto de datos
            delete scrapedData.height
            console.log(`  ⚠️  Altura inválida ignorada (valor: ${scrapedData.height})`)
          }
        }

        // 🌍 CORREGIR NACIONALIDAD 1 (aplicar mapeo de correcciones)
        if (scrapedData.nationality_1 !== undefined) {
          const correctedNationality = correctNationality(scrapedData.nationality_1)

          if (correctedNationality && correctedNationality !== scrapedData.nationality_1) {
            scrapedData.nationality_1 = correctedNationality
            console.log(`  🔄 Nacionalidad corregida: "${scrapedData.nationality_1}"`)
          } else if (!correctedNationality) {
            // Si la corrección retorna null, eliminar del objeto
            delete scrapedData.nationality_1
          }
        }

        // 🌍 CORREGIR NACIONALIDAD 2 (aplicar mapeo de correcciones)
        if (scrapedData.nationality_2 !== undefined) {
          const correctedNationality = correctNationality(scrapedData.nationality_2)

          if (correctedNationality && correctedNationality !== scrapedData.nationality_2) {
            scrapedData.nationality_2 = correctedNationality
            console.log(`  🔄 Nacionalidad 2 corregida: "${scrapedData.nationality_2}"`)
          } else if (!correctedNationality) {
            // Si la corrección retorna null, eliminar del objeto
            delete scrapedData.nationality_2
          }
        }

        // ⚽ CORREGIR CATEGORÍA INTERNACIONAL (NATIONAL TIER)
        if (scrapedData.national_tier !== undefined) {
          const correctedTier = correctNationalTier(scrapedData.national_tier)

          if (correctedTier && correctedTier !== scrapedData.national_tier) {
            scrapedData.national_tier = correctedTier
            console.log(`  🔄 Categoría internacional corregida: "${scrapedData.national_tier}"`)
          } else if (!correctedTier) {
            // Si la corrección retorna null, eliminar del objeto
            delete scrapedData.national_tier
          }
        }

        // 🤝 VALIDAR Y LIMPIAR AGENCIA (AGENCY)
        if (scrapedData.agency !== undefined) {
          const { shouldUpdate, finalAgency } = shouldUpdateAgency(
            player.agency,
            scrapedData.agency
          )

          if (!shouldUpdate) {
            // NO actualizar la agencia - eliminarla del objeto de datos
            delete scrapedData.agency
            console.log(`  ⚠️  Agencia genérica o vacía ignorada`)
          } else if (finalAgency && finalAgency !== scrapedData.agency) {
            // Actualizar con el nombre limpio (sin puntos suspensivos)
            scrapedData.agency = finalAgency
            console.log(`  🔄 Agencia limpiada: "${scrapedData.agency}"`)
          }
        }

        // Actualizar en base de datos solo si hay campos que actualizar
        if (Object.keys(scrapedData).length > 0) {
          await prisma.jugador.update({
            where: { id_player: player.id_player },
            data: scrapedData
          })
        }

        const fieldsUpdated = Object.keys(scrapedData)

        results.push({
          playerId: player.id_player,
          playerName: player.player_name || player.id_player,
          url: player.url_trfm!,
          success: true,
          fieldsUpdated,
          retries: result.retries
        })

        batchSuccessCount++
        batchRetryCount += result.retries
        console.log(`  ✅ Actualizado: ${fieldsUpdated.length} campos (${result.retries} reintentos)`)
        addJobLog(job.id, `  ✅ ${player.player_name}: ${fieldsUpdated.length} campos actualizados`)

        // Mostrar algunos campos actualizados (máximo 3)
        if (fieldsUpdated.length > 0 && fieldsUpdated.length <= 5) {
          // Si son pocos campos, mostrar todos
          for (const field of fieldsUpdated) {
            const oldValue = (player as any)[field]
            const newValue = scrapedData[field]
            addJobLog(job.id, `     • ${field}: "${oldValue || 'null'}" → "${newValue || 'null'}"`)
          }
        } else if (fieldsUpdated.length > 5) {
          // Si son muchos, mostrar solo los 3 primeros
          for (let idx = 0; idx < 3; idx++) {
            const field = fieldsUpdated[idx]
            const oldValue = (player as any)[field]
            const newValue = scrapedData[field]
            addJobLog(job.id, `     • ${field}: "${oldValue || 'null'}" → "${newValue || 'null'}"`)
          }
          addJobLog(job.id, `     ... y ${fieldsUpdated.length - 3} campos más`)
        }

      } else {
        // ❌ ERROR - Registrar fallo
        results.push({
          playerId: player.id_player,
          playerName: player.player_name || player.id_player,
          url: player.url_trfm!,
          success: false,
          fieldsUpdated: [],
          error: result.error,
          retries: result.retries
        })

        batchErrorCount++
        batchRetryCount += result.retries || 0

        if (result.wasRateLimited) {
          batchRateLimitCount++
        }

        console.log(`  ❌ Error: ${result.error} (${result.retries} reintentos)`)
        addJobLog(job.id, `  ❌ ${player.player_name}: ${result.error} (${result.retries} reintentos)`)
      }

      // 📊 ACTUALIZAR THROTTLER BASÁNDOSE EN MÉTRICAS
      const metrics = rateLimiter.getMetrics()
      throttler.adjustSpeed(metrics.errorRate)

      // ⏱️ PAUSA ADAPTATIVA ENTRE JUGADORES
      if (i < playersToProcess.length - 1) {
        const delays = throttler.getCurrentDelays()
        const delayMs = Math.floor(Math.random() * (delays.max - delays.min + 1)) + delays.min

        console.log(`  ⏳ Pausa: ${delayMs / 1000}s (multiplier: ${throttler.getMultiplier().toFixed(2)}x)`)
        addJobLog(job.id, `  ⏸️  Pausa de ${(delayMs / 1000).toFixed(1)}s antes del siguiente jugador...`)
        await randomSleep(delays.min, delays.max)
      }

      // 🚨 VERIFICAR SI HAY DEMASIADOS RATE LIMITS CONSECUTIVOS
      if (rateLimiter.getConsecutiveRateLimits() >= 5) {
        console.error('🛑 CRÍTICO: Demasiados rate limits consecutivos. Pausando job.')

        await prisma.scrapingJob.update({
          where: { id: job.id },
          data: {
            status: 'paused',
            lastError: 'Demasiados rate limits (429). Job pausado automáticamente.',
            last429At: new Date()
          }
        })

        return NextResponse.json({
          success: false,
          error: 'Job pausado automáticamente por exceso de rate limiting',
          job: {
            id: job.id,
            status: 'paused',
            rateLimitCount: job.rateLimitCount + batchRateLimitCount
          }
        }, { status: 429 })
      }
    }

    // 📊 CALCULAR MÉTRICAS DEL BATCH
    const finalMetrics = rateLimiter.getMetrics()
    const totalProcessed = job.processedCount + playersToProcess.length
    const newTotalSuccess = job.successCount + batchSuccessCount
    const newTotalErrors = job.errorCount + batchErrorCount
    const newErrorRate = totalProcessed > 0
      ? Math.round((newTotalErrors / totalProcessed) * 1000) / 10
      : 0

    // 📊 ACTUALIZAR PROGRESO DEL JOB
    const updatedJob = await prisma.scrapingJob.update({
      where: { id: job.id },
      data: {
        processedCount: totalProcessed,
        successCount: newTotalSuccess,
        errorCount: newTotalErrors,
        currentBatch: job.currentBatch + 1,
        retryCount: (job.retryCount || 0) + batchRetryCount,
        rateLimitCount: (job.rateLimitCount || 0) + batchRateLimitCount,
        errorRate: newErrorRate,
        speedMultiplier: throttler.getMultiplier(),
        slowModeActive: finalMetrics.shouldSlowDown,
        lastProcessedAt: new Date(),
        lastError: batchErrorCount > 0 ? `${batchErrorCount} errores en este batch` : null
      }
    })

    console.log(`\n✅ Batch completado:`)
    console.log(`   - Exitosos: ${batchSuccessCount}`)
    console.log(`   - Errores: ${batchErrorCount}`)
    console.log(`   - Reintentos: ${batchRetryCount}`)
    console.log(`   - Rate Limits: ${batchRateLimitCount}`)
    console.log(`   - Error Rate: ${newErrorRate}%`)
    console.log(`   - Speed Multiplier: ${throttler.getMultiplier().toFixed(2)}x`)
    console.log(`📊 Progreso total: ${updatedJob.processedCount}/${updatedJob.totalPlayers}`)

    addJobLog(job.id, '')
    addJobLog(job.id, `✅ Batch ${updatedJob.currentBatch} completado`)
    addJobLog(job.id, `   - Exitosos: ${batchSuccessCount}, Errores: ${batchErrorCount}`)
    addJobLog(job.id, `📊 Progreso total: ${updatedJob.processedCount}/${updatedJob.totalPlayers} (${updatedJob.progress}%)`)
    addJobLog(job.id, '')

    const isCompleted = updatedJob.processedCount >= updatedJob.totalPlayers

    if (isCompleted) {
      await prisma.scrapingJob.update({
        where: { id: job.id },
        data: {
          status: 'completed',
          completedAt: new Date()
        }
      })
      addJobLog(job.id, '')
      addJobLog(job.id, `🎉 ¡Scraping completado exitosamente!`)
      addJobLog(job.id, `📊 Total de jugadores procesados: ${updatedJob.processedCount}`)
      addJobLog(job.id, `✅ Exitosos: ${updatedJob.successCount}`)
      addJobLog(job.id, `❌ Errores: ${updatedJob.errorCount}`)
      addJobLog(job.id, `📈 Tasa de éxito: ${((updatedJob.successCount / updatedJob.processedCount) * 100).toFixed(1)}%`)
    }

    return NextResponse.json({
      success: true,
      completed: isCompleted,
      message: `Batch procesado: ${batchSuccessCount} exitosos, ${batchErrorCount} errores`,
      job: {
        id: updatedJob.id,
        status: isCompleted ? 'completed' : 'running',
        totalPlayers: updatedJob.totalPlayers,
        processedCount: updatedJob.processedCount,
        successCount: updatedJob.successCount,
        errorCount: updatedJob.errorCount,
        currentBatch: updatedJob.currentBatch,
        retryCount: updatedJob.retryCount,
        rateLimitCount: updatedJob.rateLimitCount,
        errorRate: updatedJob.errorRate,
        speedMultiplier: updatedJob.speedMultiplier,
        slowModeActive: updatedJob.slowModeActive,
        progress: Math.round((updatedJob.processedCount / updatedJob.totalPlayers) * 100)
      },
      metrics: {
        ...finalMetrics,
        throttlerMultiplier: throttler.getMultiplier()
      },
      results
    }, { status: 200 })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
    const errorStack = error instanceof Error ? error.stack : 'N/A'

    console.error('❌ [PROCESS] Error in scraping process:', error)
    console.error('❌ [PROCESS] Error message:', errorMessage)
    console.error('❌ [PROCESS] Error stack:', errorStack)

    // Intentar marcar el job como failed
    try {
      const failedJob = await prisma.scrapingJob.findFirst({
        where: {
          status: {
            in: ['pending', 'running']
          }
        }
      })

      if (failedJob) {
        console.error(`❌ [PROCESS] Marcando job ${failedJob.id} como failed con error: ${errorMessage}`)
        await prisma.scrapingJob.update({
          where: { id: failedJob.id },
          data: {
            status: 'failed',
            lastError: errorMessage
          }
        })
      } else {
        console.error('❌ [PROCESS] No se encontró job activo para marcar como failed')
      }
    } catch (updateError) {
      console.error('❌ [PROCESS] Error updating job status:', updateError)
    }

    return NextResponse.json(
      { error: `Error interno del servidor durante el scraping: ${errorMessage}` },
      { status: 500 }
    )
  }
}

/**
 * 🕷️ FUNCIÓN DE SCRAPING DE UN JUGADOR (MEJORADA)
 *
 * Esta función extrae los 16 campos de Transfermarkt con headers realistas
 */
async function scrapePlayerData(url: string): Promise<Record<string, any>> {
  // 🌐 HACER REQUEST CON HEADERS REALISTAS Y ROTACIÓN DE USER-AGENT
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

    // 📊 EXTRAER DATOS USANDO REGEX Y PARSING
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
        // Guardamos la fecha tal cual - la validación se hará al actualizar
        data.date_of_birth = parsedDate
      }
    }

    // 3. Equipo actual
    const teamMatch = html.match(/<span class="[^"]*hauptverein[^"]*"[^>]*>([^<]+)<\/span>/)
    if (teamMatch) {
      data.team_name = teamMatch[1].trim()
    }

    // 4. Equipo de cesión
    const loanMatch = html.match(/cedido de[^>]*>([^<]+)</)
    if (loanMatch) {
      data.team_loan_from = loanMatch[1].trim()
    }

    // 5. Posición
    const positionMatch = html.match(/<span class="[^"]*position[^"]*"[^>]*>([^<]+)<\/span>/)
    if (positionMatch) {
      data.position_player = positionMatch[1].trim()
    }

    // 6. Pie dominante
    const footMatch = html.match(/Pie:<\/span>\s*<span[^>]*>([^<]+)<\/span>/)
    if (footMatch) {
      data.foot = footMatch[1].trim()
    }

    // 7. Altura
    const heightMatch = html.match(/Altura:<\/span>\s*<span[^>]*>([0-9,]+)\s*m<\/span>/)
    if (heightMatch) {
      const heightInMeters = parseFloat(heightMatch[1].replace(',', '.'))
      data.height = Math.round(heightInMeters * 100)
    }

    // 8. Nacionalidad 1
    const nat1Match = html.match(/<img[^>]+title="([^"]+)"[^>]+alt="[^"]*bandera[^"]*"/)
    if (nat1Match) {
      data.nationality_1 = nat1Match[1].trim()
    }

    // 9. Nacionalidad 2
    const nat2Matches = html.matchAll(/<img[^>]+title="([^"]+)"[^>]+alt="[^"]*bandera[^"]*"/g)
    const nationalities = Array.from(nat2Matches).map(m => m[1].trim())
    if (nationalities.length > 1) {
      data.nationality_2 = nationalities[1]
    }

    // 10. Nivel de selección nacional
    const nationalTeamMatch = html.match(/Selección nacional:<\/span>\s*<span[^>]*>([^<]+)<\/span>/)
    if (nationalTeamMatch) {
      data.national_tier = nationalTeamMatch[1].trim()
    }

    // 11. Agencia
    const agencyMatch = html.match(/Agencia:<\/span>\s*<a[^>]*>([^<]+)<\/a>/)
    if (agencyMatch) {
      data.agency = agencyMatch[1].trim()
    }

    // 12. Fin de contrato
    const contractMatch = html.match(/Contrato hasta:<\/span>\s*<span[^>]*>([^<]+)<\/span>/)
    if (contractMatch) {
      const parsedDate = parseContractDate(contractMatch[1].trim())
      if (parsedDate) {
        data.contract_end = parsedDate
      }
    }

    // 13. Valor de mercado
    const valueMatch = html.match(/Valor de mercado:<\/span>\s*<a[^>]*>([0-9,.]+)\s*(mil|mill?\.?)\s*€<\/a>/)
    if (valueMatch) {
      // Limpiar formato: "1.500.000" o "1,5" → número limpio
      let cleanValue = valueMatch[1]

      // Si tiene puntos Y comas, los puntos son separadores de miles
      if (cleanValue.includes('.') && cleanValue.includes(',')) {
        cleanValue = cleanValue.replace(/\./g, '').replace(',', '.')
      }
      // Si solo tiene puntos y NO tiene comas, puede ser formato español (1.500.000)
      else if (cleanValue.includes('.') && !cleanValue.includes(',')) {
        // Contar puntos: si hay múltiples, son separadores de miles
        const dotCount = (cleanValue.match(/\./g) || []).length
        if (dotCount > 1 || cleanValue.split('.')[1]?.length === 3) {
          cleanValue = cleanValue.replace(/\./g, '')
        }
        // Si hay un solo punto y el último segmento tiene 1-2 dígitos, es decimal
        else if (cleanValue.split('.')[1]?.length <= 2) {
          // Mantener el punto como decimal
        }
      }
      // Si solo tiene comas, la coma es decimal
      else if (cleanValue.includes(',')) {
        cleanValue = cleanValue.replace(',', '.')
      }

      const value = parseFloat(cleanValue)
      const multiplier = valueMatch[2].toLowerCase().includes('mill') ? 1000000 : 1000
      data.player_trfm_value = value * multiplier
    }

    // 14. Nombre del advisor
    const advisorNameMatch = html.match(/Agente:<\/span>\s*<a[^>]*>([^<]+)<\/a>/)
    if (advisorNameMatch) {
      data.advisor = advisorNameMatch[1].trim()
    }

    // 15. Foto de perfil (photo_coverage)
    // Buscar la imagen de perfil del jugador en Transfermarkt
    // Patrón: <img ... data-src="..." alt="[Nombre del jugador]" class="...profil..."
    const profileImageMatch = html.match(/<img[^>]+data-src="([^"]+)"[^>]+class="[^"]*data-header__profile-image[^"]*"[^>]*>/)
    if (profileImageMatch) {
      const photoUrl = profileImageMatch[1].trim()
      // Solo guardar si NO es una imagen por defecto
      if (!isDefaultTransfermarktImage(photoUrl)) {
        data.photo_coverage = photoUrl
      }
    } else {
      // Patrón alternativo: buscar src en lugar de data-src
      const profileImageAltMatch = html.match(/<img[^>]+class="[^"]*data-header__profile-image[^"]*"[^>]+src="([^"]+)"[^>]*>/)
      if (profileImageAltMatch) {
        const photoUrl = profileImageAltMatch[1].trim()
        if (!isDefaultTransfermarktImage(photoUrl)) {
          data.photo_coverage = photoUrl
        }
      } else {
        // Tercer patrón: buscar por estructura del div contenedor
        const profileImageDivMatch = html.match(/<div class="data-header__profile-container"[^>]*>[\s\S]*?<img[^>]+src="([^"]+)"[^>]*>/)
        if (profileImageDivMatch) {
          const photoUrl = profileImageDivMatch[1].trim()
          if (!isDefaultTransfermarktImage(photoUrl)) {
            data.photo_coverage = photoUrl
          }
        }
      }
    }

    // 16. Foto de galería (gallery_photo)
    // Buscar foto de cuerpo completo del jugador para sidebar grande
    // ESTRATEGIA: Intentar obtener versión "big" o "medium" de la foto

    // Si ya tenemos photo_coverage, intentar convertir header → big
    if (data.photo_coverage && data.photo_coverage.includes('/portrait/header/')) {
      // Transformar URL: /portrait/header/123-456.jpg → /portrait/big/123-456.jpg
      const galleryUrl = data.photo_coverage.replace('/portrait/header/', '/portrait/big/')
      if (!isDefaultTransfermarktImage(galleryUrl)) {
        data.gallery_photo = galleryUrl
      }
    } else {
      // Patrón 1: Buscar directamente URLs con /portrait/big/ o /portrait/medium/
      const bigPortraitMatch = html.match(/https?:\/\/[^"'\s]+\/portrait\/(big|medium)\/[^"'\s]+\.(jpg|jpeg|png)/i)
      if (bigPortraitMatch) {
        const galleryUrl = bigPortraitMatch[0].trim()
        if (!isDefaultTransfermarktImage(galleryUrl)) {
          data.gallery_photo = galleryUrl
        }
      } else {
        // Patrón 2: Buscar en la galería de fotos del jugador
        const galleryMatch = html.match(/<div[^>]+class="[^"]*gallery[^"]*"[^>]*>[\s\S]*?<img[^>]+data-src="([^"]+)"[^>]*>/)
        if (galleryMatch) {
          const galleryUrl = galleryMatch[1].trim()
          if (!isDefaultTransfermarktImage(galleryUrl)) {
            data.gallery_photo = galleryUrl
          }
        } else {
          // Patrón 3: Buscar enlaces a fotos grandes
          const galleryLinkMatch = html.match(/<a[^>]+class="[^"]*photo[^"]*"[^>]*href="([^"]+\.(jpg|jpeg|png)[^"]*)"[^>]*>/)
          if (galleryLinkMatch) {
            const galleryUrl = galleryLinkMatch[1].trim()
            if (!isDefaultTransfermarktImage(galleryUrl)) {
              data.gallery_photo = galleryUrl
            }
          } else {
            // Patrón 4: Buscar cualquier imagen grande que no sea el header
            const largeImageMatches = html.matchAll(/<img[^>]+src="([^"]+portrait[^"]+)"[^>]+(?:width="[3-9]\d\d|height="[3-9]\d\d)[^>]*>/g)
            for (const match of largeImageMatches) {
              const imageUrl = match[1].trim()
              // Solo si NO es header, NO es la misma que photo_coverage, y NO es default
              if (!imageUrl.includes('header') && imageUrl !== data.photo_coverage && !isDefaultTransfermarktImage(imageUrl)) {
                data.gallery_photo = imageUrl
                break
              }
            }
          }
        }
      }
    }

    return data

  } catch (error) {
    clearTimeout(timeoutId)

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error(`Timeout después de ${SCRAPING_CONFIG.REQUEST_TIMEOUT / 1000}s`)
      }
      throw error
    }

    throw new Error('Error desconocido durante el scraping')
  }
}

/**
 * 📅 PARSEAR FECHA EN FORMATO ESPAÑOL
 */
function parseDateString(dateStr: string): Date | null {
  try {
    const months: Record<string, number> = {
      'enero': 0, 'febrero': 1, 'marzo': 2, 'abril': 3,
      'mayo': 4, 'junio': 5, 'julio': 6, 'agosto': 7,
      'septiembre': 8, 'octubre': 9, 'noviembre': 10, 'diciembre': 11
    }

    if (dateStr.includes('/')) {
      const [day, month, year] = dateStr.split('/')
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
    }

    const match = dateStr.match(/(\d+)\s+de\s+(\w+)\s+de\s+(\d{4})/)
    if (match) {
      const [, day, month, year] = match
      const monthIndex = months[month.toLowerCase()]
      if (monthIndex !== undefined) {
        return new Date(parseInt(year), monthIndex, parseInt(day))
      }
    }

    return null
  } catch {
    return null
  }
}

/**
 * 📅 PARSEAR FECHA DE CONTRATO
 *
 * Soporta múltiples formatos:
 * - DD/MM/YYYY (ej: 30/06/2025)
 * - "Jun 30, 2025" (formato inglés)
 * - "30 de junio de 2025" (formato español)
 */
function parseContractDate(dateStr: string): Date | null {
  try {
    // Formato DD/MM/YYYY
    if (dateStr.includes('/')) {
      const [day, month, year] = dateStr.split('/')
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
    }

    // Formato inglés: "Jun 30, 2025" o "June 30, 2025"
    const englishMonths: Record<string, number> = {
      'jan': 0, 'january': 0,
      'feb': 1, 'february': 1,
      'mar': 2, 'march': 2,
      'apr': 3, 'april': 3,
      'may': 4,
      'jun': 5, 'june': 5,
      'jul': 6, 'july': 6,
      'aug': 7, 'august': 7,
      'sep': 8, 'september': 8,
      'oct': 9, 'october': 9,
      'nov': 10, 'november': 10,
      'dec': 11, 'december': 11
    }

    // Match: "Jun 30, 2025" o "June 30, 2025"
    const englishMatch = dateStr.match(/(\w+)\s+(\d{1,2}),\s*(\d{4})/)
    if (englishMatch) {
      const [, monthStr, day, year] = englishMatch
      const monthIndex = englishMonths[monthStr.toLowerCase()]
      if (monthIndex !== undefined) {
        return new Date(parseInt(year), monthIndex, parseInt(day))
      }
    }

    // Formato español: "30 de junio de 2025"
    return parseDateString(dateStr)
  } catch {
    return null
  }
}
