import scaffoldConfig from "~~/scaffold.config";
import { RpcProvider } from "starknet";

// Get the current target network (first one in the array)
const currentNetwork = scaffoldConfig.targetNetworks[0];
const currentNetworkName = currentNetwork.network;

// Public RPC URLs as fallback (no API key required)
const PUBLIC_RPC_URLS = {
  devnet: "http://127.0.0.1:5050",
  sepolia: "https://starknet-sepolia.public.blastapi.io/rpc/v0_9",
  mainnet: "https://starknet-mainnet.public.blastapi.io/rpc/v0_9",
};

export const getRpcUrl = (networkName: string): string => {
  const devnetRpcUrl = process.env.NEXT_PUBLIC_DEVNET_PROVIDER_URL;
  const sepoliaRpcUrl = process.env.NEXT_PUBLIC_SEPOLIA_PROVIDER_URL;
  const mainnetRpcUrl = process.env.NEXT_PUBLIC_MAINNET_PROVIDER_URL;

  let rpcUrl = "";

  switch (networkName) {
    case "devnet":
      rpcUrl = devnetRpcUrl || PUBLIC_RPC_URLS.devnet;
      break;
    case "sepolia":
      rpcUrl = sepoliaRpcUrl || PUBLIC_RPC_URLS.sepolia;
      break;
    case "mainnet":
      rpcUrl = mainnetRpcUrl || PUBLIC_RPC_URLS.mainnet;
      break;
    default:
      rpcUrl = PUBLIC_RPC_URLS.devnet;
      break;
  }

  return rpcUrl;
};

// Get RPC URL for the current network
const rpcUrl = getRpcUrl(currentNetworkName);

// Warn if using public provider
if (
  !process.env[`NEXT_PUBLIC_${currentNetworkName.toUpperCase()}_PROVIDER_URL`]
) {
  console.warn(
    `No RPC Provider URL configured for ${currentNetworkName}. Using public provider.`,
  );
}

const provider = new RpcProvider({
  nodeUrl: rpcUrl,
});

export default provider;
