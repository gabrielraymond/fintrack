'use client';

import { useEffect, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/providers/ToastProvider';
import { getPreviousMonth } from '@/lib/cycle-utils';
import { budgetKeys } from '@/hooks/useBudgets';

export interface CarryOverResult {
  carriedOver: number;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Hook yang menangani carry-over otomatis budget recurring.
 *
 * Logika:
 * 1. Hitung bulan sebelumnya dari currentMonth
 * 2. Query recurring budgets dari bulan sebelumnya
 * 3. Query budgets yang sudah ada di bulan berjalan
 * 4. Filter recurring budgets yang category_id-nya belum ada di bulan berjalan
 * 5. Untuk setiap budget yang perlu di-carry over, ambil limit_amount terbaru
 *    (dari budget recurring dengan month terbesar untuk kategori tersebut)
 * 6. Batch insert budget baru dengan is_recurring=true
 * 7. Invalidate budget query cache
 *
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.3, 5.1
 */
export function useCarryOverBudgets(
  currentMonth: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  cutoffDate: number
): CarryOverResult {
  const { user } = useAuth();
  const { showError } = useToast();
  const queryClient = useQueryClient();
  const [carriedOver, setCarriedOver] = useState(0);

  // Track which month we've already carried over to avoid re-running
  const processedRef = useRef<string | null>(null);

  const mutation = useMutation({
    mutationFn: async ({
      userId,
      currentMonth: month,
    }: {
      userId: string;
      currentMonth: string;
    }) => {
      const supabase = createClient();
      const previousMonth = getPreviousMonth(month);

      // Step 1: Query recurring budgets from previous month
      const { data: prevRecurring, error: prevError } = await supabase
        .from('budgets')
        .select('category_id')
        .eq('user_id', userId)
        .eq('month', previousMonth)
        .eq('is_recurring', true);

      if (prevError) throw prevError;
      if (!prevRecurring || prevRecurring.length === 0) return 0;

      // Step 2: Query budgets that already exist in current month
      const { data: currentBudgets, error: currentError } = await supabase
        .from('budgets')
        .select('category_id')
        .eq('user_id', userId)
        .eq('month', month);

      if (currentError) throw currentError;

      // Step 3: Filter — only carry over categories not yet in current month
      const existingCategoryIds = new Set(
        (currentBudgets ?? []).map((b) => b.category_id)
      );
      const categoriesToCarryOver = prevRecurring
        .map((b) => b.category_id)
        .filter((catId) => !existingCategoryIds.has(catId));

      if (categoriesToCarryOver.length === 0) return 0;

      // Step 4: For each category, get the latest limit_amount
      // Query the budget with the largest month for each category
      // (is_recurring=true, same user_id and category_id)
      const newBudgets: Array<{
        user_id: string;
        category_id: string;
        month: string;
        limit_amount: number;
        is_recurring: boolean;
      }> = [];

      for (const categoryId of categoriesToCarryOver) {
        const { data: latestBudget, error: latestError } = await supabase
          .from('budgets')
          .select('limit_amount')
          .eq('user_id', userId)
          .eq('category_id', categoryId)
          .eq('is_recurring', true)
          .order('month', { ascending: false })
          .limit(1)
          .single();

        if (latestError) throw latestError;

        newBudgets.push({
          user_id: userId,
          category_id: categoryId,
          month: month,
          limit_amount: latestBudget.limit_amount,
          is_recurring: true,
        });
      }

      // Step 5: Batch insert
      const { error: insertError } = await supabase
        .from('budgets')
        .insert(newBudgets);

      if (insertError) {
        // Handle constraint violation 23505 — budget already exists, skip
        if (insertError.code === '23505') {
          return newBudgets.length;
        }
        throw insertError;
      }

      return newBudgets.length;
    },

    onSuccess: (count) => {
      setCarriedOver(count);
      if (count > 0) {
        queryClient.invalidateQueries({ queryKey: budgetKeys.all });
      }
    },

    onError: (err) => {
      const message =
        err instanceof Error
          ? err.message
          : 'Gagal melakukan carry-over anggaran berulang.';
      showError(message);
    },
  });

  // Auto-trigger carry-over when component mounts or month changes
  useEffect(() => {
    if (!user || !currentMonth) return;

    // Skip if we already processed this month
    const key = `${user.id}:${currentMonth}`;
    if (processedRef.current === key) return;

    processedRef.current = key;
    mutation.mutate({ userId: user.id, currentMonth });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, currentMonth]);

  return {
    carriedOver,
    isLoading: mutation.isPending,
    error: mutation.error,
  };
}
