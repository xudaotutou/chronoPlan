import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSDKStore } from "~~/services/store/sdk";
import { useTargetNetwork } from "./useTargetNetwork";
import { fetchPrice } from "~~/services/web3/PriceService";

interface BlockData {
  transaction: number;
  blockStatus: string | undefined;
  blockNumber: number;
  blockHash: string;
  blockVersion: string;
  blockTimestamp: number;
  blockTransactions: string[];
  parentBlockHash: string;
  totalTransactions: number;
  tps: number | null;
  gasprice: string;
  gaspricefri: string;
  timeDiff: number | null;
  averageFeeUSD: string;
}

/**
 * Fetches detailed block data for a specific block number, including transaction statistics and network metrics.
 *
 * NOTE: fetchPrice() is called directly here because TanStack Query hooks cannot be used inside callbacks.
 * This could be optimized by restructuring to pass price from the component level.
 * See: useNativeCurrencyPriceDirect() for the proper TanStack Query-based price fetching., including transaction statistics and network metrics.
 * This hook retrieves comprehensive information about a block including transaction count, gas prices,
 * TPS (transactions per second), average fees in USD, and other block metadata.
 *
 * Uses TanStack Query for automatic caching, deduplication, and retry logic.
 *
 * @param blockNumber - The block number to fetch data for
 * @returns {Object} An object containing:
 *   - blockData: BlockData | undefined - The fetched block data with transaction stats and network metrics
 *   - error: string | null - Any error encountered during data fetching
 *   - refetch: () => void - Function to manually refetch the block data
 *   - isLoading: boolean - Whether the query is loading
 */
export const useDataTransaction = (blockNumber: number) => {
  const { targetNetwork } = useTargetNetwork();
  const rpcUrl = targetNetwork.rpcUrls.public.http[0];

  const fetchBlockData = useCallback(async (): Promise<BlockData> => {
    const sdk = useSDKStore.getState().getSDK();
    const provider = sdk.getProvider();
    const currentBlock = await provider.getBlock(blockNumber);

    let tps: number | null = null;
    const prevBlockNumber = blockNumber - 1;

    if (prevBlockNumber >= 0) {
      try {
        const prevBlock = await provider.getBlock(prevBlockNumber);
        if (currentBlock && prevBlock) {
          const currentTxCount = currentBlock.transactions?.length || 0;
          const timeDiffBetweenBlocks =
            currentBlock.timestamp - prevBlock.timestamp;
          tps =
            timeDiffBetweenBlocks > 0
              ? currentTxCount / timeDiffBetweenBlocks
              : null;
        }
      } catch {
        // Ignore block fetch errors for TPS calculation
      }
    }

    // Calculate time difference
    let timeDiff: number | null = null;
    if (prevBlockNumber >= 0) {
      try {
        const currentBlockForTime = await provider.getBlock(blockNumber);
        const prevBlockForTime = await provider.getBlock(prevBlockNumber);
        if (currentBlockForTime && prevBlockForTime) {
          timeDiff = currentBlockForTime.timestamp - prevBlockForTime.timestamp;
        }
      } catch {
        // Ignore errors for time diff
      }
    }

    // Calculate average fee
    let averageFeeUSD = "0";
    try {
      const blockTxHashes = await provider.getBlockWithTxHashes(blockNumber);
      const txHashes = blockTxHashes.transactions;

      if (txHashes && txHashes.length > 0) {
        let totalFeeFri = BigInt(0);
        for (const txHash of txHashes) {
          try {
            const receipt: any = await provider.getTransactionReceipt(txHash);
            if (receipt?.actual_fee) {
              totalFeeFri += BigInt(receipt.actual_fee.amount);
            }
          } catch {
            // Ignore individual receipt fetch errors
          }
        }

        const totalFee = Number(totalFeeFri) / 1e18;
        // Price is fetched separately via useNativeCurrencyPriceDirect hook at component level
        // Here we use a placeholder that will be calculated in the component
        const avg = totalFee; // Return fee in FRI, component will convert to USD
        averageFeeUSD = avg.toFixed(4);
      }
    } catch {
      // Ignore fee calculation errors
    }

    return {
      transaction: currentBlock.transactions?.length || 0,
      blockStatus: currentBlock.status,
      blockNumber: blockNumber,
      blockHash: currentBlock.sequencer_address,
      blockVersion: currentBlock.starknet_version,
      blockTimestamp: currentBlock.timestamp,
      blockTransactions: currentBlock.transactions || [],
      parentBlockHash: currentBlock.parent_hash || "",
      totalTransactions: currentBlock.transactions?.length || 0,
      tps,
      gasprice: currentBlock.l1_gas_price.price_in_wei,
      gaspricefri: currentBlock.l1_gas_price.price_in_fri,
      timeDiff: timeDiff !== null ? timeDiff : null,
      averageFeeUSD,
    };
  }, [blockNumber]);

  const {
    data: blockData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["block-data", blockNumber, rpcUrl],
    queryFn: fetchBlockData,
    staleTime: 30 * 1000, // 30 seconds
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });

  return {
    blockData,
    error: error?.message || null,
    refetch,
    isLoading,
  };
};
