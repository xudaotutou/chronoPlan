"use client";
import { useState, useEffect } from "react";
import type {
  ScheduleItem,
  TemporalUnit,
  StartTimeMode,
} from "../../../template-types";
import { TEMPORAL_UNITS } from "../../../template-types";
import { CURVES_WITH_DESC } from "../../shared";
import { TokenSelector } from "../../TokenSelector/index";
import { sepoliaTokens, type Token } from "starkzap";
import { CurveComparisonDial } from "./CurveComparisonDial";
import { StartModeSelector } from "./StartModeSelector";

type PlanEditorProps = {
  schedule: ScheduleItem;
  scheduleIndex: number;
  onSave: (round: ScheduleItem) => void;
  onClose?: () => void;
  onDelete?: () => void;
  selectedToken?: string;
  // Inline mode props
  isExpanded?: boolean;
  onToggleExpand?: () => void;
};

export function PlanEditor({
  schedule,
  scheduleIndex,
  onSave,
  onClose,
  onDelete,
  selectedToken = "STRK",
  isExpanded = true,
  onToggleExpand,
}: PlanEditorProps) {
  const [name, setName] = useState(schedule.name || "");
  const [recipient, setRecipient] = useState(schedule.recipient || "");
  const getInitialToken = () => {
    const symbol = schedule.tokenSymbol || selectedToken || "STRK";
    return (
      sepoliaTokens[symbol as keyof typeof sepoliaTokens] || sepoliaTokens.STRK
    );
  };
  const [selectedTokenObj, setSelectedTokenObj] =
    useState<Token>(getInitialToken);
  const [amount, setAmount] = useState(schedule.amount);
  const [duration, setDuration] = useState(schedule.duration.toString());
  const [durationUnit, setDurationUnit] = useState<TemporalUnit>(
    schedule.durationUnit,
  );
  const [curve, setCurve] = useState(schedule.curve);
  const [startMode, setStartMode] = useState<StartTimeMode>(
    schedule.startTime.mode,
  );
  const [startDelay, setStartDelay] = useState(
    schedule.startTime.delaySeconds?.toString() || "0",
  );
  const [startDelayUnit, setStartDelayUnit] = useState(
    schedule.startTime.delayUnit || "d",
  );

  const isInlineMode = onToggleExpand !== undefined;
  const isCurrentlyExpanded = isInlineMode ? isExpanded : true;

  // Reset form state when schedule changes (e.g., when switching between plans)
  // This is the "cache" approach - form edits only persist per-plan, not globally
  useEffect(() => {
    setName(schedule.name || "");
    setRecipient(schedule.recipient || "");
    const symbol = schedule.tokenSymbol || selectedToken || "STRK";
    setSelectedTokenObj(
      sepoliaTokens[symbol as keyof typeof sepoliaTokens] || sepoliaTokens.STRK,
    );
    setAmount(schedule.amount);
    setDuration(schedule.duration.toString());
    setDurationUnit(schedule.durationUnit);
    setCurve(schedule.curve);
    setStartMode(schedule.startTime.mode);
    setStartDelay(schedule.startTime.delaySeconds?.toString() || "0");
    setStartDelayUnit(schedule.startTime.delayUnit || "d");
  }, [schedule]);

  // Handle ESC key to close editor (inline mode only)
  useEffect(() => {
    if (!isExpanded || !isInlineMode) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onToggleExpand?.();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isExpanded, isInlineMode]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    onSave({
      ...schedule,
      name: name || undefined,
      recipient: recipient || undefined,
      tokenSymbol: selectedTokenObj.symbol,
      amount,
      duration: parseInt(duration) || 0,
      durationUnit,
      curve,
      startTime: {
        mode: startMode,
        delaySeconds:
          startMode === "delayed" ? parseInt(startDelay) || 0 : undefined,
        delayUnit: startMode === "delayed" ? startDelayUnit : undefined,
      },
    });
  };

  const handleUnitChange = (newUnit: TemporalUnit) => {
    const oldFactor =
      TEMPORAL_UNITS.find((u) => u.key === durationUnit)?.factor || 1;
    const newFactor =
      TEMPORAL_UNITS.find((u) => u.key === newUnit)?.factor || 1;
    const durationValue = parseFloat(duration) || 0;
    const durationInSeconds = durationValue * oldFactor;
    const newDurationValue = Math.round(durationInSeconds / newFactor);
    setDurationUnit(newUnit);
    setDuration(String(newDurationValue));
  };

  // Collapsed view for inline mode
  if (isInlineMode && !isExpanded) {
    return (
      <div
        className="card bg-base-200 cursor-pointer hover:bg-base-300/50 transition-colors"
        onClick={onToggleExpand}
      >
        <div className="card-body p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="badge badge-secondary badge-sm font-mono">
                #{scheduleIndex + 1}
              </div>
              <span className="font-mono text-sm">
                {name || `Schedule ${scheduleIndex + 1}`}
              </span>
            </div>
            <div className="flex items-center gap-2 text-base-content/50">
              <span className="font-mono text-xs">
                {amount} {selectedTokenObj.symbol}
              </span>
              <span className="text-xs">·</span>
              <span className="font-mono text-xs">
                {duration} {durationUnit}
              </span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Full editor view
  return (
    <div
      className={
        isInlineMode
          ? "card bg-base-200"
          : "absolute inset-0 bg-base-200/95 backdrop-blur-sm p-6 overflow-y-auto z-50"
      }
    >
      <div className={isInlineMode ? "" : "max-w-2xl mx-auto"}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="relative w-8 h-8">
              <svg viewBox="0 0 32 32" className="w-full h-full">
                <circle
                  cx="16"
                  cy="16"
                  r="14"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="text-secondary"
                />
                <text
                  x="16"
                  y="20"
                  textAnchor="middle"
                  className="fill-secondary text-[10px] font-mono font-bold"
                >
                  {scheduleIndex + 1}
                </text>
              </svg>
            </div>
            <h3 className="font-display font-bold text-lg">
              {scheduleIndex >= 0
                ? `Edit Schedule ${scheduleIndex + 1}`
                : "New Schedule"}
            </h3>
          </div>
          {onToggleExpand && (
            <button
              onClick={onToggleExpand}
              className="btn btn-ghost btn-sm btn-square"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
          {onClose && !isInlineMode && (
            <button
              onClick={onClose}
              className="btn btn-ghost btn-sm btn-square"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-mono text-base-content/60 uppercase tracking-wider mb-2">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., TGE, Month 1, Q1 Vest"
              className="input input-bordered w-full font-mono text-sm bg-base-300/30 border-base-300 focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-base-content/60 uppercase tracking-wider mb-2">
              Recipient (optional)
            </label>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="0x... (leave empty for funder)"
              className="input input-bordered w-full font-mono text-sm bg-base-300/30 border-base-300 focus:border-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-base-content/60 uppercase tracking-wider mb-2">
                Token
              </label>
              <TokenSelector
                selectedToken={selectedTokenObj}
                onSelect={(token) => setSelectedTokenObj(token)}
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-base-content/60 uppercase tracking-wider mb-2">
                Amount
              </label>
              <input
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="100"
                className="input input-bordered w-full font-mono text-sm bg-base-300/30 border-base-300 focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-base-content/60 uppercase tracking-wider mb-2">
              Duration
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="input input-bordered flex-1 font-mono text-sm bg-base-300/30 border-base-300 focus:border-primary"
                min="0"
              />
              <select
                value={durationUnit}
                onChange={(e) =>
                  handleUnitChange(e.target.value as TemporalUnit)
                }
                className="select select-bordered w-24 font-mono text-sm bg-base-300/30 border-base-300 focus:border-primary"
              >
                {TEMPORAL_UNITS.map((u) => (
                  <option key={u.key} value={u.key}>
                    {u.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-base-content/60 uppercase tracking-wider mb-2">
              Release Curve
            </label>
            <div className="grid grid-cols-3 gap-2">
              {CURVES_WITH_DESC.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setCurve(c.key)}
                  className={`p-3 flex-col gap-1 border-2 rounded-lg transition-all duration-200 ${curve === c.key ? "border-accent bg-accent/5" : "border-base-300 bg-base-300/20"}`}
                >
                  <span
                    className="w-3 h-3 rounded-full mx-auto"
                    style={{ backgroundColor: c.hex }}
                  />
                  <span className="font-mono text-xs">{c.label}</span>
                </button>
              ))}
            </div>
            <CurveComparisonDial selectedCurve={curve} />
          </div>

          <StartModeSelector
            value={startMode}
            delay={startDelay}
            delayUnit={startDelayUnit}
            onModeChange={setStartMode}
            onDelayChange={setStartDelay}
            onDelayUnitChange={setStartDelayUnit}
          />

          <div className="flex justify-between pt-4 border-t border-base-300">
            <div>
              {onDelete && scheduleIndex >= 0 && (
                <button
                  type="button"
                  onClick={onDelete}
                  className="btn btn-error btn-sm font-mono text-xs"
                >
                  Delete Plan
                </button>
              )}
            </div>
            <div className="flex gap-2">
              {isInlineMode && (
                <button
                  type="button"
                  onClick={onToggleExpand}
                  className="btn btn-ghost font-mono text-xs"
                >
                  Cancel
                </button>
              )}
              {onClose && !isInlineMode && (
                <button
                  type="button"
                  onClick={onClose}
                  className="btn btn-ghost font-mono text-xs"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                className="btn btn-primary font-mono text-xs gap-1"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                {scheduleIndex >= 0 ? "Save Changes" : "Add Plan"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
