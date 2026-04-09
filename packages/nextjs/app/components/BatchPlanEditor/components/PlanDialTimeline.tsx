"use client";

import type { ScheduleTemplate } from "../../../template-types";
import { resolveRoundTimes, formatOffset } from "../../../template-types";
import { DialPlanCard } from "./DialPlanCard";

export function PlanDialTimeline({ plan }: { plan: ScheduleTemplate }) {
  const resolved = resolveRoundTimes(plan.items);
  const totalDuration =
    resolved.length > 0
      ? resolved[resolved.length - 1].resolvedEndTime -
        resolved[0].resolvedStartTime
      : 0;

  return (
    <div className="card-instrument p-6 animate-fade-up">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex-1">
          <h3 className="font-display font-bold text-lg">{plan.name}</h3>
          <p className="text-xs font-mono text-base-content/50 mt-1">
            {resolved.length} schedules · {formatOffset(totalDuration)} total
          </p>
        </div>
        {/* Summary dial */}
        <div className="relative w-20 h-20">
          <svg viewBox="0 0 80 80" className="w-full h-full">
            <circle
              cx="40"
              cy="40"
              r="36"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-base-300"
            />
            <circle
              cx="40"
              cy="40"
              r="36"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 36 * 0.75} ${2 * Math.PI * 36}`}
              transform="rotate(-90 40 40)"
              className="text-primary"
            />
            <circle
              cx="40"
              cy="40"
              r="28"
              fill="currentColor"
              className="text-base-200/50"
            />
            <text
              x="40"
              y="38"
              textAnchor="middle"
              className="fill-primary text-[10px] font-mono font-bold"
            >
              {plan.items.reduce(
                (sum, s) => sum + parseFloat(s.amount || "0"),
                0,
              )}
            </text>
            <text
              x="40"
              y="48"
              textAnchor="middle"
              className="fill-base-content/60 text-[7px] font-mono"
            >
              STRK
            </text>
          </svg>
        </div>
      </div>

      {/* Schedule details */}
      <div className="space-y-3">
        {resolved.map((round, i) => (
          <DialPlanCard
            key={round.roundIndex}
            schedule={round}
            index={i}
            isLast={i === resolved.length - 1}
          />
        ))}
      </div>
    </div>
  );
}
