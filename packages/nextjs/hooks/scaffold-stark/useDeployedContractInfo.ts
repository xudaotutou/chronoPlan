import { useEffect, useState } from "react";
import { useTargetNetwork } from "./useTargetNetwork";
import { useIsMounted } from "usehooks-ts";
import {
  ContractCodeStatus,
  ContractName,
  Contract,
  getContractForNetwork,
} from "~~/utils/scaffold-stark/contract";
import { useSDKStore } from "~~/services/store/sdk";
import { ContractClassHashCache } from "./ContractClassHashCache";

/**
 * Checks if a contract is deployed and provides contract information.
 * This hook verifies the deployment status of a contract by checking its class hash
 * on the blockchain and returns the contract data if it's successfully deployed.
 *
 * @param contractName - The name of the contract to check for deployment
 * @returns {Object} An object containing:
 *   - data: Contract<TContractName> | undefined - The deployed contract data (address, abi, classHash) if deployed, undefined otherwise
 *   - isLoading: boolean - Boolean indicating if the deployment check is in progress
 *   - raw: Contract<TContractName> | undefined - The raw contract configuration data regardless of deployment status
 *   - status: ContractCodeStatus - The deployment status (LOADING, DEPLOYED, NOT_FOUND)
 */
export function useDeployedContractInfo<TContractName extends ContractName>(
  contractName: TContractName,
) {
  const isMounted = useIsMounted();
  const { targetNetwork } = useTargetNetwork();
  const networkKey = targetNetwork.network as string;
  const deployedContract = getContractForNetwork(networkKey, contractName);
  const [status, setStatus] = useState<ContractCodeStatus>(
    ContractCodeStatus.LOADING,
  );

  useEffect(() => {
    const checkContractDeployment = async () => {
      // Skip RPC call if address is null/undefined
      if (!deployedContract?.address) {
        setStatus(ContractCodeStatus.NOT_FOUND);
        return;
      }

      const sdk = useSDKStore.getState().getSDK();
      const publicClient = sdk.getProvider();

      const classHashCache = ContractClassHashCache.getInstance();
      const contractClassHash = await classHashCache.getClassHash(
        publicClient,
        deployedContract.address,
        "latest",
      );

      if (!isMounted()) {
        return;
      }
      // If contract code is undefined => no contract deployed on that address
      if (contractClassHash == undefined) {
        setStatus(ContractCodeStatus.NOT_FOUND);
        return;
      }
      setStatus(ContractCodeStatus.DEPLOYED);
    };

    checkContractDeployment();
  }, [isMounted, contractName, deployedContract]);

  return {
    data: status === ContractCodeStatus.DEPLOYED ? deployedContract : undefined,
    isLoading: status === ContractCodeStatus.LOADING,
    raw: deployedContract,
    status,
  };
}
