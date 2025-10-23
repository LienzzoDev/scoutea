/**
 * 📥 UNIFIED ENDPOINT FOR MULTI-PERIOD PLAYER STATISTICS IMPORT
 *
 * ✅ PROPÓSITO: Importar estadísticas de jugadores desde Excel para múltiples períodos
 * ✅ BENEFICIO: Permite importar stats de 3M, 6M, 1Y, 2Y desde un solo endpoint
 * ✅ RUTA: POST /api/admin/import-player-stats?period=3m|6m|1y|2y
 * ✅ OPTIMIZACIÓN: Soporta importación masiva con SSE streaming
 */

import { auth } from '@clerk/nextjs/server'
import { Decimal } from '@prisma/client/runtime/library'
import { NextRequest } from 'next/server'
import * as XLSX from 'xlsx'

import { prisma } from '@/lib/db'
import {
  type StatsPeriod,
  getExcelSheetName,
  getPeriodLabel,
  getPrismaTableByPeriod,
  isValidPeriod,
} from '@/lib/utils/stats-period-utils'

// ⏱️ Configuración del route: timeout extendido para importaciones masivas
export const maxDuration = 300 // 5 minutos (máximo en Vercel Hobby plan)
export const dynamic = 'force-dynamic'

interface PlayerStatsImportRow {
  // Identificadores
  id_player?: string
  wyscout_id?: string | number

  // Evolución de stats (campo dinámico según período)
  stats_evo_3m?: number
  stats_evo_6m?: number
  stats_evo_1y?: number
  stats_evo_2y?: number

  // Partidos y minutos
  [key: string]: string | number | undefined
}

/**
 * Helper: Convertir valor a Decimal de Prisma o null
 */
function parseDecimal(value: number | string | undefined | null): Decimal | null {
  if (value === null || value === undefined || value === '') return null
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return null
  return new Decimal(num)
}

/**
 * Helper: Convertir valor a número entero o null
 */
function parseInteger(value: number | string | undefined | null): number | null {
  if (value === null || value === undefined || value === '') return null
  const num = typeof value === 'string' ? parseInt(value, 10) : Math.round(value)
  return isNaN(num) ? null : num
}

/**
 * Helper: Convertir valor a string o null
 */
function parseString(value: string | number | undefined | null): string | null {
  if (value === null || value === undefined || value === '') return null
  return String(value).trim()
}

/**
 * Helper: Convertir valor a BigInt o null
 */
function parseBigInt(value: string | number | undefined | null): bigint | null {
  if (value === null || value === undefined || value === '') return null
  try {
    return BigInt(value)
  } catch {
    return null
  }
}

/**
 * Helper: Enviar evento SSE
 */
function sendSSE(controller: ReadableStreamDefaultController, data: any) {
  const message = `data: ${JSON.stringify(data)}\n\n`
  controller.enqueue(new TextEncoder().encode(message))
}

/**
 * Helper: Mapear los datos del Excel a los campos de la base de datos según el período
 */
