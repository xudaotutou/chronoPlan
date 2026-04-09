const { RpcProvider, Account } = require("starknet");
const fs = require("fs");
const path = require("path");

// Configuration
const RPC_URL = "http://127.0.0.1:5055";
const ACCOUNT_ADDRESS = "0x05adf3832d27b78548919a6f942dce11db0a2af9ac3b671726f06c9c1fb297e7";
const PRIVATE_KEY = "0x00000000000000000000000000000000b5a3771e2d8c96e925441cf3d60b4b47";

async function main() {
    console.log("Connecting to devnet at", RPC_URL);
    const provider = new RpcProvider({ nodeUrl: RPC_URL });
    
    console.log("Creating account...");
    const account = new Account({
        provider,
        address: ACCOUNT_ADDRESS,
        signer: PRIVATE_KEY,
        cairoVersion: "1"
    });
    
    console.log("Account address:", account.address);
    
    // Read compiled contracts
    const targetDir = path.join(__dirname, "../contracts/target/dev");
    
    // Declare Schedule
    console.log("\n--- Declaring Schedule Proxy ---");
    const scheduleProxyPath = path.join(targetDir, "chrono_plan_ScheduleProxy.contract_class.json");
    if (fs.existsSync(scheduleProxyPath)) {
        const scheduleProxyArtifact = JSON.parse(fs.readFileSync(scheduleProxyPath, 'utf8'));
        
        try {
            const scheduleDeclare = await account.declare({
                contract: scheduleProxyArtifact,
                compiledClassHash: scheduleProxyArtifact.compiled_class_hash,
            });
            console.log("Schedule Proxy declared:", scheduleDeclare.class_hash);
        } catch (e) {
            console.log("Schedule declare error:", e.message || e);
        }
    } else {
        console.log("Schedule proxy artifact not found:", scheduleProxyPath);
    }
    
    // Declare Factory
    console.log("\n--- Declaring Factory ---");
    const factoryPath = path.join(targetDir, "chrono_plan_Factory.contract_class.json");
    if (fs.existsSync(factoryPath)) {
        const factoryArtifact = JSON.parse(fs.readFileSync(factoryPath, 'utf8'));
        
        try {
            const factoryDeclare = await account.declare({
                contract: factoryArtifact,
                compiledClassHash: factoryArtifact.compiled_class_hash,
            });
            console.log("Factory declared:", factoryDeclare.class_hash);
        } catch (e) {
            console.log("Factory declare error:", e.message || e);
        }
    } else {
        console.log("Factory artifact not found:", factoryPath);
    }
    
    console.log("\n--- Done ---");
}

main().catch(console.error);
