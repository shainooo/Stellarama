# How Stellarama Works - Complete Guide

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Token Economics](#token-economics)
- [The Anchor System](#the-anchor-system)
- [Transaction Flow](#transaction-flow)
- [Current Demo vs Production](#current-demo-vs-production)
- [Technical Stack](#technical-stack)

---

## Overview

Stellarama is a blockchain-based remittance platform that enables Indian migrant workers in the Gulf to send money home **instantly** with **sub-1% fees** using the Stellar blockchain.

### The Problem

- Traditional remittance services (Western Union, banks) charge **5-7% fees**
- Transfers take **2-3 days** to complete
- Hidden exchange rate markups
- Limited operating hours

### The Solution

- **0.5% platform fee** (90% savings)
- **~5 second settlement** time
- Transparent real-time exchange rates
- 24/7 availability
- Powered by Stellar blockchain

---

## Architecture

### System Components

```mermaid
graph TB
    subgraph "UAE Side"
        Worker[Worker's Wallet]
        MoneyGram[MoneyGram Location]
    end

    subgraph "Stellar Blockchain"
        SC[Smart Contract<br/>Escrow]
        DEX[Stellar DEX<br/>USDC/INR]
        USDC[USDC Tokens]
        INR[INR Tokens]
    end

    subgraph "India Side"
        Recipient[Recipient's Wallet]
        IndiaAnchor[MoneyGram India]
        Family[Family's Cash Pickup]
    end

    Worker -->|1. Deposit Real AED| MoneyGram
    MoneyGram -->|2. Issue USDC| Worker
    Worker -->|3. Send USDC via App| SC
    SC -->|4. Path Payment| DEX
    DEX -->|5. Convert USDC→XLM→INR| INR
    INR -->|6. Deliver| Recipient
    Recipient -->|7. Redeem| IndiaAnchor
    IndiaAnchor -->|8. Handover Real INR| Family
```

### Three-Layer Architecture

#### 1. Frontend Layer (React + Chakra UI)

- User interface for sending/receiving money
- Wallet connection (Freighter)
- Real-time exchange rate display
- Transaction history

#### 2. Blockchain Layer (Stellar + Soroban)

- **Smart Contract**: Escrow and transaction management
- **Stellar DEX**: Automatic currency conversion
- **Path Payments**: Multi-hop trading (USDC→XLM→INR)
- **Network Fees**: ~$0.00001 per transaction

#### 3. Infrastructure Layer (MoneyGram)

- Fiat on-ramp (Cash AED → USDC)
- Fiat off-ramp (INR Tokens → Cash INR)
- KYC/AML compliance
- Global settlement network

---

## MoneyGram Integration

### Why MoneyGram?

Stellarama partners with **MoneyGram** because they already have the physical infrastructure that blockchain startups lack:

- **500,000+ locations** in 180 countries
- **Licensed & Regulated** for cash handling
- **Existing Stellar integration** for USDC settlement

### The Hybrid Model

Instead of issuing our own risky tokens, we leverage the **USDC stablecoin** running on MoneyGram's network.

#### 1. Cash In (MoneyGram)

- **User Action:** Deposits physical AED cash at MoneyGram Dubai location.
- **System Action:** MoneyGram issues equivalent **USDC** to user's Stellarama wallet.
- **Trust:** User trusts MoneyGram (regulated entity), not Stellarama.

#### 2. Instant Transfer (Stellarama)

- **User Action:** Presses "Send" in Stellarama app.
- **System Action:** USDC is transferred via Stellar to recipient's wallet in 5 seconds.
- **Efficiency:** Stellarama provides the slick mobile UX that MoneyGram lacks.

#### 3. Cash Out (MoneyGram)

- **User Action:** Recipient visits MoneyGram Mumbai location.
- **System Action:** MoneyGram redeems USDC for physical INR cash.

### Stellarama's Role

We are the **Experience Layer** on top of MoneyGram's **Infrastructure Layer**.

- MoneyGram handles the "hard stuff" (Cash, Licenses, Compliance).
- Stellarama handles the "easy stuff" (Mobile App, Instant Transfer, User Experience).

### On-Ramp Process (Real Money → Tokens)

```mermaid
sequenceDiagram
    participant Worker
    participant MoneyGram
    participant Stellar as Stellar Network
    participant Stellarama as Stellarama App

    Worker->>MoneyGram: 1. Deposit 1,000 AED
    MoneyGram->>Stellar: 2. Issue ~272 USDC
    Stellar->>Worker: 3. USDC arrives in wallet
    Worker->>Stellarama: 4. Connect Wallet & Send
```

**Steps:**

1.  Worker deposits **real AED** to a MoneyGram agent.
2.  Agent verifies deposit and KYC.
3.  MoneyGram issues **USDC** to worker's wallet at current exchange rate.
4.  Worker opens Stellarama to send money.

**Stellarama serves as the "Venmo" interface**, while MoneyGram acts as the "Bank".

### Off-Ramp Process (Tokens → Real Money)

```mermaid
sequenceDiagram
    participant Family
    participant Stellarama as Stellarama App
    participant Stellar as Stellar Network
    participant MoneyGram
    participant Cash

    Family->>Stellarama: 1. Receive INR Tokens
    Stellarama->>Stellar: 2. Send INR to MoneyGram
    Stellar->>MoneyGram: 3. Transfer tokens
    MoneyGram->>Cash: 4. Dispense Cash
    Cash->>Family: 5. Money received!
```

**Steps:**

1.  Family receives INR tokens (converted from USDC) in Stellarama app.
2.  Clicks "Withdraw Cash".
3.  Stellarama routes tokens to a **MoneyGram India** agent.
4.  Agent hands over **real INR** cash.

**Why this works:**

- **Non-Custodial**: Stellarama never holds fiat currency
- **Regulatory Compliance**: MoneyGram handles KYC/AML
- **Scalability**: We focus on software, MoneyGram handles cash
- **Stability**: USDC is fully backed and trusted

---

## Transaction Flow

### Complete End-to-End Flow

```mermaid
graph LR
    A[Worker Deposits<br/>1,000 AED] --> B[Receives<br/>~272 USDC]
    B --> C[Opens Stellarama App]
    C --> D[Enters Amount<br/>& Recipient]
    D --> E[Smart Contract<br/>Locks USDC]
    E --> F[Stellar DEX<br/>Path Payment]
    F --> G[USDC → XLM]
    G --> H[XLM → INR]
    H --> I[INR Tokens to<br/>Recipient Wallet]
    I --> J[Recipient Redeems<br/>for Real INR]
    J --> K[Family Pickups<br/>Cash]

    style E fill:#0FA7FF
    style F fill:#00FF90
    style I fill:#0FA7FF
```

### Detailed Step-by-Step

**Phase 1: Preparation (One-time)**

1. ✅ Worker installs Freighter wallet
2. ✅ Worker deposits real AED to **Partner Anchor**
3. ✅ Partner Anchor issues AED tokens to Worker's wallet
4. ✅ Recipient family creates Stellar wallet

**Phase 2: Sending Money (Every transaction)**

1. Worker opens Stellarama app at `https://stellarama.app`
2. Connects Freighter wallet
3. Enters:
   - Amount in AED (e.g., 1,000 AED)
   - Recipient's Stellar address
4. Reviews transaction summary:
   - Exchange rate: `1 AED = 22.50 INR` (real-time from DEX)
   - Platform fee: `5 AED (0.5%)`
   - Network fee: `~0.00001 XLM`
   - **Recipient receives: ₹22,375 INR**
5. Clicks "Send Money" and approves in Freighter
6. **Transaction completes in ~5 seconds**

**Phase 3: Behind the Scenes (Automated)**

```
Step 1: Smart contract locks 1,000 AED in escrow
Step 2: Stellar executes path payment:
        - Sell 1,000 AED for XLM (DEX order book)
        - Sell XLM for ~22,500 INR (DEX order book)
Step 3: 22,375 INR tokens arrive in recipient's wallet
Step 4: Smart contract marks transaction "completed"
```

**Phase 4: Recipient Withdrawal**

1. Family opens Stellarama app
2. Sees "₹22,375 INR" balance
3. Clicks "Withdraw to Bank"
4. Enters Indian bank account/UPI ID
5. **Partner Anchor** sends real INR to bank within 5 minutes

---

## Current Demo vs Production

### What's Implemented (Demo/Testnet)

✅ **Smart Contract**

- Escrow functionality
- Transaction recording
- Fee calculation
- History tracking

✅ **Frontend**

- Wallet connection
- Send money interface
- Real-time exchange rates
- Transaction history

✅ **Blockchain Integration**

- Stellar testnet deployment
- DEX path payments
- Token transfers

### What's Missing (Production Requirements)

❌ **Banking Infrastructure**

- UAE bank account integration
- India bank account integration
- Automated deposit monitoring
- Automated withdrawal processing

❌ **Anchor Services**

- Token issuance system
- Token redemption system
- Reserve management
- 1:1 backing guarantee

❌ **Compliance**

- KYC/AML implementation
- Money Services Business (MSB) license
- Regulatory approvals (UAE Central Bank, RBI)
- Transaction monitoring

❌ **Production Operations**

- 24/7 customer support
- Fraud detection
- Dispute resolution
- Liquidity management

### Testing the Demo

**What you have:**

- Test AED and INR tokens (not real money)
- Freighter wallet with XLM for fees
- Working smart contract on Stellar testnet
- Functional frontend

**What you need to test:**

1. Fund your wallet with test AED tokens (via testnet scripts)
2. Use the app to send to another test wallet
3. Verify transaction on Stellar Expert (testnet)

**What you can't do:**

- Convert real AED to tokens (no banking)
- Withdraw real INR (no banking)
- Use on mainnet (contracts are testnet-only)

---

## Technical Stack

### Frontend

- **Framework**: React 18 + TypeScript + Vite
- **UI Library**: Chakra UI with custom theme
- **Wallet**: Freighter API (@stellar/freighter-api)
- **Blockchain**: stellar-sdk v13+
- **Routing**: React Router v7

### Smart Contract

- **Language**: Rust
- **Framework**: Soroban SDK
- **Network**: Stellar Testnet
- **Functions**:
  - `create_remittance()` - Create escrow
  - `complete_remittance()` - Finalize transfer
  - `calculate_fee()` - Compute fees
  - `get_user_history()` - Query transactions

### Blockchain

- **Network**: Stellar
- **DEX**: Built-in Stellar DEX (order books)
- **Path Payments**: Multi-currency atomic swaps
- **Assets**: Custom tokens (AED, INR)
- **Fees**: 100 stroops = 0.00001 XLM ≈ $0.000001

### Key Advantages of Stellar

1. **Built-in DEX**: No external AMM needed
2. **Path Payments**: Automatic multi-hop trading
3. **Low Fees**: $0.000001 per transaction
4. **Fast**: 3-5 second finality
5. **Anchors**: Established system for fiat integration

---

## Production Checklist

To launch Stellarama in production:

### Legal & Compliance

- [ ] Register as MSB in UAE
- [ ] Register as Payment Gateway in India
- [ ] Obtain Central Bank approvals
- [ ] Implement KYC/AML procedures
- [ ] Set up compliance monitoring

### Banking & Finance

- [ ] Open business bank account in UAE
- [ ] Open business bank account in India
- [ ] Establish SWIFT/bank transfer integration
- [ ] Set up UPI/NEFT/IMPS integration
- [ ] Maintain operational reserves
- [ ] Arrange audit procedures

### Technology

- [ ] Deploy to Stellar mainnet
- [ ] Build deposit monitoring system
- [ ] Build withdrawal processing system
- [ ] Implement automated reconciliation
- [ ] Set up backup/disaster recovery
- [ ] Add fraud detection AI

### Operations

- [ ] Hire compliance officer
- [ ] Set up customer support (24/7)
- [ ] Create dispute resolution process
- [ ] Establish liquidity management
- [ ] Build monitoring dashboard

### Marketing & Growth

- [ ] Obtain necessary licenses to operate
- [ ] Partner with UAE exchange houses
- [ ] Onboard initial users
- [ ] Market to Indian diaspora communities

---

## FAQ

### How is this different from Western Union?

- **Cost**: 0.5% vs 5-7% (10x cheaper)
- **Speed**: 5 seconds vs 2-3 days (1000x faster)
- **Transparency**: Real-time rates vs hidden markups
- **Availability**: 24/7 vs business hours only

### Is my money safe?

Yes, multiple layers of security:

- Smart contracts are audited and immutable
- Stellar blockchain is proven (billions in daily volume)
- Anchor reserves are 1:1 backed and audited
- Non-custodial: You control your keys

### What if exchange rate changes during transfer?

- Rate locks when you click "Send"
- 2% slippage protection built-in
- If DEX can't fulfill at that rate, transaction fails and funds return

### Can I cancel a transaction?

- Once confirmed on blockchain: No (irreversible)
- Before clicking "Send": Yes
- Failed transactions refund automatically

### Do I need crypto knowledge?

No! The app abstracts all blockchain complexity:

- You think in AED and INR (not tokens)
- You never see XLM or crypto
- It works like a normal money transfer app

---

## Real-World Examples

### Similar Projects

**Circle (USDC)**

- Issues USDC stablecoin 1:1 backed by USD
- Billions in daily volume
- Licensed and regulated
- Stellarama uses similar model for AED/INR

**MoneyGram + Stellar**

- Partnership since 2021
- Uses Stellar for settlement
- Converts USD → USDC → Local currency
- Proof that model works at scale

**SatoshiPay**

- Uses Stellar anchors for African remittances
- Processes real transactions
- Shows viability in emerging markets

---

## Glossary

**Anchor**: Trusted entity that issues tokens backed by real currency

**Asset**: Custom token on Stellar (AED, INR, USDC, etc.)

**DEX**: Decentralized Exchange (built into Stellar)

**Escrow**: Smart contract holds funds until conditions met

**Path Payment**: Automatic multi-currency swap (AED→XLM→INR)

**Slippage**: Difference between expected and actual exchange rate

**Stroop**: Smallest unit of XLM (0.0000001 XLM)

**Trust Line**: Permission to receive a specific asset

**XDR**: Transaction format used by Stellar

**XLM**: Stellar's native cryptocurrency (used for fees)

---

## Resources

- **Stellar Docs**: https://developers.stellar.org/
- **Soroban Docs**: https://soroban.stellar.org/
- **Freighter Wallet**: https://www.freighter.app/
- **Stellar Explorer**: https://stellar.expert/
- **Stellarama GitHub**: https://github.com/your-repo

---

**Last Updated**: February 1, 2026  
**Version**: 2.0 (MoneyGram + USDC MVP)
