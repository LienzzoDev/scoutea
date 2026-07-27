/**
 * 🔢 POST-IMPORT CALCULATION SERVICE
 *
 * Orquesta los cálculos REALES que deben recalcularse tras cada importación de
 * jugadores, para que los campos derivados se completen automáticamente sin que
 * el admin tenga que ejecutar scripts a mano.
 *
 * Cálculos incluidos (todos con fuente de datos real, no placeholders):
 *  - age_value / age_value_percent / age_coeff       (media acumulada por edad)
 *  - nationality_value / nationality_value_percent   (media por nacionalidad)
 *  - player_trfm_value_norm / player_rating_norm      (normalización por percentiles)
 *
 * Implementación: un único SELECT carga todos los jugadores, los lookups se calculan
 * en memoria y la escritura usa UPDATE masivo (`UPDATE ... FROM (VALUES ...)`), de
 * modo que el recálculo completo son ~pocas decenas de round-trips (rápido y dentro
 * del límite de 300s de Vercel, sin importar la latencia).
 *
 * NOTA: position_value, owner_club_value, team_level_value y similares NO se incluyen
 * porque su única fuente en el código es DataPopulationService, que los genera con
 * valores aleatorios (placeholders), no con cálculos reales.
 */

import { Prisma } from '@prisma/client'

import { prisma } from '@/lib/db'
import { recalcFmiDerivatives } from '@/lib/services/fmi-derivatives-service'
import { percentileRank } from '@/lib/utils/percentile'

export type RecalcEvent =
  | { type: 'phase'; phase: string; message: string }
  | { type: 'progress'; phase: string; current: number; total: number; percentage: number }
  | { type: 'phase_done'; phase: string; updated: number; total: number }

export interface RecalcSummary {
  teamLinking: { teamIdLinked: number; teamStatusCopied: number; teamLevelCopied: number; competitionLevelCopied: number }
  ageValues: { total: number; updated: number }
  nationalityValues: { total: number; updated: number }
  normalizations: { updated: number }
  categories: { updated: number; counts: Record<string, number> }
  transferPoints: { teamPtsUpdated: number; competitionPtsUpdated: number }
  fmiDerivatives: { updated: number }
}

interface PlayerRow {
  id_player: number
  age: number | null
  player_trfm_value: number | null
  player_rating: number | null
  correct_nationality_1: string | null
  nationality_1: string | null
  competition_level: string | null
  team_status: string | null
}

/** (100 * value / expected) - 100, con los mismos guardas que los servicios originales. */
function deviationPercent(value: number | null, expected: number | null): number | null {
  if (!value || value === 0) return null
  if (!expected || expected === 0) return null
  return Math.round(((100 * value) / expected - 100) * 100) / 100
}

