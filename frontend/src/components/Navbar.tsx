import {
  Box,
  Flex,
  Button,
  HStack,
  Text,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
  VStack,
  useDisclosure,
} from '@chakra-ui/react';
import { Link } from 'react-router-dom';
import { FaWallet, FaChevronDown, FaSignOutAlt, FaCopy, FaBars, FaTimes } from 'react-icons/fa';
import { useWallet } from '../hooks/useWallet';
import { BalanceBar } from './BalanceBar';

const navItems = [
  { label: 'Bank Deposit', to: '/faucet' },
  { label: 'Send Money', to: '/send' },
  { label: 'Transactions', to: '/history' },
  { label: 'Documentation', to: '/docs' },
];

export const Navbar = () => {
  const { wallet, connect, disconnect } = useWallet();
  const { isOpen, onToggle, onClose } = useDisclosure();

  const copyAddress = () => {
    if (wallet?.publicKey) {
      navigator.clipboard.writeText(wallet.publicKey);
    }
  };

  return (
    <Box
      as="header"
      position="sticky"
      top={0}
      zIndex={20}
      px={{ base: 4, md: 8 }}
      py={4}
      bg="rgba(3, 7, 18, 0.76)"
      borderBottom="1px solid"
      borderColor="whiteAlpha.200"
      backdropFilter="blur(22px)"
      boxShadow="0 18px 60px rgba(0, 0, 0, 0.35)"
    >
      <Flex justify="space-between" align="center" maxW="container.xl" mx="auto" gap={4}>
        <HStack spacing={{ base: 3, lg: 8 }} minW={0}>
          <HStack
            as={Link}
            to="/"
            spacing={3}
            cursor="pointer"
            aria-label="Stellarama home"
            flexShrink={0}
          >
            <Box
              w={9}
              h={9}
              borderRadius="full"
              bgGradient="linear(135deg, brand.500, secondary.400, accent.500)"
              boxShadow="0 0 28px rgba(139, 92, 246, 0.55)"
              sx={{ animation: 'neon-breathe 4s ease-in-out infinite' }}
            />
            <Text
              fontSize={{ base: 'xl', md: '2xl' }}
              fontWeight="900"
              bgGradient="linear(to-r, white, secondary.200, brand.200)"
              bgClip="text"
            >
              Stellarama
            </Text>
          </HStack>

          <HStack spacing={1} display={{ base: 'none', lg: 'flex' }}>
            {navItems.map((item) => (
              <Button
                key={item.to}
                as={Link}
                to={item.to}
                variant="ghost"
                size="sm"
                borderRadius="full"
                color="whiteAlpha.800"
              _hover={{ color: 'white', bg: 'whiteAlpha.100' }}
                transition="all 0.2s ease"
                _focusVisible={{ boxShadow: '0 0 0 3px rgba(6, 182, 212, 0.45)' }}
              >
                {item.label}
              </Button>
            ))}
          </HStack>
        </HStack>

        <HStack spacing={3}>
          {wallet && (
            <Box display={{ base: 'none', xl: 'block' }}>
              <BalanceBar />
            </Box>
          )}

          {!wallet ? (
            <Button
              colorScheme="brand"
              size={{ base: 'sm', md: 'md' }}
              leftIcon={<FaWallet />}
              onClick={connect}
              px={{ base: 4, md: 6 }}
            >
              Connect
            </Button>
          ) : (
            <Menu>
              <MenuButton
                as={Button}
                variant="outline"
                rightIcon={<FaChevronDown size={12} />}
                leftIcon={<Box w={2} h={2} bg="secondary.300" borderRadius="full" boxShadow="0 0 12px #06B6D4" />}
                size={{ base: 'sm', md: 'md' }}
              >
                <Text fontSize="sm" fontFamily="monospace" fontWeight="800">
                  {wallet.publicKey.slice(0, 4)}...{wallet.publicKey.slice(-4)}
                </Text>
              </MenuButton>
              <MenuList>
                <MenuItem icon={<FaCopy />} onClick={copyAddress}>
                  Copy Address
                </MenuItem>
                <MenuItem icon={<FaSignOutAlt />} onClick={disconnect} color="accent.200">
                  Disconnect
                </MenuItem>
              </MenuList>
            </Menu>
          )}

          <IconButton
            display={{ base: 'inline-flex', lg: 'none' }}
            aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
            icon={isOpen ? <FaTimes /> : <FaBars />}
            variant="outline"
            size="sm"
            onClick={onToggle}
          />
        </HStack>
      </Flex>

      {isOpen && (
        <VStack
          display={{ base: 'flex', lg: 'none' }}
          align="stretch"
          spacing={2}
          mt={4}
          p={4}
          borderRadius="2xl"
          bg="rgba(255, 255, 255, 0.06)"
          border="1px solid"
          borderColor="whiteAlpha.200"
          position="relative"
          overflow="hidden"
          _before={{
            content: '""',
            position: 'absolute',
            top: 0,
            bottom: 0,
            width: '60%',
            left: 0,
            bg: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.10), transparent)',
            animation: 'shimmer-line 3.8s ease-in-out infinite',
          }}
        >
          {navItems.map((item) => (
            <Button
              key={item.to}
              as={Link}
              to={item.to}
              variant="ghost"
              justifyContent="flex-start"
              onClick={onClose}
            >
              {item.label}
            </Button>
          ))}
        </VStack>
      )}
    </Box>
  );
};
