/**
 * Integration Tests for Batch Plan Editor
 * Pro Mode Multi-Task Editing Components
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
import type { ScheduleItem, ScheduleTemplate } from "../app/template-types";

// ─────────────────────────────────────────────────────────────────────────────
// Mocks
// ─────────────────────────────────────────────────────────────────────────────

vi.mock("starkzap", () => ({
  sepoliaTokens: {
    STRK: {
      address:
        "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d",
      decimals: 18,
      symbol: "STRK",
      name: "Starknet Token",
    },
    ETH: {
      address:
        "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7",
      decimals: 18,
      symbol: "ETH",
      name: "Ether",
    },
  },
  mainnetTokens: {
    STRK: {
      address:
        "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d",
      decimals: 18,
      symbol: "STRK",
      name: "Starknet Token",
    },
    ETH: {
      address:
        "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7",
      decimals: 18,
      symbol: "ETH",
      name: "Ether",
    },
  },
  Amount: {
    parse: (value: string, decimals: number) => ({
      toBase: () => BigInt(value) * 10n ** BigInt(decimals),
    }),
  },
}));

vi.mock("react-hot-toast", () => ({
  default: { success: vi.fn(), error: vi.fn(), loading: vi.fn() },
  Toaster: () => null,
}));

vi.mock("~~/hooks/useStrkPrice", () => ({
  usePopularTokenPrices: vi.fn(() => ({ prices: {}, isLoading: false })),
}));

vi.mock("~~/hooks/useStarkZap", () => ({
  useStarkZap: vi.fn(() => ({
    address: "0x1234567890abcdef",
    isConnected: true,
  })),
}));

// ─────────────────────────────────────────────────────────────────────────────
// Test Helpers
// ─────────────────────────────────────────────────────────────────────────────

const createMockScheduleItem = (
  overrides?: Partial<ScheduleItem>,
): ScheduleItem => ({
  name: "Test Plan",
  recipient: "0x1234567890abcdef",
  tokenSymbol: "STRK",
  amount: "1000",
  duration: 30,
  durationUnit: "d",
  curve: "linear",
  startTime: { mode: "immediate" },
  ...overrides,
});

const createMockTemplate = (
  overrides?: Partial<ScheduleTemplate>,
): ScheduleTemplate => ({
  id: "test-1",
  name: "Test Template",
  items: [createMockScheduleItem()],
  createdAt: Date.now(),
  updatedAt: Date.now(),
  ...overrides,
});

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <QueryClientProvider client={createTestQueryClient()}>
      {ui}
    </QueryClientProvider>,
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// LocalStorage Mock
// ─────────────────────────────────────────────────────────────────────────────
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

  // Mock HTMLDialogElement showModal/close for jsdom
  if (typeof HTMLDialogElement !== "undefined") {
    HTMLDialogElement.prototype.showModal = vi.fn();
    HTMLDialogElement.prototype.close = vi.fn();
  }
});

afterEach(() => {
  vi.restoreAllMocks();
  mockStorage.clear();
});

// ═════════════════════════════════════════════════════════════════════════════
// Template System Tests
// ═════════════════════════════════════════════════════════════════════════════

describe("Template System", () => {
  describe("loadTemplates", () => {
    it("returns empty array when localStorage is empty", async () => {
      const { loadTemplates } = await import("../app/template-types");
      expect(loadTemplates()).toEqual([]);
    });

    it("loads templates from localStorage", async () => {
      const { loadTemplates, saveTemplates } = await import(
        "../app/template-types"
      );
      const template = createMockTemplate({ name: "Saved" });
      saveTemplates([template]);
      const loaded = loadTemplates();
      expect(loaded).toHaveLength(1);
      expect(loaded[0].name).toBe("Saved");
    });

    it("returns empty array on invalid JSON", async () => {
      mockStorage.getItem.mockReturnValueOnce("not valid json");
      const { loadTemplates } = await import("../app/template-types");
      expect(loadTemplates()).toEqual([]);
    });

    it("handles server-side rendering", async () => {
      vi.stubGlobal("window", undefined);
      const { loadTemplates } = await import("../app/template-types");
      expect(loadTemplates()).toEqual([]);
    });
  });

  describe("saveTemplates", () => {
    it("saves templates to localStorage", async () => {
      const { saveTemplates, loadTemplates } = await import(
        "../app/template-types"
      );
      const template = createMockTemplate({ name: "To Save" });
      saveTemplates([template]);
      const loaded = loadTemplates();
      expect(loaded[0].name).toBe("To Save");
    });
  });

  describe("getTemplateTotalAmount", () => {
    it("calculates total amount across items", async () => {
      const { getTemplateTotalAmount } = await import("../app/template-types");
      const template = createMockTemplate({
        items: [
          createMockScheduleItem({ amount: "100" }),
          createMockScheduleItem({ amount: "200" }),
        ],
      });
      expect(getTemplateTotalAmount(template)).toBe("300.00");
    });

    it("handles empty items array", async () => {
      const { getTemplateTotalAmount } = await import("../app/template-types");
      expect(getTemplateTotalAmount(createMockTemplate({ items: [] }))).toBe(
        "0.00",
      );
    });
  });

  describe("createSingleTemplate", () => {
    it("creates template with single item", async () => {
      const { createSingleTemplate } = await import("../app/template-types");
      const item = createMockScheduleItem({ name: "Single" });
      const template = createSingleTemplate("My Template", item);
      expect(template.name).toBe("My Template");
      expect(template.items).toHaveLength(1);
    });
  });

  describe("createBatchTemplate", () => {
    it("creates template with multiple items", async () => {
      const { createBatchTemplate } = await import("../app/template-types");
      const items = [createMockScheduleItem(), createMockScheduleItem()];
      const template = createBatchTemplate("Batch", items);
      expect(template.items).toHaveLength(2);
    });
  });

  describe("resolveStartTime", () => {
    it("resolves immediate start time", async () => {
      const { resolveStartTime } = await import("../app/template-types");
      const now = Math.floor(Date.now() / 1000);
      const result = resolveStartTime({ mode: "immediate" });
      expect(result).toBeGreaterThanOrEqual(now + 59);
      expect(result).toBeLessThanOrEqual(now + 61);
    });

    it("resolves delayed start time", async () => {
      const { resolveStartTime } = await import("../app/template-types");
      const now = Math.floor(Date.now() / 1000);
      const result = resolveStartTime({ mode: "delayed", delaySeconds: 3600 });
      expect(result).toBeGreaterThanOrEqual(now + 3659);
    });
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// StartModeSelector Tests
// ═════════════════════════════════════════════════════════════════════════════

describe("StartModeSelector", () => {
  let StartModeSelector: React.ComponentType<any>;

  beforeEach(async () => {
    const module = await import(
      "../app/components/BatchPlanEditor/components/StartModeSelector"
    );
    StartModeSelector = module.StartModeSelector;
  });

  it("renders both mode options", () => {
    renderWithProviders(
      <StartModeSelector
        value="immediate"
        delay="0"
        delayUnit="d"
        onModeChange={vi.fn()}
        onDelayChange={vi.fn()}
        onDelayUnitChange={vi.fn()}
      />,
    );
    expect(screen.getByText("Immediate")).toBeInTheDocument();
    expect(screen.getByText("Delayed")).toBeInTheDocument();
  });

  it("calls onModeChange when Delayed is clicked", () => {
    const onModeChange = vi.fn();
    renderWithProviders(
      <StartModeSelector
        value="immediate"
        delay="0"
        delayUnit="d"
        onModeChange={onModeChange}
        onDelayChange={vi.fn()}
        onDelayUnitChange={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByText("Delayed"));
    expect(onModeChange).toHaveBeenCalledWith("delayed");
  });

  it("shows Unit selector in delayed mode", () => {
    renderWithProviders(
      <StartModeSelector
        value="delayed"
        delay="1"
        delayUnit="d"
        onModeChange={vi.fn()}
        onDelayChange={vi.fn()}
        onDelayUnitChange={vi.fn()}
      />,
    );
    expect(screen.getByText("Unit")).toBeInTheDocument();
  });

  it("calls onDelayChange when delay value changes", () => {
    const onDelayChange = vi.fn();
    renderWithProviders(
      <StartModeSelector
        value="delayed"
        delay="1"
        delayUnit="d"
        onModeChange={vi.fn()}
        onDelayChange={onDelayChange}
        onDelayUnitChange={vi.fn()}
      />,
    );
    const input = screen.getByDisplayValue("1");
    fireEvent.change(input, { target: { value: "30" } });
    expect(onDelayChange).toHaveBeenCalledWith("30");
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// RoundPlanCard Tests
// ═════════════════════════════════════════════════════════════════════════════

describe("RoundPlanCard", () => {
  let RoundPlanCard: React.ComponentType<any>;

  beforeEach(async () => {
    const module = await import(
      "../app/components/BatchPlanEditor/components/RoundPlanCard"
    );
    RoundPlanCard = module.RoundPlanCard;
  });

  it("renders schedule information", () => {
    const mockItem = createMockScheduleItem({
      name: "Test Schedule",
      amount: "5000",
      tokenSymbol: "STRK",
    });
    renderWithProviders(
      <RoundPlanCard
        schedule={mockItem}
        index={0}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        canDelete={true}
      />,
    );
    expect(screen.getByText("Test Schedule")).toBeInTheDocument();
    expect(screen.getByText("5000")).toBeInTheDocument();
    expect(screen.getByText("STRK")).toBeInTheDocument();
  });

  it("displays default name when schedule has no name", () => {
    const mockItem = createMockScheduleItem({ name: undefined });
    renderWithProviders(
      <RoundPlanCard
        schedule={mockItem}
        index={2}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        canDelete={true}
      />,
    );
    expect(screen.getByText("Plan 3")).toBeInTheDocument();
  });

  it("displays correct index number", () => {
    const mockItem = createMockScheduleItem();
    renderWithProviders(
      <RoundPlanCard
        schedule={mockItem}
        index={4}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        canDelete={true}
      />,
    );
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("shows buttons", () => {
    const { container } = renderWithProviders(
      <RoundPlanCard
        schedule={createMockScheduleItem()}
        index={0}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        canDelete={true}
      />,
    );
    expect(container.querySelectorAll("button").length).toBeGreaterThanOrEqual(
      1,
    );
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// PlanEditor Tests
// ═════════════════════════════════════════════════════════════════════════════

describe("PlanEditor", () => {
  let PlanEditor: React.ComponentType<any>;

  beforeEach(async () => {
    const module = await import(
      "../app/components/BatchPlanEditor/components/PlanEditor"
    );
    PlanEditor = module.PlanEditor;
  });

  describe("Rendering", () => {
    it("renders New Plan title for new plan", () => {
      renderWithProviders(
        <PlanEditor
          schedule={createMockScheduleItem()}
          scheduleIndex={-1}
          onSave={vi.fn()}
          onClose={vi.fn()}
        />,
      );
      expect(screen.getByText("New Schedule")).toBeInTheDocument();
    });

    it("renders Edit Schedule title for existing plan", () => {
      renderWithProviders(
        <PlanEditor
          schedule={createMockScheduleItem()}
          scheduleIndex={0}
          onSave={vi.fn()}
          onClose={vi.fn()}
        />,
      );
      expect(screen.getByText("Edit Schedule 1")).toBeInTheDocument();
    });

    it("displays schedule name", () => {
      renderWithProviders(
        <PlanEditor
          schedule={createMockScheduleItem({ name: "Custom Plan" })}
          scheduleIndex={0}
          onSave={vi.fn()}
          onClose={vi.fn()}
        />,
      );
      expect(screen.getByPlaceholderText(/TGE, Month 1, Q1 Vest/i)).toHaveValue(
        "Custom Plan",
      );
    });

    it("displays schedule amount", () => {
      renderWithProviders(
        <PlanEditor
          schedule={createMockScheduleItem({ amount: "5000" })}
          scheduleIndex={0}
          onSave={vi.fn()}
          onClose={vi.fn()}
        />,
      );
      expect(screen.getByDisplayValue("5000")).toBeInTheDocument();
    });

    it("displays schedule duration", () => {
      renderWithProviders(
        <PlanEditor
          schedule={createMockScheduleItem({ duration: 90 })}
          scheduleIndex={0}
          onSave={vi.fn()}
          onClose={vi.fn()}
        />,
      );
      expect(screen.getByDisplayValue("90")).toBeInTheDocument();
    });
  });

  describe("Curve Selection", () => {
    it("renders all three curve options", () => {
      renderWithProviders(
        <PlanEditor
          schedule={createMockScheduleItem()}
          scheduleIndex={0}
          onSave={vi.fn()}
          onClose={vi.fn()}
        />,
      );
      const linearElements = screen.queryAllByText("Linear");
      const cliffElements = screen.queryAllByText("Cliff");
      const expElements = screen.queryAllByText("Exp Decay");
      expect(linearElements.length).toBeGreaterThan(0);
      expect(cliffElements.length).toBeGreaterThan(0);
      expect(expElements.length).toBeGreaterThan(0);
    });
  });

  describe("Form Actions", () => {
    it("calls onClose when Cancel is clicked", () => {
      const onClose = vi.fn();
      renderWithProviders(
        <PlanEditor
          schedule={createMockScheduleItem()}
          scheduleIndex={0}
          onSave={vi.fn()}
          onClose={onClose}
        />,
      );
      fireEvent.click(screen.getByText("Cancel"));
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("calls onSave with schedule data", () => {
      const onSave = vi.fn();
      renderWithProviders(
        <PlanEditor
          schedule={createMockScheduleItem()}
          scheduleIndex={0}
          onSave={onSave}
          onClose={vi.fn()}
        />,
      );
      fireEvent.click(screen.getByText("Save Changes"));
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Test Plan",
          amount: "1000",
          duration: 30,
          curve: "linear",
        }),
      );
    });

    it("shows Add Plan button for new plan", () => {
      renderWithProviders(
        <PlanEditor
          schedule={createMockScheduleItem()}
          scheduleIndex={-1}
          onSave={vi.fn()}
          onClose={vi.fn()}
        />,
      );
      expect(screen.getByText("Add Plan")).toBeInTheDocument();
    });
  });

  describe("Delete Action", () => {
    it("does not render Delete button when onDelete is not provided", () => {
      renderWithProviders(
        <PlanEditor
          schedule={createMockScheduleItem()}
          scheduleIndex={0}
          onSave={vi.fn()}
          onClose={vi.fn()}
        />,
      );
      expect(screen.queryByText("Delete Plan")).not.toBeInTheDocument();
    });

    it("renders Delete button when onDelete is provided for existing plan", () => {
      renderWithProviders(
        <PlanEditor
          schedule={createMockScheduleItem()}
          scheduleIndex={0}
          onSave={vi.fn()}
          onClose={vi.fn()}
          onDelete={vi.fn()}
        />,
      );
      expect(screen.getByText("Delete Plan")).toBeInTheDocument();
    });

    it("calls onDelete when Delete is clicked", () => {
      const onDelete = vi.fn();
      renderWithProviders(
        <PlanEditor
          schedule={createMockScheduleItem()}
          scheduleIndex={0}
          onSave={vi.fn()}
          onClose={vi.fn()}
          onDelete={onDelete}
        />,
      );
      fireEvent.click(screen.getByText("Delete Plan"));
      expect(onDelete).toHaveBeenCalledTimes(1);
    });
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// PlanList Tests
// ═════════════════════════════════════════════════════════════════════════════

describe("PlanList", () => {
  let PlanList: React.ComponentType<any>;

  beforeEach(async () => {
    const module = await import(
      "../app/components/BatchPlanEditor/components/PlanList"
    );
    PlanList = module.PlanList;
  });

  it("renders Add Plan button in empty state", () => {
    renderWithProviders(
      <PlanList rounds={[]} recipient="" onRoundsChange={vi.fn()} />,
    );
    expect(screen.getByText("Add Plan")).toBeInTheDocument();
  });

  it("renders PlanEditor for each schedule item", () => {
    const rounds = [
      createMockScheduleItem({ name: "Plan 1" }),
      createMockScheduleItem({ name: "Plan 2" }),
    ];
    renderWithProviders(
      <PlanList rounds={rounds} recipient="" onRoundsChange={vi.fn()} />,
    );
    // Check that schedule names are displayed (collapsed view)
    expect(screen.getByText("Plan 1")).toBeInTheDocument();
    expect(screen.getByText("Plan 2")).toBeInTheDocument();
  });
  it("calls onRoundsChange when adding new plan", () => {
    const onRoundsChange = vi.fn();
    renderWithProviders(
      <PlanList rounds={[]} recipient="" onRoundsChange={onRoundsChange} />,
    );
    fireEvent.click(screen.getByText("Add Plan"));
    expect(onRoundsChange).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ name: "Plan 1" })]),
    );
  });
});
// ═════════════════════════════════════════════════════════════════════════════
// Edge Cases
// ═════════════════════════════════════════════════════════════════════════════

describe("Edge Cases", () => {
  describe("Empty Values", () => {
    it("handles empty name", async () => {
      const PlanEditor = (
        await import("../app/components/BatchPlanEditor/components/PlanEditor")
      ).PlanEditor;
      renderWithProviders(
        <PlanEditor
          schedule={createMockScheduleItem({ name: undefined })}
          scheduleIndex={0}
          onSave={vi.fn()}
          onClose={vi.fn()}
        />,
      );
      // scheduleIndex >= 0 means "Edit Schedule", not "New Plan"
      expect(screen.getByText("Edit Schedule 1")).toBeInTheDocument();
    });
    it("handles zero duration", async () => {
      const PlanEditor = (
        await import("../app/components/BatchPlanEditor/components/PlanEditor")
      ).PlanEditor;
      renderWithProviders(
        <PlanEditor
          schedule={createMockScheduleItem({ duration: 0 })}
          scheduleIndex={0}
          onSave={vi.fn()}
          onClose={vi.fn()}
        />,
      );
      expect(screen.getByDisplayValue("0")).toBeInTheDocument();
    });

    it("handles decimal amount", async () => {
      const PlanEditor = (
        await import("../app/components/BatchPlanEditor/components/PlanEditor")
      ).PlanEditor;
      renderWithProviders(
        <PlanEditor
          schedule={createMockScheduleItem({ amount: "100.5" })}
          scheduleIndex={0}
          onSave={vi.fn()}
          onClose={vi.fn()}
        />,
      );
      expect(screen.getByDisplayValue("100.5")).toBeInTheDocument();
    });
  });
});
