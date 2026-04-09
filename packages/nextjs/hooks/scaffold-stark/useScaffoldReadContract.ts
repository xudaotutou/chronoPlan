import type { Abi } from "abi-wan-kanabi";
import { useContractCall } from "~~/hooks/useStarkZap";
import { useDeployedContractInfo } from "~~/hooks/scaffold-stark";
import {
  AbiFunctionOutputs,
  ContractAbi,
  ContractName,
  ExtractAbiFunctionNamesScaffold,
  UseScaffoldReadConfig,
} from "~~/utils/scaffold-stark/contract";

/**
 * Provides a function to read (call view functions) from a contract.
 * This hook wraps useContractCall from starkzap to provide a simplified interface
 * for reading data from deployed contracts, with automatic contract address and ABI resolution.
 *
 * @param config - Configuration object for the hook
 * @param {TContractName} config.contractName - The deployed contract name to read from
 * @param {TFunctionName} config.functionName - The contract method to call (must be a view function)
 * @param {any[]} [config.args] - Arguments for the method call
 * @param {boolean} [config.enabled] - If false, disables the read (default: true if all args are defined)
 * @param {Object} [config.readConfig] - Additional configuration options for useContractCall
 * @returns {Object} An object containing:
 *   - data: AbiFunctionOutputs<ContractAbi, TFunctionName> | undefined - The function output data
 *   - isLoading: boolean - Boolean indicating if the read is in progress
 *   - error: Error | null - Any error encountered during the read operation
 *   - refetch: () => void - Function to manually refetch the data
 *   - (All other properties from useContractCall)
 * @see {@link https://scaffoldstark.com/docs/hooks/useScaffoldReadContract}
 */

export const useScaffoldReadContract = <
  TAbi extends Abi,
  TContractName extends ContractName,
  TFunctionName extends ExtractAbiFunctionNamesScaffold<
    ContractAbi<TContractName>,
    "view"
  >,
>({
  contractName,
  functionName,
  args,
  ...readConfig
}: UseScaffoldReadConfig<TAbi, TContractName, TFunctionName>) => {
  const { data: deployedContract } = useDeployedContractInfo(contractName);

  // Convert args to array format expected by useContractCall
  const callArgs = args ? (Array.isArray(args) ? args : [args]) : [];

  const result = useContractCall(
    deployedContract?.address as string | undefined,
    deployedContract?.abi as Abi | undefined,
    functionName,
    callArgs as (string | number | bigint)[],
    {
      watch: true,
      enabled:
        args &&
        (!Array.isArray(args) || !args.some((arg) => arg === undefined)),
    },
  );

  return {
    ...result,
    data: result.data as
      | AbiFunctionOutputs<ContractAbi, TFunctionName>
      | undefined,
  };
};