export class PostImportCalculationService {
  /**
   * Recalcula todos los campos derivados reales. Emite eventos de progreso vía el
   * callback `onEvent` para poder hacer streaming SSE al cliente.
   */
  static async recalculateAll(onEvent?: (e: RecalcEvent) => void): Promise<RecalcSummary> {
    const emit = (e: RecalcEvent) => onEvent?.(e)

    // Backfill: el cálculo de nacionalidad consume correct_nationality_1/2, que el
    // Excel no trae. Los rellenamos desde nationality_1/2 (idempotente, 1 statement).
    emit({ type: 'phase', phase: 'prepare', message: '🌍 Backfill de correct_nationality desde nationality...' })
    await prisma.$executeRaw`UPDATE jugadores SET correct_nationality_1 = nationality_1 WHERE correct_nationality_1 IS NULL AND nationality_1 IS NOT NULL`
    await prisma.$executeRaw`UPDATE jugadores SET correct_nationality_2 = nationality_2 WHERE correct_nationality_2 IS NULL AND nationality_2 IS NOT NULL`

    // ── Fase 0: enlazar Jugador→Equipo y heredar campos del equipo ────────────
    // Cruzamos jugadores.team_name con equipos.team_name (case-sensitive, exact)
    // y rellenamos team_id, team_status, team_level, team_elo y competition_level.
    // Esto desbloquea las categorías is_* (que dependen de team_status) y completa
    // los campos heredados que el import de BASE DATOS no rellena.
    emit({ type: 'phase', phase: 'team-link', message: '🔗 Enlazando jugadores con equipos (team_id, team_status, team_level...)' })
    const teamLinking = await this.recalcTeamLinking()
    emit({ type: 'phase_done', phase: 'team-link', updated: teamLinking.teamIdLinked, total: teamLinking.teamIdLinked })

    // Carga única de todos los jugadores en memoria
    const players = (await prisma.jugador.findMany({
      where: { player_name: { not: '' } },
      select: {
        id_player: true,
        age: true,
        player_trfm_value: true,
        player_rating: true,
        correct_nationality_1: true,
        nationality_1: true,
        competition_level: true,
        team_status: true,
      },
    })) as PlayerRow[]

    // ── Fase 1: valores de edad ──────────────────────────────────────────────
    emit({ type: 'phase', phase: 'age', message: '🎂 Recalculando valores de edad (age_value)...' })
    const ageUpdated = await this.recalcAgeValues(players, (c, t) =>
      emit({ type: 'progress', phase: 'age', current: c, total: t, percentage: t ? Math.round((c / t) * 100) : 100 })
    )
    emit({ type: 'phase_done', phase: 'age', updated: ageUpdated, total: players.length })

    // ── Fase 2: valores de nacionalidad ──────────────────────────────────────
    emit({ type: 'phase', phase: 'nationality', message: '🌍 Recalculando valores de nacionalidad (nationality_value)...' })
    const natUpdated = await this.recalcNationalityValues(players, (c, t) =>
      emit({ type: 'progress', phase: 'nationality', current: c, total: t, percentage: t ? Math.round((c / t) * 100) : 100 })
    )
    emit({ type: 'phase_done', phase: 'nationality', updated: natUpdated, total: players.length })

    // ── Fase 3: normalizaciones por percentiles ──────────────────────────────
    emit({ type: 'phase', phase: 'normalization', message: '📊 Recalculando normalizaciones (player_trfm_value_norm, player_rating_norm)...' })
    const normUpdated = await this.recalcNormalizations(players, (c, t) =>
      emit({ type: 'progress', phase: 'normalization', current: c, total: t, percentage: t ? Math.round((c / t) * 100) : 100 })
    )
    emit({ type: 'phase_done', phase: 'normalization', updated: normUpdated, total: normUpdated })

    // ── Fase 4: categorías is_* (Big Five / Top Leagues / Professional / Emerging / Youth)
    emit({ type: 'phase', phase: 'categories', message: '🏷️  Reclasificando categorías de jugador (is_big_five, etc.)...' })
    const cats = await this.recalcPlayerCategories(players, (c, t) =>
      emit({ type: 'progress', phase: 'categories', current: c, total: t, percentage: t ? Math.round((c / t) * 100) : 100 })
    )
    emit({ type: 'phase_done', phase: 'categories', updated: cats.updated, total: players.length })

    // ── Fase 4.5: transfer_team_pts / transfer_competition_pts ───────────────
    // Variación de "level" entre initial y current (cascada D<C<B<A<A+).
    emit({ type: 'phase', phase: 'transfer-pts', message: '🔁 Calculando puntos de transferencia (equipo + competición)...' })
    const transferPoints = await this.recalcTransferPoints()
    emit({ type: 'phase_done', phase: 'transfer-pts', updated: transferPoints.teamPtsUpdated + transferPoints.competitionPtsUpdated, total: players.length * 2 })

    // ── Fase 5: derivados FMI (niveles, roles, estilos, tendencias, dominancias)
    emit({ type: 'phase', phase: 'fmi', message: '🧮 Recalculando derivados FMI (niveles, roles, estilos, tendencias)...' })
    let fmiUpdated = 0
    try {
      const r = await recalcFmiDerivatives((e) => {
        if (e.type === 'phase') emit({ type: 'phase', phase: 'fmi', message: e.message })
        else if (e.type === 'progress') emit({ type: 'progress', phase: 'fmi', current: e.current, total: e.total, percentage: e.percentage })
      })
      fmiUpdated = r.updated
    } catch (err) {
      // No bloquear el recálculo global por un fallo en FMI
      emit({ type: 'phase', phase: 'fmi', message: `❌ Error en derivados FMI: ${err instanceof Error ? err.message : 'desconocido'}` })
    }
    emit({ type: 'phase_done', phase: 'fmi', updated: fmiUpdated, total: fmiUpdated })

    return {
      teamLinking,
      ageValues: { total: players.length, updated: ageUpdated },
      nationalityValues: { total: players.length, updated: natUpdated },
      normalizations: { updated: normUpdated },
      categories: cats,
      transferPoints,
      fmiDerivatives: { updated: fmiUpdated },
    }
  }

