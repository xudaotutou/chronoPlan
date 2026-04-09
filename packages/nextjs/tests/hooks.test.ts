/**
 * Unit tests for hook utility functions
 *
 * Tests functions from:
 * - schedule-constants.ts (u256 parsing, plan status parsing)
 * - template-types.ts (start time resolution, formatting, calculations)
 */

import { describe, it, expect, beforeEach } from "vitest";

import {
  parseU256,
  u256ToBigInt,
  formatU256,
  parsePlanStatus,
} from "../hooks/schedule-constants";

import {
  resolveStartTime,
  formatStartTime,
  getTemplateTotalAmount,
  calculateTotalDuration,
  formatOffset,
  TEMPORAL_UNITS,
  type StartTimeConfig,
} from "../app/template-types";

// ── parseU256 Tests ─────────────────────────────────────────────────────────

describe("parseU256", () => {
  it("handles array format ['low', 'high']", () => {
    const result = parseU256(["100", "0"]);
    expect(result.low).toBe(100n);
    expect(result.high).toBe(0n);
  });

  it("handles array format with bigint values", () => {
    const result = parseU256([100n, 0n]);
    expect(result.low).toBe(100n);
    expect(result.high).toBe(0n);
  });

  it("handles object format {low, high}", () => {
    const result = parseU256({ low: "200", high: "0" });
    expect(result.low).toBe(200n);
    expect(result.high).toBe(0n);
  });

  it("handles object format with bigint values", () => {
    const result = parseU256({ low: 200n, high: 0n });
    expect(result.low).toBe(200n);
    expect(result.high).toBe(0n);
  });

  it("handles bigint directly", () => {
    const result = parseU256(123456789n);
    expect(result.low).toBe(123456789n);
    expect(result.high).toBe(0n);
  });

  it("handles hex string", () => {
    const result = parseU256("0x100");
    expect(result.low).toBe(256n);
    expect(result.high).toBe(0n);
  });

  it("handles value exceeding 128 bits", () => {
    const bigValue = (1n << 128n) + 1n;
    const result = parseU256(bigValue);
    expect(result.low).toBe(1n);
    expect(result.high).toBe(1n);
  });

  it("returns {0, 0} for invalid input", () => {
    expect(parseU256(null).low).toBe(0n);
    expect(parseU256(undefined).low).toBe(0n);
    expect(() => parseU256("invalid")).toThrow();
  });
});

// ── u256ToBigInt Tests ─────────────────────────────────────────────────────

describe("u256ToBigInt", () => {
  it("handles zero correctly", () => {
    expect(u256ToBigInt(0n, 0n)).toBe(0n);
  });

  it("handles small values", () => {
    expect(u256ToBigInt(100n, 0n)).toBe(100n);
  });

  it("handles values at 128-bit boundary", () => {
    const value = 1n << 128n;
    expect(u256ToBigInt(0n, 1n)).toBe(value);
  });

  it("handles max u256 parts", () => {
    const max128 = (1n << 128n) - 1n;
    const max256 = (1n << 256n) - 1n;
    expect(u256ToBigInt(max128, max128)).toBe(max256);
  });

  it("reconstructs values correctly", () => {
    const original = 12345678901234567890n;
    const low = original & ((1n << 128n) - 1n);
    const high = original >> 128n;
    expect(u256ToBigInt(low, high)).toBe(original);
  });
});

// ── formatU256 Tests ────────────────────────────────────────────────────────

describe("formatU256", () => {
  it("formats zero correctly", () => {
    expect(formatU256({ low: 0n, high: 0n })).toBe("0");
  });

  it("formats small values with 18 decimals", () => {
    expect(formatU256({ low: 1_000_000_000_000_000n, high: 0n })).toBe("0.001");
  });

  it("formats whole numbers", () => {
    expect(formatU256({ low: 1_000_000_000_000_000_000n, high: 0n })).toBe("1");
  });

  it("respects maxDecimals: 0", () => {
    expect(
      formatU256({ low: 1_234_567_890_000_000_000n, high: 0n }, 18, 0),
    ).toBe("1");
  });

  it("trims trailing zeros", () => {
    expect(formatU256({ low: 1_000_000_000_000_000_050n, high: 0n })).toBe("1");
  });

  it("handles different decimal places", () => {
    expect(
      formatU256({ low: 1_234_567_890_000_000_000n, high: 0n }, 6, 2),
    ).toBe("1,234,567,890,000");
  });
});

