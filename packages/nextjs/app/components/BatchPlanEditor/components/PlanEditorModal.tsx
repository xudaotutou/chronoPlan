"use client";

import { useState, useRef, useEffect } from "react";
import toast from "react-hot-toast";
import type { ScheduleTemplate, ScheduleItem } from "../../../template-types";

import { PlanList } from "./PlanList";
import { TokenSelector } from "../../TokenSelector";

type PlanEditorModalProps = {
  plan: ScheduleTemplate | null;
  onClose: () => void;
  onSave: (plan: ScheduleTemplate) => void;
  directDeploy?: boolean;
  onDeploy?: (plan: ScheduleTemplate) => Promise<void>;
  hasUnsavedChanges?: boolean;
  onUnsavedChangesChange?: (hasChanges: boolean) => void;
  /** Available templates to load from */
  templates?: ScheduleTemplate[];
};

export function PlanEditorModal({
  plan,
  onClose,
  onSave,
  directDeploy = false,
  onDeploy,
  hasUnsavedChanges = false,
  onUnsavedChangesChange,
  templates = [],
}: PlanEditorModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  const handleClose = () => {
    onClose();
    dialogRef.current?.close();
  };

  const [name, setName] = useState(plan?.name || "");
  const [recipient, setRecipient] = useState(plan?.items[0]?.recipient || "");
  const [rounds, setRounds] = useState<ScheduleItem[]>(plan?.items || []);
  const [showTemplateList, setShowTemplateList] = useState(false);

  const buildTemplate = (): ScheduleTemplate => {
    return {
      id: plan?.id || `plan-${Date.now()}`,
      name: name.trim(),
      items: rounds.map((r, i) => ({
        ...r,
        recipient: r.recipient || recipient,
        name: r.name || `${name.trim()} #${i + 1}`,
      })),
      createdAt: plan?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };
  };

  const handleLoadTemplate = (template: ScheduleTemplate) => {
    setName(template.name);
    setRecipient(template.items[0]?.recipient || "");
    setRounds(template.items);
    setShowTemplateList(false);
    toast.success(`Loaded template: ${template.name}`);
  };

  const handleSaveAsTemplate = () => {
    if (!name.trim()) {
      toast.error("Schedule name required");
      return;
    }
    if (rounds.length === 0) {
      toast.error("Add at least one schedule");
      return;
    }

    const template: ScheduleTemplate = {
      id: `template-${Date.now()}`,
      name: name.trim(),
      items: rounds.map((r, i) => ({
        ...r,
        recipient: r.recipient || recipient,
        name: r.name || `${name.trim()} #${i + 1}`,
      })),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    onSave(template);
    toast.success(`Saved as template: ${name.trim()}`);
    handleClose();
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!name.trim()) {
      toast.error("Schedule name required");
      return;
    }
    if (rounds.length === 0) {
      toast.error("Add at least one schedule");
      return;
    }

    const template = buildTemplate();

    if (directDeploy && onDeploy) {
      onDeploy(template);
      dialogRef.current?.close();
    } else {
      onSave(template);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className="modal"
      onClick={(e) => {
        const rect = dialogRef.current?.getBoundingClientRect();
        if (rect) {
          const isBackdropClick =
            e.clientX < rect.left ||
            e.clientX > rect.right ||
            e.clientY < rect.top ||
            e.clientY > rect.bottom;
          if (isBackdropClick) handleClose();
        }
      }}
    >
      <div className="modal-box bg-base-200 rounded-lg max-w-2xl">
        {hasUnsavedChanges && (
          <div className="mb-4 p-3 bg-warning/20 border border-warning/30 rounded-lg text-sm">
            You have unsaved changes. Click "Save Changes" first, then deploy.
          </div>
        )}

        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-xl">
            {plan ? "Edit Schedule" : "New Schedule"}
          </h3>
          <button
            onClick={handleClose}
            className="btn btn-ghost btn-sm btn-circle"
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
        </div>

        <div className="space-y-6" onClick={(e) => e.stopPropagation()}>
          {/* Template Section */}
          {templates.length > 0 && (
            <div className="border border-base-300 rounded-lg p-3 bg-base-300/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono text-base-content/60 uppercase">
                  Load Template
                </span>
                <button
                  type="button"
                  onClick={() => setShowTemplateList(!showTemplateList)}
                  className="btn btn-ghost btn-xs font-mono text-xs"
                >
                  {showTemplateList ? "Hide" : `Show (${templates.length})`}
                </button>
              </div>
              {showTemplateList && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {templates.map((template) => (
                    <button
                      key={template.id}
                      type="button"
                      onClick={() => handleLoadTemplate(template)}
                      className="btn btn-sm btn-ghost font-mono text-xs bg-base-300/50"
                    >
                      {template.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-xs font-mono text-base-content/60 uppercase tracking-wider mb-2">
              Schedule Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Team Vesting, Seed Round"
              className="input input-bordered w-full font-mono text-sm bg-base-300/30 border-base-300 focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-base-content/60 uppercase tracking-wider mb-2">
              Default Recipient (optional)
            </label>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="0x... (applies to all schedules)"
              className="input input-bordered w-full font-mono text-sm bg-base-300/30 border-base-300 focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-base-content/60 uppercase tracking-wider mb-3">
              Schedules ({rounds.length})
            </label>
            <div onClick={(e) => e.stopPropagation()}>
              <PlanList
                rounds={rounds}
                recipient={recipient}
                onRoundsChange={setRounds}
              />
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-base-300">
            <button
              type="button"
              onClick={handleSaveAsTemplate}
              className="btn btn-ghost font-mono text-sm"
            >
              Save as Template
            </button>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleClose}
                className="btn btn-ghost font-mono text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="btn btn-primary font-mono text-sm"
              >
                {plan
                  ? directDeploy && !hasUnsavedChanges
                    ? "Deploy"
                    : "Save Changes"
                  : directDeploy
                    ? "Deploy"
                    : "Create Schedule"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </dialog>
  );
}
