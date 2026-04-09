import { RpcProvider, Account } from "starknet";

const RPC_URL = "http://127.0.0.1:5050";
const ACCOUNT_ADDRESS = "0x4b3f4ba8c00a02b66142a4b1dd41a4dfab4f92650922a3280977b0f03c75ee1";

async function main() {
  const provider = new RpcProvider({ nodeUrl: RPC_URL });
  
  // Mint ETH
  console.log("Minting ETH...");
  try {
    await provider.mint({
      address: ACCOUNT_ADDRESS,
      amount: 1_000_000_000_000_000_000n, // 1 ETH in wei
      tokenAddress: "eth",
    });
    console.log("ETH minted!");
  } catch (e: any) {
    console.log("Mint ETH error:", e.message);
  }
}

main().catch(console.error);