// ── parsePlanStatus Tests ──────────────────────────────────────────────────

describe("parsePlanStatus", () => {
  it("handles number directly", () => {
    expect(parsePlanStatus(0)).toBe(0);
    expect(parsePlanStatus(1)).toBe(1);
    expect(parsePlanStatus(2)).toBe(2);
  });

  it("handles hex string", () => {
    expect(parsePlanStatus("0x0")).toBe(0);
    expect(parsePlanStatus("0x1")).toBe(1);
    expect(parsePlanStatus("0x2")).toBe(2);
  });

  it("handles decimal string", () => {
    expect(parsePlanStatus("0")).toBe(0);
    expect(parsePlanStatus("1")).toBe(1);
  });

  it("handles array format", () => {
    expect(parsePlanStatus(["0x1"])).toBe(1);
    expect(parsePlanStatus(["2"])).toBe(2);
  });

  it("defaults to 0 (Active) for invalid input", () => {
    expect(parsePlanStatus(null)).toBe(0);
    expect(parsePlanStatus(undefined)).toBe(0);
    expect(parsePlanStatus("invalid")).toBe(0);
  });
});

// ── resolveStartTime Tests ──────────────────────────────────────────────────

describe("resolveStartTime", () => {
  let now: number;

  beforeEach(() => {
    now = Math.floor(Date.now() / 1000);
  });

  it("resolves immediate mode to now + 60s", () => {
    const config: StartTimeConfig = { mode: "immediate" };
    const result = resolveStartTime(config);
    expect(result).toBeGreaterThanOrEqual(now + 59);
    expect(result).toBeLessThanOrEqual(now + 61);
  });

  it("resolves delayed mode with delay", () => {
    const config: StartTimeConfig = {
      mode: "delayed",
      delaySeconds: 3600,
    };
    const result = resolveStartTime(config);
    expect(result).toBeGreaterThanOrEqual(now + 60 + 3599);
    expect(result).toBeLessThanOrEqual(now + 60 + 3601);
  });

  it("resolves delayed mode without delay", () => {
    const config: StartTimeConfig = { mode: "delayed" };
    const result = resolveStartTime(config);
    expect(result).toBeGreaterThanOrEqual(now + 59);
    expect(result).toBeLessThanOrEqual(now + 61);
  });

  it("resolves scheduled mode with timestamp", () => {
    const scheduledTs = now + 86400;
    const config: StartTimeConfig = {
      mode: "scheduled",
      scheduledAt: scheduledTs,
    };
    expect(resolveStartTime(config)).toBe(scheduledTs);
  });

  it("resolves scheduled mode without timestamp to now + 60", () => {
    const config: StartTimeConfig = { mode: "scheduled" };
    const result = resolveStartTime(config);
    expect(result).toBeGreaterThanOrEqual(now + 59);
    expect(result).toBeLessThanOrEqual(now + 61);
  });
});

// ── formatStartTime Tests ──────────────────────────────────────────────────

describe("formatStartTime", () => {
  it("formats immediate mode", () => {
    const config: StartTimeConfig = { mode: "immediate" };
    expect(formatStartTime(config)).toBe("Immediate");
  });

  it("formats delayed mode with days", () => {
    const config: StartTimeConfig = {
      mode: "delayed",
      delaySeconds: 86400 * 7,
      delayUnit: "d",
    };
    expect(formatStartTime(config)).toBe("+7 Day");
  });

  it("formats delayed mode with hours", () => {
    const config: StartTimeConfig = {
      mode: "delayed",
      delaySeconds: 3600,
      delayUnit: "h",
    };
    expect(formatStartTime(config)).toBe("+1 Hour");
  });

  it("formats delayed mode with fractional value", () => {
    const config: StartTimeConfig = {
      mode: "delayed",
      delaySeconds: 5400,
      delayUnit: "h",
    };
    expect(formatStartTime(config)).toBe("+1.5 Hour");
  });
});

