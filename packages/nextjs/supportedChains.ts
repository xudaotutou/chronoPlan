// Minimal chain type for starkzap migration
export type Chain = {
  id: bigint;
  network: string;
  name: string;
  nativeCurrency?: {
    name: string;
    symbol: string;
    decimals: number;
    address?: `0x${string}`;
  };
  testnet?: boolean;
  rpcUrls: {
    default: { http: string[] };
    public: { http: string[] };
  };
  explorers?: { voyager?: string[] };
  paymasterRpcUrls?: {
    avnu?: { http: string[] };
  };
};

// Chain IDs
const MAINNET_ID = BigInt("0x534e5f4d41494e"); // "SN_MAIN"
const SEPOLIA_ID = BigInt("0x534e5f5345504f4c4941"); // "SN_SEPOLIA"
const DEVNET_ID = BigInt("0x534e5f6465766e6574"); // "SN_devnet"

const rpcUrlDevnet =
  process.env.NEXT_PUBLIC_DEVNET_PROVIDER_URL || "http://127.0.0.1:5050";
// devnet with mainnet network ID
const mainnetFork: Chain = {
  id: MAINNET_ID,
  network: "devnet",
  name: "Starknet Mainnet Fork",
  nativeCurrency: {
    address:
      "0x4718F5A0FC34CC1AF16A1CDEE98FFB20C31F5CD61D6AB07201858F4287C938D" as `0x${string}`,
    name: "STRK",
    symbol: "STRK",
    decimals: 18,
  },
  testnet: true,
  rpcUrls: {
    default: {
      http: [],
    },
    public: {
      http: [`${rpcUrlDevnet}/rpc`],
    },
  },
  paymasterRpcUrls: {
    avnu: {
      http: [rpcUrlDevnet],
    },
  },
};

const devnet: Chain = {
  id: DEVNET_ID,
  network: "devnet",
  name: "Starknet Devnet",
  rpcUrls: {
    default: {
      http: [],
    },
    public: {
      http: [`${rpcUrlDevnet}/rpc`],
    },
  },
};

const rpcUrlSepolia =
  process.env.NEXT_PUBLIC_SEPOLIA_PROVIDER_URL ||
  "https://starknet-sepolia.public.blastapi.io/rpc/v0_9";

const sepolia: Chain = {
  id: SEPOLIA_ID,
  network: "sepolia",
  name: "Starknet Sepolia",
  testnet: true,
  rpcUrls: {
    default: {
      http: [],
    },
    public: {
      http: [rpcUrlSepolia],
    },
  },
};

const mainnet: Chain = {
  id: MAINNET_ID,
  network: "mainnet",
  name: "Starknet Mainnet",
  rpcUrls: {
    default: {
      http: [],
    },
    public: {
      http: ["https://starknet-mainnet.public.blastapi.io/rpc/v0_9"],
    },
  },
};

export const supportedChains: {
  mainnetFork: Chain;
  devnet: Chain;
  sepolia: Chain;
  mainnet: Chain;
} = { mainnetFork, devnet, sepolia, mainnet };

// Export chain IDs and types for backward compatibility
export { MAINNET_ID, SEPOLIA_ID, DEVNET_ID };
