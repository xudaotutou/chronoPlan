"use client";

import { create } from "zustand";
import scaffoldConfig from "~~/scaffold.config";
import {
  StarkZap,
  ChainId,
  StarkSigner,
  OnboardStrategy,
  BraavosPreset,
  type WalletInterface,
} from "starkzap";
import type { Call } from "starknet";

// ============================================================================
// Types
// ============================================================================

interface SDKState {
  // SDK state
  sdk: StarkZap | null;
  initSDK: () => StarkZap;

  // Wallet state
  wallet: WalletInterface | null;
  address: string | undefined;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | undefined;
  chainId: bigint | undefined;
  networkName: string;
  isWrongNetwork: boolean;
  isDeployed: boolean;

  // Actions - SDK
  getSDK: () => StarkZap;

  // Actions - Wallet
  setWallet: (wallet: WalletInterface | null) => void;
  setConnecting: (connecting: boolean) => void;
  setError: (error: string | undefined) => void;
  setChainId: (chainId: bigint | undefined) => void;
  setIsDeployed: (deployed: boolean) => void;
  connectWithPrivateKey: (privateKey: string) => Promise<void>;
  connectWithCartridge: () => Promise<void>;
  disconnect: () => Promise<void>;
  execute: (calls: Call[]) => Promise<{
    txHash: string;
    explorerUrl: string;
    wait: () => Promise<void>;
  }>;
  balanceOf: (tokenAddress: string) => Promise<bigint>;
  getWallet: () => WalletInterface | null;
}

// ============================================================================
// Helpers
// ============================================================================

const getRpcUrl = (): string => {
  const network = scaffoldConfig.targetNetworks[0].network;
  switch (network) {
    case "mainnet":
      return process.env.NEXT_PUBLIC_MAINNET_PROVIDER_URL || "";
    case "sepolia":
      return process.env.NEXT_PUBLIC_SEPOLIA_PROVIDER_URL || "";
    case "devnet":
      return (
        process.env.NEXT_PUBLIC_DEVNET_PROVIDER_URL || "http://127.0.0.1:5050"
      );
    default:
      return process.env.NEXT_PUBLIC_SEPOLIA_PROVIDER_URL || "";
  }
};

const getNetworkName = (): "mainnet" | "sepolia" => {
  const network = scaffoldConfig.targetNetworks[0].network as string;
  if (network === "mainnet") return "mainnet";
  return "sepolia";
};

const getTargetChainId = (): bigint => {
  return BigInt(scaffoldConfig.targetNetworks[0].id);
};

const chainIdToBigint = (
  chainId: { toFelt252: () => string } | string | null,
): bigint | undefined => {
  if (!chainId) return undefined;
  if (typeof chainId === "string") {
    return BigInt(chainId);
  }
  return BigInt(chainId.toFelt252());
};

// ============================================================================
// Store
// ============================================================================

