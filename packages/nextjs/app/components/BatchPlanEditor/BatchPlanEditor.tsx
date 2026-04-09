"use client";

import { useState } from "react";
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
} from "../../template-types";
import { WalletRequiredView } from "./WalletRequiredView";
import { ChronometricEmptyState } from "./components/ChronometricEmptyState";
import { PlanDialTimeline } from "./components/PlanDialTimeline";
import { PlanCard } from "./components/PlanCard";
import { PlanList } from "./components/PlanList";

// Contract addresses from deployedContracts
const FACTORY_ADDRESS = deployedContracts.sepolia?.Factory?.address || "";

export default function BatchPlanEditor() {
  const { address, isConnected } = useStarkZap();
  const { sendAsync } = useScaffoldMultiWriteContract();

  const [templates, setTemplates] =
    useState<ScheduleTemplate[]>(loadTemplates());
  const [selectedTemplate, setSelectedTemplate] =
    useState<ScheduleTemplate | null>(null);
  const [editingTemplate, setEditingTemplate] =
    useState<ScheduleTemplate | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [deploying, setDeploying] = useState(false);
  const [deployProgress, setDeployProgress] = useState({
    current: 0,
    total: 0,
  });

  const defaultToken = sepoliaTokens.STRK;

  const handleSaveTemplate = (template: ScheduleTemplate) => {
    const existing = templates.find((t) => t.id === template.id);
    let updated: ScheduleTemplate[];
    if (existing) {
      updated = templates.map((t) =>
        t.id === template.id ? { ...template, updatedAt: Date.now() } : t,
      );
    } else {
      updated = [...templates, template];
    }
    saveTemplates(updated);
    setTemplates(updated);
    setShowEditor(false);
    setEditingTemplate(null);
    toast.success(existing ? "Template updated" : "Template created");
  };

  const handleDeleteTemplate = (id: string) => {
    const updated = templates.filter((t) => t.id !== id);
    saveTemplates(updated);
    setTemplates(updated);
    if (selectedTemplate?.id === id) setSelectedTemplate(null);
    toast.success("Template deleted");
  };

  const handleApply = (template: ScheduleTemplate) => {
    setEditingTemplate(template);
    setSchedules([...template.items]);
    setShowEditor(true);
  };

  const handleNewSchedule = () => {
    setEditingTemplate(null);
    setSchedules([]);
    setShowEditor(true);
  };

  const handleDeploy = async () => {
    if (!isConnected || !address) {
      toast.error("Connect wallet first");
      return;
    }

    if (schedules.length === 0) {
      toast.error("No schedules to deploy");
      return;
    }

    const deploymentTime = Math.floor(Date.now() / 1000);
    const resolved = resolveRoundTimes(schedules, deploymentTime);
    const totalSchedules = resolved.length;

    setDeployProgress({ current: 0, total: totalSchedules });
    setDeploying(true);

    try {
      toast.loading(`Deploying ${totalSchedules} schedules...`, {
        id: "deploy",
      });

      // Build all calls upfront
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
              hi,
              round.resolvedStartTime.toString(),
              round.duration.toString(),
              curveKey,
              "0",
              defaultToken.address,
              address,
            ],
          },
        ];
      });

      // Send transaction
      const txHash = await sendAsync(calls);

      // Update progress after successful transaction
      setDeployProgress({ current: totalSchedules, total: totalSchedules });
      toast.success(
        `Deployed ${totalSchedules} schedule${totalSchedules !== 1 ? "s" : ""}! Tx: ${txHash?.slice(0, 10)}…`,
        { id: "deploy", duration: 8000 },
      );
    } catch (e: unknown) {
      toast.error((e as Error)?.message || "Deploy failed", { id: "deploy" });
    } finally {
      setDeploying(false);
      setDeployProgress({ current: 0, total: 0 });
    }
  };

  if (!isConnected) {
    return <WalletRequiredView />;
  }

  return (
    <div className="space-y-8 animate-fade-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-2xl">Batch Schedules</h2>
          <p className="text-xs font-mono text-base-content/40 mt-1">
            Create vesting schedules with multiple sequential batches
          </p>
        </div>
        <button
          onClick={handleNewSchedule}
          className="btn btn-primary btn-sm font-mono"
        >
          + New Schedule
        </button>
      </div>

      {/* Editor View */}
      {showEditor && (
        <div className="card bg-base-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-lg">
              {editingTemplate
                ? `Editing: ${editingTemplate.name}`
                : "New Schedule Set"}
            </h3>
            <button
              onClick={() => setShowEditor(false)}
              className="btn btn-ghost btn-sm"
            >
              Cancel
            </button>
          </div>

          <PlanList
            rounds={schedules}
            recipient={address || ""}
            selectedToken="STRK"
            onRoundsChange={setSchedules}
          />

          <div className="flex gap-3 mt-6 pt-4 border-t border-base-300">
            <button
              onClick={handleDeploy}
              disabled={deploying || schedules.length === 0}
              className="btn btn-primary flex-1 font-mono"
            >
              {deploying ? (
                <span className="loading loading-spinner loading-sm" />
              ) : (
                `Deploy (${schedules.length})`
              )}
            </button>
            <button
              onClick={() => {
                if (schedules.length > 0) {
                  const template: ScheduleTemplate = {
                    id: editingTemplate?.id || `template-${Date.now()}`,
                    name: editingTemplate?.name || "My Template",
                    items: schedules,
                    createdAt: editingTemplate?.createdAt || Date.now(),
                    updatedAt: Date.now(),
                  };
                  handleSaveTemplate(template);
                }
              }}
              disabled={schedules.length === 0}
              className="btn btn-secondary font-mono"
            >
              Save as Template
            </button>
          </div>
        </div>
      )}

      {/* Templates Grid */}
      {!showEditor && (
        <>
          {templates.length === 0 ? (
            <ChronometricEmptyState onCreate={handleNewSchedule} />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {templates.map((template) => (
                <PlanCard
                  key={template.id}
                  plan={template}
                  isSelected={selectedTemplate?.id === template.id}
                  onSelect={() =>
                    setSelectedTemplate(
                      selectedTemplate?.id === template.id ? null : template,
                    )
                  }
                  onApply={() => handleApply(template)}
                  onDelete={() => handleDeleteTemplate(template.id)}
                  onDeploy={() => {
                    setSchedules([...template.items]);
                    setDeploying(true);
                  }}
                  deploying={deploying}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Selected Template Timeline */}
      {selectedTemplate && !showEditor && (
        <PlanDialTimeline plan={selectedTemplate} />
      )}
    </div>
  );
}
