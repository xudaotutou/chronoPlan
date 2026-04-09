import {
  ContractAbi,
  ContractName,
  UseScaffoldWatchContractEventConfig,
} from "~~/utils/scaffold-stark/contract";
import { ExtractAbiEventNames } from "abi-wan-kanabi/kanabi";
import { useEffect, useMemo, useState } from "react";
import { useTargetNetwork } from "./useTargetNetwork";
import { useScaffoldWebSocketEvents } from "./useScaffoldWebSocketEvents";
import scaffoldConfig from "~~/scaffold.config";
import { useDeployedContractInfo } from "~~/hooks/scaffold-stark";
import { Abi } from "abi-wan-kanabi/kanabi";
import { resolveEventAbi } from "~~/utils/scaffold-stark/eventsUtils";
import { useSDKStore } from "~~/services/store/sdk";

/**
 * Watches for specific contract events and triggers a callback when events are detected.
 * callback function whenever new events matching the specified event name are found.
 *
 * @param config - Configuration object for the hook
 * @param config.contractName - The deployed contract name to watch for events
 * @param config.eventName - The name of the event to watch (must exist in contract ABI)
 * @param config.onLogs - Callback function to execute when events are detected, receives parsed event data
 * @returns {Object} An object containing:
 *   - isLoading: boolean - Boolean indicating if the hook is currently loading or processing events
 *   - error: Error | null - Any error encountered during event watching, or null if successful
 * @see {@link https://scaffoldstark.com/docs/hooks/useScaffoldWatchContractEvent}
 */

export const useScaffoldWatchContractEvent = <
  TContractName extends ContractName,
  TEventName extends ExtractAbiEventNames<ContractAbi<TContractName>>,
>({
  contractName,
  eventName,
  onLogs,
}: UseScaffoldWatchContractEventConfig<TContractName, TEventName>) => {
  const { targetNetwork } = useTargetNetwork();

  // State for loading and error
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Validate event existence in ABI to keep parity with previous behavior and tests
  const { data: deployedContractData, isLoading: deployedContractLoading } =
    useDeployedContractInfo(contractName);
  const eventAbi = useMemo(() => {
    return resolveEventAbi(
      deployedContractData?.abi as Abi,
      eventName as unknown as string,
    );
  }, [deployedContractData, deployedContractLoading, eventName]);
  if (!deployedContractLoading && deployedContractData && !eventAbi) {
    throw new Error(`Event ${eventName as string} not found in contract ABI`);
  }

  useEffect(() => {
    if (!deployedContractLoading && !deployedContractData) {
      setError(new Error("Contract not found"));
      setError(null);
    }
  }, [deployedContractLoading, deployedContractData]);

  const {
    events = [],
    isLoading: wsLoading,
    error: wsError,
  } = useScaffoldWebSocketEvents({
    contractName,
    eventName: eventName,
    enrich: true,
    enabled: true,
  });

  useEffect(() => {
    if (events && events.length > 0) {
      onLogs(events[0]);
    }
  }, [events, onLogs]);

  useEffect(() => {
    setIsLoading(wsLoading);
    if (wsError) setError(wsError);
  }, [wsLoading, wsError]);

  // Keep previous polling as a fallback when WS is not available
  useEffect(() => {
    if (!wsError) return;
    let stopped = false;
    let id: ReturnType<typeof setInterval>;
    const tick = async () => {
      try {
        setIsLoading(true);
        const sdk = useSDKStore.getState().getSDK();
        sdk.getProvider(); // initialize provider
      } catch (e: any) {
        setError(e);
      } finally {
        if (!stopped) setIsLoading(false);
      }
    };
    const startPolling = async () => {
      await tick();
      id = setInterval(
        tick,
        targetNetwork ? scaffoldConfig.pollingInterval : 4000,
      );
    };
    startPolling();
    return () => {
      stopped = true;
      clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wsError, targetNetwork]);

  return { isLoading, error };
};
