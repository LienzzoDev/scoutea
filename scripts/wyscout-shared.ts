/**
 * 🧩 CONFIG + DESCUBRIMIENTO COMPARTIDO DE WYSCOUT
 *
 * Fuente única para el script de export (wyscout-export.ts) y el harness de discovery
 * (wyscout-discover.ts): constantes del preset "gino", periodos↔time_frame, y el descubrimiento
 * de listas.
 *
 * Requiere que el proceso haya cargado dotenv ANTES de llamar a getAllLists (los entry scripts
 * hacen `import 'dotenv/config'` como primer import).
 */
import axios from 'axios'

import type { StatsPeriod } from '../src/lib/utils/stats-period-utils'

export const REST = 'https://rest.wyscout.com'
/** Host de la API "legacy/fluid" para exports con rango de fechas custom (6M/2Y). */
export const SEARCHAPI = 'https://searchapi.wyscout.com'

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
export const isoDate = (d: Date) => d.toISOString().slice(0, 10)

/** Rango custom [hoy − monthsBack, hoy] en YYYY-MM-DD. */
export function customRange(monthsBack: number): { from: string; to: string } {
  const now = new Date()
  const from = new Date(now)
  from.setMonth(from.getMonth() - monthsBack)
  return { from: isoDate(from), to: isoDate(now) }
}

// ─── PERIODOS ────────────────────────────────────────────────────────────────

export interface PeriodSpec {
  /** 2ª palabra del nombre de archivo (3M/6M/1Y/2Y) — el importador deriva el periodo de aquí. */
  label: string
  period: StatsPeriod
  /** Ventana rodante: meses hacia atrás desde hoy para el rango [from, to] del export fluid. */
  monthsBack: number
}

/**
 * Periodos a descargar por lista (CONFIRMADO en discovery, Fase 2). TODOS usan el export "fluid"
 * de searchapi con ventana de fechas rodante — es el único que devuelve stats per-90 (getExcelByList
 * solo da totales). El importador deriva el periodo del nombre de archivo (2ª palabra).
 */
export const PERIODS: PeriodSpec[] = [
  { label: '3M', period: '3m', monthsBack: 3 },
  { label: '6M', period: '6m', monthsBack: 6 },
  { label: '1Y', period: '1y', monthsBack: 12 },
  { label: '2Y', period: '2y', monthsBack: 24 },
]

// ─── COMPETICIONES + PRESET DE COLUMNAS "gino" ─────────────────────────────────

/** Competiciones activas por defecto (según la doc). Van DENTRO del objeto search. */
export const COMPETITIONS = {
  national_league: true,
  national_cups: true,
  international_cups: true,
  international_friendly: true,
  international_club_cups: true,
  club_friendly: false,
  youth: false,
} as const

/**
 * Preset "gino" (stats por-90). Los `label` casan EXACTO con las cabeceras que espera el
 * importador (spanishToFieldMap en period-stats-import.ts). Wyscout añade la columna `id`
 * (Wyscout ID) al exportar por lista. NO cambiar labels sin actualizar spanishToFieldMap.
 */
export const COLUMNS_GINO: Array<{ id: string; label: string }> = [
  { id: 'name', label: 'Jugador' },
  { id: 'total_matches', label: 'Partidos jugados' },
  { id: 'minutes_on_field', label: 'Minutos jugados' },
  { id: 'defensive_duels_avg', label: 'Duelos defensivos/90' },
  { id: 'defensive_duels_won', label: 'Duelos defensivos ganados, %' },
  { id: 'aerial_duels_avg', label: 'Duelos aéreos en los 90' },
  { id: 'aerial_duels_won', label: 'Duelos aéreos ganados, %' },
  { id: 'tackle_avg', label: 'Entradas/90' },
  { id: 'interceptions_avg', label: 'Interceptaciones/90' },
  { id: 'fouls_avg', label: 'Faltas/90' },
  { id: 'yellow_cards_avg', label: 'Tarjetas amarillas/90' },
  { id: 'red_cards_avg', label: 'Tarjetas rojas/90' },
  { id: 'goals_avg', label: 'Goles/90' },
  { id: 'shots_avg', label: 'Remates/90' },
  { id: 'assists_avg', label: 'Asistencias/90' },
  { id: 'crosses_avg', label: 'Centros/90' },
  { id: 'offensive_duels_avg', label: 'Duelos atacantes/90' },
  { id: 'offensive_duels_won', label: 'Duelos atacantes ganados, %' },
  { id: 'passes_avg', label: 'Pases/90' },
  { id: 'accurate_passes_percent', label: 'Precisión pases, %' },
  { id: 'forward_passes_avg', label: 'Pases hacia adelante/90' },
  { id: 'conceded_goals_avg', label: 'Goles recibidos/90' },
  { id: 'shots_against_avg', label: 'Remates en contra/90' },
  { id: 'clean_sheets', label: 'Porterías imbatidas en los 90' },
  { id: 'save_percent', label: 'Paradas, %' },
  { id: 'prevented_goals_avg', label: 'Goles evitados/90' },
]

