/**
 * 🧮 FMI DERIVATIVES SERVICE
 *
 * Recalcula los ~148 campos derivados de la tabla `atributos` a partir de los
 * atributos FMI brutos (corners_fmi, pace_fmi, etc.) siguiendo las fórmulas
 * exactas del ATTRIBUTES.xlsx del cliente.
 *
 * IMPORTANTE: los atributos FMI llegan del JSON en escala 0–20. El cliente
 * trabaja en 0–10, por lo que dividimos por 2 al leer (sin modificar la BD).
 *
 * Fuente de verdad: `src/lib/services/fmi-derivatives-specs.json` (generado
 * automáticamente desde el Excel). Si el cliente cambia las fórmulas, basta
 * con regenerar el JSON sin tocar este service.
 */

import { Prisma } from '@prisma/client'

import { prisma } from '@/lib/db'
import { percentileRank } from '@/lib/utils/percentile'

import specsJson from './fmi-derivatives-specs.json'

// ── Tipos de las specs ──────────────────────────────────────────────────────
interface LevelSpec { target: string; source: string }
interface RoleBaseSpec { target: string; inputs: string[] }                                 // SUM(6)
interface RolePctSpec { target: string; numerator: string; denominators: string[] }         // X*100 / SUM(roles)
interface StyleAvgSpec { target: string; inputs: string[] }                                 // AVERAGE(N)
interface StyleGkCondSpec { target: string; kind: 'avg'; gk: string[]; field: string[] }    // IF(GK=10, AVG(gk), AVG(field))
interface TendencySpec { target: string; kind: 'sum'; gk: string[]; field: string[] }       // IF(GK=10, SUM(gk), SUM(field))
interface TendencyPctSpec { target: string; numerator: string; pair: string[] }             // 100*X/SUM(X,Y)
interface SpecialSpec { target: string; kind?: string; source?: string }

interface Specs {
  levels: LevelSpec[]
  rolesBase: RoleBaseSpec[]
  rolesPct: RolePctSpec[]
  stylesAvg: StyleAvgSpec[]
  stylesGkCond: StyleGkCondSpec[]
  tendency: TendencySpec[]
  tendencyPct: TendencyPctSpec[]
  specials: SpecialSpec[]
}
const SPECS = specsJson as Specs

// ── Eventos ─────────────────────────────────────────────────────────────────
export type FmiRecalcEvent =
  | { type: 'phase'; message: string }
  | { type: 'progress'; current: number; total: number; percentage: number }
  | { type: 'done'; updated: number; total: number }

// ── Helpers ─────────────────────────────────────────────────────────────────
const num = (v: unknown): number | null => {
  if (v === null || v === undefined) return null
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : null
}

/** Clasifica un valor 0-10 en "A+"/"A"/"B"/"C"/"D"/null (umbrales del cliente). */
const levelLetter = (v: number | null): string | null => {
  if (v === null) return null
  if (v >= 8) return 'A+'
  if (v >= 6) return 'A'
  if (v >= 4) return 'B'
  if (v >= 2) return 'C'
  return 'D'
}

const sum = (arr: (number | null)[]): number | null => {
  let total = 0
  let anyDefined = false
  for (const v of arr) {
    if (v !== null) { total += v; anyDefined = true }
  }
  return anyDefined ? total : null
}
const avg = (arr: (number | null)[]): number | null => {
  const defined = arr.filter((v): v is number => v !== null)
  return defined.length ? defined.reduce((a, b) => a + b, 0) / defined.length : null
}

// ── Cálculo por fila ────────────────────────────────────────────────────────
/**
 * Dada una fila de atributos brutos (escala 0–20), devuelve un objeto con
 * todos los derivados calculados (escala 0–10 internamente). Los `_level`
 * son strings ("A+"/"A"/"B"/"C"/"D"); el resto son números (redondeados a
 * Int) o null. Compatible con todas las columnas existentes en `atributos`.
 */
