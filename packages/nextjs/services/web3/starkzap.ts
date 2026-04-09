/**
 * StarkZap service layer for ChronoPlan
 *
 * This module re-exports functionality from the SDK store.
 * All wallet and SDK state is now managed in useSDKStore.
 */

import type { Call } from "starknet";
import type { WalletInterface } from "starkzap";

// Re-export the store
export { useSDKStore } from "../store/sdk";

// Wallet state helpers
export let currentWallet: WalletInterface | null = null;

// Callbacks for wallet state changes
type WalletChangeCallback = (wallet: WalletInterface | null) => void;
const walletChangeListeners: Set<WalletChangeCallback> = new Set();

// Get current wallet
export function getCurrentWallet(): WalletInterface | null {
  return currentWallet;
}

// Subscribe to wallet changes
export function onWalletChange(callback: WalletChangeCallback): () => void {
  walletChangeListeners.add(callback);
  return () => walletChangeListeners.delete(callback);
}

// Notify listeners of wallet changes
export function notifyWalletChange(wallet: WalletInterface | null) {
  currentWallet = wallet;
  walletChangeListeners.forEach((callback) => callback(wallet));
}

// Connect with signer (private key)
export async function connectWithSigner(
  privateKey: string,
): Promise<WalletInterface> {
  const { useSDKStore } = await import("../store/sdk");
  await useSDKStore.getState().connectWithPrivateKey(privateKey);
  const wallet = useSDKStore.getState().wallet;
  if (wallet) {
    currentWallet = wallet;
    notifyWalletChange(wallet);
  }
  return wallet!;
}

// Connect with Cartridge
export async function connectWithCartridge(): Promise<WalletInterface> {
  const { useSDKStore } = await import("../store/sdk");
  await useSDKStore.getState().connectWithCartridge();
  const wallet = useSDKStore.getState().wallet;
  if (wallet) {
    currentWallet = wallet;
    notifyWalletChange(wallet);
  }
  return wallet!;
}

// Execute transactions
export async function executeTransactions(calls: Call[]): Promise<{
  txHash: string;
  explorerUrl: string;
  wait: () => Promise<void>;
}> {
  const { useSDKStore } = await import("../store/sdk");
  const state = useSDKStore.getState();
  if (!state.wallet) throw new Error("Wallet not connected");
  const tx = await state.wallet.execute(calls);
  return {
    txHash: tx.hash,
    explorerUrl: tx.explorerUrl,
    wait: () => tx.wait(),
  };
}

// Call contract
export async function callContract(
  address: string,
  functionName: string,
  args?: (string | number | bigint)[],
): Promise<unknown> {
  const { useSDKStore } = await import("../store/sdk");
  const sdk = useSDKStore.getState().getSDK();
  return sdk.callContract({
    contractAddress: address as `0x${string}`,
    entrypoint: functionName,
    calldata: args || [],
  });
}
