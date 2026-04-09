/**
 * useStarkZap - React hooks for StarkZap wallet integration
 */

"use client";

// Re-export stores
export { useSDKStore } from "../services/store/sdk";

export const useStarkZap = () => {
  const s = useSDKStore();
  return {
    address: s.address,
    isConnected: s.isConnected,
    isConnecting: s.isConnecting,
    error: s.error,
    chainId: s.chainId,
    networkName: s.networkName,
    isWrongNetwork: s.isWrongNetwork,
    isDeployed: s.isDeployed,
    connectWithCartridge: s.connectWithCartridge,
    disconnect: s.disconnect,
    execute: s.execute,
    balanceOf: s.balanceOf,
    getWallet: s.getWallet,
  };
};

import { useCallback, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import type { Call } from "starknet";
import type { Abi } from "abi-wan-kanabi";
import scaffoldConfig from "~~/scaffold.config";
import { callContract as callContractFn } from "~~/services/web3/starkzap";
import { useSDKStore } from "../services/store/sdk";

// ============================================================================
// Types
// ============================================================================

export interface UseStarkZapReturn {
  address: string | undefined;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | undefined;
  chainId: bigint | undefined;
  networkName: string;
  isWrongNetwork: boolean;
  isDeployed: boolean;
  connectWithCartridge: () => Promise<void>;
  disconnect: () => Promise<void>;
  execute: (calls: Call[]) => Promise<{
    txHash: string;
    explorerUrl: string;
    wait: () => Promise<void>;
  }>;
  balanceOf: (tokenAddress: string) => Promise<bigint>;
  getWallet: () => unknown;
}

export interface UseContractCallReturn<TData = unknown> {
  data: TData | undefined;
  isLoading: boolean;
  isFetching: boolean;
  error: string | undefined;
  refetch: () => void;
}

export interface UseContractWriteReturn {
  write: (calls: Call[]) => Promise<{
    txHash: string;
    explorerUrl: string;
    wait: () => Promise<void>;
  }>;
  isPending: boolean;
  txHash: string | undefined;
  error: string | undefined;
  isWrongNetwork: boolean;
  reset: () => void;
  isConnected: boolean;
}

export interface UseTokenBalanceReturn {
  balance: bigint | null;
  formattedBalance: string | null;
  isLoading: boolean;
  isFetching: boolean;
  error: string | undefined;
  refetch: () => void;
}

// ============================================================================
// Network utilities
// ============================================================================

const getTargetChainId = (): bigint => {
  return BigInt(scaffoldConfig.targetNetworks[0].id);
};

// ============================================================================
// useContractCall hook
// ============================================================================

export function useContractCall<TData = unknown>(
  address: string | undefined,
  abi: Abi | undefined,
  functionName: string,
  args?: (string | number | bigint)[],
  options: {
    watch?: boolean;
    enabled?: boolean;
    /** Custom query key for cache invalidation - use scheduleKeys from ~~/hooks/query-keys */
    queryKey?: readonly unknown[];
  } = {},
): UseContractCallReturn<TData> {
  const { watch = false, enabled = true, queryKey: customQueryKey } = options;

  const queryFn = useCallback(async (): Promise<TData | undefined> => {
    if (!enabled || !address || !abi) return undefined;
    try {
      const result = await callContractFn(address, functionName, args);
      return result as TData;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Contract call failed";
      throw new Error(errorMessage);
    }
  }, [address, abi, functionName, args, enabled]);

  // Use custom query key if provided, otherwise use default
  const queryKey = customQueryKey ?? [
    "contract-call",
    address,
    functionName,
    JSON.stringify(args),
  ];

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey,
    queryFn,
    enabled: enabled && !!address && !!abi,
    staleTime: watch ? 30_000 : 60_000,
    refetchInterval: watch ? 30_000 : false,
    retry: 2,
    retryDelay: (attemptIndex: number) =>
      Math.min(1000 * 2 ** attemptIndex, 10000),
  });

  return {
    data,
    isLoading,
    isFetching,
    error: error?.message,
    refetch,
  };
}

// ============================================================================
// useContractWrite hook
// ============================================================================

export function useContractWrite(): UseContractWriteReturn {
  const isConnected = useSDKStore((s) => s.isConnected);
  const isWrongNetwork = useSDKStore((s) => s.isWrongNetwork);
  const chainId = useSDKStore((s) => s.chainId);
  const execute = useSDKStore((s) => s.execute);

  const mutationFn = useCallback(
    async (calls: Call[]) => {
      if (!isConnected) throw new Error("Wallet not connected");
      if (isWrongNetwork) {
        console.warn(
          "Sending transaction on wrong network. Wallet chain ID:",
          chainId?.toString(16),
          "Expected:",
          getTargetChainId().toString(16),
        );
      }
      return execute(calls);
    },
    [execute, isConnected, isWrongNetwork, chainId],
  );

  const mutation = useMutation({
    mutationFn,
  });

  return {
    write: mutation.mutateAsync,
    isPending: mutation.isPending,
    txHash: mutation.data?.txHash,
    error: mutation.error?.message,
    isWrongNetwork,
    reset: mutation.reset,
    isConnected,
  };
}

// ============================================================================
// useTokenBalance hook
// ============================================================================

export function useTokenBalance(
  tokenAddress: string | undefined,
  decimals: number = 18,
  symbol?: string,
): UseTokenBalanceReturn {
  const address = useSDKStore((s) => s.address);
  const balanceOf = useSDKStore((s) => s.balanceOf);

  const queryFn = useCallback(async (): Promise<bigint | null> => {
    if (!address || !tokenAddress) return null;
    try {
      return await balanceOf(tokenAddress);
    } catch (err) {
      console.error(`Failed to fetch ${symbol || "token"} balance:`, err);
      throw err;
    }
  }, [address, tokenAddress, symbol, balanceOf]);

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ["token-balance", tokenAddress, address],
    queryFn,
    enabled: !!address && !!tokenAddress,
    staleTime: 30_000,
    retry: 2,
  });

  const formattedBalance = useMemo(() => {
    if (data === null || data === undefined) return null;
    const divisor = 10n ** BigInt(decimals);
    const whole = data / divisor;
    const fractional = data % divisor;
    const fractionalStr = fractional.toString().padStart(decimals, "0");
    const formatted = `${whole.toLocaleString("en-US")}.${fractionalStr.slice(0, 4)}`;
    return `${formatted} ${symbol || ""}`.trim();
  }, [data, decimals, symbol]);

  return {
    balance: data ?? null,
    formattedBalance,
    isLoading,
    isFetching,
    error: error?.message,
    refetch,
  };
}
