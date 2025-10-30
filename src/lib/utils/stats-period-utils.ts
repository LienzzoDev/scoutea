/**
 * Utilities for handling multi-period player statistics
 * Supports periods: 3m, 6m, 1y, 2y
 *
 * NOTE: This file contains only pure functions that can be used in client components.
 * Server-side functions (using Prisma) should go in player-stats-service.ts
 */

export type StatsPeriod = '3m' | '6m' | '1y' | '2y'

/**
 * Get the Excel sheet name for a given period
 */
export function getExcelSheetName(period: StatsPeriod): string {
  return period.toUpperCase()
}

/**
 * Get the table name for a given period
 */
export function getTableName(period: StatsPeriod): string {
  return `player_stats_${period}`
}

/**
 * Validate if a period is valid
 */
export function isValidPeriod(period: string): period is StatsPeriod {
  return ['3m', '6m', '1y', '2y'].includes(period)
}

/**
 * Get all available periods
 */
export function getAllPeriods(): StatsPeriod[] {
  return ['3m', '6m', '1y', '2y']
}

/**
 * Get human-readable label for a period
 */
export function getPeriodLabel(period: StatsPeriod): string {
  const labels = {
    '3m': '3 Meses',
    '6m': '6 Meses',
    '1y': '1 Año',
    '2y': '2 Años',
  } as const

  return labels[period]
}

/**
 * Map Excel column names to database field names for a given period
 * Handles special cases like columns with % in the name
 */
export function mapExcelColumnToField(excelColumn: string, period: StatsPeriod): string {
  // Handle % columns - these need special mapping
  if (excelColumn.includes('%')) {
    // Replace % with _percent_ and the period suffix
    return excelColumn
      .replace(/%/g, '_percent_')
      .replace(new RegExp(`${period}$`), `_${period}`)
  }

  // Standard columns - just ensure they have the right suffix
  return excelColumn
}

/**
 * Get the suffix for a given period (e.g., "_3m", "_6m")
 */
export function getPeriodSuffix(period: StatsPeriod): string {
  return `_${period}`
}
