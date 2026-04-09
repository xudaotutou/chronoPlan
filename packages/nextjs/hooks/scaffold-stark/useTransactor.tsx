import type { Call } from "starknet";
import { getBlockExplorerTxLink, notification } from "~~/utils/scaffold-stark";
import { useTargetNetwork } from "./useTargetNetwork";
import { useState, useEffect, useCallback, useRef } from "react";
import { useStarkZap } from "~~/hooks/useStarkZap";

type TransactionFunc = (tx: Call[]) => Promise<string | undefined>;

interface UseTransactorReturn {
  writeTransaction: TransactionFunc;
  // These are kept for backward compatibility but are now simplified
  transactionReceiptInstance: {
    data: unknown;
    status: "idle" | "pending" | "success" | "error";
    error?: Error;
  };
  sendTransactionInstance: {
    sendAsync: (calls: Call[]) => Promise<string>;
    isLoading: boolean;
    isPending: boolean;
    isSuccess: boolean;
    isError: boolean;
    data?: { txHash: string };
    error?: Error;
    reset: () => void;
  };
}

const TxnNotification = ({
  message,
  blockExplorerLink,
}: {
  message: string;
  blockExplorerLink?: string;
}) => {
  return (
    <div className={`flex flex-col ml-1 cursor-default`}>
      <p className="my-0">{message}</p>
      {blockExplorerLink && blockExplorerLink.length > 0 ? (
        <a
          href={blockExplorerLink}
          target="_blank"
          rel="noreferrer"
          className="block link text-md"
        >
          check out transaction
        </a>
      ) : null}
    </div>
  );
};

/**
 * Handles sending transactions to Starknet contracts with comprehensive UI feedback and state management.
 * Uses starkzap service layer to submit transactions through the connected wallet.
 *
 * @returns {UseTransactorReturn} An object containing:
 *   - writeTransaction: (tx: Call[]) => Promise<string | undefined> - Async function that sends transactions with notifications and state management
 *   - transactionReceiptInstance: Simplified transaction receipt state
 *   - sendTransactionInstance: Simplified send transaction state and methods
 * @see {@link https://scaffoldstark.com/docs/hooks/useTransactor}
 */
export const useTransactor = (): UseTransactorReturn => {
  const { address, isConnected, execute, getWallet } = useStarkZap();
  const { targetNetwork } = useTargetNetwork();

  const [notificationId, setNotificationId] = useState<string | null>(null);
  const [blockExplorerTxURL, setBlockExplorerTxURL] = useState<
    string | undefined
  >(undefined);
  const [transactionHash, setTransactionHash] = useState<string | undefined>(
    undefined,
  );
  const [txResult, setTxResult] = useState<unknown>(null);
  const [txStatus, setTxStatus] = useState<
    "idle" | "pending" | "success" | "error"
  >("idle");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | undefined>();

  // Ref to track pending transaction
  const pendingTxRef = useRef<{
    txHash: string;
    wait: () => Promise<void>;
  } | null>(null);

  const resetStates = () => {
    setTransactionHash(undefined);
    setBlockExplorerTxURL(undefined);
    setTxStatus("idle");
    setTxResult(null);
    setError(undefined);
    pendingTxRef.current = null;
  };

  // Poll for transaction receipt
  const pollReceipt = useCallback(
    async (txHash: string, maxWait = 120000): Promise<unknown> => {
      const wallet = getWallet?.();
      if (!wallet) {
        throw new Error("Wallet not available");
      }

      const provider = wallet.getProvider();
      const start = Date.now();
      const interval = 2000;

      while (Date.now() - start < maxWait) {
        try {
          const receipt = await provider.getTransactionReceipt(txHash);
          if (receipt) {
            return receipt;
          }
        } catch {
          // Transaction not yet confirmed, continue polling
        }
        await new Promise((r) => setTimeout(r, interval));
      }
      throw new Error("Transaction timeout");
    },
    [],
  );

  useEffect(() => {
    if (notificationId && txStatus && txStatus !== "pending") {
      notification.remove(notificationId);
    }
    if (txStatus === "success") {
      notification.success(
        <TxnNotification
          message="Transaction completed successfully!"
          blockExplorerLink={blockExplorerTxURL}
        />,
        {
          icon: "🎉",
        },
      );
    }
  }, [txResult, txStatus]);

  const writeTransaction = async (tx: Call[]): Promise<string | undefined> => {
    resetStates();
    if (!address || !isConnected) {
      notification.error("Cannot access account");
      console.error("⚡️ ~ file: useTransactor.tsx ~ error");
      return;
    }

    let notificationIdValue: string | number | null = null;
    let txHashResult: string | undefined = undefined;
    try {
      notificationIdValue = notification.loading(
        <TxnNotification message="Awaiting for user confirmation" />,
      );

      const result = await execute(tx);
      txHashResult = result.txHash;
      pendingTxRef.current = { txHash: result.txHash, wait: result.wait };

      setTransactionHash(txHashResult);
      setTxStatus("pending");
      setIsLoading(true);

      notification.remove(notificationIdValue);

      const blockExplorerTxURLValue = getBlockExplorerTxLink(
        targetNetwork.network,
        txHashResult,
      );
      setBlockExplorerTxURL(blockExplorerTxURLValue);

      notificationIdValue = notification.loading(
        <TxnNotification
          message="Waiting for transaction to complete."
          blockExplorerLink={blockExplorerTxURLValue}
        />,
      );
      setNotificationId(notificationIdValue);

      // Wait for transaction to complete
      try {
        const receipt = await pollReceipt(txHashResult);
        setTxResult(receipt);
        setTxStatus("success");
      } catch (pollError) {
        // Transaction was sent but waiting failed - still consider it pending
        console.warn("Transaction polling failed:", pollError);
        setTxStatus("idle"); // Keep as idle since we don't know final state
      }
    } catch (error: any) {
      if (notificationIdValue) {
        notification.remove(notificationIdValue);
      }

      const errorPattern = /Contract (.*?)"}/;
      const match = errorPattern.exec(error.message);
      const message = match ? match[1] : error.message;

      console.error("⚡️ ~ file: useTransactor.tsx ~ error", message);

      notification.error(message);
      setError(error);
      setTxStatus("error");
      throw error;
    } finally {
      setIsLoading(false);
    }

    return txHashResult;
  };

  // sendAsync wrapper for backward compatibility
  const sendAsync = async (calls: Call[]): Promise<string> => {
    const result = await writeTransaction(calls);
    if (!result) {
      throw new Error("Transaction failed");
    }
    return result;
  };

  return {
    writeTransaction,
    transactionReceiptInstance: {
      data: txResult,
      status: txStatus,
      error,
    },
    sendTransactionInstance: {
      sendAsync,
      isLoading,
      isPending: isLoading,
      isSuccess: txStatus === "success",
      isError: txStatus === "error",
      data: transactionHash ? { txHash: transactionHash } : undefined,
      error,
      reset: resetStates,
    },
  };
};
