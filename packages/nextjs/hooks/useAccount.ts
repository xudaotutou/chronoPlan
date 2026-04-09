import { useMemo } from "react";
import { useStarkZap } from "~~/hooks/useStarkZap";

// Re-export UseAccountResult type for backward compatibility
export type UseAccountResult = {
  address: `0x${string}` | undefined;
  status: "disconnected" | "connecting" | "connected" | "reconnecting";
  chainId: bigint | undefined;
  isConnected: boolean | undefined;
  connector: unknown;
};

/**
 * Wrapper around starkzap's useStarkZap hook.
 * Provides connection status with corrected state handling.
 *
 * @returns {UseAccountResult} An object containing:
 *   - address: `0x${string}` | undefined - The user's wallet address
 *   - status: "disconnected" | "connecting" | "connected" | "reconnecting" - Connection status
 *   - chainId: bigint | undefined - The chain ID of the connected network
 *   - isConnected: boolean | undefined - Boolean indicating if the user is connected
 *   - connector: WalletWithStarknetFeatures | undefined - The connected wallet (legacy, always undefined)
 */

export function useAccount(): UseAccountResult {
  const { address, isConnected, isConnecting, chainId } = useStarkZap();

  const correctedStatus = useMemo(() => {
    if (isConnecting) {
      return "connecting" as const;
    }
    if (isConnected) {
      return "connected" as const;
    }
    return "disconnected" as const;
  }, [isConnected, isConnecting]);

  return {
    address: address as `0x${string}` | undefined,
    status: correctedStatus,
    chainId,
    isConnected,
    connector: undefined, // Legacy - starkzap doesn't expose connector
  };
}