function mapRowToStatsData(row: PlayerStatsImportRow, period: StatsPeriod): Record<string, any> {
  const suffix = period
  const wyscoutId = parseString(row.wyscout_id as string | number)

  // Crear objeto de datos con mapeo dinámico según período
  const statsData: Record<string, any> = {
    wyscout_id: wyscoutId ? parseBigInt(wyscoutId) : null,
    [`stats_evo_${suffix}`]: parseDecimal(row[`stats_evo_${suffix}`]),

    // Partidos y minutos
    [`matches_played_tot_${suffix}`]: parseInteger(row[`matches_played_tot_${suffix}`]),
    [`matches_played_tot_${suffix}_norm`]: parseDecimal(row[`matches_played_tot_${suffix}_norm`]),
    [`matches_played_tot_${suffix}_rank`]: parseInteger(row[`matches_played_tot_${suffix}_rank`]),
    [`minutes_played_tot_${suffix}`]: parseInteger(row[`minutes_played_tot_${suffix}`]),
    [`minutes_played_tot_${suffix}_norm`]: parseDecimal(row[`minutes_played_tot_${suffix}_norm`]),
    [`minutes_played_tot_${suffix}_rank`]: parseInteger(row[`minutes_played_tot_${suffix}_rank`]),

    // Goles
    [`goals_p90_${suffix}`]: parseDecimal(row[`goals_p90_${suffix}`]),
    [`goals_p90_${suffix}_norm`]: parseDecimal(row[`goals_p90_${suffix}_norm`]),
    [`goals_p90_${suffix}_rank`]: parseInteger(row[`goals_p90_${suffix}_rank`]),
    [`goals_tot_${suffix}`]: parseInteger(row[`goals_tot_${suffix}`]),
    [`goals_tot_${suffix}_norm`]: parseDecimal(row[`goals_tot_${suffix}_norm`]),

    // Asistencias
    [`assists_p90_${suffix}`]: parseDecimal(row[`assists_p90_${suffix}`]),
    [`assists_p90_${suffix}_norm`]: parseDecimal(row[`assists_p90_${suffix}_norm`]),
    [`assists_p90_${suffix}_rank`]: parseInteger(row[`assists_p90_${suffix}_rank`]),
    [`assists_tot_${suffix}`]: parseInteger(row[`assists_tot_${suffix}`]),
    [`assists_tot_${suffix}_norm`]: parseDecimal(row[`assists_tot_${suffix}_norm`]),

    // Tarjetas amarillas
    [`yellow_cards_p90_${suffix}`]: parseDecimal(row[`yellow_cards_p90_${suffix}`]),
    [`yellow_cards_p90_${suffix}_norm`]: parseDecimal(row[`yellow_cards_p90_${suffix}_norm`]),
    yellow_cards_p90_rank: parseInteger(row.yellow_cards_p90_rank),
    [`yellow_cards_p90_${suffix}_norm_neg`]: parseDecimal(row[`yellow_cards_p90_${suffix}_norm_neg`]),
    [`yellow_cards_tot_${suffix}`]: parseInteger(row[`yellow_cards_tot_${suffix}`]),
    [`yellow_cards_tot_${suffix}_norm`]: parseDecimal(row[`yellow_cards_tot_${suffix}_norm`]),

    // Tarjetas rojas
    [`red_cards_p90_${suffix}`]: parseDecimal(row[`red_cards_p90_${suffix}`]),
    [`red_cards_p90_${suffix}_norm`]: parseDecimal(row[`red_cards_p90_${suffix}_norm`]),
    red_cards_p90_rank: parseInteger(row.red_cards_p90_rank),
    [`red_cards_p90_${suffix}_norm_neg`]: parseDecimal(row[`red_cards_p90_${suffix}_norm_neg`]),
    [`red_cards_tot_${suffix}`]: parseInteger(row[`red_cards_tot_${suffix}`]),
    [`red_cards_tot_${suffix}_norm`]: parseDecimal(row[`red_cards_tot_${suffix}_norm`]),

    // Goles concedidos (porteros)
    [`conceded_goals_p90_${suffix}`]: parseDecimal(row[`conceded_goals_p90_${suffix}`]),
    [`conceded_goals_p90_${suffix}_norm`]: parseDecimal(row[`conceded_goals_p90_${suffix}_norm`]),
    [`conceded_goals_p90_${suffix}_rank`]: parseInteger(row[`conceded_goals_p90_${suffix}_rank`]),
    [`conceded_goals_p90_${suffix}_norm_neg`]: parseDecimal(row[`conceded_goals_p90_${suffix}_norm_neg`]),
    [`conceded_goals_tot_${suffix}`]: parseInteger(row[`conceded_goals_tot_${suffix}`]),
    [`conceded_goals_tot_${suffix}_norm`]: parseDecimal(row[`conceded_goals_tot_${suffix}_norm`]),

    // Goles prevenidos (porteros)
    [`prevented_goals_p90_${suffix}`]: parseDecimal(row[`prevented_goals_p90_${suffix}`]),
    [`prevented_goals_p90_${suffix}_norm`]: parseDecimal(row[`prevented_goals_p90_${suffix}_norm`]),
    prevented_goals_p90_rank: parseInteger(row.prevented_goals_p90_rank),
    [`prevented_goals_tot_${suffix}`]: parseDecimal(row[`prevented_goals_tot_${suffix}`]),
    [`prevented_goals_tot_${suffix}_norm`]: parseDecimal(row[`prevented_goals_tot_${suffix}_norm`]),

    // Tiros contra (porteros)
    [`shots_against_p90_${suffix}`]: parseDecimal(row[`shots_against_p90_${suffix}`]),
    [`shots_against_p90_${suffix}_norm`]: parseDecimal(row[`shots_against_p90_${suffix}_norm`]),
    [`shots_against_p90_${suffix}_rank`]: parseInteger(row[`shots_against_p90_${suffix}_rank`]),
    [`shots_against_tot_${suffix}`]: parseInteger(row[`shots_against_tot_${suffix}`]),
    [`shots_against_tot_${suffix}_norm`]: parseDecimal(row[`shots_against_tot_${suffix}_norm`]),

    // Clean sheets (porteros) - Nota: columnas con % en el Excel
    [`clean_sheets_percent_${suffix}`]: parseDecimal(row[`clean_sheets_%${suffix}`]),
    [`clean_sheets_percent_${suffix}_norm`]: parseDecimal(row[`clean_sheets%${suffix}_norm`]),
    [`clean_sheets_percent_${suffix}_rank`]: parseInteger(row[`clean_sheets%${suffix}_rank`]),
    [`clean_sheets_tot_${suffix}`]: parseInteger(row[`clean_sheets_tot_${suffix}`]),
    [`clean_sheets_tot_${suffix}_norm`]: parseDecimal(row[`clean_sheets_tot_${suffix}_norm`]),

    // Save rate (porteros) - Nota: columnas con % en el Excel
    [`save_rate_percent_${suffix}`]: parseDecimal(row[`save_rate%${suffix}`]),
    [`save_rate_percent_${suffix}_norm`]: parseDecimal(row[`save_rate%${suffix}_norm`]),
    [`save_rate_percent_${suffix}_rank`]: parseInteger(row[`save_rate%${suffix}_rank`]),

    // Tackles
    [`tackles_p90_${suffix}`]: parseDecimal(row[`tackles_p90_${suffix}`]),
    [`tackles_p90_${suffix}_norm`]: parseDecimal(row[`tackles_p90_${suffix}_norm`]),
    [`tackles_p90_${suffix}_rank`]: parseInteger(row[`tackles_p90_${suffix}_rank`]),
    [`tackles_tot_${suffix}`]: parseInteger(row[`tackles_tot_${suffix}`]),
    [`tackles_tot_${suffix}_norm`]: parseDecimal(row[`tackles_tot_${suffix}_norm`]),

    // Intercepciones
    [`interceptions_p90_${suffix}`]: parseDecimal(row[`interceptions_p90_${suffix}`]),
    [`interceptions_p90_${suffix}_norm`]: parseDecimal(row[`interceptions_p90_${suffix}_norm`]),
    [`interceptions_p90_${suffix}_rank`]: parseInteger(row[`interceptions_p90_${suffix}_rank`]),
    [`interceptions_tot_${suffix}`]: parseInteger(row[`interceptions_tot_${suffix}`]),
    [`interceptions_tot_${suffix}_norm`]: parseDecimal(row[`interceptions_tot_${suffix}_norm`]),

    // Faltas
    [`fouls_p90_${suffix}`]: parseDecimal(row[`fouls_p90_${suffix}`]),
    [`fouls_p90_${suffix}_norm`]: parseDecimal(row[`fouls_p90_${suffix}_norm`]),
    [`fouls_p90_${suffix}_rank`]: parseInteger(row[`fouls_p90_${suffix}_rank`]),
    [`fouls_p90_${suffix}_norm_neg`]: parseDecimal(row[`fouls_p90_${suffix}_norm_neg`]),
    [`fouls_tot_${suffix}`]: parseInteger(row[`fouls_tot_${suffix}`]),
    [`fouls_tot_${suffix}_norm`]: parseDecimal(row[`fouls_tot_${suffix}_norm`]),

    // Pases
    [`passes_p90_${suffix}`]: parseDecimal(row[`passes_p90_${suffix}`]),
    [`passes_p90_${suffix}_norm`]: parseDecimal(row[`passes_p90_${suffix}_norm`]),
    [`passes_p90_${suffix}_rank`]: parseInteger(row[`passes_p90_${suffix}_rank`]),
    [`passes_tot_${suffix}`]: parseInteger(row[`passes_tot_${suffix}`]),
    [`passes_tot_${suffix}_norm`]: parseDecimal(row[`passes_tot_${suffix}_norm`]),

    // Pases hacia adelante
    [`forward_passes_p90_${suffix}`]: parseDecimal(row[`forward_passes_p90_${suffix}`]),
    [`forward_passes_p90_${suffix}_norm`]: parseDecimal(row[`forward_passes_p90_${suffix}_norm`]),
    [`forward_passes_p90_${suffix}_rank`]: parseInteger(row[`forward_passes_p90_${suffix}_rank`]),
    [`forward_passes_tot_${suffix}`]: parseInteger(row[`forward_passes_tot_${suffix}`]),
    [`forward_passes_tot_${suffix}_norm`]: parseDecimal(row[`forward_passes_tot_${suffix}_norm`]),

    // Centros
    [`crosses_p90_${suffix}`]: parseDecimal(row[`crosses_p90_${suffix}`]),
    [`crosses_p90_${suffix}_norm`]: parseDecimal(row[`crosses_p90_${suffix}_norm`]),
    [`crosses_p90_${suffix}_rank`]: parseInteger(row[`crosses_p90_${suffix}_rank`]),
    [`crosses_tot_${suffix}`]: parseInteger(row[`crosses_tot_${suffix}`]),
    [`crosses_tot_${suffix}_norm`]: parseDecimal(row[`crosses_tot_${suffix}_norm`]),

    // Pases precisos - Nota: columnas con % en el Excel
    [`accurate_passes_percent_${suffix}`]: parseDecimal(row[`accurate_passes%${suffix}`]),
    [`accurate_passes_percent_${suffix}_norm`]: parseDecimal(row[`accurate_passes%${suffix}_norm`]),
    [`accurate_passes_percent_${suffix}_rank`]: parseInteger(row[`accurate_passes%${suffix}_rank`]),

    // Tiros
    [`shots_p90_${suffix}`]: parseDecimal(row[`shots_p90_${suffix}`]),
    [`shots_p90_${suffix}_norm`]: parseDecimal(row[`shots_p90_${suffix}_norm`]),
    [`shots_p90_${suffix}_rank`]: parseInteger(row[`shots_p90_${suffix}_rank`]),
    [`shots_tot_${suffix}`]: parseInteger(row[`shots_tot_${suffix}`]),
    [`shots_tot_${suffix}_norm`]: parseDecimal(row[`shots_tot_${suffix}_norm`]),

    // Efectividad - Nota: columnas con % en el Excel
    [`effectiveness_percent_${suffix}`]: parseDecimal(row[`effectiveness%${suffix}`]),
    [`effectiveness_percent_${suffix}_norm`]: parseDecimal(row[`effectiveness%${suffix}_norm`]),
    [`effectiveness_percent_${suffix}_rank`]: parseInteger(row[`effectiveness%${suffix}_rank`]),

    // Duelos ofensivos
    [`off_duels_p90_${suffix}`]: parseDecimal(row[`off_duels_p90_${suffix}`]),
    [`off_duels_p90_${suffix}_norm`]: parseDecimal(row[`off_duels_p90_${suffix}_norm`]),
    [`off_duels_p90_${suffix}_rank`]: parseInteger(row[`off_duels_p90_${suffix}_rank`]),
    [`off_duels_tot_${suffix}`]: parseInteger(row[`off_duels_tot_${suffix}`]),
    [`off_duels_tot_${suffix}_norm`]: parseDecimal(row[`off_duels_tot_${suffix}_norm`]),
    [`off_duels_won_percent_${suffix}`]: parseDecimal(row[`off_duels_won%${suffix}`]),
    [`off_duels_won_percent_${suffix}_norm`]: parseDecimal(row[`off_duels_won%${suffix}_norm`]),
    [`off_duels_won_percent_${suffix}_rank`]: parseInteger(row[`off_duels_won%${suffix}_rank`]),

    // Duelos defensivos
    [`def_duels_p90_${suffix}`]: parseDecimal(row[`def_duels_p90_${suffix}`]),
    [`def_duels_p90_${suffix}_norm`]: parseDecimal(row[`def_duels_p90_${suffix}_norm`]),
    [`def_duels_p90_${suffix}_rank`]: parseInteger(row[`def_duels_p90_${suffix}_rank`]),
    [`def_duels_tot_${suffix}`]: parseInteger(row[`def_duels_tot_${suffix}`]),
    [`def_duels_tot_${suffix}_norm`]: parseDecimal(row[`def_duels_tot_${suffix}_norm`]),
    [`def_duels_won_percent_${suffix}`]: parseDecimal(row[`def_duels_won%${suffix}`]),
    [`def_duels_won_percent_${suffix}_norm`]: parseDecimal(row[`def_duels_won%${suffix}_norm`]),
    [`def_duels_won_percent_${suffix}_rank`]: parseInteger(row[`def_duels_won%${suffix}_rank`]),

    // Duelos aéreos
    [`aerials_duels_p90_${suffix}`]: parseDecimal(row[`aerials_duels_p90_${suffix}`]),
    [`aerials_duels_p90_${suffix}_norm`]: parseDecimal(row[`aerials_duels_p90_${suffix}_norm`]),
    [`aerials_duels_p90_${suffix}_rank`]: parseInteger(row[`aerials_duels_p90_${suffix}_rank`]),
    [`aerials_duels_tot_${suffix}`]: parseInteger(row[`aerials_duels_tot_${suffix}`]),
    [`aerials_duels_tot_${suffix}_norm`]: parseDecimal(row[`aerials_duels_tot_${suffix}_norm`]),
    [`aerials_duels_won_percent_${suffix}`]: parseDecimal(row[`aerials_duels_won%${suffix}`]),
    [`aerials_duels_won_percent_${suffix}_norm`]: parseDecimal(row[`aerials_duels_won%${suffix}_norm`]),
    [`aerials_duels_won_percent_${suffix}_rank`]: parseInteger(row[`aerials_duels_won%_${suffix}_rank`]),
  }

  return statsData
}