export const useSDKStore = create<SDKState>((set, get) => ({
  // SDK state
  sdk: null,

  initSDK: () => {
    const existing = get().sdk;
    if (existing) return existing;

    const rpcUrl = getRpcUrl();
    const network = getNetworkName();
    const sdk = new StarkZap({
      network,
      chainId: network === "mainnet" ? ChainId.MAINNET : ChainId.SEPOLIA,
      rpcUrl,
    });

    set({ sdk });
    return sdk;
  },

  getSDK: () => {
    return get().initSDK();
  },

  // Wallet state
  wallet: null,
  address: undefined,
  isConnected: false,
  isConnecting: false,
  error: undefined,
  chainId: undefined,
  networkName: scaffoldConfig.targetNetworks[0].network,
  isWrongNetwork: false,
  isDeployed: false,

  // Wallet actions
  setWallet: (wallet) => {
    const targetChainId = getTargetChainId();
    set({
      wallet,
      address: wallet?.address,
      isConnected: wallet !== null,
      isWrongNetwork:
        wallet !== null && get().chainId !== undefined
          ? get().chainId !== targetChainId
          : false,
    });
  },

  setConnecting: (isConnecting) => set({ isConnecting }),
  setError: (error) => set({ error }),

  setChainId: (chainId) => {
    const targetChainId = getTargetChainId();
    set({
      chainId,
      isWrongNetwork:
        get().isConnected && chainId !== undefined
          ? chainId !== targetChainId
          : false,
    });
  },

  setIsDeployed: (isDeployed) => set({ isDeployed }),

  connectWithPrivateKey: async (privateKey: string) => {
    set({ isConnecting: true, error: undefined });
    try {
      const sdk = get().initSDK();
      const { wallet } = await sdk.onboard({
        strategy: OnboardStrategy.Signer,
        account: {
          signer: new StarkSigner(privateKey),
          accountClass: BraavosPreset,
        },
        deploy: "if_needed",
      });
      set({ wallet, address: wallet.address, isConnected: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to connect";
      set({ error: message });
      throw err;
    } finally {
      set({ isConnecting: false });
    }
  },
  connectWithCartridge: async () => {
    set({ isConnecting: true, error: undefined });
    try {
      const sdk = get().initSDK();
      const { wallet } = await sdk.onboard({
        strategy: OnboardStrategy.Cartridge,
        deploy: "if_needed",
      });
      // Update all wallet state
      const chainId = chainIdToBigint(wallet.getChainId());
      const deployed = await wallet.isDeployed().catch(() => false);
      get().setWallet(wallet);
      get().setChainId(chainId);
      get().setIsDeployed(deployed);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to connect";
      set({ error: message });
      throw err;
    } finally {
      set({ isConnecting: false });
    }
  },
  disconnect: async () => {
    const { wallet } = get();
    try {
      if (wallet?.disconnect) {
        await wallet.disconnect();
      }
    } catch (err) {
      console.warn("Wallet disconnect error:", err);
    }
    set({
      wallet: null,
      address: undefined,
      isConnected: false,
      isDeployed: false,
    });
  },

  execute: async (calls: Call[]) => {
    const { wallet } = get();
    if (!wallet) throw new Error("Wallet not connected");
    const tx = await wallet.execute(calls);
    return {
      txHash: tx.hash,
      explorerUrl: tx.explorerUrl,
      wait: () => tx.wait(),
    };
  },

  balanceOf: async (tokenAddress: string) => {
    const { wallet } = get();
    if (!wallet) throw new Error("Wallet not connected");
    const sdk = get().initSDK();
    const result = await sdk.callContract({
      contractAddress: tokenAddress as `0x${string}`,
      entrypoint: "balance_of",
      calldata: [wallet.address],
    });
    const balanceArray = result as string[];
    if (!balanceArray || balanceArray.length === 0) return 0n;
    if (balanceArray.length === 1) return BigInt(balanceArray[0]);
    const low = BigInt(balanceArray[0]);
    const high = BigInt(balanceArray[1]);
    return (high << 128n) + low;
  },

  getWallet: () => get().wallet,
}));

// ============================================================================
// Wallet Subscription (singleton pattern)
// ============================================================================

let isSubscribed = false;
let unsubscribeWallet: (() => void) | null = null;

async function initWalletSubscription() {
  if (isSubscribed || typeof window === "undefined") return;
  isSubscribed = true;

  const { getCurrentWallet, onWalletChange } = await import("../web3/starkzap");

  const existingWallet = getCurrentWallet();
  if (existingWallet) {
    useSDKStore.getState().setWallet(existingWallet);
    useSDKStore
      .getState()
      .setChainId(chainIdToBigint(existingWallet.getChainId()));
    try {
      const deployed = await existingWallet.isDeployed();
      useSDKStore.getState().setIsDeployed(deployed);
    } catch {
      useSDKStore.getState().setIsDeployed(false);
    }
  }

  unsubscribeWallet = onWalletChange((newWallet) => {
    useSDKStore.getState().setWallet(newWallet);
    useSDKStore
      .getState()
      .setChainId(chainIdToBigint(newWallet?.getChainId() ?? null));
    if (newWallet) {
      newWallet
        .isDeployed()
        .then((deployed: boolean) =>
          useSDKStore.getState().setIsDeployed(deployed),
        )
        .catch(() => useSDKStore.getState().setIsDeployed(false));
    } else {
      useSDKStore.getState().setIsDeployed(false);
    }
  });
}

if (typeof window !== "undefined") {
  initWalletSubscription();
}

// Backward Compatibility Exports
