/**
 * Utility functions and types for player statistics periods
 */

/**
 * Valid statistics periods
 */
export type StatsPeriod = '3m' | '6m' | '1y' | '2y'

/**
 * Check if a string is a valid period
 */
export function isValidPeriod(period: string): period is StatsPeriod {
  return period === '3m' || period === '6m' || period === '1y' || period === '2y'
}

/**
 * Get human-readable label for a period
 */
export function getPeriodLabel(period: StatsPeriod): string {
  const labels: Record<StatsPeriod, string> = {
    '3m': '3 Meses',
    '6m': '6 Meses',
    '1y': '1 Año',
    '2y': '2 Años',
  }
  return labels[period]
}

/**
 * Get the Excel sheet name for a period
 */
export function getExcelSheetName(period: StatsPeriod): string {
  const names: Record<StatsPeriod, string> = {
    '3m': '3M',
    '6m': '6M',
    '1y': '1Y',
    '2y': '2Y',
  }
  return names[period]
}

/**
 * Get all available periods
 */
export function getAllPeriods(): StatsPeriod[] {
  return ['3m', '6m', '1y', '2y']
}

/**
 * Get period configuration with metadata
 */
export function getPeriodConfig(period: StatsPeriod) {
  return {
    value: period,
    label: getPeriodLabel(period),
    sheetName: getExcelSheetName(period),
  }
}

/**
 * Get all periods with metadata
 */
export function getAllPeriodsConfig() {
  return getAllPeriods().map(period => getPeriodConfig(period))
}