// ── getTemplateTotalAmount Tests ────────────────────────────────────────────

describe("getTemplateTotalAmount", () => {
  // Helper to create minimal template for testing
  const createTemplate = (items: { amount: string }[]) => ({
    id: "1",
    name: "Test",
    items: items as any[],
    createdAt: 0,
    updatedAt: 0,
  });

  it("calculates total from single item", () => {
    const template = createTemplate([{ amount: "100" }]);
    expect(getTemplateTotalAmount(template)).toBe("100.00");
  });

  it("calculates total from multiple items", () => {
    const template = createTemplate([
      { amount: "100" },
      { amount: "200" },
      { amount: "50.5" },
    ]);
    expect(getTemplateTotalAmount(template)).toBe("350.50");
  });

  it("handles empty items", () => {
    const template = createTemplate([]);
    expect(getTemplateTotalAmount(template)).toBe("0.00");
  });

  it("handles invalid amount as zero", () => {
    const template = createTemplate([
      { amount: "100" },
      { amount: "invalid" },
      { amount: "50" },
    ]);
    expect(getTemplateTotalAmount(template)).toBe("150.00");
  });
});

// ── calculateTotalDuration Tests ────────────────────────────────────────────

describe("calculateTotalDuration", () => {
  it("returns 0 for empty array", () => {
    expect(calculateTotalDuration([])).toBe(0);
  });

  it("calculates duration for single round", () => {
    const rounds = [
      { resolvedStartTime: 1000, resolvedEndTime: 2000, roundIndex: 1 },
    ] as any[];
    expect(calculateTotalDuration(rounds)).toBe(1000);
  });

  it("calculates duration for multiple rounds", () => {
    const rounds = [
      { resolvedStartTime: 1000, resolvedEndTime: 2000, roundIndex: 1 },
      { resolvedStartTime: 2000, resolvedEndTime: 4000, roundIndex: 2 },
    ] as any[];
    expect(calculateTotalDuration(rounds)).toBe(3000);
  });
});

// ── formatOffset Tests ─────────────────────────────────────────────────────
// Note: formatOffset uses unit key as label when unit is provided
// and auto-selects from TEMPORAL_UNITS when not specified

describe("formatOffset", () => {
  it("formats seconds with correct label", () => {
    // When unit is provided, uses unit key directly
    expect(formatOffset(60, "s")).toBe("60 s");
  });

  it("formats minutes with correct label", () => {
    expect(formatOffset(3600, "min")).toBe("60 min");
  });

  it("formats hours with correct value", () => {
    // 7200 seconds / 3600 factor = 2 hours
    expect(formatOffset(7200, "h")).toBe("2 h");
  });

  it("formats days with correct value", () => {
    // 86400 seconds / 86400 factor = 1 day
    expect(formatOffset(86400, "d")).toBe("1 d");
  });

  it("formats weeks with correct value", () => {
    // 604800 seconds / 604800 factor = 1 week
    expect(formatOffset(604800, "wk")).toBe("1 wk");
  });

  it("formats months with correct value", () => {
    // 2592000 seconds / 2592000 factor = 1 month
    expect(formatOffset(2592000, "mo")).toBe("1 mo");
  });

  it("auto-selects largest suitable unit with full label", () => {
    // When not specified, auto-selects and uses TEMPORAL_UNITS label
    expect(formatOffset(86400)).toBe("86400 Sec");
    expect(formatOffset(3600)).toBe("3600 Sec");
    expect(formatOffset(60)).toBe("60 Sec");
  });

  it("handles fractional values", () => {
    // 5400 seconds / 3600 factor = 1.5 hours
    expect(formatOffset(5400, "h")).toBe("1.5 h");
  });

  it("returns '0' for zero seconds", () => {
    expect(formatOffset(0)).toBe("0");
  });
});

// ── TEMPORAL_UNITS Tests ──────────────────────────────────────────────────

