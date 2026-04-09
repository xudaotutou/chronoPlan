import { getTargetNetworks } from "~~/utils/scaffold-stark";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type WalletType = any;

const targetNetworks = getTargetNetworks();

export const appChains = targetNetworks;

// Cache for extra wallets (lazy initialization)
let cachedExtraWallets: WalletType[] | null = null;

export async function getExtraWallets(): Promise<WalletType[]> {
  if (cachedExtraWallets) {
    return cachedExtraWallets;
  }

  const wallets: WalletType[] = [];

  cachedExtraWallets = wallets;
  return wallets;
}

// Synchronous version that returns empty array for SSR
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const extraWallets: any[] = [];
