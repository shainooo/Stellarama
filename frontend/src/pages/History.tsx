import {
  Box,
  Container,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Tag,
  Link as ChakraLink,
  Alert,
  AlertIcon,
  Text,
  Spinner,
  VStack,
  HStack,
  Badge,
  IconButton,
  Tooltip,
  Flex,
  Divider,
  SimpleGrid,
  useToast,
} from '@chakra-ui/react';
import { useWallet } from '../hooks/useWallet';
import { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import { FaDownload } from 'react-icons/fa';
import { createAccountEventPoller, type Transaction } from '../services/events';

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

export const History = () => {
  const { wallet } = useWallet();
  const toast = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);

  useEffect(() => {
    if (!wallet) {
      setTransactions([]);
      setIsLoading(false);
      setIsSyncing(false);
      setLastSyncedAt(null);
      return;
    }

    setIsLoading(true);

    const poller = createAccountEventPoller({
      publicKey: wallet.publicKey,
      intervalMs: 10000,
      onSyncStart: () => setIsSyncing(true),
      onSyncEnd: () => {
        setIsLoading(false);
        setIsSyncing(false);
        setLastSyncedAt(new Date());
      },
      onTransactions: setTransactions,
      onNewTransactions: (newTransactions) => {
        toast({
          title: 'New Stellar activity detected',
          description: `${newTransactions.length} new transaction${newTransactions.length > 1 ? 's' : ''} synced to history.`,
          status: 'info',
          duration: 5000,
          isClosable: true,
        });
      },
      onError: (error) => {
        console.error('Error syncing transaction history:', error);
        toast({
          title: 'History sync failed',
          description: 'Could not refresh Stellar operations. Retrying automatically.',
          status: 'warning',
          duration: 4000,
          isClosable: true,
        });
      },
    });

    return () => poller.stop();
  }, [wallet, toast]);

  const downloadReceipt = (tx: Transaction) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(44, 82, 130); // brand color blue
    doc.text('STELLARAMA', 105, 20, { align: 'center' });
    
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text('Remittance Receipt', 105, 30, { align: 'center' });
    
    // Separator
    doc.setLineWidth(0.5);
    doc.line(20, 35, 190, 35);
    
    // Content
    doc.setFontSize(12);
    let y = 50;
    
    const addRow = (label: string, value: string) => {
      doc.setFont('helvetica', 'bold');
      doc.text(label, 20, y);
      doc.setFont('helvetica', 'normal');
      doc.text(value, 70, y);
      y += 10;
    };
    
    addRow('Transaction ID:', tx.id);
    addRow('Date:', new Date(tx.created_at).toLocaleString());
    addRow('Type:', tx.type);
    addRow('Amount:', `${parseFloat(tx.amount).toFixed(2)} ${tx.asset_code}`);
    addRow('Sender:', tx.from);
    addRow('Recipient:', tx.to);
    addRow('Status:', 'Completed');
    addRow('Network:', 'Stellar Testnet');

    // Footer
    doc.setFontSize(10);
    doc.setTextColor(128, 128, 128);
    doc.text('This is a verifiable receipt from the Stellarama Platform.', 105, 280, { align: 'center' });
    
    doc.save(`Stellarama_Receipt_${tx.id.slice(0, 8)}.pdf`);
  };

  if (!wallet) {
    return (
      <Container maxW="container.lg" py={10} color="white">
        <Alert status="warning">
          <AlertIcon />
          Please connect your Freighter wallet to view transaction history
        </Alert>
      </Container>
    );
  }

  return (
    <Box
      minH="calc(100vh - 80px)"
      bg="#030712"
      py={10}
      sx={{ animation: 'page-in 0.45s ease both' }}
    >
    <Container maxW="container.lg">
      <VStack align="stretch" spacing={6}>
      <Box>
        <Flex gap={4} align={{ base: 'start', md: 'center' }} justify="space-between" direction={{ base: 'column', md: 'row' }}>
          <Box>
            <Heading
              bgGradient="linear(to-r, brand.200, secondary.200, accent.300)"
              bgClip="text"
              mb={2}
            >
              Transaction History
            </Heading>
            <Text color="whiteAlpha.700">Verifiable Stellar activity and downloadable remittance receipts.</Text>
          </Box>
          <HStack spacing={3}>
            <Badge colorScheme={isSyncing ? 'cyan' : 'purple'} borderRadius="full" px={3} py={1}>
              {isSyncing ? 'Syncing...' : 'Live polling'}
            </Badge>
            {isSyncing && <Spinner size="sm" color="secondary.300" />}
          </HStack>
        </Flex>
        <Text mt={3} fontSize="sm" color="whiteAlpha.500">
          Updates every 10 seconds{lastSyncedAt ? ` • Last synced ${lastSyncedAt.toLocaleTimeString()}` : ''}
        </Text>
      </Box>

      {isLoading ? (
        <VStack spacing={4} py={8}>
          <Spinner size="xl" color="secondary.300" />
          <Text color="whiteAlpha.600">Loading your transactions...</Text>
        </VStack>
      ) : transactions.length === 0 ? (
        <Box {...glassCard} p={8} borderRadius="2xl" textAlign="center">
          <Text fontSize="lg" color="whiteAlpha.800">
            No transactions yet
          </Text>
          <Text fontSize="sm" color="whiteAlpha.500" mt={2}>
            Your transaction history will appear here after you send money
          </Text>
        </Box>
      ) : (
        <Box>
          {/* Desktop Table View */}
          <Box display={{ base: 'none', md: 'block' }} {...glassCard} borderRadius="2xl" overflow="hidden">
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th color="whiteAlpha.600">Date</Th>
                  <Th color="whiteAlpha.600">Type</Th>
                  <Th color="whiteAlpha.600">Amount</Th>
                  <Th color="whiteAlpha.600">From/To</Th>
                  <Th color="whiteAlpha.600">TX Hash</Th>
                  <Th color="whiteAlpha.600">Receipt</Th>
                </Tr>
              </Thead>
              <Tbody>
                {transactions.map((tx) => (
                  <Tr key={tx.id}>
                    <Td>{new Date(tx.created_at).toLocaleDateString()}</Td>
                    <Td>
                      <Tag 
                        colorScheme={
                          tx.type === 'Receive' ? 'green' : 
                          tx.type === 'Send' ? 'orange' :
                          tx.type === 'Swap' ? 'blue' : 'gray'
                        } 
                        size="sm"
                      >
                        {tx.type}
                      </Tag>
                    </Td>
                    <Td>{parseFloat(tx.amount).toFixed(2)} {tx.asset_code}</Td>
                    <Td>
                      <Text fontSize="xs" fontFamily="mono">
                        {tx.from === wallet.publicKey 
                          ? `→ ${tx.to.slice(0, 8)}...`
                          : `← ${tx.from.slice(0, 8)}...`
                        }
                      </Text>
                    </Td>
                    <Td>
                      <ChakraLink
                        href={`https://stellar.expert/explorer/testnet/tx/${tx.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        color="secondary.200"
                        fontSize="sm"
                      >
                        {tx.id.slice(0, 8)}...
                      </ChakraLink>
                    </Td>
                    <Td>
                      <Tooltip label="Download PDF Receipt">
                        <IconButton
                          aria-label="Download Receipt"
                          icon={<FaDownload />}
                          size="sm"
                          colorScheme="brand"
                          variant="ghost"
                          onClick={() => downloadReceipt(tx)}
                        />
                      </Tooltip>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>

          {/* Mobile Card View */}
          <VStack display={{ base: 'flex', md: 'none' }} spacing={4} align="stretch">
            {transactions.map((tx) => (
              <Box key={tx.id} {...glassCard} p={4} borderRadius="2xl">
                <Flex justify="space-between" align="start" mb={2}>
                  <VStack align="start" spacing={1}>
                    <Text fontSize="xs" color="whiteAlpha.600">{new Date(tx.created_at).toLocaleString()}</Text>
                    <Tag 
                      colorScheme={
                        tx.type === 'Receive' ? 'green' : 
                        tx.type === 'Send' ? 'orange' :
                        tx.type === 'Swap' ? 'blue' : 'gray'
                      } 
                      size="sm"
                    >
                      {tx.type}
                    </Tag>
                  </VStack>
                  <Tooltip label="Download PDF Receipt">
                    <IconButton
                      aria-label="Download Receipt"
                      icon={<FaDownload />}
                      size="sm"
                      colorScheme="brand"
                      variant="ghost"
                      onClick={() => downloadReceipt(tx)}
                    />
                  </Tooltip>
                </Flex>
                
                <Divider my={2} borderColor="whiteAlpha.200" />
                
                <SimpleGrid columns={2} spacing={2} fontSize="sm">
                  <Text color="whiteAlpha.600">Amount:</Text>
                  <Text fontWeight="bold">{parseFloat(tx.amount).toFixed(2)} {tx.asset_code}</Text>
                  
                  <Text color="whiteAlpha.600">{tx.type === 'Receive' ? 'From:' : 'To:'}</Text>
                  <Text fontFamily="mono" fontSize="xs" isTruncated>
                    {tx.type === 'Receive' ? tx.from : tx.to}
                  </Text>
                  
                  <Text color="whiteAlpha.600">TX Hash:</Text>
                  <ChakraLink
                    href={`https://stellar.expert/explorer/testnet/tx/${tx.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    color="secondary.200"
                    fontSize="xs"
                    isTruncated
                  >
                    {tx.id}
                  </ChakraLink>
                </SimpleGrid>
              </Box>
            ))}
          </VStack>
        </Box>
      )}
      </VStack>
    </Container>
    </Box>
  );
};
