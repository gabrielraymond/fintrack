'use client';

import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/providers/ToastProvider';
import type { Account, AccountFormInput } from '@/types';

const PAGE_SIZE = 20;

// ── Query Keys ──────────────────────────────────────────────
export const accountKeys = {
  all: ['accounts'] as const,
  active: (userId: string, page: number) =>
    [...accountKeys.all, 'active', userId, page] as const,
  softDeleted: (userId: string) =>
    [...accountKeys.all, 'soft-deleted', userId] as const,
};

// ── Data Fetchers ───────────────────────────────────────────

async function fetchActiveAccounts(
  userId: string,
  page: number
): Promise<{ data: Account[]; count: number }> {
  const supabase = createClient();
  const from = page * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { data, error, count } = await supabase
    .from('accounts')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) throw error;
  return { data: (data as Account[]) ?? [], count: count ?? 0 };
}

async function fetchSoftDeletedAccounts(
  userId: string
): Promise<Account[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('user_id', userId)
    .eq('is_deleted', true)
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return (data as Account[]) ?? [];
}

// ── Hooks ───────────────────────────────────────────────────

/**
 * Fetches active (non-deleted) accounts with pagination.
 * Requirement 3.2, 3.3, 22.2
 */
export function useAccounts(page = 0) {
  const { user } = useAuth();

  return useQuery({
    queryKey: accountKeys.active(user?.id ?? '', page),
    queryFn: () => fetchActiveAccounts(user!.id, page),
    enabled: !!user,
    placeholderData: keepPreviousData,
  });
}

/**
 * Fetches soft-deleted accounts for the reactivation view.
 * Requirement 3.5, 28.1
 */
export function useSoftDeletedAccounts() {
  const { user } = useAuth();

  return useQuery({
    queryKey: accountKeys.softDeleted(user?.id ?? ''),
    queryFn: () => fetchSoftDeletedAccounts(user!.id),
    enabled: !!user,
  });
}

/**
 * Creates a new account with optimistic cache update.
 * Requirement 3.2
 */
export function useCreateAccount() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { showError } = useToast();

  const mutation = useMutation({
    mutationFn: async (input: AccountFormInput) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('accounts')
        .insert({
          user_id: user!.id,
          name: input.name,
          type: input.type,
          balance: input.balance,
          credit_limit: input.credit_limit ?? null,
          due_date: input.due_date ?? null,
          target_amount: input.target_amount ?? null,
          gold_brand: input.gold_brand ?? null,
          gold_weight_grams: input.gold_weight_grams ?? null,
          gold_purchase_price_per_gram: input.gold_purchase_price_per_gram ?? null,
          invested_amount: input.invested_amount ?? null,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Account;
    },

    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: accountKeys.all });

      const activeKey = accountKeys.active(user!.id, 0);
      const previous = queryClient.getQueryData<{ data: Account[]; count: number }>(activeKey);

      const optimistic: Account = {
        id: `temp-${Date.now()}`,
        user_id: user!.id,
        name: input.name,
        type: input.type,
        balance: input.balance,
        credit_limit: input.credit_limit ?? null,
        due_date: input.due_date ?? null,
        target_amount: input.target_amount ?? null,
        gold_brand: input.gold_brand ?? null,
        gold_weight_grams: input.gold_weight_grams ?? null,
        gold_purchase_price_per_gram: input.gold_purchase_price_per_gram ?? null,
        invested_amount: input.invested_amount ?? null,
        is_deleted: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      if (previous) {
        queryClient.setQueryData(activeKey, {
          data: [optimistic, ...previous.data],
          count: previous.count + 1,
        });
      }

      return { previous, activeKey };
    },

    onError: (_err, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(context.activeKey, context.previous);
      }
      showError('Gagal membuat akun. Silakan coba lagi.', () => {
        mutation.mutate(_input);
      });
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: accountKeys.all });
    },
  });

  return mutation;
}

