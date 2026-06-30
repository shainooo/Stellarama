import { Button, useToast, Text } from '@chakra-ui/react';
import { useWallet } from '../hooks/useWallet';

export const WalletConnect = () => {
  const { wallet, isConnecting, connect, disconnect } = useWallet();
  const toast = useToast();

  const handleConnect = async () => {
    try {
      await connect();
      toast({
        title: 'Wallet Connected',
        description: 'Successfully connected to Freighter wallet',
        status: 'success',
        duration: 3000,
      });
    } catch (err) {
      // Error is already displayed via the error state
    }
  };

  return (
    <>
      {!wallet ? (
        <Button
          colorScheme="brand"
          onClick={handleConnect}
          isLoading={isConnecting}
          loadingText="Connecting..."
          size="md"
          fontWeight="700"
          px={6}
        >
          Connect Wallet
        </Button>
      ) : (
        <Button 
          variant="outline" 
          onClick={disconnect}
          colorScheme="whiteAlpha"
          color="white"
          borderColor="whiteAlpha.500"
          _hover={{
            bg: 'whiteAlpha.200',
            borderColor: 'white',
          }}
          size="md"
          fontWeight="600"
          px={6}
        >
          <Text as="span" fontFamily="monospace">
            {wallet.publicKey.slice(0, 4)}...{wallet.publicKey.slice(-4)}
          </Text>
        </Button>
      )}
    </>
  );
};
