"use client";

import type { ResolvedRound } from "../../../template-types";
import { formatTimestamp, formatOffset } from "../../../template-types";
import { CURVES_WITH_DESC } from "../../shared";

type DialPlanCardProps = {
  schedule: ResolvedRound;
  index: number;
  isLast: boolean;
};

export function DialPlanCard({ schedule, index, isLast }: DialPlanCardProps) {
  const curveData =
    CURVES_WITH_DESC.find((c) => c.key === schedule.curve) ||
    CURVES_WITH_DESC[0];

  return (
    <div className="flex items-start gap-4">
      {/* Dial connector */}
      <div className="flex flex-col items-center">
        <div className="relative w-12 h-12">
          <svg viewBox="0 0 48 48" className="w-full h-full">
            {/* Outer ring */}
            <circle
              cx="24"
              cy="24"
              r="22"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              className="text-base-300"
            />
            {/* Fill based on progress */}
            <circle
              cx="24"
              cy="24"
              r="22"
              fill="none"
              stroke={curveData.hex}
              strokeWidth="2"
              strokeDasharray={`${2 * Math.PI * 22 * 0.7} ${2 * Math.PI * 22}`}
              transform="rotate(-90 24 24)"
            />
            {/* Center */}
            <circle cx="24" cy="24" r="14" fill={curveData.hex} opacity="0.2" />
            <circle cx="24" cy="24" r="8" fill={curveData.hex} />
            {/* Number */}
            <text
              x="24"
              y="28"
              textAnchor="middle"
              className="fill-base-100 text-[10px] font-mono font-bold"
            >
              {index + 1}
            </text>
          </svg>
        </div>
        {/* Connector line to next */}
        {isLast && (
          <div className="w-px h-8 bg-gradient-to-b from-base-300 to-transparent" />
        )}
      </div>

      {/* Card content */}
      <div className="flex-1 card-instrument p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h4 className="font-display font-semibold text-sm">
              {schedule.name || `Plan ${index + 1}`}
            </h4>
            <p className="text-[10px] font-mono text-base-content/40 mt-0.5">
              {formatPlanStartTime(schedule)}
            </p>
          </div>
          <span className="text-xs font-mono font-semibold text-base-content">
            {schedule.amount} STRK
          </span>
        </div>
        <div className="flex items-center gap-4 text-[10px] font-mono text-base-content/50">
          <span>{formatOffset(schedule.duration)}</span>
          <span className="flex items-center gap-1">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: curveData.hex }}
            />
            {curveData.label}
          </span>
        </div>
      </div>
    </div>
  );
}

function formatPlanStartTime(schedule: ResolvedRound): string {
  const start = formatTimestamp(schedule.resolvedStartTime);
  const end = formatTimestamp(schedule.resolvedEndTime);
  return start.split(" ")[0] + " → " + end.split(" ")[0];
}
