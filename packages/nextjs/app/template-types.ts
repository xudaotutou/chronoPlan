// ═══════════════════════════════════════════════════════════════════
// ── Unified Template System ───────────────────────────────────────
//
// Design: Templates are arrays of ScheduleItems
// - 1 item  = Standard mode (single plan)
// - >1 items = Batch mode (multiple sequential plans)
//
// ┌─────────────────────────────────────────────────────────────┐
// │  ScheduleTemplate (stored in localStorage)                   │
// │  ├── id, name                                              │
// │  └── items: ScheduleItem[]  ← 1 or more items              │
// └─────────────────────────────────────────────────────────────┘
// ═══════════════════════════════════════════════════════════════════

// ── Temporal Units ───────────────────────────────────────────────
export type TemporalUnit = "s" | "min" | "h" | "d" | "wk" | "mo";

export const TEMPORAL_UNITS: {
  key: TemporalUnit;
  label: string;
  factor: number;
}[] = [
  { key: "s", label: "Sec", factor: 1 },
  { key: "min", label: "Min", factor: 60 },
  { key: "h", label: "Hour", factor: 3600 },
  { key: "d", label: "Day", factor: 86400 },
  { key: "wk", label: "Week", factor: 604800 },
  { key: "mo", label: "Month", factor: 2592000 },
];

// ── Start Time Configuration ────────────────────────────────────
export type StartTimeMode = "immediate" | "delayed" | "scheduled";

export type StartTimeConfig = {
  mode: StartTimeMode;
  /** For 'delayed' mode: offset from deployment (in seconds) */
  delaySeconds?: number;
  /** UI convenience field for unit display */
  delayUnit?: TemporalUnit;
  /** For 'scheduled' mode: absolute Unix timestamp */
  scheduledAt?: number;
};

// ── Curve Types ──────────────────────────────────────────────────
export type CurveType = "linear" | "cliff" | "expdecay";

// ── Token Symbols ─────────────────────────────────────────────────
/** Token symbol from starkzap sepoliaTokens */
export type TemplateTokenSymbol = string;

/**
 * A single schedule configuration within a template.
 */
export type ScheduleItem = {
  /** Round name (e.g., "TGE", "Month 1", "Q1 Vest") - optional */
  name?: string;
  /** Recipient address - optional, can be filled at deploy time */
  recipient?: string;
  /** Token symbol - required (from starkzap sepoliaTokens) */
  tokenSymbol: TemplateTokenSymbol;
  amount: string;
  /** Duration value - required */
  duration: number;
  /** Duration unit - required */
  durationUnit: TemporalUnit;
  /** Release curve - required */
  curve: CurveType;
  /** Start time configuration - required */
  startTime: StartTimeConfig;
};

// ── Schedule Template (Unified) ─────────────────────────────────
/**
 * Unified template type.
 * - items.length === 1 → Standard mode (single plan)
 * - items.length > 1  → Batch mode (multiple plans)
 */
export type ScheduleTemplate = {
  id: string;
  name: string;
  /** Array of schedule items. 1 = standard, >1 = batch */
  items: ScheduleItem[];
  createdAt: number;
  updatedAt: number;
};

// ── Backwards Compatibility Aliases ───────────────────────────────
/** @deprecated Use ScheduleTemplate instead */
export type Template = ScheduleTemplate;
/** @deprecated Use ScheduleItem instead */
export type RoundConfig = ScheduleItem;

// ── Preset Templates ─────────────────────────────────────────────
/**
 * Preset templates are ScheduleItems (single plans).
 */
export const PRESET_SCHEDULE_ITEMS: ScheduleItem[] = [
  {
    name: "Quick Vest",
    recipient: undefined,
    tokenSymbol: "STRK",
    amount: "100",
    duration: 30,
    durationUnit: "d",
    curve: "linear",
    startTime: { mode: "immediate" },
  },
  {
    name: "Team Cliff",
    recipient: undefined,
    tokenSymbol: "STRK",
    amount: "1000",
    duration: 90,
    durationUnit: "d",
    curve: "cliff",
    startTime: {
      mode: "delayed",
      delaySeconds: 2592000, // 30 days
      delayUnit: "d",
    },
  },
  {
    name: "Gradual Airdrop",
    recipient: undefined,
    tokenSymbol: "STRK",
    amount: "50",
    duration: 30,
    durationUnit: "d",
    curve: "expdecay",
    startTime: {
      mode: "delayed",
      delaySeconds: 86400, // 1 day
      delayUnit: "d",
    },
  },
  {
    name: "Yearly Allocation",
    recipient: undefined,
    tokenSymbol: "STRK",
    amount: "5000",
    duration: 365,
    durationUnit: "d",
    curve: "linear",
    startTime: { mode: "immediate" },
  },
];