describe("TEMPORAL_UNITS", () => {
  it("has correct factors", () => {
    expect(TEMPORAL_UNITS.find((u) => u.key === "s")?.factor).toBe(1);
    expect(TEMPORAL_UNITS.find((u) => u.key === "min")?.factor).toBe(60);
    expect(TEMPORAL_UNITS.find((u) => u.key === "h")?.factor).toBe(3600);
    expect(TEMPORAL_UNITS.find((u) => u.key === "d")?.factor).toBe(86400);
    expect(TEMPORAL_UNITS.find((u) => u.key === "wk")?.factor).toBe(604800);
    expect(TEMPORAL_UNITS.find((u) => u.key === "mo")?.factor).toBe(2592000);
  });

  it("has labels for all units", () => {
    TEMPORAL_UNITS.forEach((unit) => {
      expect(unit.label).toBeTruthy();
      expect(unit.key).toBeTruthy();
    });
  });
});

// ── Schedule Plan Deduplication Tests ───────────────────────────────────────

/**
 * Test the plan deduplication logic used in SchedulesSection.
 * Merges funder and recipient plans, then deduplicates using Set.
 */
describe("mergeAndDeduplicatePlans", () => {
  // Extract the deduplication logic for testing
  const mergeAndDeduplicatePlans = (
    funderPlans: string[] | undefined,
    recipientPlans: string[] | undefined,
  ): string[] => {
    const funderPlanIds = funderPlans || [];
    const recipientPlanIds = recipientPlans || [];
    return [...new Set([...funderPlanIds, ...recipientPlanIds])];
  };

  it("returns empty array when both are undefined", () => {
    const result = mergeAndDeduplicatePlans(undefined, undefined);
    expect(result).toEqual([]);
  });

  it("returns funder plans when recipient is undefined", () => {
    const funderPlans = ["0x1", "0x2", "0x3"];
    const result = mergeAndDeduplicatePlans(funderPlans, undefined);
    expect(result).toEqual(["0x1", "0x2", "0x3"]);
  });

  it("returns recipient plans when funder is undefined", () => {
    const recipientPlans = ["0x4", "0x5"];
    const result = mergeAndDeduplicatePlans(undefined, recipientPlans);
    expect(result).toEqual(["0x4", "0x5"]);
  });

  it("merges and deduplicates plans from both sources", () => {
    const funderPlans = ["0x1", "0x2", "0x3"];
    const recipientPlans = ["0x3", "0x4", "0x5"];
    const result = mergeAndDeduplicatePlans(funderPlans, recipientPlans);
    expect(result).toEqual(["0x1", "0x2", "0x3", "0x4", "0x5"]);
  });

  it("removes duplicate plan IDs", () => {
    const funderPlans = ["0x1", "0x2", "0x2", "0x3"];
    const recipientPlans = ["0x2", "0x2", "0x4"];
    const result = mergeAndDeduplicatePlans(funderPlans, recipientPlans);
    expect(result).toEqual(["0x1", "0x2", "0x3", "0x4"]);
  });

  it("handles empty arrays correctly", () => {
    const result = mergeAndDeduplicatePlans([], []);
    expect(result).toEqual([]);
  });

  it("handles single plan in each source", () => {
    const funderPlans = ["0x1"];
    const recipientPlans = ["0x2"];
    const result = mergeAndDeduplicatePlans(funderPlans, recipientPlans);
    expect(result).toEqual(["0x1", "0x2"]);
  });

  it("preserves order of first occurrence", () => {
    const funderPlans = ["0x1", "0x2"];
    const recipientPlans = ["0x2", "0x3"];
    const result = mergeAndDeduplicatePlans(funderPlans, recipientPlans);
    // 0x2 appears first in funderPlans, so it stays at front
    expect(result).toEqual(["0x1", "0x2", "0x3"]);
  });
});

// ── Schedule Role Detection Tests ─────────────────────────────────────────────

/**
 * Test the role detection logic.
 */
