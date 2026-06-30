#!/bin/bash

# Stellarama Testnet Setup Script
# Creates AED and INR assets on Stellar Testnet and sets up liquidity pools

set -e

echo "🚀 Stellarama Testnet Setup"
echo "========================="
echo ""

# Check if stellar CLI is installed
if ! command -v stellar &> /dev/null; then
    echo "❌ Stellar CLI not found. Installing..."
    echo "Please install from: https://developers.stellar.org/docs/build/smart-contracts/getting-started/setup"
    exit 1
fi

# Create or use existing identities
echo "📝 Setting up identities..."

# AED Issuer
if ! stellar keys ls | grep -q "aed-issuer"; then
    echo "Creating AED issuer..."
    stellar keys generate aed-issuer --network testnet
fi

# INR Issuer  
if ! stellar keys ls | grep -q "inr-issuer"; then
    echo "Creating INR issuer..."
    stellar keys generate inr-issuer --network testnet
fi

# Distribution account (for liquidity pools)
if ! stellar keys ls | grep -q "distributor"; then
    echo "Creating distributor account..."
    stellar keys generate distributor --network testnet
fi

# Get addresses
AED_ISSUER=$(stellar keys address aed-issuer)
INR_ISSUER=$(stellar keys address inr-issuer)
DISTRIBUTOR=$(stellar keys address distributor)

echo "✅ Identities created:"
echo "   AED Issuer: $AED_ISSUER"
echo "   INR Issuer: $INR_ISSUER"
echo "   Distributor: $DISTRIBUTOR"
echo ""

# Fund accounts via Friendbot
echo "💰 Funding accounts..."
curl -s "https://friendbot.stellar.org?addr=$AED_ISSUER" > /dev/null
sleep 2
curl -s "https://friendbot.stellar.org?addr=$INR_ISSUER" > /dev/null
sleep 2
curl -s "https://friendbot.stellar.org?addr=$DISTRIBUTOR" > /dev/null
sleep 2
echo "✅ Accounts funded"
echo ""

# Issue AED asset
echo "🪙 Issuing AED asset..."
stellar contract asset deploy \
    --asset "AED:$AED_ISSUER" \
    --source aed-issuer \
    --network testnet > /tmp/aed_token.txt 2>&1 || true

AED_TOKEN=$(cat /tmp/aed_token.txt | grep -o 'C[A-Z0-9]\{55\}' | head -1)

if [ -z "$AED_TOKEN" ]; then
    echo "⚠️  Could not deploy AED token contract. Using manual approach..."
    # Fallback: just note the asset code and issuer
    AED_TOKEN="AED:$AED_ISSUER"
fi

echo "✅ AED Token: $AED_TOKEN"
echo ""

# Issue INR asset
echo "🪙 Issuing INR asset..."
stellar contract asset deploy \
    --asset "INR:$INR_ISSUER" \
    --source inr-issuer \
    --network testnet > /tmp/inr_token.txt 2>&1 || true

INR_TOKEN=$(cat /tmp/inr_token.txt | grep -o 'C[A-Z0-9]\{55\}' | head -1)

if [ -z "$INR_TOKEN" ]; then
    echo "⚠️  Could not deploy INR token contract. Using manual approach..."
    INR_TOKEN="INR:$INR_ISSUER"
fi

echo "✅ INR Token: $INR_TOKEN"
echo ""

# Create liquidity (simplified - would need actual DEX setup in production)
echo "💧 Setting up liquidity..."
echo "⚠️  Note: For demo purposes, you'll need to manually create liquidity pools"
echo "   Use Stellar Laboratory: https://laboratory.stellar.org"
echo ""

# Save configuration
echo "💾 Saving configuration..."
cat > ../frontend/.env << EOF
VITE_CONTRACT_ID=
VITE_HORIZON_URL=https://horizon-testnet.stellar.org
VITE_NETWORK_PASSPHRASE=Test SDF Network ; September 2015

# Asset Configuration
VITE_AED_ISSUER=$AED_ISSUER
VITE_INR_ISSUER=$INR_ISSUER
VITE_AED_TOKEN=$AED_TOKEN
VITE_INR_TOKEN=$INR_TOKEN
VITE_DISTRIBUTOR=$DISTRIBUTOR
EOF

cat > ../testnet-config.json << EOF
{
  "aed_issuer": "$AED_ISSUER",
  "inr_issuer": "$INR_ISSUER",
  "aed_token": "$AED_TOKEN",
  "inr_token": "$INR_TOKEN",
  "distributor": "$DISTRIBUTOR",
  "network": "testnet"
}
EOF

echo "✅ Configuration saved to:"
echo "   - frontend/.env"
echo "   - testnet-config.json"
echo ""

echo "🎉 Testnet setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Deploy smart contract: ./deploy-contract.sh"
echo "2. Update frontend/src/pages/SendMoney.tsx with asset addresses"
echo "3. Set up liquidity pools using Stellar Laboratory"
echo "4. Fund test accounts with AED/INR tokens"
echo ""
echo "📝 Asset Details:"
echo "   AED: $AED_TOKEN"
echo "   INR: $INR_TOKEN"
echo ""
echo "🔗 Useful links:"
echo "   Stellar Laboratory: https://laboratory.stellar.org"
echo "   Stellar Expert: https://stellar.expert/explorer/testnet"
