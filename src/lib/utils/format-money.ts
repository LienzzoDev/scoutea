/**
 * Utility function to format monetary values consistently across the application
 * Handles values in different scales (euros, thousands, millions)
 */

export function formatMoney(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return 'N/A';

  // Si es string, intentar parsear
  const numValue = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(numValue)) return 'N/A';

  // Determinar la escala del valor
  if (numValue >= 1000000) {
    // Valor en euros (ej: 1713152.8 -> €1.71M)
    return `€${(numValue / 1000000).toFixed(2)}M`;
  } else if (numValue >= 1000) {
    // Valor en miles (ej: 500000 -> €500K)
    return `€${(numValue / 1000).toFixed(0)}K`;
  } else if (numValue > 0) {
    // Valor pequeño, asumir que ya está en millones (ej: 1.5 -> €1.50M)
    return `€${numValue.toFixed(2)}M`;
  }

  return '€0';
}

/**
 * Format money with more precision for larger displays
 */
export function formatMoneyPrecise(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return 'N/A';

  const numValue = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(numValue)) return 'N/A';

  if (numValue >= 1000000000) {
    // Billones
    return `€${(numValue / 1000000000).toFixed(2)}B`;
  } else if (numValue >= 1000000) {
    // Millones
    return `€${(numValue / 1000000).toFixed(2)}M`;
  } else if (numValue >= 1000) {
    // Miles
    return `€${(numValue / 1000).toFixed(0)}K`;
  } else if (numValue > 0) {
    return `€${numValue.toFixed(0)}`;
  }

  return '€0';
}

/**
 * Format money for compact display (tables, lists)
 */
export function formatMoneyCompact(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return 'N/A';

  const numValue = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(numValue)) return 'N/A';

  if (numValue >= 1000000) {
    return `€${(numValue / 1000000).toFixed(1)}M`;
  } else if (numValue >= 1000) {
    return `€${(numValue / 1000).toFixed(0)}K`;
  } else if (numValue > 0) {
    return `€${numValue.toFixed(1)}M`;
  }

  return '€0';
}

/**
 * Format money with full digits (e.g. €1,500,000)
 */
export function formatMoneyFull(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return 'N/A';

  const numValue = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(numValue)) return 'N/A';

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numValue);
}
