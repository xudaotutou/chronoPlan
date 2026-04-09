# ChronoPlan

Modular TWAMM (Time-Weighted Average Mass Meeting) Schedule System built on Starknet.

## Features

- **Plan Management**: Create, claim, and manage vesting plans
- **Multiple Curves**: Linear, Cliff, and Exponential Decay release schedules
- **Templates**: Save and reuse plan configurations
- **Pro Mode**: Batch plan creation with visual timeline editor

## Tech Stack

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS, daisyUI
- **Wallet**: StarkZap SDK (Cartridge, Braavos)
- **Smart Contracts**: Cairo, Starknet Foundry
- **State**: Zustand, TanStack Query

## Quick Start

```bash
# Install dependencies
yarn install

# Start devnet
yarn chain

# Deploy contracts
yarn deploy --network sepolia

# Start frontend
yarn start
```

## Environment Variables

```bash
# RPC URLs (in packages/nextjs/.env)
NEXT_PUBLIC_SEPOLIA_PROVIDER_URL=https://starknet-sepolia.public.blastapi.io/rpc/v0_9
NEXT_PUBLIC_MAINNET_PROVIDER_URL=https://starknet-mainnet.public.blastapi.io/rpc/v0_9
NEXT_PUBLIC_DEVNET_PROVIDER_URL=http://127.0.0.1:5050

# Deployer keys (in packages/snfoundry/.env)
ACCOUNT_ADDRESS_SEPOLIA=0x...
PRIVATE_KEY_SEPOLIA=0x...
```

## Scripts

| Command | Description |
|---------|-------------|
| `yarn start` | Start frontend dev server |
| `yarn chain` | Start local devnet |
| `yarn deploy` | Deploy contracts |
| `yarn deploy --network sepolia` | Deploy to Sepolia |
| `yarn test` | Run Cairo contract tests |
| `yarn test:nextjs` | Run frontend tests |

## Architecture

```
packages/
├── nextjs/          # Frontend (Next.js)
│   ├── app/         # Pages and components
│   └── hooks/       # React hooks
└── snfoundry/       # Smart contracts (Cairo)
    ├── contracts/   # Contract source
    └── scripts-ts/  # Deployment scripts
```
