/**
 * 📥 ENDPOINT DE IMPORTACIÓN DE ESTADÍSTICAS DESDE XLS
 *
 * ✅ PROPÓSITO: Importar estadísticas de jugadores desde archivo Excel/XLS
 * ✅ BENEFICIO: Permite al admin cargar estadísticas masivamente
 * ✅ RUTA: POST /api/admin/import-stats
 * ✅ OPTIMIZACIÓN: Soporta importación masiva de hasta 3000+ jugadores
 */

import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import * as XLSX from 'xlsx'

// ⏱️ Configuración del route: timeout extendido para importaciones masivas
export const maxDuration = 300 // 5 minutos (máximo en Vercel Hobby plan)
export const dynamic = 'force-dynamic'

interface PlayerImportRow {
  // Campos de identificación y nombres
  old_id?: string | number
  id_player?: string
  player_name?: string
  'wyscout_id 1'?: string | number
  'wyscout_name 1'?: string
  'wyscout_id 2'?: string | number
  'wyscout_name 2'?: string
  id_fmi?: string

  // URLs y referencias
  player_rating?: number
  photo_coverage?: string
  url_trfm_advisor?: string
  url_trfm?: string
  url_secondary?: string
  url_instagram?: string
  video?: string

  // Información personal
  date_of_birth?: string | Date
  correct_date_of_birth?: string | Date
  age?: number
  age_value?: number
  'age_value_%'?: number
  age_coeff?: number
  complete_player_name?: string

  // Posición
  position_player?: string
  correct_position_player?: string
  position_value?: number
  'position_value_%'?: number

  // Características físicas
  foot?: string
  correct_foot?: string
  height?: number
  correct_height?: number

  // Nacionalidad
  nationality_1?: string
  correct_nationality_1?: string
  nationality_value?: number
  'nationality_value_%'?: number
  nationality_2?: string
  correct_nationality_2?: string
  national_tier?: string
  rename_national_tier?: string
  correct_national_tier?: string

  // Equipo
  pre_team?: string
  team_name?: string
  correct_team_name?: string
  team_country?: string
  team_elo?: number
  team_level?: string
  team_level_value?: number
  'team_level_value_%'?: number

  // Competición
  team_competition?: string
  competition_country?: string
  team_competition_value?: number
  'team_competition_value_%'?: number
  competition_tier?: string
  competition_confederation?: string
  competition_elo?: number
  competition_level?: string
  competition_level_value?: number
  'competition_level_value_%'?: number

  // Club propietario y préstamo
  owner_club?: string
  owner_club_country?: string
  owner_club_value?: number
  'owner_club_value_%'?: number
  pre_team_loan_from?: string
  team_loan_from?: string
  correct_team_loan_from?: string
  on_loan?: boolean | string

  // Agencia y contrato
  agency?: string
  correct_agency?: string
  contract_end?: string | Date
  correct_contract_end?: string | Date

  // Valor de mercado y estadísticas
  player_trfm_value?: number
  player_trfm_value_norm?: number
  stats_evo_3m?: number
  player_rating_norm?: number
  total_fmi_pts_norm?: number
  player_elo?: number
  player_level?: string
  player_ranking?: number
  community_potential?: number
  existing_club?: string

  // Estadísticas (campos legacy de stats)
  Player?: string
  'Matches played'?: number
  'Minutes played'?: number
  'Defensive duels per 90'?: number
  'Defensive duels won, %'?: number
  'Aerial duels per 90'?: number
  'Aerial duels won, %'?: number
  'Sliding tackles per 90'?: number
  'Interceptions per 90'?: number
  'Fouls per 90'?: number
  'Yellow cards per 90'?: number
  'Red cards per 90'?: number
  'Goals per 90'?: number
  'Shots per 90'?: number
  'Assists per 90'?: number
  'Crosses per 90'?: number
  'Offensive duels per 90'?: number
  'Offensive duels won, %'?: number
  'Passes per 90'?: number
  'Accurate passes, %'?: number
  'Forward passes per 90'?: number
  'Conceded goals per 90'?: number
  'Shots against per 90'?: number
  'Clean sheets'?: number
  'Save rate, %'?: number
  'Prevented goals per 90'?: number
  id?: string | number // Wyscout ID (campo legacy)
}

/**
 * Helper: Convertir valor a fecha si es válido
 */
function parseDate(value: string | Date | undefined | null): Date | null {
  if (!value) return null
  if (value instanceof Date) return value

  try {
    const date = new Date(value)
    return isNaN(date.getTime()) ? null : date
  } catch {
    return null
  }
}

