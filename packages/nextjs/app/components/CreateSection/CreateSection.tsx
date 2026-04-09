"use client";
import { useState, useCallback, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { tokenKeys } from "~~/hooks/query-keys";
import { LockedCard } from "../SchedulesSection/index";
import BatchPlanEditor from "../BatchPlanEditor";
import { DEFAULT_TOKEN, type Token } from "../TokenSelector/index";
import { sepoliaTokens } from "starkzap";
import {
  type ScheduleTemplate,
  type StartTimeConfig,
  type StartTimeMode,
  type TemporalUnit,
  type CurveType,
  PRESET_SCHEDULE_ITEMS,
  loadTemplates,
  resolveStartTime,
  TEMPORAL_UNITS,
} from "../../template-types";
import { StandardModeView } from "./StandardModeView";
import { ProModeView } from "./ProModeView";
import { useDeploySchedule } from "./useDeploySchedule";

type CreateSectionProps = {
  isConnected: boolean;
  address: string | null;
  proMode: boolean;
};

export function CreateSection({
  isConnected,
  address,
  proMode,
}: CreateSectionProps) {
  // Standard mode state
  const [recipient, setRecipient] = useState("");
  const [duration, setDuration] = useState("");
  const [durationUnit, setTemporalUnit] = useState<TemporalUnit>("d");
  const [durationDisplay, setDurationDisplay] = useState("");
  const [amount, setAmount] = useState("");
  const [amountDisplay, setAmountDisplay] = useState("");
  const [selectedToken, setSelectedToken] = useState<Token>(DEFAULT_TOKEN);
  const [curve, setCurve] = useState<CurveType>("linear");

  // Form state
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [templates, setTemplates] = useState<ScheduleTemplate[]>([]);

  // Start Time Configuration
  const [startTimeMode, setStartTimeMode] =
    useState<StartTimeMode>("immediate");
  const [startDelay, setStartDelay] = useState("1");
  const [startDelayUnit, setStartDelayUnit] = useState<TemporalUnit>("d");

  // Deploy hook
  const { deploy, isLoading, isDeployPending } = useDeploySchedule();
  const queryClient = useQueryClient();

  useEffect(() => {
    setTemplates(loadTemplates());
  }, []);

  const currentStartTime: StartTimeConfig = {
    mode: startTimeMode,
    ...(startTimeMode === "delayed"
      ? {
          delaySeconds:
            parseInt(startDelay || "0") *
            (TEMPORAL_UNITS.find((u) => u.key === startDelayUnit)?.factor || 1),
          delayUnit: startDelayUnit,
        }
      : {}),
  };

  const getStartTime = useCallback((): number => {
    return resolveStartTime(currentStartTime);
  }, [currentStartTime]);

  const applyTemplate = useCallback(
    (templateId: string) => {
      if (templateId === "") {
        setSelectedTemplate("");
        return;
      }

      // Build list of all templates (presets + user templates)
      const allPresets = PRESET_SCHEDULE_ITEMS.map((item, i) => ({
        id: `preset-${i}`,
        name: item.name || `Preset ${i + 1}`,
        item,
        isPreset: true,
      }));

      const allUserTemplates = templates.map((t) => ({
        id: t.id,
        name: t.name,
        item: t.items[0] || {
          tokenSymbol: "STRK",
          amount: "0",
          duration: 30,
          durationUnit: "d" as TemporalUnit,
          curve: "linear" as CurveType,
          startTime: { mode: "immediate" as StartTimeMode },
        },
        isPreset: false,
      }));

      const allTemplates = [...allPresets, ...allUserTemplates];
      const template = allTemplates.find((t) => t.id === templateId);
      if (!template) return;

      const item = template.item;

      setSelectedTemplate(templateId);
      setAmountDisplay(item.amount);
      setAmount(String(BigInt(Math.floor(parseFloat(item.amount) * 1e18))));
      setTemporalUnit(item.durationUnit);
      // Calculate duration in seconds: duration_value * unit_factor
      const factor =
        TEMPORAL_UNITS.find((u) => u.key === item.durationUnit)?.factor || 1;
      const durationSeconds = item.duration * factor;
      setDuration(durationSeconds.toString());
      // Display value is the template duration value (in the same unit)
      setDurationDisplay(item.duration.toString());
      setCurve(item.curve);

      // Set token based on template
      const symbol = item.tokenSymbol as keyof typeof sepoliaTokens;
      if (sepoliaTokens[symbol]) {
        setSelectedToken(sepoliaTokens[symbol] as Token);
      }

      setStartTimeMode(
        item.startTime.mode === "delayed" ? "delayed" : "immediate",
      );
      if (item.startTime.mode === "delayed" && item.startTime.delaySeconds) {
        const delayUnit =
          TEMPORAL_UNITS.find((u) => u.key === item.startTime.delayUnit) ||
          TEMPORAL_UNITS[3];
        setStartDelay(
          (item.startTime.delaySeconds / delayUnit.factor).toString(),
        );
        setStartDelayUnit(item.startTime.delayUnit || "d");
      }
    },
    [templates],
  );

  const handleDeploy = useCallback(async () => {
    await deploy({
      isConnected,
      address,
      recipient,
      amount,
      amountDisplay,
      duration,
      curve,
      selectedToken,
      getStartTime,
      onSuccess: () => {
        // Invalidate balance cache to refresh UI
        queryClient.invalidateQueries({
          queryKey: tokenKeys.balance("STRK", address),
        });
        // Reset form on success
        setRecipient("");
        setAmount("");
        setAmountDisplay("");
        setDuration("");
        setDurationDisplay("");
        setSelectedTemplate("");
        setStartTimeMode("immediate");
      },
    });
  }, [
    deploy,
    isConnected,
    address,
    recipient,
    amount,
    amountDisplay,
    duration,
    curve,
    selectedToken,
    getStartTime,
  ]);

  if (!isConnected) return <LockedCard label="Wallet required" />;
  // Pro Mode: Inline Batch Editing
  if (proMode) {
    return <ProModeView />;
  }

  // Standard Mode
  return (
    <StandardModeView
      recipient={recipient}
      setRecipient={setRecipient}
      amount={amount}
      amountDisplay={amountDisplay}
      setAmount={setAmount}
      setAmountDisplay={setAmountDisplay}
      selectedToken={selectedToken}
      setSelectedToken={setSelectedToken}
      duration={duration}
      durationDisplay={durationDisplay}
      durationUnit={durationUnit}
      setDuration={setDuration}
      setDurationDisplay={setDurationDisplay}
      setTemporalUnit={setTemporalUnit}
      curve={curve}
      setCurve={setCurve}
      startMode={startTimeMode}
      setStartMode={setStartTimeMode}
      startDelay={startDelay}
      setStartDelay={setStartDelay}
      startDelayUnit={startDelayUnit}
      setStartDelayUnit={setStartDelayUnit}
      onDeploy={handleDeploy}
      isLoading={isLoading}
      isDeployPending={isDeployPending}
    />
  );
}
