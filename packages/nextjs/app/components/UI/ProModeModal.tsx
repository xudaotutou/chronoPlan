"use client";

import { useEffect, useRef } from "react";

export function ProModeModal({
  onClose,
  isPro,
  onToggle,
}: {
  onClose: () => void;
  isPro: boolean;
  onToggle: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  const handleClose = () => {
    onClose();
    dialogRef.current?.close();
  };

  const handleToggle = () => {
    onToggle();
    handleClose();
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
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-lg border flex items-center justify-center transition-all duration-300 ${
                isPro
                  ? "bg-accent/10 border-accent/30"
                  : "bg-base-300/30 border-base-300"
              }`}
            >
              {isPro ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-accent"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-base-content/30"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                    d="M20 12H4"
                  />
                </svg>
              )}
            </div>
            <div>
              <h3 className="font-display font-bold text-lg">
                Batch Scheduling
              </h3>
              <p
                className={`text-xs font-mono ${isPro ? "text-accent" : "text-base-content/40"}`}
              >
                {isPro ? "Enabled" : "Disabled"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
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
        </div>

        {isPro ? (
          <div className="space-y-4">
            <div className="bg-accent/5 border border-accent/20 rounded-lg p-4">
              <p className="text-sm text-base-content/70 font-mono mb-3">
                Batch features active:
              </p>
              <div className="space-y-2">
                {[
                  { icon: "◈", text: "Multiple plans per schedule" },
                  { icon: "◆", text: "Batch deploy plans" },
                  { icon: "◇", text: "Reusable templates" },
                ].map((feature, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <span className="text-accent">{feature.icon}</span>
                    <span className="text-base-content/70">{feature.text}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-base-300/20 rounded-lg">
              <span className="text-sm font-mono text-base-content/60">
                Switch to basic mode?
              </span>
              <button
                type="button"
                onClick={handleToggle}
                className="btn btn-ghost btn-sm font-mono text-xs"
              >
                Disable
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-base-content/60 font-mono">
              Unlock batch scheduling features:
            </p>
            <div className="space-y-3">
              {[
                { icon: "◈", text: "Create multiple plans" },
                { icon: "◆", text: "Batch deploy plans" },
                { icon: "◇", text: "Save as templates" },
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <span className="text-accent">{feature.icon}</span>
                  <span className="text-base-content/70">{feature.text}</span>
                </div>
              ))}
            </div>
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <p className="text-xs text-base-content/50 font-mono">
                Batch mode stores your plans locally. No additional fees or
                permissions required.
              </p>
            </div>
          </div>
        )}

        <div className="modal-action">
          <button
            type="button"
            className="btn btn-ghost font-mono text-xs"
            onClick={handleClose}
          >
            Close
          </button>
          {!isPro && (
            <button
              type="button"
              className="btn btn-primary font-mono text-xs"
              onClick={handleToggle}
            >
              Enable Batch Mode
            </button>
          )}
        </div>
      </div>
    </dialog>
  );
}
