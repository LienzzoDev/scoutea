/**
 * 🔗 FUSIÓN DE STATS DE VARIOS PERFILES WYSCOUT DEL MISMO JUGADOR
 *
 * Un jugador real puede tener varios Wyscout ID (perfiles duplicados). Cuando esos perfiles son
 * COMPLEMENTARIOS (cubren partidos distintos), sus stats se combinan sumando los conteos reales y
 * recomponiendo las tasas — NUNCA promediando per-90/porcentajes a lo bruto (sería estadísticamente
 * incorrecto y alteraría los valores reales).
 *
 * Opera sobre filas "crudas" del export (claves = cabeceras en español del preset "gino"), a
 * precisión completa (antes del redondeo que aplica period-stats-import). Es una función pura.
 * Los derivados (*_tot, effectiveness_%, clean_sheets_%) NO se calculan aquí: los recalcula
 * mapRowToStatsData sobre la fila fusionada, quedando consistentes.
 *
 * Ver docs/superpowers/specs/2026-07-24-merge-wyscout-ids-stats-design.md
 */

type RawRow = Record<string, unknown>

const MINUTES_LABEL = 'Minutos jugados'
const NAME_LABEL = 'Jugador'
const ID_LABEL = 'id'

/** Conteos: se suman tal cual (si todos null → null). */
const COUNT_LABELS = ['Partidos jugados', 'Minutos jugados', 'Porterías imbatidas en los 90']

/** Tasas per-90: media ponderada por minutos = Σ(p90ᵢ·minᵢ)/Σminᵢ. */
const PER90_LABELS = [
  'Duelos defensivos/90',
  'Duelos aéreos en los 90',
  'Entradas/90',
  'Interceptaciones/90',
  'Faltas/90',
  'Tarjetas amarillas/90',
  'Tarjetas rojas/90',
  'Goles/90',
  'Remates/90',
  'Asistencias/90',
  'Centros/90',
  'Duelos atacantes/90',
  'Pases/90',
  'Pases hacia adelante/90',
  'Goles recibidos/90',
  'Remates en contra/90',
  'Goles evitados/90',
]

/** Porcentajes ganados: media ponderada por su volumen (per-90 × minutos). */
const PERCENT_VOLUME_PAIRS: Array<{ pct: string; vol: string }> = [
  { pct: 'Duelos defensivos ganados, %', vol: 'Duelos defensivos/90' },
  { pct: 'Duelos aéreos ganados, %', vol: 'Duelos aéreos en los 90' },
  { pct: 'Duelos atacantes ganados, %', vol: 'Duelos atacantes/90' },
  { pct: 'Precisión pases, %', vol: 'Pases/90' },
]

const SAVE_LABEL = 'Paradas, %'
const CONCEDED_P90_LABEL = 'Goles recibidos/90'
const SHOTS_AGAINST_P90_LABEL = 'Remates en contra/90'

/** Físicos (no están en "gino" pero se manejan por robustez). */
const PHYS_SUM_LABELS = ['Metros totales', 'Metros > 15 km/h', 'Metros > 20 km/h', 'Metros > 25 km/h']
const PHYS_MAX_LABELS = ['Velocidad máxima']
const PHYS_WEIGHTED_LABELS = ['Metros/minuto']

function toNum(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null
  const n = typeof v === 'number' ? v : parseFloat(String(v))
  return Number.isNaN(n) ? null : n
}

function firstNonEmpty(rows: RawRow[], label: string): unknown {
  for (const r of rows) {
    const v = r[label]
    if (v !== null && v !== undefined && v !== '') return v
  }
  return null
}

/** Suma; null si ningún perfil aporta valor. */
function sumOrNull(rows: RawRow[], label: string): number | null {
  let any = false
  let sum = 0
  for (const r of rows) {
    const n = toNum(r[label])
    if (n !== null) {
      any = true
      sum += n
    }
  }
  return any ? sum : null
}

function maxOrNull(rows: RawRow[], label: string): number | null {
  let any = false
  let mx = -Infinity
  for (const r of rows) {
    const n = toNum(r[label])
    if (n !== null) {
      any = true
      if (n > mx) mx = n
    }
  }
  return any ? mx : null
}

