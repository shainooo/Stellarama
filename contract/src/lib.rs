#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short, token, Address, Bytes, BytesN, Env,
    Symbol, Vec,
};

// Remittance status
const STATUS_PENDING: Symbol = symbol_short!("pending");
const STATUS_COMPLETED: Symbol = symbol_short!("complete");
const STATUS_FAILED: Symbol = symbol_short!("failed");

// Validation constants
const MIN_AMOUNT: i128 = 100_0000000; // 100 AED (7 decimals)
const MAX_AMOUNT: i128 = 50000_0000000; // 50,000 AED
const DAILY_LIMIT: u32 = 5; // Max 5 transactions per day
const FEE_BASIS_POINTS: i128 = 50; // 0.5% = 50 basis points

// Storage keys
const KEY_ADMIN: Symbol = symbol_short!("admin");
const KEY_REMIT_COUNT: Symbol = symbol_short!("rem_cnt");

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Remittance {
    pub id: BytesN<32>,
    pub sender: Address,
    pub recipient: Address,
    pub amount_aed: i128,
    pub amount_inr: i128,
    pub exchange_rate: i128, // Rate with 7 decimal precision
    pub fee: i128,
    pub token_address: Address,
    pub status: Symbol,
    pub created_at: u64,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct UserStats {
    pub total_remittances: u32,
    pub daily_count: u32,
    pub last_tx_date: u64,
}

#[contracttype]
pub enum DataKey {
    Remittance(BytesN<32>),
    UserStats(Address),
}

#[contract]
pub struct StellaramaContract;

#[contractimpl]
impl StellaramaContract {
    /// Initialize contract with admin address
    pub fn initialize(env: Env, admin: Address) {
        if env.storage().instance().has(&KEY_ADMIN) {
            panic!("Contract already initialized");
        }
        env.storage().instance().set(&KEY_ADMIN, &admin);
        env.storage().instance().set(&KEY_REMIT_COUNT, &0u64);
    }

    /// Create a new remittance (escrow AED)
    pub fn create_remittance(
        env: Env,
        sender: Address,
        recipient: Address,
        amount: i128,
        token_address: Address,
    ) -> BytesN<32> {
        // Authenticate sender
        sender.require_auth();

        // Validate amount
        if amount < MIN_AMOUNT || amount > MAX_AMOUNT {
            panic!("Amount must be between 100 and 50,000 AED");
        }

        // Check rate limiting
        let mut stats = Self::get_user_stats_internal(&env, &sender);
        let current_date = env.ledger().timestamp() / 86400; // Days since epoch
        let last_date = stats.last_tx_date / 86400;

        if current_date == last_date {
            if stats.daily_count >= DAILY_LIMIT {
                panic!("Daily transaction limit exceeded (max 5)");
            }
            stats.daily_count += 1;
        } else {
            stats.daily_count = 1;
        }
        stats.last_tx_date = env.ledger().timestamp();
        stats.total_remittances += 1;

        // Calculate fee
        let fee = Self::calculate_fee(env.clone(), amount);

        // Transfer AED tokens to contract (escrow)
        let token_client = token::Client::new(&env, &token_address);
        token_client.transfer(&sender, &env.current_contract_address(), &amount);

        // Generate unique remittance ID
        let mut count: u64 = env.storage().instance().get(&KEY_REMIT_COUNT).unwrap_or(0);
        count += 1;
        env.storage().instance().set(&KEY_REMIT_COUNT, &count);

        let count_bytes = Bytes::from_array(&env, &count.to_be_bytes());
        let id_hash = env.crypto().sha256(&count_bytes);
        let id: BytesN<32> = id_hash.into();

        // Create remittance record
        let remittance = Remittance {
            id: id.clone(),
            sender: sender.clone(),
            recipient,
            amount_aed: amount,
            amount_inr: 0,
            exchange_rate: 0,
            fee,
            token_address: token_address.clone(),
            status: STATUS_PENDING,
            created_at: env.ledger().timestamp(),
        };

        // Store remittance and update stats
        env.storage()
            .persistent()
            .set(&DataKey::Remittance(id.clone()), &remittance);
        env.storage()
            .persistent()
            .set(&DataKey::UserStats(sender.clone()), &stats);

        // Emit event
        env.events().publish(
            (symbol_short!("created"), &sender),
            &id.clone(),
        );

        id
    }

    /// Complete a remittance (called after path payment succeeds)
    pub fn complete_remittance(
        env: Env,
        id: BytesN<32>,
        amount_inr: i128,
        exchange_rate: i128,
    ) {
        let key = DataKey::Remittance(id.clone());
        let mut remittance: Remittance = env
            .storage()
            .persistent()
            .get(&key)
            .expect("Remittance not found");

        // Security: Ensure only the sender (or an admin) can complete it
        remittance.sender.require_auth();

        if remittance.status != STATUS_PENDING {
            panic!("Remittance is not pending");
        }

        // Update remittance
        remittance.amount_inr = amount_inr;
        remittance.exchange_rate = exchange_rate;
        remittance.status = STATUS_COMPLETED;

        env.storage().persistent().set(&key, &remittance);

        // Emit event
        env.events().publish(
            (symbol_short!("complete"), &remittance.sender),
            &id,
        );
    }

    /// Refund a failed remittance
    pub fn refund_remittance(env: Env, id: BytesN<32>) {
        let key = DataKey::Remittance(id.clone());
        let mut remittance: Remittance = env
            .storage()
            .persistent()
            .get(&key)
            .expect("Remittance not found");

        if remittance.status != STATUS_PENDING {
            panic!("Remittance is not pending");
        }

        // Only sender can refund after 24 hours
        let time_elapsed = env.ledger().timestamp() - remittance.created_at;
        if time_elapsed < 86400 {
            // 24 hours in seconds
            remittance.sender.require_auth();
        }

        // Return AED to sender
        let token_client = token::Client::new(&env, &remittance.token_address);
        token_client.transfer(
            &env.current_contract_address(),
            &remittance.sender,
            &remittance.amount_aed,
        );

        // Update status
        remittance.status = STATUS_FAILED;
        env.storage().persistent().set(&key, &remittance);

        // Emit event
        env.events().publish(
            (symbol_short!("refund"), &remittance.sender),
            &id,
        );
    }

    /// Calculate platform fee (0.5%)
    pub fn calculate_fee(_env: Env, amount: i128) -> i128 {
        (amount * FEE_BASIS_POINTS) / 10000
    }

    /// Get remittance details
    pub fn get_remittance(env: Env, id: BytesN<32>) -> Remittance {
        env.storage()
            .persistent()
            .get(&DataKey::Remittance(id))
            .expect("Remittance not found")
    }

    /// Get user's remittance history (paginated)
    pub fn get_user_history(
        env: Env,
        user: Address,
        offset: u32,
        limit: u32,
    ) -> Vec<Remittance> {
        let mut history = Vec::new(&env);
        let total: u64 = env.storage().instance().get(&KEY_REMIT_COUNT).unwrap_or(0);

        let mut count = 0u32;
        let mut skipped = 0u32;

        // Iterate through all remittances (reverse chronological)
        for i in (1..=total).rev() {
            if count >=  limit {
                break;
            }

            let i_bytes = Bytes::from_array(&env, &i.to_be_bytes());
            let id_hash = env.crypto().sha256(&i_bytes);
            let id: BytesN<32> = id_hash.into();
            let key = DataKey::Remittance(id);

            if let Some(remittance) = env.storage().persistent().get::<DataKey, Remittance>(&key)
            {
                // Check if user is sender or recipient
                if remittance.sender == user || remittance.recipient == user {
                    if skipped < offset {
                        skipped += 1;
                        continue;
                    }
                    history.push_back(remittance);
                    count += 1;
                }
            }
        }

        history
    }

    /// Get user statistics
    pub fn get_user_stats(env: Env, user: Address) -> UserStats {
        Self::get_user_stats_internal(&env, &user)
    }

    // Internal helper
    fn get_user_stats_internal(env: &Env, user: &Address) -> UserStats {
        env.storage()
            .persistent()
            .get(&DataKey::UserStats(user.clone()))
            .unwrap_or(UserStats {
                total_remittances: 0,
                daily_count: 0,
                last_tx_date: 0,
            })
    }
}

#[cfg(test)]
mod test;
