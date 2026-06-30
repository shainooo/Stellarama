# Security & Edge Cases - Post-Hackathon Roadmap

## Status: MVP (Hackathon Version)

**Current Priority**: Working demo > Production security  
**Risk Level**: ✅ Safe for testnet, ⚠️ Needs hardening for mainnet

---

## 🔴 CRITICAL - Must Fix Before Mainnet

### 1. Missing Authentication on `complete_remittance()`

**Issue**: Anyone can call `complete_remittance()` and write arbitrary exchange rates.

**Current Code**:

```rust
pub fn complete_remittance(
    env: Env,
    id: BytesN<32>,
    amount_inr: i128,
    exchange_rate: i128,
) {
    // NO AUTH CHECK ⚠️
```

**Attack Vector**:

- Attacker observes remittance creation
- Front-runs sender's completion call
- Writes fake `amount_inr` and `exchange_rate`
- History data is polluted

**Impact**:

- 🟢 Funds are SAFE (path payment already executed on-chain)
- 🔴 Analytics/reporting corrupted
- 🔴 User trust damaged (wrong amounts shown)

**Solutions** (Pick one):

1. **Add sender auth**: `remittance.sender.require_auth()`
2. **Oracle verification**: Query Stellar Horizon to verify actual tx amounts
3. **Backend signature**: Only trusted backend can complete (requires admin key)
4. **Event-driven**: Listen to Stellar events, auto-complete on path payment confirmation

**Recommended**: Solution #1 (simplest) + Solution #2 (most secure)

---

### 2. Token Address Validation in Refunds

**Issue**: `refund_remittance()` accepts arbitrary `token_address` parameter.

**Current Code**:

```rust
pub fn refund_remittance(env: Env, id: BytesN<32>, token_address: Address) {
    // What if token_address != original escrow token?
    token_client.transfer(&env.current_contract_address(), &sender, &amount);
}
```

**Attack Vector**:

- Alice creates remittance with AED at `0xAAA`
- Alice calls refund with malicious token at `0xBBB`
- Contract attempts transfer from wrong token → fails OR drains unrelated funds

**Impact**:

- 🔴 User cannot recover funds
- 🔴 Contract could be drained if malicious token is held

**Solution**:

```rust
pub struct Remittance {
    // Add this field:
    pub token_address: Address,
    // ... rest
}

// In create_remittance():
token_address: token_address.clone(),

// In refund_remittance():
pub fn refund_remittance(env: Env, id: BytesN<32>) {
    // Remove token_address param
    let token_address = remittance.token_address; // Use stored value
    token_client.transfer(...);
}
```

**Priority**: HIGH - Simple fix, prevents critical failure mode

---

## 🟡 MEDIUM - Performance & Scalability

### 3. History Query O(N) Complexity

**Issue**: `get_user_history()` iterates through ALL remittances.

**Current Code**:

```rust
for i in (1..=total).rev() {
    // Loop through every remittance ever created
    if remittance.sender == user || remittance.recipient == user {
        // Add to results
    }
}
```

**Impact**:

- At 1,000 remittances: ~100ms query time ✅
- At 10,000 remittances: ~1s query time 🟡
- At 100,000 remittances: ~10s query time 🔴

**Solutions**:

1. **Add user index**:

   ```rust
   // Store in contract:
   Map<Address, Vec<BytesN<32>>> // user -> [remittance_ids]

   // Update on create:
   sender_remittances.push(id);
   recipient_remittances.push(id);
   ```

2. **Off-chain indexing**:
   - Use Stellar Horizon API to query contract events
   - Build PostgreSQL index in backend
   - Contract only stores data, frontend queries DB

**Recommended**: Solution #2 (better for UX, contract stays simple)

**Priority**: MEDIUM - Works fine for MVP, needed at scale

---

### 4. Reentrancy on Refund

**Issue**: State updated AFTER external call (classic reentrancy pattern).

**Current Code**:

```rust
pub fn refund_remittance(...) {
    // 1. External call (sends tokens out)
    token_client.transfer(&contract, &sender, &amount);

    // 2. State update (after money sent)
    remittance.status = STATUS_FAILED;
    env.storage().persistent().set(&key, &remittance);
}
```

**Is this actually exploitable?**

- **Probably NOT** - Soroban SEP-41 tokens don't have `onReceive()` hooks
- No callback during transfer = no reentrancy entry point
- Unlike Ethereum ERC-777/ERC-1155

**But best practice?**

```rust
// Checks-Effects-Interactions pattern:
pub fn refund_remittance(...) {
    // 1. Checks (validate state)
    if remittance.status != STATUS_PENDING { panic!(); }

    // 2. Effects (update state FIRST)
    remittance.status = STATUS_FAILED;
    env.storage().persistent().set(&key, &remittance);

    // 3. Interactions (external call LAST)
    token_client.transfer(&contract, &sender, &amount);
}
```

**Priority**: LOW - Not exploitable in Soroban, but good hygiene

---

## 🟢 LOW - Nice-to-Have Improvements

### 5. Exchange Rate Bounds Checking

**Enhancement**: Validate exchange rates are within realistic bounds.

