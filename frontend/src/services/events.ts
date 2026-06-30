import * as StellarSdk from 'stellar-sdk';

const HORIZON_URL = import.meta.env.VITE_HORIZON_URL || 'https://horizon-testnet.stellar.org';
const POLL_INTERVAL_MS = 10_000;
const TRANSACTION_EVENT = 'stellarama:transactions-updated';

const server = new StellarSdk.Horizon.Server(HORIZON_URL);

export interface Transaction {
  id: string;
  operationId: string;
  created_at: string;
  type: string;
  from: string;
  to: string;
  amount: string;
  asset_code: string;
}

export interface AccountBalances {
  xlm: string;
  usdc: string;
  inr: string;
}

export interface TransactionUpdateEvent {
  publicKey: string;
  transactions: Transaction[];
}

interface AccountPollerOptions {
  publicKey: string;
  intervalMs?: number;
  onSyncStart?: () => void;
  onSyncEnd?: () => void;
  onTransactions?: (transactions: Transaction[]) => void;
  onNewTransactions?: (transactions: Transaction[]) => void;
  onError?: (error: unknown) => void;
}

const isPaymentOperation = (operation: any): boolean =>
  operation.type === 'payment' ||
  operation.type === 'path_payment_strict_send' ||
  operation.type === 'path_payment_strict_receive';

const getOperationAmount = (operation: any): string =>
  operation.amount || operation.source_amount || operation.destination_amount || '0';

const getOperationAssetCode = (operation: any): string =>
  operation.asset_code ||
  operation.source_asset_code ||
  operation.destination_asset_code ||
  'XLM';

const mapOperationToTransaction = (operation: any, publicKey: string): Transaction => {
  const from = operation.from || operation.source_account;
  const to = operation.to || operation.destination;
  const isPathPayment = operation.type.includes('path_payment');

  let type = 'Payment';

  if (isPathPayment) {
    if (from === publicKey && to === publicKey) {
      type = 'Swap';
    } else if (from === publicKey && to !== publicKey) {
      type = 'Send';
    } else if (to === publicKey && from !== publicKey) {
      type = 'Receive';
    }
  } else if (to === publicKey && from !== publicKey) {
    type = 'Receive';
  } else if (from === publicKey && to !== publicKey) {
    type = 'Send';
  }

  return {
    id: operation.transaction_hash,
    operationId: operation.id,
    created_at: operation.created_at,
    type,
    from,
    to,
    amount: getOperationAmount(operation),
    asset_code: getOperationAssetCode(operation),
  };
};

export const fetchAccountTransactions = async (
  publicKey: string,
  limit = 20
): Promise<Transaction[]> => {
  const operations = await server
    .operations()
    .forAccount(publicKey)
    .order('desc')
    .limit(limit)
    .call();

  return operations.records
    .filter(isPaymentOperation)
    .map((operation: any) => mapOperationToTransaction(operation, publicKey));
};

export const fetchAccountBalances = async (publicKey: string): Promise<AccountBalances> => {
  const account = await server.loadAccount(publicKey);
  const balances: AccountBalances = { xlm: '0', usdc: '0', inr: '0' };

  account.balances.forEach((balance: any) => {
    if (balance.asset_type === 'native') {
      balances.xlm = parseFloat(balance.balance).toFixed(2);
      return;
    }

    if (balance.asset_code === 'USDC') {
      balances.usdc = parseFloat(balance.balance).toFixed(2);
    } else if (balance.asset_code === 'INR') {
      balances.inr = parseFloat(balance.balance).toFixed(2);
    }
  });

  return balances;
};

export const notifyTransactionUpdate = (
  publicKey: string,
  transactions: Transaction[]
) => {
  window.dispatchEvent(
    new CustomEvent<TransactionUpdateEvent>(TRANSACTION_EVENT, {
      detail: { publicKey, transactions },
    })
  );
};

export const addTransactionUpdateListener = (
  listener: (event: TransactionUpdateEvent) => void
) => {
  const handler = (event: Event) => {
    listener((event as CustomEvent<TransactionUpdateEvent>).detail);
  };

  window.addEventListener(TRANSACTION_EVENT, handler);
  return () => window.removeEventListener(TRANSACTION_EVENT, handler);
};

export const createAccountEventPoller = ({
  publicKey,
  intervalMs = POLL_INTERVAL_MS,
  onSyncStart,
  onSyncEnd,
  onTransactions,
  onNewTransactions,
  onError,
}: AccountPollerOptions) => {
  let isStopped = false;
  let isFirstSync = true;
  let knownOperationIds = new Set<string>();
  let timeoutId: number | undefined;

  const poll = async () => {
    if (isStopped) return;

    onSyncStart?.();

    try {
      const transactions = await fetchAccountTransactions(publicKey);
      const nextOperationIds = new Set(transactions.map((tx) => tx.operationId));
      const newTransactions = transactions.filter((tx) => !knownOperationIds.has(tx.operationId));

      onTransactions?.(transactions);

      if (!isFirstSync && newTransactions.length > 0) {
        onNewTransactions?.(newTransactions);
        notifyTransactionUpdate(publicKey, newTransactions);
      }

      knownOperationIds = nextOperationIds;
      isFirstSync = false;
    } catch (error) {
      onError?.(error);
    } finally {
      onSyncEnd?.();
      if (!isStopped) {
        timeoutId = window.setTimeout(poll, intervalMs);
      }
    }
  };

  poll();

  return {
    stop: () => {
      isStopped = true;
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    },
  };
};
