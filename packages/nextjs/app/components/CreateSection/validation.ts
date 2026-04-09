"use client";

const U256_MAX = BigInt(
  "115792089237316195423570985008687907853269984665640564039457584007913129639935",
);

export function isValidStarknetAddress(addr: string): boolean {
  return /^0x[0-9a-fA-F]{64}$/.test(addr);
}

export function isValidAmount(amount: string): boolean {
  if (!amount || amount.trim() === "") return false;
  const num = parseFloat(amount);
  return !isNaN(num) && isFinite(num) && num > 0;
}

export function isValidU256Amount(amountWei: string): boolean {
  if (!amountWei || amountWei.trim() === "") return false;
  try {
    const amount = BigInt(amountWei);
    return amount >= 0n && amount <= U256_MAX;
  } catch {
    return false;
  }
}

export const MIN_DURATION_SECONDS = 60;