export function computeFmiDerivatives(
  raw: Record<string, number | null>
): Record<string, number | string | null> {
  // Vista divida por 2 (sin mutar el original)
  const r: Record<string, number | null> = {}
  for (const [k, v] of Object.entries(raw)) r[k] = v === null ? null : v / 2
  const get = (k: string): number | null => (k in r ? r[k]! : null)

  const out: Record<string, number | string | null> = {}
  const round = (n: number | null) => (n === null ? null : Math.round(n))

  // 1) Roles base (SUM de 6 atributos)
  for (const spec of SPECS.rolesBase) {
    out[spec.target] = round(sum(spec.inputs.map(get)))
  }

  // 2) Roles % (numerador / sum(21 roles))
  for (const spec of SPECS.rolesPct) {
    const numer = num(out[spec.numerator])
    const denom = sum(spec.denominators.map((d) => num(out[d])))
    out[spec.target] = numer === null || !denom ? null : round((numer * 100) / denom)
  }

  // 3) Styles AVG simples (AVERAGE de N atributos)
  for (const spec of SPECS.stylesAvg) {
    out[spec.target] = round(avg(spec.inputs.map(get)))
  }

  // 4) Styles GK-conditional. El Excel usa IF(goalkeeper=10) con familiaridad
  // máxima exacta (20 raw → 10). Usamos umbral >= 9 (18+ raw) para no perder
  // porteros con familiaridad 19 por un check de igualdad estricta.
  const isGk = (get('goalkeeper_fmi') ?? 0) >= 9
  for (const spec of SPECS.stylesGkCond) {
    const inputs = isGk ? spec.gk : spec.field
    out[spec.target] = round(avg(inputs.map(get)))
  }

  // 5) Tendencias (SUM de N atributos, GK-conditional)
  for (const spec of SPECS.tendency) {
    const inputs = isGk ? spec.gk : spec.field
    out[spec.target] = round(sum(inputs.map(get)))
  }

  // 6) Tendencias % (100 * numerator / SUM(numerator, opposite))
  // NOTA: el ATTRIBUTES.xlsx original tiene un error de copia en 4 pares
  // (direct_att, high_block, influence_def, tight_spaces usan el numerador del
  // lado contrario, con lo que ambos % del par salen idénticos). El par de pie
  // sí es correcto (cada % = cuota del propio lado) y marca la semántica
  // intencionada; los specs corrigen deliberadamente esos 4 numeradores.
  for (const spec of SPECS.tendencyPct) {
    const numer = num(out[spec.numerator])
    const denom = sum(spec.pair.map((d) => num(out[d])))
    out[spec.target] = numer === null || !denom ? null : round((numer * 100) / denom)
  }

  // 7) Specials (antes que levels: hay levels que dependen de styles "special" como finishing)
  for (const spec of SPECS.specials) {
    switch (spec.kind) {
      case 'passthrough':
        // right/left_foot_tendency = raw value /2; same for *_dominance
        out[spec.target] = round(get(spec.source!))
        break
      case 'injury_resistance':
        // AVERAGE(10 - injury_proness_fmi, natural_fitness_fmi)
        {
          const inj = get('injury_proness_fmi')
          const nf = get('natural_fitness_fmi')
          out[spec.target] = inj === null ? null : round(avg([10 - inj, nf]))
        }
        break
      case 'finishing':
        // Fórmula del Excel (verificada contra ATTRIBUTES.xlsx, celda FS2):
        //   IFERROR(IF(BO2=10,0,AVERAGE(F2,H2,L2,AJ2)),"-")
        // con F=crossing_fmi, H=finishing_fmi, L=long_shots_fmi, AJ=flair_fmi.
        out[spec.target] = isGk
          ? 0
          : round(avg(['crossing_fmi', 'finishing_fmi', 'long_shots_fmi', 'flair_fmi'].map(get)))
        break
      case 'total_fmi_pts':
        // SUM(todos los _fmi de 'corners_fmi' a 'controversy_fmi') - SUM(dirtiness, injury_proness, controversy)
        {
          const RAW_ATTRS = [
            'corners_fmi','crossing_fmi','dribbling_fmi','finishing_fmi','first_touch_fmi','free_kick_taking_fmi',
            'heading_fmi','long_shots_fmi','passing_fmi','penalty_taking_fmi','tackling_fmi','technique_fmi',
            'marking_fmi','off_the_ball_fmi','positioning_fmi','long_throws_fmi',
            'acceleration_fmi','agility_fmi','balance_fmi','jumping_fmi','natural_fitness_fmi','pace_fmi','stamina_fmi','strength_fmi',
            'aggression_fmi','anticipation_fmi','bravery_fmi','composure_fmi','concentration_fmi','decisions_fmi',
            'determination_fmi','flair_fmi','leadership_fmi','team_work_fmi','vision_fmi','work_rate_fmi',
            'aerial_ability_fmi','command_of_area_fmi','communication_fmi','eccentricity_fmi','handling_fmi','kicking_fmi',
            'one_on_ones_fmi','tendency_to_punch_fmi','reflexes_fmi','rushing_out_fmi','throwing_fmi',
            'left_foot_fmi','right_foot_fmi',
            'consistency_fmi','dirtiness_fmi','important_matches_fmi','injury_proness_fmi','versality_fmi',
            'adaptability_fmi','ambition_fmi','loyalty_fmi','pressure_fmi','professional_fmi','sportsmanship_fmi','temperament_fmi','controversy_fmi',
          ]
          const negatives = ['dirtiness_fmi','injury_proness_fmi','controversy_fmi']
          const total = sum(RAW_ATTRS.map(get)) ?? 0
          const neg = sum(negatives.map(get)) ?? 0
          out[spec.target] = round(total - neg)
        }
        break
      case 'total_fmi_pts_norm':
        // Lo dejamos a null aquí (depende de MIN/MAX poblacional, lo calcula la fase de normalización).
        // Se sobrescribirá en un segundo pase post-cálculo (ver recalculateAll).
        out[spec.target] = null
        break
      default:
        out[spec.target] = null
    }
  }

  // 8) Niveles (string A+/A/B/C/D sobre el valor fuente: raw o ya computado en cualquier paso previo)
  for (const spec of SPECS.levels) {
    const v = spec.source in out ? num(out[spec.source]) : get(spec.source)
    out[spec.target] = levelLetter(v)
  }

  return out
}

