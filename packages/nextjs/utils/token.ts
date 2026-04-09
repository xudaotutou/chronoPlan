/**
 * Token utilities using starkzap Amount class
 */
import { Amount, type Token } from "starkzap";

/**
 * Convert a human-readable token amount to Cairo u256 calldata format [low, high]
 * Used for smart contract calls
 */

/**
 * Convert a human-readable token amount to wei string
 */
export function tokenToWei(tokenAmount: string, decimals: number): string {
  if (!tokenAmount || tokenAmount === "") return "0";
  try {
    const amount = Amount.parse(tokenAmount, decimals);
    return amount.toBase().toString();
  } catch {
    return "0";
  }
}

export function amountToCalldata(
  tokenAmount: string,
  token: Token,
): [string, string] {
  if (!tokenAmount || tokenAmount === "") {
    return ["0", "0"];
  }

  try {
    const amount = Amount.parse(tokenAmount, token);
    const rawValue = amount.toBase();
    return bigIntToU256Calldata(rawValue);
  } catch {
    return ["0", "0"];
  }
}

/**
 * Convert a human-readable token amount to Cairo u256 calldata format [low, high]
 * Using explicit decimals (for tokens not in presets)
 */
export function amountToCalldataWithDecimals(
  tokenAmount: string,
  decimals: number,
): [string, string] {
  if (!tokenAmount || tokenAmount === "") {
    return ["0", "0"];
  }

  try {
    const amount = Amount.parse(tokenAmount, decimals);
    const rawValue = amount.toBase();
    return bigIntToU256Calldata(rawValue);
  } catch {
    return ["0", "0"];
  }
}

/**
 * Convert a raw bigint to Cairo u256 calldata format [low, high]
 */
export function bigIntToU256Calldata(value: bigint): [string, string] {
  const low = (value & ((1n << 128n) - 1n)).toString();
  const high = (value >> 128n).toString();
  return [low, high];
}

/**
 * Parse amount with explicit decimals (for tokens not in presets)
 */
export function parseAmountToBigInt(
  tokenAmount: string,
  decimals: number,
  symbol?: string,
): bigint {
  if (!tokenAmount || tokenAmount === "") return 0n;

  try {
    const amount = Amount.parse(tokenAmount, decimals, symbol);
    return amount.toBase();
  } catch {
    return 0n;
  }
}

/**
 * Format a raw bigint balance for display
 */
export function formatBalance(
  balance: bigint,
  decimals: number,
  symbol: string,
  compressed = false,
): string {
  const amount = Amount.fromRaw(balance, decimals, symbol);
  return amount.toFormatted(compressed);
}
