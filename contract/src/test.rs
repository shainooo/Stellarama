#![cfg(test)]

use super::*;
use soroban_sdk::{
    symbol_short, testutils::{Address as _, Ledger, LedgerInfo}, token, Address, Env,
};

fn create_test_token<'a>(env: &'a Env, admin: &Address) -> (token::Client<'a>, token::StellarAssetClient<'a>) {
    let contract_address = env.register_stellar_asset_contract_v2(admin.clone());
    (
        token::Client::new(env, &contract_address.address()),
        token::StellarAssetClient::new(env, &contract_address.address()),
    )
}

#[test]
fn test_initialize() {
    let env = Env::default();
    let contract_id = env.register(StellaramaContract, ());
    let client = StellaramaContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);

    client.initialize(&admin);

    // Should panic if initializing again
    // (We'll skip this test as it would require expect_panic)
}

#[test]
fn test_create_remittance() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(StellaramaContract, ());
    let client = StellaramaContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let sender = Address::generate(&env);
    let recipient = Address::generate(&env);

    client.initialize(&admin);

    // Create test token
    let (token, token_admin) = create_test_token(&env, &admin);
    token_admin.mint(&sender, &1000_0000000); // 1000 AED

    // Create remittance
    let amount = 500_0000000; // 500 AED
    let remittance_id = client.create_remittance(
        &sender,
        &recipient,
        &amount,
        &token.address,
    );

    // Verify remittance was created
    let remittance = client.get_remittance(&remittance_id);
    assert_eq!(remittance.sender, sender);
    assert_eq!(remittance.recipient, recipient);
    assert_eq!(remittance.amount_aed, amount);
    assert_eq!(remittance.status, symbol_short!("pending"));

    // Verify fee calculation
    let expected_fee = (amount * 50) / 10000; // 0.5%
    assert_eq!(remittance.fee, expected_fee);

    // Verify tokens were transferred to contract
    assert_eq!(token.balance(&contract_id), amount);
}

#[test]
fn test_amount_validation() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(StellaramaContract, ());
    let client = StellaramaContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let sender = Address::generate(&env);
    let recipient = Address::generate(&env);

    client.initialize(&admin);

    let (token, token_admin) = create_test_token(&env, &admin);
    token_admin.mint(&sender, &100000_0000000);

    // Test amount too small (should panic)
    let result = client.try_create_remittance(
        &sender,
        &recipient,
        &50_0000000, // 50 AED (below minimum)
        &token.address,
    );
    assert!(result.is_err());

    // Test amount too large (should panic)
    let result = client.try_create_remittance(
        &sender,
        &recipient,
        &60000_0000000, // 60,000 AED (above maximum)
        &token.address,
    );
    assert!(result.is_err());
}

#[test]
fn test_complete_remittance() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(StellaramaContract, ());
    let client = StellaramaContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let sender = Address::generate(&env);
    let recipient = Address::generate(&env);

    client.initialize(&admin);

    let (token, token_admin) = create_test_token(&env, &admin);
    token_admin.mint(&sender, &1000_0000000);

    // Create remittance
    let amount = 500_0000000;
    let remittance_id = client.create_remittance(
        &sender,
        &recipient,
        &amount,
        &token.address,
    );

    // Complete it
    let amount_inr = 11225_0000000; // ~22.45 INR per AED
    let exchange_rate = 2245_0000; // 22.45 with 7 decimals
    client.complete_remittance(&remittance_id, &amount_inr, &exchange_rate);

    // Verify status changed
    let remittance = client.get_remittance(&remittance_id);
    assert_eq!(remittance.status, symbol_short!("complete"));
    assert_eq!(remittance.amount_inr, amount_inr);
    assert_eq!(remittance.exchange_rate, exchange_rate);
}

#[test]
fn test_rate_limiting() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(StellaramaContract, ());
    let client = StellaramaContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let sender = Address::generate(&env);
    let recipient = Address::generate(&env);

    client.initialize(&admin);

    let (token, token_admin) = create_test_token(&env, &admin);
    token_admin.mint(&sender, &10000_0000000); // 10,000 AED

    // Create 5 remittances (should succeed)
    for _ in 0..5 {
        client.create_remittance(
            &sender,
            &recipient,
            &500_0000000,
            &token.address,
        );
    }

    // 6th should fail (rate limit exceeded)
    let result = client.try_create_remittance(
        &sender,
        &recipient,
        &500_0000000,
        &token.address,
    );
    assert!(result.is_err());
}

#[test]
fn test_calculate_fee() {
    let env = Env::default();
    let contract_id = env.register(StellaramaContract, ());
    let client = StellaramaContractClient::new(&env, &contract_id);

    // Test fee calculation
    let amount = 1000_0000000; // 1000 AED
    let fee = client.calculate_fee(&amount);
    assert_eq!(fee, 5_0000000); // 5 AED (0.5%)

    let amount2 = 200_0000000; // 200 AED
    let fee2 = client.calculate_fee(&amount2);
    assert_eq!(fee2, 1_0000000); // 1 AED (0.5%)
}

#[test]
fn test_get_user_history() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(StellaramaContract, ());
    let client = StellaramaContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let sender = Address::generate(&env);
    let recipient = Address::generate(&env);

    client.initialize(&admin);

    let (token, token_admin) = create_test_token(&env, &admin);
    token_admin.mint(&sender, &5000_0000000);

    // Create 3 remittances
    for _ in 0..3 {
        client.create_remittance(
            &sender,
            &recipient,
            &500_0000000,
            &token.address,
        );
    }

    // Get history
    let history = client.get_user_history(&sender, &0, &10);
    assert_eq!(history.len(), 3);

    // Test pagination
    let page1 = client.get_user_history(&sender, &0, &2);
    assert_eq!(page1.len(), 2);

    let page2 = client.get_user_history(&sender, &2, &2);
    assert_eq!(page2.len(), 1);
}

#[test]
fn test_refund_remittance() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(StellaramaContract, ());
    let client = StellaramaContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let sender = Address::generate(&env);
    let recipient = Address::generate(&env);

    client.initialize(&admin);

    let (token, token_admin) = create_test_token(&env, &admin);
    let initial_balance = 1000_0000000;
    token_admin.mint(&sender, &initial_balance);

    // Create remittance
    let amount = 500_0000000;
    let remittance_id = client.create_remittance(
        &sender,
        &recipient,
        &amount,
        &token.address,
    );

    // Advance time by 24 hours
    env.ledger().set(LedgerInfo {
        timestamp: env.ledger().timestamp() + 86400,
        protocol_version: 22,
        sequence_number: env.ledger().sequence(),
        network_id: Default::default(),
        base_reserve: 10,
        min_temp_entry_ttl: 10,
        min_persistent_entry_ttl: 10,
        max_entry_ttl: 3110400,
    });

    // Refund
    client.refund_remittance(&remittance_id);

    // Verify refund
    assert_eq!(token.balance(&sender), initial_balance);
    let remittance = client.get_remittance(&remittance_id);
    assert_eq!(remittance.status, symbol_short!("failed"));
}
