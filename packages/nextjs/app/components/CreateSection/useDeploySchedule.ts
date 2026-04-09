"use client";

import { useCallback, useState } from "react";
import type { Call } from "starknet";
import { useScaffoldMultiWriteContract } from "~~/hooks/scaffold-stark";
import { useScheduleCacheActions } from "~~/hooks/useScheduleQueries";
import toast from "react-hot-toast";
import deployedContracts from "~~/contracts/deployedContracts";
import { bigIntToU256Calldata } from "~~/utils/token";
import { useSDKStore } from "~~/hooks/useStarkZap";
import type { Token } from "../TokenSelector/index";
import {
  isValidStarknetAddress,
  isValidAmount,
  isValidU256Amount,
  MIN_DURATION_SECONDS,
} from "./validation";

const FACTORY_ADDRESS = deployedContracts.sepolia?.Factory?.address || "";

export function useDeploySchedule() {
  const [isLoading, setIsLoading] = useState(false);
  const { sendAsync: deploySendAsync, isPending: isDeployPending } =
    useScaffoldMultiWriteContract();
  const { onDeploySuccess } = useScheduleCacheActions();

  const deploy = useCallback(
    async (params: {
      isConnected: boolean;
      address: string | null;
      recipient: string;
      amount: string;
      amountDisplay: string;
      duration: string;
      curve: "linear" | "cliff" | "expdecay";
      selectedToken: Token;
      getStartTime: () => number;
      onSuccess?: () => void;
    }) => {
      const {
        isConnected,
        address,
        recipient,
        amount,
        amountDisplay,
        duration,
        curve,
        selectedToken,
        getStartTime,
        onSuccess,
      } = params;

      if (!isConnected || !address) {
        toast.error("Connect wallet first");
        return;
      }

      if (!recipient || !amount || !duration) {
        toast.error("Fill all fields");
        return;
      }

      if (!isValidStarknetAddress(recipient)) {
        toast.error("Invalid recipient address format");
        return;
      }

      if (!isValidAmount(amountDisplay)) {
        toast.error("Invalid amount");
        return;
      }

      if (!isValidU256Amount(amount)) {
        toast.error("Amount exceeds maximum allowed value");
        return;
      }

      const durationInSeconds = parseInt(duration);
      if (durationInSeconds < MIN_DURATION_SECONDS) {
        toast.error(
          `Duration must be at least ${MIN_DURATION_SECONDS} seconds`,
        );
        return;
      }

      // Balance check
      try {
        const { balanceOf } = useSDKStore.getState();
        const userBalance = await balanceOf(selectedToken.address);
        const requiredAmount = BigInt(amount || "0");

        if (userBalance < requiredAmount) {
          toast.error(`Insufficient ${selectedToken.symbol} balance`);
          return;
        }
      } catch (balanceError) {
        console.warn("[Deploy] Balance check failed:", balanceError);
        toast.error("Could not verify balance");
        return;
      }

      // Build calldata
      let lo: string, hi: string;
      try {
        const amountBigInt = BigInt(amount);
        [lo, hi] = bigIntToU256Calldata(amountBigInt);
      } catch (e) {
        toast.error("Invalid amount format");
        return;
      }

      const curveKey =
        curve === "linear"
          ? "LINEAR"
          : curve === "cliff"
            ? "CLIFF"
            : "EXP_DECAY";
      const startTime = getStartTime();
      setIsLoading(true);

      try {
        toast.loading("Approving & Deploying...", { id: "tx" });
        const tokenAddress = selectedToken.address;

        const calls: Call[] = [
          {
            contractAddress: tokenAddress,
            entrypoint: "approve",
            calldata: [FACTORY_ADDRESS, lo, hi],
          },
          {
            contractAddress: FACTORY_ADDRESS,
            entrypoint: "deploy_schedule",
            calldata: [
              recipient,
              lo,
              hi,
              startTime.toString(),
              duration,
              curveKey,
              "0",
              tokenAddress,
              address, // governance_address = funder
            ],
          },
        ];

        const txHash = await deploySendAsync(calls);

        if (txHash) {
          // Wait for RPC to confirm the transaction
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }

        // Invalidate schedules cache after successful deployment
        onDeploySuccess(address);

        toast.success(`Tx: ${txHash?.slice(0, 12)}…`, {
          id: "tx",
          duration: 6000,
        });
        onSuccess?.();
      } catch (e: unknown) {
        const errorMessage = (e as Error)?.message || "Failed";
        if (
          errorMessage.includes("Amount exceeds maximum") ||
          errorMessage.includes("insufficient")
        ) {
          toast.error(
            `Insufficient ${selectedToken.symbol} balance or not approved`,
            { id: "tx" },
          );
        } else if (errorMessage.includes("approve")) {
          toast.error("Approval failed", { id: "tx" });
        } else {
          toast.error(errorMessage, { id: "tx" });
        }
      } finally {
        setIsLoading(false);
      }
    },
    [deploySendAsync, onDeploySuccess],
  );

  const resetForm = useCallback(() => {
    // Called by parent component
  }, []);

  return {
    deploy,
    isLoading,
    isDeployPending,
    resetForm,
  };
}
