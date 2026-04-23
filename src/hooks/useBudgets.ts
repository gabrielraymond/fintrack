'use client';

import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/providers/ToastProvider';
import type { Budget, BudgetFormInput, BudgetWithSpending, Category } from '@/types';

// ── Query Keys ──────────────────────────────────────────────
export const budgetKeys = {
  all: ['budgets'] as const,
  list: (userId: string, month: string) =>
    [...budgetKeys.all, 'list', userId, month] as const,
};

// ── Helpers ─────────────────────────────────────────────────

function getBudgetStatus(spent: number, limit: number): 'green' | 'yellow' | 'red' {
  const ratio = limit > 0 ? spent / limit : 0;
  if (ratio >= 1) return 'red';
  if (ratio >= 0.75) return 'yellow';
  return 'green';
}

// ── Data Fetchers ───────────────────────────────────────────

async function fetchBudgetsWithSpending(
  userId: string,
  month: string
): Promise<BudgetWithSpending[]> {
  const supabase = createClient();

  // Fetch budgets for the month with their category
  const { data: budgets, error: budgetError } = await supabase
    .from('budgets')
    .select('*, category:categories(*)')
    .eq('user_id', userId)
    .eq('month', month)
    .order('created_at', { ascending: false });

  if (budgetError) throw budgetError;
  if (!budgets || budgets.length === 0) return [];

  // Calculate the month range for expense query
  const monthStart = month; // e.g. "2024-03-01"
  const monthDate = new Date(month);
  const nextMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1);
  const monthEnd = nextMonth.toISOString().split('T')[0];

  // Fetch all expense transactions for this month
  const { data: expenses, error: expenseError } = await supabase
    .from('transactions')
    .select('category_id, amount')
    .eq('user_id', userId)
    .eq('type', 'expense')
    .gte('date', monthStart)
    .lt('date', monthEnd);

  if (expenseError) throw expenseError;

  // Sum expenses by category
  const spendingByCategory: Record<string, number> = {};
  for (const tx of expenses ?? []) {
    if (tx.category_id) {
      spendingByCategory[tx.category_id] =
        (spendingByCategory[tx.category_id] ?? 0) + tx.amount;
    }
  }

  return budgets.map((b) => {
    const spent = spendingByCategory[b.category_id] ?? 0;
    return {
      id: b.id,
      user_id: b.user_id,
      category_id: b.category_id,
      month: b.month,
      limit_amount: b.limit_amount,
      created_at: b.created_at,
      updated_at: b.updated_at,
      spent,
      status: getBudgetStatus(spent, b.limit_amount),
      category: b.category as Category | undefined,
    };
  });
}

// ── Hooks ───────────────────────────────────────────────────

/**
 * Fetches budgets with spending for a given month.
 * Requirements: 9.1, 9.3, 9.4
 */
export function useBudgets(month: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: budgetKeys.list(user?.id ?? '', month),
    queryFn: () => fetchBudgetsWithSpending(user!.id, month),
    enabled: !!user && !!month,
  });
}

/**
 * Returns category IDs that already have a budget for the given month.
 * Used to disable already-budgeted categories in the form.
 * Requirements: 27.1, 27.2
 */
export function useBudgetedCategoryIds(month: string) {
  const { data: budgets } = useBudgets(month);
  return (budgets ?? []).map((b) => b.category_id);
}

/**
 * Creates a new budget with duplicate prevention.
 * Requirements: 9.1, 27.1, 27.2
 */
export function useCreateBudget() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { showError } = useToast();

  const mutation = useMutation({
    mutationFn: async (input: BudgetFormInput) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('budgets')
        .insert({
          user_id: user!.id,
          category_id: input.category_id,
          month: input.month,
          limit_amount: input.limit_amount,
        })
        .select()
        .single();

      if (error) {
        // Handle unique constraint violation
        if (error.code === '23505') {
          throw new Error(
            'Anggaran untuk kategori dan bulan ini sudah ada.'
          );
        }
        throw error;
      }
      return data as Budget;
    },

    onError: (_err, input) => {
      const message =
        _err instanceof Error
          ? _err.message
          : 'Gagal membuat anggaran. Silakan coba lagi.';
      showError(message, () => {
        mutation.mutate(input);
      });
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: budgetKeys.all });
    },
  });

  return mutation;
}

/**
 * Updates an existing budget limit amount and optionally the month.
 * Requirements: 2.2, 2.3, 2.5, 9.1
 */
export function useUpdateBudget() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { showError } = useToast();

  const mutation = useMutation({
    mutationFn: async ({
      id,
      limit_amount,
      month,
    }: {
      id: string;
      limit_amount: number;
      month?: string;
    }) => {
      const supabase = createClient();
      const updateFields: Record<string, unknown> = {
        limit_amount,
        updated_at: new Date().toISOString(),
      };
      if (month) {
        updateFields.month = month;
      }

      const { data, error } = await supabase
        .from('budgets')
        .update(updateFields)
        .eq('id', id)
        .eq('user_id', user!.id)
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new Error(
            'Anggaran untuk kategori dan bulan ini sudah ada.'
          );
        }
        throw error;
      }
      return data as Budget;
    },

    onError: (_err, variables) => {
      const message =
        _err instanceof Error
          ? _err.message
          : 'Gagal memperbarui anggaran. Silakan coba lagi.';
      showError(message, () => {
        mutation.mutate(variables);
      });
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: budgetKeys.all });
    },
  });

  return mutation;
}



/**
 * Deletes a budget.
 * Requirements: 9.1
 */
export function useDeleteBudget() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { showError } = useToast();

  const mutation = useMutation({
    mutationFn: async (budgetId: string) => {
      const supabase = createClient();
      const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', budgetId)
        .eq('user_id', user!.id);

      if (error) throw error;
      return budgetId;
    },

    onError: (_err, budgetId) => {
      showError('Gagal menghapus anggaran. Silakan coba lagi.', () => {
        mutation.mutate(budgetId);
      });
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: budgetKeys.all });
    },
  });

  return mutation;
}
