"use client";

import toast from "react-hot-toast";
import { useState, useEffect, useRef } from "react";
import { useContractCall, useStarkZap } from "~~/hooks/useStarkZap";
import { useClaimSchedule } from "./useClaimSchedule";
import { useCloseSchedule } from "./useCloseSchedule";
import {
  REGISTRY_ADDRESS,
  REGISTRY_ABI,
  SCHEDULE_ABI,
  PLAN_STATUS,
  parsePlanStatus,
  formatU256,
} from "~~/hooks/schedule-constants";
import { scheduleKeys } from "~~/hooks/query-keys";
import { ConfirmModal } from "../UI/ConfirmModal";

type ScheduleCardProps = {
  planId: string;
  index: number;
  onClaimSuccess?: () => void;
  userAddress: string | null;
  isFunder: boolean;
  isRecipient: boolean;
  onValidSchedule?: (planId: string) => void;
  onValidRole?: (
    planId: string,
    isFunder: boolean,
    isRecipient: boolean,
  ) => void;
};

// Curve display names
const CURVE_NAMES: Record<string, string> = {
  LINEAR: "Linear",
  CLIFF: "Cliff",
  EXP_DECAY: "Exp Decay",
};

// Status colors mapping
const STATUS_COLORS: Record<number, string> = {
  0: "badge-success", // Active = green
  1: "badge-info", // Completed = blue
  2: "badge-error", // Closed = red
};

