import { Box, HStack, Text, VStack, Skeleton, Icon, Tooltip } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { useWallet } from '../hooks/useWallet';
import { FaCoins, FaWallet, FaDollarSign } from 'react-icons/fa';
import {
  addTransactionUpdateListener,
  fetchAccountBalances,
  type AccountBalances,
} from '../services/events';

export const BalanceBar = () => {
  const { wallet } = useWallet();
  const [balances, setBalances] = useState<AccountBalances>({ xlm: '0', usdc: '0', inr: '0' });
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    if (!wallet) {
      setBalances({ xlm: '0', usdc: '0', inr: '0' });
      setIsSyncing(false);
      return;
    }

    const fetchBalances = async () => {
      setIsLoading(true);
      try {
        setBalances(await fetchAccountBalances(wallet.publicKey));
      } catch (error) {
        console.error('Error fetching balances:', error);
      } finally {
        setIsLoading(false);
        setIsSyncing(false);
      }
    };

    fetchBalances();

    // Refresh balances every 10 seconds
    const interval = setInterval(fetchBalances, 10000);

    const removeTransactionListener = addTransactionUpdateListener((event) => {
      if (event.publicKey !== wallet.publicKey) return;
      setIsSyncing(true);
      fetchBalances();
    });

    return () => {
      clearInterval(interval);
      removeTransactionListener();
    };
  }, [wallet]);

  if (!wallet) {
    return null;
  }

  return (
    <Box
      bg="rgba(255, 255, 255, 0.06)"
      borderRadius="full"
      px={4}
      py={2}
      border="1px"
      borderColor="whiteAlpha.200"
      backdropFilter="blur(18px)"
      transition="all 0.25s ease"
      _hover={{
        borderColor: 'secondary.300',
        boxShadow: '0 0 26px rgba(6, 182, 212, 0.20)',
        transform: 'translateY(-1px)',
      }}
    >
      <HStack spacing={6} divider={<Box h="20px" w="1px" bg="whiteAlpha.300" />}>
        {/* XLM Balance */}
        <Tooltip label="Stellar Lumens (XLM)" placement="bottom">
          <HStack spacing={2}>
            <Icon as={FaWallet} color="whiteAlpha.600" boxSize={4} />
            <VStack spacing={0} align="end">
              <Text fontSize="xs" color="whiteAlpha.600" fontWeight="700" textTransform="uppercase">
                XLM
              </Text>
              <Skeleton isLoaded={!isLoading && !isSyncing} minW="40px">
                <Text fontSize="sm" color="whiteAlpha.900" fontWeight="800" fontFamily="monospace">
                  {balances.xlm}
                </Text>
              </Skeleton>
            </VStack>
          </HStack>
        </Tooltip>

        {/* USDC Balance */}
        <Tooltip label="USD Coin (USDC)" placement="bottom">
          <HStack spacing={2}>
            <Icon as={FaDollarSign} color="brand.300" boxSize={4} />
            <VStack spacing={0} align="end">
              <Text fontSize="xs" color="whiteAlpha.600" fontWeight="700" textTransform="uppercase">
                USDC
              </Text>
              <Skeleton isLoaded={!isLoading && !isSyncing} minW="40px">
                <Text fontSize="sm" color="brand.200" fontWeight="800" fontFamily="monospace">
                  {balances.usdc}
                </Text>
              </Skeleton>
            </VStack>
          </HStack>
        </Tooltip>

        {/* INR Balance */}
        <Tooltip label="Indian Rupee Token (INR)" placement="bottom">
          <HStack spacing={2}>
            <Icon as={FaCoins} color="secondary.300" boxSize={4} />
            <VStack spacing={0} align="end">
              <Text fontSize="xs" color="whiteAlpha.600" fontWeight="700" textTransform="uppercase">
                INR
              </Text>
              <Skeleton isLoaded={!isLoading && !isSyncing} minW="40px">
                <Text fontSize="sm" color="secondary.200" fontWeight="800" fontFamily="monospace">
                  {balances.inr}
                </Text>
              </Skeleton>
            </VStack>
          </HStack>
        </Tooltip>
      </HStack>
    </Box>
  );
};
