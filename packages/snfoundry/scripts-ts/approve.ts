/**
 * Manual approve script using starknet.js Call
 */

import { Account, Call, RpcProvider } from "starknet";

// Devnet config - use accounts_devnet.json
const RPC_URL = "http://127.0.0.1:5050";
const PRIVATE_KEY =
  "0x0000000000000000000000000000000071d7bb07b9a64f6f78ac4c816aff4da9";
const ACCOUNT_ADDRESS =
  "0x064b48806902a367c8598f4f95c305e8c1a1acba5f082d294a43793113115691";

// Contracts
const TOKEN_ADDRESS =
  "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d";
const FACTORY_ADDRESS =
  "0x5653cf6b417c98253131067cc0b6116db8a9ec2962709389d7b7063ac6ec706";

async function main() {
  console.log("=== Manual Approve Script ===\n");

  const provider = new RpcProvider({ nodeUrl: RPC_URL });
  const account = new Account({
    provider,
    address: ACCOUNT_ADDRESS,
    signer: PRIVATE_KEY,
    cairoVersion: "1",
  });
  console.log(`Account: ${account.address}`);

  const amount = "1000000000000000000"; // 1 ETH in hex
  console.log(`Approving ${amount} for Factory...`);

  // Build approve call manually
  const approveCall: Call = {
    contractAddress: TOKEN_ADDRESS,
    entrypoint: "approve",
    calldata: [FACTORY_ADDRESS, amount, "0"],
  };

  const result = await account.execute([approveCall]);
  console.log(`Transaction: ${result.transaction_hash}`);

  await provider.waitForTransaction(result.transaction_hash);
  console.log("Approved successfully!");
}

main().catch(console.error);
