'use client';

import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/providers/ToastProvider';
import type { TransactionPreset, PresetFormInput } from '@/types';

// ── Query Keys ──────────────────────────────────────────────
export const presetKeys = {
  all: ['presets'] as const,
  list: (userId: string) =>
    [...presetKeys.all, 'list', userId] as const,
};

// ── Data Fetchers ───────────────────────────────────────────

async function fetchPresets(userId: string): Promise<TransactionPreset[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('transaction_presets')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data as TransactionPreset[]) ?? [];
}

// ── Hooks ───────────────────────────────────────────────────

/**
 * Fetches all transaction presets for the current user.
 * Requirements: 7.1, 7.2
 */
export function usePresets() {
  const { user } = useAuth();

  return useQuery({
    queryKey: presetKeys.list(user?.id ?? ''),
    queryFn: () => fetchPresets(user!.id),
    enabled: !!user,
  });
}

/**
 * Creates a new transaction preset.
 * Requirement 7.1
 */
export function useCreatePreset() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { showError } = useToast();

  const mutation = useMutation({
    mutationFn: async (input: PresetFormInput) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('transaction_presets')
        .insert({
          user_id: user!.id,
          name: input.name,
          type: input.type,
          category_id: input.category_id ?? null,
          account_id: input.account_id,
          destination_account_id: input.destination_account_id ?? null,
          amount: input.amount,
        })
        .select()
        .single();

      if (error) throw error;
      return data as TransactionPreset;
    },

    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: presetKeys.all });

      const listKey = presetKeys.list(user!.id);
      const previous = queryClient.getQueryData<TransactionPreset[]>(listKey);

      const optimistic: TransactionPreset = {
        id: `temp-${Date.now()}`,
        user_id: user!.id,
        name: input.name,
        type: input.type,
        category_id: input.category_id ?? null,
        account_id: input.account_id,
        destination_account_id: input.destination_account_id ?? null,
        amount: input.amount,
        created_at: new Date().toISOString(),
      };

      if (previous) {
        queryClient.setQueryData(listKey, [optimistic, ...previous]);
      }

      return { previous, listKey };
    },

    onError: (_err, input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(context.listKey, context.previous);
      }
      showError('Gagal membuat preset. Silakan coba lagi.', () => {
        mutation.mutate(input);
      });
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: presetKeys.all });
    },
  });

  return mutation;
}

/**
 * Updates an existing transaction preset.
 * Requirement 7.4
 */
export function useUpdatePreset() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { showError } = useToast();

  const mutation = useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: { id: string } & Partial<PresetFormInput>) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('transaction_presets')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user!.id)
        .select()
        .single();

      if (error) throw error;
      return data as TransactionPreset;
    },

    onMutate: async ({ id, ...updates }) => {
      await queryClient.cancelQueries({ queryKey: presetKeys.all });

      const listKey = presetKeys.list(user!.id);
      const previous = queryClient.getQueryData<TransactionPreset[]>(listKey);

      if (previous) {
        queryClient.setQueryData(
          listKey,
          previous.map((p) => (p.id === id ? { ...p, ...updates } : p))
        );
      }

      return { previous, listKey };
    },

    onError: (_err, variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(context.listKey, context.previous);
      }
      showError('Gagal memperbarui preset. Silakan coba lagi.', () => {
        mutation.mutate(variables);
      });
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: presetKeys.all });
    },
  });

  return mutation;
}

/**
 * Deletes a transaction preset.
 * Requirement 7.4
 */
export function useDeletePreset() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { showError } = useToast();

  const mutation = useMutation({
    mutationFn: async (presetId: string) => {
      const supabase = createClient();
      const { error } = await supabase
        .from('transaction_presets')
        .delete()
        .eq('id', presetId)
        .eq('user_id', user!.id);

      if (error) throw error;
      return presetId;
    },

    onMutate: async (presetId) => {
      await queryClient.cancelQueries({ queryKey: presetKeys.all });

      const listKey = presetKeys.list(user!.id);
      const previous = queryClient.getQueryData<TransactionPreset[]>(listKey);

      if (previous) {
        queryClient.setQueryData(
          listKey,
          previous.filter((p) => p.id !== presetId)
        );
      }

      return { previous, listKey };
    },

    onError: (_err, presetId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(context.listKey, context.previous);
      }
      showError('Gagal menghapus preset. Silakan coba lagi.', () => {
        mutation.mutate(presetId);
      });
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: presetKeys.all });
    },
  });

  return mutation;
}
