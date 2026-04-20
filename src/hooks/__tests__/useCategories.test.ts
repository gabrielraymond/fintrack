import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  categoryKeys,
} from '../useCategories';
import type { Category } from '@/types';

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
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    ...overrides,
  };
  for (const key of Object.keys(chain)) {
    if (typeof chain[key] === 'function' && !overrides[key]) {
      (chain[key] as ReturnType<typeof vi.fn>).mockReturnThis();
    }
  }
  return chain;
}

let supabaseChain: ReturnType<typeof createSupabaseMock>;
let supabaseFromTable: string | undefined;

// For delete tests we need per-table chains
let transactionsChain: ReturnType<typeof createSupabaseMock>;

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: (table: string) => {
      supabaseFromTable = table;
      if (table === 'transactions') return transactionsChain;
      return supabaseChain;
    },
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

const makeCategory = (overrides: Partial<Category> = {}): Category => ({
  id: 'cat-1',
  user_id: 'user-123',
  name: 'Makan',
  icon: '🍔',
  is_default: true,
  created_at: '2024-01-01T00:00:00Z',
  ...overrides,
});

// ── Tests ───────────────────────────────────────────────────

describe('useCategories', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    transactionsChain = createSupabaseMock();
  });

  it('fetches categories successfully', async () => {
    const categories = [makeCategory(), makeCategory({ id: 'cat-2', name: 'Transport', icon: '🚗' })];
    supabaseChain = createSupabaseMock({
      order: vi.fn().mockImplementation(function (this: ReturnType<typeof createSupabaseMock>) {
        // First call orders by is_default, second call orders by created_at and resolves
        return {
          ...this,
          order: vi.fn().mockResolvedValue({ data: categories, error: null }),
        };
      }),
    });

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCategories(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(2);
  });

  it('returns error when fetch fails', async () => {
    supabaseChain = createSupabaseMock({
      order: vi.fn().mockImplementation(function (this: ReturnType<typeof createSupabaseMock>) {
        return {
          ...this,
          order: vi.fn().mockResolvedValue({ data: null, error: { message: 'Network error' } }),
        };
      }),
    });

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCategories(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useCreateCategory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    transactionsChain = createSupabaseMock();
  });

  it('creates category and invalidates queries on success', async () => {
    const newCategory = makeCategory({ id: 'new-1', name: 'Hiburan', icon: '🎬', is_default: false });
    supabaseChain = createSupabaseMock({
      single: vi.fn().mockResolvedValue({ data: newCategory, error: null }),
    });

    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useCreateCategory(), { wrapper });

    await act(async () => {
      result.current.mutate({ name: 'Hiburan', icon: '🎬' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: categoryKeys.all });
  });

  it('shows error toast on failure with retry callback', async () => {
    supabaseChain = createSupabaseMock({
      single: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } }),
    });

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCreateCategory(), { wrapper });

    await act(async () => {
      result.current.mutate({ name: 'Fail', icon: '❌' });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(mockShowError).toHaveBeenCalledWith(
      'Gagal membuat kategori. Silakan coba lagi.',
      expect.any(Function)
    );
  });
});

describe('useUpdateCategory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    transactionsChain = createSupabaseMock();
  });

  it('updates category and invalidates queries', async () => {
    const updated = makeCategory({ name: 'Makanan' });
    supabaseChain = createSupabaseMock({
      single: vi.fn().mockResolvedValue({ data: updated, error: null }),
    });

    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useUpdateCategory(), { wrapper });

    await act(async () => {
      result.current.mutate({ id: 'cat-1', name: 'Makanan' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: categoryKeys.all });
  });

  it('shows error toast on update failure', async () => {
    supabaseChain = createSupabaseMock({
      single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Update failed' } }),
    });

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useUpdateCategory(), { wrapper });

    await act(async () => {
      result.current.mutate({ id: 'cat-1', name: 'Fail' });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(mockShowError).toHaveBeenCalledWith(
      'Gagal memperbarui kategori. Silakan coba lagi.',
      expect.any(Function)
    );
  });
});

