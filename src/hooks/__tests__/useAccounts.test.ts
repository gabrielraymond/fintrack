import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import {
  useAccounts,
  useSoftDeletedAccounts,
  useCreateAccount,
  useUpdateAccount,
  useSoftDeleteAccount,
  useReactivateAccount,
  accountKeys,
} from '../useAccounts';
import type { Account } from '@/types';

// ── Mocks ───────────────────────────────────────────────────

const mockUser = { id: 'user-123' };
const mockShowError = vi.fn();

vi.mock('@/providers/AuthProvider', () => ({
  useAuth: () => ({ user: mockUser }),
}));

vi.mock('@/providers/ToastProvider', () => ({
  useToast: () => ({ showError: mockShowError, showSuccess: vi.fn(), dismiss: vi.fn() }),
}));

// Supabase mock builder
function createSupabaseMock(overrides: Record<string, unknown> = {}) {
  const chain: Record<string, unknown> = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    ...overrides,
  };
  // Make each method return the chain
  for (const key of Object.keys(chain)) {
    if (typeof chain[key] === 'function' && !overrides[key]) {
      (chain[key] as ReturnType<typeof vi.fn>).mockReturnThis();
    }
  }
  return chain;
}

let supabaseChain: ReturnType<typeof createSupabaseMock>;

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: () => supabaseChain,
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

const makeAccount = (overrides: Partial<Account> = {}): Account => ({
  id: 'acc-1',
  user_id: 'user-123',
  name: 'Bank BCA',
  type: 'bank',
  balance: 5000000,
  credit_limit: null,
  due_date: null,
  target_amount: null,
  gold_brand: null,
  gold_weight_grams: null,
  is_deleted: false,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides,
});

// ── Tests ───────────────────────────────────────────────────

describe('useAccounts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches active accounts successfully', async () => {
    const accounts = [makeAccount(), makeAccount({ id: 'acc-2', name: 'GoPay' })];
    supabaseChain = createSupabaseMock({
      range: vi.fn().mockResolvedValue({ data: accounts, error: null, count: 2 }),
    });

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useAccounts(0), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.data).toHaveLength(2);
    expect(result.current.data?.count).toBe(2);
  });

  it('returns error when fetch fails', async () => {
    supabaseChain = createSupabaseMock({
      range: vi.fn().mockResolvedValue({ data: null, error: { message: 'Network error' }, count: null }),
    });

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useAccounts(0), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useSoftDeletedAccounts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches soft-deleted accounts', async () => {
    const deleted = [makeAccount({ id: 'del-1', is_deleted: true })];
    supabaseChain = createSupabaseMock({
      order: vi.fn().mockResolvedValue({ data: deleted, error: null }),
    });

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useSoftDeletedAccounts(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data![0].is_deleted).toBe(true);
  });
});

describe('useCreateAccount', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates account and invalidates queries on success', async () => {
    const newAccount = makeAccount({ id: 'new-1', name: 'Dana' });
    supabaseChain = createSupabaseMock({
      single: vi.fn().mockResolvedValue({ data: newAccount, error: null }),
    });

    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useCreateAccount(), { wrapper });

    await act(async () => {
      result.current.mutate({ name: 'Dana', type: 'e-wallet', balance: 100000 });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: accountKeys.all });
  });

  it('shows error toast on failure with retry callback', async () => {
    supabaseChain = createSupabaseMock({
      single: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } }),
    });

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCreateAccount(), { wrapper });

    await act(async () => {
      result.current.mutate({ name: 'Fail', type: 'cash', balance: 0 });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(mockShowError).toHaveBeenCalledWith(
      'Gagal membuat akun. Silakan coba lagi.',
      expect.any(Function)
    );
  });
});

describe('useUpdateAccount', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('updates account name and invalidates queries', async () => {
    const updated = makeAccount({ name: 'BCA Updated' });
    supabaseChain = createSupabaseMock({
      single: vi.fn().mockResolvedValue({ data: updated, error: null }),
    });

    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useUpdateAccount(), { wrapper });

    await act(async () => {
      result.current.mutate({ id: 'acc-1', name: 'BCA Updated' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: accountKeys.all });
  });

  it('shows error toast on update failure', async () => {
    supabaseChain = createSupabaseMock({
      single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Update failed' } }),
    });

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useUpdateAccount(), { wrapper });

    await act(async () => {
      result.current.mutate({ id: 'acc-1', name: 'Fail' });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(mockShowError).toHaveBeenCalledWith(
      'Gagal memperbarui akun. Silakan coba lagi.',
      expect.any(Function)
    );
  });
});

describe('useSoftDeleteAccount', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('soft-deletes account and invalidates queries', async () => {
    const deleted = makeAccount({ is_deleted: true });
    supabaseChain = createSupabaseMock({
      single: vi.fn().mockResolvedValue({ data: deleted, error: null }),
    });

    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useSoftDeleteAccount(), { wrapper });

    await act(async () => {
      result.current.mutate('acc-1');
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: accountKeys.all });
  });

  it('shows error toast on soft-delete failure', async () => {
    supabaseChain = createSupabaseMock({
      single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Delete failed' } }),
    });

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useSoftDeleteAccount(), { wrapper });

    await act(async () => {
      result.current.mutate('acc-1');
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(mockShowError).toHaveBeenCalledWith(
      'Gagal menghapus akun. Silakan coba lagi.',
      expect.any(Function)
    );
  });
});

describe('useReactivateAccount', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('reactivates account and invalidates queries', async () => {
    const reactivated = makeAccount({ is_deleted: false });
    supabaseChain = createSupabaseMock({
      single: vi.fn().mockResolvedValue({ data: reactivated, error: null }),
    });

    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useReactivateAccount(), { wrapper });

    await act(async () => {
      result.current.mutate('del-1');
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: accountKeys.all });
  });

  it('shows error toast on reactivation failure', async () => {
    supabaseChain = createSupabaseMock({
      single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Reactivate failed' } }),
    });

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useReactivateAccount(), { wrapper });

    await act(async () => {
      result.current.mutate('del-1');
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(mockShowError).toHaveBeenCalledWith(
      'Gagal mengaktifkan kembali akun. Silakan coba lagi.',
      expect.any(Function)
    );
  });
});

describe('accountKeys', () => {
  it('generates correct query keys', () => {
    expect(accountKeys.all).toEqual(['accounts']);
    expect(accountKeys.active('u1', 0)).toEqual(['accounts', 'active', 'u1', 0]);
    expect(accountKeys.softDeleted('u1')).toEqual(['accounts', 'soft-deleted', 'u1']);
  });
});
