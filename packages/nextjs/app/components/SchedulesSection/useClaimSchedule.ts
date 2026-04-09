"use client";

import { useCallback, useState } from "react";
import type { Call } from "starknet";
import { useScaffoldMultiWriteContract } from "~~/hooks/scaffold-stark";
import { useScheduleCacheActions } from "~~/hooks/useScheduleQueries";
import toast from "react-hot-toast";

export function useClaimSchedule() {
  const [isLoading, setIsLoading] = useState(false);
  const { sendAsync: sendClaimTx } = useScaffoldMultiWriteContract();
  const { onClaimSuccess } = useScheduleCacheActions();

  const claim = useCallback(
    async (
      scheduleAddress: string,
      recipientAddress: string,
      funderAddress: string | undefined,
      planId: string,
    ) => {
      if (!scheduleAddress) {
        toast.error("Invalid schedule address");
        return;
      }

      setIsLoading(true);
      try {
        toast.loading("Claiming tokens...", { id: "claim" });

        const calls: Call[] = [
          {
            contractAddress: scheduleAddress,
            entrypoint: "claim",
            calldata: [],
          },
        ];

        const txHash = await sendClaimTx(calls);

        if (txHash) {
          // Wait for RPC to confirm the transaction
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }

        // Invalidate cache after successful claim
        onClaimSuccess(
          scheduleAddress,
          recipientAddress,
          funderAddress,
          planId,
        );

        toast.success(`Claimed! Tx: ${txHash?.slice(0, 10)}…`, {
          id: "claim",
          duration: 5000,
        });
      } catch (e: unknown) {
        toast.error((e as Error)?.message || "Claim failed", { id: "claim" });
      } finally {
        setIsLoading(false);
      }
    },
    [sendClaimTx, onClaimSuccess],
  );

  return { claim, isLoading };
}
