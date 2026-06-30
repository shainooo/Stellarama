import * as StellarSdk from 'stellar-sdk';
import type { Remittance } from '../types';

const CONTRACT_ID = import.meta.env.VITE_CONTRACT_ID || 'CCB7BFIGSC6PRVVYHKZCEBFL4C7KTD4JU7NTLLMOUPEYHPGCQCH6GZU4';
const HORIZON_URL = import.meta.env.VITE_HORIZON_URL || 'https://horizon-testnet.stellar.org';
console.log('[Contract] Initializing with Contract ID:', CONTRACT_ID);
console.log('[Contract] Horizon URL:', HORIZON_URL);

const server = new StellarSdk.Horizon.Server(HORIZON_URL);

/**
 * Create remittance in smart contract (escrow AED)
 */
export const createRemittance = async (
  senderPublicKey: string,
  recipientPublicKey: string,
  amountAED: string,
  tokenAddress: string,
  signTx: (xdr: string) => Promise<string>
): Promise<string> => {
  try {
    const sourceAccount = await server.loadAccount(senderPublicKey);

    // Build contract invocation
    const contract = new StellarSdk.Contract(CONTRACT_ID);
    
    const transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: import.meta.env.VITE_NETWORK_PASSPHRASE,
    })
      .addOperation(
        contract.call(
          'create_remittance',
          StellarSdk.Address.fromString(senderPublicKey).toScVal(),
          StellarSdk.Address.fromString(recipientPublicKey).toScVal(),
          StellarSdk.nativeToScVal(BigInt(amountAED), { type: 'i128' }),
          StellarSdk.Address.fromString(tokenAddress).toScVal()
        )
      )
      .setTimeout(180)
      .build();

    // Sign and submit
    const signedXdr = await signTx(transaction.toXDR());
    const signedTx = StellarSdk.TransactionBuilder.fromXDR(
      signedXdr,
      import.meta.env.VITE_NETWORK_PASSPHRASE
    );

    const result = await server.submitTransaction(signedTx as StellarSdk.Transaction);
    
    // Extract remittance ID from result
    // TOOD: Parse from transaction result
    const remittanceId = result.hash; // Placeholder

    return remittanceId;
  } catch (error) {
    console.error('Error creating remittance:', error);
    throw error;
  }
};

/**
 * Complete remittance after path payment
 */
export const completeRemittance = async (
  senderPublicKey: string,
  remittanceId: string,
  amountINR: string,
  exchangeRate: string,
  signTx: (xdr: string) => Promise<string>
): Promise<void> => {
  try {
    const sourceAccount = await server.loadAccount(senderPublicKey);
    const contract = new StellarSdk.Contract(CONTRACT_ID);

    const transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: import.meta.env.VITE_NETWORK_PASSPHRASE,
    })
      .addOperation(
        contract.call(
          'complete_remittance',
          StellarSdk.nativeToScVal(remittanceId, { type: 'bytes' }),
          StellarSdk.nativeToScVal(BigInt(amountINR), { type: 'i128' }),
          StellarSdk.nativeToScVal(BigInt(exchangeRate), { type: 'i128' })
        )
      )
      .setTimeout(180)
      .build();

    const signedXdr = await signTx(transaction.toXDR());
    const signedTx = StellarSdk.TransactionBuilder.fromXDR(
      signedXdr,
      import.meta.env.VITE_NETWORK_PASSPHRASE
    );

    await server.submitTransaction(signedTx as StellarSdk.Transaction);
  } catch (error) {
    console.error('Error completing remittance:', error);
    throw error;
  }
};

/**
 * Get user's remittance history
 */
export const getUserHistory = async (
  // userPublicKey: string,
  // offset: number = 0,
  // limit: number = 20
): Promise<Remittance[]> => {
  try {
    // const sourceAccount = await server.loadAccount(userPublicKey);
    // const contract = new StellarSdk.Contract(CONTRACT_ID);

    // This would need to be a read-only call
    // For MVP, we can skip this and query Horizon for contract events
    // TODO: Implement proper RPC call for read-only contract queries

    return [];
  } catch (error) {
    console.error('Error fetching history:', error);
    throw error;
  }
};

/**
 * Calculate fee (0.5% of amount)
 */
export const calculateFee = (amountAED: string): string => {
  const amount = BigInt(amountAED);
  const fee = (amount * BigInt(50)) / BigInt(10000);
  return fee.toString();
};