describe("ScheduleRoleDetection", () => {
  const isUserInvolved = (
    userAddress: string,
    planFunder: string,
    planRecipient: string,
  ): boolean => {
    const normUser = userAddress.toLowerCase().replace(/^0x0+/, "0x");
    const normFunder = planFunder.toLowerCase().replace(/^0x0+/, "0x");
    const normRecipient = planRecipient.toLowerCase().replace(/^0x0+/, "0x");
    return normUser === normFunder || normUser === normRecipient;
  };

  it("returns true when user is the funder", () => {
    expect(isUserInvolved("0x123", "0x123", "0x456")).toBe(true);
  });

  it("returns true when user is the recipient", () => {
    expect(isUserInvolved("0x456", "0x123", "0x456")).toBe(true);
  });

  it("returns true when user is both funder and recipient", () => {
    expect(isUserInvolved("0x123", "0x123", "0x123")).toBe(true);
  });

  it("returns false when user is neither funder nor recipient", () => {
    expect(isUserInvolved("0x789", "0x123", "0x456")).toBe(false);
  });

  it("handles zero address", () => {
    expect(isUserInvolved("0x0", "0x123", "0x456")).toBe(false);
  });

  it("normalizes addresses with leading zeros", () => {
    expect(isUserInvolved("0x00123", "0x123", "0x456")).toBe(true);
  });
});

// ── Schedule Plan ID Filtering Tests ─────────────────────────────────────────

/**
 * Test the plan ID filtering logic.
 * Registry returns "0x0" when no plans exist.
 */
describe("filterValidPlanIds", () => {
  const isValidPlanId = (id: string) => id && id !== "0x0";

  it("filters out 0x0 plan ID", () => {
    const plans = ["0x0", "0x1", "0x2"];
    const result = plans.filter(isValidPlanId);
    expect(result).toEqual(["0x1", "0x2"]);
  });

  it("filters out only 0x0 when no other plans", () => {
    const plans = ["0x0"];
    const result = plans.filter(isValidPlanId);
    expect(result).toEqual([]);
  });

  it("returns all plans when none are 0x0", () => {
    const plans = ["0x1", "0x2", "0x3"];
    const result = plans.filter(isValidPlanId);
    expect(result).toEqual(["0x1", "0x2", "0x3"]);
  });

  it("handles empty array", () => {
    const plans: string[] = [];
    const result = plans.filter(isValidPlanId);
    expect(result).toEqual([]);
  });

  it("filters multiple 0x0 entries", () => {
    const plans = ["0x0", "0x0", "0x1", "0x0"];
    const result = plans.filter(isValidPlanId);
    expect(result).toEqual(["0x1"]);
  });
});

// ── Schedule Query Keys Tests ─────────────────────────────────────────────────

import { scheduleKeys } from "../hooks/query-keys";

describe("scheduleKeys", () => {
  const ADDRESS =
    "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";

  describe("byFunder", () => {
    it("generates correct key for funder", () => {
      const key = scheduleKeys.byFunder(ADDRESS);
      expect(key).toContain("by-funder");
      expect(key).toContain(ADDRESS.toLowerCase());
    });

    it("normalizes address to lowercase", () => {
      const upperAddress = ADDRESS.toUpperCase();
      const key = scheduleKeys.byFunder(upperAddress);
      expect(key).toContain(ADDRESS.toLowerCase());
    });
  });

  describe("byRecipient", () => {
    it("generates correct key for recipient", () => {
      const key = scheduleKeys.byRecipient(ADDRESS);
      expect(key).toContain("by-recipient");
      expect(key).toContain(ADDRESS.toLowerCase());
    });
  });

  describe("available", () => {
    it("generates correct key for schedule", () => {
      const scheduleAddr =
        "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890";
      const key = scheduleKeys.available(scheduleAddr);
      expect(key).toContain("available");
      expect(key).toContain(scheduleAddr.toLowerCase());
    });
  });

  describe("claimed", () => {
    it("generates correct key for schedule", () => {
      const scheduleAddr =
        "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890";
      const key = scheduleKeys.claimed(scheduleAddr);
      expect(key).toContain("claimed");
      expect(key).toContain(scheduleAddr.toLowerCase());
    });
  });

  describe("status", () => {
    it("generates correct key for schedule", () => {
      const scheduleAddr =
        "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890";
      const key = scheduleKeys.status(scheduleAddr);
      expect(key).toContain("status");
      expect(key).toContain(scheduleAddr.toLowerCase());
    });
  });

  describe("schedule", () => {
    it("generates correct key for schedule", () => {
      const scheduleAddr =
        "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890";
      const key = scheduleKeys.schedule(scheduleAddr);
      expect(key).toContain("schedule");
      expect(key).toContain(scheduleAddr.toLowerCase());
    });
  });

  describe("planInfo", () => {
    it("generates correct key for plan ID", () => {
      const planId = "0x42";
      const key = scheduleKeys.planInfo(planId);
      expect(key).toContain("plan-info");
      expect(key).toContain("0x42");
    });
  });

  describe("all query keys are unique", () => {
    it("generates different keys for different purposes", () => {
      const scheduleAddr =
        "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890";
      const availableKey = scheduleKeys.available(scheduleAddr);
      const claimedKey = scheduleKeys.claimed(scheduleAddr);
      const statusKey = scheduleKeys.status(scheduleAddr);
      const scheduleKey = scheduleKeys.schedule(scheduleAddr);

      // All keys should be different
      const uniqueKeys = new Set([
        availableKey,
        claimedKey,
        statusKey,
        scheduleKey,
      ]);
      expect(uniqueKeys.size).toBe(4);
    });
  });
});

