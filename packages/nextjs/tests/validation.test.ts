/**
 * Validation utility tests for ChronoPlan vesting deployer
 */

import { describe, it, expect } from "vitest";
import { bigIntToU256Calldata } from "../utils/token";

// ── Validation Helpers (extracted from page.tsx for testing) ──────────────

const U256_MAX = BigInt(
  "115792089237316195423570985008687907853269984665640564039457584007913129639935",
);

function isValidStarknetAddress(addr: string): boolean {
  return /^0x[0-9a-fA-F]{64}$/.test(addr);
}

function isValidAmount(amount: string): boolean {
  if (!amount || amount.trim() === "") return false;
  // Must be a valid positive number (reject partial parsing like "12abc")
  const trimmed = amount.trim();
  // Allow numbers with optional decimal, and scientific notation
  if (!/^\d+(\.\d+)?([eE][+-]?\d+)?$/.test(trimmed)) return false;
  const num = parseFloat(trimmed);
  return !isNaN(num) && isFinite(num) && num > 0;
}

function isValidU256Amount(amountWei: string): boolean {
  if (!amountWei || amountWei.trim() === "") return false;
  try {
    const amount = BigInt(amountWei);
    return amount >= 0n && amount <= U256_MAX;
  } catch {
    return false;
  }
}

// ── Tests ─────────────────────────────────────────────────────────────────

describe("isValidStarknetAddress", () => {
  it("accepts valid 64-char hex addresses", () => {
    expect(
      isValidStarknetAddress(
        "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d",
      ),
    ).toBe(true);
    expect(
      isValidStarknetAddress(
        "0x0000000000000000000000000000000000000000000000000000000000000001",
      ),
    ).toBe(true);
  });

  it("rejects addresses with wrong length", () => {
    expect(isValidStarknetAddress("0x1234")).toBe(false);
    expect(
      isValidStarknetAddress(
        "0x123456789012345678901234567890123456789012345678901234567890123",
      ),
    ).toBe(false); // 65 chars (63 hex)
    expect(
      isValidStarknetAddress(
        "0x12345678901234567890123456789012345678901234567890123456789012345",
      ),
    ).toBe(false); // 67 chars (65 hex)
  });

  it("rejects addresses without 0x prefix", () => {
    expect(
      isValidStarknetAddress(
        "1234567890123456789012345678901234567890123456789012345678901234",
      ),
    ).toBe(false);
  });

  it("rejects non-hex characters", () => {
    expect(
      isValidStarknetAddress(
        "0xzzzz0000000000000000000000000000000000000000000000000000000000z",
      ),
    ).toBe(false);
  });

  it("rejects empty or invalid input", () => {
    expect(isValidStarknetAddress("")).toBe(false);
    expect(isValidStarknetAddress("0x")).toBe(false);
    expect(isValidStarknetAddress("0x1")).toBe(false);
  });

  it("accepts mixed case hex", () => {
    expect(isValidStarknetAddress("0x" + "A".repeat(64))).toBe(true); // 66 chars total, 64 hex
  });
});

describe("isValidAmount", () => {
  it("accepts valid positive numbers", () => {
    expect(isValidAmount("100")).toBe(true);
    expect(isValidAmount("0.5")).toBe(true);
    expect(isValidAmount("1000000.123456")).toBe(true);
    expect(isValidAmount("1e18")).toBe(true);
  });

  it("rejects zero and negative", () => {
    expect(isValidAmount("0")).toBe(false);
    expect(isValidAmount("-1")).toBe(false);
    expect(isValidAmount("-100.5")).toBe(false);
  });

  it("rejects non-numeric strings", () => {
    expect(isValidAmount("abc")).toBe(false);
    expect(isValidAmount("12abc")).toBe(false);
    expect(isValidAmount("")).toBe(false);
    expect(isValidAmount("   ")).toBe(false);
  });

  it("rejects Infinity and NaN", () => {
    expect(isValidAmount("Infinity")).toBe(false);
    expect(isValidAmount("NaN")).toBe(false);
  });
});

describe("isValidU256Amount", () => {
  it("accepts valid u256 amounts", () => {
    expect(isValidU256Amount("0")).toBe(true);
    expect(isValidU256Amount("1")).toBe(true);
    expect(isValidU256Amount("1000000000000000000")).toBe(true); // 1 ETH in wei
    expect(
      isValidU256Amount(
        "115792089237316195423570985008687907853269984665640564039457584007913129639935",
      ),
    ).toBe(true); // Max u256
  });

  it("rejects amounts exceeding u256 max", () => {
    expect(
      isValidU256Amount(
        "115792089237316195423570985008687907853269984665640564039457584007913129639936",
      ),
    ).toBe(false);
    expect(
      isValidU256Amount(
        "1000000000000000000000000000000000000000000000000000000000000000000000000000000",
      ),
    ).toBe(false);
  });

  it("rejects invalid strings", () => {
    expect(isValidU256Amount("")).toBe(false);
    expect(isValidU256Amount("abc")).toBe(false);
    expect(isValidU256Amount("-1")).toBe(false);
  });

  it("handles BigInt edge cases", () => {
    expect(isValidU256Amount((BigInt(2 ** 256) - 1n).toString())).toBe(true);
    expect(isValidU256Amount(BigInt(2 ** 256).toString())).toBe(false);
  });
});

describe("bigIntToU256Calldata", () => {
  it("handles zero correctly", () => {
    const [lo, hi] = bigIntToU256Calldata(0n);
    expect(lo).toBe("0");
    expect(hi).toBe("0");
  });

  it("handles small numbers correctly", () => {
    const [lo, hi] = bigIntToU256Calldata(100n);
    expect(lo).toBe("100");
    expect(hi).toBe("0");
  });

  it("handles numbers that span both low and high parts", () => {
    // 2^128 = 340282366920938463463374607431768211456
    const [lo, hi] = bigIntToU256Calldata(1n << 128n);
    expect(lo).toBe("0");
    expect(hi).toBe("1");
  });

  it("handles max u256 correctly", () => {
    const maxU256 = (1n << 256n) - 1n;
    const [lo, hi] = bigIntToU256Calldata(maxU256);
    // Both parts should be all Fs
    expect(lo).toBe("340282366920938463463374607431768211455");
    expect(hi).toBe("340282366920938463463374607431768211455");
  });

  it("reconstructs correctly", () => {
    const original = 12345678901234567890n;
    const [lo, hi] = bigIntToU256Calldata(original);
    const reconstructed = (BigInt(hi) << 128n) + BigInt(lo);
    expect(reconstructed).toBe(original);
  });
});
