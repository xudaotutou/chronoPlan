import { useEffect, useMemo, useRef, useState } from "react";
import { useTargetNetwork } from "./useTargetNetwork";
import { useInterval } from "usehooks-ts";
import { useDeployedContractInfo } from "~~/hooks/scaffold-stark";
import scaffoldConfig from "~~/scaffold.config";
import { replacer } from "~~/utils/scaffold-stark/common";
import { Abi, ExtractAbiEventNames } from "abi-wan-kanabi/kanabi";
import {
  ContractAbi,
  ContractName,
  UseScaffoldEventHistoryConfig,
} from "~~/utils/scaffold-stark/contract";
import { RpcProvider } from "starknet";
import { useSDKStore } from "~~/services/store/sdk";
import { parseEventData } from "~~/utils/scaffold-stark/eventsData";
import { buildEventKeys } from "~~/utils/scaffold-stark/eventKeyFilter";
import {
  enrichLog,
  getLatestAcceptedBlockNumber,
  parseLogsArgs,
  resolveEventAbi,
} from "~~/utils/scaffold-stark/eventsUtils";
import { useScaffoldWebSocketEvents } from "./useScaffoldWebSocketEvents";

const MAX_KEYS_COUNT = 16;
/**
 * Reads historical events from a deployed contract.
 * This hook fetches and parses events from a specific block onwards, with optional
 * filtering, data inclusion, and continuous watching capabilities.
 *
 * @param config - Configuration object for the hook, typed with generics for contract and event names
 * @param {TContractName} config.contractName - The deployed contract name to read events from
 * @param {TEventName} config.eventName - The name of the event to read (must exist in contract ABI)
 * @param {bigint} config.fromBlock - The block number to start reading events from
 * @param {Object} [config.filters] - Optional filters to apply to events (parameterName: value)
 * @param {boolean} [config.blockData=false] - If true, includes block data for each event (default: false)
 * @param {boolean} [config.transactionData=false] - If true, includes transaction data for each event (default: false)
 * @param {boolean} [config.receiptData=false] - If true, includes receipt data for each event (default: false)
 * @param {boolean} [config.watch=false] - If true, continuously watches for new events (default: false)
 * @param {boolean} [config.format=true] - If true, formats the event data (default: true)
 * @param {boolean} [config.enabled=true] - If false, disables the hook (default: true)
 * @returns {Object} An object containing:
 *   - data: Array<EventData> | undefined - Array of parsed event data with type, args, parsedArgs (if format is true), and optional block/transaction/receipt data if respective flags are enabled
 *   - isLoading: boolean - Boolean indicating if the hook is loading or processing events
 *   - error: string | undefined - Any error encountered during event reading, or undefined if successful
 * @see {@link https://scaffoldstark.com/docs/hooks/useScaffoldEventHistory}
 */
export const useScaffoldEventHistory = <
  TContractName extends ContractName,
  TEventName extends ExtractAbiEventNames<ContractAbi<TContractName>>,
  TBlockData extends boolean = false,
  TTransactionData extends boolean = false,
  TReceiptData extends boolean = false,