/** @deprecated Use PRESET_SCHEDULE_ITEMS instead */
export const PRESET_TEMPLATES = PRESET_SCHEDULE_ITEMS;

// ── Storage Helpers ──────────────────────────────────────────────
const TEMPLATES_KEY = "chronoplan_templates";

export function loadTemplates(): ScheduleTemplate[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(TEMPLATES_KEY);
    if (!raw) return [];

    // Migrate old format if needed
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Check if old format (single item) or new format (array of items)
      const first = parsed[0];
      if (
        first &&
        !Array.isArray(first.items) &&
        first.hasOwnProperty("recipient")
      ) {
        // Old format: migrate to new format
        return parsed.map((t: any) => ({
          id: t.id,
          name: t.name,
          items: [
            {
              name: t.name,
              recipient: t.recipient || undefined,
              tokenSymbol: t.tokenSymbol || "STRK",
              amount: t.amount || "0",
              duration: t.duration || 30,
              durationUnit: t.durationUnit || "d",
              curve: t.curve || "linear",
              startTime: t.startTime || { mode: "immediate" },
            },
          ],
          createdAt: t.createdAt || Date.now(),
          updatedAt: Date.now(),
        }));
      }
    }
    return parsed;
  } catch {
    return [];
  }
}

export function saveTemplates(templates: ScheduleTemplate[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
}

// ── Start Time Resolution ────────────────────────────────────────
/**
 * Resolves a StartTimeConfig to an absolute Unix timestamp.
 */
export function resolveStartTime(config: StartTimeConfig): number {
  const now = Math.floor(Date.now() / 1000);

  switch (config.mode) {
    case "immediate":
      return now + 60; // 1 minute buffer for tx confirmation
    case "delayed":
      return now + 60 + (config.delaySeconds || 0);
    case "scheduled":
      return config.scheduledAt || now + 60;
  }
}

// ── Start Time Formatting ────────────────────────────────────────
export function formatStartTime(
  config: StartTimeConfig,
  resolvedTimestamp?: number,
): string {
  switch (config.mode) {
    case "immediate":
      return "Immediate";
    case "delayed": {
      const delayUnit =
        TEMPORAL_UNITS.find((u) => u.key === config.delayUnit) ||
        TEMPORAL_UNITS[3];
      const delayValue = (config.delaySeconds || 0) / delayUnit.factor;
      const formatted =
        delayValue % 1 === 0 ? delayValue.toString() : delayValue.toFixed(1);
      return "+" + formatted + " " + delayUnit.label;
    }
    case "scheduled": {
      const ts = resolvedTimestamp || config.scheduledAt;
      if (!ts) return "Not scheduled";
      const date = new Date(ts * 1000);
      const now = new Date();
      const isToday = date.toDateString() === now.toDateString();
      if (isToday) {
        return (
          "Today " +
          date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        );
      }
      return date.toLocaleString([], {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  }
}

export function formatTimestamp(ts: number): string {
  const date = new Date(ts * 1000);
  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ── Template Creation Helpers ────────────────────────────────────
/**
 * Creates a new template with a single schedule item
 */
export function createSingleTemplate(
  name: string,
  item: ScheduleItem,
): Omit<ScheduleTemplate, "id"> {
  return {
    name,
    items: [{ ...item, name: item.name || name }],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

/**
 * Creates a new template with multiple schedule items (batch)
 */
export function createBatchTemplate(
  name: string,
  items: ScheduleItem[],
): Omit<ScheduleTemplate, "id"> {
  return {
    name,
    items: items.map((item, i) => ({
      ...item,
      name: item.name || name + " #" + (i + 1),
    })),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

/**
 * Gets the total amount across all items in a template
 */
export function getTemplateTotalAmount(template: ScheduleTemplate): string {
  const total = template.items.reduce(
    (sum, item) => sum + (parseFloat(item.amount) || 0),
    0,
  );
  return total.toFixed(2);
}

/**
 * Gets the primary curve type (first item's curve)
 */
export function getTemplateCurve(template: ScheduleTemplate): CurveType {
  return template.items[0]?.curve || "linear";
}

// ── Batch Plan System (for Pro Mode) ────────────────────────────────

/**
 * How a round's start time is calculated relative to other rounds
 */
export type RoundStartMode =
  | "immediate"
  | "after_deploy"
  | "after_previous"
  | "sequential";

/**
 * @deprecated Use ScheduleTemplate instead
 */
export type BatchPlan = ScheduleTemplate;

/**
 * @deprecated Use ScheduleItem instead
 */
export type ResolvedRound = ScheduleItem & {
  /** Absolute start time in seconds */
  resolvedStartTime: number;
  /** Absolute end time in seconds */
  resolvedEndTime: number;
  /** Index in sequence */
  roundIndex: number;
};

// Storage for batch plans (separate key for backwards compat)
const BATCH_PLAN_KEY = "chronoplan_multi_round";

/**
 * @deprecated Use loadTemplates instead
 */
export function loadBatchPlans(): ScheduleTemplate[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(BATCH_PLAN_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * @deprecated Use saveTemplates instead
 */
export function saveBatchPlans(plans: ScheduleTemplate[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(BATCH_PLAN_KEY, JSON.stringify(plans));
}

/**
 * Resolves round times for display
 * @deprecated Use resolveStartTime instead
 */
export function resolveRoundTimes(
  schedules: ScheduleItem[],
  deploymentTime: number = Math.floor(Date.now() / 1000),
): ResolvedRound[] {
  if (schedules.length === 0) return [];

  const resolved: ResolvedRound[] = [];

  for (let i = 0; i < schedules.length; i++) {
    const round = schedules[i];
    const factor =
      TEMPORAL_UNITS.find((u) => u.key === round.durationUnit)?.factor || 86400;
    const startTime = deploymentTime + 60;
    const endTime = startTime + round.duration * factor;

    resolved.push({
      ...round,
      roundIndex: i + 1,
      resolvedStartTime: startTime,
      resolvedEndTime: endTime,
    });
  }

  return resolved;
}

/**
 * Calculates total amount across all rounds
 * @deprecated Use getTemplateTotalAmount instead
 */
export function calculateTotalAmount(schedules: ScheduleItem[]): string {
  const total = schedules.reduce(
    (sum: number, r: ScheduleItem) => sum + (parseFloat(r.amount) || 0),
    0,
  );
  return total.toFixed(2);
}

/**
 * Calculates total duration from first start to last end
 */
export function calculateTotalDuration(rounds: ResolvedRound[]): number {
  if (rounds.length === 0) return 0;
  const first = rounds[0].resolvedStartTime;
  const last = rounds[rounds.length - 1].resolvedEndTime;
  return last - first;
}

/**
 * Formats a round start mode for display
 * @deprecated
 */
export function formatRoundStartMode(mode: RoundStartMode): string {
  switch (mode) {
    case "immediate":
      return "Immediate";
    case "after_deploy":
      return "After deploy";
    case "after_previous":
      return "After previous";
    case "sequential":
      return "After previous ends";
  }
}

/**
 * Formats offset for display
 * @deprecated
 */
export function formatOffset(seconds: number, unit?: TemporalUnit): string {
  if (seconds === 0) return "0";
  const unitObj = unit
    ? {
        key: unit,
        label: unit,
        factor: TEMPORAL_UNITS.find((t) => t.key === unit)?.factor || 1,
      }
    : TEMPORAL_UNITS.find((t) => t.factor <= seconds) ||
      TEMPORAL_UNITS[TEMPORAL_UNITS.length - 1];
  const value = seconds / unitObj.factor;
  const formatted = value % 1 === 0 ? value.toString() : value.toFixed(1);
  return formatted + " " + unitObj.label;
}
