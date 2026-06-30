import {
  isConnected,
  getAddress,
  requestAccess,
  signTransaction,
} from '@stellar/freighter-api';
import * as StellarSdk from 'stellar-sdk';
import type { WalletInfo } from '../types';

export type { WalletInfo } from '../types';

export const connectWallet = async (): Promise<WalletInfo> => {
  try {
    console.log('[Wallet] Attempting to connect to Freighter...');
    
    // Check if Freighter is installed
    const connected = await isConnected();
    console.log('[Wallet] Freighter connection status:', connected);
    
    if (!connected) {
      throw new Error('Freighter wallet is not installed. Please install the Freighter browser extension from https://www.freighter.app/');
    }

    // Request access to the wallet - this triggers the Freighter popup
    console.log('[Wallet] Requesting access to Freighter...');
    await requestAccess();
    console.log('[Wallet] Access granted, getting address...');

    // Get public key using the official Freighter API
    // getAddress() returns { address: string, error?: FreighterApiError }
    const result = await getAddress();
    
    console.log('[Wallet] getAddress result:', result);
    
    if (result.error) {
      throw new Error(result.error || 'Failed to get address from Freighter');
    }
    
    const publicKey = result.address;
    
    if (!publicKey) {
      throw new Error('Failed to get public key from Freighter. Please make sure you have approved the connection.');
    }
    
    console.log('[Wallet] Successfully connected. Public key:', publicKey);

    // Fetch balances
    const server = new StellarSdk.Horizon.Server('https://horizon-testnet.stellar.org');
    let balances = { native: '0', usdc: '0' };
    
    try {
      const account = await server.loadAccount(publicKey);
      const nativeBalance = account.balances.find((b: any) => b.asset_type === 'native');
      const usdcBalance = account.balances.find((b: any) => 
        b.asset_code === 'USDC' && 
        b.asset_issuer === (import.meta.env.VITE_AED_ISSUER || 'GCGH7MHBMNIRWEU6XKZ4CUGESGWZHQJL36ZI2ZOSZAQV6PREJDNYKEYZ')
      );

      balances = {
        native: nativeBalance ? nativeBalance.balance : '0',
        usdc: usdcBalance ? usdcBalance.balance : '0',
      };
      console.log('[Wallet] Fetched balances:', balances);
    } catch (e) {
      console.warn('[Wallet] Failed to fetch balances (new account?):', e);
    }
    
    return {
      publicKey,
      isConnected: true,
      balances
    };
  } catch (error) {
    console.error('[Wallet] Failed to connect:', error);
    
    // Provide helpful error messages
    if (error instanceof Error) {
      if (error.message.includes('User declined')) {
        throw new Error('You declined the wallet connection request. Please try again and approve the connection.');
      }
      if (error.message.includes('not installed')) {
        throw error; // Already has a helpful message
      }
      throw error;
    }
    
    throw new Error('Failed to connect to Freighter wallet. Please make sure the extension is installed and unlocked.');
  }
};

export const signStellarTransaction = async (xdr: string): Promise<string> => {
  try {
    console.log('[Wallet] Signing transaction...');
    console.log('[Wallet] XDR length:', xdr.length);
    
    const result = await signTransaction(xdr, {
      networkPassphrase: import.meta.env.VITE_NETWORK_PASSPHRASE,
    });
    
    console.log('[Wallet] Transaction signed successfully');
    
    // Handle both old and new Freighter API responses
    if (typeof result === 'string') {
      return result;
    } else if (result && typeof result === 'object' && 'signedTxXdr' in result) {
      return (result as any).signedTxXdr;
    }
    
    throw new Error('Unexpected response from Freighter');
  } catch (error) {
    console.error('[Wallet] Failed to sign transaction:', error);
    throw error;
  }
};
