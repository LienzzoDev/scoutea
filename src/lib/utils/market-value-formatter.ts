/**
 * Utilidades para formatear valores de mercado
 * Este archivo NO debe importar Prisma para poder ser usado en componentes cliente
 */

export function formatValue(value?: number | null): string {
  if (!value) return "Por determinar";

  // Los valores están en millones, formatear directamente
  if (value >= 1_000) {
    // Billones (B) - si el valor es >= 1000M
    const billions = value / 1_000;
    return `€${billions.toFixed(billions >= 10 ? 1 : 2)}B`;
  } else if (value >= 1) {
    // Millones (M)
    return `€${value.toFixed(value >= 10 ? 1 : 2)}M`;
  } else if (value >= 0.001) {
    // Miles (K) - si el valor es < 1M pero >= 1K
    const thousands = value * 1_000;
    return `€${thousands.toFixed(thousands >= 10 ? 1 : 2)}K`;
  } else {
    // Valores muy pequeños
    return `€${(value * 1_000_000).toFixed(0)}`;
  }
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