// Truncate address: 0x1234...abcd
function truncateAddress(address: string): string {
  if (!address || address.length < 12) return address || "—";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// Copy address button
function CopyButton({ value }: { value: string }) {
  return (
    <button
      className="btn btn-ghost btn-xs btn-square opacity-50 hover:opacity-100"
      onClick={() => {
        navigator.clipboard.writeText(value);
        toast.success("Copied!");
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-3 w-3"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
        />
      </svg>
    </button>
  );
}

function formatDate(timestamp: string): string {
  if (!timestamp || timestamp === "0") return "—";
  try {
    const date = new Date(Number(timestamp) * 1000);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

export function ScheduleCard({
  planId,
  index,
  onClaimSuccess,
  userAddress,
  isFunder,
  isRecipient,
  onValidSchedule,
  onValidRole,
}: ScheduleCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const { address: walletAddress } = useStarkZap();
  const { claim, isLoading: isClaiming } = useClaimSchedule();
  const { close, isLoading: isClosing } = useCloseSchedule();

  // Fetch plan info from Registry with proper query key

  const { data: planInfo, isLoading: isPlanLoading } = useContractCall(
    REGISTRY_ADDRESS,
    REGISTRY_ABI,
    "get_plan_info",
    [planId],
    {
      enabled: !!planId,
      queryKey: scheduleKeys.planInfo(planId),
    },
  );

  // Extract schedule address from PlanInfo struct
  // PlanInfo: [schedule_address, recipient, funder, amount_low, amount_high, token_address, curve_key, created_at]
  const planInfoArray = planInfo as string[] | undefined;
  const scheduleAddress = planInfoArray?.[0] || "";
  const planRecipient = planInfoArray?.[1] || "";
  const planFunder = planInfoArray?.[2] || "";
  const planAmountLow = planInfoArray?.[3] || "0";
  const planAmountHigh = planInfoArray?.[4] || "0";
  const planTokenAddress = planInfoArray?.[5] || "";
  const planCurveKey = planInfoArray?.[6] || "";
  const planCreatedAt = planInfoArray?.[7] || "0";

  // Fetch schedule data with proper query keys
  const { data: available, isLoading: isAvailableLoading } = useContractCall(
    scheduleAddress,
    SCHEDULE_ABI,
    "get_available",
    [],
    {
      enabled: !!scheduleAddress,
      queryKey: scheduleKeys.available(scheduleAddress),
    },
  );

  const { data: claimed } = useContractCall(
    scheduleAddress,
    SCHEDULE_ABI,
    "get_claimed",
    [],
    {
      enabled: !!scheduleAddress,
      queryKey: scheduleKeys.claimed(scheduleAddress),
    },
  );

  const { data: status } = useContractCall(
    scheduleAddress,
    SCHEDULE_ABI,
    "get_status",
    [],
    {
      enabled: !!scheduleAddress,
      queryKey: scheduleKeys.status(scheduleAddress),
    },
  );

  const isLoading =
    isPlanLoading || isAvailableLoading || isClaiming || isClosing;

  // Track if we've reported to parent to avoid infinite loops
  const hasReportedRef = useRef(false);

  // Report valid schedule and role to parent only when conditions are met
  useEffect(() => {
    if (
      !isPlanLoading &&
      scheduleAddress !== "0x0" &&
      !hasReportedRef.current
    ) {
      hasReportedRef.current = true;
      onValidSchedule?.(planId);
      onValidRole?.(planId, isFunder, isRecipient);
    }
  }, [
    isPlanLoading,
    scheduleAddress,
    planId,
    isFunder,
    isRecipient,
    planFunder,
    onValidSchedule,
    onValidRole,
  ]);

  // Skip rendering if schedule address is invalid (0x0) and loading is done
  if (!isPlanLoading && scheduleAddress === "0x0") {
    return null;
  }

  if (isLoading && !scheduleAddress) {
    return (
      <div className="card-instrument p-5 animate-pulse">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-base-300/50 rounded-lg" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-base-300/50 rounded w-3/4" />
            <div className="h-3 bg-base-300/30 rounded w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  // Parse status using centralized utility
  const statusNum = parsePlanStatus(status);
  const statusName = PLAN_STATUS[statusNum] || `Unknown(${statusNum})`;

  // Format amounts using centralized u256 parsing
  const totalAmount = formatU256([planAmountLow, planAmountHigh]);
  const claimedAmount = formatU256(claimed);
  const availableAmount = formatU256(available);

  return (
    <div className="card-instrument p-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* Dial icon */}
          <div className="relative w-10 h-10">
            <svg viewBox="0 0 40 40" className="w-full h-full">
              <circle
                cx="20"
                cy="20"
                r="18"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="text-primary"
              />
              <circle
                cx="20"
                cy="20"
                r="14"
                fill="none"
                stroke="currentColor"
                strokeWidth="0.5"
                className="text-primary/50"
              />
              <circle
                cx="20"
                cy="20"
                r="3"
                fill="currentColor"
                className="text-accent"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-mono font-bold text-primary">
              {index + 1}
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-semibold text-sm">
                Plan {index + 1}
              </span>
              <span
                className={`badge ${STATUS_COLORS[statusNum] || "badge-ghost"} badge-sm font-mono`}
              >
                {statusName}
              </span>
              {/* Role badges */}
              {isFunder && (
                <span className="badge badge-warning badge-sm font-mono">
                  Funder
                </span>
              )}
              {isRecipient && (
                <span className="badge badge-info badge-sm font-mono">
                  Recipient
                </span>
              )}
              <p
                className="font-mono text-xs text-base-content/50 mt-0.5"
                title={scheduleAddress}
              >
                {truncateAddress(scheduleAddress)}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setExpanded(!expanded)}
            className="btn btn-ghost btn-xs font-mono text-xs"
          >
            {expanded ? "Less" : "Details"}
          </button>
          {(() => {
            const normFunder = (planFunder || "")
              .toLowerCase()
              .replace(/^0x0+/, "0x");
            const normWallet = (walletAddress || "")
              .toLowerCase()
              .replace(/^0x0+/, "0x");
            if (normFunder !== normWallet) return null;
            return (
              <button
                className={`btn btn-error btn-sm font-mono text-xs ${
                  isClosing ? "loading loading-spinner loading-sm" : ""
                }`}
                onClick={() => setShowCloseConfirm(true)}
                disabled={isClosing || statusNum !== 0}
              >
                {isClosing ? "Closing…" : "Close"}
              </button>
            );
          })()}
          <button
            className={`btn btn-primary btn-sm font-mono text-xs ${
              isClaiming ? "loading loading-spinner loading-sm" : ""
            }`}
            onClick={() => {
              claim(scheduleAddress, planRecipient, planFunder, planId);
            }}
            disabled={isClaiming || statusNum !== 0}
          >
            {isClaiming ? "Claiming…" : "Claim"}
          </button>
        </div>
      </div>

      {/* Amount summary */}
      <div className="mt-4 flex items-center gap-6">
        <div>
          <p className="text-xs text-base-content/40 font-mono">Total</p>
          <p className="font-mono text-sm font-semibold">{totalAmount} STRK</p>
        </div>
        <div>
          <p className="text-xs text-base-content/40 font-mono">Claimed</p>
          <p className="font-mono text-sm font-semibold text-secondary">
            {claimedAmount} STRK
          </p>
        </div>
        <div>
          <p className="text-xs text-base-content/40 font-mono">Available</p>
          <p className="font-mono text-sm font-semibold text-accent">
            {availableAmount} STRK
          </p>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="mt-4 pt-4 border-t border-base-300/50 space-y-3">
          {/* Curve & Created row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] text-base-content/40 font-mono uppercase tracking-wider mb-1">
                Curve
              </p>
              <p className="font-mono text-sm">
                {CURVE_NAMES[planCurveKey] || planCurveKey}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-base-content/40 font-mono uppercase tracking-wider mb-1">
                Created
              </p>
              <p className="font-mono text-sm">{formatDate(planCreatedAt)}</p>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-base-300/30" />

          {/* Addresses */}
          <div className="space-y-2">
            {/* Recipient */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] text-base-content/40 font-mono uppercase tracking-wider">
                Recipient
              </span>
              <div className="flex items-center gap-1">
                <span
                  className="font-mono text-xs text-base-content/70"
                  title={planRecipient}
                >
                  {truncateAddress(planRecipient)}
                </span>
                <CopyButton value={planRecipient} />
              </div>
            </div>

            {/* Funder */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] text-base-content/40 font-mono uppercase tracking-wider">
                Funder
              </span>
              <div className="flex items-center gap-1">
                <span
                  className="font-mono text-xs text-base-content/70"
                  title={planFunder}
                >
                  {truncateAddress(planFunder)}
                </span>
                <CopyButton value={planFunder} />
              </div>
            </div>

            {/* Token */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] text-base-content/40 font-mono uppercase tracking-wider">
                Token
              </span>
              <div className="flex items-center gap-1">
                <span
                  className="font-mono text-xs text-base-content/70"
                  title={planTokenAddress}
                >
                  {truncateAddress(planTokenAddress)}
                </span>
                <CopyButton value={planTokenAddress} />
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={showCloseConfirm}
        title="Close Plan"
        message="Close this schedule and refund remaining tokens?"
        confirmText="Close"
        cancelText="Cancel"
        variant="danger"
        onConfirm={() => {
          setShowCloseConfirm(false);
          close(scheduleAddress, planFunder, planId);
          onClaimSuccess?.();
        }}
        onCancel={() => setShowCloseConfirm(false)}
      />
    </div>
  );
}
