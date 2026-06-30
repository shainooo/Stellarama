import {
  Box,
  Button,
  Container,
  Heading,
  Text,
  VStack,
  SimpleGrid,
  Icon,
  HStack,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { FaRocket, FaDollarSign, FaClock, FaShieldAlt, FaBolt, FaGlobe, FaArrowRight } from 'react-icons/fa';

const glassCard = {
  bg: 'rgba(255, 255, 255, 0.05)',
  border: '1px solid',
  borderColor: 'whiteAlpha.200',
  boxShadow: 'glass',
  backdropFilter: 'blur(22px)',
  transition: 'transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease',
  _hover: {
    transform: 'translateY(-4px)',
    borderColor: 'secondary.300',
    boxShadow: '0 30px 90px rgba(6, 182, 212, 0.18)',
  },
};

export const Landing = () => {
  const navigate = useNavigate();

  return (
    <Box
      minH="calc(100vh - 72px)"
      color="white"
      bg="#030712"
      overflow="hidden"
      sx={{ animation: 'page-in 0.45s ease both' }}
    >
      <Box
        position="relative"
        py={{ base: 16, md: 24, lg: 28 }}
        _before={{
          content: '""',
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(120deg, rgba(139, 92, 246, 0.28), rgba(6, 182, 212, 0.16), rgba(236, 72, 153, 0.22))',
          backgroundSize: '220% 220%',
          animation: 'gradient-shift 12s ease infinite',
          opacity: 0.9,
        }}
      >
        <Box
          position="absolute"
          top={{ base: '6%', md: '14%' }}
          left={{ base: '-110px', md: '5%' }}
          w={{ base: '260px', md: '420px' }}
          h={{ base: '260px', md: '420px' }}
          borderRadius="full"
          bg="rgba(139, 92, 246, 0.32)"
          filter="blur(90px)"
          sx={{ animation: 'float 7s ease-in-out infinite' }}
        />
        <Box
          position="absolute"
          right={{ base: '-120px', md: '8%' }}
          bottom={{ base: '4%', md: '10%' }}
          w={{ base: '260px', md: '380px' }}
          h={{ base: '260px', md: '380px' }}
          borderRadius="full"
          bg="rgba(6, 182, 212, 0.25)"
          filter="blur(90px)"
          sx={{ animation: 'float 9s ease-in-out infinite 1s' }}
        />

        <Container maxW="container.xl" position="relative" zIndex={1}>
          <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={{ base: 12, lg: 16 }} alignItems="center">
            <VStack align={{ base: 'center', lg: 'start' }} spacing={7} textAlign={{ base: 'center', lg: 'left' }}>
              <HStack
                spacing={3}
                px={4}
                py={2}
                borderRadius="full"
                bg="whiteAlpha.100"
                border="1px solid"
                borderColor="whiteAlpha.300"
                boxShadow="0 0 30px rgba(139, 92, 246, 0.24)"
              >
                <Box w={2} h={2} borderRadius="full" bg="secondary.300" boxShadow="0 0 14px #06B6D4" />
                <Text fontSize="xs" fontWeight="800" letterSpacing="0.14em" textTransform="uppercase" color="secondary.100">
                  Powered by Stellar blockchain
                </Text>
              </HStack>

              <Heading
                as="h1"
                fontSize={{ base: '4xl', md: '6xl', xl: '7xl' }}
                lineHeight="0.95"
                maxW="760px"
              >
                Cross-border money,
                <Text
                  as="span"
                  display="block"
                  bgGradient="linear(to-r, brand.200, secondary.200, accent.300)"
                  bgClip="text"
                >
                  moving at light speed.
                </Text>
              </Heading>

              <Text fontSize={{ base: 'lg', md: 'xl' }} color="whiteAlpha.800" lineHeight="1.8" maxW="640px">
                Stellarama blends Stellar settlement, MoneyGram rails, and a premium wallet experience so Gulf workers can send USDC to India with transparent 0.5% fees.
              </Text>

              <HStack spacing={4} flexWrap="wrap" justify={{ base: 'center', lg: 'start' }}>
                <Button
                  size="lg"
                  colorScheme="brand"
                  rightIcon={<FaArrowRight />}
                  onClick={() => navigate('/send')}
                  px={9}
                >
                  Send Money
                </Button>
                <Button size="lg" variant="outline" onClick={() => navigate('/docs')} px={9}>
                  Explore Docs
                </Button>
              </HStack>

              <Text fontSize="sm" color="whiteAlpha.600">
                No signup required. Connect Freighter and start on testnet.
              </Text>
            </VStack>

            <Box
              position="relative"
              minH={{ base: '420px', md: '500px' }}
              {...glassCard}
              borderRadius="3xl"
              p={{ base: 5, md: 8 }}
            >
              <Box
                position="absolute"
                inset={4}
                borderRadius="3xl"
                border="1px solid"
                borderColor="whiteAlpha.200"
              />
              <Box
                position="absolute"
                top="18%"
                left="50%"
                transform="translateX(-50%)"
                w={{ base: '190px', md: '260px' }}
                h={{ base: '190px', md: '260px' }}
                borderRadius="full"
                bgGradient="conic-gradient(from 120deg, #8B5CF6, #06B6D4, #EC4899, #8B5CF6)"
                filter="blur(1px)"
                opacity={0.82}
                sx={{ animation: 'orbit-glow 16s linear infinite' }}
              />
              <VStack position="relative" zIndex={1} h="full" justify="space-between" spacing={6}>
                <Box w="full" textAlign="left">
                  <Text fontSize="sm" color="whiteAlpha.600" mb={2}>
                    Live remittance corridor
                  </Text>
                  <Heading size="lg">UAE to India</Heading>
                </Box>

                <SimpleGrid columns={2} spacing={4} w="full">
                  {[
                    { label: 'Settlement', value: '~5 sec' },
                    { label: 'Platform fee', value: '0.5%' },
                    { label: 'Availability', value: '24/7' },
                    { label: 'Network', value: 'Stellar' },
                  ].map((item) => (
                    <Box key={item.label} {...glassCard} borderRadius="2xl" p={5}>
                      <Text fontSize="xs" color="whiteAlpha.600" mb={2} textTransform="uppercase" fontWeight="800">
                        {item.label}
                      </Text>
                      <Text fontSize={{ base: 'xl', md: '2xl' }} fontWeight="900">
                        {item.value}
                      </Text>
                    </Box>
                  ))}
                </SimpleGrid>

                <Box
                  w="full"
                  p={5}
                  borderRadius="2xl"
                  bg="linear-gradient(135deg, rgba(139, 92, 246, 0.28), rgba(6, 182, 212, 0.18))"
                  border="1px solid"
                  borderColor="whiteAlpha.300"
                >
                  <HStack justify="space-between">
                    <Box>
                      <Text fontSize="xs" color="whiteAlpha.600" fontWeight="800" textTransform="uppercase">
                        Recipient receives
                      </Text>
                      <Text fontSize="3xl" fontWeight="900">
                        INR instantly
                      </Text>
                    </Box>
                    <Icon as={FaBolt} boxSize={8} color="secondary.200" />
                  </HStack>
                </Box>
              </VStack>
            </Box>
          </SimpleGrid>
        </Container>
      </Box>

      <Container maxW="container.xl" py={{ base: 16, md: 24 }}>
        <VStack spacing={4} mb={12} textAlign="center">
          <Text color="secondary.200" fontWeight="900" letterSpacing="0.16em" textTransform="uppercase" fontSize="xs">
            Why Stellarama
          </Text>
          <Heading size={{ base: 'xl', md: '2xl' }}>A premium remittance layer on Stellar</Heading>
          <Text fontSize="lg" color="whiteAlpha.700" maxW="2xl">
            Built for migrant workers who deserve fast settlement, transparent pricing, and verifiable on-chain receipts.
          </Text>
        </VStack>

        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
          {[
            {
              icon: FaRocket,
              title: 'Lightning Fast',
              description: 'Transactions settle in seconds on Stellar, so families are not waiting days for support.',
              color: 'brand.300',
            },
            {
              icon: FaDollarSign,
              title: 'Transparent Fees',
              description: 'A clear 0.5% platform fee replaces opaque markups and expensive legacy remittance costs.',
              color: 'secondary.300',
            },
            {
              icon: FaShieldAlt,
              title: 'Secure by Design',
              description: 'Wallet authentication, blockchain settlement, and smart-contract escrow keep the flow auditable.',
              color: 'accent.300',
            },
            {
              icon: FaClock,
              title: 'Always Online',
              description: 'Operate beyond banking hours with a self-service wallet experience that works on mobile.',
              color: 'brand.300',
            },
            {
              icon: FaBolt,
              title: 'Real-Time Rates',
              description: 'DEX quotes show estimated output before sending, reducing surprises at the point of transfer.',
              color: 'secondary.300',
            },
            {
              icon: FaGlobe,
              title: 'Borderless Flow',
              description: 'A corridor-first interface designed for UAE to India today, with room to scale globally.',
              color: 'accent.300',
            },
          ].map((feature) => (
            <Box
              key={feature.title}
              {...glassCard}
              p={7}
              borderRadius="3xl"
              transition="all 0.25s ease"
              _hover={{
                transform: 'translateY(-6px)',
                borderColor: feature.color,
                boxShadow: '0 28px 90px rgba(139, 92, 246, 0.26)',
              }}
            >
              <Box
                w={12}
                h={12}
                borderRadius="2xl"
                display="grid"
                placeItems="center"
                bg="whiteAlpha.100"
                mb={5}
                boxShadow="inset 0 0 20px rgba(255,255,255,0.06)"
              >
                <Icon as={feature.icon} boxSize={5} color={feature.color} />
              </Box>
              <Heading size="md" mb={3}>
                {feature.title}
              </Heading>
              <Text color="whiteAlpha.700" lineHeight="1.8">
                {feature.description}
              </Text>
            </Box>
          ))}
        </SimpleGrid>
      </Container>

      <Box py={{ base: 16, md: 20 }} bg="rgba(255, 255, 255, 0.02)">
        <Container maxW="container.lg">
          <VStack spacing={8} textAlign="center">
            <Heading size={{ base: 'xl', md: '2xl' }}>See how much stays with your family</Heading>
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={5} w="full">
              {[
                { label: 'Western Union', value: '5-7%', note: 'Fee on INR 10,000 = INR 500-700' },
                { label: 'Bank Transfer', value: '2-3 days', note: 'Plus 3-4% in fees' },
                { label: 'Stellarama', value: '0.5%', note: 'Fee on INR 10,000 = INR 50 only' },
              ].map((item, index) => (
                <Box
                  key={item.label}
                  {...glassCard}
                  p={7}
                  borderRadius="3xl"
                  borderColor={index === 2 ? 'secondary.300' : 'whiteAlpha.200'}
                  boxShadow={index === 2 ? 'cyan' : 'glass'}
                >
                  <Text fontSize="xs" fontWeight="900" color="whiteAlpha.600" textTransform="uppercase" mb={3}>
                    {item.label}
                  </Text>
                  <Text
                    fontSize="4xl"
                    fontWeight="900"
                    color={index === 2 ? 'secondary.200' : index === 0 ? 'accent.200' : 'brand.200'}
                    mb={3}
                  >
                    {item.value}
                  </Text>
                  <Text color="whiteAlpha.700" fontSize="sm">
                    {item.note}
                  </Text>
                </Box>
              ))}
            </SimpleGrid>
          </VStack>
        </Container>
      </Box>

      <Container maxW="container.xl" py={{ base: 16, md: 24 }}>
        <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={8}>
          {[
            {
              num: '01',
              title: 'Connect Wallet',
              description: 'Install Freighter and connect to Stellarama in seconds.',
            },
            {
              num: '02',
              title: 'Enter Amount',
              description: 'Enter USDC amount and recipient address while rates update in real time.',
            },
            {
              num: '03',
              title: 'Send Money',
              description: 'Confirm in wallet and settle through Stellar path payments.',
            },
          ].map((step) => (
            <Box key={step.num} {...glassCard} borderRadius="3xl" p={8}>
              <Text fontSize="sm" color="secondary.200" fontWeight="900" mb={5}>
                {step.num}
              </Text>
              <Heading size="lg" mb={4}>
                {step.title}
              </Heading>
              <Text color="whiteAlpha.700" lineHeight="1.8">
                {step.description}
              </Text>
            </Box>
          ))}
        </SimpleGrid>
      </Container>

      <Box py={{ base: 16, md: 20 }} position="relative">
        <Container maxW="container.lg">
          <VStack
            {...glassCard}
            spacing={6}
            borderRadius="3xl"
            p={{ base: 8, md: 12 }}
            textAlign="center"
            bg="linear-gradient(135deg, rgba(139, 92, 246, 0.18), rgba(6, 182, 212, 0.12))"
          >
            <Heading size={{ base: 'xl', md: '2xl' }}>Ready to send money home?</Heading>
            <Text fontSize="lg" color="whiteAlpha.700" maxW="2xl">
              Connect your wallet and experience the Stellar-powered remittance flow.
            </Text>
            <Button size="lg" colorScheme="brand" rightIcon={<FaArrowRight />} onClick={() => navigate('/send')}>
              Get Started
            </Button>
          </VStack>
        </Container>
      </Box>
    </Box>
  );
};
