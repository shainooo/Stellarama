#!/bin/bash

echo "💧 Stellarama DEX Liquidity Setup"
echo "================================"
echo ""

# Load configuration from parent directory
CONFIG_FILE="../testnet-config.json"
if [ ! -f "$CONFIG_FILE" ]; then
    echo "❌ testnet-config.json not found. Run ./setup-testnet.sh first"
    exit 1
fi

# Extract keys from config
AED_ISSUER=$(jq -r '.aed_issuer' $CONFIG_FILE)
INR_ISSUER=$(jq -r '.inr_issuer' $CONFIG_FILE)
DISTRIBUTOR=$(jq -r '.distributor' $CONFIG_FILE)

# Get secrets from Stellar CLI
echo "🔑 Retrieving secrets from Stellar CLI..."
AED_ISSUER_SECRET=$(stellar keys secret aed-issuer)
INR_ISSUER_SECRET=$(stellar keys secret inr-issuer)
DISTRIBUTOR_SECRET=$(stellar keys secret distributor)

echo "📋 Configuration:"
echo "   AED Issuer: $AED_ISSUER"
echo "   INR Issuer: $INR_ISSUER"
echo "   Distributor: $DISTRIBUTOR"
echo ""

# Create Node.js script for liquidity setup
cat > setup-liquidity.js << 'EOF'
const StellarSdk = require('stellar-sdk');
const fs = require('fs');

const server = new StellarSdk.Horizon.Server('https://horizon-testnet.stellar.org');

