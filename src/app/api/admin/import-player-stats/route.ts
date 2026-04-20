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
  isValidPeriod,
} from '@/lib/utils/stats-period-utils'

/**
 * Get the Prisma table model for a given period
 * This function must be defined here (server-side only)
 */
function getPrismaTableByPeriod(period: StatsPeriod) {
  const tables = {
    '3m': prisma.playerStats3m,
    '6m': prisma.playerStats6m,
    '1y': prisma.playerStats1y,
    '2y': prisma.playerStats2y,
  } as const

  return tables[period]
}

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
 * Helper: Calcular valores totales basados en valores por 90 minutos
 */
function calculateTotal(valuePer90: number | null, minutesPlayed: number | null): number | null {
  if (valuePer90 === null || minutesPlayed === null || minutesPlayed === 0) return null
  return Math.round((valuePer90 * minutesPlayed) / 90)
}

/**
 * Helper: Calcular efectividad (goles / remates * 100)
 */
function calculateEffectiveness(goals: number | null, shots: number | null): number | null {
  if (goals === null || shots === null || shots === 0) return null
  return parseFloat(((goals / shots) * 100).toFixed(2))
}

/**
 * Helper: Mapear los datos del Excel a los campos de la base de datos según el período
 */
function mapRowToStatsData(row: PlayerStatsImportRow, period: StatsPeriod): Record<string, any> {
  const suffix = period
  const wyscoutId = parseString(row.wyscout_id as string | number)

  // Extraer valores básicos
  const minutesPlayed = parseInteger(row[`minutes_played_tot_${suffix}`]) || null
  const matchesPlayed = parseInteger(row[`matches_played_tot_${suffix}`]) || null
  
  // Valores por 90
  const goalsP90 = parseDecimal(row[`goals_p90_${suffix}`]) || null
  const assistsP90 = parseDecimal(row[`assists_p90_${suffix}`]) || null
  const yellowCardsP90 = parseDecimal(row[`yellow_cards_p90_${suffix}`]) || null
  const redCardsP90 = parseDecimal(row[`red_cards_p90_${suffix}`]) || null
  const concededGoalsP90 = parseDecimal(row[`conceded_goals_p90_${suffix}`]) || null
  const preventedGoalsP90 = parseDecimal(row[`prevented_goals_p90_${suffix}`]) || null
  const shotsAgainstP90 = parseDecimal(row[`shots_against_p90_${suffix}`]) || null
  const tacklesP90 = parseDecimal(row[`tackles_p90_${suffix}`]) || null
  const interceptionsP90 = parseDecimal(row[`interceptions_p90_${suffix}`]) || null
  const foulsP90 = parseDecimal(row[`fouls_p90_${suffix}`]) || null
  const passesP90 = parseDecimal(row[`passes_p90_${suffix}`]) || null
  const forwardPassesP90 = parseDecimal(row[`forward_passes_p90_${suffix}`]) || null
  const crossesP90 = parseDecimal(row[`crosses_p90_${suffix}`]) || null
  const shotsP90 = parseDecimal(row[`shots_p90_${suffix}`]) || null
  const offDuelsP90 = parseDecimal(row[`off_duels_p90_${suffix}`]) || null
  const defDuelsP90 = parseDecimal(row[`def_duels_p90_${suffix}`]) || null
  const aerialsDuelsP90 = parseDecimal(row[`aerials_duels_p90_${suffix}`]) || null

  // Helper para convertir Decimal a number
  const toNum = (d: Decimal | null): number | null => d ? d.toNumber() : null

  // Calcular totales automáticamente
  const goalsTot = calculateTotal(toNum(goalsP90), minutesPlayed)
  const assistsTot = calculateTotal(toNum(assistsP90), minutesPlayed)
  const yellowCardsTot = calculateTotal(toNum(yellowCardsP90), minutesPlayed)
  const redCardsTot = calculateTotal(toNum(redCardsP90), minutesPlayed)
  const concededGoalsTot = calculateTotal(toNum(concededGoalsP90), minutesPlayed)
  const preventedGoalsTot = preventedGoalsP90 && minutesPlayed ? (preventedGoalsP90.toNumber() * minutesPlayed) / 90 : null
  const shotsAgainstTot = calculateTotal(toNum(shotsAgainstP90), minutesPlayed)
  const tacklesTot = calculateTotal(toNum(tacklesP90), minutesPlayed)
  const interceptionsTot = calculateTotal(toNum(interceptionsP90), minutesPlayed)
  const foulsTot = calculateTotal(toNum(foulsP90), minutesPlayed)
  const passesTot = calculateTotal(toNum(passesP90), minutesPlayed)
  const forwardPassesTot = calculateTotal(toNum(forwardPassesP90), minutesPlayed)
  const crossesTot = calculateTotal(toNum(crossesP90), minutesPlayed)
  const shotsTot = calculateTotal(toNum(shotsP90), minutesPlayed)
  const offDuelsTot = calculateTotal(toNum(offDuelsP90), minutesPlayed)
  const defDuelsTot = calculateTotal(toNum(defDuelsP90), minutesPlayed)
  const aerialsDuelsTot = calculateTotal(toNum(aerialsDuelsP90), minutesPlayed)

  // Calcular clean sheets (porterías imbatidas totales, si aplica)
  const cleanSheetsPercent = parseDecimal(row[`clean_sheets_percent_${suffix}`]) || null
  const cleanSheetsTot = cleanSheetsPercent && matchesPlayed ? Math.round((cleanSheetsPercent.toNumber() * matchesPlayed) / 100) : null

  // Calcular efectividad
  const effectivenessPercent = calculateEffectiveness(goalsTot, shotsTot)

  // Crear objeto de datos con mapeo dinámico según período
  const statsData: Record<string, any> = {
    wyscout_id: wyscoutId ? parseBigInt(wyscoutId) : null,

    // Partidos y minutos
    [`matches_played_tot_${suffix}`]: matchesPlayed,
    [`minutes_played_tot_${suffix}`]: minutesPlayed,

    // Goles
    [`goals_p90_${suffix}`]: goalsP90,
    [`goals_tot_${suffix}`]: goalsTot,

    // Asistencias
    [`assists_p90_${suffix}`]: assistsP90,
    [`assists_tot_${suffix}`]: assistsTot,

    // Tarjetas amarillas
    [`yellow_cards_p90_${suffix}`]: yellowCardsP90,
    [`yellow_cards_tot_${suffix}`]: yellowCardsTot,

    // Tarjetas rojas
    [`red_cards_p90_${suffix}`]: redCardsP90,
    [`red_cards_tot_${suffix}`]: redCardsTot,

    // Goles concedidos (porteros)
    [`conceded_goals_p90_${suffix}`]: concededGoalsP90,
    [`conceded_goals_tot_${suffix}`]: concededGoalsTot,

    // Goles prevenidos (porteros)
    [`prevented_goals_p90_${suffix}`]: preventedGoalsP90,
    [`prevented_goals_tot_${suffix}`]: preventedGoalsTot,

    // Tiros contra (porteros)
    [`shots_against_p90_${suffix}`]: shotsAgainstP90,
    [`shots_against_tot_${suffix}`]: shotsAgainstTot,

    // Clean sheets (porteros)
    [`clean_sheets_percent_${suffix}`]: cleanSheetsPercent,
    [`clean_sheets_tot_${suffix}`]: cleanSheetsTot,

    // Save rate (porteros)
    [`save_rate_percent_${suffix}`]: parseDecimal(row[`save_rate_percent_${suffix}`]) || null,

    // Tackles
    [`tackles_p90_${suffix}`]: tacklesP90,
    [`tackles_tot_${suffix}`]: tacklesTot,

    // Intercepciones
    [`interceptions_p90_${suffix}`]: interceptionsP90,
    [`interceptions_tot_${suffix}`]: interceptionsTot,

    // Faltas
    [`fouls_p90_${suffix}`]: foulsP90,
    [`fouls_tot_${suffix}`]: foulsTot,

    // Pases
    [`passes_p90_${suffix}`]: passesP90,
    [`passes_tot_${suffix}`]: passesTot,

    // Pases hacia adelante
    [`forward_passes_p90_${suffix}`]: forwardPassesP90,
    [`forward_passes_tot_${suffix}`]: forwardPassesTot,

    // Centros
    [`crosses_p90_${suffix}`]: crossesP90,
    [`crosses_tot_${suffix}`]: crossesTot,

    // Pases precisos
    [`accurate_passes_percent_${suffix}`]: parseDecimal(row[`accurate_passes_percent_${suffix}`]) || null,

    // Tiros
    [`shots_p90_${suffix}`]: shotsP90,
    [`shots_tot_${suffix}`]: shotsTot,

    // Efectividad (CALCULADO AUTOMÁTICAMENTE)
    [`effectiveness_percent_${suffix}`]: effectivenessPercent,

    // Duelos ofensivos
    [`off_duels_p90_${suffix}`]: offDuelsP90,
    [`off_duels_tot_${suffix}`]: offDuelsTot,
    [`off_duels_won_percent_${suffix}`]: parseDecimal(row[`off_duels_won_percent_${suffix}`]) || null,

    // Duelos defensivos
    [`def_duels_p90_${suffix}`]: defDuelsP90,
    [`def_duels_tot_${suffix}`]: defDuelsTot,
    [`def_duels_won_percent_${suffix}`]: parseDecimal(row[`def_duels_won_percent_${suffix}`]) || null,

    // Duelos aéreos
    [`aerials_duels_p90_${suffix}`]: aerialsDuelsP90,
    [`aerials_duels_tot_${suffix}`]: aerialsDuelsTot,
    [`aerials_duels_won_percent_${suffix}`]: parseDecimal(row[`aerials_duels_won_percent_${suffix}`]) || null,
  }

  return statsData
}

