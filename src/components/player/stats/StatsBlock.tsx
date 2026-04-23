"use client";

import type { StatsMetric } from "@/constants/player-stats-metrics";

type StatField = "totalValue" | "p90Value" | "averageValue" | "maximumValue" | "percentile";

interface StatsBlockProps {
  title: string;
  metrics: StatsMetric[];
  getStatValue: (metricKey: string, field: StatField) => string;
}

export default function StatsBlock({ title, metrics, getStatValue }: StatsBlockProps) {
  return (
    <div className="mb-8">
      {/* Cabecera del bloque: la primera columna lleva el título (reemplaza a "Metric"). */}
      <div className="grid grid-cols-6 gap-4 py-3 border-b border-gray-200 mb-2">
        <span className="font-bold text-[#8c1a10]">{title}</span>
        <span className="font-medium text-[#2e3138]">Total</span>
        <span className="font-medium text-[#2e3138]">P90</span>
        <span className="font-medium text-[#2e3138]">Avg</span>
        <span className="font-medium text-[#2e3138]">Max</span>
        <span className="font-medium text-[#2e3138]">Percentiles</span>
      </div>

      <div className="space-y-0">
        {metrics.map((metric, idx) => {
          const isLast = idx === metrics.length - 1;
          const percentileRaw = getStatValue(metric.key, "percentile");
          const percentileNum = Math.min(100, Math.max(0, Number(percentileRaw) || 0));
          return (
            <div
              key={metric.key}
              className={`grid grid-cols-6 gap-4 py-3 ${isLast ? "" : "border-b border-gray-100"}`}
            >
              <span className="font-medium text-[#2e3138]">{metric.label}</span>
              <span className="text-[#6d6d6d]">{getStatValue(metric.key, "totalValue")}</span>
              <span className="text-[#6d6d6d]">{getStatValue(metric.key, "p90Value")}</span>
              <span className="text-[#6d6d6d]">{getStatValue(metric.key, "averageValue")}</span>
              <span className="text-[#6d6d6d]">{getStatValue(metric.key, "maximumValue")}</span>
              <div className="flex items-center gap-2">
                <span className="text-[#6d6d6d] w-8 text-right text-sm">{percentileRaw}</span>
                <div className="h-1.5 flex-1 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#8c1a10] rounded-full"
                    style={{ width: `${percentileNum}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