describe('useDeleteCategory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deletes category when no transactions reference it', async () => {
    // Transactions check: select('*', opts).eq('category_id', id).eq('user_id', uid) → count: 0
    const txFinalEq = vi.fn().mockResolvedValue({ count: 0, error: null });
    const txFirstEq = vi.fn().mockReturnValue({ eq: txFinalEq });
    const txSelect = vi.fn().mockReturnValue({ eq: txFirstEq });
    transactionsChain = { select: txSelect } as unknown as ReturnType<typeof createSupabaseMock>;

    // Categories delete: delete().eq('id', id).eq('user_id', uid) → success
    const catDeleteEq2 = vi.fn().mockResolvedValue({ error: null });
    const catDeleteEq1 = vi.fn().mockReturnValue({ eq: catDeleteEq2 });
    const catDeleteFn = vi.fn().mockReturnValue({ eq: catDeleteEq1 });
    supabaseChain = {
      ...createSupabaseMock(),
      delete: catDeleteFn,
    };

    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useDeleteCategory(), { wrapper });

    await act(async () => {
      result.current.mutate('cat-custom-1');
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: categoryKeys.all });
  });

  it('prevents deletion when category has associated transactions', async () => {
    // Transactions check returns count > 0
    const selectFn = vi.fn().mockResolvedValue({ count: 3, error: null });
    const eqFn2 = vi.fn().mockReturnValue({ select: selectFn });
    const eqFn1 = vi.fn().mockReturnValue({ eq: eqFn2 });
    transactionsChain = {
      select: eqFn1,
      eq: eqFn1,
    } as unknown as ReturnType<typeof createSupabaseMock>;

    // Override to make the chain work: from('transactions').select(...).eq(...).eq(...)
    transactionsChain = createSupabaseMock();
    // Build a proper chain for: select('*', { count: 'exact', head: true }).eq('category_id', id).eq('user_id', userId)
    const finalEq = vi.fn().mockResolvedValue({ count: 3, error: null });
    const firstEq = vi.fn().mockReturnValue({ eq: finalEq });
    const selectMock = vi.fn().mockReturnValue({ eq: firstEq });
    transactionsChain = { select: selectMock } as unknown as ReturnType<typeof createSupabaseMock>;

    supabaseChain = createSupabaseMock();

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useDeleteCategory(), { wrapper });

    await act(async () => {
      result.current.mutate('cat-in-use');
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(mockShowError).toHaveBeenCalledWith(
      'Kategori tidak dapat dihapus karena masih digunakan oleh transaksi.',
      expect.any(Function)
    );
  });

  it('shows error toast on delete failure', async () => {
    // Transactions check returns count 0
    const finalEq = vi.fn().mockResolvedValue({ count: 0, error: null });
    const firstEq = vi.fn().mockReturnValue({ eq: finalEq });
    const selectMock = vi.fn().mockReturnValue({ eq: firstEq });
    transactionsChain = { select: selectMock } as unknown as ReturnType<typeof createSupabaseMock>;

    // Categories delete fails
    const deleteEq2 = vi.fn().mockResolvedValue({ error: { message: 'Delete failed' } });
    const deleteEq1 = vi.fn().mockReturnValue({ eq: deleteEq2 });
    const deleteFn = vi.fn().mockReturnValue({ eq: deleteEq1 });
    supabaseChain = {
      ...createSupabaseMock(),
      delete: deleteFn,
    };

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useDeleteCategory(), { wrapper });

    await act(async () => {
      result.current.mutate('cat-fail');
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(mockShowError).toHaveBeenCalled();
  });
});

describe('categoryKeys', () => {
  it('generates correct query keys', () => {
    expect(categoryKeys.all).toEqual(['categories']);
    expect(categoryKeys.list('u1')).toEqual(['categories', 'list', 'u1']);
  });
});
