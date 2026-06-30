# Stellarama Smart Contract

Soroban smart contract for Stellarama remittance platform.

## Features

- **Escrow System**: Securely locks AED tokens during remittance
- **Rate Limiting**: Max 5 transactions per user per day
- **Fee Calculation**: 0.5% platform fee
- **Transaction History**: Query user's remittance history
- **Refund Mechanism**: Automatic refund after 24 hours if not completed

## Build

```bash
cargo build --target wasm32-unknown-unknown --release
```

## Test

```bash
cargo test
```

## Deploy

```bash
../scripts/deploy-contract.sh
```

## Functions

### `initialize(admin: Address)`

Initialize contract with admin address (one-time).

### `create_remittance(sender: Address, recipient: Address, amount: i128, token_address: Address) -> BytesN<32>`

Create a new remittance and escrow tokens (USDC/AED).

- Min amount: 100 AED
- Max amount: 50,000 AED
- Returns: Remittance ID

### `complete_remittance(id: BytesN<32>, amount_inr: i128, exchange_rate: i128)`

Mark remittance as completed after successful path payment.

### `refund_remittance(id: BytesN<32>, token_address: Address)`

Refund AED to sender (callable after 24 hours or by sender anytime).

### `calculate_fee(amount: i128) -> i128`

Calculate 0.5% platform fee.

### `get_remittance(id: BytesN<32>) -> Remittance`

Get remittance details by ID.

### `get_user_history(user: Address, offset: u32, limit: u32) -> Vec<Remittance>`

Get paginated transaction history for a user.

### `get_user_stats(user: Address) -> UserStats`

Get user statistics (total remittances, daily count, etc).

## Data Structures

```rust
pub struct Remittance {
    pub id: BytesN<32>,
    pub sender: Address,
    pub recipient: Address,
    pub amount_aed: i128,
    pub amount_inr: i128,
    pub exchange_rate: i128,
    pub fee: i128,
    pub status: Symbol,  // "pending", "complete", "failed"
    pub created_at: u64,
}
```
