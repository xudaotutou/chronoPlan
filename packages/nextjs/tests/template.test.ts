/**
 * Template system tests for ChronoPlan
 *
 * Covers:
 * - Type definitions and constants
 * - Storage helpers (loadTemplates, saveTemplates)
 * - Start time resolution and formatting
 * - Template creation helpers
 * - Aggregation functions
 * - Round resolution
 * - Formatting utilities
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  // Types
  type ScheduleTemplate,
  type ScheduleItem,
  type StartTimeConfig,
  type CurveType,
  type TemporalUnit,
  // Constants
  TEMPORAL_UNITS,
  PRESET_SCHEDULE_ITEMS,
  // Storage
  loadTemplates,
  saveTemplates,
  // Helpers
  resolveStartTime,
  formatStartTime,
  formatTimestamp,
  createSingleTemplate,
  createBatchTemplate,
  getTemplateTotalAmount,
  getTemplateCurve,
  // Batch
  resolveRoundTimes,
  calculateTotalAmount,
  calculateTotalDuration,
  formatRoundStartMode,
  formatOffset,
} from "../app/template-types";

// ─────────────────────────────────────────────────────────────────────────────
// Test Utilities
// ─────────────────────────────────────────────────────────────────────────────

/** Mock localStorage for SSR-safe testing */
const createLocalStorageMock = () => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: () => {
      store = {};
    },
    getStore: () => store,
  };
};

let mockStorage: ReturnType<typeof createLocalStorageMock>;

beforeEach(() => {
  mockStorage = createLocalStorageMock();
  vi.stubGlobal("localStorage", mockStorage);
  vi.stubGlobal("window", { localStorage: mockStorage });
});

afterEach(() => {
  vi.restoreAllMocks();
  mockStorage.clear();
});

// ─────────────────────────────────────────────────────────────────────────────
// Type Constants Tests
// ─────────────────────────────────────────────────────────────────────────────

describe("TEMPORAL_UNITS", () => {
  it("contains all expected temporal units", () => {
    const expectedUnits: TemporalUnit[] = ["s", "min", "h", "d", "wk", "mo"];
    expect(TEMPORAL_UNITS.map((u) => u.key)).toEqual(expectedUnits);
  });

  it("has correct factor calculations", () => {
    const find = (key: TemporalUnit) =>
      TEMPORAL_UNITS.find((u) => u.key === key)!;

    expect(find("s").factor).toBe(1);
    expect(find("min").factor).toBe(60);
    expect(find("h").factor).toBe(3600);
    expect(find("d").factor).toBe(86400);
    expect(find("wk").factor).toBe(604800);
    expect(find("mo").factor).toBe(2592000);
  });

  it("has human-readable labels", () => {
    const find = (key: TemporalUnit) =>
      TEMPORAL_UNITS.find((u) => u.key === key)!;

    expect(find("s").label).toBe("Sec");
    expect(find("min").label).toBe("Min");
    expect(find("h").label).toBe("Hour");
    expect(find("d").label).toBe("Day");
    expect(find("wk").label).toBe("Week");
    expect(find("mo").label).toBe("Month");
  });
});

