"use client";

import type { StartTimeMode, TemporalUnit } from "../../../template-types";
import { TEMPORAL_UNITS } from "../../../template-types";

const START_MODES: Array<{ key: StartTimeMode; label: string; desc: string }> =
  [
    { key: "immediate", label: "Immediate", desc: "Start immediately" },
    {
      key: "delayed",
      label: "Delayed",
      desc: "Start X after deploy",
    },
  ];

type StartModeSelectorProps = {
  value: StartTimeMode;
  delay: string;
  delayUnit: string;
  onModeChange: (mode: StartTimeMode) => void;
  onDelayChange: (delay: string) => void;
  onDelayUnitChange: (unit: TemporalUnit) => void;
};

export function StartModeSelector({
  value,
  delay,
  delayUnit,
  onModeChange,
  onDelayChange,
  onDelayUnitChange,
}: StartModeSelectorProps) {
  return (
    <div>
      <label className="block text-xs font-mono text-base-content/60 uppercase tracking-wider mb-2">
        Start Timing
      </label>
      <div className="grid grid-cols-2 gap-2 mb-3">
        {START_MODES.map((mode) => (
          <button
            key={mode.key}
            type="button"
            onClick={() => onModeChange(mode.key)}
            className={`p-3 flex-col gap-0.5 border-2 rounded-lg transition-all duration-200 ${
              value === mode.key
                ? "border-accent bg-accent/5"
                : "border-base-300 bg-base-300/20"
            }`}
          >
            <span className="font-mono text-xs font-semibold">
              {mode.label}
            </span>
            <span className="text-[10px] text-base-content/50 font-mono">
              {mode.desc}
            </span>
          </button>
        ))}
      </div>
      {value === "delayed" && (
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="block text-xs font-mono text-base-content/40 mb-1">
              Delay
            </label>
            <input
              type="number"
              value={delay}
              onChange={(e) => onDelayChange(e.target.value)}
              className="input input-bordered w-full font-mono text-sm bg-base-300/30 border-base-300 focus:border-accent"
              min="0"
            />
          </div>
          <div>
            <label className="block text-xs font-mono text-base-content/40 mb-1">
              Unit
            </label>
            <select
              value={delayUnit}
              onChange={(e) =>
                onDelayUnitChange(e.target.value as TemporalUnit)
              }
              className="select select-bordered w-24 font-mono text-sm bg-base-300/30 border-base-300 focus:border-accent"
            >
              {TEMPORAL_UNITS.map((u) => (
                <option key={u.key} value={u.key}>
                  {u.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
