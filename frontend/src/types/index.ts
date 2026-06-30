// Wallet types
export interface WalletInfo {
  publicKey: string;
  isConnected: boolean;
  balances?: {
    native: string;
    usdc?: string;
  };
}

// Remittance types
export interface Remittance {
  id: string;
  sender: string;
  recipient: string;
  amount_aed: string;
  amount_inr: string;
  exchange_rate: string;
  fee: string;
  status: 'pending' | 'complete' | 'failed';
  created_at: number;
}

export interface ExchangeRateQuote {
  rate: number;
  estimated_inr: string;
  fee_aed: string;
  total_cost_aed: string;
  expires_at: number;
}
