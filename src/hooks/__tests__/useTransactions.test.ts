import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import {
  useCreateTransaction,
  useUpdateTransaction,
  useDeleteTransaction,
  transactionKeys,
} from '../useTransactions';
import { accountKeys } from '../useAccounts';

// ── Mocks ───────────────────────────────────────────────────

const mockUser = { id: 'user-123' };
const mockShowError = vi.fn();

vi.mock('@/providers/AuthProvider', () => ({
  useAuth: () => ({ user: mockUser }),
}));

vi.mock('@/providers/ToastProvider', () => ({
  useToast: () => ({ showError: mockShowError, showSuccess: vi.fn(), dismiss: vi.fn() }),
}));

let mockRpcResult: { data: unknown; error: unknown } = { data: null, error: null };

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    rpc: vi.fn().mockImplementation(() => Promise.resolve(mockRpcResult)),
  }),
}));

// ── Helpers ─────────────────────────────────────────────────

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return {
    queryClient,
    wrapper: ({ children }: { children: ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children),
  };
}

const baseInput = {
  type: 'expense' as const,
  account_id: 'acc-1',
  amount: 50000,
  date: '2024-06-15',
};

const mockTransaction = {
  id: 'tx-1',
  user_id: 'user-123',
  account_id: 'acc-1',
  destination_account_id: null,
  category_id: 'cat-1',
  type: 'expense',
  amount: 50000,
  note: null,
  date: '2024-06-15',
  created_at: '2024-06-15T00:00:00Z',
  updated_at: '2024-06-15T00:00:00Z',
};

// ── Tests ───────────────────────────────────────────────────

describe('useCreateTransaction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates transaction and invalidates transaction, account, and budget queries', async () => {
    mockRpcResult = { data: mockTransaction, error: null };

    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useCreateTransaction(), { wrapper });

    await act(async () => {
      result.current.mutate({ ...baseInput, category_id: 'cat-1' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: transactionKeys.all });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: accountKeys.all });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['budgets'] });
  });

  it('shows error toast with retry on failure', async () => {
    mockRpcResult = { data: null, error: { message: 'RPC error' } };

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCreateTransaction(), { wrapper });

    await act(async () => {
      result.current.mutate(baseInput);
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(mockShowError).toHaveBeenCalledWith(
      'Gagal menyimpan transaksi. Silakan coba lagi.',
      expect.any(Function)
    );
  });

  it('handles transfer type with destination account', async () => {
    const transferTx = {
      ...mockTransaction,
      type: 'transfer',
      destination_account_id: 'acc-2',
    };
    mockRpcResult = { data: transferTx, error: null };

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCreateTransaction(), { wrapper });

    await act(async () => {
      result.current.mutate({
        type: 'transfer',
        account_id: 'acc-1',
        destination_account_id: 'acc-2',
        amount: 100000,
        date: '2024-06-15',
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});

describe('useUpdateTransaction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('updates transaction and invalidates all related queries', async () => {
    const updatedTx = { ...mockTransaction, amount: 75000 };
    mockRpcResult = { data: updatedTx, error: null };

    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useUpdateTransaction(), { wrapper });

    await act(async () => {
      result.current.mutate({
        id: 'tx-1',
        ...baseInput,
        amount: 75000,
        category_id: 'cat-1',
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: transactionKeys.all });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: accountKeys.all });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['budgets'] });
  });

  it('shows error toast with retry on update failure', async () => {
    mockRpcResult = { data: null, error: { message: 'Update failed' } };

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useUpdateTransaction(), { wrapper });

    await act(async () => {
      result.current.mutate({ id: 'tx-1', ...baseInput });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(mockShowError).toHaveBeenCalledWith(
      'Gagal memperbarui transaksi. Silakan coba lagi.',
      expect.any(Function)
    );
  });
});

describe('useDeleteTransaction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deletes transaction and invalidates all related queries', async () => {
    mockRpcResult = { data: mockTransaction, error: null };

    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useDeleteTransaction(), { wrapper });

    await act(async () => {
      result.current.mutate('tx-1');
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: transactionKeys.all });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: accountKeys.all });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['budgets'] });
  });

  it('shows error toast with retry on delete failure', async () => {
    mockRpcResult = { data: null, error: { message: 'Delete failed' } };

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useDeleteTransaction(), { wrapper });

    await act(async () => {
      result.current.mutate('tx-1');
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(mockShowError).toHaveBeenCalledWith(
      'Gagal menghapus transaksi. Silakan coba lagi.',
      expect.any(Function)
    );
  });
});

describe('transactionKeys', () => {
  it('generates correct query keys', () => {
    expect(transactionKeys.all).toEqual(['transactions']);
    expect(transactionKeys.list('u1', { type: 'expense' })).toEqual([
      'transactions', 'list', 'u1', { type: 'expense' },
    ]);
    expect(transactionKeys.detail('u1', 'tx-1')).toEqual([
      'transactions', 'detail', 'u1', 'tx-1',
    ]);
  });
});