/** Headers que la web usa en el POST de export (capturados en discovery). */
export const EXPORT_HEADERS = {
  'Content-Type': 'application/json',
  Origin: 'https://wyscout-apps.hudl.com',
  Referer: 'https://wyscout-apps.hudl.com/',
}

export const EXPORT_SORT = 'minutes_on_field desc'
export const EXPORT_LANGUAGE = 'es'

/**
 * Columnas para el export fluid: COLUMNS_GINO + la columna `id` (Wyscout ID), como OBJETO
 * indexado {0:{id,label},...}. Con array el endpoint responde 500 (confirmado en discovery).
 */
export const FLUID_COLUMNS: Record<number, { id: string; label: string }> = Object.fromEntries(
  [...COLUMNS_GINO, { id: 'id', label: 'id' }].map((c, i) => [i, c])
)

/**
 * Body EXACTO del export "fluid" (searchapi /api/v1/search/fluid.xlsx), CONFIRMADO en discovery.
 * Devuelve stats per-90 en el rango [from, to] + columna id. `ids` = IDs de la lista (coma-sep).
 * `competition_types:''` = todas. `columns` DEBE ir como objeto indexado (array → 500).
 */
export function fluidExportBody(
  playerIds: number[],
  from: string,
  to: string,
  token: string
): Record<string, unknown> {
  return {
    ids: playerIds.join(','),
    time_frame: 'fluid',
    from,
    to,
    competition_types: '',
    count: 100,
    page: 0,
    sort: EXPORT_SORT,
    columns: FLUID_COLUMNS,
    search: '',
    lang: EXPORT_LANGUAGE,
    womenMode: false,
    access_token: token,
  }
}

// ─── DESCUBRIMIENTO DE LISTAS ──────────────────────────────────────────────────

export interface WyscoutList {
  id: number
  name: string
  count: number
  /** IDs de jugador (Wyscout, negativos) si se pidió con { withElements: true }. */
  elements?: number[]
}

function envGroupIds(): { groupId: string; subgroupId: string } {
  return {
    groupId: process.env.WYSCOUT_GROUP_ID || '1395660',
    subgroupId: process.env.WYSCOUT_SUBGROUP_ID || '476805',
  }
}

/** Normaliza un array de elementos que puede venir como números o como objetos {id}. */
function normalizeIds(raw: unknown): number[] {
  if (!Array.isArray(raw)) return []
  const out: number[] = []
  for (const e of raw) {
    if (typeof e === 'number') out.push(e)
    else if (e && typeof (e as { id?: unknown }).id === 'number') out.push((e as { id: number }).id)
  }
  return out
}

/**
 * Todas las listas del grupo (paginado). Con { withElements: true } añade `fetch=elements` y
 * rellena `elements` con los IDs de jugador de cada lista — la vía CONFIRMADA para obtener los IDs
 * (el endpoint por-lista /v1/lists/{id}.json da 404 en esta cuenta).
 */
export async function getAllLists(
  token: string,
  opts: { withElements?: boolean } = {}
): Promise<WyscoutList[]> {
  const { groupId, subgroupId } = envGroupIds()
  const all: WyscoutList[] = []
  let page = 0
  // Salvaguarda anti-bucle (por si meta.page_count viene raro).
  for (let guard = 0; guard < 100; guard++) {
    const params: Record<string, string | number> = {
      access_token: token,
      group_id: groupId,
      subgroup_id: subgroupId,
      page,
    }
    if (opts.withElements) params.fetch = 'elements'

    const res = await axios.get(`${REST}/v1/lists/lists.json`, { params, validateStatus: () => true })
    if (res.status !== 200) {
      throw new Error(`getAllLists ${res.status}: ${JSON.stringify(res.data).slice(0, 200)}`)
    }
    const data = res.data ?? {}
    const lists: Array<Record<string, unknown>> = data.elements ?? []
    for (const l of lists) {
      const rawElems = (l as { elements?: unknown }).elements
      const entry: WyscoutList = {
        id: Number(l.id),
        name: (l.name as string) ?? `list_${l.id}`,
        count: typeof l.count === 'number' ? l.count : Array.isArray(rawElems) ? rawElems.length : 0,
      }
      // exactOptionalPropertyTypes: solo añadimos `elements` cuando se pidió (no asignar undefined).
      if (opts.withElements) entry.elements = normalizeIds(rawElems)
      all.push(entry)
    }
    const meta = (data.meta ?? {}) as { page_count?: number }
    if (page >= (meta.page_count ?? 1) - 1) break
    page++
    await sleep(400)
  }
  return all
}

/** IDs de jugador de una lista (ya venidos inline con withElements). */
export function listPlayerIds(list: WyscoutList): number[] {
  return list.elements ?? []
}

// ─── NAMING DE FICHEROS ────────────────────────────────────────────────────────

/** Nombre de fichero seguro para una descarga: `{lista}_{id}_{PERIODO}.xlsx`. */
export function outFileName(list: Pick<WyscoutList, 'id' | 'name'>, label: string): string {
  const safe = list.name.replace(/[\\/\s]+/g, '_')
  return `${safe}_${list.id}_${label}.xlsx`
}
