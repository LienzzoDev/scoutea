"use client";

export type RatingGrade = 'A+' | 'A' | 'B' | 'C' | 'D';

// Color mapping for ratings
export const RATING_COLORS: Record<RatingGrade, string> = {
  'A+': '#064e3b', // Dark green (emerald-900)
  'A': '#22c55e',  // Light green
  'B': '#eab308',  // Yellow
  'C': '#f97316',  // Orange
  'D': '#dc2626',  // Red
};

// Convert dominance level (1-10) to grade
export function getDominanceGrade(level: number): RatingGrade {
  if (level >= 9) return 'A+';
  if (level >= 7) return 'A';
  if (level >= 5) return 'B';
  if (level >= 3) return 'C';
  return 'D';
}

// Convert percentile (0-100) to grade
export function getPercentileGrade(percentile: number): RatingGrade {
  if (percentile >= 90) return 'A+';
  if (percentile >= 70) return 'A';
  if (percentile >= 50) return 'B';
  if (percentile >= 30) return 'C';
  return 'D';
}

interface RatingBadgeProps {
  rating: RatingGrade;
  size?: 'sm' | 'md' | 'lg';
  showBackground?: boolean;
}

export default function RatingBadge({
  rating,
  size = 'md',
  showBackground = false
}: RatingBadgeProps) {
  const color = RATING_COLORS[rating];

  const sizeClasses = {
    sm: 'text-sm font-semibold',
    md: 'text-lg font-bold',
    lg: 'text-2xl font-bold',
  };

  if (showBackground) {
    return (
      <span
        className={`${sizeClasses[size]} px-2 py-1 rounded`}
        style={{
          color: '#fff',
          backgroundColor: color,
        }}
      >
        {rating}
      </span>
    );
  }

  return (
    <span
      className={sizeClasses[size]}
      style={{ color }}
    >
      {rating}
    </span>
  );
}
