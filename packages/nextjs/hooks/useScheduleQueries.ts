/**
 * Schedule Queries Hook
 *
 * Centralized TanStack Query cache management for schedule-related queries.
 * Use the query keys from '~~/hooks/query-keys' to build queries.
 * Call invalidation functions after mutations to refresh the UI.
 */

import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { scheduleKeys, tokenKeys } from "./query-keys";

// Re-export query keys for convenience
export { scheduleKeys } from "./query-keys";

// ============================================================================
// Cache Invalidation Hook
// ============================================================================

/**
 * Hook to invalidate schedule-related query caches.
 * Call these functions after successful mutations to refresh the UI.
 */
export function useInvalidateSchedules() {
  const queryClient = useQueryClient();

  /** Invalidate all schedule queries for a funder */
  const invalidateByFunder = useCallback(
    (funderAddress: string) => {
      if (!funderAddress) return;
      console.log("[Cache] Invalidating byFunder:", funderAddress);
      queryClient.invalidateQueries({
        queryKey: scheduleKeys.byFunder(funderAddress),
      });
    },
    [queryClient],
  );

  /** Invalidate all schedule queries for a recipient */
  const invalidateByRecipient = useCallback(
    (recipientAddress: string) => {
      if (!recipientAddress) return;
      console.log("[Cache] Invalidating byRecipient:", recipientAddress);
      queryClient.invalidateQueries({
        queryKey: scheduleKeys.byRecipient(recipientAddress),
      });
    },
    [queryClient],
  );

  /** Invalidate all queries for a specific schedule contract */
  const invalidateSchedule = useCallback(
    (scheduleAddress: string) => {
      if (!scheduleAddress) return;
      console.log("[Cache] Invalidating schedule:", scheduleAddress);
      queryClient.invalidateQueries({
        queryKey: scheduleKeys.available(scheduleAddress),
      });
      queryClient.invalidateQueries({
        queryKey: scheduleKeys.claimed(scheduleAddress),
      });
      queryClient.invalidateQueries({
        queryKey: scheduleKeys.status(scheduleAddress),
      });
      queryClient.invalidateQueries({
        queryKey: scheduleKeys.schedule(scheduleAddress),
      });
    },
    [queryClient],
  );

  /** Invalidate a specific plan info query from the Registry */
  const invalidatePlanInfo = useCallback(
    (planId: string) => {
      if (!planId) return;
      console.log("[Cache] Invalidating planInfo:", planId);
      queryClient.invalidateQueries({
        queryKey: scheduleKeys.planInfo(planId),
      });
    },
    [queryClient],
  );

  /** Invalidate token balance for a specific address */
  const invalidateTokenBalance = useCallback(
    (address: string) => {
      if (!address) return;
      console.log("[Cache] Invalidating token balance:", address);
      queryClient.invalidateQueries({
        queryKey: tokenKeys.balance("STRK", address),
      });
    },
    [queryClient],
  );

  return {
    invalidateByFunder,
    invalidateByRecipient,
    invalidateSchedule,
    invalidatePlanInfo,
    invalidateTokenBalance,
  };
}

// Convenience Hooks
// ============================================================================

/**
 * Invalidation functions for specific operations.
 */
export function useScheduleCacheActions() {
  const {
    invalidateByFunder,
    invalidateByRecipient,
    invalidateSchedule,
    invalidatePlanInfo,
    invalidateTokenBalance,
  } = useInvalidateSchedules();

  /** Call after successful deploy_schedule transaction */
  const onDeploySuccess = useCallback(
    (funderAddress: string) => {
      console.log("[Cache] onDeploySuccess:", funderAddress);
      invalidateByFunder(funderAddress);
    },
    [invalidateByFunder],
  );

  /** Call after successful claim transaction */
  const onClaimSuccess = useCallback(
    (
      scheduleAddress: string,
      recipientAddress: string,
      funderAddress: string | undefined,
      planId: string,
    ) => {
      console.log("[Cache] onClaimSuccess:", {
        scheduleAddress,
        recipientAddress,
        funderAddress,
        planId,
      });
      invalidateSchedule(scheduleAddress);
      invalidatePlanInfo(planId);
      invalidateByRecipient(recipientAddress);
      // Also invalidate funder's cache since plan list shows all plans
      if (funderAddress) {
        invalidateByFunder(funderAddress);
        invalidateTokenBalance(funderAddress);
      }
      invalidateTokenBalance(recipientAddress);
    },
    [
      invalidateSchedule,
      invalidatePlanInfo,
      invalidateByRecipient,
      invalidateByFunder,
      invalidateTokenBalance,
    ],
  );

  /** Call after successful close transaction */
  const onCloseSuccess = useCallback(
    (scheduleAddress: string, funderAddress: string, planId: string) => {
      console.log("[Cache] onCloseSuccess:", {
        scheduleAddress,
        funderAddress,
        planId,
      });
      invalidateSchedule(scheduleAddress);
      invalidatePlanInfo(planId);
      invalidateByFunder(funderAddress);
      invalidateTokenBalance(funderAddress);
    },
    [
      invalidateSchedule,
      invalidatePlanInfo,
      invalidateByFunder,
      invalidateTokenBalance,
    ],
  );

  return {
    onDeploySuccess,
    onClaimSuccess,
    onCloseSuccess,
    invalidateByFunder,
    invalidateByRecipient,
    invalidateSchedule,
    invalidatePlanInfo: useInvalidateSchedules().invalidatePlanInfo,
  };
}
