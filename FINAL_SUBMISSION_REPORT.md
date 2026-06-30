# Final Submission Report

## CI/CD Status

- GitHub Actions workflow exists at `.github/workflows/ci.yml`.
- Workflow runs on `push` and `pull_request`.
- Frontend CI job installs dependencies, runs tests, runs linting, and builds the Vite production bundle.
- Contract CI job runs Rust/Soroban contract tests with `cargo test`.
- The pipeline is configured to fail when any required build, lint, or test command fails.

## Tests Passing

Local verification completed:

- `npm run build` passed.
- `npm test` passed.
- `npm run lint` passed.
- `cargo test` passed.

Current automated test coverage includes:

- Navbar branding and navigation rendering.
- Wallet connect button rendering.
- Landing page CTA rendering.
- ErrorBoundary fallback UI rendering.
- Soroban contract tests for initialization, remittance creation, fee calculation, completion, refund, history, validation, and rate limiting.

## Responsiveness Improvements

- Chakra UI responsive props are used across the main frontend pages.
- Navbar supports desktop navigation and mobile menu behavior.
- Landing page uses responsive grid layout and mobile-friendly spacing.
- Send Money, Faucet, Swap, History, and Documentation pages use responsive containers and touch-friendly controls.
- The UI uses a dark glassmorphism design system with clearer spacing, larger controls, and improved hierarchy for mobile usage.

## Event Streaming Implementation

- Real-time frontend updates are implemented through polling in `frontend/src/services/events.ts`.
- The event service polls Stellar Horizon every 10 seconds for connected wallet operations.
- Payment and path-payment operations are normalized into transaction records.
- History refreshes automatically when new operations are detected.
- Wallet balances refresh after transaction sync.
- The UI displays syncing states and notifies users when new transactions are found.
- Polling is used for browser-compatible reliability when websocket support is unavailable.

## Architecture Overview

Stellarama is organized as a frontend, smart contract, and deployment/tooling workspace.

- `frontend/` contains the React, TypeScript, Vite, and Chakra UI app.
- `contract/` contains the Rust/Soroban smart contract and contract tests.
- `scripts/` contains testnet setup and deployment helpers.
- `.github/workflows/ci.yml` contains automated CI checks.
- `vercel.json` configures Vercel deployment from the repository root into `frontend/dist`.

High-level flow:

```mermaid
flowchart LR
  Frontend["React Frontend"] --> ContractService["Contract Service"]
  ContractService --> Soroban["Soroban Contract"]
  Soroban --> Stellar["Stellar Network"]
  Frontend --> EventService["Event Polling Service"]
  EventService --> Horizon["Stellar Horizon"]
```

Submission references:

- Contract Address: `CAEOX34I6GP7KVNO7F6RFPTTQQPH2PBXZJMWT5PFDYEKJ2ROZ6MCDTT4`
- Contract Deployment Transaction Hash: `3623ea86913c5278e2ce041eae387abdbb8706250de6bb93f05261a7a71ee70b`
- Contract Initialization Transaction Hash: `338fdf9939fa7fa99785361f72588d0fd588f7c6bccd31bc48f50b0a3023e63f`
- Demo Activity Transaction Hashes: `182d2279af6f392ab04584f4b59e443a9f36daa27fc4c05bfb4320f2b9b9562f`, `5c139629610159b0aca3d2306525206739e054369bbcfc170423eae911c2467b`, `f29585d0c6bb3189c834afc3c12f499a4656cedb65eab7d0c54e40974651b928`, `1c2b573bd488c32b94c47f22d1408d7a44e6d42c3bd2cc30e1d6fc2516ef113a`, `cdd23559d295c8c154d05c042b97e7a86965b7150bbbfa5dd0d1a235e1d8414d`, `ac4be93874f09f66254ba24aa6fc1d3f4a5a86264c3ec7c8cbe6670550747076`
- Demo Video: https://drive.google.com/file/d/1EFR9x8-JzrGr5d0Z0kJUOFORiIgzJLq9/view?usp=sharing

Evidence screenshots:

- `screenshots/send-money.png`
- `screenshots/transaction-history.png`
- `screenshots/receipt-generated.png`
- `screenshots/mobile-responsive-ui.png`
- `screenshots/cicd-pipeline-running.png`
- `screenshots/test-output-passing.png`