describe("PRESET_SCHEDULE_ITEMS", () => {
  it("contains 4 preset items", () => {
    expect(PRESET_SCHEDULE_ITEMS).toHaveLength(4);
  });

  it("each preset has required fields", () => {
    for (const preset of PRESET_SCHEDULE_ITEMS) {
      expect(preset.tokenSymbol).toBeDefined();
      expect(preset.amount).toBeDefined();
      expect(preset.duration).toBeGreaterThan(0);
      expect(preset.durationUnit).toBeDefined();
      expect(preset.curve).toBeDefined();
      expect(preset.startTime).toBeDefined();
    }
  });

  it("each preset has valid curve type", () => {
    const validCurves: CurveType[] = ["linear", "cliff", "expdecay"];
    for (const preset of PRESET_SCHEDULE_ITEMS) {
      expect(validCurves).toContain(preset.curve);
    }
  });

  it("each preset has valid startTime mode", () => {
    const validModes = ["immediate", "delayed", "scheduled"];
    for (const preset of PRESET_SCHEDULE_ITEMS) {
      expect(validModes).toContain(preset.startTime.mode);
    }
  });

  it("has a linear immediate preset (Quick Vest)", () => {
    const quickVest = PRESET_SCHEDULE_ITEMS.find(
      (p) => p.curve === "linear" && p.startTime.mode === "immediate",
    );
    expect(quickVest).toBeDefined();
    expect(quickVest?.name).toBe("Quick Vest");
  });

  it("has a cliff delayed preset (Team Cliff)", () => {
    const teamCliff = PRESET_SCHEDULE_ITEMS.find(
      (p) => p.curve === "cliff" && p.startTime.mode === "delayed",
    );
    expect(teamCliff).toBeDefined();
    expect(teamCliff?.name).toBe("Team Cliff");
    expect(teamCliff?.startTime.delaySeconds).toBe(2592000); // 30 days
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Storage Tests
// ─────────────────────────────────────────────────────────────────────────────

describe("loadTemplates", () => {
  it("returns empty array when localStorage is empty", () => {
    expect(loadTemplates()).toEqual([]);
  });

  it("returns empty array when localStorage has null value", () => {
    mockStorage.getItem.mockReturnValueOnce(null);
    expect(loadTemplates()).toEqual([]);
  });

  it("returns empty array on invalid JSON", () => {
    mockStorage.getItem.mockReturnValueOnce("not valid json");
    expect(loadTemplates()).toEqual([]);
  });

  it("returns parsed value for non-array JSON", () => {
    mockStorage.getItem.mockReturnValueOnce('{"foo": "bar"}');
    const result = loadTemplates();
    // Implementation returns parsed JSON even if not array
    expect(result).toEqual({ foo: "bar" });
  });

  it("loads valid templates from localStorage", () => {
    const templates: ScheduleTemplate[] = [
      {
        id: "test-1",
        name: "Test Template",
        items: [
          {
            tokenSymbol: "STRK",
            amount: "100",
            duration: 30,
            durationUnit: "d",
            curve: "linear",
            startTime: { mode: "immediate" },
          },
        ],
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
      },
    ];
    mockStorage.getItem.mockReturnValueOnce(JSON.stringify(templates));

    const result = loadTemplates();
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("test-1");
    expect(result[0].name).toBe("Test Template");
  });

  it("migrates old format (single item) to new format (array of items)", () => {
    // Old format: template with properties directly on it
    const oldFormat = [
      {
        id: "old-1",
        name: "Old Template",
        recipient: "0x123",
        tokenSymbol: "STRK",
        amount: "100",
        duration: 30,
        durationUnit: "d",
        curve: "linear",
        startTime: { mode: "immediate" },
        createdAt: 1700000000000,
      },
    ];
    mockStorage.getItem.mockReturnValueOnce(JSON.stringify(oldFormat));

    const result = loadTemplates();
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("old-1");
    expect(result[0].items).toHaveLength(1);
    expect(result[0].items[0].recipient).toBe("0x123");
    expect(result[0].items[0].tokenSymbol).toBe("STRK");
  });

  it("handles server-side rendering (window undefined)", () => {
    vi.stubGlobal("window", undefined);
    expect(loadTemplates()).toEqual([]);
  });
});

describe("saveTemplates", () => {
  it("saves templates to localStorage", () => {
    const templates: ScheduleTemplate[] = [
      {
        id: "test-1",
        name: "Test",
        items: [
          {
            tokenSymbol: "STRK",
            amount: "100",
            duration: 30,
            durationUnit: "d",
            curve: "linear",
            startTime: { mode: "immediate" },
          },
        ],
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
      },
    ];

    saveTemplates(templates);

    expect(mockStorage.setItem).toHaveBeenCalledWith(
      "chronoplan_templates",
      JSON.stringify(templates),
    );
  });

  it("overwrites existing templates", () => {
    const original: ScheduleTemplate[] = [
      {
        id: "original",
        name: "Original",
        items: [
          {
            tokenSymbol: "STRK",
            amount: "100",
            duration: 30,
            durationUnit: "d",
            curve: "linear",
            startTime: { mode: "immediate" },
          },
        ],
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
      },
    ];
    const updated: ScheduleTemplate[] = [
      {
        id: "updated",
        name: "Updated",
        items: [
          {
            tokenSymbol: "ETH",
            amount: "50",
            duration: 90,
            durationUnit: "d",
            curve: "cliff",
            startTime: { mode: "immediate" },
          },
        ],
        createdAt: 1700000000000,
        updatedAt: 1700000000001,
      },
    ];

    saveTemplates(original);
    saveTemplates(updated);

    const stored = JSON.parse(mockStorage.getStore()["chronoplan_templates"]);
    expect(stored).toHaveLength(1);
    expect(stored[0].id).toBe("updated");
  });

  it("handles server-side rendering (window undefined)", () => {
    vi.stubGlobal("window", undefined);
    // Should not throw
    saveTemplates([]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Start Time Resolution Tests
// ─────────────────────────────────────────────────────────────────────────────

describe("resolveStartTime", () => {
  it("returns now + 60 for immediate mode", () => {
    const config: StartTimeConfig = { mode: "immediate" };
    const now = Math.floor(Date.now() / 1000);
    const result = resolveStartTime(config);

    // Allow 1 second tolerance for test execution time
    expect(result).toBeGreaterThanOrEqual(now + 59);
    expect(result).toBeLessThanOrEqual(now + 61);
  });

  it("adds delay seconds for delayed mode", () => {
    const config: StartTimeConfig = {
      mode: "delayed",
      delaySeconds: 3600, // 1 hour
    };
    const now = Math.floor(Date.now() / 1000);
    const result = resolveStartTime(config);

    expect(result).toBeGreaterThanOrEqual(now + 3660 - 1);
    expect(result).toBeLessThanOrEqual(now + 3660 + 1);
  });

  it("uses scheduled timestamp for scheduled mode", () => {
    const scheduledAt = 1700000000;
    const config: StartTimeConfig = {
      mode: "scheduled",
      scheduledAt,
    };
    const result = resolveStartTime(config);

    expect(result).toBe(scheduledAt);
  });

  it("defaults to now + 60 when scheduledAt is missing", () => {
    const config: StartTimeConfig = { mode: "scheduled" };
    const now = Math.floor(Date.now() / 1000);
    const result = resolveStartTime(config);

    expect(result).toBeGreaterThanOrEqual(now + 59);
    expect(result).toBeLessThanOrEqual(now + 61);
  });

  it("defaults to 0 delay when delaySeconds is missing", () => {
    const config: StartTimeConfig = { mode: "delayed" };
    const now = Math.floor(Date.now() / 1000);
    const result = resolveStartTime(config);

    // Should be now + 60 (buffer only, no delay)
    expect(result).toBeGreaterThanOrEqual(now + 59);
    expect(result).toBeLessThanOrEqual(now + 61);
  });
});

describe("formatStartTime", () => {
  it("returns 'Immediate' for immediate mode", () => {
    const config: StartTimeConfig = { mode: "immediate" };
    expect(formatStartTime(config)).toBe("Immediate");
  });

  it("formats delayed mode with unit", () => {
    const config: StartTimeConfig = {
      mode: "delayed",
      delaySeconds: 86400,
      delayUnit: "d",
    };
    expect(formatStartTime(config)).toBe("+1 Day");
  });

  it("handles decimal delay values", () => {
    const config: StartTimeConfig = {
      mode: "delayed",
      delaySeconds: 129600, // 1.5 days
      delayUnit: "d",
    };
    expect(formatStartTime(config)).toBe("+1.5 Day");
  });

  it("handles hours", () => {
    const config: StartTimeConfig = {
      mode: "delayed",
      delaySeconds: 7200, // 2 hours
      delayUnit: "h",
    };
    expect(formatStartTime(config)).toBe("+2 Hour");
  });

  it("formats scheduled mode with date", () => {
    // Use a future timestamp
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    const config: StartTimeConfig = {
      mode: "scheduled",
      scheduledAt: Math.floor(futureDate.getTime() / 1000),
    };
    const result = formatStartTime(config);
    // Should contain month or day
    expect(result.length).toBeGreaterThan(0);
  });

  it("returns 'Not scheduled' when scheduledAt is missing", () => {
    const config: StartTimeConfig = { mode: "scheduled" };
    expect(formatStartTime(config)).toBe("Not scheduled");
  });
});

describe("formatTimestamp", () => {
  it("formats timestamp as readable date/time", () => {
    const timestamp = 1700000000; // UTC: Nov 15, 2023 06:13:20
    const result = formatTimestamp(timestamp);

    expect(result).toContain("Nov");
    expect(result).toContain("15");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Template Creation Tests
// ─────────────────────────────────────────────────────────────────────────────

describe("createSingleTemplate", () => {
  it("creates template with single item", () => {
    const item: ScheduleItem = {
      tokenSymbol: "STRK",
      amount: "100",
      duration: 30,
      durationUnit: "d",
      curve: "linear",
      startTime: { mode: "immediate" },
    };

    const result = createSingleTemplate("My Template", item);

    expect(result.name).toBe("My Template");
    expect(result.items).toHaveLength(1);
    expect(result.items[0].name).toBe("My Template"); // Uses name as default
    expect(result.createdAt).toBeLessThanOrEqual(Date.now());
    expect(result.updatedAt).toBeGreaterThanOrEqual(result.createdAt - 1000);
  });

  it("preserves item name if provided", () => {
    const item: ScheduleItem = {
      name: "Custom Name",
      tokenSymbol: "STRK",
      amount: "100",
      duration: 30,
      durationUnit: "d",
      curve: "linear",
      startTime: { mode: "immediate" },
    };

    const result = createSingleTemplate("My Template", item);
    expect(result.items[0].name).toBe("Custom Name");
  });

  it("does not include id (caller should add)", () => {
    const item: ScheduleItem = {
      tokenSymbol: "STRK",
      amount: "100",
      duration: 30,
      durationUnit: "d",
      curve: "linear",
      startTime: { mode: "immediate" },
    };

    const result = createSingleTemplate("Test", item);
    expect(result.id).toBeUndefined();
  });
});

describe("createBatchTemplate", () => {
  it("creates template with multiple items", () => {
    const items: ScheduleItem[] = [
      {
        tokenSymbol: "STRK",
        amount: "100",
        duration: 30,
        durationUnit: "d",
        curve: "linear",
        startTime: { mode: "immediate" },
      },
      {
        tokenSymbol: "STRK",
        amount: "200",
        duration: 60,
        durationUnit: "d",
        curve: "linear",
        startTime: { mode: "immediate" },
      },
    ];

    const result = createBatchTemplate("Batch Template", items);

    expect(result.name).toBe("Batch Template");
    expect(result.items).toHaveLength(2);
    expect(result.items[0].name).toBe("Batch Template #1");
    expect(result.items[1].name).toBe("Batch Template #2");
  });

  it("preserves item name if provided", () => {
    const items: ScheduleItem[] = [
      {
        name: "TGE",
        tokenSymbol: "STRK",
        amount: "100",
        duration: 30,
        durationUnit: "d",
        curve: "linear",
        startTime: { mode: "immediate" },
      },
    ];

    const result = createBatchTemplate("Batch", items);
    expect(result.items[0].name).toBe("TGE");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Aggregation Function Tests
// ─────────────────────────────────────────────────────────────────────────────

describe("getTemplateTotalAmount", () => {
  it("calculates total amount across all items", () => {
    const template: ScheduleTemplate = {
      id: "test",
      name: "Test",
      items: [
        {
          tokenSymbol: "STRK",
          amount: "100",
          duration: 30,
          durationUnit: "d",
          curve: "linear",
          startTime: { mode: "immediate" },
        },
        {
          tokenSymbol: "STRK",
          amount: "200",
          duration: 60,
          durationUnit: "d",
          curve: "linear",
          startTime: { mode: "immediate" },
        },
      ],
      createdAt: 1700000000000,
      updatedAt: 1700000000000,
    };

    expect(getTemplateTotalAmount(template)).toBe("300.00");
  });

  it("handles single item", () => {
    const template: ScheduleTemplate = {
      id: "test",
      name: "Test",
      items: [
        {
          tokenSymbol: "STRK",
          amount: "150.5",
          duration: 30,
          durationUnit: "d",
          curve: "linear",
          startTime: { mode: "immediate" },
        },
      ],
      createdAt: 1700000000000,
      updatedAt: 1700000000000,
    };

    expect(getTemplateTotalAmount(template)).toBe("150.50");
  });

  it("handles empty items array", () => {
    const template: ScheduleTemplate = {
      id: "test",
      name: "Test",
      items: [],
      createdAt: 1700000000000,
      updatedAt: 1700000000000,
    };

    expect(getTemplateTotalAmount(template)).toBe("0.00");
  });

  it("handles invalid amount strings", () => {
    const template: ScheduleTemplate = {
      id: "test",
      name: "Test",
      items: [
        {
          tokenSymbol: "STRK",
          amount: "invalid",
          duration: 30,
          durationUnit: "d",
          curve: "linear",
          startTime: { mode: "immediate" },
        },
      ],
      createdAt: 1700000000000,
      updatedAt: 1700000000000,
    };

    expect(getTemplateTotalAmount(template)).toBe("0.00");
  });
});

describe("getTemplateCurve", () => {
  it("returns first item's curve", () => {
    const template: ScheduleTemplate = {
      id: "test",
      name: "Test",
      items: [
        {
          tokenSymbol: "STRK",
          amount: "100",
          duration: 30,
          durationUnit: "d",
          curve: "cliff",
          startTime: { mode: "immediate" },
        },
        {
          tokenSymbol: "STRK",
          amount: "100",
          duration: 60,
          durationUnit: "d",
          curve: "linear",
          startTime: { mode: "immediate" },
        },
      ],
      createdAt: 1700000000000,
      updatedAt: 1700000000000,
    };

    expect(getTemplateCurve(template)).toBe("cliff");
  });

  it("defaults to 'linear' for empty items", () => {
    const template: ScheduleTemplate = {
      id: "test",
      name: "Test",
      items: [],
      createdAt: 1700000000000,
      updatedAt: 1700000000000,
    };

    expect(getTemplateCurve(template)).toBe("linear");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Round Resolution Tests
// ─────────────────────────────────────────────────────────────────────────────

describe("resolveRoundTimes", () => {
  it("resolves start and end times for schedules", () => {
    const schedules: ScheduleItem[] = [
      {
        tokenSymbol: "STRK",
        amount: "100",
        duration: 30,
        durationUnit: "d",
        curve: "linear",
        startTime: { mode: "immediate" },
      },
    ];
    const deploymentTime = 1700000000;

    const result = resolveRoundTimes(schedules, deploymentTime);

    expect(result).toHaveLength(1);
    expect(result[0].roundIndex).toBe(1);
    expect(result[0].resolvedStartTime).toBe(deploymentTime + 60);
    expect(result[0].resolvedEndTime).toBe(deploymentTime + 60 + 30 * 86400);
  });

  it("handles multiple rounds", () => {
    const schedules: ScheduleItem[] = [
      {
        tokenSymbol: "STRK",
        amount: "100",
        duration: 30,
        durationUnit: "d",
        curve: "linear",
        startTime: { mode: "immediate" },
      },
      {
        tokenSymbol: "STRK",
        amount: "100",
        duration: 60,
        durationUnit: "d",
        curve: "linear",
        startTime: { mode: "immediate" },
      },
    ];
    const deploymentTime = 1700000000;

    const result = resolveRoundTimes(schedules, deploymentTime);

    expect(result).toHaveLength(2);
    expect(result[0].roundIndex).toBe(1);
    expect(result[1].roundIndex).toBe(2);
    // Both start at same time (after_deploy behavior)
    expect(result[0].resolvedStartTime).toBe(result[1].resolvedStartTime);
  });

  it("returns empty array for empty input", () => {
    expect(resolveRoundTimes([])).toEqual([]);
  });

  it("handles different duration units", () => {
    const schedules: ScheduleItem[] = [
      {
        tokenSymbol: "STRK",
        amount: "100",
        duration: 1,
        durationUnit: "h", // 1 hour = 3600 seconds
        curve: "linear",
        startTime: { mode: "immediate" },
      },
    ];
    const deploymentTime = 1700000000;

    const result = resolveRoundTimes(schedules, deploymentTime);

    expect(result[0].resolvedEndTime).toBe(deploymentTime + 60 + 3600);
  });
});

describe("calculateTotalAmount", () => {
  it("calculates total amount from schedules", () => {
    const schedules: ScheduleItem[] = [
      {
        tokenSymbol: "STRK",
        amount: "100",
        duration: 30,
        durationUnit: "d",
        curve: "linear",
        startTime: { mode: "immediate" },
      },
      {
        tokenSymbol: "STRK",
        amount: "200.5",
        duration: 60,
        durationUnit: "d",
        curve: "linear",
        startTime: { mode: "immediate" },
      },
    ];

    expect(calculateTotalAmount(schedules)).toBe("300.50");
  });
});

describe("calculateTotalDuration", () => {
  it("calculates duration from first start to last end", () => {
    const rounds = [
      { resolvedStartTime: 1000, resolvedEndTime: 2000 },
      { resolvedStartTime: 1000, resolvedEndTime: 3000 },
    ] as any[];

    expect(calculateTotalDuration(rounds)).toBe(2000); // 3000 - 1000
  });

  it("returns 0 for empty rounds", () => {
    expect(calculateTotalDuration([])).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Formatting Utility Tests
// ─────────────────────────────────────────────────────────────────────────────

describe("formatRoundStartMode", () => {
  it("formats all mode types", () => {
    expect(formatRoundStartMode("immediate")).toBe("Immediate");
    expect(formatRoundStartMode("after_deploy")).toBe("After deploy");
    expect(formatRoundStartMode("after_previous")).toBe("After previous");
    expect(formatRoundStartMode("sequential")).toBe("After previous ends");
  });
});

describe("formatOffset", () => {
  it("formats seconds with default unit", () => {
    // 86400 seconds: finds first unit where factor <= 86400
    // "s" factor=1 <= 86400 ✓ → selects "Sec" (first match)
    // 86400 / 1 = 86400
    expect(formatOffset(86400)).toBe("86400 Sec");
  });

  it("formats seconds with specified unit", () => {
    expect(formatOffset(3600, "h")).toBe("1 h");
    expect(formatOffset(60, "min")).toBe("1 min");
  });

  it("formats decimal values", () => {
    expect(formatOffset(129600, "d")).toBe("1.5 d");
  });

  it("handles zero", () => {
    expect(formatOffset(0)).toBe("0");
  });

  it("handles missing unit by auto-selecting", () => {
    // 90 seconds: finds first unit where factor <= 90
    // "s" factor=1 <= 90, so it selects "Sec"
    const result = formatOffset(90);
    expect(result).toContain("Sec");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Integration Tests
// ─────────────────────────────────────────────────────────────────────────────

describe("Template CRUD Integration", () => {
  it("save and load preserves data integrity", () => {
    const templates: ScheduleTemplate[] = [
      {
        id: "test-1",
        name: "Test Template",
        items: [
          {
            name: "Round 1",
            tokenSymbol: "STRK",
            amount: "100",
            duration: 30,
            durationUnit: "d",
            curve: "linear",
            startTime: { mode: "immediate" },
          },
          {
            name: "Round 2",
            tokenSymbol: "ETH",
            amount: "50",
            duration: 60,
            durationUnit: "d",
            curve: "cliff",
            startTime: { mode: "delayed", delaySeconds: 86400 },
          },
        ],
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
      },
    ];

    saveTemplates(templates);
    const loaded = loadTemplates();

    expect(loaded).toHaveLength(1);
    expect(loaded[0].id).toBe("test-1");
    expect(loaded[0].name).toBe("Test Template");
    expect(loaded[0].items).toHaveLength(2);
    expect(loaded[0].items[0].name).toBe("Round 1");
    expect(loaded[0].items[1].curve).toBe("cliff");
    expect(loaded[0].items[1].startTime.delaySeconds).toBe(86400);
  });

  it("update workflow: load, modify, save", () => {
    // Create
    const original: ScheduleTemplate[] = [
      {
        id: "test-1",
        name: "Original",
        items: [
          {
            tokenSymbol: "STRK",
            amount: "100",
            duration: 30,
            durationUnit: "d",
            curve: "linear",
            startTime: { mode: "immediate" },
          },
        ],
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
      },
    ];
    saveTemplates(original);

    // Load
    let loaded = loadTemplates();

    // Modify
    loaded = loaded.map((t) =>
      t.id === "test-1" ? { ...t, name: "Modified", updatedAt: Date.now() } : t,
    );

    // Save
    saveTemplates(loaded);

    // Verify
    loaded = loadTemplates();
    expect(loaded[0].name).toBe("Modified");
    expect(loaded[0].createdAt).toBe(1700000000000); // Unchanged
  });

  it("delete workflow: load, filter, save", () => {
    const templates: ScheduleTemplate[] = [
      {
        id: "keep",
        name: "Keep Me",
        items: [
          {
            tokenSymbol: "STRK",
            amount: "100",
            duration: 30,
            durationUnit: "d",
            curve: "linear",
            startTime: { mode: "immediate" },
          },
        ],
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
      },
      {
        id: "delete",
        name: "Delete Me",
        items: [
          {
            tokenSymbol: "STRK",
            amount: "200",
            duration: 60,
            durationUnit: "d",
            curve: "linear",
            startTime: { mode: "immediate" },
          },
        ],
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
      },
    ];
    saveTemplates(templates);

    // Delete
    let loaded = loadTemplates();
    loaded = loaded.filter((t) => t.id !== "delete");
    saveTemplates(loaded);

    // Verify
    loaded = loadTemplates();
    expect(loaded).toHaveLength(1);
    expect(loaded[0].id).toBe("keep");
  });
});

describe("Full Template Workflow", () => {
  it("creates, resolves, and aggregates a complete template", () => {
    // Create a batch template
    const items: ScheduleItem[] = [
      {
        tokenSymbol: "STRK",
        amount: "1000",
        duration: 30,
        durationUnit: "d",
        curve: "cliff",
        startTime: { mode: "delayed", delaySeconds: 2592000 }, // 30 days
      },
      {
        tokenSymbol: "STRK",
        amount: "2000",
        duration: 60,
        durationUnit: "d",
        curve: "linear",
        startTime: { mode: "immediate" },
      },
    ];

    const template = createBatchTemplate("Vesting Schedule", items);

    // Verify structure
    expect(template.name).toBe("Vesting Schedule");
    expect(template.items).toHaveLength(2);

    // Aggregate
    expect(getTemplateTotalAmount(template)).toBe("3000.00");
    expect(getTemplateCurve(template)).toBe("cliff"); // First item's curve

    // Resolve times
    const deploymentTime = Math.floor(Date.now() / 1000);
    const resolved = resolveRoundTimes(template.items, deploymentTime);

    expect(resolved).toHaveLength(2);
    expect(resolved[0].roundIndex).toBe(1);
    expect(resolved[1].roundIndex).toBe(2);

    // Total duration
    const totalDuration = calculateTotalDuration(resolved);
    expect(totalDuration).toBe(
      resolved[1].resolvedEndTime - resolved[0].resolvedStartTime,
    );

    // Save and reload
    saveTemplates([template]);
    const loaded = loadTemplates();

    expect(loaded).toHaveLength(1);
    expect(getTemplateTotalAmount(loaded[0])).toBe("3000.00");
  });
});
