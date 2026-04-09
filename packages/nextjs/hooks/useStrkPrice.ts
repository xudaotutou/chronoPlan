/**
 * useStrkPrice - React hook for fetching ERC20/USD prices
 *
 * Direct Avnu API calls from frontend (no backend proxy needed)
 * API: POST https://starknet.impulse.avnu.fi/v3/tokens/prices
 */

"use client";

import { useQuery } from "@tanstack/react-query";
import { sepoliaTokens, mainnetTokens } from "starkzap";

// Avnu Price API endpoint (direct browser call)
const AVNU_PRICE_API = "https://starknet.impulse.avnu.fi/v3/tokens/prices";

// Popular token symbols
export const POPULAR_SYMBOLS = [
  "STRK",
  "ETH",
  "USDC",
  "USDT",
  "WBTC",
  "DAI",
] as const;

// Get sepolia address (for transfers)
export function getSepoliaAddress(symbol: string): string | undefined {
  const token = sepoliaTokens[symbol as keyof typeof sepoliaTokens];
  return token?.address?.toString();
}

// Normalize address (remove leading zeros, lowercase)
function normalizeAddress(addr: string): string {
  try {
    return "0x" + BigInt(addr).toString(16);
  } catch {
    return addr.toLowerCase();
  }
}

// Get mainnet address (for prices - Avnu supports mainnet)
export function getMainnetAddress(symbol: string): string | undefined {
  const token = mainnetTokens[symbol as keyof typeof mainnetTokens];
  if (!token?.address) return undefined;
  return normalizeAddress(token.address.toString());
}

export type TokenSymbol = (typeof POPULAR_SYMBOLS)[number] | string;

export interface UseTokenPriceOptions {
  refetchInterval?: number | false;
  refetchOnWindowFocus?: boolean;
  staleTime?: number;
  retry?: number;
}

export interface UseTokenPriceReturn {
  price: number | undefined;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  error: Error | null;
  dataUpdatedAt: number | undefined;
  refetch: () => void;
}

// Avnu API response type
interface AvnuPrice {
  address: string;
  decimals: number;
  starknetMarket?: { usd: number };
  globalMarket?: { usd: number };
}

// Avnu API response type
interface PriceApiResponse {
  prices: Record<string, { usd: number; decimals: number }>;
  timestamp: number;
}

/**
 * Fetch prices directly from Avnu API (browser-side)
 */
async function fetchPricesFromAvnu(
  mainnetAddresses: string[],
): Promise<Record<string, { usd: number; decimals: number }>> {
  try {
    const response = await fetch(AVNU_PRICE_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ tokens: mainnetAddresses }),
    });

    if (!response.ok) {
      throw new Error(`Avnu API error: ${response.status}`);
    }

    const avnuPrices: AvnuPrice[] = await response.json();

    // Transform Avnu response to our format
    const prices: Record<string, { usd: number; decimals: number }> = {};
    for (const p of avnuPrices) {
      // Prefer starknetMarket price, fallback to globalMarket
      const usd = p.starknetMarket?.usd ?? p.globalMarket?.usd ?? 0;
      prices[p.address.toLowerCase()] = { usd, decimals: p.decimals };
    }

    return prices;
  } catch (error) {
    console.error("[useStrkPrice] Avnu API error:", error);
    throw error;
  }
}

/**
 * Get batch prices with optimized query key
 */
function useBatchPricesInternal(
  mainnetAddresses: string[],
  options: UseTokenPriceOptions = {},
) {
  const {
    refetchInterval = false,
    refetchOnWindowFocus = false,
    staleTime = 5 * 60 * 1000,
    retry = 2,
  } = options;

  const normalizedAddresses = mainnetAddresses
    .map((a) => a.toLowerCase())
    .sort();
  const queryKey = `prices-${normalizedAddresses.join(",")}`;

  return useQuery({
    queryKey: [queryKey],
    queryFn: () => fetchPricesFromAvnu(normalizedAddresses),
    staleTime,
    refetchInterval,
    refetchOnWindowFocus,
    retry,
    retryDelay: (attemptIndex: number) =>
      Math.min(1000 * 2 ** attemptIndex, 10000),
  });
}

/**
 * Hook to fetch token/USD price
 */
export function useTokenPrice(
  symbol: string,
  options: UseTokenPriceOptions = {},
): UseTokenPriceReturn {
  // getMainnetAddress already returns normalized address
  const mainnetAddress = getMainnetAddress(symbol) || "";

  // Validate address format (0x + hex chars)
  const isValidAddress = /^0x[0-9a-f]+$/i.test(mainnetAddress);

  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
    dataUpdatedAt,
    refetch,
  } = useBatchPricesInternal(isValidAddress ? [mainnetAddress] : [], options);

  if (!isValidAddress) {
    return {
      price: undefined,
      isLoading: false,
      isFetching: false,
      isError: true,
      error: new Error(`Invalid token symbol: ${symbol}`),
      dataUpdatedAt: undefined,
      refetch: () => {},
    };
  }

  return {
    price: data?.[mainnetAddress]?.usd,
    isLoading,
    isFetching,
    isError,
    error: error as Error | null,
    dataUpdatedAt,
    refetch,
  };
}

/**
 * Hook for formatted price display
 */
export function useTokenPriceFormatted(
  symbol: string,
  options: UseTokenPriceOptions = {},
) {
  const { price, isLoading, isError, ...rest } = useTokenPrice(symbol, options);
  return {
    formattedPrice: price !== undefined ? price.toFixed(2) : undefined,
    currency: "USD" as const,
    price,
    isLoading,
    isError,
    ...rest,
  };
}

/**
 * Hook to fetch prices for multiple tokens in one request
 */
export function usePopularTokenPrices(
  symbols: string[] = [...POPULAR_SYMBOLS],
) {
  // Get valid addresses only (already normalized in getMainnetAddress)
  const mainnetAddresses: string[] = [];
  const symbolToAddress: Record<string, string> = {};

  for (const symbol of symbols) {
    const addr = getMainnetAddress(symbol);
    if (addr) {
      mainnetAddresses.push(addr);
      symbolToAddress[symbol] = addr;
    }
  }

  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
    dataUpdatedAt,
    refetch,
  } = useBatchPricesInternal(mainnetAddresses);

  // Build result map
  const prices: Record<string, number | undefined> = {};
  for (const symbol of symbols) {
    const addr = symbolToAddress[symbol];
    prices[symbol] = addr && data ? data[addr]?.usd : undefined;
  }

  return {
    prices,
    getPrice: (symbol: string) => prices[symbol],
    isLoading,
    isFetching,
    isError,
    error: error as Error | null,
    dataUpdatedAt,
    refetch,
  };
}

// Backward compatibility
export const useStrkPrice = (options?: UseTokenPriceOptions) =>
  useTokenPrice("STRK", options);

export const useStrkPriceFormatted = (options?: UseTokenPriceOptions) =>
  useTokenPriceFormatted("STRK", options);

// Token addresses for sepolia (for transfers)
export const TOKEN_ADDRESSES: Record<string, string> = {
  STRK: getSepoliaAddress("STRK") || "",
  ETH: getSepoliaAddress("ETH") || "",
  USDC: getSepoliaAddress("USDC") || "",
};