/**
 * Helper: Convertir valor a booleano
 */
function parseBoolean(value: boolean | string | undefined | null): boolean | null {
  if (value === null || value === undefined) return null
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') {
    const lower = value.toLowerCase()
    if (lower === 'true' || lower === '1' || lower === 'yes' || lower === 'sí') return true
    if (lower === 'false' || lower === '0' || lower === 'no') return false
  }
  return null
}

/**
 * Helper: Convertir valor a número o null
 */
function parseNumber(value: number | string | undefined | null): number | null {
  if (value === null || value === undefined || value === '') return null
  const num = typeof value === 'string' ? parseFloat(value) : value
  return isNaN(num) ? null : num
}

/**
 * Helper: Convertir valor a string o null
 */
function parseString(value: string | number | undefined | null): string | null {
  if (value === null || value === undefined || value === '') return null
  return String(value)
}

/**
 * POST /api/admin/import-stats - Importar estadísticas desde XLS
 */
export async function POST(request: NextRequest) {
  try {
    // 🔐 VERIFICAR AUTENTICACIÓN Y PERMISOS
    const { userId, sessionClaims } = await auth()

    if (!userId) {
      return NextResponse.json(
        { error: 'No autorizado. Debes iniciar sesión.' },
        { status: 401 }
      )
    }

    // 👮‍♂️ VERIFICAR PERMISOS DE ADMIN
    const userRole = (sessionClaims?.public_metadata as { role?: string })?.role
    if (userRole !== 'admin') {
      return NextResponse.json(
        { error: 'Acceso denegado. Solo los administradores pueden importar datos.' },
        { status: 403 }
      )
    }

    // 📝 OBTENER ARCHIVO DEL BODY
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No se proporcionó ningún archivo.' },
        { status: 400 }
      )
    }

    // Verificar que sea un archivo Excel
    const validExtensions = ['.xlsx', '.xls', '.csv']
    const fileExtension = file.name.toLowerCase().match(/\.[^.]+$/)?.[0]
    if (!fileExtension || !validExtensions.includes(fileExtension)) {
      return NextResponse.json(
        { error: 'El archivo debe ser un Excel (.xlsx, .xls) o CSV.' },
        { status: 400 }
      )
    }

    // 📖 LEER ARCHIVO EXCEL
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    const sheetName = workbook.SheetNames[0]
    if (!sheetName) {
      return NextResponse.json(
        { error: 'El archivo no contiene ninguna hoja de cálculo.' },
        { status: 400 }
      )
    }
    const worksheet = workbook.Sheets[sheetName]
    const data: PlayerImportRow[] = XLSX.utils.sheet_to_json(worksheet)

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'El archivo está vacío o no tiene el formato correcto.' },
        { status: 400 }
      )
    }

    const results = {
      success: 0,
      failed: 0,
      created: 0,
      updated: 0,
      errors: [] as string[],
      createdPlayers: [] as string[]
    }

    // 🚀 OPTIMIZACIÓN: Pre-cargar todos los jugadores existentes en memoria
    // Esto evita hacer 3000+ queries individuales
    console.log('📥 Pre-cargando jugadores existentes...')
    const allWyscoutIds = data
      .map(row => parseString(row['wyscout_id 1'] || row.id))
      .filter(Boolean) as string[]

    const existingPlayers = await prisma.jugador.findMany({
      where: {
        OR: [
          { wyscout_id_1: { in: allWyscoutIds } },
          { wyscout_id_2: { in: allWyscoutIds } }
        ]
      },
      select: {
        id_player: true,
        wyscout_id_1: true,
        wyscout_id_2: true,
        player_name: true
      }
    })

    // Crear mapa de búsqueda rápida: wyscoutId -> player
    const playerMap = new Map<string, typeof existingPlayers[0]>()
    existingPlayers.forEach(player => {
      if (player.wyscout_id_1) playerMap.set(player.wyscout_id_1, player)
      if (player.wyscout_id_2) playerMap.set(player.wyscout_id_2, player)
    })

    console.log(`✅ ${existingPlayers.length} jugadores existentes cargados en memoria`)

    // 📦 PROCESAMIENTO POR LOTES (Batch processing)
    const BATCH_SIZE = 100 // Procesar de 100 en 100
    const batches = []
    for (let i = 0; i < data.length; i += BATCH_SIZE) {
      batches.push(data.slice(i, i + BATCH_SIZE))
    }

    console.log(`🔄 Procesando ${data.length} jugadores en ${batches.length} lotes de ${BATCH_SIZE}`)

    // 🔄 PROCESAR CADA LOTE
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex]
      const batchNum = batchIndex + 1

      console.log(`📦 Procesando lote ${batchNum}/${batches.length} (${batch.length} jugadores)`)

      // Procesar cada jugador del lote
      for (const row of batch) {
        // 🔍 DETERMINAR ID DE WYSCOUT (soportar múltiples formatos de columna)
        const wyscoutId = parseString(
          row['wyscout_id 1'] || row.id
        )
        const playerName = parseString(
          row.player_name || row.Player || row['wyscout_name 1']
        )

        if (!wyscoutId) {
          results.failed++
          results.errors.push(`Fila sin ID de Wyscout: ${playerName || 'Desconocido'}`)
          continue
        }

        try {

          // 🔍 BUSCAR JUGADOR EN EL MAPA (O(1) lookup instead of database query!)
          let existingPlayer = playerMap.get(wyscoutId)

          // 📦 PREPARAR DATOS DEL JUGADOR
          const playerData = {
            // Identificación y nombres
            player_name: playerName || `Player ${wyscoutId}`,
            complete_player_name: parseString(row.complete_player_name),
            wyscout_id_1: wyscoutId,
            wyscout_name_1: parseString(row['wyscout_name 1']) || playerName,
            wyscout_id_2: parseString(row['wyscout_id 2']),
            wyscout_name_2: parseString(row['wyscout_name 2']),
            id_fmi: parseString(row.id_fmi),

            // URLs y referencias
            player_rating: parseNumber(row.player_rating),
            photo_coverage: parseString(row.photo_coverage),
            url_trfm_advisor: parseString(row.url_trfm_advisor),
            url_trfm: parseString(row.url_trfm),
            url_secondary: parseString(row.url_secondary),
            url_instagram: parseString(row.url_instagram),
            video: parseString(row.video),

            // Información personal
            date_of_birth: parseDate(row.date_of_birth),
            correct_date_of_birth: parseDate(row.correct_date_of_birth),
            age: parseNumber(row.age) ? Math.round(parseNumber(row.age)!) : null,
            age_value: parseNumber(row.age_value),
            age_value_percent: parseNumber(row['age_value_%']),
            age_coeff: parseNumber(row.age_coeff),

            // Posición
            position_player: parseString(row.position_player),
            correct_position_player: parseString(row.correct_position_player),
            position_value: parseNumber(row.position_value),
            position_value_percent: parseNumber(row['position_value_%']),

            // Características físicas
            foot: parseString(row.foot),
            correct_foot: parseString(row.correct_foot),
            height: parseNumber(row.height),
            correct_height: parseNumber(row.correct_height),

            // Nacionalidad
            nationality_1: parseString(row.nationality_1),
            correct_nationality_1: parseString(row.correct_nationality_1),
            nationality_value: parseNumber(row.nationality_value),
            nationality_value_percent: parseNumber(row['nationality_value_%']),
            nationality_2: parseString(row.nationality_2),
            correct_nationality_2: parseString(row.correct_nationality_2),
            national_tier: parseString(row.national_tier),
            rename_national_tier: parseString(row.rename_national_tier),
            correct_national_tier: parseString(row.correct_national_tier),

            // Equipo
            pre_team: parseString(row.pre_team),
            team_name: parseString(row.team_name),
            correct_team_name: parseString(row.correct_team_name),
            team_country: parseString(row.team_country),
            team_elo: parseNumber(row.team_elo),
            team_level: parseString(row.team_level),
            team_level_value: parseNumber(row.team_level_value),
            team_level_value_percent: parseNumber(row['team_level_value_%']),

            // Competición
            team_competition: parseString(row.team_competition),
            competition_country: parseString(row.competition_country),
            team_competition_value: parseNumber(row.team_competition_value),
            team_competition_value_percent: parseNumber(row['team_competition_value_%']),
            competition_tier: parseString(row.competition_tier),
            competition_confederation: parseString(row.competition_confederation),
            competition_elo: parseNumber(row.competition_elo),
            competition_level: parseString(row.competition_level),
            competition_level_value: parseNumber(row.competition_level_value),
            competition_level_value_percent: parseNumber(row['competition_level_value_%']),

            // Club propietario y préstamo
            owner_club: parseString(row.owner_club),
            owner_club_country: parseString(row.owner_club_country),
            owner_club_value: parseNumber(row.owner_club_value),
            owner_club_value_percent: parseNumber(row['owner_club_value_%']),
            pre_team_loan_from: parseString(row.pre_team_loan_from),
            team_loan_from: parseString(row.team_loan_from),
            correct_team_loan_from: parseString(row.correct_team_loan_from),
            on_loan: parseBoolean(row.on_loan),

            // Agencia y contrato
            agency: parseString(row.agency),
            correct_agency: parseString(row.correct_agency),
            contract_end: parseDate(row.contract_end),
            correct_contract_end: parseDate(row.correct_contract_end),

            // Valor de mercado y estadísticas
            player_trfm_value: parseNumber(row.player_trfm_value),
            player_trfm_value_norm: parseNumber(row.player_trfm_value_norm),
            stats_evo_3m: parseNumber(row.stats_evo_3m),
            player_rating_norm: parseNumber(row.player_rating_norm),
            total_fmi_pts_norm: parseNumber(row.total_fmi_pts_norm),
            player_elo: parseNumber(row.player_elo),
            player_level: parseString(row.player_level),
            player_ranking: parseNumber(row.player_ranking) ? Math.round(parseNumber(row.player_ranking)!) : null,
            community_potential: parseNumber(row.community_potential),
            existing_club: parseString(row.existing_club),
          }

          let player: { id_player: string } | null = null

          // 🆕 SI NO EXISTE, CREAR JUGADOR AUTOMÁTICAMENTE
          if (!existingPlayer) {
            try {
              player = await prisma.jugador.create({
                data: playerData,
                select: { id_player: true }
              })
              // Añadir al mapa para futuras referencias
              playerMap.set(wyscoutId, {
                id_player: player.id_player,
                wyscout_id_1: wyscoutId,
                wyscout_id_2: null,
                player_name: playerName || `Player ${wyscoutId}`
              })
              results.created++
              if (results.createdPlayers.length < 50) { // Limitar a 50 para evitar memoria
                results.createdPlayers.push(`${playerName} (Wyscout ID: ${wyscoutId})`)
              }
            } catch (createError) {
              results.failed++
              const errorMsg = createError instanceof Error ? createError.message : 'Unknown error'
              results.errors.push(
                `Error creando jugador ${playerName} (Wyscout ID ${wyscoutId}): ${errorMsg}`
              )
              continue
            }
          } else {
            // 🔄 SI YA EXISTE, ACTUALIZAR CAMPOS DEL JUGADOR
            try {
              await prisma.jugador.update({
                where: { id_player: existingPlayer.id_player },
                data: playerData
              })
              player = { id_player: existingPlayer.id_player }
              results.updated++
            } catch (updateError) {
              console.warn(`⚠️ Error actualizando jugador ${existingPlayer.player_name}:`, updateError)
              player = { id_player: existingPlayer.id_player }
              // No marcamos como error, continuamos con las estadísticas
            }
          }

          // Si no tenemos un jugador válido, saltar
          if (!player) continue

          // 🔄 ACTUALIZAR/CREAR ESTADÍSTICAS (solo si hay campos de stats en el XLS)
          if (row['Matches played'] || row['Goals per 90'] || row['Passes per 90']) {
            try {
              await prisma.playerStats3m.upsert({
                where: {
                  id_player: player.id_player
                },
          update: {
            // Partidos y minutos
            matches_played_tot_3m: Math.round(row['Matches played'] || 0),
            minutes_played_tot_3m: Math.round(row['Minutes played'] || 0),

            // Duelos defensivos
            def_duels_p90_3m: row['Defensive duels per 90'] || null,
            def_duels_won_percent_3m: row['Defensive duels won, %'] || null,

            // Duelos aéreos
            aerials_duels_p90_3m: row['Aerial duels per 90'] || null,
            aerials_duels_won_percent_3m: row['Aerial duels won, %'] || null,

            // Tackles e intercepciones
            tackles_p90_3m: row['Sliding tackles per 90'] || null,
            interceptions_p90_3m: row['Interceptions per 90'] || null,

            // Faltas y tarjetas
            fouls_p90_3m: row['Fouls per 90'] || null,
            yellow_cards_p90_3m: row['Yellow cards per 90'] || null,
            red_cards_p90_3m: row['Red cards per 90'] || null,

            // Goles y tiros
            goals_p90_3m: row['Goals per 90'] || null,
            shots_p90_3m: row['Shots per 90'] || null,

            // Asistencias y centros
            assists_p90_3m: row['Assists per 90'] || null,
            crosses_p90_3m: row['Crosses per 90'] || null,

            // Duelos ofensivos
            off_duels_p90_3m: row['Offensive duels per 90'] || null,
            off_duels_won_percent_3m: row['Offensive duels won, %'] || null,

            // Pases
            passes_p90_3m: row['Passes per 90'] || null,
            accurate_passes_percent_3m: row['Accurate passes, %'] || null,
            forward_passes_p90_3m: row['Forward passes per 90'] || null,

            // Porteros
            conceded_goals_p90_3m: row['Conceded goals per 90'] || null,
            shots_against_p90_3m: row['Shots against per 90'] || null,
            clean_sheets_tot_3m: Math.round(row['Clean sheets'] || 0),
            save_rate_percent_3m: row['Save rate, %'] || null,
            prevented_goals_p90_3m: row['Prevented goals per 90'] || null
          },
          create: {
            id_player: player.id_player,

            // Partidos y minutos
            matches_played_tot_3m: Math.round(row['Matches played'] || 0),
            minutes_played_tot_3m: Math.round(row['Minutes played'] || 0),

            // Duelos defensivos
            def_duels_p90_3m: row['Defensive duels per 90'] || null,
            def_duels_won_percent_3m: row['Defensive duels won, %'] || null,

            // Duelos aéreos
            aerials_duels_p90_3m: row['Aerial duels per 90'] || null,
            aerials_duels_won_percent_3m: row['Aerial duels won, %'] || null,

            // Tackles e intercepciones
            tackles_p90_3m: row['Sliding tackles per 90'] || null,
            interceptions_p90_3m: row['Interceptions per 90'] || null,

            // Faltas y tarjetas
            fouls_p90_3m: row['Fouls per 90'] || null,
            yellow_cards_p90_3m: row['Yellow cards per 90'] || null,
            red_cards_p90_3m: row['Red cards per 90'] || null,

            // Goles y tiros
            goals_p90_3m: row['Goals per 90'] || null,
            shots_p90_3m: row['Shots per 90'] || null,

            // Asistencias y centros
            assists_p90_3m: row['Assists per 90'] || null,
            crosses_p90_3m: row['Crosses per 90'] || null,

            // Duelos ofensivos
            off_duels_p90_3m: row['Offensive duels per 90'] || null,
            off_duels_won_percent_3m: row['Offensive duels won, %'] || null,

            // Pases
            passes_p90_3m: row['Passes per 90'] || null,
            accurate_passes_percent_3m: row['Accurate passes, %'] || null,
            forward_passes_p90_3m: row['Forward passes per 90'] || null,

            // Porteros
            conceded_goals_p90_3m: row['Conceded goals per 90'] || null,
            shots_against_p90_3m: row['Shots against per 90'] || null,
            clean_sheets_tot_3m: Math.round(row['Clean sheets'] || 0),
            save_rate_percent_3m: row['Save rate, %'] || null,
            prevented_goals_p90_3m: row['Prevented goals per 90'] || null
          }
        })
      } catch (statsError) {
        console.warn(`⚠️ Error actualizando estadísticas para jugador ${player.id_player}:`, statsError)
        // No marcamos como error total, el jugador fue creado/actualizado correctamente
      }
    }

    results.success++

  } catch (error) {
    results.failed++
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    results.errors.push(
      `Error procesando jugador ${playerName || wyscoutId}: ${errorMsg}`
    )
  }
}

      // Log de progreso cada lote
      console.log(`✅ Lote ${batchNum}/${batches.length} completado. Total: ${results.success} exitosos, ${results.failed} fallidos`)
    }

    // 📊 LOG DE AUDITORÍA
    console.log('✅ Stats Import completed:', {
      totalProcessed: data.length,
      successful: results.success,
      failed: results.failed,
      created: results.created,
      updated: results.updated,
      importedBy: userId,
      timestamp: new Date().toISOString()
    })

    // Construir mensaje descriptivo
    const messageParts = [`Importación completada: ${results.success} exitosos, ${results.failed} fallidos`]
    if (results.created > 0) {
      messageParts.push(`${results.created} jugadores nuevos creados`)
    }
    if (results.updated > 0) {
      messageParts.push(`${results.updated} jugadores actualizados`)
    }
    const message = messageParts.join(' | ')

    return NextResponse.json({
      success: true,
      message,
      results
    }, { status: 200 })

  } catch (error) {
    console.error('❌ Error in Stats import:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor durante la importación.' },
      { status: 500 }
    )
  }
}