```rust
const MIN_EXCHANGE_RATE: i128 = 150_0000; // 15 INR per AED (7 decimals)
const MAX_EXCHANGE_RATE: i128 = 300_0000; // 30 INR per AED

pub fn complete_remittance(..., exchange_rate: i128) {
    // Sanity check
    if exchange_rate < MIN_EXCHANGE_RATE || exchange_rate > MAX_EXCHANGE_RATE {
        panic!("Exchange rate out of realistic bounds");
    }
    // ...
}
```

**Why this helps**:

- Prevents obviously fake data (1 AED = 1M INR)
- Catches frontend bugs early
- Better user experience

---

### 6. Admin Emergency Functions

**Missing**: No way to pause/upgrade contract if bug discovered.

**Add**:

```rust
const KEY_PAUSED: Symbol = symbol_short!("paused");

pub fn pause(env: Env) {
    let admin: Address = env.storage().instance().get(&KEY_ADMIN).unwrap();
    admin.require_auth();
    env.storage().instance().set(&KEY_PAUSED, &true);
}

pub fn unpause(env: Env) {
    let admin: Address = env.storage().instance().get(&KEY_ADMIN).unwrap();
    admin.require_auth();
    env.storage().instance().set(&KEY_PAUSED, &false);
}

// In every function:
fn check_not_paused(env: &Env) {
    if env.storage().instance().get(&KEY_PAUSED).unwrap_or(false) {
        panic!("Contract is paused");
    }
}
```

**Use case**: Emergency stop if critical bug found

---

### 7. Partial Refund Support

**Question**: What if path payment partially fails?

**Answer**: Not needed - Stellar path payments are atomic:

- Either entire payment succeeds
- Or entire payment fails
- No partial states

**No action needed** ✅

---

### 8. Fee Rounding Edge Case

**Issue**: Very small amounts could round fee to zero.

**Example**:

```rust
amount = 1 stroop (0.0000001 AED)
fee = (1 * 50) / 10000 = 0.005 = 0 stroops
```

**Mitigation**: Already handled by `MIN_AMOUNT = 100_0000000`

- Minimum fee = (100 AED \* 0.5%) = 0.5 AED = 5M stroops
- Rounding is never an issue ✅

**No action needed** ✅

---

## 📊 Risk Matrix

| Issue                    | Severity | Exploitable? | Fix Effort | Priority    |
| ------------------------ | -------- | ------------ | ---------- | ----------- |
| Missing auth on complete | HIGH     | Yes          | 1 line     | 🔴 CRITICAL |
| Token address validation | HIGH     | Yes          | 5 lines    | 🔴 CRITICAL |
| History O(N) query       | MEDIUM   | No           | 20 lines   | 🟡 MEDIUM   |
| Reentrancy pattern       | LOW      | No (Soroban) | 5 lines    | 🟢 LOW      |
| Rate bounds checking     | LOW      | No           | 3 lines    | 🟢 LOW      |
| Admin pause function     | LOW      | No           | 15 lines   | 🟢 LOW      |

---

## 🎯 Post-Hackathon Sprint Plan

### Week 1: Security Hardening

- [ ] Add auth to `complete_remittance()`
- [ ] Store token address in `Remittance` struct
- [ ] Implement Checks-Effects-Interactions pattern
- [ ] Add exchange rate bounds
- [ ] Code audit (internal)

### Week 2: Scalability

- [ ] Add user remittance index (or off-chain DB)
- [ ] Optimize gas usage
- [ ] Stress test with 10k transactions

### Week 3: Production Features

- [ ] Admin pause/unpause
- [ ] Contract upgradeability (Soroban proxy pattern)
- [ ] Oracle integration (Pyth/Chainlink for FX rates)
- [ ] Multi-sig for admin functions

### Week 4: External Audit

- [ ] Hire professional auditor (CertiK, Trail of Bits, etc.)
- [ ] Address findings
- [ ] Mainnet deployment

---

## 💬 Talking Points for Judges

**When asked about security:**

> "This is a hackathon MVP focused on proving the concept works. We've prioritized working demo over production hardening. The escrow logic is sound - funds are safe. Post-hackathon, our security roadmap includes:
>
> 1. **Auth on completion** - prevent data pollution
> 2. **Oracle integration** - verify exchange rates on-chain
> 3. **Off-chain indexing** - scale to millions of transactions
> 4. **Professional audit** - CertiK or Trail of Bits before mainnet
>
> But for today, we wanted to prove that Stellar + Soroban can solve the $36B remittance problem with sub-1% fees. And we did. 🚀"

---

## ✅ Current Security Posture

**What works:**

- ✅ Escrow prevents theft (funds locked until completion)
- ✅ Rate limiting prevents spam
- ✅ Time-locked refunds protect users
- ✅ Amount validation prevents edge cases
- ✅ Event logging provides transparency

**What needs work:**

- ⚠️ Data integrity (fake exchange rates possible)
- ⚠️ Token address validation
- ⚠️ Scalability (history queries)

**Verdict**: ✅ **Safe for testnet demo, NOT ready for mainnet**