  /**
   * `transfer_team_pts`  = idx(team_level)        - idx(initial_team_level)
   * `transfer_competition_pts` = idx(competition_level) - idx(initial_competition_level)
   *
   * Donde idx() es la posición en la cascada ['D','C','B','A','A+'] (D=0, A+=4).
   * Replica exactamente la matriz [-4..+4] que la UI ya muestra como tabla.
   *
   * Se hace por SQL puro con un CASE WHEN — no toca memoria, idempotente.
   */
  private static async recalcTransferPoints(): Promise<RecalcSummary['transferPoints']> {
    // CASE WHEN devuelve 0..4 para A+/A/B/C/D; cualquier otro valor → NULL (no se actualiza).
    const levelToIdxSQL = (col: string) => Prisma.sql`
      CASE ${Prisma.raw(col)}
        WHEN 'D'  THEN 0
        WHEN 'C'  THEN 1
        WHEN 'B'  THEN 2
        WHEN 'A'  THEN 3
        WHEN 'A+' THEN 4
        ELSE NULL
      END`

    const teamRes = await prisma.$executeRaw`
      UPDATE jugadores
      SET transfer_team_pts = (${levelToIdxSQL('team_level')}) - (${levelToIdxSQL('initial_team_level')})
      WHERE team_level IN ('D','C','B','A','A+')
        AND initial_team_level IN ('D','C','B','A','A+')
    `
    const compRes = await prisma.$executeRaw`
      UPDATE jugadores
      SET transfer_competition_pts = (${levelToIdxSQL('competition_level')}) - (${levelToIdxSQL('initial_competition_level')})
      WHERE competition_level IN ('D','C','B','A','A+')
        AND initial_competition_level IN ('D','C','B','A','A+')
    `

    return { teamPtsUpdated: Number(teamRes), competitionPtsUpdated: Number(compRes) }
  }

