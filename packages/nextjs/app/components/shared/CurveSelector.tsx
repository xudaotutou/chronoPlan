"use client";

export type CurveType = "linear" | "cliff" | "expdecay";

export const CURVES = [
  { key: "linear" as const, label: "Linear", hex: "#6366f1" },
  { key: "cliff" as const, label: "Cliff", hex: "#8b5cf6" },
  { key: "expdecay" as const, label: "Exp Decay", hex: "#d946ef" },
];

export type CurveSelectorProps = {
  value: CurveType;
  onChange: (curve: CurveType) => void;
  /** Step number for card header */
  step?: string;
  /** Show card styling */
  card?: boolean;
};

export function CurveSelector({
  value,
  onChange,
  step,
  card = true,
}: CurveSelectorProps) {
  const content = (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        {CURVES.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => onChange(c.key as CurveType)}
            className={`p-3 flex-col gap-1 border-2 rounded-lg transition-all duration-200 ${
              value === c.key
                ? "border-accent bg-accent/5"
                : "border-base-300 bg-base-300/20 hover:border-base-300/50"
            }`}
          >
            <span
              className="w-3 h-3 rounded-full mx-auto"
              style={{ backgroundColor: c.hex }}
            />
            <span className="font-mono text-xs">{c.label}</span>
          </button>
        ))}
      </div>
    </div>
  );

  if (!card) return content;

  return (
    <div className="card-instrument p-5 card-hover animate-fade-up delay-300">
      <div className="flex items-center gap-3 mb-4">
        {step && (
          <span className="text-xs font-mono text-secondary tracking-widest uppercase">
            {step}
          </span>
        )}
        <span className="font-display font-semibold">Curve</span>
      </div>
      {content}
    </div>
  );
}

// Curve selector for batch plan editor with descriptions
export const CURVES_WITH_DESC = [
  {
    key: "linear" as const,
    label: "Linear",
    desc: "Constant rate",
    hex: "#0ea5e9",
  },
  {
    key: "cliff" as const,
    label: "Cliff",
    desc: "After cliff",
    hex: "#f59e0b",
  },
  {
    key: "expdecay" as const,
    label: "Exp Decay",
    desc: "Decaying rate",
    hex: "#10b981",
  },
];

export type CurveSelectorWithDescProps = {
  value: CurveType;
  onChange: (curve: CurveType) => void;
};

export function CurveSelectorWithDesc({
  value,
  onChange,
}: CurveSelectorWithDescProps) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {CURVES_WITH_DESC.map((c) => (
        <button
          key={c.key}
          type="button"
          onClick={() => onChange(c.key as CurveType)}
          className={`p-3 flex-col gap-1 border-2 rounded-lg transition-all duration-200 ${
            value === c.key
              ? "border-accent bg-accent/5"
              : "border-base-300 bg-base-300/20"
          }`}
        >
          <span
            className="w-3 h-3 rounded-full mx-auto"
            style={{ backgroundColor: c.hex }}
          />
          <span className="font-mono text-xs">{c.label}</span>
        </button>
      ))}
    </div>
  );
}
