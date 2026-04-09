"use client";

import { useState, useEffect, useRef } from "react";

type SaveTemplateModalProps = {
  isOpen: boolean;
  onSave: (name: string) => void;
  onCancel: () => void;
};

export function SaveTemplateModal({
  isOpen,
  onSave,
  onCancel,
}: SaveTemplateModalProps) {
  const [name, setName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const modal = document.getElementById(
      "save_template_modal",
    ) as HTMLDialogElement;
    if (!modal) return;

    if (isOpen) {
      setName("");
      modal.showModal();
      // Focus input after modal opens
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      modal.close();
    }
  }, [isOpen]);

  const handleSave = () => {
    if (name.trim()) {
      onSave(name.trim());
      setName("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && name.trim()) {
      handleSave();
    }
  };

  if (!isOpen) return null;

  return (
    <dialog
      id="save_template_modal"
      className="modal modal-bottom sm:modal-middle"
    >
      <div className="modal-box bg-base-200">
        <h3 className="font-display font-bold text-lg">Save as Template</h3>
        <div className="py-4">
          <label className="block text-sm font-mono text-base-content/60 mb-2">
            Template Name
          </label>
          <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g., Team Vesting, Seed Round"
            className="input input-bordered w-full font-mono text-sm bg-base-300/30 border-base-300 focus:border-primary"
          />
        </div>
        <div className="modal-action">
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-ghost font-mono"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!name.trim()}
            className="btn btn-primary font-mono"
          >
            Save
          </button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button type="button" onClick={onCancel}>
          close
        </button>
      </form>
    </dialog>
  );
}