  /**
   * Enlaza Jugador→Equipo cruzando `jugadores.team_name` con `equipos.team_name`
   * (exact match), rellena el FK `team_id` y hereda al jugador campos del equipo
   * que el import de BASE DATOS deja vacíos:
   *
   *   - `team_status`     ← `equipos.status` (First Team / Development Team)
   *   - `team_level`      ← `equipos.team_level` (si el jugador no lo tiene)
   *   - `team_elo`        ← `equipos.team_elo` (si el jugador no lo tiene)
   *   - `team_competition`← `equipos.correct_competition` (si el jugador no lo tiene)
   *
   * Todas las actualizaciones son idempotentes (`WHERE x IS NULL`). El recálculo
   * `competition_level` se reserva a fases posteriores que ya operan en memoria.
   */
  private static async recalcTeamLinking(): Promise<RecalcSummary['teamLinking']> {
    // Subquery: un único equipo por team_name normalizado (DISTINCT ON, orden
    // estable por id_team). Cubre equipos duplicados con el mismo nombre.
    // Matching por lower(trim()): mismo criterio que el import de stats
    // (normKey), para que diferencias de mayúsculas/espacios no rompan el enlace.
    const linkResult = await prisma.$executeRaw`
      UPDATE jugadores AS j
      SET team_id = e.id_team
      FROM (
        SELECT DISTINCT ON (lower(trim(team_name))) id_team, lower(trim(team_name)) AS team_key
        FROM equipos
        WHERE team_name IS NOT NULL
        ORDER BY lower(trim(team_name)), id_team
      ) AS e
      WHERE j.team_id IS NULL
        AND j.team_name IS NOT NULL
        AND e.team_key = lower(trim(j.team_name))
    `
    const teamIdLinked = Number(linkResult)

    // Una vez enlazados, copia campos del equipo al jugador donde el jugador esté vacío.
    const statusResult = await prisma.$executeRaw`
      UPDATE jugadores AS j
      SET team_status = e.status
      FROM equipos AS e
      WHERE j.team_id = e.id_team
        AND e.status IS NOT NULL
        AND j.team_status IS NULL
    `
    const teamStatusCopied = Number(statusResult)

    await prisma.$executeRaw`
      UPDATE jugadores AS j
      SET team_level = e.team_level
      FROM equipos AS e
      WHERE j.team_id = e.id_team
        AND e.team_level IS NOT NULL
        AND j.team_level IS NULL
    `
    const teamLevelResult = await prisma.$executeRaw`
      UPDATE jugadores AS j
      SET team_elo = e.team_elo
      FROM equipos AS e
      WHERE j.team_id = e.id_team
        AND e.team_elo IS NOT NULL
        AND j.team_elo IS NULL
    `
    const teamLevelCopied = Number(teamLevelResult)

    await prisma.$executeRaw`
      UPDATE jugadores AS j
      SET team_competition = e.correct_competition
      FROM equipos AS e
      WHERE j.team_id = e.id_team
        AND e.correct_competition IS NOT NULL
        AND j.team_competition IS NULL
    `

    // competition_level se calcula en otras fases — esta solo cuenta los que ya están.
    const competitionLevelCopied = await prisma.jugador.count({
      where: { competition_level: { not: null } },
    })

    return { teamIdLinked, teamStatusCopied, teamLevelCopied, competitionLevelCopied }
  }

