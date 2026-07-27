/**
 * Percentiles con una única convención para toda la app.
 *
 * Convención: mean-rank → P = (estrictamente menores + 0.5 × empates) / n × 100.
 * - El peor valor único da ~0 y el mejor ~100 (nunca exactamente, evita
 *   falsos "0 = sin datos").
 * - Si todos los valores son iguales, todos reciben 50.
 */

/** Índice del primer elemento >= value (lower bound) en un array ordenado asc. */
export function lowerBound(sortedAsc: number[], value: number): number {
  let lo = 0
  let hi = sortedAsc.length
  while (lo < hi) {
    const mid = (lo + hi) >> 1
    if (sortedAsc[mid]! < value) lo = mid + 1
    else hi = mid
  }
  return lo
}

/** Índice del primer elemento > value (upper bound) en un array ordenado asc. */
export function upperBound(sortedAsc: number[], value: number): number {
  let lo = 0
  let hi = sortedAsc.length
  while (lo < hi) {
    const mid = (lo + hi) >> 1
    if (sortedAsc[mid]! <= value) lo = mid + 1
    else hi = mid
  }
  return lo
}

/**
 * Percentil 0-100 de `value` dentro de `sortedAsc` (ordenado ascendente).
 * Devuelve null si la población está vacía.
 */
export function percentileRank(sortedAsc: number[], value: number): number | null {
  const n = sortedAsc.length
  if (n === 0) return null
  const less = lowerBound(sortedAsc, value)
  const eq = upperBound(sortedAsc, value) - less
  return ((less + 0.5 * eq) / n) * 100
}
