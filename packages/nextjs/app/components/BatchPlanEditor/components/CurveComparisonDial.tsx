"use client";

import { CURVES_WITH_DESC } from "../../shared";

type CurveComparisonDialProps = {
  selectedCurve: string;
};

export function CurveComparisonDial({
  selectedCurve,
}: CurveComparisonDialProps) {
  return (
    <div className="card-instrument p-4">
      <h4 className="text-xs font-mono text-base-content/60 uppercase tracking-wider mb-3">
        Release Profile
      </h4>

      <svg viewBox="0 0 200 100" className="w-full h-24">
        {/* Grid lines */}
        <line
          x1="10"
          y1="50"
          x2="190"
          y2="50"
          stroke="currentColor"
          strokeWidth="0.5"
          className="text-base-content/10"
        />
        <line
          x1="10"
          y1="20"
          x2="190"
          y2="20"
          stroke="currentColor"
          strokeWidth="0.5"
          className="text-base-content/5"
        />
        <line
          x1="10"
          y1="80"
          x2="190"
          y2="80"
          stroke="currentColor"
          strokeWidth="0.5"
          className="text-base-content/5"
        />

        {/* Axis labels */}
        <text
          x="5"
          y="22"
          className="fill-base-content/30 text-[6px] font-mono"
        >
          100%
        </text>
        <text
          x="5"
          y="52"
          className="fill-base-content/30 text-[6px] font-mono"
        >
          50%
        </text>
        <text
          x="5"
          y="82"
          className="fill-base-content/30 text-[6px] font-mono"
        >
          0%
        </text>
        <text
          x="188"
          y="95"
          className="fill-base-content/30 text-[6px] font-mono"
        >
          t
        </text>

        {/* Curve paths */}
        {selectedCurve === "linear" && (
          <>
            <path
              d="M 10 80 L 190 20"
              fill="none"
              stroke="#0ea5e9"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <path
              d="M 10 80 L 190 80 L 190 20 Z"
              fill="#0ea5e9"
              fillOpacity="0.15"
            />
          </>
        )}
        {selectedCurve === "cliff" && (
          <>
            <path
              d="M 10 80 L 150 80 L 160 20"
              fill="none"
              stroke="#f59e0b"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <path
              d="M 10 80 L 150 80 L 160 80 L 160 20 L 190 20 L 190 80 Z"
              fill="#f59e0b"
              fillOpacity="0.15"
            />
            {/* Cliff marker */}
            <line
              x1="150"
              y1="75"
              x2="150"
              y2="85"
              stroke="#f59e0b"
              strokeWidth="1.5"
            />
            <text x="140" y="92" className="fill-warning text-[6px] font-mono">
              cliff
            </text>
          </>
        )}
        {selectedCurve === "expdecay" && (
          <>
            <path
              d="M 10 20 Q 80 60 120 72 Q 160 82 190 88"
              fill="none"
              stroke="#10b981"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <path
              d="M 10 20 Q 80 60 120 72 Q 160 82 190 88 L 190 88 L 10 88 Z"
              fill="#10b981"
              fillOpacity="0.15"
            />
          </>
        )}

        {/* Axis */}
        <line
          x1="10"
          y1="88"
          x2="190"
          y2="88"
          stroke="currentColor"
          strokeWidth="1"
          className="text-base-content/20"
        />
      </svg>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-2">
        {CURVES_WITH_DESC.map((c) => (
          <div
            key={c.key}
            className={`flex items-center gap-1 text-[10px] font-mono ${selectedCurve === c.key ? "opacity-100" : "opacity-40"}`}
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: c.hex }}
            />
            <span>{c.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
