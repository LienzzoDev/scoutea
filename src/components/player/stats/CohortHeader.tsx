"use client";

interface CohortHeaderProps {
  sampleSize?: number | null | undefined;
  loading?: boolean | undefined;
  label?: string | undefined;
}

/**
 * Muestra el tamaño de la muestra contra el que se comparan las estadísticas.
 * Aparece arriba de los bloques/gráficos en Stats (By Period, Radar, Beeswarm, Lollipop).
 */
export default function CohortHeader({ sampleSize, loading, label = "Comparing against" }: CohortHeaderProps) {
  let content: string;
  if (loading) {
    content = `${label} …`;
  } else if (typeof sampleSize === "number" && sampleSize >= 0) {
    content = `${label} ${sampleSize.toLocaleString()} player${sampleSize === 1 ? "" : "s"}`;
  } else {
    content = `${label} all players`;
  }

  return (
    <div className="mb-4 text-sm text-[#6d6d6d]">
      {content}
    </div>
  );
}
