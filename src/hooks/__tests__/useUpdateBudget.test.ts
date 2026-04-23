import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import { useUpdateBudget, budgetKeys } from '../useBudgets';
import type { Budget } from '@/types';

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
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
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

const makeBudget = (overrides: Partial<Budget> = {}): Budget => ({
  id: 'budget-1',
  user_id: 'user-123',
  category_id: 'cat-1',
  month: '2024-03-01',
  limit_amount: 500000,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides,
});

// ── Tests ───────────────────────────────────────────────────

describe('useUpdateBudget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('updates budget with only limit_amount (no month)', async () => {
    const updated = makeBudget({ limit_amount: 750000 });
    const updateMock = vi.fn().mockReturnThis();
    supabaseChain = createSupabaseMock({
      update: updateMock,
      single: vi.fn().mockResolvedValue({ data: updated, error: null }),
    });

    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useUpdateBudget(), { wrapper });

    await act(async () => {
      result.current.mutate({ id: 'budget-1', limit_amount: 750000 });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Verify update was called with limit_amount and updated_at, but NOT month
    const updateCallArg = updateMock.mock.calls[0][0];
    expect(updateCallArg).toHaveProperty('limit_amount', 750000);
    expect(updateCallArg).toHaveProperty('updated_at');
    expect(updateCallArg).not.toHaveProperty('month');

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: budgetKeys.all });
  });

  it('updates budget with month when provided', async () => {
    const updated = makeBudget({ month: '2024-06-01', limit_amount: 500000 });
    const updateMock = vi.fn().mockReturnThis();
    supabaseChain = createSupabaseMock({
      update: updateMock,
      single: vi.fn().mockResolvedValue({ data: updated, error: null }),
    });

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useUpdateBudget(), { wrapper });

    await act(async () => {
      result.current.mutate({ id: 'budget-1', limit_amount: 500000, month: '2024-06-01' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Verify update was called with month included
    const updateCallArg = updateMock.mock.calls[0][0];
    expect(updateCallArg).toHaveProperty('limit_amount', 500000);
    expect(updateCallArg).toHaveProperty('month', '2024-06-01');
    expect(updateCallArg).toHaveProperty('updated_at');
  });

  it('shows specific error message for duplicate constraint violation (23505)', async () => {
    supabaseChain = createSupabaseMock({
      single: vi.fn().mockResolvedValue({
        data: null,
        error: { code: '23505', message: 'unique_violation' },
      }),
    });

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useUpdateBudget(), { wrapper });

    await act(async () => {
      result.current.mutate({ id: 'budget-1', limit_amount: 500000, month: '2024-06-01' });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(mockShowError).toHaveBeenCalledWith(
      'Anggaran untuk kategori dan bulan ini sudah ada.',
      expect.any(Function),
    );
  });

  it('shows generic error message for non-23505 errors', async () => {
    supabaseChain = createSupabaseMock({
      single: vi.fn().mockResolvedValue({
        data: null,
        error: { code: '42P01', message: 'relation does not exist' },
      }),
    });

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useUpdateBudget(), { wrapper });

    await act(async () => {
      result.current.mutate({ id: 'budget-1', limit_amount: 500000 });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(mockShowError).toHaveBeenCalledWith(
      'Gagal memperbarui anggaran. Silakan coba lagi.',
      expect.any(Function),
    );
  });

  it('provides retry callback in error handler', async () => {
    supabaseChain = createSupabaseMock({
      single: vi.fn().mockResolvedValue({
        data: null,
        error: { code: '500', message: 'Server error' },
      }),
    });

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useUpdateBudget(), { wrapper });

    await act(async () => {
      result.current.mutate({ id: 'budget-1', limit_amount: 500000 });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    // Verify the retry callback is a function
    const retryCallback = mockShowError.mock.calls[0][1];
    expect(typeof retryCallback).toBe('function');
  });
});
