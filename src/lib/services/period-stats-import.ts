/**
 * 🧰 NÚCLEO REUTILIZABLE PARA IMPORTACIÓN DE STATS POR PERIODO
 *
 * Lógica compartida para importar estadísticas Wyscout (columnas en español) a las
 * tablas player_stats_{3m,6m,1y,2y}. Usado por el importador de ZIP
 * (/api/admin/import-stats-zip), que deriva el periodo del nombre del archivo.
 *
 * El mapeo de columnas y el cálculo de totales replican el endpoint single-period
 * (/api/admin/import-player-stats) para mantener consistencia.
 */

import { Prisma } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'

import { prisma } from '@/lib/db'
import { percentileRank, upperBound } from '@/lib/utils/percentile'
import { positionGroup } from '@/lib/utils/position-group'
import type { StatsPeriod } from '@/lib/utils/stats-period-utils'

export function getPrismaTableByPeriod(period: StatsPeriod) {
  const tables = {
    '3m': prisma.playerStats3m,
    '6m': prisma.playerStats6m,
    '1y': prisma.playerStats1y,
    '2y': prisma.playerStats2y,
  } as const
  return tables[period]
}

// ── Helpers de parseo (idénticos al endpoint single-period) ──────────────────
export function parseDecimal(value: number | string | undefined | null): Decimal | null {
  if (value === null || value === undefined || value === '') return null
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return null
  return new Decimal(num)
}

export function parseInteger(value: number | string | undefined | null): number | null {
  if (value === null || value === undefined || value === '') return null
  const num = typeof value === 'string' ? parseInt(value, 10) : Math.round(value)
  return isNaN(num) ? null : num
}

export function parseString(value: string | number | undefined | null): string | null {
  if (value === null || value === undefined || value === '') return null
  return String(value).trim()
}

export function parseBigInt(value: string | number | undefined | null): bigint | null {
  if (value === null || value === undefined || value === '') return null
  try {
    return BigInt(value)
  } catch {
    return null
  }
}

function calculateTotal(valuePer90: number | null, minutesPlayed: number | null): number | null {
  if (valuePer90 === null || minutesPlayed === null || minutesPlayed === 0) return null
  return Math.round((valuePer90 * minutesPlayed) / 90)
}

function calculateEffectiveness(goals: number | null, shots: number | null): number | null {
  if (goals === null || shots === null || shots === 0) return null
  return parseFloat(((goals / shots) * 100).toFixed(2))
}

// ── Normalización de columnas (español → campos de BD con sufijo de periodo) ──
const WYSCOUT_VARIANTS = [
  'wyscout_id_1', 'WYSCOUT_ID_1', 'wyscout_id 1', 'Wyscout ID 1', 'WYSCOUT_ID',
  'WyscoutID', 'Wyscout ID', 'wyscout id', 'wyscout_id', 'id', 'ID', 'Id',
]
const ID_PLAYER_VARIANTS = ['id_player', 'ID_PLAYER', 'Id_Player', 'idPlayer']

function spanishToFieldMap(period: StatsPeriod): Record<string, string> {
  return {
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
    // Es un CONTEO de porterías imbatidas (verificado contra datos reales:
    // valores 0-8 con 5-16 partidos), NO un porcentaje. El % se deriva después.
    'Porterías imbatidas en los 90': `clean_sheets_tot_${period}`,
    'Paradas, %': `save_rate_percent_${period}`,
    'Goles evitados/90': `prevented_goals_p90_${period}`,
    'Metros totales': `total_meters_${period}`,
    'Velocidad máxima': `max_speed_${period}`,
    'Metros/minuto': `meters_per_min_${period}`,
    'Metros > 15 km/h': `over_15kmh_${period}`,
    'Metros > 20 km/h': `over_20kmh_${period}`,
    'Metros > 25 km/h': `over_25kmh_${period}`,
    'Jugador': 'player_name',
  }
}

export interface NormalizedRow {
  wyscout_id?: string | number
  id_player?: string | number
  [key: string]: string | number | undefined | null
}

