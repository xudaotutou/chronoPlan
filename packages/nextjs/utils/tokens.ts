/**
 * Token utilities using starkzap for address management
 *
 * Uses environment variable NEXT_PUBLIC_CHRONOPLAN_NETWORK to determine
 * which network's tokens to use:
 * - "sepolia" (default) - use sepolia tokens
 * - "mainnet" - use mainnet tokens
 */

import { mainnetTokens, sepoliaTokens, type Token } from "starkzap";

// Network type
export type ChronoPlanNetwork = "sepolia" | "mainnet";

// Get network from environment variable
export function getChronoPlanNetwork(): ChronoPlanNetwork {
  const network = process.env.NEXT_PUBLIC_CHRONOPLAN_NETWORK;
  if (network === "mainnet") return "mainnet";
  return "sepolia"; // default to sepolia
}

// Get all tokens for current network
export function getTokens(): Record<string, Token> {
  const network = getChronoPlanNetwork();
  return network === "mainnet" ? mainnetTokens : sepoliaTokens;
}

// Get specific token
export function getToken(symbol: string): Token | undefined {
  const tokens = getTokens();
  return tokens[symbol as keyof typeof tokens];
}

// Popular token symbols
export const POPULAR_SYMBOLS = ["STRK", "ETH", "USDC"];

// Get popular token addresses for price API
export function getPopularTokenAddresses(): string[] {
  const tokens = getTokens();
  const result: string[] = [];
  for (const symbol of POPULAR_SYMBOLS) {
    const token = tokens[symbol as keyof typeof tokens];
    if (token?.address) {
      result.push(token.address.toString());
    }
  }
  return result;
}

// Build address to symbol map
export function getAddressToSymbol(): Record<string, string> {
  const tokens = getTokens();
  const map: Record<string, string> = {};
  for (const [symbol, token] of Object.entries(tokens)) {
    if (token.address) {
      map[token.address.toString().toLowerCase()] = symbol;
    }
  }
  return map;
}
