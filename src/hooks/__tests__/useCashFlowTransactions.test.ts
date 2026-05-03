import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useCashFlowTransactions } from '../useCashFlowTransactions';
import type { Transaction } from '@/types';

// ── Mocks ───────────────────────────────────────────────────

const mockUser = { id: 'user-123' };

vi.mock('@/providers/AuthProvider', () => ({
  useAuth: () => ({ user: mockUser }),
}));

function createSupabaseMock(overrides: Record<string, unknown> = {}) {
  const chain: Record<string, unknown> = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    order: vi.fn().mockResolvedValue({ data: [], error: null }),
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
    },
  });
  return {
    queryClient,
    wrapper: ({ children }: { children: ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children),
  };
}

const makeTransaction = (overrides: Partial<Transaction> = {}): Transaction => ({
  id: 'txn-1',
  user_id: 'user-123',
  account_id: 'acc-1',
  destination_account_id: null,
  category_id: 'cat-1',
  type: 'expense',
  amount: 50000,
  note: null,
  date: '2024-03-15',
  created_at: '2024-03-15T00:00:00Z',
  updated_at: '2024-03-15T00:00:00Z',
  ...overrides,
});

// ── Tests ───────────────────────────────────────────────────

describe('useCashFlowTransactions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('computes correct cycleRange for cutoffDate=1 (calendar month)', async () => {
    supabaseChain = createSupabaseMock();

    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => useCashFlowTransactions({ month: 2, year: 2024, cutoffDate: 1 }),
      { wrapper },
    );

    // March 2024 with cutoff=1 → start: 2024-03-01, end: 2024-04-01
    expect(result.current.cycleRange).toEqual({
      start: '2024-03-01',
      end: '2024-04-01',
    });
  });

  it('computes correct cycleRange for cutoffDate>1', async () => {
    supabaseChain = createSupabaseMock();

    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => useCashFlowTransactions({ month: 0, year: 2024, cutoffDate: 25 }),
      { wrapper },
    );

    // January 2024 with cutoff=25 → start: 2024-01-25, end: 2024-02-25
    expect(result.current.cycleRange).toEqual({
      start: '2024-01-25',
      end: '2024-02-25',
    });
  });

  it('fetches transactions successfully', async () => {
    const transactions = [
      makeTransaction({ id: 'txn-1', date: '2024-03-05' }),
      makeTransaction({ id: 'txn-2', date: '2024-03-15' }),
    ];
    supabaseChain = createSupabaseMock({
      order: vi.fn().mockResolvedValue({ data: transactions, error: null }),
    });

    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => useCashFlowTransactions({ month: 2, year: 2024, cutoffDate: 1 }),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toHaveLength(2);
    expect(result.current.error).toBeNull();
  });

  it('returns error when fetch fails', async () => {
    supabaseChain = createSupabaseMock({
      order: vi.fn().mockResolvedValue({ data: null, error: { message: 'Network error' } }),
    });

    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => useCashFlowTransactions({ month: 2, year: 2024, cutoffDate: 1 }),
      { wrapper },
    );

    // retry: 1 means it retries once, so we need a longer timeout
    await waitFor(() => expect(result.current.error).not.toBeNull(), { timeout: 5000 });
    expect(result.current.data).toBeUndefined();
  });

  it('handles year boundary (December with cutoff>1)', async () => {
    supabaseChain = createSupabaseMock();

    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => useCashFlowTransactions({ month: 11, year: 2024, cutoffDate: 25 }),
      { wrapper },
    );

    // December 2024 with cutoff=25 → start: 2024-12-25, end: 2025-01-25
    expect(result.current.cycleRange).toEqual({
      start: '2024-12-25',
      end: '2025-01-25',
    });
  });

  it('returns isLoading=true while fetching', () => {
    supabaseChain = createSupabaseMock({
      order: vi.fn().mockReturnValue(new Promise(() => {})), // never resolves
    });

    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => useCashFlowTransactions({ month: 2, year: 2024, cutoffDate: 1 }),
      { wrapper },
    );

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
  });
});