/**
 * POST /api/admin/import-player-stats - Importar estadísticas multi-período desde Excel
 */
export async function POST(request: NextRequest) {
  try {
    // 🔐 VERIFICAR AUTENTICACIÓN Y PERMISOS
    const { userId, sessionClaims } = await auth()

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'No autorizado. Debes iniciar sesión.' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // 👮‍♂️ VERIFICAR PERMISOS DE ADMIN
    const userRole = (sessionClaims?.public_metadata as { role?: string })?.role
    if (userRole !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Acceso denegado. Solo los administradores pueden importar datos.' }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // 📝 OBTENER PERÍODO DEL QUERY PARAM
    const { searchParams } = new URL(request.url)
    const periodParam = searchParams.get('period')

    if (!periodParam || !isValidPeriod(periodParam)) {
      return new Response(
        JSON.stringify({ error: 'Período inválido. Debe ser: 3m, 6m, 1y, o 2y' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    const period: StatsPeriod = periodParam

    // 📝 OBTENER ARCHIVO DEL BODY
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return new Response(
        JSON.stringify({ error: 'No se proporcionó ningún archivo.' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // Verificar que sea un archivo Excel
    const validExtensions = ['.xlsx', '.xls', '.csv']
    const fileExtension = file.name.toLowerCase().match(/\.[^.]+$/)?.[0]
    if (!fileExtension || !validExtensions.includes(fileExtension)) {
      return new Response(
        JSON.stringify({ error: 'El archivo debe ser un Excel (.xlsx, .xls) o CSV.' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // 📖 LEER ARCHIVO EXCEL
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const workbook = XLSX.read(buffer, { type: 'buffer' })

    // Intentar encontrar la hoja correcta (buscar por nombre del período)
    const expectedSheetName = getExcelSheetName(period)
    let sheetName = workbook.SheetNames.find(name => name.toUpperCase() === expectedSheetName)

    // Si no se encuentra, usar la primera hoja
    if (!sheetName) {
      sheetName = workbook.SheetNames[0]
      console.warn(
        `⚠️ Hoja "${expectedSheetName}" no encontrada. Usando hoja: "${sheetName}"`
      )
    }

    if (!sheetName) {
      return new Response(
        JSON.stringify({ error: 'El archivo no contiene ninguna hoja de cálculo.' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    const worksheet = workbook.Sheets[sheetName]
    const data: PlayerStatsImportRow[] = XLSX.utils.sheet_to_json(worksheet)

    if (!data || data.length === 0) {
      return new Response(
        JSON.stringify({ error: 'El archivo está vacío o no tiene el formato correcto.' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // 🌊 CREAR STREAM PARA SSE
    const stream = new ReadableStream({
      async start(controller) {
        const results = {
          success: 0,
          failed: 0,
          created: 0,
          updated: 0,
          notFound: 0,
          errors: [] as string[],
        }

        try {
          // Enviar inicio
          sendSSE(controller, {
            type: 'start',
            total: data.length,
            period,
            periodLabel: getPeriodLabel(period),
            message: `📥 Iniciando importación de ${data.length} registros para período: ${getPeriodLabel(period)}...`,
          })

          // 🚀 OPTIMIZACIÓN: Pre-cargar todos los jugadores existentes en memoria
          sendSSE(controller, {
            type: 'info',
            message: '🔍 Cargando jugadores existentes en la base de datos...',
          })

          const allPlayerIds = data.map(row => parseString(row.id_player)).filter(Boolean) as string[]

          const allWyscoutIds = data
            .map(row => {
              const wyscoutId = row.wyscout_id
              if (wyscoutId) {
                return String(wyscoutId)
              }
              return null
            })
            .filter(Boolean) as string[]

          const existingPlayers = await prisma.jugador.findMany({
            where: {
              OR: [{ id_player: { in: allPlayerIds } }, { wyscout_id_1: { in: allWyscoutIds } }, { wyscout_id_2: { in: allWyscoutIds } }],
            },
            select: {
              id_player: true,
              wyscout_id_1: true,
              wyscout_id_2: true,
              player_name: true,
            },
          })

          // Crear mapas de búsqueda rápida
          const playerByIdMap = new Map<string, (typeof existingPlayers)[0]>()
          const playerByWyscoutMap = new Map<string, (typeof existingPlayers)[0]>()

          existingPlayers.forEach(player => {
            playerByIdMap.set(player.id_player, player)
            if (player.wyscout_id_1) playerByWyscoutMap.set(player.wyscout_id_1, player)
            if (player.wyscout_id_2) playerByWyscoutMap.set(player.wyscout_id_2, player)
          })

          sendSSE(controller, {
            type: 'info',
            message: `✅ ${existingPlayers.length} jugadores existentes cargados en memoria`,
          })

          // 📦 PROCESAMIENTO POR LOTES (Batch processing)
          const BATCH_SIZE = 100 // Procesar de 100 en 100
          const batches = []
          for (let i = 0; i < data.length; i += BATCH_SIZE) {
            batches.push(data.slice(i, i + BATCH_SIZE))
          }

          sendSSE(controller, {
            type: 'info',
            message: `📦 Procesando ${data.length} registros en ${batches.length} lotes de hasta ${BATCH_SIZE}`,
          })

          // 🔄 PROCESAR CADA LOTE
          const statsTable = getPrismaTableByPeriod(period)

          for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
            const batch = batches[batchIndex]
            const batchNum = batchIndex + 1

            sendSSE(controller, {
              type: 'batch_start',
              batchNum,
              totalBatches: batches.length,
              message: `🔄 Procesando lote ${batchNum}/${batches.length}...`,
            })

            // Procesar cada registro del lote
            for (const row of batch) {
              const playerId = parseString(row.id_player)
              const wyscoutId = parseString(row.wyscout_id as string | number)

              if (!playerId && !wyscoutId) {
                results.failed++
                results.errors.push('Fila sin id_player ni wyscout_id')
                sendSSE(controller, {
                  type: 'error',
                  message: '⚠️ Fila sin identificador de jugador',
                })
                continue
              }

              try {
                // 🔍 BUSCAR JUGADOR EN LOS MAPAS (O(1) lookup)
                let player = playerId ? playerByIdMap.get(playerId) : null
                if (!player && wyscoutId) {
                  player = playerByWyscoutMap.get(wyscoutId)
                }

                if (!player) {
                  results.notFound++
                  results.errors.push(`Jugador no encontrado: ${playerId || wyscoutId}`)
                  sendSSE(controller, {
                    type: 'player_not_found',
                    identifier: playerId || wyscoutId,
                    message: `⚠️ Jugador no encontrado: ${playerId || wyscoutId}`,
                  })
                  continue
                }

                // 📦 PREPARAR DATOS DE ESTADÍSTICAS
                const statsData = mapRowToStatsData(row, period)

                // 🔄 UPSERT EN LA BASE DE DATOS
                try {
                  const existingStats = await statsTable.findUnique({
                    where: { id_player: player.id_player },
                  })

                  await statsTable.upsert({
                    where: { id_player: player.id_player },
                    update: statsData,
                    create: {
                      id_player: player.id_player,
                      ...statsData,
                    },
                  })

                  if (existingStats) {
                    results.updated++
                    sendSSE(controller, {
                      type: 'stats_updated',
                      playerId: player.id_player,
                      playerName: player.player_name,
                      message: `🔄 Stats actualizadas: ${player.player_name}`,
                    })
                  } else {
                    results.created++
                    sendSSE(controller, {
                      type: 'stats_created',
                      playerId: player.id_player,
                      playerName: player.player_name,
                      message: `🆕 Stats creadas: ${player.player_name}`,
                    })
                  }

                  results.success++
                } catch (dbError) {
                  results.failed++
                  const errorMsg = dbError instanceof Error ? dbError.message : 'Unknown error'
                  results.errors.push(
                    `Error en DB para jugador ${player.player_name} (${player.id_player}): ${errorMsg}`
                  )
                  sendSSE(controller, {
                    type: 'error',
                    message: `❌ Error DB en ${player.player_name}: ${errorMsg}`,
                  })
                }

                // Enviar progreso cada 10 registros
                const currentProgress = batchIndex * BATCH_SIZE + batch.indexOf(row) + 1
                if (currentProgress % 10 === 0 || currentProgress === data.length) {
                  sendSSE(controller, {
                    type: 'progress',
                    current: currentProgress,
                    total: data.length,
                    percentage: Math.round((currentProgress / data.length) * 100),
                  })
                }
              } catch (error) {
                results.failed++
                const errorMsg = error instanceof Error ? error.message : 'Unknown error'
                results.errors.push(`Error procesando registro: ${errorMsg}`)
                sendSSE(controller, {
                  type: 'error',
                  message: `❌ Error: ${errorMsg}`,
                })
              }
            }

            // Log de progreso del lote
            sendSSE(controller, {
              type: 'batch',
              batchNum,
              totalBatches: batches.length,
              message: `✅ Lote ${batchNum}/${batches.length} completado`,
            })
          }

          // 📊 RESULTADO FINAL
          const messageParts = [`Importación completada: ${results.success} exitosos, ${results.failed} fallidos`]
          if (results.created > 0) {
            messageParts.push(`${results.created} estadísticas nuevas creadas`)
          }
          if (results.updated > 0) {
            messageParts.push(`${results.updated} estadísticas actualizadas`)
          }
          if (results.notFound > 0) {
            messageParts.push(`${results.notFound} jugadores no encontrados`)
          }
          const message = messageParts.join(' | ')

          sendSSE(controller, {
            type: 'complete',
            message,
            results,
          })

          console.log(`✅ Player Stats ${period.toUpperCase()} Import completed:`, {
            period,
            totalProcessed: data.length,
            successful: results.success,
            failed: results.failed,
            created: results.created,
            updated: results.updated,
            notFound: results.notFound,
            importedBy: userId,
            timestamp: new Date().toISOString(),
          })
        } catch (error) {
          console.error(`❌ Error in Player Stats ${period} import:`, error)
          sendSSE(controller, {
            type: 'error',
            message: `❌ Error interno: ${error instanceof Error ? error.message : 'Unknown error'}`,
          })
        } finally {
          controller.close()
        }
      },
    })

    // Retornar stream como Server-Sent Events
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (error) {
    console.error('❌ Error in Player Stats import setup:', error)
    return new Response(JSON.stringify({ error: 'Error interno del servidor durante la importación.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
