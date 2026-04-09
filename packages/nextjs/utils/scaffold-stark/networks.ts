import scaffoldConfig from "~~/scaffold.config";

// Chain ID constants
export const CHAIN_ID_MAINNET = BigInt("0x534e5f4d41494e");
export const CHAIN_ID_SEPOLIA = BigInt("0x534e5f5345504f4c4941");
export const CHAIN_ID_DEVNET = BigInt("0x534e5f6465766e6574");

// Network metadata
export const networks = {
  mainnet: {
    id: CHAIN_ID_MAINNET,
    network: "mainnet" as const,
    name: "Starknet Mainnet",
    rpcUrls: {
      public: {
        http: ["https://starknet-mainnet.public.blastapi.io/rpc/v0_9"],
      },
    },
    explorers: { voyager: ["https://voyager.online"] },
  },
  sepolia: {
    id: CHAIN_ID_SEPOLIA,
    network: "sepolia" as const,
    name: "Starknet Sepolia",
    rpcUrls: {
      public: {
        http: ["https://starknet-sepolia.public.blastapi.io/rpc/v0_9"],
      },
    },
    explorers: { voyager: ["https://sepolia.voyager.online"] },
  },
  devnet: {
    id: CHAIN_ID_DEVNET,
    network: "devnet" as const,
    name: "Starknet Devnet",
    rpcUrls: { public: { http: ["http://127.0.0.1:5050/rpc"] } },
    explorers: { voyager: ["https://voyager.online"] },
  },
} as const;

// Chain type for compatibility - allows any network name
export type Chain = {
  id: bigint;
  network: string;
  name: string;
  rpcUrls: { public: { http: readonly string[] } };
  explorers?: { voyager?: readonly string[] };
};

// Aliases for backward compatibility
export const devnet = networks.devnet;
export const sepolia = networks.sepolia;
export const mainnet = networks.mainnet;
export const chains = { devnet, sepolia, mainnet };

type ChainAttributes = {
  // color | [lightThemeColor, darkThemeColor]
  color: string | [string, string];
  nativeCurrencyTokenAddress?: string;
};

export type ChainWithAttributes = Chain & Partial<ChainAttributes>;

export const NETWORKS_EXTRA_DATA: Record<string, ChainAttributes> = {
  [chains.devnet.network]: {
    color: "#b8af0c",
  },
  [chains.mainnet.network]: {
    color: "#ff8b9e",
  },
  [chains.sepolia.network]: {
    color: ["#5f4bb6", "#87ff65"],
  },
};
/**
 * Gives the block explorer transaction URL, returns empty string if the network is a local chain
 */
export function getBlockExplorerTxLink(network: string, txnHash: string) {
  const chainNames = Object.keys(chains);

  const targetChainArr = chainNames.filter((chainName) => {
    const starknetReactChain = chains[
      chainName as keyof typeof chains
    ] as Chain;
    return starknetReactChain.network === network;
  });

  if (targetChainArr.length === 0) {
    return "";
  }

  const targetChain = targetChainArr[0] as keyof typeof chains;
  const blockExplorerBaseURL = (chains[targetChain] as Chain).explorers
    ?.voyager?.[0];

  if (!blockExplorerBaseURL) {
    return `https://voyager.online/tx/${txnHash}`;
  }

  return `${blockExplorerBaseURL}/tx/${txnHash}`;
}

/**
 * Gives the block explorer URL for a given address.
 * Defaults to Voyager if no block explorer is configured for the network.
 */
export function getBlockExplorerAddressLink(network: Chain, address: string) {
  const blockExplorerBaseURL = network.explorers?.voyager?.[0];
  if (network.network === chains.devnet.network) {
    return `/blockexplorer/address/${address}`;
  }

  if (!blockExplorerBaseURL) {
    return `https://voyager.online/contract/${address}`;
  }

  return `${blockExplorerBaseURL}/contract/${address}`;
}

/**
 * Gives the block explorer URL for a given classhash.
 * Defaults to Voyager if no block explorer is configured for the network.
 */
export function getBlockExplorerClasshashLink(network: Chain, address: string) {
  const blockExplorerBaseURL = network.explorers?.voyager?.[0];
  if (network.network === chains.devnet.network) {
    return `/blockexplorer/class/${address}`;
  }

  if (!blockExplorerBaseURL) {
    return `https://voyager.online/class/${address}`;
  }

  return `${blockExplorerBaseURL}/class/${address}`;
}

export function getBlockExplorerLink(network: Chain) {
  switch (network.network) {
    case "mainnet":
      return "https://voyager.online/";
    case "devnet":
      return "https://127.0.0.1:5050/";
    case "sepolia":
      return "https://sepolia.voyager.online/";
    default:
      return "https://voyager.online/";
  }
}

export function getTargetNetworks(): ChainWithAttributes[] {
  return scaffoldConfig.targetNetworks.map((targetNetwork) => ({
    ...targetNetwork,
  }));
}