async function setupLiquidity() {
    try {
        // Get credentials from environment
        const usdcIssuerPubkey = process.env.AED_ISSUER; // Reusing AED_ISSUER as USDC_ISSUER
        const inrIssuerPubkey = process.env.INR_ISSUER;
        const distributorPubkey = process.env.DISTRIBUTOR;
        const usdcIssuerSecret = process.env.AED_ISSUER_SECRET;
        const inrIssuerSecret = process.env.INR_ISSUER_SECRET;
        const distributorSecret = process.env.DISTRIBUTOR_SECRET;
        
        console.log('🔑 Loading distributor account...');
        const distributorAccount = await server.loadAccount(distributorPubkey);
        
        // Define assets
        const USDC = new StellarSdk.Asset('USDC', usdcIssuerPubkey);
        const INR = new StellarSdk.Asset('INR', inrIssuerPubkey);
        const XLM = StellarSdk.Asset.native();
        
        console.log('');
        console.log('📝 Step 1: Creating trustlines...');
        
        // Build trustline transaction
        let trustlineTx = new StellarSdk.TransactionBuilder(distributorAccount, {
            fee: StellarSdk.BASE_FEE,
            networkPassphrase: StellarSdk.Networks.TESTNET,
        })
        .addOperation(StellarSdk.Operation.changeTrust({
            asset: USDC,
            limit: '1000000000', // 1B USDC
        }))
        .addOperation(StellarSdk.Operation.changeTrust({
            asset: INR,
            limit: '1000000000', // 1B INR
        }))
        .setTimeout(300)
        .build();
        
        trustlineTx.sign(StellarSdk.Keypair.fromSecret(distributorSecret));
        
        console.log('   📤 Submitting trustline transaction...');
        await server.submitTransaction(trustlineTx);
        console.log('   ✅ Trustlines created!');
        
        // Wait a bit for trustlines to settle
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Helper to safely fund account
        const fundAccount = async (issuerAccount, destination, asset, amount, issuerSecret, name) => {
            try {
                let tx = new StellarSdk.TransactionBuilder(issuerAccount, {
                    fee: StellarSdk.BASE_FEE,
                    networkPassphrase: StellarSdk.Networks.TESTNET,
                })
                .addOperation(StellarSdk.Operation.payment({
                    destination: destination,
                    asset: asset,
                    amount: amount,
                }))
                .setTimeout(180)
                .build();
                
                tx.sign(StellarSdk.Keypair.fromSecret(issuerSecret));
                console.log(`   📤 Requesting ${name} tokens...`);
                await server.submitTransaction(tx);
                console.log(`   ✅ Received ${amount} ${name}!`);
            } catch (e) {
                // If error is op_line_full, we probably have enough tokens
                const codes = e.response?.data?.extras?.result_codes?.operations || [];
                if (codes.includes('op_line_full')) {
                    console.log(`   ⚠️  Account already full of ${name} (op_line_full). Proceeding...`);
                } else {
                    console.error(`   ⚠️  Could not fund ${name}:`, e.message);
                }
            }
        };

        await fundAccount(await server.loadAccount(usdcIssuerPubkey), distributorPubkey, USDC, '100000', usdcIssuerSecret, 'USDC');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Keep INR generic for now, or maybe Recipient receives USDC too?
        // Let's keep INR for the "Family receives INR" narrative if path payment is used.
        // But if user sends USDC, maybe no INR needed? 
        // Let's fund INR just in case.
        await fundAccount(await server.loadAccount(inrIssuerPubkey), distributorPubkey, INR, '5000000', inrIssuerSecret, 'INR');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log('');
        console.log('📝 Step 3: Setting up bidirectional DEX liquidity...');
        
        // Reload distributor account with updated balances
        const distributorAccountUpdated = await server.loadAccount(distributorPubkey);
        
        // First, cancel any existing offers to avoid clutter
        console.log('   🗑️  Canceling existing offers...');
        const offers = await server.offers().forAccount(distributorPubkey).call();
        
        let cancelTx = new StellarSdk.TransactionBuilder(distributorAccountUpdated, {
            fee: StellarSdk.BASE_FEE,
            networkPassphrase: StellarSdk.Networks.TESTNET,
        });
        
        for (const offer of offers.records) {
            cancelTx = cancelTx.addOperation(StellarSdk.Operation.manageSellOffer({
                selling: offer.selling.asset_type === 'native' ? StellarSdk.Asset.native() : 
                    new StellarSdk.Asset(offer.selling.asset_code, offer.selling.asset_issuer),
                buying: offer.buying.asset_type === 'native' ? StellarSdk.Asset.native() : 
                    new StellarSdk.Asset(offer.buying.asset_code, offer.buying.asset_issuer),
                amount: '0',
                price: offer.price,
                offerId: offer.id,
            }));
        }
        
        if (offers.records.length > 0) {
            cancelTx = cancelTx.setTimeout(300).build();
            cancelTx.sign(StellarSdk.Keypair.fromSecret(distributorSecret));
            await server.submitTransaction(cancelTx);
            console.log(`   ✅  Canceled ${offers.records.length} existing offers`);
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
        // Reload account after canceling offers
        const freshAccount = await server.loadAccount(distributorPubkey);
        
        // Create liquidity offers 
        // Rates: 
        // 1 USDC = 3.67 AED (Pegged)
        // 1 XLM = 0.33 AED = ~0.09 USDC (Current market: 1 XLM = 0.09 USD)
        // Let's use 1 XLM = 0.1 USDC for simplicity.
        
        console.log('   📤  Creating liquidity offers with realistic rates...');
        
        let offerTx = new StellarSdk.TransactionBuilder(freshAccount, {
            fee: StellarSdk.BASE_FEE,
            networkPassphrase: StellarSdk.Networks.TESTNET,
        })
        // XLM → USDC: Sell USDC for XLM
        // Rate: 1 XLM = 0.1 USDC. 
        // We want to SELL USDC at a HIGHER price (Ask)
        // Price = Buying(XLM) / Selling(USDC)
        // Let's ask for 10.5 XLM per USDC.
        .addOperation(StellarSdk.Operation.manageSellOffer({
            selling: USDC,
            buying: XLM,
            amount: '50000', // Sell 50k USDC
            price: '10.5',   // 1 USDC = 10.5 XLM
        }))
        
        // USDC → XLM: Sell XLM for USDC
        // We want to BUY USDC (Sell XLM) at a LOWER price (Bid)
        // Price = Buying(USDC) / Selling(XLM)
        // Let's buy USDC effectively at 10.0 XLM.
        // So Price = 1 / 10.0 = 0.1 USDC per XLM.
        .addOperation(StellarSdk.Operation.manageSellOffer({
            selling: XLM,
            buying: USDC,
            amount: '5000',
            price: '0.1',   // 1 XLM = 0.1 USDC (=> 1 USDC = 10 XLM)
        }))
        
        // XLM → INR: Sell INR for XLM
        // 1 XLM = 20 INR. (Price = XLM/INR = 0.05)
        .addOperation(StellarSdk.Operation.manageSellOffer({
            selling: INR,
            buying: XLM,
            amount: '1250000',
            price: '0.05', 
        }))
        
        .setTimeout(180)
        .build();
        
        console.log('   📤 Submitting offer transaction...');
        offerTx.sign(StellarSdk.Keypair.fromSecret(distributorSecret));
        await server.submitTransaction(offerTx);
        console.log('   ✅ Liquidity offers created!');
        
        // Verification logic
        console.log('   🔍 Verifying Order Book...');
        const checkUsdcBook = await server.orderbook(USDC, XLM).call();
        if (checkUsdcBook.bids.length > 0 || checkUsdcBook.asks.length > 0) {
             console.log('   ✅ XLM <-> USDC Liquidity Confirmed');
        } else {
             console.log('   ⚠️ XLM <-> USDC Liquidity NOT found');
        }

    } catch (error) {
        console.error('❌ Error setting up liquidity:', error);
        if (error.response?.data) {
            console.error('Details:', JSON.stringify(error.response.data, null, 2));
        }
        process.exit(1);
    }
}

setupLiquidity();
EOF

echo "🚀 Running liquidity setup..."
echo ""

# Use frontend's node_modules
export NODE_PATH="../frontend/node_modules"

# Export environment variables for Node.js script
export AED_ISSUER
export INR_ISSUER  
export DISTRIBUTOR
export AED_ISSUER_SECRET
export INR_ISSUER_SECRET
export DISTRIBUTOR_SECRET

node setup-liquidity.js

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Liquidity setup successful!"
    echo ""
    echo "🧪 Test your faucet now!"
    echo "   The DEX should have liquidity for XLM → AED and XLM → INR swaps"
    rm -f setup-liquidity.js
else
    echo ""
    echo "❌ Liquidity setup failed. Check errors above."
    exit 1
fi