/** Traduce una fila cruda del Excel (claves = encabezados en español) a campos de BD. */
export function normalizeStatsRow(raw: Record<string, unknown>, period: StatsPeriod): NormalizedRow {
  const out: NormalizedRow = {}

  for (const v of WYSCOUT_VARIANTS) {
    if (raw[v] !== null && raw[v] !== undefined && raw[v] !== '') {
      out.wyscout_id = raw[v] as string | number
      break
    }
  }
  for (const v of ID_PLAYER_VARIANTS) {
    if (raw[v] !== null && raw[v] !== undefined && raw[v] !== '') {
      out.id_player = raw[v] as string | number
      break
    }
  }

  const map = spanishToFieldMap(period)
  for (const [key, value] of Object.entries(raw)) {
    if (map[key]) {
      out[map[key]] = value as string | number
    } else if (new RegExp(`_(3m|6m|1y|2y)$`).test(key)) {
      out[key] = value as string | number // ya viene en formato de campo
    }
  }
  return out
}

/** Mapea una fila normalizada a los campos de stats de la BD (con totales calculados). */
export function mapRowToStatsData(row: NormalizedRow, period: StatsPeriod): Record<string, unknown> {
  const suffix = period
  const wyscoutId = parseString(row.wyscout_id as string | number)

  const num = (key: string) => parseDecimal(row[key] as number | string | undefined)
  const minutesPlayed = parseInteger(row[`minutes_played_tot_${suffix}`] as number | string | undefined)
  const matchesPlayed = parseInteger(row[`matches_played_tot_${suffix}`] as number | string | undefined)

  const goalsP90 = num(`goals_p90_${suffix}`)
  const assistsP90 = num(`assists_p90_${suffix}`)
  const yellowCardsP90 = num(`yellow_cards_p90_${suffix}`)
  const redCardsP90 = num(`red_cards_p90_${suffix}`)
  const concededGoalsP90 = num(`conceded_goals_p90_${suffix}`)
  const preventedGoalsP90 = num(`prevented_goals_p90_${suffix}`)
  const shotsAgainstP90 = num(`shots_against_p90_${suffix}`)
  const tacklesP90 = num(`tackles_p90_${suffix}`)
  const interceptionsP90 = num(`interceptions_p90_${suffix}`)
  const foulsP90 = num(`fouls_p90_${suffix}`)
  const passesP90 = num(`passes_p90_${suffix}`)
  const forwardPassesP90 = num(`forward_passes_p90_${suffix}`)
  const crossesP90 = num(`crosses_p90_${suffix}`)
  const shotsP90 = num(`shots_p90_${suffix}`)
  const offDuelsP90 = num(`off_duels_p90_${suffix}`)
  const defDuelsP90 = num(`def_duels_p90_${suffix}`)
  const aerialsDuelsP90 = num(`aerials_duels_p90_${suffix}`)

  const toNum = (d: Decimal | null): number | null => (d ? d.toNumber() : null)

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

  // Clean sheets: la columna origen es un conteo; el % es conteo/partidos.
  const cleanSheetsTot = parseInteger(row[`clean_sheets_tot_${suffix}`] as number | string | undefined)
  const cleanSheetsPercent = cleanSheetsTot != null && matchesPlayed
    ? parseDecimal(((cleanSheetsTot / matchesPlayed) * 100).toFixed(2))
    : null
  // Efectividad desde los p90 (misma ratio que los totales pero sin el sesgo
  // del redondeo a entero en volúmenes bajos).
  const effectivenessPercent = calculateEffectiveness(toNum(goalsP90), toNum(shotsP90))

  return {
    wyscout_id: wyscoutId ? parseBigInt(wyscoutId) : null,
    [`matches_played_tot_${suffix}`]: matchesPlayed,
    [`minutes_played_tot_${suffix}`]: minutesPlayed,
    [`goals_p90_${suffix}`]: goalsP90,
    [`goals_tot_${suffix}`]: goalsTot,
    [`assists_p90_${suffix}`]: assistsP90,
    [`assists_tot_${suffix}`]: assistsTot,
    [`yellow_cards_p90_${suffix}`]: yellowCardsP90,
    [`yellow_cards_tot_${suffix}`]: yellowCardsTot,
    [`red_cards_p90_${suffix}`]: redCardsP90,
    [`red_cards_tot_${suffix}`]: redCardsTot,
    [`conceded_goals_p90_${suffix}`]: concededGoalsP90,
    [`conceded_goals_tot_${suffix}`]: concededGoalsTot,
    [`prevented_goals_p90_${suffix}`]: preventedGoalsP90,
    [`prevented_goals_tot_${suffix}`]: preventedGoalsTot,
    [`shots_against_p90_${suffix}`]: shotsAgainstP90,
    [`shots_against_tot_${suffix}`]: shotsAgainstTot,
    [`clean_sheets_percent_${suffix}`]: cleanSheetsPercent,
    [`clean_sheets_tot_${suffix}`]: cleanSheetsTot,
    [`save_rate_percent_${suffix}`]: num(`save_rate_percent_${suffix}`),
    [`tackles_p90_${suffix}`]: tacklesP90,
    [`tackles_tot_${suffix}`]: tacklesTot,
    [`interceptions_p90_${suffix}`]: interceptionsP90,
    [`interceptions_tot_${suffix}`]: interceptionsTot,
    [`fouls_p90_${suffix}`]: foulsP90,
    [`fouls_tot_${suffix}`]: foulsTot,
    [`passes_p90_${suffix}`]: passesP90,
    [`passes_tot_${suffix}`]: passesTot,
    [`forward_passes_p90_${suffix}`]: forwardPassesP90,
    [`forward_passes_tot_${suffix}`]: forwardPassesTot,
    [`crosses_p90_${suffix}`]: crossesP90,
    [`crosses_tot_${suffix}`]: crossesTot,
    [`accurate_passes_percent_${suffix}`]: num(`accurate_passes_percent_${suffix}`),
    [`shots_p90_${suffix}`]: shotsP90,
    [`shots_tot_${suffix}`]: shotsTot,
    [`effectiveness_percent_${suffix}`]: effectivenessPercent,
    [`off_duels_p90_${suffix}`]: offDuelsP90,
    [`off_duels_tot_${suffix}`]: offDuelsTot,
    [`off_duels_won_percent_${suffix}`]: num(`off_duels_won_percent_${suffix}`),
    [`def_duels_p90_${suffix}`]: defDuelsP90,
    [`def_duels_tot_${suffix}`]: defDuelsTot,
    [`def_duels_won_percent_${suffix}`]: num(`def_duels_won_percent_${suffix}`),
    [`aerials_duels_p90_${suffix}`]: aerialsDuelsP90,
    [`aerials_duels_tot_${suffix}`]: aerialsDuelsTot,
    [`aerials_duels_won_percent_${suffix}`]: num(`aerials_duels_won_percent_${suffix}`),
    [`total_meters_${suffix}`]: num(`total_meters_${suffix}`),
    [`max_speed_${suffix}`]: num(`max_speed_${suffix}`),
    [`meters_per_min_${suffix}`]: num(`meters_per_min_${suffix}`),
    [`over_15kmh_${suffix}`]: num(`over_15kmh_${suffix}`),
    [`over_20kmh_${suffix}`]: num(`over_20kmh_${suffix}`),
    [`over_25kmh_${suffix}`]: num(`over_25kmh_${suffix}`),
  }
}

