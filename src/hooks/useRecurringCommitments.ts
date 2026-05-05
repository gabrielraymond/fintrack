'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/providers/ToastProvider';
import type { RecurringCommitment, RecurringCommitmentFormInput } from '@/types';

// ── Query Keys ──────────────────────────────────────────────
export const commitmentKeys = {
  all: ['recurring_commitments'] as const,
  active: (userId: string) =>
    [...commitmentKeys.all, 'active', userId] as const,
  list: (userId: string) =>
    [...commitmentKeys.all, 'list', userId] as const,
};

// ── Data Fetchers ───────────────────────────────────────────

async function fetchActiveCommitments(userId: string): Promise<RecurringCommitment[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('recurring_commitments')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data as RecurringCommitment[]) ?? [];
}

async function fetchAllCommitments(userId: string): Promise<RecurringCommitment[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('recurring_commitments')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data as RecurringCommitment[]) ?? [];
}

// ── Query Hooks ─────────────────────────────────────────────

/**
 * Fetches all active recurring commitments for the current user.
 * Requirements: 2.1, 2.3
 */
export function useActiveCommitments() {
  const { user } = useAuth();

  return useQuery({
    queryKey: commitmentKeys.active(user?.id ?? ''),
    queryFn: () => fetchActiveCommitments(user!.id),
    enabled: !!user,
  });
}

/**
 * Fetches all recurring commitments (active and inactive) for the current user.
 * Requirements: 2.1
 */
export function useAllCommitments() {
  const { user } = useAuth();

  return useQuery({
    queryKey: commitmentKeys.list(user?.id ?? ''),
    queryFn: () => fetchAllCommitments(user!.id),
    enabled: !!user,
  });
}

// ── Mutation Hooks ──────────────────────────────────────────

/**
 * Creates a new recurring commitment.
 * Requirements: 2.1, 5.3
 */
export function useCreateCommitment() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { showError } = useToast();

  const mutation = useMutation({
    mutationFn: async (input: RecurringCommitmentFormInput) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('recurring_commitments')
        .insert({
          user_id: user!.id,
          account_id: input.account_id,
          name: input.name,
          monthly_amount: input.monthly_amount,
          note: input.note ?? null,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;
      return data as RecurringCommitment;
    },

    onError: (_err, _input) => {
      showError('Gagal membuat komitmen berulang. Silakan coba lagi.', () => {
        mutation.mutate(_input);
      });
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: commitmentKeys.all });
    },
  });

  return mutation;
}

/**
 * Updates an existing recurring commitment.
 * Requirements: 5.3
 */
export function useUpdateCommitment() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { showError } = useToast();

  const mutation = useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: { id: string } & Partial<RecurringCommitmentFormInput>) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('recurring_commitments')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', user!.id)
        .select()
        .single();

      if (error) throw error;
      return data as RecurringCommitment;
    },

    onError: (_err, variables) => {
      showError('Gagal memperbarui komitmen berulang. Silakan coba lagi.', () => {
        mutation.mutate(variables);
      });
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: commitmentKeys.all });
    },
  });

  return mutation;
}

/**
 * Deletes a recurring commitment.
 * Requirements: 5.4
 */
export function useDeleteCommitment() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { showError } = useToast();

  const mutation = useMutation({
    mutationFn: async (commitmentId: string) => {
      const supabase = createClient();
      const { error } = await supabase
        .from('recurring_commitments')
        .delete()
        .eq('id', commitmentId)
        .eq('user_id', user!.id);

      if (error) throw error;
    },

    onError: (_err, commitmentId) => {
      showError('Gagal menghapus komitmen berulang. Silakan coba lagi.', () => {
        mutation.mutate(commitmentId);
      });
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: commitmentKeys.all });
    },
  });

  return mutation;
}

/**
 * Toggles the active status of a recurring commitment.
 * Requirements: 2.3
 */
export function useToggleCommitmentActive() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { showError } = useToast();

  const mutation = useMutation({
    mutationFn: async ({
      id,
      isActive,
    }: {
      id: string;
      isActive: boolean;
    }) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('recurring_commitments')
        .update({ is_active: isActive, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', user!.id)
        .select()
        .single();

      if (error) throw error;
      return data as RecurringCommitment;
    },

    onError: (_err, variables) => {
      showError('Gagal mengubah status komitmen. Silakan coba lagi.', () => {
        mutation.mutate(variables);
      });
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: commitmentKeys.all });
    },
  });

  return mutation;
}
