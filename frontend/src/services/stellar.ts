import * as StellarSdk from 'stellar-sdk';

const HORIZON_URL = import.meta.env.VITE_HORIZON_URL || 'https://horizon-testnet.stellar.org';
console.log('[Stellar] Initializing with Horizon URL:', HORIZON_URL);

const server = new StellarSdk.Horizon.Server(HORIZON_URL);

export interface PathPaymentParams {
  sourcePublicKey: string;
  destinationPublicKey: string;
  sendAsset: StellarSdk.Asset;
  sendAmount: string;
  destAsset: StellarSdk.Asset;
  destMin: string;
}

/**
 * Get real-time exchange rate from Stellar DEX
 */
// ... (imports remain the same)

export const getExchangeRate = async (
  sendAsset: StellarSdk.Asset,
  destAsset: StellarSdk.Asset,
  amount: string
): Promise<{ rate: number; estimatedOutput: string; path: StellarSdk.Asset[] }> => {
  try {
    // 1. Try strict send path (Source Amount is fixed)
    // This asks: "If I send [amount] of [sendAsset], how much [destAsset] do I get?"
    console.log(`[Stellar] Finding path for ${amount} ${sendAsset.code} -> ${destAsset.code}`);
    
    // Explicitly add XLM as an intermediate path if not native
    // This helps the path finder know we are willing to route through XLM
    const builder = server.strictSendPaths(sendAsset, amount, [destAsset]);

    const paths = await builder.call();

    if (paths.records.length > 0) {
      const bestPath = paths.records[0];
      const estimatedOutput = bestPath.destination_amount;
      const rate = parseFloat(estimatedOutput) / parseFloat(amount);
      
      // Extract the path (excluding source/dest, just intermediate)
      // The SDK returns path as an array of Assets
      const rawPath: StellarSdk.Asset[] = bestPath.path.map((p: any) => {
          if (p.asset_type === 'native') return StellarSdk.Asset.native();
          return new StellarSdk.Asset(p.asset_code, p.asset_issuer);
      });

      console.log('[Stellar] Found direct/auto path:', {
        path: rawPath.map(a => a.code).join(' → '),
        rate,
        estimatedOutput
      });

      return { rate, estimatedOutput, path: rawPath };
    }

    // 2. If no path found, throw specific error
    console.warn('[Stellar] No payment path found via standard lookup.');
    throw new Error(`No liquidity path found for ${sendAsset.code} -> ${destAsset.code}. Ensure liquidity pools exist on testnet.`);

  } catch (error) {
    console.error('Error fetching exchange rate:', error);
    throw error;
  }
};

/**
 * Execute path payment on Stellar network
 */
export const executePathPayment = async (
  params: PathPaymentParams & { path?: StellarSdk.Asset[] },
  signTx: (xdr: string) => Promise<string>
): Promise<string> => {
  try {
    // Load source account
    const sourceAccount = await server.loadAccount(params.sourcePublicKey);

    // Build path payment transaction
    const transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: import.meta.env.VITE_NETWORK_PASSPHRASE,
    })
      .addOperation(
        StellarSdk.Operation.pathPaymentStrictSend({
          sendAsset: params.sendAsset,
          sendAmount: params.sendAmount,
          destination: params.destinationPublicKey,
          destAsset: params.destAsset,
          destMin: params.destMin,
          path: params.path || [], // Pass the explicit path
        })
      )
      .setTimeout(180)
      .build();

    // Sign with Freighter
    const signedXdr = await signTx(transaction.toXDR());
    const signedTx = StellarSdk.TransactionBuilder.fromXDR(
      signedXdr,
      import.meta.env.VITE_NETWORK_PASSPHRASE
    );

    // Submit to network
    const result = await server.submitTransaction(signedTx as StellarSdk.Transaction);

    return result.hash;
  } catch (error) {
    console.error('Error executing path payment:', error);
    throw error;
  }
};