/**
 * Recalcula normalizaciones (percentil 0-100) y rankings de un periodo.
 * Misma fórmula que el endpoint single-period, pero precomputando arrays ordenados
 * (en vez de ordenar por jugador) y escribiendo en lotes transaccionales.
 */
export async function recalcPeriodNormalizations(
  period: StatsPeriod,
  onLog?: (message: string) => void
): Promise<number> {
  const suffix = period
  const statsTable = getPrismaTableByPeriod(period)

  const allStats = (await (statsTable as { findMany: (a: unknown) => Promise<unknown> }).findMany({
    where: { [`matches_played_tot_${suffix}`]: { gt: 0 } },
  })) as Array<{ id_player: number; [key: string]: unknown }>

  if (allStats.length === 0) return 0
  onLog?.(`📊 Normalizando ${allStats.length} jugadores (${period})...`)

  const fieldsToNormalize = [
    'goals_p90', 'assists_p90', 'yellow_cards_p90', 'red_cards_p90',
    'conceded_goals_p90', 'prevented_goals_p90', 'shots_against_p90',
    'tackles_p90', 'interceptions_p90', 'fouls_p90',
    'passes_p90', 'forward_passes_p90', 'crosses_p90', 'shots_p90',
    'off_duels_p90', 'def_duels_p90', 'aerials_duels_p90',
    'clean_sheets_percent', 'save_rate_percent', 'accurate_passes_percent',
    'effectiveness_percent', 'off_duels_won_percent', 'def_duels_won_percent',
    'aerials_duels_won_percent',
    'matches_played_tot', 'minutes_played_tot',
  ]
  const fieldsWithoutPeriodSuffix = ['yellow_cards_p90', 'red_cards_p90', 'prevented_goals_p90']
  const negativeFields = ['yellow_cards', 'red_cards', 'fouls', 'conceded_goals']

  const toNumber = (value: unknown): number | null => {
    if (value === null || value === undefined) return null
    const nv = typeof value === 'object' && value !== null && 'toNumber' in value
      ? (value as { toNumber: () => number }).toNumber()
      : Number(value)
    return isNaN(nv) ? null : nv
  }

  // Cohortes por posición: cada jugador se normaliza contra su grupo posicional
  // (GK/DEF/MID/FWD). Sin esto, un delantero se mide en goles/90 contra porteros.
  // Los jugadores sin posición conocida caen a la cohorte 'ALL' (población completa).
  const playerPositions = await prisma.jugador.findMany({
    select: { id_player: true, position_player: true },
  })
  const groupByPlayer = new Map<number, string>()
  for (const p of playerPositions) {
    const g = positionGroup(p.position_player)
    if (g) groupByPlayer.set(p.id_player, g)
  }
  const cohortOf = (idPlayer: number): string => groupByPlayer.get(idPlayer) ?? 'ALL'

  // Precomputar arrays ordenados (asc) por campo y cohorte, una sola vez.
  // 'ALL' incluye a todos (es la cohorte de los jugadores sin posición).
  const sortedAsc: Record<string, Record<string, number[]>> = {}
  for (const field of fieldsToNormalize) {
    const f = `${field}_${suffix}`
    const byCohort: Record<string, number[]> = { ALL: [] }
    for (const s of allStats) {
      const v = toNumber(s[f])
      if (v === null) continue
      byCohort.ALL!.push(v)
      const g = groupByPlayer.get(s.id_player)
      if (g) (byCohort[g] ??= []).push(v)
    }
    for (const arr of Object.values(byCohort)) arr.sort((a, b) => a - b)
    if (byCohort.ALL!.length > 0) sortedAsc[field] = byCohort
  }

  // Columnas a escribir, en orden fijo. Guardamos el nombre de campo Prisma y su cast.
  // OJO: en SQL crudo hay que usar el nombre REAL de columna (las de % usan @map "_%_").
  const colDefs: Array<{ prisma: string; cast: 'double precision' | 'integer' }> = []
  for (const field of fieldsToNormalize) {
    colDefs.push({ prisma: `${field}_${suffix}_norm`, cast: 'double precision' })
    const rankField = fieldsWithoutPeriodSuffix.includes(field) ? `${field}_rank` : `${field}_${suffix}_rank`
    colDefs.push({ prisma: rankField, cast: 'integer' })
    if (negativeFields.some((nf) => field.startsWith(nf))) {
      colDefs.push({ prisma: `${field}_${suffix}_norm_neg`, cast: 'double precision' })
    }
  }
  const dbColName = (prismaField: string) => prismaField.replace('_percent_', '_%_')

  // Calcular valores (alineados a colDefs) por jugador, contra su cohorte
  const rowsOut: Array<{ id_player: number; values: (number | null)[] }> = []
  for (const stat of allStats) {
    const cohort = cohortOf(stat.id_player)
    const data = new Map<string, number | null>()
    for (const field of fieldsToNormalize) {
      const byCohort = sortedAsc[field]
      if (!byCohort) continue
      const arr = byCohort[cohort] && byCohort[cohort]!.length > 0 ? byCohort[cohort]! : byCohort.ALL!
      const value = toNumber(stat[`${field}_${suffix}`])
      if (value === null) continue

      const percentile = percentileRank(arr, value)
      if (percentile === null) continue
      data.set(`${field}_${suffix}_norm`, Math.round(percentile * 100) / 100)

      const greater = arr.length - upperBound(arr, value)
      const rank = greater + 1 // 1 = mejor de su cohorte
      const rankField = fieldsWithoutPeriodSuffix.includes(field) ? `${field}_rank` : `${field}_${suffix}_rank`
      if (negativeFields.some((nf) => field.startsWith(nf))) {
        data.set(rankField, arr.length - rank + 1)
        data.set(`${field}_${suffix}_norm_neg`, Math.round((100 - percentile) * 100) / 100)
      } else {
        data.set(rankField, rank)
      }
    }
    if (data.size === 0) continue
    rowsOut.push({ id_player: stat.id_player, values: colDefs.map((c) => data.get(c.prisma) ?? null) })
  }

  // UPDATE masivo: UPDATE ... FROM (VALUES ...) en lotes (pocos round-trips)
  onLog?.(`💾 Guardando ${rowsOut.length} normalizaciones (${period})...`)
  const tableName = `player_stats_${suffix}`
  const setClause = Prisma.join(
    colDefs.map((c, i) => Prisma.sql`${Prisma.raw(`"${dbColName(c.prisma)}"`)} = v.${Prisma.raw(`c${i}`)}`),
    ', '
  )
  const colAliases = Prisma.join([Prisma.raw('id'), ...colDefs.map((_, i) => Prisma.raw(`c${i}`))], ', ')

  const CHUNK = 500
  for (let i = 0; i < rowsOut.length; i += CHUNK) {
    const slice = rowsOut.slice(i, i + CHUNK)
    const tuples = Prisma.join(
      slice.map((r) =>
        Prisma.sql`(${r.id_player}::int, ${Prisma.join(
          r.values.map((v, idx) => Prisma.sql`${v}::${Prisma.raw(colDefs[idx]!.cast)}`),
          ', '
        )})`
      )
    )
    await prisma.$executeRaw`
      UPDATE ${Prisma.raw(`"${tableName}"`)} AS t
      SET ${setClause}
      FROM (VALUES ${tuples}) AS v(${colAliases})
      WHERE t.id_player = v.id
    `
  }
  return rowsOut.length
}