/**
 * Helper: Calcular normalizaciones y rankings para todas las estadísticas
 */
async function calculateNormalizationsAndRankings(
  period: StatsPeriod,
  sendSSE: (controller: ReadableStreamDefaultController, data: any) => void,
  controller: ReadableStreamDefaultController
) {
  const suffix = period
  const statsTable = getPrismaTableByPeriod(period)

  // Obtener todas las estadísticas del período
  const whereClause: Record<string, any> = {}
  whereClause[`matches_played_tot_${suffix}`] = { gt: 0 } // Solo jugadores con partidos jugados
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allStats = await (statsTable as any).findMany({
    where: whereClause
  }) as Array<{ id_player: string; [key: string]: unknown }>

  if (allStats.length === 0) {
    return
  }

  sendSSE(controller, {
    type: 'info',
    message: `📊 Procesando ${allStats.length} jugadores...`,
  })

  // Campos con ranking y normalización
  const fieldsToNormalize = [
    'goals_p90', 'assists_p90', 'yellow_cards_p90', 'red_cards_p90',
    'conceded_goals_p90', 'prevented_goals_p90', 'shots_against_p90',
    'tackles_p90', 'interceptions_p90', 'fouls_p90',
    'passes_p90', 'forward_passes_p90', 'crosses_p90', 'shots_p90',
    'off_duels_p90', 'def_duels_p90', 'aerials_duels_p90',
    // Porcentajes
    'clean_sheets_percent', 'save_rate_percent', 'accurate_passes_percent',
    'effectiveness_percent', 'off_duels_won_percent', 'def_duels_won_percent',
    'aerials_duels_won_percent',
    // Básicos
    'matches_played_tot', 'minutes_played_tot'
  ]
  
  // Campos solo con normalización (NO tienen ranking en el esquema)
  const fieldsOnlyNorm = [
    'goals_tot', 'assists_tot', 'yellow_cards_tot', 'red_cards_tot',
    'conceded_goals_tot', 'shots_against_tot', 'clean_sheets_tot',
    'tackles_tot', 'interceptions_tot', 'fouls_tot',
    'passes_tot', 'forward_passes_tot', 'crosses_tot', 'shots_tot',
    'off_duels_tot', 'def_duels_tot', 'aerials_duels_tot',
    'prevented_goals_tot'
  ]

  // Calcular min y max para cada campo
  const statsForNormalization: Record<string, { values: number[], indices: number[] }> = {}
  
  fieldsToNormalize.forEach(field => {
    const fieldWithSuffix = `${field}_${suffix}`
    const values: number[] = []
    const indices: number[] = []
    
    allStats.forEach((stat: { id_player: string; [key: string]: unknown }, index: number) => {
      const value = stat[fieldWithSuffix]
      if (value !== null && value !== undefined) {
        // Convertir Decimal de Prisma a number
        const numValue = typeof value === 'object' && value !== null && 'toNumber' in value
          ? (value as { toNumber: () => number }).toNumber()
          : Number(value)

        if (!isNaN(numValue)) {
          values.push(numValue)
          indices.push(index)
        }
      }
    })
    
    if (values.length > 0) {
      statsForNormalization[field] = { values, indices }
    }
  })

  // Calcular normalizaciones y rankings
  const updates: Array<{ id_player: string, data: Record<string, any> }> = []

  allStats.forEach((stat: { id_player: string; [key: string]: unknown }) => {
    const updateData: Record<string, unknown> = {}

    fieldsToNormalize.forEach(field => {
      const fieldWithSuffix = `${field}_${suffix}`
      const normField = `${field}_${suffix}_norm`

      // Algunos rankings NO tienen sufijo de período (son globales)
      const fieldsWithoutPeriodSuffix = ['yellow_cards_p90', 'red_cards_p90', 'prevented_goals_p90']
      const rankField = fieldsWithoutPeriodSuffix.includes(field)
        ? `${field}_rank`
        : `${field}_${suffix}_rank`

      const statsData = statsForNormalization[field]
      if (!statsData) return

      const value = stat[fieldWithSuffix]
      if (value === null || value === undefined) return

      // Convertir Decimal de Prisma a number
      const numValue = typeof value === 'object' && value !== null && 'toNumber' in value
        ? (value as { toNumber: () => number }).toNumber()
        : Number(value)

      if (isNaN(numValue)) return

      const { values } = statsData

      // Calcular normalización (0-100 usando percentil)
      const sortedValues = [...values].sort((a, b) => a - b)
      const position = sortedValues.findIndex(v => v >= numValue)
      const percentile = position >= 0 ? (position / sortedValues.length) * 100 : 100
      updateData[normField] = Math.round(percentile * 100) / 100

      // Calcular ranking (1 = mejor)
      const descendingValues = [...values].sort((a, b) => b - a)
      const rank = descendingValues.findIndex(v => v <= numValue) + 1

      // Para campos "negativos" (tarjetas, faltas, goles concedidos), invertir el ranking
      const negativeFields = ['yellow_cards', 'red_cards', 'fouls', 'conceded_goals']
      const isNegative = negativeFields.some(nf => field.startsWith(nf))

      if (isNegative) {
        updateData[rankField] = values.length - rank + 1
        // Calcular también la normalización negativa
        const normNegField = `${field}_${suffix}_norm_neg`
        updateData[normNegField] = Math.round((100 - percentile) * 100) / 100
      } else {
        updateData[rankField] = rank
      }
    })

    if (Object.keys(updateData).length > 0) {
      updates.push({
        id_player: stat.id_player,
        data: updateData
      })
    }
  })

  // Aplicar actualizaciones en batch
  sendSSE(controller, {
    type: 'info',
    message: `💾 Guardando ${updates.length} actualizaciones...`,
  })

  for (const update of updates) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (statsTable as any).update({
      where: { id_player: update.id_player },
      data: update.data
    })
  }
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
    if (!worksheet) {
      return new Response(
        JSON.stringify({ error: `La hoja "${sheetName}" no existe en el archivo.` }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }
    const data: PlayerStatsImportRow[] = XLSX.utils.sheet_to_json(worksheet)

    console.log(`📊 Excel leído: ${data.length} filas encontradas en hoja "${sheetName}"`)

    if (!data || data.length === 0) {
      console.error('❌ El archivo Excel no contiene datos')
      return new Response(
        JSON.stringify({ error: 'El archivo está vacío o no tiene el formato correcto.' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // 🔍 DEBUG: Mostrar columnas del Excel
    const firstDataRow = data[0]
    if (firstDataRow) {
      const columns = Object.keys(firstDataRow)
      console.log(`📋 Columnas detectadas (${columns.length}):`, columns.slice(0, 20))
    }

    // 🔍 NORMALIZAR NOMBRES DE COLUMNAS: Detectar y mapear variantes comunes
    // Esto permite que el Excel funcione con diferentes nombres de columna
    const normalizedData = data.map(row => {
      const normalizedRow: any = { ...row }

      // Buscar variantes de wyscout_id PRIMERO (tiene prioridad)
      if (!normalizedRow.wyscout_id) {
        const wyscoutVariants = ['wyscout_id_1', 'WYSCOUT_ID_1', 'wyscout_id 1', 'Wyscout ID 1', 'WYSCOUT_ID', 'WyscoutID', 'Wyscout ID', 'wyscout id', 'id', 'ID']
        for (const variant of wyscoutVariants) {
          if (row[variant] !== undefined && row[variant] !== null && row[variant] !== '') {
            normalizedRow.wyscout_id = row[variant]
            break
          }
        }
      }

      // Buscar variantes de id_player
      if (!normalizedRow.id_player) {
        const idPlayerVariants = ['ID_PLAYER', 'IdPlayer', 'Id_Player', 'ID Player', 'player_id', 'PLAYER_ID']
        for (const variant of idPlayerVariants) {
          if (row[variant] !== undefined && row[variant] !== null && row[variant] !== '') {
            normalizedRow.id_player = row[variant]
            break
          }
        }
      }

      // 🌐 MAPEO DE COLUMNAS EN ESPAÑOL A INGLÉS
      // Mapea nombres de columnas en español a los nombres de base de datos con sufijo
      const spanishToEnglishMap: Record<string, string> = {
        'Partidos jugados': `matches_played_tot_${period}`,
        'Minutos jugados': `minutes_played_tot_${period}`,
        'Duelos defensivos/90': `def_duels_p90_${period}`,
        'Duelos defensivos ganados, %': `def_duels_won_percent_${period}`,
        'Duelos aéreos en los 90': `aerials_duels_p90_${period}`,
        'Duelos aéreos ganados, %': `aerials_duels_won_percent_${period}`,
        'Entradas/90': `tackles_p90_${period}`,
        'Interceptaciones/90': `interceptions_p90_${period}`,
        'Faltas/90': `fouls_p90_${period}`,
        'Tarjetas amarillas/90': `yellow_cards_p90_${period}`,
        'Tarjetas rojas/90': `red_cards_p90_${period}`,
        'Goles/90': `goals_p90_${period}`,
        'Remates/90': `shots_p90_${period}`,
        'Asistencias/90': `assists_p90_${period}`,
        'Centros/90': `crosses_p90_${period}`,
        'Duelos atacantes/90': `off_duels_p90_${period}`,
        'Duelos atacantes ganados, %': `off_duels_won_percent_${period}`,
        'Pases/90': `passes_p90_${period}`,
        'Precisión pases, %': `accurate_passes_percent_${period}`,
        'Pases hacia adelante/90': `forward_passes_p90_${period}`,
        'Goles recibidos/90': `conceded_goals_p90_${period}`,
        'Remates en contra/90': `shots_against_p90_${period}`,
        'Porterías imbatidas en los 90': `clean_sheets_percent_${period}`,
        'Paradas, %': `save_rate_percent_${period}`,
        'Goles evitados/90': `prevented_goals_p90_${period}`,
        // Variantes alternativas
        'Jugador': 'player_name'
      }

      // Aplicar mapeo de columnas españolas
      Object.keys(row).forEach(columnName => {
        const mappedName = spanishToEnglishMap[columnName]
        if (mappedName && row[columnName] !== undefined && row[columnName] !== null && row[columnName] !== '') {
          // Usar directamente el nombre mapeado (ya incluye el sufijo del período)
          normalizedRow[mappedName] = row[columnName]
        }
      })

      return normalizedRow
    })

    // Reemplazar data con normalizedData
    data.splice(0, data.length, ...normalizedData)

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

          // 🔍 DEBUG: Mostrar columnas detectadas en el Excel
          const firstRow = data[0]
          if (firstRow) {
            const columns = Object.keys(firstRow)

            sendSSE(controller, {
              type: 'info',
              message: `🔍 Total de columnas detectadas: ${columns.length}`,
            })

            // Mostrar primeras 20 columnas
            sendSSE(controller, {
              type: 'info',
              message: `📋 Primeras columnas: ${columns.slice(0, 20).join(', ')}${columns.length > 20 ? '...' : ''}`,
            })

            // Verificar campos críticos de identificación
            const hasIdPlayer = columns.some(col => col === 'id_player' || col.toLowerCase().includes('id_player') || col.toLowerCase() === 'id')
            const hasWyscoutId = columns.some(col => col.includes('wyscout') && col.includes('id'))

            if (hasIdPlayer) {
              const idColumn = columns.find(col => col === 'id_player') || columns.find(col => col.toLowerCase().includes('id_player')) || columns.find(col => col.toLowerCase() === 'id')
              sendSSE(controller, {
                type: 'info',
                message: `✅ Columna de ID de jugador detectada: "${idColumn}"`,
              })
            } else {
              sendSSE(controller, {
                type: 'warning',
                message: `⚠️ No se detectó columna "id_player" - buscando variantes...`,
              })
            }

            if (hasWyscoutId) {
              const wyscoutColumn = columns.find(col => col.includes('wyscout') && col.includes('id'))
              sendSSE(controller, {
                type: 'info',
                message: `✅ Columna de Wyscout ID detectada: "${wyscoutColumn}"`,
              })
            } else {
              sendSSE(controller, {
                type: 'warning',
                message: `⚠️ No se detectó columna "wyscout_id"`,
              })
            }

            // Mostrar valores de la primera fila para diagnóstico
            const firstRowId = firstRow.id_player || firstRow.wyscout_id
            if (firstRowId) {
              sendSSE(controller, {
                type: 'info',
                message: `📌 Primer identificador detectado: ${firstRowId}`,
              })
            } else {
              sendSSE(controller, {
                type: 'error',
                message: `❌ La primera fila NO tiene id_player ni wyscout_id después de normalización`,
              })
              // Mostrar todas las columnas que contienen "id" en su nombre
              const idColumns = columns.filter(col => col.toLowerCase().includes('id'))
              if (idColumns.length > 0) {
                sendSSE(controller, {
                  type: 'info',
                  message: `🔍 Columnas que contienen "id": ${idColumns.join(', ')}`,
                })
                // Mostrar valores de estas columnas en la primera fila
                const idValues = idColumns.map(col => `${col}: "${firstRow[col]}"`).join(' | ')
                sendSSE(controller, {
                  type: 'info',
                  message: `🔍 Valores de columnas ID en fila 1: ${idValues}`,
                })
              }
            }
          }

          // 🚀 OPTIMIZACIÓN: Pre-cargar todos los jugadores existentes en memoria
          sendSSE(controller, {
            type: 'info',
            message: '🔍 Cargando jugadores existentes en la base de datos...',
          })

          const allPlayerIds = data
            .map(row => {
              const idStr = parseString(row.id_player)
              if (!idStr) return null
              const num = parseInt(idStr, 10)
              return isNaN(num) ? null : num
            })
            .filter((id): id is number => id !== null)

          const allWyscoutIds = data
            .map(row => {
              // La columna ya fue normalizada a wyscout_id
              const wyscoutId = row.wyscout_id
              if (wyscoutId !== null && wyscoutId !== undefined && wyscoutId !== '') {
                return String(wyscoutId)
              }
              return null
            })
            .filter(Boolean) as string[]

          // 🔍 DEBUG: Mostrar primeros IDs extraídos
          sendSSE(controller, {
            type: 'info',
            message: `🔍 Primeros 5 Wyscout IDs del Excel: ${allWyscoutIds.slice(0, 5).join(', ')}`,
          })

          sendSSE(controller, {
            type: 'info',
            message: `📊 Total de Wyscout IDs únicos en Excel: ${allWyscoutIds.length}`,
          })

          // 🔍 DEBUG: Mostrar query que vamos a ejecutar
          sendSSE(controller, {
            type: 'info',
            message: `🔍 Buscando jugadores en BD con ${allWyscoutIds.length} Wyscout IDs...`,
          })

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

          // 🔍 DEBUG: Mostrar resultado de la query
          sendSSE(controller, {
            type: 'info',
            message: `🔍 Query retornó ${existingPlayers.length} jugadores de BD`,
          })

          if (existingPlayers.length === 0) {
            sendSSE(controller, {
              type: 'error',
              message: `❌ ¡PROBLEMA! La query NO encontró NINGÚN jugador en la base de datos`,
            })

            // Mostrar exactamente qué estamos buscando
            sendSSE(controller, {
              type: 'info',
              message: `🔍 IDs que buscamos (primeros 10): ${allWyscoutIds.slice(0, 10).join(', ')}`,
            })

            // Verificar si hay ALGÚN jugador con wyscout_id_1 en la BD
            const anyPlayerWithWyscout = await prisma.jugador.findFirst({
              where: {
                wyscout_id_1: { not: null }
              },
              select: {
                player_name: true,
                wyscout_id_1: true
              }
            })

            if (anyPlayerWithWyscout) {
              sendSSE(controller, {
                type: 'info',
                message: `🔍 Ejemplo de jugador en BD: "${anyPlayerWithWyscout.player_name}" con wyscout_id_1 = "${anyPlayerWithWyscout.wyscout_id_1}"`,
              })
            } else {
              sendSSE(controller, {
                type: 'error',
                message: `❌ NO hay NINGÚN jugador con wyscout_id_1 en la base de datos`,
              })
            }
          }

          // Crear mapas de búsqueda rápida
          const playerByIdMap = new Map<number, (typeof existingPlayers)[0]>()
          const playerByWyscoutMap = new Map<string, (typeof existingPlayers)[0]>()

          existingPlayers.forEach(player => {
            playerByIdMap.set(player.id_player, player)
            if (player.wyscout_id_1) playerByWyscoutMap.set(String(player.wyscout_id_1), player)
            if (player.wyscout_id_2) playerByWyscoutMap.set(String(player.wyscout_id_2), player)
          })

          sendSSE(controller, {
            type: 'info',
            message: `✅ ${existingPlayers.length} jugadores existentes cargados en memoria`,
          })

          // 🔍 DEBUG: Mostrar primeros jugadores encontrados
          if (existingPlayers.length > 0) {
            const first5 = existingPlayers.slice(0, 5).map(p => `${p.player_name} (ID: ${p.wyscout_id_1})`).join(', ')
            sendSSE(controller, {
              type: 'info',
              message: `🔍 Primeros 5 jugadores de BD: ${first5}`,
            })
          } else {
            sendSSE(controller, {
              type: 'warning',
              message: `⚠️ NO se encontraron jugadores en la BD con los IDs del Excel`,
            })
          }

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
            if (!batch) continue
            const batchNum = batchIndex + 1

            sendSSE(controller, {
              type: 'batch_start',
              batchNum,
              totalBatches: batches.length,
              message: `🔄 Procesando lote ${batchNum}/${batches.length}...`,
            })

            // Procesar cada registro del lote
            for (const row of batch) {
              const playerIdStr = parseString(row.id_player)
              const playerIdNum = playerIdStr ? parseInt(playerIdStr, 10) : null
              const wyscoutId = parseString(row.wyscout_id as string | number)

              if (!playerIdNum && !wyscoutId) {
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
                let player = (playerIdNum && !isNaN(playerIdNum)) ? playerByIdMap.get(playerIdNum) : null
                if (!player && wyscoutId) {
                  player = playerByWyscoutMap.get(wyscoutId)
                }

                if (!player) {
                  results.notFound++
                  const identifier = playerIdStr || wyscoutId
                  results.errors.push(`Jugador no encontrado: ${identifier}`)
                  sendSSE(controller, {
                    type: 'player_not_found',
                    identifier,
                    message: `⚠️ Jugador no encontrado: ${identifier}`,
                  })
                  continue
                }

                // 📦 PREPARAR DATOS DE ESTADÍSTICAS
                const statsData = mapRowToStatsData(row, period)

                // 🔄 UPSERT EN LA BASE DE DATOS
                try {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const existingStats = await (statsTable as any).findUnique({
                    where: { id_player: player.id_player },
                  })

                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  await (statsTable as any).upsert({
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

          // 📊 CALCULAR NORMALIZACIONES Y RANKINGS
          if (results.success > 0) {
            sendSSE(controller, {
              type: 'info',
              message: '🧮 Calculando normalizaciones y rankings...',
            })

            try {
              await calculateNormalizationsAndRankings(period, sendSSE, controller)
              
              sendSSE(controller, {
                type: 'success',
                message: '✅ Normalizaciones y rankings calculados',
              })
            } catch (error) {
              sendSSE(controller, {
                type: 'warning',
                message: `⚠️ Error calculando normalizaciones: ${error instanceof Error ? error.message : 'Unknown error'}`,
              })
            }
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
