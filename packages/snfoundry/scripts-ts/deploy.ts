import {
  deployContract,
  declareContract,
  executeDeployCalls,
  exportDeployments,
  deployer,
  assertDeployerDefined,
  assertRpcNetworkActive,
  assertDeployerSignable,
} from "./deploy-contract";
import { CallData } from "starknet";
import { green, red } from "./helpers/colorize-log";

/**
 * ChronoPlan Deployment Script
 *
 * Deploys:
 * 1. Registry - Indexes all Schedule plans for easy querying
 * 2. ScheduleProxy - Declared class (registered on Factory as template)
 * 3. Factory - Contract factory for creating Schedule plans
 *    - Constructor: admin = deployer
 *    - Automatically calls set_schedule_class_hash and set_registry
 *
 * Usage:
 *   yarn deploy --network devnet
 *   yarn deploy --network sepolia
 *
 * Note:
 *   - Registry is optional. If you already have a Factory deployed,
 *   - you can set the registry separately using set_registry().
 */
const deployScript = async (): Promise<void> => {
  console.log(green("\n=== ChronoPlan Deployment ===\n"));

  // Step 1: Deploy Registry
  console.log(green("Step 1: Deploying Registry..."));
  const registryResult = await deployContract({
    contract: "Registry",
    contractName: "Registry",
    constructorArgs: {
      admin: deployer.address,
    },
  });
  console.log(green(`Registry deployed at: ${registryResult.address}\n`));

  // Step 2: Declare ScheduleProxy class (not deployed, used as template by Factory)
  console.log(green("Step 2: Declaring ScheduleProxy..."));
  const scheduleResult = await declareContract({
    contract: "ScheduleProxy",
    contractName: "ScheduleProxy",
  });
  console.log(green(`ScheduleProxy class hash: ${scheduleResult.classHash}\n`));

  // Step 3: Deploy Factory with admin = deployer
  console.log(green("Step 3: Deploying Factory..."));
  const factoryResult = await deployContract({
    contract: "Factory",
    contractName: "Factory",
    constructorArgs: {
      admin: deployer.address,
    },
  });
  console.log(green(`Factory deployed at: ${factoryResult.address}\n`));

  // Step 4: Execute pending deployments first
  console.log(green("Step 4: Executing deployments..."));
  await executeDeployCalls();

  // Step 5: Register ScheduleProxy on Factory
  console.log(green("\nStep 5: Registering ScheduleProxy on Factory..."));
  const setClassHashCall = {
    contractAddress: factoryResult.address,
    entrypoint: "set_schedule_class_hash",
    calldata: CallData.compile({
      class_hash: scheduleResult.classHash,
    }),
  };

  // Step 6: Register Registry on Factory
  console.log(green("\nStep 6: Registering Registry on Factory..."));
  const setRegistryCall = {
    contractAddress: factoryResult.address,
    entrypoint: "set_registry",
    calldata: CallData.compile({
      registry: registryResult.address,
    }),
  };

  // Step 7: Set Factory as authorized caller in Registry
  console.log(
    green("\nStep 7: Setting Factory as authorized caller in Registry...")
  );
  const setFactoryCall = {
    contractAddress: registryResult.address,
    entrypoint: "set_factory",
    calldata: CallData.compile({
      factory: factoryResult.address,
    }),
  };

  // const executeOptions = networkName === "devnet" ? { tip: 1000n } : {};
  const { transaction_hash } = await deployer.execute(
    [setClassHashCall, setRegistryCall, setFactoryCall]
    // executeOptions
  );
  console.log(
    green(
      `set_schedule_class_hash + set_registry + set_factory transaction: ${transaction_hash}\n`
    )
  );
};

const main = async (): Promise<void> => {
  try {
    assertDeployerDefined();
    await Promise.all([assertRpcNetworkActive(), assertDeployerSignable()]);
    await deployScript();
    exportDeployments();
    console.log(green("\n=== Deployment Complete ==="));
    console.log(
      green("\nYou can now deploy schedules with Factory.deploy_schedule()")
    );
  } catch (err) {
    if (err instanceof Error) {
      console.error(red(err.message));
    } else {
      console.error(err);
    }
    process.exit(1);
  }
};

main();