// ── Import de filas parseadas (compartido con /api/admin/import-stats-zip) ─────

export interface WyscoutMaps {
  /** wyscout_id (string) → id_player */
  wyMap: Map<string, number>
  /** set de id_player existentes en la BD */
  idPlayerSet: Set<number>
}

/**
 * Precarga los mapas de matching usados al importar stats: `wyscout_id → id_player`
 * (de wyscout_id_1/2) y el set de `id_player` existentes (para validar el fallback
 * por id_player explícito). Una sola vez por import; reutilizable por script y ruta.
 */
export async function loadWyscoutMaps(): Promise<WyscoutMaps> {
  const players = await prisma.jugador.findMany({
    where: { OR: [{ wyscout_id_1: { not: null } }, { wyscout_id_2: { not: null } }] },
    select: { id_player: true, wyscout_id_1: true, wyscout_id_2: true },
  })
  const wyMap = new Map<string, number>()
  for (const p of players) {
    if (p.wyscout_id_1) wyMap.set(String(p.wyscout_id_1).trim(), p.id_player)
    if (p.wyscout_id_2) wyMap.set(String(p.wyscout_id_2).trim(), p.id_player)
  }
  const idPlayerSet = new Set(
    (await prisma.jugador.findMany({ select: { id_player: true } })).map((p) => p.id_player)
  )
  return { wyMap, idPlayerSet }
}

