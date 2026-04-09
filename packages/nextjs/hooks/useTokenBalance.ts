"use client";

import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSDKStore } from "~~/hooks/useStarkZap";
import { sepoliaTokens, type Token } from "starkzap";
import { tokenKeys } from "~~/hooks/query-keys";
type UseTokenBalanceProps = {
  token: Token;
  address?: string;
};

type TokenBalance = {
  balance: bigint | null;
  formatted: string;
  formattedWithSymbol: string;
  symbol: string;
  decimals: number;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
};

/**
 * Hook to get token balance using callContract() directly
 * Uses TanStack Query for automatic caching and deduplication
 */
export function useTokenBalance({
  token,
  address,
}: UseTokenBalanceProps): TokenBalance {
  const wallet = useSDKStore((s) => s.wallet);
  const isConnected = useSDKStore((s) => s.isConnected);

  const queryFn = useCallback(async (): Promise<bigint | null> => {
    if (!wallet || !address) return null;

    try {
      // Use callContract directly since wallet.balanceOf() may not be implemented
      const result = await wallet.callContract({
        contractAddress: token.address as `0x${string}`,
        entrypoint: "balance_of",
        calldata: [address],
      });

      // Result is typically [low, high] for u256
      const resultArray = result as string[];
      if (!resultArray || resultArray.length === 0) return null;

      // Parse u256 result
      if (resultArray.length === 1) {
        // Single value (already a bigint string)
        return BigInt(resultArray[0]);
      } else if (resultArray.length === 2) {
        // [low, high] format for u256
        const low = BigInt(resultArray[0]);
        const high = BigInt(resultArray[1]);
        return (high << 128n) | low;
      }

      return null;
    } catch (err) {
      console.error(`Failed to fetch ${token.symbol} balance:`, err);
      throw err;
    }
  }, [wallet, address, token]);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: tokenKeys.balance(token.symbol, address),
    queryFn,
    enabled: isConnected && !!address,
    staleTime: 30_000, // 30 seconds
    refetchInterval: false, // Don't auto-refresh
    retry: 2,
  });

  return {
    balance: data ?? null,
    // Handle both null and undefined
    formatted: data != null ? formatBalance(data, token.decimals) : "0",
    formattedWithSymbol:
      data != null
        ? `${formatBalance(data, token.decimals)} ${token.symbol}`
        : `0 ${token.symbol}`,
    symbol: token.symbol,
    decimals: token.decimals,
    isLoading,
    isError,
    error: error as Error | null,
    refetch,
  };
}

// Helper function to format balance
function formatBalance(balance: bigint, decimals: number): string {
  const divisor = 10n ** BigInt(decimals);
  const integerPart = balance / divisor;
  const fractionalPart = balance % divisor;
  const fractionalStr = fractionalPart.toString().padStart(decimals, "0");
  // Show up to 4 decimal places
  const formatted = `${integerPart.toLocaleString()}.${fractionalStr.slice(0, 4)}`;
  return formatted.replace(/\.?0+$/, ""); // Remove trailing zeros
}

/**
 * Hook to get STRK balance specifically
 */
export function useStrkBalance(address?: string): TokenBalance {
  return useTokenBalance({
    token: sepoliaTokens.STRK,
    address,
  });
}