  /**
   * Clasifica cada jugador en UNA categoría (cascada exclusiva) replicando la
   * fórmula `stage` del cliente (BASE DATOS · PLAYERS · col BX):
   *
   *   IF age<16                                           → Youth Discovery
   *   ELIF age>=16 AND team_status="Development Team"     → Emerging Talent
   *   ELIF age>=16 AND team_status="First Team" AND comp ∈ {C,D}    → Professional
   *   ELIF age>=16 AND team_status="First Team" AND comp = B        → Top Leagues
   *   ELIF age>=16 AND team_status="First Team" AND comp ∈ {A,A+}   → Big Five
   *   ELSE                                                → sin categoría
   *
   * NOTA: hoy `team_status` está vacío en BD; mientras no llegue ese dato del
   * cliente, solo Youth Discovery tendrá asignaciones (jugadores con age<16).
   * Cuando se cargue el status, una re-ejecución cubre el resto.
   */
  private static async recalcPlayerCategories(
    players: PlayerRow[],
    onProgress?: (current: number, total: number) => void
  ): Promise<{ updated: number; counts: Record<string, number> }> {
    const counts = { youth: 0, emerging: 0, professional: 0, top_leagues: 0, big_five: 0, none: 0 }
    const rows: Array<{
      id: number
      big_five: boolean; top_leagues: boolean; professional: boolean; emerging: boolean; youth: boolean
    }> = []

    for (const p of players) {
      const cl = p.competition_level
      const st = p.team_status
      const age = p.age
      const flags = { big_five: false, top_leagues: false, professional: false, emerging: false, youth: false }

      // Si faltan los inputs de la cascada (team_status para los >=16), NO
      // escribimos: poner los 5 flags a false borraría categorías previas en
      // cada recálculo mientras el dato del cliente siga sin cargarse.
      const isYouth = age != null && age < 16
      if (!isYouth && st == null) {
        counts.none++
        continue
      }

      if (isYouth) {
        flags.youth = true; counts.youth++
      } else if (age != null && age >= 16 && st === 'Development Team') {
        flags.emerging = true; counts.emerging++
      } else if (age != null && age >= 16 && st === 'First Team' && (cl === 'C' || cl === 'D')) {
        flags.professional = true; counts.professional++
      } else if (age != null && age >= 16 && st === 'First Team' && cl === 'B') {
        flags.top_leagues = true; counts.top_leagues++
      } else if (age != null && age >= 16 && st === 'First Team' && (cl === 'A' || cl === 'A+')) {
        flags.big_five = true; counts.big_five++
      } else {
        counts.none++
      }
      rows.push({ id: p.id_player, ...flags })
    }

    // UPDATE masivo de los 5 booleanos por lotes
    const CHUNK = 1000
    let processed = 0
    for (let i = 0; i < rows.length; i += CHUNK) {
      const slice = rows.slice(i, i + CHUNK)
      const tuples = Prisma.join(
        slice.map((r) =>
          Prisma.sql`(${r.id}::int, ${r.big_five}::boolean, ${r.top_leagues}::boolean, ${r.professional}::boolean, ${r.emerging}::boolean, ${r.youth}::boolean)`
        )
      )
      await prisma.$executeRaw`
        UPDATE jugadores AS j
        SET
          is_big_five        = v.bf,
          is_top_leagues     = v.tl,
          is_professional    = v.pr,
          is_emerging_talent = v.em,
          is_youth_discovery = v.yd
        FROM (VALUES ${tuples}) AS v(id, bf, tl, pr, em, yd)
        WHERE j.id_player = v.id
      `
      processed += slice.length
      onProgress?.(processed, rows.length)
    }
    return { updated: rows.length, counts }
  }

  /**
   * age_value = media de player_trfm_value de todos los jugadores con edad <= la del
   * jugador (acumulada). age_value_percent = desviación %. age_coeff = edad<=22?1:2.
   */
  private static async recalcAgeValues(
    players: PlayerRow[],
    onProgress?: (current: number, total: number) => void
  ): Promise<number> {
    // Lookup acumulado por edad
    const sorted = players
      .filter((p): p is PlayerRow & { age: number; player_trfm_value: number } =>
        p.age != null && p.player_trfm_value != null)
      .sort((a, b) => a.age - b.age)

    const ageValueLookup = new Map<number, number>()
    let cumSum = 0
    let cumCount = 0
    let i = 0
    const uniqueAges = [...new Set(sorted.map((p) => p.age))].sort((a, b) => a - b)
    for (const age of uniqueAges) {
      while (i < sorted.length && sorted[i]!.age === age) {
        cumSum += sorted[i]!.player_trfm_value
        cumCount++
        i++
      }
      ageValueLookup.set(age, cumSum / cumCount)
    }

    const updates = players.map((p) => {
      const age_value = p.age != null ? ageValueLookup.get(p.age) ?? null : null
      const age_value_percent = deviationPercent(p.player_trfm_value, age_value)
      const age_coeff = p.age == null ? null : p.age <= 22 ? 1 : 2
      return { id: p.id_player, vals: [age_value, age_value_percent, age_coeff] as (number | null)[] }
    })

    return this.bulkUpdate(['age_value', 'age_value_percent', 'age_coeff'], updates, onProgress)
  }

