"use client";

import type { BatchPlan } from "../../template-types";

type HeaderProps = {
  plans: BatchPlan[];
  onNewPlan: () => void;
};

export function Header({ plans, onNewPlan }: HeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        {/* Dial icon */}
        <div className="relative w-10 h-10">
          <svg viewBox="0 0 40 40" className="w-full h-full">
            <circle
              cx="20"
              cy="20"
              r="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="text-primary"
            />
            <circle
              cx="20"
              cy="20"
              r="14"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.5"
              className="text-primary/50"
            />
            {[...Array(12)].map((_, i) => (
              <circle
                key={i}
                cx={20 + 15 * Math.sin((i * 30 * Math.PI) / 180)}
                cy={20 - 15 * Math.cos((i * 30 * Math.PI) / 180)}
                r={i % 3 === 0 ? "2" : "1"}
                fill="currentColor"
                className="text-primary"
              />
            ))}
            <circle
              cx="20"
              cy="20"
              r="3"
              fill="currentColor"
              className="text-accent"
            />
          </svg>
        </div>

        <div>
          <h2 className="font-display font-bold text-2xl">Schedules</h2>
          <p className="text-xs font-mono text-base-content/40 mt-1">
            {plans.length} schedule{plans.length !== 1 ? "s" : ""} · Multiple
            plans
          </p>
        </div>
      </div>

      {/* New Schedule button */}
      <button
        className="btn btn-primary btn-sm font-mono text-xs gap-2"
        onClick={onNewPlan}
      >
        {/* Plus with dial aesthetic */}
        <span className="relative w-4 h-4">
          <svg viewBox="0 0 16 16" className="w-full h-full">
            <circle
              cx="8"
              cy="8"
              r="7"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              className="text-primary-content"
            />
            <line
              x1="8"
              y1="4"
              x2="8"
              y2="12"
              stroke="currentColor"
              strokeWidth="1.5"
              className="text-primary-content"
            />
            <line
              x1="4"
              y1="8"
              x2="12"
              y2="8"
              stroke="currentColor"
              strokeWidth="1.5"
              className="text-primary-content"
            />
          </svg>
        </span>
        New Schedule
      </button>
    </div>
  );
}
