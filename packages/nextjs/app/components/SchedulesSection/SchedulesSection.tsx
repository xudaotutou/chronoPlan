"use client";

import { useState, useCallback, useEffect } from "react";
import { useContractCall } from "~~/hooks/useStarkZap";
import { REGISTRY_ADDRESS, REGISTRY_ABI } from "~~/hooks/schedule-constants";
import { scheduleKeys } from "~~/hooks/query-keys";
import { ScheduleCard } from "./ScheduleCard";

export function SchedulesSection({
  isConnected,
  address,
}: {
  isConnected: boolean;
  address: string | null;
}) {
  // Query plans where user is the funder
  const { data: funderPlans, refetch: refetchFunder } = useContractCall(
    REGISTRY_ADDRESS,
    REGISTRY_ABI,
    "get_plans_by_funder",
    [address || "0x0"],
    {
      enabled: !!address && !!REGISTRY_ADDRESS,
      queryKey: scheduleKeys.byFunder(address || ""),
    },
  );

  // Query plans where user is the recipient
  const { data: recipientPlans, refetch: refetchRecipient } = useContractCall(
    REGISTRY_ADDRESS,
    REGISTRY_ABI,
    "get_plans_by_recipient",
    [address || "0x0"],
    {
      enabled: !!address && !!REGISTRY_ADDRESS,
      queryKey: scheduleKeys.byRecipient(address || ""),
    },
  );

  // Merge and deduplicate plans from both queries
  const funderPlanIds = (funderPlans as string[] | undefined) || [];
  const recipientPlanIds = (recipientPlans as string[] | undefined) || [];

  // Filter out invalid plan IDs (Registry returns 0 when no plans exist)
  // Handle various zero formats: "0", "0x0", "0x00", "0x", etc.
  const isValidPlanId = (id: string) => {
    if (!id) return false;
    try {
      const valid = BigInt(id) !== 0n;
      console.log("[isValidPlanId]", {
        id,
        BigInt: BigInt(id).toString(),
        valid,
      });
      return valid;
    } catch (e) {
      return false;
    }
  };

  // Use Set to deduplicate
  const allPlanIds = [
    ...new Set([...funderPlanIds, ...recipientPlanIds]),
  ].filter(isValidPlanId);

  // Track which plans came from which source
  const funderSet = new Set(funderPlanIds.filter(isValidPlanId));
  const recipientSet = new Set(recipientPlanIds.filter(isValidPlanId));

  // Track valid schedules (those with valid scheduleAddress)
  const [validCount, setValidCount] = useState(0);
  const [validFunderCount, setValidFunderCount] = useState(0);
  const [validRecipientCount, setValidRecipientCount] = useState(0);

  // Callback from ScheduleCard to report valid schedule
  const handleValidSchedule = useCallback((planId: string) => {
    setValidCount((prev) => prev + 1);
  }, []);

  // Callback from ScheduleCard to report valid role
  const handleValidRole = useCallback(
    (planId: string, isFunder: boolean, isRecipient: boolean) => {
      if (isFunder) {
        setValidFunderCount((prev) => prev + 1);
      }
      if (isRecipient) {
        setValidRecipientCount((prev) => prev + 1);
      }
    },
    [],
  );

  // Reset counts when address changes
  useEffect(() => {
    setValidCount(0);
    setValidFunderCount(0);
    setValidRecipientCount(0);
  }, [address]);

  const refetch = () => {
    refetchFunder();
    refetchRecipient();
    setValidCount(0);
    setValidFunderCount(0);
    setValidRecipientCount(0);
  };

  if (!isConnected || !address) return <LockedCard label="Wallet required" />;

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-2xl">My Plans</h2>
          <p className="text-xs font-mono text-base-content/40 mt-1">
            {validCount} plan{validCount !== 1 ? "s" : ""} found
            {validFunderCount > 0 && ` (${validFunderCount} as funder)`}
            {validRecipientCount > 0 &&
              ` (${validRecipientCount} as recipient)`}
          </p>
        </div>
        <button
          className="btn btn-ghost btn-sm font-mono text-xs"
          onClick={() => refetch()}
        >
          ↻ Refresh
        </button>
      </div>

      {allPlanIds.length === 0 ? (
        <EmptyState
          icon="◈"
          title="No plans yet"
          desc="Create your first plan to start vesting"
        />
      ) : (
        <div className="space-y-3">
          {allPlanIds.map((planId, index) => (
            <ScheduleCard
              key={planId}
              planId={planId}
              index={index}
              userAddress={address}
              isFunder={funderSet.has(planId)}
              isRecipient={recipientSet.has(planId)}
              onValidSchedule={handleValidSchedule}
              onValidRole={handleValidRole}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function LockedCard({ label }: { label: string }) {
  return (
    <div className="card-instrument p-8 animate-fade-up">
      <div className="card-body items-center text-center py-16">
        <div className="w-16 h-16 rounded-2xl bg-base-300/50 border border-base-300 flex items-center justify-center mb-6">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8 text-base-content/30"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>
        <h3 className="font-display font-bold text-lg mb-2">{label}</h3>
        <p className="text-sm text-base-content/40 font-mono">
          Connect your wallet to continue
        </p>
      </div>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  desc,
  cta,
  onCtaClick,
}: {
  icon: string;
  title: string;
  desc: string;
  cta?: string;
  onCtaClick?: () => void;
}) {
  return (
    <div className="card-instrument p-8">
      <div className="card-body items-center text-center py-16">
        <div className="text-5xl text-primary/30 mb-4">{icon}</div>
        <h3 className="font-display font-bold text-base mb-2">{title}</h3>
        <p className="text-sm text-base-content/40 font-mono mb-4">{desc}</p>
        {cta && onCtaClick && (
          <button
            onClick={onCtaClick}
            className="btn btn-primary btn-sm font-mono"
          >
            {cta}
          </button>
        )}
      </div>
    </div>
  );
}
