"use client";

import RatingBadge, { getDominanceGrade, RATING_COLORS } from './RatingBadge';

interface TendencyVisualizerProps {
  title: string;
  leftLabel: string;
  rightLabel: string;
  leftDominanceLevel: number; // 1-10
  rightDominanceLevel: number; // 1-10
  tendency: number; // 0-100, position of marker on bar (0 = left, 100 = right)
}

export default function TendencyVisualizer({
  title,
  leftLabel,
  rightLabel,
  leftDominanceLevel,
  rightDominanceLevel,
  tendency,
}: TendencyVisualizerProps) {
  const leftGrade = getDominanceGrade(leftDominanceLevel);
  const rightGrade = getDominanceGrade(rightDominanceLevel);
  const leftColor = RATING_COLORS[leftGrade];
  const rightColor = RATING_COLORS[rightGrade];

  // Calculate tendency position (clamped between 5% and 95% for visual bounds)
  const markerPosition = Math.min(95, Math.max(5, tendency));

  return (
    <div className="w-full">
      {/* Title */}
      <h4 className="text-center text-lg font-bold text-[#8c1a10] mb-4">
        {title}
      </h4>

      {/* Content container */}
      <div className="flex items-center gap-4">
        {/* Left Dominance */}
        <div className="flex flex-col items-center w-16">
          <span className="text-xs text-[#6d6d6d] mb-1">Dominance</span>
          <RatingBadge rating={leftGrade} size="lg" />
        </div>

        {/* Tendency Bar */}
        <div className="flex-1">
          <div className="relative">
            {/* Background bar with gradient sections */}
            <div className="h-6 rounded-full overflow-hidden flex">
              {/* Left section (colored based on left dominance) */}
              <div
                className="h-full"
                style={{
                  width: `${tendency}%`,
                  backgroundColor: leftColor,
                  opacity: 0.3,
                }}
              />
              {/* Right section (colored based on right dominance) */}
              <div
                className="h-full"
                style={{
                  width: `${100 - tendency}%`,
                  backgroundColor: rightColor,
                  opacity: 0.3,
                }}
              />
            </div>

            {/* Active indicator at tendency position */}
            <div
              className="absolute top-0 h-6 w-6 rounded-full border-2 border-white shadow-md transform -translate-x-1/2"
              style={{
                left: `${markerPosition}%`,
                backgroundColor: markerPosition < 50 ? leftColor : rightColor,
              }}
            />
          </div>

          {/* Labels below bar */}
          <div className="flex justify-between mt-2">
            <span className="text-sm font-semibold text-[#2e3138]">
              {leftLabel}
            </span>
            <span className="text-xs text-[#6d6d6d]">Tendency</span>
            <span className="text-sm font-semibold text-[#2e3138]">
              {rightLabel}
            </span>
          </div>
        </div>

        {/* Right Dominance */}
        <div className="flex flex-col items-center w-16">
          <span className="text-xs text-[#6d6d6d] mb-1">Dominance</span>
          <RatingBadge rating={rightGrade} size="lg" />
        </div>
      </div>
    </div>
  );
}
