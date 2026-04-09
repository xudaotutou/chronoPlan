"use client";

import type { ScheduleTemplate } from "../../../template-types";
import { calculateTotalAmount } from "../../../template-types";
import { CURVES_WITH_DESC } from "../../shared";

type PlanCardProps = {
  plan: ScheduleTemplate;
  isSelected: boolean;
  onSelect: () => void;
  onApply: () => void;
  onDelete: () => void;
  onDeploy: () => void;
  deploying: boolean;
};

export function PlanCard({
  plan,
  isSelected,
  onSelect,
  onApply,
  onDelete,
  onDeploy,
  deploying,
}: PlanCardProps) {
  const totalAmount = calculateTotalAmount(plan.items);
  const firstRecipient = plan.items[0]?.recipient || "";

  return (
    <div
      className={`card-instrument p-5 transition-all duration-300 cursor-pointer group ${
        isSelected
          ? "border-primary/50 shadow-lg shadow-primary/10"
          : "hover:border-primary/30"
      }`}
      onClick={onSelect}
    >
      {/* Header with mini dial */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* Mini progress dial */}
          <div className="relative w-10 h-10">
            <svg viewBox="0 0 40 40" className="w-full h-full">
              <circle
                cx="20"
                cy="20"
                r="17"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-base-300"
              />
              <circle
                cx="20"
                cy="20"
                r="17"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 17 * 0.6} ${2 * Math.PI * 17}`}
                transform="rotate(-90 20 20)"
                className="text-primary"
              />
              <text
                x="20"
                y="23"
                textAnchor="middle"
                className="fill-primary text-[8px] font-mono font-bold"
              >
                {plan.items.length}
              </text>
            </svg>
          </div>
          <div>
            <h3 className="font-display font-bold text-base">{plan.name}</h3>
            <p className="text-xs font-mono text-base-content/50 mt-1">
              {plan.items.length} plan{plan.items.length !== 1 ? "s" : ""} ·{" "}
              {plan.items.length} schedule{plan.items.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        <div className="dropdown dropdown-end">
          <label
            tabIndex={0}
            className="btn btn-ghost btn-sm btn-square opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
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
                d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
              />
            </svg>
          </label>
          <ul
            tabIndex={0}
            className="dropdown-content z-10 menu p-2 shadow-lg card-instrument rounded-box w-40 border border-base-300"
          >
            <li>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
              >
                Delete
              </button>
            </li>
          </ul>
        </div>
      </div>

      {/* Summary metrics */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-base-300/30 rounded-lg p-2 text-center">
          <p className="text-lg font-display font-bold">{totalAmount}</p>
          <p className="text-[10px] font-mono text-base-content/50">
            STRK Total
          </p>
        </div>
        <div className="bg-base-300/30 rounded-lg p-2 text-center">
          <p className="text-lg font-display font-bold">{plan.items.length}</p>
          <p className="text-[10px] font-mono text-base-content/50">Plans</p>
        </div>
        <div className="bg-base-300/30 rounded-lg p-2 text-center">
          <p className="text-lg font-display font-bold truncate">
            {firstRecipient.slice(0, 4) || "-"}
          </p>
          <p className="text-[10px] font-mono text-base-content/50">
            Recipient
          </p>
        </div>
      </div>

      {/* Plan Preview */}
      <div className="space-y-1.5 mb-4">
        {plan.items.slice(0, 3).map((item, i) => {
          const curveData =
            CURVES_WITH_DESC.find((c) => c.key === item.curve) ||
            CURVES_WITH_DESC[0];
          return (
            <div
              key={i}
              className="flex items-center justify-between text-xs font-mono"
            >
              <span className="flex items-center gap-1.5">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: curveData.hex }}
                />
                <span className="text-base-content/60">Plan {i + 1}</span>
              </span>
              <span className="text-primary">{item.amount} STRK</span>
            </div>
          );
        })}
        {plan.items.length > 3 && (
          <p className="text-[10px] font-mono text-base-content/40 text-center">
            +{plan.items.length - 3} more plans
          </p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          className="btn btn-ghost btn-sm font-mono text-xs flex-1"
          onClick={(e) => {
            e.stopPropagation();
            onApply();
          }}
        >
          Apply
        </button>
        <button
          className={`btn btn-primary btn-sm font-mono text-xs gap-1 flex-1 ${
            deploying ? "loading" : ""
          }`}
          onClick={(e) => {
            e.stopPropagation();
            onDeploy();
          }}
          disabled={deploying}
        >
          {deploying ? (
            <>
              <span className="loading loading-spinner loading-xs" />
              Deploying...
            </>
          ) : (
            <>
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
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              Deploy
            </>
          )}
        </button>
      </div>
    </div>
  );
}
