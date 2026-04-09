import { supportedChains as chains } from "./supportedChains";

// Local minimal chain type
export type NetworkName = "mainnet" | "sepolia" | "devnet";

export type ScaffoldConfig = {
  targetNetworks: readonly {
    id: bigint;
    network: string;
    name: string;
    rpcUrls: {
      default: { http: string[] };
      public: { http: string[] };
    };
    explorers?: { voyager?: string[] };
    testnet?: boolean;
    nativeCurrency?: {
      name: string;
      symbol: string;
      decimals: number;
      address?: `0x${string}`;
    };
    paymasterRpcUrls?: {
      avnu?: { http: string[] };
    };
  }[];
  pollingInterval: number;
  onlyLocalBurnerWallet: boolean;
  walletAutoConnect: boolean;
  autoConnectTTL: number;
};

const scaffoldConfig = {
  targetNetworks: [chains.sepolia],
  // Only show the Burner Wallet when running on devnet
  onlyLocalBurnerWallet: false,
  // The interval at which your front-end polls the RPC servers for new data
  // it has no effect if you only target the local network (default is 30_000)
  pollingInterval: 30_000,
  /**
   * Auto connect:
   * 1. If the user was connected into a wallet before, on page reload reconnect automatically
   * 2. If user is not connected to any wallet:  On reload, connect to burner wallet if burnerWallet.enabled is true && burnerWallet.onlyLocal is false
   */
  autoConnectTTL: 86_400_000, // 24 hours
  walletAutoConnect: true,
} as const satisfies ScaffoldConfig;

export default scaffoldConfig;
