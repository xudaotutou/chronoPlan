"use client";

import { TEMPORAL_UNITS, type TemporalUnit } from "../../template-types";

export type DurationInputProps = {
  value: string;
  displayValue: string;
  unit: TemporalUnit;
  onChange: (value: string, displayValue: string) => void;
  onUnitChange: (unit: TemporalUnit) => void;
  /** Step number for card header */
  step?: string;
  /** Label text */
  label?: string;
};

function formatDuration(seconds: number): string {
  if (seconds >= 86400 * 365)
    return `${(seconds / (86400 * 365)).toFixed(1)} years`;
  if (seconds >= 86400 * 30)
    return `${(seconds / (86400 * 30)).toFixed(1)} months`;
  if (seconds >= 86400) return `${(seconds / 86400).toFixed(0)} days`;
  if (seconds >= 3600) return `${(seconds / 3600).toFixed(0)} hours`;
  return `${seconds} seconds`;
}

export function DurationInput({
  value,
  displayValue,
  unit,
  onChange,
  onUnitChange,
  step,
  label = "Duration",
}: DurationInputProps) {
  return (
    <div className="card-instrument p-5 card-hover animate-fade-up delay-250">
      <div className="flex items-center gap-3 mb-4">
        {step && (
          <span className="text-xs font-mono text-secondary tracking-widest uppercase">
            {step}
          </span>
        )}
        <span className="font-display font-semibold">{label}</span>
        {value && (
          <span className="badge badge-outline border-secondary/40 text-secondary font-mono text-xs ml-auto">
            {formatDuration(parseInt(value))}
          </span>
        )}
      </div>
      <div className="join w-full mb-3">
        {TEMPORAL_UNITS.map((u) => (
          <button
            key={u.key}
            type="button"
            onClick={() => {
              if (unit === u.key) return; // No change needed

              const oldFactor =
                TEMPORAL_UNITS.find((t) => t.key === unit)?.factor || 1;
              const newFactor = u.factor;

              // Convert display value to seconds, then to new unit
              const seconds = Math.round(
                parseFloat(displayValue || "0") * oldFactor,
              );
              const newDisplay = String(Math.round(seconds / newFactor));

              onUnitChange(u.key as TemporalUnit);
              onChange(String(seconds), newDisplay);
            }}
            className={`join-item btn btn-sm font-mono text-xs flex-1 ${
              unit === u.key ? "btn-active" : ""
            }`}
          >
            {u.label}
          </button>
        ))}
      </div>
      <input
        type="number"
        placeholder="Enter value…"
        value={displayValue}
        onChange={(e) => {
          const display = e.target.value;
          const num = parseFloat(display);
          if (!isNaN(num) && num >= 0) {
            const factor =
              TEMPORAL_UNITS.find((u) => u.key === unit)?.factor || 1;
            const seconds = Math.round(num * factor);
            onChange(String(seconds), display);
          } else if (display === "") {
            onChange("", "");
          }
        }}
        className="input input-bordered w-full pr-14 font-mono text-sm bg-base-300/30 border-base-300 focus:border-secondary"
        min="0"
      />
    </div>
  );
}

// Compact duration input without card styling (for inline use)
export type CompactDurationInputProps = {
  value: string;
  unit: TemporalUnit;
  onChange: (value: string) => void;
  onUnitChange: (unit: TemporalUnit) => void;
};

export function CompactDurationInput({
  value,
  unit,
  onChange,
  onUnitChange,
}: CompactDurationInputProps) {
  return (
    <div className="flex gap-2">
      <input
        type="number"
        placeholder="30"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input input-bordered flex-1 font-mono text-sm bg-base-300/30 border-base-300 focus:border-primary"
        min="0"
      />
      <select
        value={unit}
        onChange={(e) => onUnitChange(e.target.value as TemporalUnit)}
        className="select select-bordered w-24 font-mono text-sm bg-base-300/30 border-base-300 focus:border-primary"
      >
        {TEMPORAL_UNITS.map((u) => (
          <option key={u.key} value={u.key}>
            {u.label}
          </option>
        ))}
      </select>
    </div>
  );
}
