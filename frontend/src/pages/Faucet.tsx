import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Heading,
  VStack,
  HStack,
  Text,
  Alert,
  AlertIcon,
  useToast,
  Icon,
  Select,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Badge,
} from '@chakra-ui/react';
import { useState } from 'react';
import { useWallet } from '../hooks/useWallet';
import { FaUniversity, FaMoneyBillWave } from 'react-icons/fa';
import * as StellarSdk from 'stellar-sdk';
import { signTransaction } from '@stellar/freighter-api';

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

// Exchange rates (Simulated for Demo)
// 1 XLM = 0.1 USDC (Market Rate on Testnet)
// 3.67 AED = 1 USDC (Fixed Peg)
const EXCHANGE_RATES = {
  USDC_PER_XLM: 0.1,    // 1 XLM -> 0.1 USDC
  AED_PER_USDC: 3.67,   // 1 USDC = 3.67 AED
};

export const Faucet = () => {
  const { wallet } = useWallet();
  const toast = useToast();
  const [depositCurrency, setDepositCurrency] = useState<'AED'>('AED');
  const [depositAmount, setDepositAmount] = useState('100'); // Default 100 AED
  const [isLoading, setIsLoading] = useState(false);

  // Calculate: User inputs AED -> We give them USDC
  // Math: USDC = AED / 3.67
  const calculateUsdcAmount = (aed: string): number => {
    const aedNum = parseFloat(aed) || 0;
    return Math.floor(aedNum / EXCHANGE_RATES.AED_PER_USDC); // e.g. 100 AED -> 27 USDC
  };

  const usdcAmount = calculateUsdcAmount(depositAmount);

  // XLM required to buy that much USDC
  // XLM = USDC / 0.1
  const xlmRequired = Math.ceil(usdcAmount / EXCHANGE_RATES.USDC_PER_XLM);

  const handleClaim = async () => {
    if (!wallet) {
      toast({
        title: 'Wallet not connected',
        description: 'Please connect your Freighter wallet',
        status: 'warning',
        duration: 3000,
      });
      return;
    }

    const aedNum = parseFloat(depositAmount);
    if (!aedNum || aedNum <= 0) {
      toast({
        title: 'Invalid amount',
        description: 'Please enter a valid amount',
        status: 'warning',
        duration: 3000,
      });
      return;
    }

    setIsLoading(true);

    try {
      const server = new StellarSdk.Horizon.Server(
        import.meta.env.VITE_HORIZON_URL || 'https://horizon-testnet.stellar.org'
      );

      // We are ALWAYS giving USDC now
      const asset = new StellarSdk.Asset('USDC', import.meta.env.VITE_AED_ISSUER || 'GCGH7MHBMNIRWEU6XKZ4CUGESGWZHQJL36ZI2ZOSZAQV6PREJDNYKEYZ');

      // Load source account
      const sourceAccount = await server.loadAccount(wallet.publicKey);

      // Check if trustline exists
      const hasTrustline = sourceAccount.balances.some(
        (balance: any) => 
          balance.asset_type !== 'native' && 
          balance.asset_code === 'USDC' &&
          balance.asset_issuer === asset.getIssuer()
      );

      // Create trustline if it doesn't exist
      if (!hasTrustline) {
        toast({
          title: 'Linking Bank Account...',
          description: `Setting up USDC wallet trustline`,
          status: 'info',
          duration: 3000,
        });

        const trustlineOp = StellarSdk.Operation.changeTrust({
          asset: asset,
        });

        const trustlineTx = new StellarSdk.TransactionBuilder(sourceAccount, {
          fee: StellarSdk.BASE_FEE,
          networkPassphrase: StellarSdk.Networks.TESTNET,
        })
          .addOperation(trustlineOp)
          .setTimeout(300)
          .build();

        // Sign and submit trustline transaction
        const trustlineXdr = trustlineTx.toXDR();
        const trustlineSignResult = await signTransaction(trustlineXdr, {
          networkPassphrase: StellarSdk.Networks.TESTNET,
        });

        const signedTrustlineTx = StellarSdk.TransactionBuilder.fromXDR(
          trustlineSignResult.signedTxXdr,
          StellarSdk.Networks.TESTNET
        );
        await server.submitTransaction(signedTrustlineTx);

        toast({
          title: 'Account Connected!',
          description: `You can now receive USDC funds`,
          status: 'success',
          duration: 3000,
        });

        // Reload account with new trustline
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Now perform the swap
      // We simulate depositing AED by swapping user's XLM for USDC (Self-Funding Demo)
      // Ideally this would come from a distribution server, but for testnet self-serve:
      const updatedAccount = await server.loadAccount(wallet.publicKey);

      // Build path payment: XLM → USDC
      // We send 'xlmRequired' XLM to get 'usdcAmount' USDC
      const transaction = new StellarSdk.TransactionBuilder(updatedAccount, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: StellarSdk.Networks.TESTNET,
      })
        .addOperation(
          StellarSdk.Operation.pathPaymentStrictSend({
            sendAsset: StellarSdk.Asset.native(),
            sendAmount: xlmRequired.toString(),
            destination: wallet.publicKey,
            destAsset: asset,
            destMin: (usdcAmount * 0.9).toString(), // 10% slippage tolerance
          })
        )
        .setTimeout(300)
        .build();

      // Sign with Freighter
      const xdr = transaction.toXDR();
      const signResult = await signTransaction(xdr, {
        networkPassphrase: StellarSdk.Networks.TESTNET,
      });

      // Submit to network
      const signedTx = StellarSdk.TransactionBuilder.fromXDR(
        signResult.signedTxXdr,
        StellarSdk.Networks.TESTNET
      );
      await server.submitTransaction(signedTx);


      toast({
        title: 'Deposit Successful!',
        description: `Deposited ${aedNum} AED. Received ${usdcAmount.toLocaleString()} USDC.`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      // Reset amount
      setDepositAmount('100');
    } catch (error) {
      console.error('Error funding wallet:', error);
      
      let errorMessage = 'Deposit failed. Please try again.';
      
      // Enhanced error logging
      if ((error as any).response?.data?.extras) {
        const resultCodes = (error as any).response.data.extras.result_codes;
        
        if (resultCodes?.operations) {
          const opErrors = resultCodes.operations;
          if (opErrors.includes('op_under_dest_min')) {
            errorMessage = `Rate fluctuation. Try refreshing.`;
          } else if (opErrors.includes('op_too_few_offers')) {
            errorMessage = `No liquidity for bank transfer simulation. Run setup scripts.`;
          } else if (opErrors.includes('op_underfunded')) {
            errorMessage = `Insufficient Testnet XLM. You need ~${xlmRequired} XLM.`;
          } else if (opErrors.length > 0) {
            errorMessage = `Simulation failed: ${opErrors.join(', ')}`;
          }
        }
      }
      
      toast({
        title: 'Deposit Failed',
        description: errorMessage,
        status: 'error',
        duration: 10000,
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
            status="info" 
            borderRadius="2xl" 
            p={8}
            boxShadow="glass"
            bg="rgba(255,255,255,0.06)"
            border="2px"
            borderColor="secondary.300"
          >
            <AlertIcon boxSize={6} color="secondary.300" />
            <VStack align="start" spacing={2} ml={2}>
              <Text fontWeight="700" fontSize="lg">
                Connect Wallet to Deposit
              </Text>
              <Text color="whiteAlpha.700">
                Please connect your wallet to simulate a bank deposit into Stellarama
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
          'radial-gradient(circle at 20% 0%, rgba(6,182,212,0.20), transparent 30%), radial-gradient(circle at 90% 25%, rgba(236,72,153,0.18), transparent 30%)',
        pointerEvents: 'none',
      }}
    >
      <Container maxW="container.md" position="relative" zIndex={1}>
        <VStack spacing={8} align="stretch">
          {/* Header */}
          <VStack spacing={3} textAlign="center">
            <Icon as={FaUniversity} boxSize={12} color="secondary.200" filter="drop-shadow(0 0 18px rgba(6,182,212,0.45))" />
            <Heading 
              size="2xl" 
              fontWeight="900" 
              letterSpacing="-0.03em"
              bgGradient="linear(to-r, secondary.200, brand.200, accent.300)"
              bgClip="text"
            >
              Simulate Bank Deposit
            </Heading>
            <Text color="whiteAlpha.700" fontSize="lg" maxW="xl">
              Deposit cash (AED) into your Stellarama wallet via MoneyGram.
            </Text>
            <Badge colorScheme="blue" variant="solid" fontSize="sm" mt={2} px={3} py={1} borderRadius="full">
              Simulating MoneyGram Integration
            </Badge>
          </VStack>

          {/* Setup Warning */}
          <Alert status="info" borderRadius="xl" bg="rgba(6, 182, 212, 0.10)" border="1px" borderColor="secondary.300">
            <AlertIcon />
            <Box>
              <Text fontWeight="700" fontSize="sm" mb={1}>
                ℹ️ Testnet Simulation
              </Text>
              <Text fontSize="xs" color="whiteAlpha.700">
                This faucet simulates MoneyGram's cash deposit process. 
                In production, users deposit cash at MoneyGram locations 
                and receive USDC on Stellar. For this demo, we use test tokens.
              </Text>
            </Box>
          </Alert>

          {/* Main Card */}
          <Box 
            {...glassCard}
            p={10} 
            borderRadius="3xl" 
          >
            <VStack spacing={7}>
              {/* Token Selection */}
              <FormControl>
                <FormLabel 
                  fontWeight="700" 
                  fontSize="md" 
                  color="whiteAlpha.800"
                  mb={3}
                >
                  Deposit Currency (Cash)
                </FormLabel>
                <Select
                  value={depositCurrency}
                  onChange={(e) => setDepositCurrency(e.target.value as 'AED')}
                  size="lg"
                  fontSize="lg"
                  fontWeight="600"
                  h="64px"
                  icon={<FaMoneyBillWave />}
                >
                  <option value="AED">🇦🇪 AED (UAE Dirham)</option>
                </Select>
              </FormControl>

              {/* Amount Input */}
              <FormControl>
                <FormLabel 
                  fontWeight="700" 
                  fontSize="md" 
                  color="whiteAlpha.800"
                  mb={3}
                >
                  Deposit Amount (AED)
                </FormLabel>
                <NumberInput
                  value={depositAmount}
                  onChange={(valueString) => setDepositAmount(valueString)}
                  min={10}
                  max={10000}
                  step={10}
                  size="lg"
                >
                  <NumberInputField 
                    h="64px" 
                    fontSize="xl" 
                    fontWeight="600"
                    placeholder="Enter amount"
                  />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
                <Text fontSize="xs" color="whiteAlpha.600" mt={2}>
                  Exchange Rate: 1 USDC = {EXCHANGE_RATES.AED_PER_USDC} AED
                </Text>
              </FormControl>

              {/* Exchange Preview */}
              <Box 
                bgGradient="linear(135deg, rgba(139,92,246,0.20), rgba(6,182,212,0.12))"
                p={8} 
                borderRadius="2xl" 
                w="full"
                border="2px"
                borderColor="secondary.300"
              >
                <VStack spacing={4}>
                  <Text fontSize="sm" fontWeight="700" color="whiteAlpha.700" textTransform="uppercase">
                    You Receive (In Wallet)
                  </Text>
                  <HStack spacing={4} justify="center" align="center">
                    <Icon as={FaMoneyBillWave} boxSize={8} color="secondary.200" />
                    <Text fontSize="4xl" fontWeight="900" color="white">
                      {usdcAmount.toLocaleString()}
                    </Text>
                    <Text fontSize="xl" fontWeight="700" color="whiteAlpha.600">
                      USDC
                    </Text>
                  </HStack>
                   <Text fontSize="xs" color="whiteAlpha.500">
                    (Requires ~{xlmRequired} XLM test tokens to simulate)
                  </Text>
                </VStack>
              </Box>

              {/* Action Button */}
              <Button
                colorScheme="brand"
                size="lg"
                w="full"
                h="64px"
                fontSize="lg"
                fontWeight="800"
                onClick={handleClaim}
                isLoading={isLoading}
                loadingText="Processing Deposit..."
                isDisabled={!depositAmount || parseFloat(depositAmount) <= 0}
                leftIcon={<FaUniversity />}
                boxShadow="glow"
                _hover={{
                  transform: 'translateY(-2px)',
                  boxShadow: '0 0 42px rgba(6, 182, 212, 0.42)',
                }}
                transition="all 0.3s"
              >
                Deposit AED Cash
              </Button>

              <Text fontSize="xs" color="whiteAlpha.600" textAlign="center">
                ⚡ Funds are tokenized and deposited instantly on Stellar
              </Text>
            </VStack>
          </Box>
        </VStack>
      </Container>
    </Box>
  );
};
