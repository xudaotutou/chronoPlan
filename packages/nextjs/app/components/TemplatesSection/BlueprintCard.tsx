"use client";

import { TEMPORAL_UNITS } from "../../template-types";
import { useTemplateStore } from "../../store/templateStore";

const CURVES = [
  { key: "linear" as const, label: "Linear", hex: "#6366f1" },
  { key: "cliff" as const, label: "Cliff", hex: "#8b5cf6" },
  { key: "expdecay" as const, label: "Exp Decay", hex: "#d946ef" },
];

type BlueprintCardProps = {
  template: ScheduleTemplate & { isPreset?: boolean };
  onEdit: () => void;
  onDelete: () => void;
  canDelete: boolean;
  onConvertToBatch?: () => void;
};

export function BlueprintCard({
  template,
  onEdit,
  onDelete,
  canDelete,
  onConvertToBatch,
}: BlueprintCardProps) {
  const item = template.items[0];
  const curveData = CURVES.find((c) => c.key === item.curve) || CURVES[0];
  const factor =
    TEMPORAL_UNITS.find((u) => u.key === item.durationUnit)?.factor || 86400;
  const durationInSeconds = item.duration * factor;
  const durationInDays = durationInSeconds / 86400;
  const setAppliedTemplate = useTemplateStore((s) => s.setAppliedTemplate);

  const handleApply = () => {
    setAppliedTemplate(template);
    window.dispatchEvent(new CustomEvent("switchTab", { detail: "create" }));
  };

  return (
    <div className="card-blueprint relative p-0 rounded-lg overflow-hidden group hover:shadow-lg transition-shadow duration-300">
      <div className="absolute inset-0 pointer-events-none corner-marks" />

      {/* Header Strip */}
      <div className="bg-primary/10 px-4 py-2 border-b border-primary/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 text-primary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <span className="font-mono text-xs text-primary uppercase tracking-wider">
            Spec
          </span>
        </div>
        {template.isPreset && (
          <span className="badge badge-primary badge-outline font-mono text-[10px]">
            Preset
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <h3 className="font-display font-bold text-base text-base-content truncate">
          {template.name}
        </h3>

        {/* Spec Lines */}
        <div className="space-y-1.5">
          <div className="spec-line">
            <span className="spec-label">Amount</span>
            <span className="spec-value">{item.amount} STRK</span>
          </div>
          <div className="spec-line">
            <span className="spec-label">Duration</span>
            <span className="spec-value">
              {durationInDays >= 365
                ? `${(durationInDays / 365).toFixed(1)} years`
                : durationInDays >= 30
                  ? `${(durationInDays / 30).toFixed(1)} months`
                  : `${durationInDays.toFixed(0)} days`}
            </span>
          </div>
          <div className="spec-line">
            <span className="spec-label">Curve</span>
            <div className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: curveData.hex }}
              />
              <span className="spec-value">{curveData.label}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2">
          {canDelete && (
            <>
              <button
                onClick={onEdit}
                className="btn btn-ghost btn-xs font-mono flex-1"
              >
                Edit
              </button>
              <button
                onClick={onDelete}
                className="btn btn-ghost btn-xs font-mono text-error"
              >
                Delete
              </button>
            </>
          )}
          {onConvertToBatch && (
            <button
              onClick={onConvertToBatch}
              className="btn btn-ghost btn-xs font-mono text-accent"
            >
              Batch
            </button>
          )}
          <button
            onClick={handleApply}
            className="btn btn-primary btn-xs font-mono"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