// ── Recálculo masivo en BD ──────────────────────────────────────────────────
/**
 * Carga todas las filas de `atributos`, computa los 148 derivados con las
 * fórmulas del cliente y hace UPDATE masivo (UPDATE ... FROM VALUES) por lotes.
 * Tras el bulk, calcula `total_fmi_pts_norm` = (val-MIN)/(MAX-MIN)*100 sobre
 * la población.
 */
export async function recalcFmiDerivatives(
  onEvent?: (e: FmiRecalcEvent) => void
): Promise<{ updated: number }> {
  const emit = (e: FmiRecalcEvent) => onEvent?.(e)

  // 1) Cargar todos los atributos brutos necesarios + id_player
  emit({ type: 'phase', message: '📥 Cargando atributos FMI brutos...' })
  const RAW_COLS = [
    'corners_fmi','crossing_fmi','dribbling_fmi','finishing_fmi','first_touch_fmi','free_kick_taking_fmi',
    'heading_fmi','long_shots_fmi','passing_fmi','penalty_taking_fmi','tackling_fmi','technique_fmi',
    'marking_fmi','off_the_ball_fmi','positioning_fmi','long_throws_fmi',
    'acceleration_fmi','agility_fmi','balance_fmi','jumping_fmi','natural_fitness_fmi','pace_fmi','stamina_fmi','strength_fmi',
    'aggression_fmi','anticipation_fmi','bravery_fmi','composure_fmi','concentration_fmi','decisions_fmi',
    'determination_fmi','flair_fmi','leadership_fmi','team_work_fmi','vision_fmi','work_rate_fmi',
    'aerial_ability_fmi','command_of_area_fmi','communication_fmi','eccentricity_fmi','handling_fmi','kicking_fmi',
    'one_on_ones_fmi','tendency_to_punch_fmi','reflexes_fmi','rushing_out_fmi','throwing_fmi',
    'left_foot_fmi','right_foot_fmi',
    'consistency_fmi','dirtiness_fmi','important_matches_fmi','injury_proness_fmi','versality_fmi',
    'adaptability_fmi','ambition_fmi','loyalty_fmi','pressure_fmi','professional_fmi','sportsmanship_fmi','temperament_fmi','controversy_fmi',
    'goalkeeper_fmi','defender_right_fmi','defender_central_fmi','defender_left_fmi','wing_back_right_fmi','defensive_midfielder_fmi','wing_back_left_fmi',
    'midfielder_right_fmi','midfielder_central_fmi','midfielder_left_fmi','attacking_mid_right_fmi','attacking_mid_central_fmi','attacking_mid_left_fmi','striker_fmi',
  ]
  const select: Record<string, true> = { id_player: true }
  for (const c of RAW_COLS) select[c] = true
  const rows = (await prisma.atributos.findMany({ select })) as Array<Record<string, unknown>>
  emit({ type: 'phase', message: `✅ ${rows.length} filas cargadas. Computando derivados...` })

  // 2) Computar derivados por fila
  type ComputedRow = { id: number; vals: Record<string, number | string | null> }
  const computed: ComputedRow[] = []
  for (const row of rows) {
    const raw: Record<string, number | null> = {}
    for (const c of RAW_COLS) raw[c] = num(row[c])
    computed.push({ id: row.id_player as number, vals: computeFmiDerivatives(raw) })
  }

  // 3) Lista ordenada de columnas derivadas (clave estable para el bulk UPDATE)
  const ALL_TARGETS = [
    ...SPECS.rolesBase.map((s) => s.target),
    ...SPECS.rolesPct.map((s) => s.target),
    ...SPECS.stylesAvg.map((s) => s.target),
    ...SPECS.stylesGkCond.map((s) => s.target),
    ...SPECS.tendency.map((s) => s.target),
    ...SPECS.tendencyPct.map((s) => s.target),
    ...SPECS.levels.map((s) => s.target),
    ...SPECS.specials.filter((s) => s.kind !== 'total_fmi_pts_norm').map((s) => s.target),
  ]
  const TARGET_TYPES: Record<string, 'int' | 'text'> = {}
  for (const s of SPECS.levels) TARGET_TYPES[s.target] = 'text'
  for (const t of ALL_TARGETS) if (!TARGET_TYPES[t]) TARGET_TYPES[t] = 'int'

  // 4) UPDATE masivo en lotes
  emit({ type: 'phase', message: `💾 Escribiendo ${computed.length} filas × ${ALL_TARGETS.length} columnas...` })
  const setClause = Prisma.join(
    ALL_TARGETS.map((col, i) => Prisma.sql`${Prisma.raw(`"${col}"`)} = v.${Prisma.raw(`c${i}`)}`),
    ', '
  )
  const colAliases = Prisma.join(
    [Prisma.raw('id'), ...ALL_TARGETS.map((_, i) => Prisma.raw(`c${i}`))],
    ', '
  )

  const CHUNK = 100  // 4500 / 100 ≈ 45 round-trips; 100 × 149 = ~15k params (bajo límite)
  let processed = 0
  for (let i = 0; i < computed.length; i += CHUNK) {
    const slice = computed.slice(i, i + CHUNK)
    const tuples = Prisma.join(
      slice.map((r) => {
        const valueFrags = ALL_TARGETS.map((col) => {
          const v = r.vals[col]
          const type = TARGET_TYPES[col]
          if (type === 'text') {
            return Prisma.sql`${v == null ? null : String(v)}::text`
          }
          // int (nullable)
          const n = v == null ? null : typeof v === 'number' ? v : Number(v)
          return Prisma.sql`${n}::integer`
        })
        return Prisma.sql`(${r.id}::int, ${Prisma.join(valueFrags, ', ')})`
      })
    )
    await prisma.$executeRaw`
      UPDATE atributos AS t
      SET ${setClause}
      FROM (VALUES ${tuples}) AS v(${colAliases})
      WHERE t.id_player = v.id
    `
    processed += slice.length
    onEvent?.({ type: 'progress', current: processed, total: computed.length, percentage: Math.round((processed / computed.length) * 100) })
  }

  // 5) Segundo pase: total_fmi_pts_norm = percentil 0-100 de total_fmi_pts sobre
  // la población (convención única de la app, ver src/lib/utils/percentile.ts).
  // Se escribe en `atributos` (Int) y en `jugadores` (Float) para mantener
  // ambas tablas coherentes con una sola fórmula.
  emit({ type: 'phase', message: '📊 Recalculando total_fmi_pts_norm (percentil poblacional)...' })
  const totalsSorted = computed
    .map((c) => num(c.vals.total_fmi_pts))
    .filter((v): v is number => v !== null)
    .sort((a, b) => a - b)
  if (totalsSorted.length > 0) {
    const normPairs: Array<[number, number | null]> = computed.map((c) => {
      const v = num(c.vals.total_fmi_pts)
      const norm = v === null ? null : percentileRank(totalsSorted, v)
      return [c.id, norm]
    })
    const NCHUNK = 1000
    for (let i = 0; i < normPairs.length; i += NCHUNK) {
      const slice = normPairs.slice(i, i + NCHUNK)
      const atributosTuples = Prisma.join(
        slice.map(([id, n]) => Prisma.sql`(${id}::int, ${n == null ? null : Math.round(n)}::integer)`)
      )
      await prisma.$executeRaw`
        UPDATE atributos AS t SET total_fmi_pts_norm = v.n
        FROM (VALUES ${atributosTuples}) AS v(id, n) WHERE t.id_player = v.id
      `
      const jugadorTuples = Prisma.join(
        slice.map(([id, n]) => Prisma.sql`(${id}::int, ${n == null ? null : Math.round(n * 100) / 100}::double precision)`)
      )
      await prisma.$executeRaw`
        UPDATE jugadores AS t SET total_fmi_pts_norm = v.n
        FROM (VALUES ${jugadorTuples}) AS v(id, n) WHERE t.id_player = v.id
      `
    }
  }

  emit({ type: 'done', updated: computed.length, total: computed.length })
  return { updated: computed.length }
}
