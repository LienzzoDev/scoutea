/**
 * Utilidades de formato para datos de scouts
 * Este archivo es seguro para usar en Client Components
 * No contiene imports de Prisma ni código de servidor
 */

import { formatMoneyCompact } from '@/lib/utils/format-money'

/**
 * Formatea un valor monetario
 * @deprecated Use formatMoney, formatMoneyCompact, or formatMoneyPrecise from @/lib/utils/format-money instead
 */
export function formatValue(value?: number | null, _suffix: string = ' €'): string {
  if (!value) return "Por determinar";
  return formatMoneyCompact(value);
}

/**
 * Formatea un valor de ROI
 */
export function formatROI(value?: number | null): string {
  if (!value) return "Por determinar";
  return `${value.toFixed(1)}%`;
}

/**
 * Formatea el cambio porcentual para valores económicos
 */
export function formatEconomicChange(changePercent?: number | null, isROI: boolean = false): {
  text: string;
  isPositive: boolean;
  isNeutral: boolean;
  color: string;
  arrow: string;
} {
  if (changePercent === null || changePercent === undefined) {
    return {
      text: "",
      isPositive: false,
      isNeutral: true,
      color: "text-gray-500",
      arrow: ""
    };
  }

  const isPositive = changePercent > 0;
  const isNeutral = changePercent === 0;
  const sign = isPositive ? "+" : "";
  const unit = isROI ? "pp" : "%"; // pp = puntos porcentuales para ROI

  return {
    text: `${sign}${changePercent.toFixed(1)}${unit}`,
    isPositive,
    isNeutral,
    color: isPositive ? "text-green-600" : isNeutral ? "text-gray-500" : "text-red-600",
    arrow: isPositive ? "↑" : isNeutral ? "→" : "↓"
  };
}
