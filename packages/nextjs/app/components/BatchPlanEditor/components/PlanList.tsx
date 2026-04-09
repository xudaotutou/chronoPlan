"use client";

import { useState } from "react";
import type { ScheduleItem } from "../../../template-types";
import { PlanEditor } from "./PlanEditor";

type PlanListProps = {
  rounds: ScheduleItem[];
  recipient: string;
  selectedToken?: string;
  onRoundsChange: (rounds: ScheduleItem[]) => void;
};

export function PlanList({
  rounds,
  recipient,
  selectedToken = "STRK",
  onRoundsChange,
}: PlanListProps) {
  // Track which plan is currently expanded (-1 = none)
  const [expandedIndex, setExpandedIndex] = useState<number>(-1);
  // Version to force re-mount when toggling (clears unsaved edits)
  const [toggleVersion, setToggleVersion] = useState<number>(0);

  const handleAddPlan = () => {
    const newRound: ScheduleItem = {
      name: `Plan ${rounds.length + 1}`,
      recipient: recipient || undefined,
      tokenSymbol: selectedToken,
      amount: "100",
      duration: 30,
      durationUnit: "d",
      curve: "linear",
      startTime: { mode: "immediate" },
    };
    const newSchedules = [...rounds, newRound];
    onRoundsChange(newSchedules);
    // Expand the newly added plan
    setExpandedIndex(newSchedules.length - 1);
    setToggleVersion((v) => v + 1);
  };

  const handleEditPlan = (index: number, updatedRound: ScheduleItem) => {
    onRoundsChange(rounds.map((r, i) => (i === index ? updatedRound : r)));
    // Collapse after save
    setExpandedIndex(-1);
  };

  const handleDeletePlan = (index: number) => {
    onRoundsChange(rounds.filter((_, i) => i !== index));
    setExpandedIndex(-1);
  };

  const handleToggleExpand = (index: number) => {
    // Force re-mount to clear any unsaved edits
    setToggleVersion((v) => v + 1);
    setExpandedIndex(expandedIndex === index ? -1 : index);
  };

  return (
    <div className="space-y-3">
      {rounds.map((round, index) => (
        <PlanEditor
          key={`plan-${index}-v${toggleVersion}`}
          schedule={round}
          scheduleIndex={index}
          onSave={(updated) => handleEditPlan(index, updated)}
          onDelete={() => handleDeletePlan(index)}
          selectedToken={selectedToken}
          isExpanded={expandedIndex === index}
          onToggleExpand={() => handleToggleExpand(index)}
        />
      ))}

      <button
        type="button"
        onClick={handleAddPlan}
        className="w-full p-4 border-2 border-dashed border-base-300 rounded-lg hover:border-secondary/50 hover:bg-base-300/20 transition-colors"
      >
        <div className="flex items-center justify-center gap-2 text-base-content/50">
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
              strokeWidth="1.5"
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          <span className="font-mono text-sm">Add Plan</span>
        </div>
      </button>
    </div>
  );
}
