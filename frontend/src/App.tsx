import { ChakraProvider, Box } from '@chakra-ui/react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { WalletProvider } from './hooks/useWallet';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Navbar } from './components/Navbar';
import { Landing } from './pages/Landing';
import { SendMoney } from './pages/SendMoney';
import { History } from './pages/History';
import { Documentation } from './pages/Documentation';
import { Faucet } from './pages/Faucet';
import { Swap } from './pages/Swap';
import theme from './theme';

function App() {
  console.log('[App] Initializing Stellarama...');
  console.log('[App] Environment:', {
    contractId: import.meta.env.VITE_CONTRACT_ID || 'NOT_SET',
    network: import.meta.env.VITE_NETWORK_PASSPHRASE,
    horizonUrl: import.meta.env.VITE_HORIZON_URL,
  });

  return (
    <ErrorBoundary>
      <ChakraProvider theme={theme}>
        <WalletProvider>
          <BrowserRouter>
            <Box minH="100vh" bg="#030712">
              <Navbar />
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/send" element={<SendMoney />} />
                <Route path="/faucet" element={<Faucet />} />
                <Route path="/swap" element={<Swap />} />
                <Route path="/history" element={<History />} />
                <Route path="/docs" element={<Documentation />} />
              </Routes>
            </Box>
          </BrowserRouter>
        </WalletProvider>
      </ChakraProvider>
    </ErrorBoundary>
  );
}

export default App;
