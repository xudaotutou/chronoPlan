/**
 * Manages native currency price using TanStack Query.
 *
 * Direct Avnu API calls from frontend (no backend proxy needed)
 */

// Avnu Price API endpoint (direct browser call)
const AVNU_PRICE_API = "https://starknet.impulse.avnu.fi/v3/tokens/prices";

import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { mainnetTokens } from "starkzap";

/**
 * Fetch native currency (STRK) price from Avnu API directly
 */
const fetchNativeCurrencyPrice = async (): Promise<number> => {
  const strkAddress = mainnetTokens.STRK?.address?.toString();
  if (!strkAddress) return 0;

  const response = await fetch(AVNU_PRICE_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ tokens: [strkAddress] }),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch price: ${response.status}`);
  }

  const prices = await response.json();

  // Find STRK price
  const strkPrice = prices.find(
    (p: any) => p.address.toLowerCase() === strkAddress.toLowerCase(),
  );

  // Prefer starknetMarket price, fallback to globalMarket
  return strkPrice?.starknetMarket?.usd ?? strkPrice?.globalMarket?.usd ?? 0;
};

/**
 * Hook that manages native currency price with TanStack Query.
 * This no longer updates global state to avoid infinite render loops.
 */
export const useNativeCurrencyPrice = (): void => {
  // No-op: This hook previously synced to Zustand, causing render loops.
  // Use useNativeCurrencyPriceDirect() in components instead.
};

/**
 * Direct hook to get price using TanStack Query.
 * RECOMMENDED: Use this in components instead of global state.
 */
export const useNativeCurrencyPriceDirect = (): UseQueryResult<number> => {
  return useQuery({
    queryKey: ["native-currency-price"],
    queryFn: fetchNativeCurrencyPrice,
    staleTime: 5 * 60 * 1000, // 5 minutes - price does not need frequent updates
    refetchInterval: false, // Disable auto-refetch
    refetchOnWindowFocus: false, // Disable to prevent extra requests on tab switch
    retry: 2,
    retryDelay: (attemptIndex: number) =>
      Math.min(1000 * 2 ** attemptIndex, 10000),
  });
};
