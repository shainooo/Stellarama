import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Heading,
  Input,
  VStack,
  Text,
  Alert,
  AlertIcon,
  Divider,
  SimpleGrid,
  useToast,
  Spinner,
  HStack,
  Icon,
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { useWallet } from '../hooks/useWallet';
import { getExchangeRate, executePathPayment } from '../services/stellar';
import { signStellarTransaction } from '../services/wallet';
import * as StellarSdk from 'stellar-sdk';
import { FaExchangeAlt, FaBolt, FaCheckCircle } from 'react-icons/fa';

const glassCard = {
  bg: 'rgba(255, 255, 255, 0.05)',
  border: '1px solid',
  borderColor: 'whiteAlpha.200',
  boxShadow: 'glass',
  backdropFilter: 'blur(22px)',
  transition: 'transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease',
  _hover: {
    transform: 'translateY(-3px)',
    borderColor: 'secondary.300',
    boxShadow: '0 30px 90px rgba(6, 182, 212, 0.18)',
  },
};

const USDC_ISSUER = import.meta.env.VITE_AED_ISSUER || 'GCGH7MHBMNIRWEU6XKZ4CUGESGWZHQJL36ZI2ZOSZAQV6PREJDNYKEYZ';
const INR_ISSUER = import.meta.env.VITE_INR_ISSUER || 'GBSVZWQQRRHZ2NF3WD3FVER2AUFQLVO5KWHXJJR3PTR5QWIW4QHNMITH';

const USDC_ASSET = new StellarSdk.Asset('USDC', USDC_ISSUER);
const INR_ASSET = new StellarSdk.Asset('INR', INR_ISSUER);

