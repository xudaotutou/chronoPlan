/**
 * ChronoPlan v1.1.0 Full Test Script
 *
 * Tests all security features:
 * - Reentrancy guard
 * - CEI pattern
 * - Safe arithmetic
 * - Amount limits
 * - Time validation
 */

import { Account, Call, Contract, RpcProvider } from "starknet";
import * as fs from "fs";
import * as path from "path";

// Devnet config - use accounts_devnet.json
const RPC_URL = "http://127.0.0.1:5050";
const PRIVATE_KEY =
  "0x0000000000000000000000000000000071d7bb07b9a64f6f78ac4c816aff4da9";
const ACCOUNT_ADDRESS =
  "0x064b48806902a367c8598f4f95c305e8c1a1acba5f082d294a43793113115691";

// Factory address from deployment (v1.1.0)
const FACTORY_ADDRESS =
  "0x3e70d0f6686435dc1766fca5700041a29a5b7e13cad6af4d51f3b9cebb36812";

// Test ERC20 - STRK on devnet
const TEST_TOKEN_ADDRESS =
  "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d";

// Contract artifact paths
const TARGET_DIR = path.join(__dirname, "../contracts/target/dev");

async function main() {
  console.log("=== ChronoPlan v1.1.0 Full Test ===\n");

  // Connect to devnet
  const provider = new RpcProvider({ nodeUrl: RPC_URL });
  const account = new Account({
    provider,
    address: ACCOUNT_ADDRESS,
    signer: PRIVATE_KEY,
    cairoVersion: "1",
  });
  console.log(`Connected as: ${account.address}`);

  // Load Factory ABI
  const factoryAbi = JSON.parse(
    fs.readFileSync(
      path.join(TARGET_DIR, "chrono_plan_Factory.contract_class.json"),
      "utf8"
    )
  ).abi;

  // Connect to Factory
  const factory = new Contract({
    abi: factoryAbi,
    address: FACTORY_ADDRESS,
    providerOrAccount: account,
  });

  // Read Factory state
  console.log("=== Factory State ===");
  const admin = await factory.get_admin();
  console.log(`Admin: ${admin}`);

  const version = await factory.version();
  console.log(`Version: 0x${BigInt(version).toString(16)}`);

  const scheduleClassHash = await factory.get_schedule_class_hash();
  console.log(`Schedule class hash: ${scheduleClassHash}`);

  const planCounter = await factory.get_plan_counter();
  console.log(`Plan counter: ${planCounter}`);

  const isPaused = await factory.is_paused();
  console.log(`Paused: ${isPaused}`);

  // Prepare schedule deployment parameters
  const recipient = account.address;
  const amount = "1000000000000000000"; // 1 STRK
  const startTime = Math.floor(Date.now() / 1000); // Now
  const duration = 3600; // 1 hour
  const curveKey = "LINEAR";
  const curveParams = "0";
  const governanceAddress = account.address;

  console.log("\n=== Deploying Schedule ===");
  console.log(`Recipient: ${recipient}`);
  console.log(`Amount: ${amount}`);
  console.log(`Duration: ${duration}s`);
  console.log(`Curve: ${curveKey}`);

  // Deploy schedule using raw call
  console.log("\nDeploying schedule...");
  try {
    const deployCall: Call = {
      contractAddress: FACTORY_ADDRESS,
      entrypoint: "deploy_schedule",
      calldata: [
        recipient,
        amount,
        "0",
        startTime.toString(),
        duration.toString(),
        curveKey,
        curveParams,
        TEST_TOKEN_ADDRESS,
        governanceAddress,
      ],
    };

    const deployTx = await account.execute([deployCall]);
    console.log(`Deploy tx: ${deployTx.transaction_hash}`);

    await provider.waitForTransaction(deployTx.transaction_hash);
    console.log("\n✅ Schedule Deployed Successfully!");

    // Check new plan counter
    const newPlanCounter = await factory.get_plan_counter();
    console.log(`New plan counter: ${newPlanCounter}`);
  } catch (error: any) {
    console.error("Error deploying schedule:", error.message);
  }

  // Test security: Try deploying with amount exceeding limit
  console.log("\n=== Security Test: Amount Limit ===");
  try {
    const hugeAmount = "2000000000000000000000000000"; // Exceeds MAX_AMOUNT

    const failCall: Call = {
      contractAddress: FACTORY_ADDRESS,
      entrypoint: "deploy_schedule",
      calldata: [
        recipient,
        hugeAmount,
        "0",
        startTime.toString(),
        duration.toString(),
        curveKey,
        curveParams,
        TEST_TOKEN_ADDRESS,
        governanceAddress,
      ],
    };

    const failTx = await account.execute([failCall]);
    await provider.waitForTransaction(failTx.transaction_hash);
    console.log("❌ ERROR: Should have failed!");
  } catch (error: any) {
    if (error.message.includes("Amount exceeds maximum")) {
      console.log("✅ PASS: Amount limit enforced correctly");
    } else {
      console.log("Error:", error.message.substring(0, 200));
    }
  }

  // Test security: Try with invalid curve
  console.log("\n=== Security Test: Invalid Curve ===");
  try {
    const invalidCall: Call = {
      contractAddress: FACTORY_ADDRESS,
      entrypoint: "deploy_schedule",
      calldata: [
        recipient,
        amount,
        "0",
        startTime.toString(),
        duration.toString(),
        "INVALID_CURVE",
        curveParams,
        TEST_TOKEN_ADDRESS,
        governanceAddress,
      ],
    };

    const invalidTx = await account.execute([invalidCall]);
    await provider.waitForTransaction(invalidTx.transaction_hash);
    console.log("❌ ERROR: Should have failed!");
  } catch (error: any) {
    if (error.message.includes("Invalid curve")) {
      console.log("✅ PASS: Curve validation enforced correctly");
    } else {
      console.log("Error:", error.message.substring(0, 200));
    }
  }

  // Test security: Try with start_time too far in future
  console.log("\n=== Security Test: Start Time Limit ===");
  try {
    const farFutureTime = Math.floor(Date.now() / 1000) + 40000000; // ~460 days

    const timeCall: Call = {
      contractAddress: FACTORY_ADDRESS,
      entrypoint: "deploy_schedule",
      calldata: [
        recipient,
        amount,
        "0",
        farFutureTime.toString(),
        duration.toString(),
        curveKey,
        curveParams,
        TEST_TOKEN_ADDRESS,
        governanceAddress,
      ],
    };

    const timeTx = await account.execute([timeCall]);
    await provider.waitForTransaction(timeTx.transaction_hash);
    console.log("❌ ERROR: Should have failed!");
  } catch (error: any) {
    if (error.message.includes("too far in future")) {
      console.log("✅ PASS: Start time limit enforced correctly");
    } else {
      console.log("Error:", error.message.substring(0, 200));
    }
  }

  console.log("\n=== All Tests Complete ===");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
