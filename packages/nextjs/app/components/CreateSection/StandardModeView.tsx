"use client";

import { useEffect } from "react";
import { RecipientInput } from "../RecipientInput";
import { AmountInput } from "../AmountInput";
import { DurationInput } from "../DurationInput";
import { CurveSelector } from "../CurveSelector";
import { StartModeSelector } from "../BatchPlanEditor/components/StartModeSelector";
import { useTemplateStore } from "../../store/templateStore";
import type {
  TemporalUnit,
  StartTimeMode,
  ScheduleItem,
} from "../../template-types";
import type { Token } from "../TokenSelector/index";

type StandardModeViewProps = {
  recipient: string;
  setRecipient: (value: string) => void;
  amount: string;
  amountDisplay: string;
  setAmount: (value: string) => void;
  setAmountDisplay: (value: string) => void;
  selectedToken: Token;
  setSelectedToken: (token: Token) => void;
  duration: string;
  durationDisplay: string;
  durationUnit: TemporalUnit;
  setDuration: (value: string) => void;
  setDurationDisplay: (value: string) => void;
  setTemporalUnit: (unit: TemporalUnit) => void;
  curve: "linear" | "cliff" | "expdecay";
  setCurve: (curve: "linear" | "cliff" | "expdecay") => void;
  startMode: StartTimeMode;
  setStartMode: (mode: StartTimeMode) => void;
  startDelay: string;
  setStartDelay: (delay: string) => void;
  startDelayUnit: TemporalUnit;
  setStartDelayUnit: (unit: TemporalUnit) => void;
  onDeploy: () => void;
  isLoading: boolean;
  isDeployPending: boolean;
};

export function StandardModeView({
  recipient,
  setRecipient,
  amount,
  amountDisplay,
  setAmount,
  setAmountDisplay,
  selectedToken,
  setSelectedToken,
  duration,
  durationDisplay,
  durationUnit,
  setDuration,
  setDurationDisplay,
  setTemporalUnit,
  curve,
  setCurve,
  startMode,
  setStartMode,
  startDelay,
  setStartDelay,
  startDelayUnit,
  setStartDelayUnit,
  onDeploy,
  isLoading,
  isDeployPending,
}: StandardModeViewProps) {
  const appliedTemplate = useTemplateStore((s) => s.appliedTemplate);
  const setAppliedTemplate = useTemplateStore((s) => s.setAppliedTemplate);

  // Apply template from store
  useEffect(() => {
    if (appliedTemplate && appliedTemplate.items.length > 0) {
      const item = appliedTemplate.items[0];
      setRecipient(item.recipient || "");
      setAmount("");
      setAmountDisplay(item.amount);
      setTemporalUnit(item.durationUnit);
      // Calculate duration in seconds
      const factor =
        durationUnit === "d"
          ? 86400
          : durationUnit === "h"
            ? 3600
            : durationUnit === "min"
              ? 60
              : 1;
      setDuration((item.duration * factor).toString());
      setDurationDisplay(item.duration.toString());
      setCurve(item.curve);
      setAppliedTemplate(null);
    }
  }, [appliedTemplate, setAppliedTemplate]);

  return (
    <div className="space-y-6 animate-fade-up">
      <RecipientInput value={recipient} onChange={setRecipient} />
      <AmountInput
        value={amount}
        displayValue={amountDisplay}
        token={selectedToken}
        onChange={(wei, display) => {
          setAmount(wei);
          setAmountDisplay(display);
        }}
        onTokenChange={setSelectedToken}
      />
      <DurationInput
        value={duration}
        displayValue={durationDisplay}
        unit={durationUnit}
        onChange={(sec, display) => {
          setDuration(sec);
          setDurationDisplay(display);
        }}
        onUnitChange={setTemporalUnit}
      />
      <CurveSelector value={curve} onChange={setCurve} />
      <StartModeSelector
        value={startMode}
        delay={startDelay}
        delayUnit={startDelayUnit}
        onModeChange={setStartMode}
        onDelayChange={setStartDelay}
        onDelayUnitChange={setStartDelayUnit}
      />

      <div className="card-instrument p-6 animate-fade-up delay-500">
        <button
          className="btn btn-primary w-full font-display tracking-wide text-lg py-4"
          onClick={onDeploy}
          disabled={isLoading || isDeployPending || !amount || !duration}
        >
          {isLoading || isDeployPending ? (
            <span className="loading loading-spinner loading-sm" />
          ) : (
            "Create Plan"
          )}
        </button>
      </div>
    </div>
  );
}