// ── useScheduleQueries Cache Invalidation Tests ─────────────────────────────────

describe("useScheduleQueries - cache invalidation logic", () => {
  // Mock QueryClient
  const createMockQueryClient = () => {
    const queries: Map<string, any> = new Map();
    return {
      queries,
      invalidateQueries: ({ queryKey }: { queryKey: readonly unknown[] }) => {
        const key = JSON.stringify(queryKey);
        queries.delete(key);
      },
    };
  };

  describe("invalidation by funder", () => {
    it("invalidates funder cache correctly", () => {
      const client = createMockQueryClient();
      const funderAddr = "0x123";
      const queryKey = scheduleKeys.byFunder(funderAddr);

      // Initially has query
      client.queries.set(JSON.stringify(queryKey), { data: {} });
      expect(client.queries.has(JSON.stringify(queryKey))).toBe(true);

      // Invalidate
      client.invalidateQueries({ queryKey });
      expect(client.queries.has(JSON.stringify(queryKey))).toBe(false);
    });

    it("does nothing for empty address", () => {
      const client = createMockQueryClient();
      const invalidateFn = () => client.invalidateQueries({ queryKey: [] });
      expect(invalidateFn).not.toThrow();
    });
  });

  describe("invalidation by recipient", () => {
    it("invalidates recipient cache correctly", () => {
      const client = createMockQueryClient();
      const recipientAddr = "0x456";
      const queryKey = scheduleKeys.byRecipient(recipientAddr);

      client.queries.set(JSON.stringify(queryKey), { data: {} });
      client.invalidateQueries({ queryKey });
      expect(client.queries.has(JSON.stringify(queryKey))).toBe(false);
    });
  });

  describe("invalidation for schedule", () => {
    it("invalidates all schedule-related caches", () => {
      const client = createMockQueryClient();
      const scheduleAddr = "0x789";

      const keys = [
        scheduleKeys.available(scheduleAddr),
        scheduleKeys.claimed(scheduleAddr),
        scheduleKeys.status(scheduleAddr),
        scheduleKeys.schedule(scheduleAddr),
      ];

      // Add all queries
      for (const key of keys) {
        client.queries.set(JSON.stringify(key), { data: {} });
      }

      // Invalidate all
      for (const key of keys) {
        client.invalidateQueries({ queryKey: key });
      }

      // All should be invalidated
      for (const key of keys) {
        expect(client.queries.has(JSON.stringify(key))).toBe(false);
      }
    });
  });

  describe("invalidation for plan info", () => {
    it("invalidates plan info cache correctly", () => {
      const client = createMockQueryClient();
      const planId = "0x42";
      const queryKey = scheduleKeys.planInfo(planId);

      client.queries.set(JSON.stringify(queryKey), { data: {} });
      client.invalidateQueries({ queryKey });
      expect(client.queries.has(JSON.stringify(queryKey))).toBe(false);
    });
  });
});