export interface ImportRowsResult {
  /** upserts exitosos */
  success: number
  /** filas sin jugador en BD (ni por id_player ni por wyscout_id) */
  notFound: number
  /** filas fallidas (incluye notFound + errores de upsert) */
  failed: number
  /** jugadores únicos resueltos (upserts intentados) */
  matched: number
  errors: string[]
  /** avisos no fatales (p.ej. cambio parcial de cabeceras del export) */
  warnings: string[]
}

/**
 * Diagnostica el acoplamiento cabeceras↔`spanishToFieldMap`: cuenta cuántas columnas de stats
 * del Excel se reconocen. Si Wyscout cambia las cabeceras o el idioma del export, dejan de
 * reconocerse y se importarían filas con stats en null (pisando datos buenos). Devuelve el número
 * de columnas reconocidas y ejemplos de las cabeceras vistas para el mensaje de error.
 */
function diagnoseColumns(
  sampleRow: Record<string, unknown>,
  period: StatsPeriod
): { recognized: number; expected: number; headers: string[] } {
  const map = spanishToFieldMap(period)
  const present = new Set(Object.keys(sampleRow))
  const statLabels = Object.keys(map).filter((k) => k !== 'Jugador')
  const recognized = statLabels.filter((label) => present.has(label)).length
  return { recognized, expected: statLabels.length, headers: [...present] }
}

