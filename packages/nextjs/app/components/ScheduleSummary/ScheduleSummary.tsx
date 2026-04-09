"use client";

import { CURVES } from "../CurveSelector";

type Curve = "linear" | "cliff" | "expdecay";

type ScheduleSummaryProps = {
  recipient: string;
  amount: string;
  duration: string;
  curve: Curve;
  onDeploy: () => void;
  isLoading: boolean;
  isPending: boolean;
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

function PreviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-xs font-mono text-base-content/40 uppercase tracking-wider">
        {label}
      </span>
      <span className="text-sm font-mono text-base-content">{value}</span>
    </div>
  );
}

export function ScheduleSummary({
  recipient,
  amount,
  duration,
  curve,
  onDeploy,
  isLoading,
  isPending,
}: ScheduleSummaryProps) {
  return (
    <div className="card-instrument p-6">
      <h3 className="font-display font-bold text-sm text-primary mb-4">
        Plan Summary
      </h3>
      <div className="space-y-4">
        <PreviewRow
          label="Recipient"
          value={recipient ? `${recipient.slice(0, 8)}…` : "You (funder)"}
        />
        <PreviewRow label="Amount" value={amount ? `${amount} STRK` : "—"} />
        <PreviewRow
          label="Duration"
          value={duration ? formatDuration(parseInt(duration)) : "—"}
        />
        <PreviewRow
          label="Curve"
          value={CURVES.find((c) => c.key === curve)?.label || "—"}
        />
      </div>
      <button
        className="btn btn-primary w-full mt-6 font-display tracking-wide"
        onClick={onDeploy}
        disabled={isLoading || isPending || !amount || !duration}
      >
        {isLoading || isPending ? (
          <span className="loading loading-spinner loading-sm" />
        ) : (
          "Create Plan"
        )}
      </button>
    </div>
  );
}
