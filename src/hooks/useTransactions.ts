'use client';

import {
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/providers/ToastProvider';
import type { Transaction, TransactionFormInput } from '@/types';
import { accountKeys } from './useAccounts';

// ── Query Keys ──────────────────────────────────────────────
export const transactionKeys = {
  all: ['transactions'] as const,
  list: (userId: string, filters?: Record<string, unknown>) =>
    [...transactionKeys.all, 'list', userId, filters] as const,
  detail: (userId: string, id: string) =>
    [...transactionKeys.all, 'detail', userId, id] as const,
};

const budgetKeys = {
  all: ['budgets'] as const,
};

// ── Mutations ───────────────────────────────────────────────

/**
 * Creates a new transaction via Supabase RPC for atomic balance updates.
 * Requirements: 4.5, 4.6, 4.7, 21.1, 21.2
 */
export function useCreateTransaction() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { showError } = useToast();

  const mutation = useMutation({
    mutationFn: async (input: TransactionFormInput) => {
      const supabase = createClient();
      const { data, error } = await supabase.rpc('create_transaction', {
        p_user_id: user!.id,
        p_account_id: input.account_id,
        p_destination_account_id: input.destination_account_id ?? null,
        p_category_id: input.category_id ?? null,
        p_type: input.type,
        p_amount: input.amount,
        p_note: input.note ?? null,
        p_date: input.date,
      });

      if (error) throw error;
      return data as Transaction;
    },

    onError: (_err, input) => {
      showError('Gagal menyimpan transaksi. Silakan coba lagi.', () => {
        mutation.mutate(input);
      });
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.all });
      queryClient.invalidateQueries({ queryKey: accountKeys.all });
      queryClient.invalidateQueries({ queryKey: budgetKeys.all });
    },
  });

  return mutation;
}


/**
 * Updates an existing transaction via Supabase RPC for atomic balance reversal and reapplication.
 * Requirements: 6.1, 6.2, 21.1, 21.2
 */
export function useUpdateTransaction() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { showError } = useToast();

  const mutation = useMutation({
    mutationFn: async (
      input: TransactionFormInput & { id: string }
    ) => {
      const supabase = createClient();
      const { data, error } = await supabase.rpc('update_transaction', {
        p_transaction_id: input.id,
        p_user_id: user!.id,
        p_account_id: input.account_id,
        p_destination_account_id: input.destination_account_id ?? null,
        p_category_id: input.category_id ?? null,
        p_type: input.type,
        p_amount: input.amount,
        p_note: input.note ?? null,
        p_date: input.date,
      });

      if (error) throw error;
      return data as Transaction;
    },

    onError: (_err, input) => {
      showError('Gagal memperbarui transaksi. Silakan coba lagi.', () => {
        mutation.mutate(input);
      });
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.all });
      queryClient.invalidateQueries({ queryKey: accountKeys.all });
      queryClient.invalidateQueries({ queryKey: budgetKeys.all });
    },
  });

  return mutation;
}

/**
 * Deletes a transaction via Supabase RPC for atomic balance reversal.
 * Requirements: 6.3, 6.4, 21.1, 21.2
 */
export function useDeleteTransaction() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { showError } = useToast();

  const mutation = useMutation({
    mutationFn: async (transactionId: string) => {
      const supabase = createClient();
      const { data, error } = await supabase.rpc('delete_transaction', {
        p_transaction_id: transactionId,
        p_user_id: user!.id,
      });

      if (error) throw error;
      return data as Transaction;
    },

    onError: (_err, transactionId) => {
      showError('Gagal menghapus transaksi. Silakan coba lagi.', () => {
        mutation.mutate(transactionId);
      });
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.all });
      queryClient.invalidateQueries({ queryKey: accountKeys.all });
      queryClient.invalidateQueries({ queryKey: budgetKeys.all });
    },
  });

  return mutation;
}
