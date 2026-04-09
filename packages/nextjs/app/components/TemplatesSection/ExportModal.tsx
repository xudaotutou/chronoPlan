"use client";

import { useState, useEffect, useRef } from "react";
import type { ScheduleTemplate } from "../../template-types";

type ExportModalProps = {
  templates: ScheduleTemplate[];
  onClose: () => void;
  onExport: () => void;
};

export function ExportModal({
  templates,
  onClose,
  onExport,
}: ExportModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  const handleClose = () => {
    onClose();
    dialogRef.current?.close();
  };

  return (
    <dialog
      ref={dialogRef}
      className="modal"
      onClick={(e) => {
        if (e.target === dialogRef.current) handleClose();
      }}
    >
      <div className="modal-box card-instrument border-primary/20 max-w-md">
        <h3 className="font-display font-bold text-lg mb-4">
          Export Templates
        </h3>
        <p className="text-sm font-mono text-base-content/60 mb-4">
          {templates.length} template{templates.length !== 1 ? "s" : ""} ready
          to download
        </p>
        <div className="bg-base-300/30 rounded-lg p-4 mb-4 font-mono text-xs overflow-auto max-h-64">
          <pre className="text-base-content/70">
            {JSON.stringify(templates, null, 2)}
          </pre>
        </div>
        <div className="modal-action mt-6">
          <button
            className="btn btn-ghost font-mono text-xs"
            onClick={handleClose}
          >
            Close
          </button>
          <button
            className="btn btn-primary font-mono text-xs"
            onClick={onExport}
          >
            Download JSON
          </button>
        </div>
      </div>
    </dialog>
  );
}
