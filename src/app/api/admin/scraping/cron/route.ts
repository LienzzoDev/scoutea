/**
 * ⏰ ENDPOINT DE PROCESAMIENTO CONTINUO
 *
 * ✅ PROPÓSITO: Procesar batches en el backend sin intervención del usuario
 * ✅ BENEFICIO: El scraping continúa aunque el usuario cierre la página
 * ✅ RUTA: GET /api/admin/scraping/cron
 * ✅ USO: Se ejecuta manualmente cuando el administrador inicia el scraping
 * ✅ BATCH SIZE: 100 jugadores por ejecución (~10-20 minutos de procesamiento)
 */

import { NextResponse } from 'next/server'

import { prisma } from '@/lib/db'
import { RateLimiter, AdaptiveThrottler } from '@/lib/scraping/rate-limiter'
import { getRealisticHeaders, randomSleep } from '@/lib/scraping/user-agents'

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

// 🎛️ CONFIGURACIÓN DE SCRAPING (más conservadora)
const SCRAPING_CONFIG = {
  MIN_DELAY_BETWEEN_PLAYERS: 5000,  // 5 segundos mínimo
  MAX_DELAY_BETWEEN_PLAYERS: 15000, // 15 segundos máximo
  REQUEST_TIMEOUT: 30000,            // 30 segundos timeout
  MAX_RETRIES_PER_PLAYER: 3,
}

/**
 * 📅 VALIDAR SI DEBE ACTUALIZARSE LA FECHA DE NACIMIENTO
 */
function shouldUpdateDateOfBirth(
  existingDate: Date | null,
  scrapedDate: Date | null
): boolean {
  if (!existingDate) return true
  if (!scrapedDate) return false

  const isExistingGeneric = existingDate.getMonth() === 0 && existingDate.getDate() === 1
  const isScrapedGeneric = scrapedDate.getMonth() === 0 && scrapedDate.getDate() === 1

  if (!isExistingGeneric && isScrapedGeneric) return false
  if (isExistingGeneric && !isScrapedGeneric) return true

  return existingDate.getTime() !== scrapedDate.getTime()
}

/**
 * 🏟️ MAPEO DE EQUIPOS DUPLICADOS CON SUS PAÍSES
 */
