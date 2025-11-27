/**
 * Utilidades para formatear valores de mercado
 * Este archivo NO debe importar Prisma para poder ser usado en componentes cliente
 */

import { formatMoney } from '@/lib/utils/format-money';

export function formatValue(value?: number | null): string {
  if (!value) return "Por determinar";
  return formatMoney(value);
}

export function formatPercentageChange(changePercent?: number | null): {
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

  return {
    text: `${isPositive ? "+" : ""}${changePercent.toFixed(1)}%`,
    isPositive,
    isNeutral,
    color: isPositive ? "text-green-600" : isNeutral ? "text-gray-500" : "text-red-600",
    arrow: isPositive ? "↑" : isNeutral ? "" : "↓"
  };
}

export function formatAbsoluteChange(currentValue?: number | null, previousValue?: number | null): {
  text: string;
  isPositive: boolean;
  isNeutral: boolean;
  color: string;
} {
  if (!currentValue || !previousValue) {
    return {
      text: "",
      isPositive: false,
      isNeutral: true,
      color: "text-gray-500"
    };
  }

  const change = currentValue - previousValue;
  const isPositive = change > 0;
  const isNeutral = change === 0;

  return {
    text: `${isPositive ? "+" : ""}${formatValue(change)}`,
    isPositive,
    isNeutral,
    color: isPositive ? "text-green-600" : isNeutral ? "text-gray-500" : "text-red-600"
  };
}
