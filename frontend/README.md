# Stellarama Frontend

React + TypeScript + Chakra UI frontend for Stellarama remittance platform.

## Features

- **Freighter Wallet Integration**: Connect Stellar wallet seamlessly
- **Real-time Exchange Rates**: Live USDC → INR rates from Stellar DEX
- **Path Payments**: Automated USDC → INR conversion
- **Transaction History**: View all past remittances
- **Mobile Responsive**: Works perfectly on phones and desktops

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env and add your CONTRACT_ID

# Start dev server
npm run dev
```

## Environment Variables

```env
VITE_CONTRACT_ID=<your-contract-id-from-deployment>
VITE_HORIZON_URL=https://horizon-testnet.stellar.org
VITE_NETWORK_PASSPHRASE=Test SDF Network ; September 2015
```

## Project Structure

```
src/
├── components/     # Reusable UI components
│   ├── Navbar.tsx
│   └── WalletConnect.tsx
├── pages/          # Page components
│   ├── Landing.tsx
│   ├── SendMoney.tsx
│   └── History.tsx
├── services/       # Business logic
│   ├── wallet.ts      # Freighter integration
│   ├── stellar.ts     # Path payments
│   └── contract.ts    # Smart contract calls
├── hooks/          # Custom React hooks
│   └── useWallet.tsx
├── types/          # TypeScript interfaces
│   └── index.ts
└── App.tsx         # Main app with routing
```

## Key Pages

### Landing Page

- Hero section with value proposition
- Feature highlights (speed, fees, availability)
- Comparison with Western Union
- How it works (3 steps)
- CTAs to send money

### Send Money Page

- Amount input (e.g. 10 USDC)
- Real-time exchange rate display
- Fee breakdown (0.5%)
- Recipient address input
- 3-step transaction flow:
  1. Create remittance (escrow)
  2. Execute path payment
  3. Complete in contract

### History Page

- Transaction table
- Status badges
- Links to Stellar Expert

## Technologies

- **React 18** + **TypeScript**
- **Chakra UI** for components
- **React Router** for navigation
- **Stellar SDK** for blockchain
- **Freighter API** for wallet
- **Vite** for build tooling

## Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Important Notes

### Setup:

1. **Environment Variables**: ensure `.env` has the correct `CONTRACT_ID`.
2. **Freighter**: Ensure wallet is connected on Testnet.

### Known Limitations (MVP):

- History page uses mock data (needs contract RPC call implementation)
- Exchange rate fetching requires liquidity on testnet DEX
- No error recovery for failed transactions (manual refund needed)

## Deployment

### Vercel (Recommended)

```bash
# Push to GitHub
git add .
git commit -m "Stellarama frontend"
git push

# Deploy to Vercel
vercel
```

Environment variables in Vercel dashboard:

- `VITE_CONTRACT_ID`
- `VITE_HORIZON_URL`
- `VITE_NETWORK_PASSPHRASE`

## Support

For demo purposes, use Stellar Testnet and Freighter wallet in testnet mode.
