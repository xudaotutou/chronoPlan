"use client";

import type { ScheduleItem } from "../../../template-types";
import { formatOffset, formatStartTime } from "../../../template-types";
import { CURVES_WITH_DESC } from "../../shared";

type RoundPlanCardProps = {
  schedule: ScheduleItem;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
  canDelete: boolean;
};

export function RoundPlanCard({
  schedule,
  index,
  onEdit,
  onDelete,
  canDelete,
}: RoundPlanCardProps) {
  const curveData =
    CURVES_WITH_DESC.find((c) => c.key === schedule.curve) ||
    CURVES_WITH_DESC[0];

  return (
    <div className="bg-base-300/20 rounded-lg p-4 border border-base-300 hover:border-primary/30 transition-colors group">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {/* Schedule dial */}
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center font-mono text-xs font-bold"
            style={{ backgroundColor: curveData.hex, color: "white" }}
          >
            {index + 1}
          </div>
          <div>
            <h4 className="font-display font-semibold text-sm">
              {schedule.name || `Plan ${index + 1}`}
            </h4>
            <p className="text-xs font-mono text-base-content/50">
              {formatStartTime(schedule.startTime)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-right mr-2">
            <p className="font-mono text-sm font-bold text-primary">
              {schedule.amount}
            </p>
            <p className="text-[10px] font-mono text-base-content/50">
              {schedule.tokenSymbol || "STRK"}
            </p>
          </div>

          {/* Curve indicator */}
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center"
            style={{ backgroundColor: curveData.hex + "30" }}
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: curveData.hex }}
            />
          </div>

          <button
            type="button"
            onClick={onEdit}
            className="btn btn-ghost btn-sm btn-square opacity-0 group-hover:opacity-100 transition-opacity"
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
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
              />
            </svg>
          </button>

          {canDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="btn btn-ghost btn-sm btn-square text-error opacity-0 group-hover:opacity-100 transition-opacity"
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
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