const DUPLICATE_TEAM_MAPPINGS: Record<string, Record<string, string>> = {
  'Arsenal': {
    'England': 'Arsenal FC',
    'Argentina': 'Arsenal Fútbol Club'
  },
  'Arsenal FC': {
    'England': 'Arsenal FC',
    'Argentina': 'Arsenal Fútbol Club'
  },
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
 */
function shouldUpdateTeamName(
  existingTeamName: string | null,
  scrapedTeamName: string | null,
  teamCountry: string | null
): { shouldUpdate: boolean; finalTeamName: string | null } {
  const unknownValues = ['Unknown', 'None', 'Unk', 'unknown club', 'Sin club', 'Without Club']

  const isUnknownValue = (value: string | null): boolean => {
    if (!value) return false
    return unknownValues.some(unknown =>
      value.toLowerCase().includes(unknown.toLowerCase())
    )
  }

  if (!existingTeamName || existingTeamName.trim() === '') {
    if (scrapedTeamName && teamCountry) {
      const resolvedName = resolveTeamNameByCountry(scrapedTeamName, teamCountry)
      return { shouldUpdate: true, finalTeamName: resolvedName }
    }
    return { shouldUpdate: true, finalTeamName: scrapedTeamName }
  }

  if (!scrapedTeamName) {
    return { shouldUpdate: false, finalTeamName: null }
  }

  if (!isUnknownValue(existingTeamName) && isUnknownValue(scrapedTeamName)) {
    return { shouldUpdate: false, finalTeamName: null }
  }

  if (isUnknownValue(existingTeamName) && !isUnknownValue(scrapedTeamName)) {
    if (teamCountry) {
      const resolvedName = resolveTeamNameByCountry(scrapedTeamName, teamCountry)
      return { shouldUpdate: true, finalTeamName: resolvedName }
    }
    return { shouldUpdate: true, finalTeamName: scrapedTeamName }
  }

  if (teamCountry) {
    const resolvedName = resolveTeamNameByCountry(scrapedTeamName, teamCountry)
    if (resolvedName !== existingTeamName) {
      return { shouldUpdate: true, finalTeamName: resolvedName }
    }
  }

  if (existingTeamName !== scrapedTeamName) {
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
 */
function resolveTeamNameByCountry(teamName: string, teamCountry: string): string {
  const normalizedName = teamName.trim()
  const mapping = DUPLICATE_TEAM_MAPPINGS[normalizedName]

  if (mapping) {
    const resolvedName = mapping[teamCountry]
    if (resolvedName) {
      return resolvedName
    }
  }

  return normalizedName
}

/**
 * 🏟️ VALIDAR SI DEBE ACTUALIZARSE EL EQUIPO DE CESIÓN (LOAN FROM)
 */
function shouldUpdateLoanTeam(
  existingLoanTeam: string | null,
  scrapedLoanTeam: string | null,
  teamCountry: string | null
): { shouldUpdate: boolean; finalLoanTeam: string | null } {
  return shouldUpdateTeamName(existingLoanTeam, scrapedLoanTeam, teamCountry)
}

/**
 * ⚽ LIMPIAR Y VALIDAR POSICIÓN DEL JUGADOR
 */
function shouldUpdatePosition(
  existingPosition: string | null,
  scrapedPosition: string | null
): { shouldUpdate: boolean; finalPosition: string | null } {
  if (!scrapedPosition || scrapedPosition.trim() === '') {
    return { shouldUpdate: false, finalPosition: null }
  }

  let cleanedPosition = scrapedPosition.trim()

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

  const genericValues = ['Defender', 'Midfield', 'Midfielder', 'Attack', 'Striker', 'Forward', 'Goalkeeper']

  const isGenericValue = (value: string): boolean => {
    if (!value) return false
    const normalized = value.trim()
    return genericValues.some(generic =>
      normalized.toLowerCase() === generic.toLowerCase()
    )
  }

  if (!existingPosition || existingPosition.trim() === '') {
    return { shouldUpdate: true, finalPosition: cleanedPosition }
  }

  if (isGenericValue(cleanedPosition)) {
    return { shouldUpdate: false, finalPosition: null }
  }

  if (existingPosition !== cleanedPosition) {
    return { shouldUpdate: true, finalPosition: cleanedPosition }
  }

  return { shouldUpdate: false, finalPosition: null }
}

/**
 * 🌍 MAPEO DE CORRECCIÓN DE NACIONALIDADES
 */
const NATIONALITY_CORRECTIONS: Record<string, string> = {
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
 */
function correctNationality(nationality: string | null): string | null {
  if (!nationality || nationality.trim() === '') {
    return null
  }

  const trimmedNationality = nationality.trim()

  if (NATIONALITY_CORRECTIONS[trimmedNationality]) {
    return NATIONALITY_CORRECTIONS[trimmedNationality]
  }

  const lowerNationality = trimmedNationality.toLowerCase()
  for (const [incorrect, correct] of Object.entries(NATIONALITY_CORRECTIONS)) {
    if (incorrect.toLowerCase() === lowerNationality) {
      return correct
    }
  }

  return trimmedNationality
}

/**
 * ⚽ MAPEO DE CORRECCIÓN DE CATEGORÍAS INTERNACIONALES (NATIONAL TIER)
 */
const NATIONAL_TIER_CORRECTIONS: Record<string, string> = {
  'Antigua and B.': 'Antigua & Barbuda',
  'Bosnia': 'Bosnia-Herzegovina',
  'Bosnia U15': 'Bosnia-Herzegovina U15',
  'Bosnia U16': 'Bosnia-Herzegovina U16',
  'Bosnia U17': 'Bosnia-Herzegovina U17',
  'Bosnia U18': 'Bosnia-Herzegovina U18',
  'Bosnia U19': 'Bosnia-Herzegovina U19',
  'Bosnia U21': 'Bosnia-Herzegovina U21',
  'Burkina U17': 'Burkina Faso U17',
  'Burkina U20': 'Burkina Faso U20',
  'C. Africa U20': 'Central African Republic U20',
  'Czechia': 'Czech Republic',
  'Czechia U15': 'Czech Republic U15',
  'Czechia U16': 'Czech Republic U16',
  'Czechia U17': 'Czech Republic U17',
  'Czechia U18': 'Czech Republic U18',
  'Czechia U19': 'Czech Republic U19',
  'Czechia U20': 'Czech Republic U20',
  'Czechia U21': 'Czech Republic U21',
  'Dom. Rep.': 'Dominican Republic',
  'Dominican Rep.': 'Dominican Republic',
  'Dominican U15': 'Dominican Republic U15',
  'Dominican U20': 'Dominican Republic U20',
  'Dominican U23': 'Dominican Republic U23',
  'DR Kongo U23': 'DR Congo U23',
  'Equat. Guinea': 'Equatorial Guinea',
  'Faroe U21': 'Faroe Islands U21',
  'Island U20': 'Iceland U20',
  'Jamaika U22': 'Jamaica U22',
  'Komoren U23': 'Comoros U23',
  'Liechtenst. U17': 'Liechtenstein U17',
  'Liechtenst. U21': 'Liechtenstein U21',
  'Macedonia U17': 'North Macedonia U17',
  'Macedonia U18': 'North Macedonia U18',
  'Macedonia U19': 'North Macedonia U19',
  'Macedonia U21': 'North Macedonia U21',
  'Mauretanien U20': 'Mauritania U20',
  'Polska U14': 'Poland U14',
  'Sambia U17': 'Zambia U17',
  'St. Kitts/Nevis': 'Saint Kitts & Nevis',
  'The Gambia': 'Gambia',
  'The Gambia U20': 'Gambia U20',
  'Timor-Leste U23': 'East Timor U23',
  'Trinidad': 'Trinidad & Tobago',
  'Trinidad U20': 'Trinidad & Tobago U20',
  'Türkiye': 'Turkey',
  'Türkiye U14': 'Turkey U14',
  'Türkiye U15': 'Turkey U15',
  'Türkiye U17': 'Turkey U17',
  'Türkiye U18': 'Turkey U18',
  'Türkiye U19': 'Turkey U19',
  'Türkiye U21': 'Turkey U21',
  'Türkiye U23': 'Turkey U23',
  'U. A. E.': 'United Arab Emirates',
  'U. A. E. U23': 'United Arab Emirates U23',
  'USA': 'United States',
  'USA U15': 'United States U15',
  'USA U16': 'United States U16',
  'USA U17': 'United States U17',
  'USA U19': 'United States U19',
  'USA U20': 'United States U20',
  'USA U23': 'United States U23',
  'Vnzla U15': 'Venezuela U15'
}

/**
 * ⚽ CORREGIR Y NORMALIZAR CATEGORÍA INTERNACIONAL (NATIONAL TIER)
 */
function correctNationalTier(nationalTier: string | null): string | null {
  if (!nationalTier || nationalTier.trim() === '') {
    return null
  }

  const trimmedTier = nationalTier.trim()

  if (NATIONAL_TIER_CORRECTIONS[trimmedTier]) {
    return NATIONAL_TIER_CORRECTIONS[trimmedTier]
  }

  const lowerTier = trimmedTier.toLowerCase()
  for (const [incorrect, correct] of Object.entries(NATIONAL_TIER_CORRECTIONS)) {
    if (incorrect.toLowerCase() === lowerTier) {
      return correct
    }
  }

  return trimmedTier
}

/**
 * 🤝 LIMPIAR Y VALIDAR AGENCIA (AGENCY)
 */
function shouldUpdateAgency(
  existingAgency: string | null,
  scrapedAgency: string | null
): { shouldUpdate: boolean; finalAgency: string | null } {
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

  if (!scrapedAgency || scrapedAgency.trim() === '') {
    return { shouldUpdate: false, finalAgency: null }
  }

  if (isGenericValue(scrapedAgency)) {
    return { shouldUpdate: false, finalAgency: null }
  }

  let cleanedAgency = scrapedAgency.trim()
  cleanedAgency = cleanedAgency.replace(/\.{2,}$/g, '').trim()

  if (!cleanedAgency || cleanedAgency === '') {
    return { shouldUpdate: false, finalAgency: null }
  }

  if (!existingAgency || existingAgency.trim() === '') {
    return { shouldUpdate: true, finalAgency: cleanedAgency }
  }

  if (existingAgency !== cleanedAgency) {
    return { shouldUpdate: true, finalAgency: cleanedAgency }
  }

  return { shouldUpdate: false, finalAgency: null }
}

/**
 * 📏 VALIDAR ALTURA DEL JUGADOR
 */
function shouldUpdateHeight(
  existingHeight: number | null,
  scrapedHeight: number | null
): { shouldUpdate: boolean; finalHeight: number | null } {
  const isValidHeight = (height: number | null): boolean => {
    if (height === null || height === undefined) return false
    if (height <= 0) return false
    if (height < 140 || height > 220) return false
    return true
  }

  if (!isValidHeight(scrapedHeight)) {
    return { shouldUpdate: false, finalHeight: null }
  }

  if (!existingHeight || existingHeight === 0) {
    return { shouldUpdate: true, finalHeight: scrapedHeight }
  }

  if (existingHeight !== scrapedHeight) {
    return { shouldUpdate: true, finalHeight: scrapedHeight }
  }

  return { shouldUpdate: false, finalHeight: null }
}

/**
 * GET /api/admin/scraping/cron - Procesar batch automáticamente (ejecutado por Vercel Cron)
 */
export async function GET(request: Request) {
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
    // 🔐 VERIFICAR AUTENTICACIÓN DE CRON (Vercel pasa headers específicos)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    // En producción, verificar el secret del cron
    if (process.env.NODE_ENV === 'production') {
      if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
        console.error('❌ Unauthorized cron request')
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }
    }

    console.log('\n⏰ CRON JOB EJECUTÁNDOSE:', new Date().toISOString())

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

    // Si no hay job activo, terminar silenciosamente
    if (!job) {
      console.log('ℹ️ No hay jobs activos. Cron terminando...')
      return NextResponse.json({
        success: true,
        message: 'No hay jobs activos para procesar'
      })
    }

    console.log(`📋 Job encontrado: ${job.id}`)
    console.log(`📊 Progreso: ${job.processedCount}/${job.totalPlayers} (${Math.round((job.processedCount / job.totalPlayers) * 100)}%)`)

    // ✅ VERIFICAR SI YA SE COMPLETÓ
    if (job.processedCount >= job.totalPlayers) {
      await prisma.scrapingJob.update({
        where: { id: job.id },
        data: {
          status: 'completed',
          completedAt: new Date()
        }
      })

      console.log('✅ Job completado!')

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

      console.log('✅ No hay más jugadores. Job completado!')

      return NextResponse.json({
        success: true,
        completed: true,
        message: 'No hay más jugadores para procesar'
      })
    }

    console.log(`\n📦 Procesando batch ${job.currentBatch + 1}: ${playersToProcess.length} jugadores`)

    const results: ScrapingResult[] = []
    let batchSuccessCount = 0
    let batchErrorCount = 0
    let batchRetryCount = 0
    let batchRateLimitCount = 0

    // 🔄 PROCESAR CADA JUGADOR DEL BATCH
    for (let i = 0; i < playersToProcess.length; i++) {
      const player = playersToProcess[i]

      console.log(`[${i + 1}/${playersToProcess.length}] ${player.player_name || player.id_player}`)

      // 🌐 HACER SCRAPING CON RETRY LOGIC Y RATE LIMITING
      const result = await rateLimiter.executeWithRetry(
        async () => {
          return await scrapePlayerData(player.url_trfm!)
        },
        (attempt, delay) => {
          console.log(`  🔄 Reintento ${attempt} en ${delay / 1000}s para ${player.player_name}`)
        }
      )

      if (result.success && result.data) {
        // ✅ ÉXITO - Actualizar en base de datos
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
            delete scrapedData.agency
            console.log(`  ⚠️  Agencia genérica o vacía ignorada`)
          } else if (finalAgency && finalAgency !== scrapedData.agency) {
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
      }

      // 📊 ACTUALIZAR THROTTLER BASÁNDOSE EN MÉTRICAS
      const metrics = rateLimiter.getMetrics()
      throttler.adjustSpeed(metrics.errorRate)

      // ⏱️ PAUSA ADAPTATIVA ENTRE JUGADORES
      if (i < playersToProcess.length - 1) {
        const delays = throttler.getCurrentDelays()
        console.log(`  ⏳ Pausa: ${delays.min / 1000}-${delays.max / 1000}s (multiplier: ${throttler.getMultiplier().toFixed(2)}x)`)
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

    const isCompleted = updatedJob.processedCount >= updatedJob.totalPlayers

    if (isCompleted) {
      await prisma.scrapingJob.update({
        where: { id: job.id },
        data: {
          status: 'completed',
          completedAt: new Date()
        }
      })
      console.log('🎉 ¡JOB COMPLETADO!')
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
      }
    }, { status: 200 })

  } catch (error) {
    console.error('❌ Error in cron scraping process:', error)

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
        await prisma.scrapingJob.update({
          where: { id: failedJob.id },
          data: {
            status: 'failed',
            lastError: error instanceof Error ? error.message : 'Error desconocido'
          }
        })
      }
    } catch (updateError) {
      console.error('Error updating job status:', updateError)
    }

    return NextResponse.json(
      { error: 'Error interno del servidor durante el scraping.' },
      { status: 500 }
    )
  }
}

/**
 * 🕷️ FUNCIÓN DE SCRAPING DE UN JUGADOR (MEJORADA)
 */
async function scrapePlayerData(url: string): Promise<Record<string, any>> {
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

function parseContractDate(dateStr: string): Date | null {
  try {
    // Formato DD/MM/YYYY
    if (dateStr.includes('/')) {
      const [day, month, year] = dateStr.split('/')
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
    }

    // Formato inglés "Jun 30, 2025" (mes día, año)
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

    const englishMatch = dateStr.match(/(\w+)\s+(\d{1,2}),\s*(\d{4})/)
    if (englishMatch) {
      const [, monthStr, day, year] = englishMatch
      const monthIndex = englishMonths[monthStr.toLowerCase()]
      if (monthIndex !== undefined) {
        return new Date(parseInt(year), monthIndex, parseInt(day))
      }
    }

    // Formato español "30 de junio de 2025" (fallback)
    return parseDateString(dateStr)
  } catch {
    return null
  }
}
