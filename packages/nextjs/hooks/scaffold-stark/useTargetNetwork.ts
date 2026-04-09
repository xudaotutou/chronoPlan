import { useMemo } from "react";
import scaffoldConfig from "~~/scaffold.config";
import { ChainWithAttributes } from "~~/utils/scaffold-stark";

/**
 * Retrieves the target network from scaffold config.
 *
 * NOTE: Previously this hook tried to sync with wallet chainId via Zustand,
 * but this caused render loops when the wallet connected.
 *
 * Now returns the static config network to avoid re-renders.
 */
export function useTargetNetwork(): {
  targetNetwork: ChainWithAttributes;
} {
  // Simply return the configured network - don't try to sync with wallet
  const targetNetwork = useMemo(
    () => scaffoldConfig.targetNetworks[0],
    [], // Empty deps = never changes
  );

  return {
    targetNetwork,
  };
}
