# ChronoPlan

Modular TWAMM (Time-Weighted Average Mass Meeting) Schedule System built on Starknet.

## Overview

ChronoPlan enables programmatic token release schedules with pluggable release curves, recipient validators, and flexible governance models. Perfect for team vesting, airdrops, token sales, and any scenario requiring time-based token distribution.

### What is TWAMM?

TWAMM (Time-Weighted Average Mass Meeting) refers to vesting schedules where tokens are released over time according to predefined rules. Unlike simple cliff/linear vesting, ChronoPlan provides:

- **Modular curves**: Choose from Linear, Cliff, or Exponential Decay release patterns
- **Batch scheduling**: Create multiple sequential plans for complex tokenomics
- **Template system**: Save and reuse configurations for consistent deployments
- **Multi-chain support**: Deploy across Starknet networks (devnet, sepolia, mainnet)

## Features

### Plan Management
- Create vesting plans with customizable parameters
- Claim available tokens at any time
- Monitor plan status and claim history
- Close or finalize plans via governance

### Release Curves

| Curve | Description | Use Case |
|-------|-------------|----------|
| **Linear** | Tokens release evenly over time | Standard vesting, team allocations |
| **Cliff** | No release until cliff period ends, then linear | Investor protection, initial lockup |
| **Exp Decay** | Fast initial release, tapering to slower release | Engagement rewards, gamified distributions |

### Templates
- Preset templates for common vesting scenarios
- Save custom templates from successful deployments
- Import/export templates for backup and sharing
- Quick-apply to new plan creation

### Pro Mode
- Visual timeline editor for batch plan creation
- Multiple sequential vesting rounds in one transaction

## Architecture

```
packages/
├── nextjs/                  # Frontend (Next.js 16)
│   ├── app/                 # App router pages
│   │   ├── components/      # Reusable UI components
│   │   └── page.tsx         # Main application page
│   └── hooks/               # Custom React hooks
└── snfoundry/               # Smart contracts (Cairo)
    ├── contracts/
    │   └── src/
    │       ├── domain/      # Core business logic (traits, types)
    │       ├── infrastructure/  # Adapters (token, time)
    │       ├── interfaces/  # External contract interfaces
    │       └── application/ # Business orchestration (factory, schedule)
    └── scripts-ts/          # Deployment and test scripts
```

### Contract Layers

| Layer | Purpose | Example |
|-------|---------|---------|
| **Domain** | Pure business logic, no external dependencies | `ICurveAlgorithm`, `DeploymentSpec` |
| **Infrastructure** | External system adapters | `ITokenAdapter`, `ITimeSource` |
| **Interfaces** | External contract ABIs | `IFactory`, `ISchedule` |
| **Application** | Business orchestration | `Factory`, `ScheduleProxy` |

## Tech Stack

| Category | Technology |
|----------|------------|
| **Frontend** | Next.js 16, React 19, TypeScript, Tailwind CSS, daisyUI |
| **Wallet** | StarkZap SDK (supports Cartridge only) |
| **Smart Contracts** | Cairo, Starknet Foundry, OpenZeppelin Contracts |
| **State Management** | Zustand, TanStack Query |
| **Styling** | daisyUI 5, custom theme with terminal/code aesthetics |

## Quick Start

```bash
# Install dependencies
yarn install

# Start local devnet
yarn chain

# Deploy contracts to Sepolia testnet
yarn deploy --network sepolia

# Start frontend dev server
yarn start
```

Visit `http://localhost:3000` to use the application.

## Environment Variables

```bash
# RPC URLs (packages/nextjs/.env)
NEXT_PUBLIC_SEPOLIA_PROVIDER_URL=https://starknet-sepolia.public.blastapi.io/rpc/v0_9
NEXT_PUBLIC_MAINNET_PROVIDER_URL=https://starknet-mainnet.public.blastapi.io/rpc/v0_9
NEXT_PUBLIC_DEVNET_PROVIDER_URL=http://127.0.0.1:5050

# Deployer keys (packages/snfoundry/.env)
ACCOUNT_ADDRESS_SEPOLIA=0x...
PRIVATE_KEY_SEPOLIA=0x...
ACCOUNT_ADDRESS_MAINNET=0x...
PRIVATE_KEY_MAINNET=0x...
```

## Scripts

| Command | Description |
|---------|-------------|
| `yarn start` | Start frontend dev server |
| `yarn chain` | Start local Starknet devnet |
| `yarn deploy` | Deploy contracts to devnet |
| `yarn deploy --network sepolia` | Deploy to Sepolia testnet |
| `yarn deploy --network mainnet` | Deploy to mainnet |
| `yarn test` | Run Cairo contract tests |
| `yarn test:nextjs` | Run frontend unit tests |
| `yarn verify --network sepolia` | Verify contracts on block explorer |

## Smart Contract API

### Factory
```cairo
fn deploy_schedule(ref self: ContractState, spec: DeploymentSpec) -> ContractAddress
fn register_curve(ref self: ContractState, curve_key: felt252, impl_class: ClassHash, metadata: CurveMetadata)
fn get_curve_impl(self: @ContractState, curve_key: felt252) -> ClassHash
```

### Schedule
```cairo
fn claim(ref self: ContractState)
fn get_available(self: @ContractState) -> u256
fn get_status(self: @ContractState) -> PlanStatus
fn close(ref self: ContractState, refund_address: ContractAddress)
```

## Security

- **OpenZeppelin Integration**: Uses battle-tested access control (Ownable) and upgrade patterns
- **Pausable**: Factory includes emergency pause functionality for critical situations
- **Input Validation**: All inputs validated at contract level (minimum duration, non-zero amounts)
- **Reentrancy Safe**: No external callbacks in claim flow

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes with proper tests
4. Submit a pull request

## License

MIT
