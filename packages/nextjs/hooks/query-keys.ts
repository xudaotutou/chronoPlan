/**
 * TanStack Query Cache Keys
 *
 * Centralized query key definitions for all schedule-related queries.
 * Use these keys with useQuery and invalidateQueries.
 */

import { REGISTRY_ADDRESS } from "./schedule-constants";

// ============================================================================
// Query Key Prefixes
// ============================================================================

const PREFIX = "schedule";

// ============================================================================
// Query Key Factory
// ============================================================================

export const scheduleKeys = {
  /** All schedules for a specific funder address */
  byFunder: (funderAddress: string) =>
    [PREFIX, "by-funder", funderAddress.toLowerCase()] as const,

  /** All schedules for a specific recipient address */
  byRecipient: (recipientAddress: string) =>
    [PREFIX, "by-recipient", recipientAddress.toLowerCase()] as const,

  /** Single schedule info from Registry */
  planInfo: (planId: string) =>
    [
      PREFIX,
      "registry",
      "plan-info",
      REGISTRY_ADDRESS.toLowerCase(),
      planId,
    ] as const,

  /** Schedule contract: available amount to claim */
  available: (scheduleAddress: string) =>
    [PREFIX, "available", scheduleAddress.toLowerCase()] as const,

  /** Schedule contract: claimed amount */
  claimed: (scheduleAddress: string) =>
    [PREFIX, "claimed", scheduleAddress.toLowerCase()] as const,

  /** Schedule contract: status */
  status: (scheduleAddress: string) =>
    [PREFIX, "status", scheduleAddress.toLowerCase()] as const,

  /** Schedule contract: full schedule data */
  schedule: (scheduleAddress: string) =>
    [PREFIX, "data", scheduleAddress.toLowerCase()] as const,
} as const;

// ============================================================================
// Token Balance Keys
// ============================================================================

const TOKEN_PREFIX = "token";

export const tokenKeys = {
  /** Token balance for a specific address and token */
  balance: (tokenSymbol: string, address: string | null | undefined) =>
    [
      TOKEN_PREFIX,
      "balance",
      tokenSymbol,
      address?.toLowerCase() ?? "",
    ] as const,
} as const;

// Type for query keys (useful for strict typing)
export type ScheduleQueryKey = ReturnType<
  (typeof scheduleKeys)[keyof typeof scheduleKeys]
>;