type UpsertableTable = { upsert: (args: unknown) => Promise<unknown> }

/**
 * Importa filas ya parseadas de un Excel de stats (columnas en español) a la tabla
 * `player_stats_{period}`. Deduplica por `id_player` (última fila gana), resuelve el
 * jugador por `id_player` explícito o por `wyscout_id`, y hace upsert con concurrencia
 * limitada (para no agotar el pool). Es la misma lógica que usa el importador de ZIP.
 *
 * @param onProgress callback (procesados, total_únicos) llamado tras cada lote.
 * @param label      etiqueta (p.ej. nombre de archivo) para prefijar los errores.
 */
export async function importParsedRows(
  rows: Array<Record<string, unknown>>,
  period: StatsPeriod,
  ctx: WyscoutMaps,
  onProgress?: (processed: number, total: number) => void,
  label = 'archivo'
): Promise<ImportRowsResult> {
  const result: ImportRowsResult = { success: 0, notFound: 0, failed: 0, matched: 0, errors: [], warnings: [] }
  const table = getPrismaTableByPeriod(period) as unknown as UpsertableTable

  // 0) Diagnóstico de columnas: evita el fallo silencioso del acoplamiento labels↔spanishToFieldMap.
  //    Si ninguna columna de stats se reconoce, el formato del export cambió; abortamos ANTES de
  //    upsertear filas con stats en null que sobrescribirían datos buenos existentes.
  if (rows.length > 0) {
    const { recognized, expected, headers } = diagnoseColumns(rows[0]!, period)
    if (recognized === 0) {
      result.errors.push(
        `${label}: 0 columnas de stats reconocidas — el formato/idioma del export Wyscout cambió. ` +
          `Cabeceras vistas: ${headers.slice(0, 10).join(', ')}`
      )
      return result // sin columnas mapeables no importamos (evita pisar stats con null)
    }
    if (recognized < 10) {
      result.warnings.push(
        `${label}: solo ${recognized}/${expected} columnas de stats reconocidas — posible cambio parcial de cabeceras.`
      )
    }
  }

  // 1) Resolver matching y deduplicar por id_player (última fila gana).
  //    Evita que dos filas del mismo jugador colisionen en la PK.
  const matched = new Map<number, Record<string, unknown>>()
  for (const raw of rows) {
    const norm = normalizeStatsRow(raw, period)
    const wyscoutId = parseString(norm.wyscout_id as string | number)
    const idPlayerRaw = parseString(norm.id_player as string | number)

    let idPlayer: number | undefined
    if (idPlayerRaw) {
      const num = parseInt(idPlayerRaw, 10)
      if (!isNaN(num) && ctx.idPlayerSet.has(num)) idPlayer = num
    }
    if (idPlayer === undefined && wyscoutId) idPlayer = ctx.wyMap.get(wyscoutId)

    if (idPlayer === undefined) {
      result.notFound++
      result.failed++
      continue
    }
    matched.set(idPlayer, mapRowToStatsData(norm, period))
  }
  result.matched = matched.size

  // 2) Upsert con concurrencia limitada.
  const entries = [...matched.entries()]
  const CONCURRENCY = 8
  let processed = 0
  for (let i = 0; i < entries.length; i += CONCURRENCY) {
    const slice = entries.slice(i, i + CONCURRENCY)
    await Promise.all(
      slice.map(async ([idPlayer, data]) => {
        try {
          await table.upsert({
            where: { id_player: idPlayer },
            update: data,
            create: { id_player: idPlayer, ...data },
          })
          result.success++
        } catch (e: unknown) {
          result.failed++
          if (result.errors.length < 100) {
            result.errors.push(
              `${label}: error id_player ${idPlayer}: ${e instanceof Error ? e.message : 'desconocido'}`
            )
          }
        }
      })
    )
    processed += slice.length
    onProgress?.(processed, entries.length)
  }

  return result
}