/** Σ(valᵢ·minᵢ)/Σmin; null si ningún perfil aporta valor. Un valor null cuenta como 0. */
function weightedByMinutes(rows: RawRow[], label: string, mins: number[], totalMin: number): number | null {
  let any = false
  let numSum = 0
  for (let i = 0; i < rows.length; i++) {
    const raw = toNum(rows[i]![label])
    if (raw !== null) any = true
    numSum += (raw ?? 0) * mins[i]!
  }
  if (!any || totalMin <= 0) return null
  return numSum / totalMin
}

/** Σ(pctᵢ·volᵢ·minᵢ)/Σ(volᵢ·minᵢ); excluye perfiles con pct o vol null. */
function volumeWeightedPercent(rows: RawRow[], pctLabel: string, volLabel: string, mins: number[]): number | null {
  let wSum = 0
  let wDen = 0
  for (let i = 0; i < rows.length; i++) {
    const pct = toNum(rows[i]![pctLabel])
    const vol = toNum(rows[i]![volLabel])
    if (pct === null || vol === null) continue
    const w = vol * mins[i]!
    wSum += pct * w
    wDen += w
  }
  return wDen > 0 ? wSum / wDen : null
}

/**
 * Save rate merged. Reconstruye tiros a puerta (sot) por perfil desde los goles recibidos:
 *   concedidosᵢ = (Goles recibidos/90)ᵢ · minᵢ / 90
 *   sotᵢ = concedidosᵢ / (1 − save_rateᵢ/100)          (exacto, si save_rate < 100)
 *   sotᵢ ≈ (Remates en contra/90)ᵢ · minᵢ / 90         (proxy si save_rate ≥ 100 → concedidos 0)
 * merged = (1 − Σconcedidos / Σsot) · 100. Solo perfiles con save_rate presente (porteros).
 */
function mergeSaveRate(rows: RawRow[], mins: number[]): number | null {
  let anyGk = false
  let sotSum = 0
  let concededSum = 0
  for (let i = 0; i < rows.length; i++) {
    const sr = toNum(rows[i]![SAVE_LABEL])
    if (sr === null) continue
    anyGk = true
    const concededP90 = toNum(rows[i]![CONCEDED_P90_LABEL]) ?? 0
    const conceded = (concededP90 * mins[i]!) / 90
    let sot: number | null
    if (sr < 100) {
      sot = conceded / (1 - sr / 100)
    } else {
      const shotsAgainstP90 = toNum(rows[i]![SHOTS_AGAINST_P90_LABEL])
      sot = shotsAgainstP90 === null ? null : (shotsAgainstP90 * mins[i]!) / 90
    }
    if (sot === null || !Number.isFinite(sot)) continue
    sotSum += sot
    concededSum += conceded
  }
  if (!anyGk) return null
  return sotSum > 0 ? (1 - concededSum / sotSum) * 100 : null
}

/**
 * Fusiona N filas crudas (mismo jugador, mismas cabeceras del export) en UNA. Con una sola fila
 * devuelve la misma referencia (identidad: caso del 99% de jugadores, sin tocar valores).
 */
export function mergeRawStatsRows(rows: RawRow[]): RawRow {
  if (rows.length === 0) return {}
  if (rows.length === 1) return rows[0]!

  const mins = rows.map((r) => toNum(r[MINUTES_LABEL]) ?? 0)
  const totalMin = mins.reduce((a, b) => a + b, 0)

  const out: RawRow = {}
  out[NAME_LABEL] = firstNonEmpty(rows, NAME_LABEL)
  out[ID_LABEL] = firstNonEmpty(rows, ID_LABEL)

  for (const label of COUNT_LABELS) out[label] = sumOrNull(rows, label)
  for (const label of PER90_LABELS) out[label] = weightedByMinutes(rows, label, mins, totalMin)
  for (const { pct, vol } of PERCENT_VOLUME_PAIRS) out[pct] = volumeWeightedPercent(rows, pct, vol, mins)
  out[SAVE_LABEL] = mergeSaveRate(rows, mins)

  for (const label of PHYS_SUM_LABELS) out[label] = sumOrNull(rows, label)
  for (const label of PHYS_MAX_LABELS) out[label] = maxOrNull(rows, label)
  for (const label of PHYS_WEIGHTED_LABELS) out[label] = weightedByMinutes(rows, label, mins, totalMin)

  return out
}
