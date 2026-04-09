"use client";
import { useEffect, useMemo, useState } from "react";
import { useDeployedContractInfo } from "~~/hooks/scaffold-stark";
import { ContractName } from "~~/utils/scaffold-stark/contract";
import { Contract, StarkZap } from "starkzap";
import { useSDKStore } from "~~/services/store/sdk";
import { getCurrentWallet } from "~~/services/web3/starkzap";

/**
 * Provides a contract instance for interacting with deployed contracts.
 * This hook creates a Starknet contract instance with the deployed contract data
 * and provides a fallback mechanism for contract calls with response parsing.
 *
 * @param config - Configuration object for the hook
 * @param {TContractName} config.contractName - The name of the contract to get an instance for
 * @returns {Object} An object containing:
 *   - data: Contract | undefined - The contract instance with fallback call mechanism, or undefined if not deployed
 *   - isLoading: boolean - Boolean indicating if the contract data is loading
 * @see {@link https://scaffoldstark.com/docs/hooks/useScaffoldContract}
 */

export const useScaffoldContract = <TContractName extends ContractName>({
  contractName,
}: {
  contractName: TContractName;
}) => {
  const { data: deployedContractData, isLoading: deployedContractLoading } =
    useDeployedContractInfo(contractName);

  const [provider, setProvider] = useState<ReturnType<
    StarkZap["getProvider"]
  > | null>(null);

  useEffect(() => {
    const initProvider = async () => {
      const wallet = getCurrentWallet();
      if (wallet) {
        setProvider(wallet.getProvider());
      } else {
        // Fallback to provider from starkzap SDK
        const sdk = useSDKStore.getState().getSDK();
        setProvider(sdk.getProvider());
      }
    };
    initProvider();
  }, []);

  const contract = useMemo(() => {
    if (!deployedContractData || !provider) return undefined;

    const contractInstance = new Contract({
      abi: deployedContractData.abi,
      address: deployedContractData?.address as `0x${string}`,
      providerOrAccount: provider,
    });

    const originalCall = contractInstance.call.bind(contractInstance);
    contractInstance.call = async (method: string, ...args: any[]) => {
      try {
        return await originalCall(method, ...args, { parseResponse: false });
      } catch (error) {
        return originalCall(method, ...args);
      }
    };

    return contractInstance;
  }, [deployedContractData, provider]);

  return {
    data: contract,
    isLoading: deployedContractLoading,
  };
};
