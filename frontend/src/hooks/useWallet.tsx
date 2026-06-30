import React, { createContext, useContext, useState } from 'react';
import { connectWallet as connectFreighter } from '../services/wallet';
import type { WalletInfo } from '../types';

interface WalletContextType {
  wallet: WalletInfo | null;
  isConnecting: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within WalletProvider');
  }
  return context;
};

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = async () => {
    console.log('[useWallet] Connect called');
    setIsConnecting(true);
    setError(null);
    
    try {
      const walletInfo = await connectFreighter();
      console.log('[useWallet] Wallet connected:', walletInfo.publicKey);
      setWallet(walletInfo);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect wallet';
      console.error('[useWallet] Connection error:', errorMessage);
      setError(errorMessage);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    console.log('[useWallet] Disconnecting wallet');
    setWallet(null);
    setError(null);
  };

  return (
    <WalletContext.Provider value={{ wallet, isConnecting, error, connect, disconnect }}>
      {children}
    </WalletContext.Provider>
  );
};