>({
  contractName,
  eventName,
  fromBlock,
  filters,
  blockData,
  transactionData,
  receiptData,
  watch,
  format = true,
  enabled = true,
}: UseScaffoldEventHistoryConfig<
  TContractName,
  TEventName,
  TBlockData,
  TTransactionData,
  TReceiptData
>) => {
  const [events, setEvents] = useState<any[]>();
  // Use ref to avoid stale closure in readEvents
  const eventsRef = useRef<any[] | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error>();
  const [fromBlockUpdated, setFromBlockUpdated] = useState<bigint>(fromBlock);
  const isFetchingRef = useRef(false);

  const { data: deployedContractData, isLoading: deployedContractLoading } =
    useDeployedContractInfo(contractName);
  const { targetNetwork } = useTargetNetwork();
  const [publicClient, setPublicClient] = useState<RpcProvider | null>(null);

  useEffect(() => {
    setPublicClient(useSDKStore.getState().getSDK().getProvider());
  }, []);

  // Keep ref in sync with state to avoid stale closure
  useEffect(() => {
    eventsRef.current = events;
  }, [events]);

  // Get back event full name
  const eventAbi = useMemo(() => {
    return resolveEventAbi<TContractName, TEventName>(
      deployedContractData?.abi as Abi,
      eventName as string,
    );
  }, [deployedContractData, deployedContractLoading, eventName]);
  if (!eventAbi && !deployedContractLoading) {
    throw new Error(`Event ${eventName as string} not found in contract ABI`);
  }
  const fullName = eventAbi?.name;

  const readEvents = async (fromBlockArg?: bigint) => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }

    if (!publicClient) {
      return;
    }
    isFetchingRef.current = true;
    setIsLoading(true);
    try {
      if (deployedContractLoading) {
        return;
      }

      if (!deployedContractData) {
        throw new Error("Contract not found");
      }
      if (!eventAbi) {
        throw new Error(`Event ${String(eventName)} not found in ABI`);
      }

      const blockNumber = await getLatestAcceptedBlockNumber(publicClient);

      if (
        (fromBlockArg && blockNumber >= fromBlockArg) ||
        blockNumber >= fromBlockUpdated
      ) {
        const keys = buildEventKeys(
          eventName as string,
          filters as any,
          eventAbi as any,
          deployedContractData?.abi as any,
        );
        const rawEventResp = await publicClient.getEvents({
          chunk_size: 100,
          keys,
          address: deployedContractData?.address as `0x${string}` | undefined,
          from_block: {
            block_number: Number(fromBlockArg || fromBlockUpdated),
          },
          to_block: { block_number: Number(blockNumber) },
        });
        if (!rawEventResp) {
          return;
        }
        const logs = rawEventResp.events;
        setFromBlockUpdated(blockNumber + 1n);

        // Build newest-first array and enrich concurrently
        const newestFirst = [...logs].reverse();
        const enriched = await Promise.all(
          newestFirst.map(async (log) => {
            const { block, transaction, receipt } = await enrichLog(
              publicClient,
              log,
              {
                block: !!blockData,
                transaction: !!transactionData,
                receipt: !!receiptData,
              },
            );
            return { event: eventAbi, log, block, transaction, receipt };
          }),
        );
        // Use ref to get latest events value (avoids stale closure)
        if (eventsRef.current && typeof fromBlockArg === "undefined") {
          setEvents([...enriched, ...eventsRef.current]);
        } else {
          setEvents(enriched);
        }
        setError(undefined);
      }
    } catch (e: unknown) {
      console.error(e);
      setEvents(undefined);
      setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      isFetchingRef.current = false;
      setIsLoading(false);
    }
  };

  useEffect(() => {
    readEvents(fromBlock).catch((err) => {
      console.warn("[useScaffoldEventHistory] Failed to read events:", err);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromBlock, enabled]);

  // WebSocket stream for live updates; keep polling as fallback or for initial batch
  const {
    events: wsEvents,
    error: wsError,
    isConnected: wsConnected,
  } = useScaffoldWebSocketEvents({
    contractName,
    eventName: eventName as any,
    filters,
    enrich: true,
    enabled: !!watch,
    fromBlock: fromBlockUpdated,
  });

  useEffect(() => {
    if (!deployedContractLoading && (!watch || !wsConnected)) {
      readEvents().catch((err) => {
        console.warn("[useScaffoldEventHistory] Failed to read events:", err);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    deployedContractData?.address,
    deployedContractData,
    deployedContractLoading,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    JSON.stringify(filters, replacer),
    blockData,
    transactionData,
    receiptData,
    wsConnected,
    watch,
  ]);

  useEffect(() => {
    // Reset the internal state when target network or fromBlock changed
    setEvents([]);
    setFromBlockUpdated(fromBlock);
    setError(undefined);
  }, [fromBlock, targetNetwork.id]);

  useEffect(() => {
    if (!wsError && wsEvents && wsEvents.length) {
      // Prepend latest ws events to current list without duplicating
      const existing = events || [];
      const incoming = wsEvents.filter((we: any) =>
        existing.every(
          (e: any) =>
            e.log.transaction_hash !== we.log.transaction_hash ||
            e.log.event_index !== we.log.event_index,
        ),
      );
      if (incoming.length) {
        setEvents([...incoming, ...existing]);
      }
    }
  }, [wsEvents]);

  // Use devnet.id for polling interval check (devnet uses 4s instead of config interval)
  const isDevnet = targetNetwork.network === "devnet";
  useInterval(
    async () => {
      if (!deployedContractLoading && (!!wsError || !watch || !wsConnected)) {
        readEvents();
      }
    },
    watch ? (isDevnet ? 4_000 : scaffoldConfig.pollingInterval) : null,
  );

  const eventHistoryData = useMemo(() => {
    if (deployedContractData) {
      return (events || []).map((event) => {
        const args = parseLogsArgs(
          deployedContractData.abi as Abi,
          fullName as string,
          [event.log],
        );
        const { event: rawEvent, ...rest } = event;
        // Some sources (e.g., WebSocket) may not include the raw event ABI on each item.
        // Fallback to the resolved eventAbi from this hook when it's missing.
        const members = (rawEvent?.members ?? (eventAbi as any)?.members) || [];
        return {
          type: members,
          args,
          parsedArgs: format ? parseEventData(args, members) : null,
          ...rest,
        };
      });
    }
    return [];
  }, [deployedContractData, events, eventName, format]);

  return {
    data: eventHistoryData,
    isLoading: isLoading || deployedContractLoading,
    error: error,
  };
};