export const SendMoney = () => {
  const { wallet } = useWallet();
  const toast = useToast();

  const [amount, setAmount] = useState(''); // Amount in USDC
  const [recipient, setRecipient] = useState('');
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);
  const [estimatedINR, setEstimatedINR] = useState('');
  const [fee, setFee] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingRate, setIsFetchingRate] = useState(false);
  
  // Store the path found during rate lookup
  const [paymentPath, setPaymentPath] = useState<StellarSdk.Asset[]>([]);

  // Fetch exchange rate (USDC -> INR) whenever amount changes
  useEffect(() => {
    if (!amount || parseFloat(amount) === 0) {
      setExchangeRate(null);
      setEstimatedINR('');
      setFee('');
      setPaymentPath([]);
      return;
    }

    const fetchRate = async () => {
      setIsFetchingRate(true);
      try {
        const amountFloat = parseFloat(amount);
        const result = await getExchangeRate(USDC_ASSET, INR_ASSET, amount);
        setExchangeRate(result.rate);
        setEstimatedINR(result.estimatedOutput);
        setPaymentPath(result.path); // Store the path
        
        // Fee in USDC (0.5%)
        const feeAmount = amountFloat * 0.005;
        setFee(feeAmount.toFixed(2));
      } catch (error) {
        console.error('Error fetching rate:', error);
        setExchangeRate(null);
        setEstimatedINR('0');
        setPaymentPath([]);
      } finally {
        setIsFetchingRate(false);
      }
    };

    const debounce = setTimeout(fetchRate, 500);
    return () => clearTimeout(debounce);
  }, [amount, toast]);

  const handleSend = async () => {
    if (!wallet) {
      toast({
        title: 'Wallet not connected',
        description: 'Please connect your Freighter wallet',
        status: 'warning',
        duration: 3000,
      });
      return;
    }

    if (!amount || !recipient || !exchangeRate) {
      toast({
        title: 'Missing information',
        description: 'Please fill all fields',
        status: 'warning',
        duration: 3000,
      });
      return;
    }

    setIsLoading(true);

    try {
      // Calculate minimum INR with 2% slippage, limited to 7 decimals for Stellar
      const minINRFloat = parseFloat(estimatedINR) * 0.98;
      const minINR = minINRFloat.toFixed(7);

      toast({
        title: 'Executing cross-border payment...',
        description: 'USDC → INR path payment',
        status: 'info',
        duration: 3000,
      });

      // Execute path payment (USDC → INR) via Stellar DEX
      const txHash = await executePathPayment(
        {
          sourcePublicKey: wallet.publicKey,
          destinationPublicKey: recipient,
          sendAsset: USDC_ASSET,
          sendAmount: amount,
          destAsset: INR_ASSET,
          destMin: minINR,
          path: paymentPath, // Pass the explicit path
        },
        signStellarTransaction
      );

      // Success!
      toast({
        title: 'Payment Successful!',
        description: `Transaction Hash: ${txHash.slice(0, 16)}...`,
        status: 'success',
        duration: 10000,
        isClosable: true,
      });

      // Reset form
      setAmount('');
      setRecipient('');
      setExchangeRate(null);
      setEstimatedINR('');
      
    } catch (error) {
      console.error('Error sending money:', error);
      
      let errorMessage = 'Transaction failed.';
      
      // Check for specific Stellar errors
      if ((error as any).response?.data?.extras?.result_codes) {
        const codes = (error as any).response.data.extras.result_codes;
        console.error('Transaction result codes:', codes);
        
        const opErrors = codes.operations || [];
        if (opErrors.includes('op_too_few_offers')) {
          errorMessage = 'No liquidity path found for USDC → INR. Ensure liquidity (USDC→XLM and XLM→INR) exists.';
        } else if (opErrors.includes('op_underfunded')) {
          errorMessage = `Insufficient USDC balance. You need at least ${amount} USDC.`;
        } else if (opErrors.includes('op_no_trust')) {
          errorMessage = 'Recipient missing trustline for INR token.';
        } else if (opErrors.length > 0) {
          errorMessage = `Transaction failed: ${codes.transaction || ''} - ${opErrors.join(', ')}`;
        }
      }
      
      toast({
        title: 'Payment Failed',
        description: errorMessage,
        status: 'error',
        duration: 8000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!wallet) {
    return (
      <Box 
        minH="calc(100vh - 80px)" 
        bg="#030712"
        display="flex"
        alignItems="center"
        justifyContent="center"
        py={10}
      >
        <Container maxW="container.md">
          <Alert 
            status="warning" 
            borderRadius="2xl" 
            p={8}
            boxShadow="glass"
            bg="rgba(255,255,255,0.06)"
            border="2px"
            borderColor="accent.300"
          >
            <AlertIcon boxSize={6} />
            <VStack align="start" spacing={2} ml={2}>
              <Text fontWeight="700" fontSize="lg">
                Wallet Not Connected
              </Text>
              <Text color="whiteAlpha.700">
                Please connect your Freighter wallet to send money
              </Text>
            </VStack>
          </Alert>
        </Container>
      </Box>
    );
  }

  return (
    <Box 
      minH="calc(100vh - 80px)" 
      bg="#030712"
      py={12}
      position="relative"
      overflow="hidden"
      sx={{ animation: 'page-in 0.45s ease both' }}
      _before={{
        content: '""',
        position: 'absolute',
        inset: 0,
        background:
          'radial-gradient(circle at 15% 15%, rgba(139,92,246,0.22), transparent 30%), radial-gradient(circle at 85% 5%, rgba(6,182,212,0.16), transparent 28%)',
        pointerEvents: 'none',
      }}
    >
      <Container maxW="container.md" position="relative" zIndex={1}>
        <VStack spacing={8} align="stretch">
          {/* Header */}
          <VStack spacing={3} textAlign="center">
            <Heading 
              size="2xl" 
              fontWeight="900" 
              letterSpacing="-0.03em"
              bgGradient="linear(to-r, brand.200, secondary.200, accent.300)"
              bgClip="text"
            >
              Send Money
            </Heading>
            <Text color="whiteAlpha.700" fontSize="lg">
              Send USDC directly to India - instantly converted to INR
            </Text>
          </VStack>

          {/* Main Form Card */}
          <Box 
            {...glassCard}
            p={10} 
            borderRadius="3xl" 
          >
            <VStack spacing={7}>
              {/* Amount Input */}
              <FormControl isRequired>
                <FormLabel 
                  fontWeight="700" 
                  fontSize="md" 
                  color="whiteAlpha.800"
                  mb={3}
                >
                  Amount (USDC)
                </FormLabel>
                <HStack>
                  <Input
                    type="number"
                    placeholder="Enter amount (e.g., 100)"
                    size="lg"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    min="1"
                    max="10000"
                    fontSize="xl"
                    fontWeight="600"
                    h="64px"
                  />
                  <Box 
                    h="64px" 
                    px={6} 
                    bg="whiteAlpha.100" 
                    borderRadius="md" 
                    border="1px" 
                    borderColor="whiteAlpha.200"
                    display="flex"
                    alignItems="center"
                    fontWeight="bold"
                    color="whiteAlpha.800"
                  >
                    USDC
                  </Box>
                </HStack>
              </FormControl>

              {/* Recipient Input */}
              <FormControl isRequired>
                <FormLabel 
                  fontWeight="700" 
                  fontSize="md" 
                  color="whiteAlpha.800"
                  mb={3}
                >
                  Recipient Stellar Address
                </FormLabel>
                <Input
                  placeholder="GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  fontSize="sm"
                  fontFamily="monospace"
                  h="56px"
                />
                <Alert status="warning" mt={3} borderRadius="lg" bg="rgba(236, 72, 153, 0.10)">
                  <AlertIcon />
                  <Text fontSize="xs">
                    ⚠️ Recipient must have an INR trustline associated with the Stellarama INR Issuer.
                  </Text>
                </Alert>
              </FormControl>

              {/* Exchange Rate Display */}
              {isFetchingRate && (
                <Box 
                  textAlign="center" 
                  py={8}
                  bg="brand.50"
                  color="white"
                  borderRadius="2xl"
                  w="full"
                >
                  <Spinner size="lg" color="secondary.300" thickness="4px" />
                  <Text mt={3} fontSize="sm" fontWeight="600" color="secondary.100">
                    Fetching real-time exchange rate...
                  </Text>
                </Box>
              )}

              {exchangeRate && !isFetchingRate && (
                <Box 
                  bgGradient="linear(135deg, rgba(139,92,246,0.18), rgba(6,182,212,0.12))"
                  p={8} 
                  borderRadius="2xl" 
                  w="full"
                  border="2px"
                  borderColor="secondary.300"
                  position="relative"
                  overflow="hidden"
                >
                  {/* Decorative element */}
                  <Box
                    position="absolute"
                    top="-50px"
                    right="-50px"
                    w="150px"
                    h="150px"
                    borderRadius="full"
                    bg="secondary.300"
                    filter="blur(40px)"
                  />
                  
                  <VStack spacing={6} position="relative">
                    <HStack spacing={2}>
                      <Icon as={FaExchangeAlt} color="secondary.200" boxSize={5} />
                      <Heading size="md" fontWeight="800">
                        Transaction Summary
                      </Heading>
                    </HStack>
                    
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} w="full">
                      <Box bg="whiteAlpha.100" p={4} borderRadius="xl" border="1px solid" borderColor="whiteAlpha.200">
                        <Text fontSize="xs" fontWeight="700" color="whiteAlpha.600" textTransform="uppercase" mb={1}>
                          Sending
                        </Text>
                        <Text fontSize="2xl" fontWeight="900" color="white">
                          {amount} USDC
                        </Text>
                      </Box>
                      <Box bg="whiteAlpha.100" p={4} borderRadius="xl" border="1px solid" borderColor="whiteAlpha.200">
                        <Text fontSize="xs" fontWeight="700" color="whiteAlpha.600" textTransform="uppercase" mb={1}>
                          Exchange Rate
                        </Text>
                        <Text fontSize="lg" fontWeight="800" color="secondary.200">
                          1 USDC = {exchangeRate.toFixed(2)} INR
                        </Text>
                      </Box>
                      <Box bg="whiteAlpha.100" p={4} borderRadius="xl" border="1px solid" borderColor="whiteAlpha.200">
                        <Text fontSize="xs" fontWeight="700" color="whiteAlpha.600" textTransform="uppercase" mb={1}>
                          Platform Fee (0.5%)
                        </Text>
                        <Text fontSize="lg" fontWeight="800" color="whiteAlpha.900">
                          {fee} USDC
                        </Text>
                      </Box>
                      <Box bg="whiteAlpha.100" p={4} borderRadius="xl" border="1px solid" borderColor="whiteAlpha.200">
                        <Text fontSize="xs" fontWeight="700" color="whiteAlpha.600" textTransform="uppercase" mb={1}>
                          Network Fee
                        </Text>
                        <Text fontSize="lg" fontWeight="800" color="whiteAlpha.900">
                          ~0.00001 XLM
                        </Text>
                      </Box>
                    </SimpleGrid>
                    
                    <Divider borderColor="whiteAlpha.300" />
                    
                    <Box 
                      bg="linear-gradient(135deg, rgba(139,92,246,0.42), rgba(6,182,212,0.28))"
                      p={6}
                      borderRadius="xl"
                      w="full"
                      textAlign="center"
                    >
                      <HStack justify="center" mb={2}>
                        <Icon as={FaCheckCircle} color="secondary.100" boxSize={5} />
                        <Text fontSize="sm" fontWeight="900" color="white" textTransform="uppercase" letterSpacing="wide">
                          Recipient Receives
                        </Text>
                      </HStack>
                      <Text fontSize="4xl" fontWeight="900" color="white">
                        {estimatedINR} INR
                      </Text>
                      <HStack justify="center" mt={2} spacing={1}>
                        <Icon as={FaBolt} color="secondary.100" boxSize={3} />
                        <Text fontSize="xs" fontWeight="700" color="whiteAlpha.800">
                          Instant settlement
                        </Text>
                      </HStack>
                    </Box>
                  </VStack>
                </Box>
              )}

              {/* Send Button */}
              <Button
                colorScheme="green"
                size="lg"
                w="full"
                h="64px"
                fontSize="lg"
                fontWeight="800"
                onClick={handleSend}
                isLoading={isLoading}
                loadingText="Processing Transaction..."
                isDisabled={!amount || !recipient || !exchangeRate}
                boxShadow={exchangeRate ? "success" : "none"}
                _hover={{
                  transform: 'translateY(-2px)',
                  boxShadow: '0 16px 32px rgba(0, 255, 144, 0.4)',
                }}
                transition="all 0.3s"
              >
                Send Money →
              </Button>

              <HStack spacing={2} justify="center" fontSize="sm" color="whiteAlpha.600">
                <Icon as={FaBolt} boxSize={3} />
                <Text>
                  Secured by Stellar blockchain • Executed via path payment
                </Text>
              </HStack>
            </VStack>
          </Box>
        </VStack>
      </Container>
    </Box>
  );
};
