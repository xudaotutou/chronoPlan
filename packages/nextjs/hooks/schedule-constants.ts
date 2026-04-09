/**
 * Schedule Contract Constants
 *
 * Centralized configuration for all schedule-related contract addresses and ABIs.
 */

import deployedContracts from "~~/contracts/deployedContracts";

// ============================================================================
// Network Configuration
// ============================================================================

/** Currently targeted network: sepolia */
export const NETWORK = "sepolia" as const;

// ============================================================================
// Contract Addresses
// ============================================================================

/** Factory contract address on Sepolia */
export const FACTORY_ADDRESS =
  deployedContracts[NETWORK]?.Factory?.address || "";

/** Registry contract address on Sepolia */
export const REGISTRY_ADDRESS =
  deployedContracts[NETWORK]?.Registry?.address || "";

// ============================================================================
// Contract ABIs
// ============================================================================

/** Registry contract ABI */
export const REGISTRY_ABI = deployedContracts[NETWORK]?.Registry?.abi as any;

/** ScheduleProxy contract ABI */
export const SCHEDULE_ABI = deployedContracts[NETWORK]?.ScheduleProxy
  ?.abi as any;

// ============================================================================
// Curve Configuration
// ============================================================================

/** Supported curve types */
export const CURVE_KEYS = {
  LINEAR: "LINEAR",
  CLIFF: "CLIFF",
  EXP_DECAY: "EXP_DECAY",
} as const;

export type CurveKey = (typeof CURVE_KEYS)[keyof typeof CURVE_KEYS];

// ============================================================================
// u256 Parsing Utilities
// ============================================================================

/**
 * Parse u256 value from various RPC response formats
 * RPC returns u256 as array: [low, high] or object: {low, high}
 */
export function parseU256(value: unknown): { low: bigint; high: bigint } {
  // Handle array format ['0x...', '0x...']
  if (Array.isArray(value) && value.length >= 2) {
    return {
      low: typeof value[0] === "bigint" ? value[0] : BigInt(String(value[0])),
      high: typeof value[1] === "bigint" ? value[1] : BigInt(String(value[1])),
    };
  }

  // Handle object format {low, high}
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const obj = value as Record<string, unknown>;
    return {
      low:
        typeof obj.low === "bigint" ? obj.low : BigInt(String(obj.low || "0")),
      high:
        typeof obj.high === "bigint"
          ? obj.high
          : BigInt(String(obj.high || "0")),
    };
  }

  // Handle bigint directly
  if (typeof value === "bigint") {
    return {
      low: value & ((1n << 128n) - 1n),
      high: value >> 128n,
    };
  }

  // Handle string (single hex/number)
  if (typeof value === "string") {
    const parsed = BigInt(value);
    return {
      low: parsed & ((1n << 128n) - 1n),
      high: parsed >> 128n,
    };
  }

  // Default to zero
  return { low: 0n, high: 0n };
}

/**
 * Convert u256 parts to total value in smallest units
 */
export function u256ToBigInt(low: bigint, high: bigint): bigint {
  return (high << 128n) | low;
}

/**
 * Convert u256 to formatted decimal string with specified decimals
 */
export function formatU256(
  value: unknown,
  decimals: number = 18,
  maxDecimals: number = 4,
): string {
  const { low, high } = parseU256(value);
  const total = u256ToBigInt(low, high);

  if (total === 0n) return "0";

  const divisor = 10n ** BigInt(decimals);
  const whole = total / divisor;
  const fractional = total % divisor;

  const wholeStr = whole.toLocaleString("en-US");

  if (maxDecimals === 0) return wholeStr;

  const fractionalStr = fractional
    .toString()
    .padStart(decimals, "0")
    .slice(0, maxDecimals);
  const trimmedFractional = fractionalStr.replace(/0+$/, "");

  return trimmedFractional ? `${wholeStr}.${trimmedFractional}` : wholeStr;
}

// ============================================================================
// PlanStatus Enum - extracted from ABI
// ============================================================================

type EnumVariant = { name: string; type: string };

/**
 * Extract enum variants from ABI by enum type name
 */
function getEnumFromAbi(abi: any, enumTypeName: string): EnumVariant[] | null {
  if (!abi || !Array.isArray(abi)) return null;

  const enumDef = abi.find(
    (item: any) =>
      item.type === "enum" &&
      (item.name === enumTypeName || item.name?.endsWith(enumTypeName)),
  );

  if (enumDef?.variants) {
    return enumDef.variants;
  }
  return null;
}

/**
 * Create a status mapping from enum variants
 * Returns { 0: "Active", 1: "Completed", 2: "Closed" } etc.
 */
function createEnumMapping(
  variants: EnumVariant[] | null,
): Record<number, string> {
  if (!variants) {
    // Fallback to Cairo enum default order: Active, Completed, Closed
    return { 0: "Active", 1: "Completed", 2: "Closed" };
  }

  const mapping: Record<number, string> = {};
  variants.forEach((variant, index) => {
    mapping[index] = variant.name;
  });
  return mapping;
}

// PlanStatus enum from Cairo contract:
// enum PlanStatus { Active, Completed, Closed }
// Active = 0, Completed = 1, Closed = 2
const PLAN_STATUS_VARIANTS = getEnumFromAbi(SCHEDULE_ABI, "PlanStatus");

export const PLAN_STATUS = createEnumMapping(PLAN_STATUS_VARIANTS);

export type PlanStatus = keyof typeof PLAN_STATUS extends number
  ? keyof typeof PLAN_STATUS
  : number;

/**
 * Parse PlanStatus from various RPC response formats
 * Supports: number, string ("0x1", "1"), array (["0x1"]), object ({Active: ()})
 */
export function parsePlanStatus(value: unknown): number {
  // Handle array format like ['0x1'] or ['1']
  if (Array.isArray(value) && value.length > 0) {
    return parsePlanStatus(value[0]);
  }

  // Direct number
  if (typeof value === "number") {
    return value;
  }

  // Object format: {Active: ()} or {0: ()} etc
  if (typeof value === "object" && value !== null) {
    const obj = value as Record<string, unknown>;

    // Check variant names
    for (const [key, val] of Object.entries(obj)) {
      if (val === null || val === undefined) {
        const idx = Object.values(PLAN_STATUS).indexOf(key);
        if (idx !== -1) return idx;
      }
    }

    // Check numeric keys
    const keys = Object.keys(obj);
    if (keys.length === 1) {
      const num = parseInt(keys[0], 10);
      if (!isNaN(num) && num >= 0) return num;
    }
  }

  // String (hex or decimal)
  if (typeof value === "string") {
    const trimmed = value.trim();

    // Try hex (0x0, 0x1, 0x2)
    if (trimmed.startsWith("0x")) {
      const hexVal = parseInt(trimmed, 16);
      if (!isNaN(hexVal) && hexVal >= 0) return hexVal;
    }

    // Try decimal
    const num = parseInt(trimmed, 10);
    if (!isNaN(num) && num >= 0) return num;
  }

  // Default to Active (0)
  return 0;
}
