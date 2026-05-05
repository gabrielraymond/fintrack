'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/providers/ToastProvider';
import type {
  Installment,
  InstallmentPaymentLog,
  InstallmentFormInput,
} from '@/types';

// ── Query Keys ──────────────────────────────────────────────
export const installmentKeys = {
  all: ['installments'] as const,
  active: (userId: string) =>
    [...installmentKeys.all, 'active', userId] as const,
  completed: (userId: string) =>
    [...installmentKeys.all, 'completed', userId] as const,
  paymentLogs: (userId: string, month: string) =>
    [...installmentKeys.all, 'logs', userId, month] as const,
};

// ── Data Fetchers ───────────────────────────────────────────

async function fetchActiveInstallments(userId: string): Promise<Installment[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('installments')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data as Installment[]) ?? [];
}

async function fetchCompletedInstallments(userId: string): Promise<Installment[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('installments')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data as Installment[]) ?? [];
}

async function fetchInstallmentPaymentLogs(
  userId: string,
  month: string
): Promise<InstallmentPaymentLog[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('installment_payment_logs')
    .select('*')
    .eq('user_id', userId)
    .eq('payment_month', month);

  if (error) throw error;
  return (data as InstallmentPaymentLog[]) ?? [];
}

// ── Query Hooks ─────────────────────────────────────────────

/**
 * Fetches all active installments for the current user.
 * Requirements: 1.1, 5.1
 */
export function useActiveInstallments() {
  const { user } = useAuth();

  return useQuery({
    queryKey: installmentKeys.active(user?.id ?? ''),
    queryFn: () => fetchActiveInstallments(user!.id),
    enabled: !!user,
  });
}

/**
 * Fetches all completed installments for the current user.
 * Requirements: 1.7
 */
export function useCompletedInstallments() {
  const { user } = useAuth();

  return useQuery({
    queryKey: installmentKeys.completed(user?.id ?? ''),
    queryFn: () => fetchCompletedInstallments(user!.id),
    enabled: !!user,
  });
}

/**
 * Fetches payment logs for a given month (format: YYYY-MM-01).
 * Requirements: 1b.3
 */
export function useInstallmentPaymentLogs(month: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: installmentKeys.paymentLogs(user?.id ?? '', month),
    queryFn: () => fetchInstallmentPaymentLogs(user!.id, month),
    enabled: !!user && !!month,
  });
}

// ── Mutation Hooks ──────────────────────────────────────────

/**
 * Creates a new installment.
 * installment_type is automatically determined from the account type.
 * Requirements: 1.1, 1.2, 5.1
 */
export function useCreateInstallment() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { showError } = useToast();

  const mutation = useMutation({
    mutationFn: async (input: InstallmentFormInput & { installment_type: 'cc' | 'non_cc' }) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('installments')
        .insert({
          user_id: user!.id,
          account_id: input.account_id,
          name: input.name,
          installment_type: input.installment_type,
          monthly_amount: input.monthly_amount,
          tenor_months: input.tenor_months,
          start_date: input.start_date,
          due_day: input.due_day,
          note: input.note ?? null,
          status: 'active',
        })
        .select()
        .single();

      if (error) throw error;
      return data as Installment;
    },

    onError: (_err, _input) => {
      showError('Gagal membuat cicilan. Silakan coba lagi.', () => {
        mutation.mutate(_input);
      });
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: installmentKeys.all });
    },
  });

  return mutation;
}

/**
 * Updates an existing installment.
 * Requirements: 5.1
 */
export function useUpdateInstallment() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { showError } = useToast();

  const mutation = useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: { id: string } & Partial<InstallmentFormInput>) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('installments')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', user!.id)
        .select()
        .single();

      if (error) throw error;
      return data as Installment;
    },

    onError: (_err, variables) => {
      showError('Gagal memperbarui cicilan. Silakan coba lagi.', () => {
        mutation.mutate(variables);
      });
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: installmentKeys.all });
    },
  });

  return mutation;
}

/**
 * Deletes an installment.
 * Requirements: 5.2
 */
export function useDeleteInstallment() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { showError } = useToast();

  const mutation = useMutation({
    mutationFn: async (installmentId: string) => {
      const supabase = createClient();
      const { error } = await supabase
        .from('installments')
        .delete()
        .eq('id', installmentId)
        .eq('user_id', user!.id);

      if (error) throw error;
    },

    onError: (_err, installmentId) => {
      showError('Gagal menghapus cicilan. Silakan coba lagi.', () => {
        mutation.mutate(installmentId);
      });
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: installmentKeys.all });
    },
  });

  return mutation;
}

/**
 * Confirms payment for a non-CC installment for the current month.
 * Uses upsert to handle the case where a log already exists.
 * Requirements: 1b.3
 */
export function useConfirmPayment() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { showError } = useToast();

  const mutation = useMutation({
    mutationFn: async ({
      installmentId,
      paymentMonth,
    }: {
      installmentId: string;
      paymentMonth: string; // format: YYYY-MM-01
    }) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('installment_payment_logs')
        .upsert(
          {
            installment_id: installmentId,
            user_id: user!.id,
            payment_month: paymentMonth,
            status: 'paid',
            confirmed_at: new Date().toISOString(),
          },
          { onConflict: 'installment_id,payment_month' }
        )
        .select()
        .single();

      if (error) throw error;
      return data as InstallmentPaymentLog;
    },

    onError: (_err, variables) => {
      showError('Gagal mengkonfirmasi pembayaran. Silakan coba lagi.', () => {
        mutation.mutate(variables);
      });
    },

    onSettled: (_data, _err, variables) => {
      // Invalidate payment logs for the relevant month
      queryClient.invalidateQueries({
        queryKey: installmentKeys.paymentLogs(user?.id ?? '', variables.paymentMonth),
      });
    },
  });

  return mutation;
}
