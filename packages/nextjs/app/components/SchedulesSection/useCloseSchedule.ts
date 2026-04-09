"use client";

import { useCallback, useState } from "react";
import type { Call } from "starknet";
import { useScaffoldMultiWriteContract } from "~~/hooks/scaffold-stark";
import { useScheduleCacheActions } from "~~/hooks/useScheduleQueries";
import toast from "react-hot-toast";

export function useCloseSchedule() {
  const [isLoading, setIsLoading] = useState(false);
  const { sendAsync: sendCloseTx } = useScaffoldMultiWriteContract();
  const { onCloseSuccess } = useScheduleCacheActions();

  const close = useCallback(
    async (scheduleAddress: string, funderAddress: string, planId: string) => {
      if (!scheduleAddress) {
        toast.error("Invalid schedule address");
        return;
      }

      setIsLoading(true);
      try {
        toast.loading("Closing schedule...", { id: "close" });

        const calls: Call[] = [
          {
            contractAddress: scheduleAddress,
            entrypoint: "close",
            calldata: [funderAddress], // refund_address
          },
        ];

        const txHash = await sendCloseTx(calls);

        if (txHash) {
          // Wait for RPC to confirm the transaction
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }

        // Invalidate cache after successful close
        onCloseSuccess(scheduleAddress, funderAddress, planId);

        toast.success(`Closed! Tx: ${txHash?.slice(0, 10)}…`, {
          id: "close",
          duration: 5000,
        });
      } catch (e: unknown) {
        toast.error((e as Error)?.message || "Close failed", { id: "close" });
      } finally {
        setIsLoading(false);
      }
    },
    [sendCloseTx, onCloseSuccess],
  );

  return { close, isLoading };
}
