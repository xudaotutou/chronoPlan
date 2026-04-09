import { useEffect, useState } from "react";
import { useDeployedContractInfo } from "./useDeployedContractInfo";
import { useContractCall } from "~~/hooks/useStarkZap";
import { BlockNumber } from "starknet";
import { Abi } from "abi-wan-kanabi";
import { formatUnits } from "ethers";

type UseScaffoldStrkBalanceProps = {
  address?: `0x${string}` | string;
};

/**
 * Fetches STRK token balance for a given address.
 * This hook reads the balance_of function from the STRK token contract
 * and provides both raw and formatted balance values.
 *
 * @param config - Configuration object for the hook
 * @param config.address - The address to check STRK balance for (optional)
 * @returns {Object} An object containing:
 *   - value: bigint - The raw balance as bigint
 *   - decimals: number - Token decimals (18)
 *   - symbol: string - Token symbol ("STRK")
 *   - formatted: string - Formatted balance as string, defaults to "0" if no data
 *   - error: Error | null - Any error encountered during the read operation
 *   - isLoading: boolean - Whether the balance is being fetched
 * @see {@link https://scaffoldstark.com/docs/hooks/useScaffoldStrkBalance}
 */

const useScaffoldStrkBalance = ({ address }: UseScaffoldStrkBalanceProps) => {
  const { data: deployedContract } = useDeployedContractInfo("Strk");

  const { data, isLoading, error, refetch } = useContractCall<bigint>(
    deployedContract?.address,
    deployedContract?.abi as Abi | undefined,
    "balance_of",
    address ? [address] : [],
    { watch: true, enabled: !!address && !!deployedContract?.address },
  );
  // Convert u256 tuple [low, high] to bigint
  const rawBalance = data as [string, string] | undefined;
  const value: bigint | undefined = rawBalance
    ? BigInt(rawBalance[0]) + BigInt(rawBalance[1]) * 2n ** 128n
    : undefined;

  return {
    value,
    decimals: 18,
    symbol: "STRK",
    formatted: value ? formatUnits(value, 18) : "0",
    isLoading,
    error: error ? new Error(error) : null,
    refetch,
  };
};

export default useScaffoldStrkBalance;
