/**
 * Utilidades de formateo para datos económicos de scouts
 * Este archivo NO importa Prisma, por lo que es seguro usarlo en componentes del cliente
 */

/**
 * Formatea un valor monetario
 */
export function formatValue(value?: number | null, suffix: string = ' €'): string {
  if (!value) return "Por determinar";
  return new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value) + suffix;
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
    color: isNeutral ? "text-gray-500" : isPositive ? "text-green-600" : "text-red-600",
    arrow: isNeutral ? "" : isPositive ? "↑" : "↓"
  };
}