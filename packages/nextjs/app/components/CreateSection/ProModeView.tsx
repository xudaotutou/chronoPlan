"use client";
import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { tokenKeys } from "~~/hooks/query-keys";
import { useStarkZap } from "~~/hooks/useStarkZap";
import { useScaffoldMultiWriteContract } from "~~/hooks/scaffold-stark";
import type { Call } from "starknet";
import deployedContracts from "~~/contracts/deployedContracts";
import { sepoliaTokens, Amount } from "starkzap";
import toast from "react-hot-toast";
import {
  type ScheduleTemplate,
  type ScheduleItem,
  loadTemplates,
  saveTemplates,
  resolveRoundTimes,
  TEMPORAL_UNITS,
} from "../../template-types";
import { PlanList } from "../BatchPlanEditor/components/PlanList";
import { ConfirmModal } from "../UI/ConfirmModal";
import { SaveTemplateModal } from "../UI/SaveTemplateModal";
import { useTemplateStore } from "../../store/templateStore";

const FACTORY_ADDRESS = deployedContracts.sepolia?.Factory?.address || "";

export function ProModeView() {
  const { address, isConnected } = useStarkZap();
  const { sendAsync } = useScaffoldMultiWriteContract();

  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [templates, setTemplates] =
    useState<ScheduleTemplate[]>(loadTemplates());
  const [deploying, setDeploying] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const appliedTemplate = useTemplateStore((s) => s.appliedTemplate);
  const setAppliedTemplate = useTemplateStore((s) => s.setAppliedTemplate);
  const queryClient = useQueryClient();

  // Apply template from store when component mounts or store changes
  useEffect(() => {
    if (appliedTemplate) {
      setSchedules([...appliedTemplate.items]);
      setAppliedTemplate(null); // Clear after applying
    }
  }, [appliedTemplate, setAppliedTemplate]);

  const defaultToken = sepoliaTokens.STRK;

  // Deploy all plans
  const handleDeploy = async () => {
    if (!isConnected || !address) {
      toast.error("Connect wallet first");
      return;
    }

    if (schedules.length === 0) {
      toast.error("No plans to deploy");
      return;
    }

    const deploymentTime = Math.floor(Date.now() / 1000);
    const resolved = resolveRoundTimes(schedules, deploymentTime);
    const totalPlans = resolved.length;

    setDeploying(true);

    try {
      toast.loading(`Deploying ${totalPlans} plans...`, { id: "deploy" });

      const calls: Call[] = resolved.flatMap((round) => {
        const amountInWei = Amount.parse(
          round.amount,
          defaultToken.decimals,
        ).toBase();
        const [lo, hi] = [
          (amountInWei & ((1n << 128n) - 1n)).toString(),
          (amountInWei >> 128n).toString(),
        ];
        const curveKey =
          round.curve === "linear"
            ? "LINEAR"
            : round.curve === "cliff"
              ? "CLIFF"
              : "EXP_DECAY";
        // Convert duration to seconds
        const durationFactor =
          TEMPORAL_UNITS.find((u) => u.key === round.durationUnit)?.factor ||
          86400;
        const durationInSeconds = round.duration * durationFactor;

        return [
          {
            contractAddress: defaultToken.address,
            entrypoint: "approve",
            calldata: [FACTORY_ADDRESS, lo, hi],
          },
          {
            contractAddress: FACTORY_ADDRESS,
            entrypoint: "deploy_schedule",
            calldata: [
              round.recipient || address,
              lo,
              hi,
              round.resolvedStartTime.toString(),
              durationInSeconds.toString(),
              curveKey,
              "0",
              defaultToken.address,
              address,
            ],
          },
        ];
      });

      await sendAsync(calls);
      // Invalidate balance cache to refresh UI
      queryClient.invalidateQueries({
        queryKey: tokenKeys.balance("STRK", address),
      });
      toast.success(
        `Deployed ${totalPlans} plan${totalPlans !== 1 ? "s" : ""}!`,
        {
          id: "deploy",
          duration: 8000,
        },
      );

      // Clear after successful deploy
      setSchedules([]);
    } catch (e: unknown) {
      toast.error((e as Error)?.message || "Deploy failed", { id: "deploy" });
    } finally {
      setDeploying(false);
    }
  };

  // Save as template
  const handleSaveAsTemplate = () => {
    if (schedules.length === 0) return;
    setShowSaveModal(true);
  };

  const handleConfirmSave = (name: string) => {
    const template: ScheduleTemplate = {
      id: `template-${Date.now()}`,
      name,
      items: schedules,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const updated = [...templates, template];
    saveTemplates(updated);
    setTemplates(updated);
    setShowSaveModal(false);
    toast.success("Template saved");
  };

  // Clear all
  const handleClearAll = () => {
    setShowClearModal(true);
  };

  const handleConfirmClear = () => {
    setSchedules([]);
    setShowClearModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Plans List - Inline Editing */}
      <div className="card bg-base-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-semibold">
            Plans ({schedules.length})
          </h3>
          {schedules.length > 0 && (
            <button
              onClick={handleClearAll}
              className="btn btn-ghost btn-sm font-mono text-xs"
            >
              Clear All
            </button>
          )}
        </div>

        <PlanList
          rounds={schedules}
          recipient={address || ""}
          selectedToken="STRK"
          onRoundsChange={setSchedules}
        />
      </div>

      {/* Deploy Actions */}
      {schedules.length > 0 && (
        <div className="card bg-base-200 p-4">
          <div className="flex gap-3">
            <button
              onClick={handleDeploy}
              disabled={deploying}
              className="btn btn-primary flex-1 font-mono"
            >
              {deploying ? (
                <span className="loading loading-spinner loading-sm" />
              ) : (
                `Deploy (${schedules.length})`
              )}
            </button>
            <button
              onClick={handleSaveAsTemplate}
              className="btn btn-secondary font-mono"
            >
              Save as Template
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      <ConfirmModal
        isOpen={showClearModal}
        title="Clear All Plans"
        message="Are you sure you want to clear all plans? This action cannot be undone."
        confirmText="Clear All"
        variant="danger"
        onConfirm={handleConfirmClear}
        onCancel={() => setShowClearModal(false)}
      />

      <SaveTemplateModal
        isOpen={showSaveModal}
        onSave={handleConfirmSave}
        onCancel={() => setShowSaveModal(false)}
      />
    </div>
  );
}