/**
 * Updates an existing account name or type with optimistic cache update.
 * Requirement 3.6
 */
export function useUpdateAccount() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { showError } = useToast();

  const mutation = useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: { id: string } & Partial<Pick<Account, 'name' | 'type' | 'balance' | 'credit_limit' | 'due_date' | 'target_amount' | 'gold_brand' | 'gold_weight_grams' | 'gold_purchase_price_per_gram' | 'invested_amount'>>) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('accounts')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', user!.id)
        .select()
        .single();

      if (error) throw error;
      return data as Account;
    },

    onMutate: async ({ id, ...updates }) => {
      await queryClient.cancelQueries({ queryKey: accountKeys.all });

      const activeKey = accountKeys.active(user!.id, 0);
      const previous = queryClient.getQueryData<{ data: Account[]; count: number }>(activeKey);

      if (previous) {
        queryClient.setQueryData(activeKey, {
          ...previous,
          data: previous.data.map((a) =>
            a.id === id ? { ...a, ...updates, updated_at: new Date().toISOString() } : a
          ),
        });
      }

      return { previous, activeKey };
    },

    onError: (_err, variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(context.activeKey, context.previous);
      }
      showError('Gagal memperbarui akun. Silakan coba lagi.', () => {
        mutation.mutate(variables);
      });
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: accountKeys.all });
    },
  });

  return mutation;
}

/**
 * Soft-deletes an account (sets is_deleted = true) with optimistic update.
 * Requirement 3.5
 */
export function useSoftDeleteAccount() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { showError } = useToast();

  const mutation = useMutation({
    mutationFn: async (accountId: string) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('accounts')
        .update({ is_deleted: true, updated_at: new Date().toISOString() })
        .eq('id', accountId)
        .eq('user_id', user!.id)
        .select()
        .single();

      if (error) throw error;
      return data as Account;
    },

    onMutate: async (accountId) => {
      await queryClient.cancelQueries({ queryKey: accountKeys.all });

      const activeKey = accountKeys.active(user!.id, 0);
      const previous = queryClient.getQueryData<{ data: Account[]; count: number }>(activeKey);

      if (previous) {
        queryClient.setQueryData(activeKey, {
          data: previous.data.filter((a) => a.id !== accountId),
          count: previous.count - 1,
        });
      }

      return { previous, activeKey };
    },

    onError: (_err, accountId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(context.activeKey, context.previous);
      }
      showError('Gagal menghapus akun. Silakan coba lagi.', () => {
        mutation.mutate(accountId);
      });
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: accountKeys.all });
    },
  });

  return mutation;
}

/**
 * Reactivates a soft-deleted account (sets is_deleted = false) with optimistic update.
 * Requirement 28.1, 28.2, 28.3
 */
export function useReactivateAccount() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { showError } = useToast();

  const mutation = useMutation({
    mutationFn: async (accountId: string) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('accounts')
        .update({ is_deleted: false, updated_at: new Date().toISOString() })
        .eq('id', accountId)
        .eq('user_id', user!.id)
        .select()
        .single();

      if (error) throw error;
      return data as Account;
    },

    onMutate: async (accountId) => {
      await queryClient.cancelQueries({ queryKey: accountKeys.all });

      const deletedKey = accountKeys.softDeleted(user!.id);
      const previousDeleted = queryClient.getQueryData<Account[]>(deletedKey);

      if (previousDeleted) {
        queryClient.setQueryData(
          deletedKey,
          previousDeleted.filter((a) => a.id !== accountId)
        );
      }

      return { previousDeleted, deletedKey };
    },

    onError: (_err, accountId, context) => {
      if (context?.previousDeleted) {
        queryClient.setQueryData(context.deletedKey, context.previousDeleted);
      }
      showError('Gagal mengaktifkan kembali akun. Silakan coba lagi.', () => {
        mutation.mutate(accountId);
      });
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: accountKeys.all });
    },
  });

  return mutation;
}
