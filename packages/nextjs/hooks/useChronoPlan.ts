"use client";

import { useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Contract, RpcProvider } from "starknet";
import scaffoldConfig from "~~/scaffold.config";
import deployedContracts from "~~/contracts/deployedContracts";

// Contract addresses - validate they exist
const FACTORY_ADDRESS = deployedContracts.sepolia?.Factory?.address;

if (!FACTORY_ADDRESS) {
  console.error(
    "[useChronoPlan] FACTORY_ADDRESS not found in deployedContracts",
  );
}

// Curve options
export const CURVES = [
  {
    key: "LINEAR",
    name: "Linear",
    desc: "Linear release over time",
    params: "0",
  },
  {
    key: "CLIFF",
    name: "Cliff",
    desc: "Release after cliff period",
    params: "3600",
  },
  {
    key: "EXP_DECAY",
    name: "Front-Loaded",
    desc: "Release more upfront",
    params: "500",
  },
] as const;

export type CurveKey = (typeof CURVES)[number]["key"];

// Schedule info
export interface ScheduleInfo {
  address: string;
  recipient: string;
  amount: bigint;
  claimed: bigint;
  startTime: number;
  duration: number;
  curveKey: string;
  tokenAddress: string;
  planId: string;
}

// ScheduleProxy ABI (minimal for reading)
const SCHEDULE_ABI = [
  {
    type: "function",
    name: "get_amount",
    inputs: [],
    outputs: [{ type: "core::integer::u256" }],
    state_mutability: "view",
  },
  {
    type: "function",
    name: "get_claimed",
    inputs: [],
    outputs: [{ type: "core::integer::u256" }],
    state_mutability: "view",
  },
  {
    type: "function",
    name: "get_available",
    inputs: [],
    outputs: [{ type: "core::integer::u256" }],
    state_mutability: "view",
  },
  {
    type: "function",
    name: "get_recipient",
    inputs: [],
    outputs: [{ type: "core::starknet::contract_address::ContractAddress" }],
    state_mutability: "view",
  },
  {
    type: "function",
    name: "get_curve_name",
    inputs: [],
    outputs: [{ type: "core::felt252" }],
    state_mutability: "view",
  },
  {
    type: "function",
    name: "claim",
    inputs: [],
    outputs: [],
    state_mutability: "external",
  },
] as const;

// FIXED: Create RpcProvider inside function to react to config changes
function createRpcProvider(): RpcProvider {
  return new RpcProvider({
    nodeUrl: scaffoldConfig.targetNetworks[0].rpcUrls.public.http[0],
  });
}

// Helper to convert u256 to bigint
function u256ToBigInt(value: readonly [bigint, bigint] | undefined): bigint {
  if (!value) return 0n;
  const [low, high] = value;
  return (high << 128n) | low;
}

// FIXED: Add pagination limit to prevent memory exhaustion
const MAX_EVENTS_PER_QUERY = 1000; // Limit to prevent memory issues

// Fetch schedules for a given address
async function fetchUserSchedules(address: string): Promise<ScheduleInfo[]> {
  if (!address || !FACTORY_ADDRESS) return [];

  const rpcProvider = createRpcProvider();

  try {
    const blockNumber = await rpcProvider.getBlock();
    const latestBlock = blockNumber.block_number;

    // FIXED: Paginate through events with limit
    let continuationToken: string | undefined = undefined;
    let totalFetched = 0;
    const allEvents: ScheduleInfo[] = [];

    do {
      const eventParams: any = {
        chunk_size: 100,
        keys: [[FACTORY_ADDRESS]],
        address: FACTORY_ADDRESS,
        from_block: { block_number: 0 },
        to_block: { block_number: latestBlock },
      };

      if (continuationToken) {
        eventParams.continuation_token = continuationToken;
      }

      const rawEventResp = await rpcProvider.getEvents(eventParams);

      if (!rawEventResp?.events?.length) break;

      for (const event of [...rawEventResp.events].reverse()) {
        const parsedData = event.data;
        if (!parsedData || parsedData.length < 11) continue;

        const [
          planId,
          scheduleAddress,
          recipient,
          amountLow,
          amountHigh,
          startTime,
          duration,
          curveKey,
          _curveParams,
          tokenAddress,
        ] = parsedData;

        const recipientHex =
          "0x" + BigInt(recipient).toString(16).padStart(64, "0");
        if (recipientHex.toLowerCase() !== address.toLowerCase()) continue;

        allEvents.push({
          address:
            "0x" + BigInt(scheduleAddress).toString(16).padStart(64, "0"),
          recipient: recipientHex,
          amount: (BigInt(amountHigh) << 128n) | BigInt(amountLow),
          claimed: 0n,
          startTime: Number(startTime),
          duration: Number(duration),
          curveKey: "0x" + BigInt(curveKey).toString(16),
          tokenAddress:
            "0x" + BigInt(tokenAddress).toString(16).padStart(64, "0"),
          planId: "0x" + BigInt(planId).toString(16).padStart(64, "0"),
        });

        totalFetched++;
        if (totalFetched >= MAX_EVENTS_PER_QUERY) break;
      }

      // Check for continuation token
      continuationToken = rawEventResp.continuation_token;

      // Stop if we've reached our limit
      if (totalFetched >= MAX_EVENTS_PER_QUERY) break;
    } while (continuationToken);

    return allEvents;
  } catch (error) {
    console.error("[useChronoPlan] Error fetching schedules:", error);
    return [];
  }
}

// Fetch schedule details
async function fetchScheduleDetails(scheduleAddress: string): Promise<{
  amount: bigint;
  claimed: bigint;
  available: bigint;
  recipient: string | undefined;
  curveName: string | undefined;
}> {
  const rpcProvider = createRpcProvider();

  const contract = new Contract({
    abi: SCHEDULE_ABI as any,
    address: scheduleAddress,
    providerOrAccount: rpcProvider,
  });

  const [amount, claimed, available, recipient, curveName] = await Promise.all([
    contract.get_amount(),
    contract.get_claimed(),
    contract.get_available(),
    contract.get_recipient(),
    contract.get_curve_name(),
  ]);

  return {
    amount: u256ToBigInt(amount as readonly [bigint, bigint]),
    claimed: u256ToBigInt(claimed as readonly [bigint, bigint]),
    available: u256ToBigInt(available as readonly [bigint, bigint]),
    recipient: "0x" + (recipient as bigint).toString(16).padStart(64, "0"),
    curveName: "0x" + (curveName as bigint).toString(16).padStart(64, "0"),
  };
}

// Hook to get all schedules for connected wallet (using TanStack Query)
export function useUserSchedules(address: string | undefined) {
  return useQuery({
    queryKey: ["schedules", address],
    queryFn: () => fetchUserSchedules(address!),
    enabled: !!address && !!FACTORY_ADDRESS, // FIXED: Require FACTORY_ADDRESS
    staleTime: 30_000,
    refetchInterval: false,
    retry: 2,
  });
}

// Hook to get schedule details from contract (using TanStack Query)
export function useScheduleDetails(scheduleAddress: string | null) {
  return useQuery({
    queryKey: ["scheduleDetails", scheduleAddress],
    queryFn: () => fetchScheduleDetails(scheduleAddress!),
    enabled: !!scheduleAddress,
    staleTime: 10_000,
    refetchInterval: false,
    retry: 2,
  });
}