  /** nationality_value = media de player_trfm_value por correct_nationality_1 (con fallback nationality_1). */
  private static async recalcNationalityValues(
    players: PlayerRow[],
    onProgress?: (current: number, total: number) => void
  ): Promise<number> {
    const natOf = (p: PlayerRow) => p.correct_nationality_1 ?? p.nationality_1 ?? null

    const sums = new Map<string, { sum: number; count: number }>()
    for (const p of players) {
      const nat = natOf(p)
      if (!nat || p.player_trfm_value == null) continue
      const agg = sums.get(nat) ?? { sum: 0, count: 0 }
      agg.sum += p.player_trfm_value
      agg.count++
      sums.set(nat, agg)
    }
    const natValueLookup = new Map<string, number>()
    for (const [nat, { sum, count }] of sums) natValueLookup.set(nat, sum / count)

    const updates = players.map((p) => {
      const nat = natOf(p)
      const nationality_value = nat ? natValueLookup.get(nat) ?? null : null
      const nationality_value_percent = deviationPercent(p.player_trfm_value, nationality_value)
      return { id: p.id_player, vals: [nationality_value, nationality_value_percent] as (number | null)[] }
    })

    return this.bulkUpdate(['nationality_value', 'nationality_value_percent'], updates, onProgress)
  }

  /**
   * Normaliza player_trfm_value y player_rating a percentil 0-100 sobre toda la
   * población (misma convención que el resto de campos _norm de la app, ver
   * src/lib/utils/percentile.ts — la UI documenta "PERCENTILE(...) × 100").
   */
  private static async recalcNormalizations(
    players: PlayerRow[],
    onProgress?: (current: number, total: number) => void
  ): Promise<number> {
    const fields: Array<{ source: 'player_trfm_value' | 'player_rating'; target: string }> = [
      { source: 'player_trfm_value', target: 'player_trfm_value_norm' },
      { source: 'player_rating', target: 'player_rating_norm' },
    ]

    let totalUpdated = 0
    for (const { source, target } of fields) {
      const values = players
        .map((p) => p[source])
        .filter((v): v is number => v != null && !isNaN(v))
        .sort((a, b) => a - b)
      if (values.length === 0) continue

      const updates = players
        .filter((p) => p[source] != null)
        .map((p) => {
          const pct = percentileRank(values, p[source] as number)
          return { id: p.id_player, vals: [pct === null ? null : Math.round(pct * 100) / 100] }
        })

      totalUpdated += await this.bulkUpdate([target], updates, onProgress)
    }
    return totalUpdated
  }

  /**
   * UPDATE masivo de N columnas numéricas con `UPDATE ... FROM (VALUES ...)`, en lotes.
   * Los nombres de columna son literales controlados por el código (no input de usuario).
   */
  private static async bulkUpdate(
    columns: string[],
    rows: Array<{ id: number; vals: (number | null)[] }>,
    onProgress?: (current: number, total: number) => void
  ): Promise<number> {
    const total = rows.length
    if (total === 0) return 0

    // Alias de columnas en el VALUES: c0, c1, ...
    const setClause = Prisma.join(
      columns.map((col, idx) => Prisma.sql`${Prisma.raw(col)} = v.${Prisma.raw(`c${idx}`)}`),
      ', '
    )
    const colAliases = Prisma.join(
      [Prisma.raw('id'), ...columns.map((_, idx) => Prisma.raw(`c${idx}`))],
      ', '
    )

    const chunk = 1000
    let done = 0
    for (let i = 0; i < total; i += chunk) {
      const slice = rows.slice(i, i + chunk)
      const tuples = Prisma.join(
        slice.map((r) =>
          Prisma.sql`(${r.id}::int, ${Prisma.join(r.vals.map((v) => Prisma.sql`${v}::double precision`), ', ')})`
        )
      )
      await prisma.$executeRaw`
        UPDATE jugadores AS j
        SET ${setClause}
        FROM (VALUES ${tuples}) AS v(${colAliases})
        WHERE j.id_player = v.id
      `
      done += slice.length
      onProgress?.(done, total)
    }
    return done
  }
}
