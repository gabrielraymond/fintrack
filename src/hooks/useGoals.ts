'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/providers/ToastProvider';
import type { FinancialGoal, GoalContribution, GoalFormInput, GoalStatus } from '@/types';

// ── Query Keys ──────────────────────────────────────────────
export const goalKeys = {
  all: ['goals'] as const,
  list: (userId: string, status?: GoalStatus) =>
    [...goalKeys.all, 'list', userId, status] as const,
  detail: (goalId: string) =>
    [...goalKeys.all, 'detail', goalId] as const,
  contributions: (goalId: string) =>
    [...goalKeys.all, 'contributions', goalId] as const,
  dashboard: (userId: string) =>
    [...goalKeys.all, 'dashboard', userId] as const,
};

// ── Data Fetchers ───────────────────────────────────────────

async function fetchGoals(
  userId: string,
  status?: GoalStatus
): Promise<FinancialGoal[]> {
  const supabase = createClient();

  let query = supabase
    .from('financial_goals')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) throw error;
  return (data as FinancialGoal[]) ?? [];
}

async function fetchGoalDetail(goalId: string): Promise<FinancialGoal> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('financial_goals')
    .select('*')
    .eq('id', goalId)
    .single();

  if (error) throw error;
  return data as FinancialGoal;
}

async function fetchGoalContributions(
  goalId: string
): Promise<GoalContribution[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('goal_contributions')
    .select('*')
    .eq('goal_id', goalId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data as GoalContribution[]) ?? [];
}

async function fetchDashboardGoals(
  userId: string
): Promise<FinancialGoal[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('financial_goals')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active');

  if (error) throw error;

  const goals = (data as FinancialGoal[]) ?? [];

  // Sort by progress percentage (current_amount / target_amount) descending, take top 3
  return goals
    .sort((a, b) => {
      const progressA = a.target_amount > 0 ? a.current_amount / a.target_amount : 0;
      const progressB = b.target_amount > 0 ? b.current_amount / b.target_amount : 0;
      return progressB - progressA;
    })
    .slice(0, 3);
}

// ── Hooks ───────────────────────────────────────────────────

/**
 * Fetches goals with optional status filter, sorted by created_at DESC.
 * Requirements: 6.2, 6.3, 6.5
 */
export function useGoals(status?: GoalStatus) {
  const { user } = useAuth();

  return useQuery({
    queryKey: goalKeys.list(user?.id ?? '', status),
    queryFn: () => fetchGoals(user!.id, status),
    enabled: !!user,
  });
}

/**
 * Fetches a single goal by ID.
 * Requirement: 3.5
 */
export function useGoalDetail(goalId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: goalKeys.detail(goalId),
    queryFn: () => fetchGoalDetail(goalId),
    enabled: !!user && !!goalId,
  });
}

/**
 * Fetches contributions for a goal, sorted by created_at DESC.
 * Requirement: 3.5
 */
export function useGoalContributions(goalId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: goalKeys.contributions(goalId),
    queryFn: () => fetchGoalContributions(goalId),
    enabled: !!user && !!goalId,
  });
}

/**
 * Fetches top 3 active goals by progress percentage for the dashboard.
 * Requirement: 7.1
 */
export function useDashboardGoals() {
  const { user } = useAuth();

  return useQuery({
    queryKey: goalKeys.dashboard(user?.id ?? ''),
    queryFn: () => fetchDashboardGoals(user!.id),
    enabled: !!user,
  });
}

// ── Mutation Hooks ──────────────────────────────────────────

/**
 * Creates a new Financial Goal with optimistic cache insert.
 * Requirements: 1.3, 1.6
 */
export function useCreateGoal() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { showError } = useToast();

  const mutation = useMutation({
    mutationFn: async (input: GoalFormInput) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('financial_goals')
        .insert({
          user_id: user!.id,
          name: input.name,
          category: input.category,
          target_amount: input.target_amount,
          target_date: input.target_date ?? null,
          note: input.note ?? null,
        })
        .select()
        .single();

      if (error) throw error;
      return data as FinancialGoal;
    },

    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: goalKeys.all });

      const listKey = goalKeys.list(user!.id);
      const previous = queryClient.getQueryData<FinancialGoal[]>(listKey);

      const optimistic: FinancialGoal = {
        id: `temp-${Date.now()}`,
        user_id: user!.id,
        name: input.name,
        category: input.category,
        target_amount: input.target_amount,
        current_amount: 0,
        target_date: input.target_date ?? null,
        note: input.note ?? null,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      if (previous) {
        queryClient.setQueryData(listKey, [optimistic, ...previous]);
      }

      return { previous, listKey };
    },

    onError: (_err, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(context.listKey, context.previous);
      }
      showError('Gagal membuat goal. Silakan coba lagi.', () => {
        mutation.mutate(_input);
      });
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: goalKeys.all });
    },
  });

  return mutation;
}

/**
 * Updates an existing Financial Goal with optimistic cache update.
 * Requirement: 2.2
 */
export function useUpdateGoal() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { showError } = useToast();

  const mutation = useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: { id: string } & Partial<GoalFormInput>) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('financial_goals')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', user!.id)
        .select()
        .single();

      if (error) throw error;
      return data as FinancialGoal;
    },

    onMutate: async ({ id, ...updates }) => {
      await queryClient.cancelQueries({ queryKey: goalKeys.all });

      const listKey = goalKeys.list(user!.id);
      const previous = queryClient.getQueryData<FinancialGoal[]>(listKey);

      if (previous) {
        queryClient.setQueryData(
          listKey,
          previous.map((g) =>
            g.id === id
              ? { ...g, ...updates, updated_at: new Date().toISOString() }
              : g
          )
        );
      }

      // Also update the detail cache if it exists
      const detailKey = goalKeys.detail(id);
      const previousDetail = queryClient.getQueryData<FinancialGoal>(detailKey);
      if (previousDetail) {
        queryClient.setQueryData(detailKey, {
          ...previousDetail,
          ...updates,
          updated_at: new Date().toISOString(),
        });
      }

      return { previous, listKey, previousDetail, detailKey };
    },

    onError: (_err, variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(context.listKey, context.previous);
      }
      if (context?.previousDetail) {
        queryClient.setQueryData(context.detailKey, context.previousDetail);
      }
      showError('Gagal memperbarui goal. Silakan coba lagi.', () => {
        mutation.mutate(variables);
      });
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: goalKeys.all });
    },
  });

  return mutation;
}

/**
 * Deletes a Financial Goal with optimistic cache removal.
 * Requirements: 2.4
 */
export function useDeleteGoal() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { showError } = useToast();

  const mutation = useMutation({
    mutationFn: async (goalId: string) => {
      const supabase = createClient();
      const { error } = await supabase
        .from('financial_goals')
        .delete()
        .eq('id', goalId)
        .eq('user_id', user!.id);

      if (error) throw error;
    },

    onMutate: async (goalId) => {
      await queryClient.cancelQueries({ queryKey: goalKeys.all });

      const listKey = goalKeys.list(user!.id);
      const previous = queryClient.getQueryData<FinancialGoal[]>(listKey);

      if (previous) {
        queryClient.setQueryData(
          listKey,
          previous.filter((g) => g.id !== goalId)
        );
      }

      return { previous, listKey };
    },

    onError: (_err, goalId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(context.listKey, context.previous);
      }
      showError('Gagal menghapus goal. Silakan coba lagi.', () => {
        mutation.mutate(goalId);
      });
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: goalKeys.all });
    },
  });

  return mutation;
}

/**
 * Cancels a Financial Goal by setting status to 'cancelled' with optimistic update.
 * Requirement: 2.5
 */
export function useCancelGoal() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { showError } = useToast();

  const mutation = useMutation({
    mutationFn: async (goalId: string) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('financial_goals')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', goalId)
        .eq('user_id', user!.id)
        .select()
        .single();

      if (error) throw error;
      return data as FinancialGoal;
    },

    onMutate: async (goalId) => {
      await queryClient.cancelQueries({ queryKey: goalKeys.all });

      const listKey = goalKeys.list(user!.id);
      const previous = queryClient.getQueryData<FinancialGoal[]>(listKey);

      if (previous) {
        queryClient.setQueryData(
          listKey,
          previous.map((g) =>
            g.id === goalId
              ? { ...g, status: 'cancelled' as GoalStatus, updated_at: new Date().toISOString() }
              : g
          )
        );
      }

      // Also update the detail cache if it exists
      const detailKey = goalKeys.detail(goalId);
      const previousDetail = queryClient.getQueryData<FinancialGoal>(detailKey);
      if (previousDetail) {
        queryClient.setQueryData(detailKey, {
          ...previousDetail,
          status: 'cancelled' as GoalStatus,
          updated_at: new Date().toISOString(),
        });
      }

      return { previous, listKey, previousDetail, detailKey };
    },

    onError: (_err, goalId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(context.listKey, context.previous);
      }
      if (context?.previousDetail) {
        queryClient.setQueryData(context.detailKey, context.previousDetail);
      }
      showError('Gagal membatalkan goal. Silakan coba lagi.', () => {
        mutation.mutate(goalId);
      });
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: goalKeys.all });
    },
  });

  return mutation;
}

/**
 * Adds a contribution to a Financial Goal via RPC with optimistic update.
 * Requirements: 3.3, 4.3
 */
export function useAddContribution() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { showError } = useToast();

  const mutation = useMutation({
    mutationFn: async (input: { goalId: string; amount: number; note?: string }) => {
      const supabase = createClient();
      const { data, error } = await supabase.rpc('add_goal_contribution', {
        p_user_id: user!.id,
        p_goal_id: input.goalId,
        p_amount: input.amount,
        p_note: input.note ?? null,
      });

      if (error) throw error;
      return data as GoalContribution;
    },

    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: goalKeys.all });

      // Optimistically update the goal's current_amount in the list cache
      const listKey = goalKeys.list(user!.id);
      const previousList = queryClient.getQueryData<FinancialGoal[]>(listKey);

      if (previousList) {
        queryClient.setQueryData(
          listKey,
          previousList.map((g) => {
            if (g.id !== input.goalId) return g;
            const newAmount = g.current_amount + input.amount;
            return {
              ...g,
              current_amount: newAmount,
              status: (newAmount >= g.target_amount ? 'completed' : g.status) as GoalStatus,
              updated_at: new Date().toISOString(),
            };
          })
        );
      }

      // Optimistically update the detail cache
      const detailKey = goalKeys.detail(input.goalId);
      const previousDetail = queryClient.getQueryData<FinancialGoal>(detailKey);
      if (previousDetail) {
        const newAmount = previousDetail.current_amount + input.amount;
        queryClient.setQueryData(detailKey, {
          ...previousDetail,
          current_amount: newAmount,
          status: (newAmount >= previousDetail.target_amount ? 'completed' : previousDetail.status) as GoalStatus,
          updated_at: new Date().toISOString(),
        });
      }

      // Optimistically add contribution to the contributions cache
      const contribKey = goalKeys.contributions(input.goalId);
      const previousContribs = queryClient.getQueryData<GoalContribution[]>(contribKey);

      const optimisticContrib: GoalContribution = {
        id: `temp-${Date.now()}`,
        goal_id: input.goalId,
        user_id: user!.id,
        amount: input.amount,
        note: input.note ?? null,
        created_at: new Date().toISOString(),
      };

      if (previousContribs) {
        queryClient.setQueryData(contribKey, [optimisticContrib, ...previousContribs]);
      }

      return { previousList, listKey, previousDetail, detailKey, previousContribs, contribKey };
    },

    onError: (_err, input, context) => {
      if (context?.previousList) {
        queryClient.setQueryData(context.listKey, context.previousList);
      }
      if (context?.previousDetail) {
        queryClient.setQueryData(context.detailKey, context.previousDetail);
      }
      if (context?.previousContribs) {
        queryClient.setQueryData(context.contribKey, context.previousContribs);
      }
      showError('Gagal menambah kontribusi. Silakan coba lagi.', () => {
        mutation.mutate(input);
      });
    },

    onSettled: (_data, _err, input) => {
      queryClient.invalidateQueries({ queryKey: goalKeys.all });
      queryClient.invalidateQueries({ queryKey: goalKeys.contributions(input.goalId) });
    },
  });

  return mutation;
}

/**
 * Withdraws a contribution from a Financial Goal via RPC with optimistic update.
 * Requirements: 3.3, 4.3
 */
export function useWithdrawContribution() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { showError } = useToast();

  const mutation = useMutation({
    mutationFn: async (input: { goalId: string; amount: number; note?: string }) => {
      const supabase = createClient();
      const { data, error } = await supabase.rpc('withdraw_goal_contribution', {
        p_user_id: user!.id,
        p_goal_id: input.goalId,
        p_amount: input.amount,
        p_note: input.note ?? null,
      });

      if (error) throw error;
      return data as GoalContribution;
    },

    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: goalKeys.all });

      // Optimistically update the goal's current_amount in the list cache
      const listKey = goalKeys.list(user!.id);
      const previousList = queryClient.getQueryData<FinancialGoal[]>(listKey);

      if (previousList) {
        queryClient.setQueryData(
          listKey,
          previousList.map((g) => {
            if (g.id !== input.goalId) return g;
            const newAmount = g.current_amount - input.amount;
            return {
              ...g,
              current_amount: newAmount,
              status: (newAmount < g.target_amount && g.status === 'completed' ? 'active' : g.status) as GoalStatus,
              updated_at: new Date().toISOString(),
            };
          })
        );
      }

      // Optimistically update the detail cache
      const detailKey = goalKeys.detail(input.goalId);
      const previousDetail = queryClient.getQueryData<FinancialGoal>(detailKey);
      if (previousDetail) {
        const newAmount = previousDetail.current_amount - input.amount;
        queryClient.setQueryData(detailKey, {
          ...previousDetail,
          current_amount: newAmount,
          status: (newAmount < previousDetail.target_amount && previousDetail.status === 'completed' ? 'active' : previousDetail.status) as GoalStatus,
          updated_at: new Date().toISOString(),
        });
      }

      // Optimistically add negative contribution to the contributions cache
      const contribKey = goalKeys.contributions(input.goalId);
      const previousContribs = queryClient.getQueryData<GoalContribution[]>(contribKey);

      const optimisticContrib: GoalContribution = {
        id: `temp-${Date.now()}`,
        goal_id: input.goalId,
        user_id: user!.id,
        amount: -input.amount,
        note: input.note ?? null,
        created_at: new Date().toISOString(),
      };

      if (previousContribs) {
        queryClient.setQueryData(contribKey, [optimisticContrib, ...previousContribs]);
      }

      return { previousList, listKey, previousDetail, detailKey, previousContribs, contribKey };
    },

    onError: (_err, input, context) => {
      if (context?.previousList) {
        queryClient.setQueryData(context.listKey, context.previousList);
      }
      if (context?.previousDetail) {
        queryClient.setQueryData(context.detailKey, context.previousDetail);
      }
      if (context?.previousContribs) {
        queryClient.setQueryData(context.contribKey, context.previousContribs);
      }
      showError('Gagal menarik dana. Silakan coba lagi.', () => {
        mutation.mutate(input);
      });
    },

    onSettled: (_data, _err, input) => {
      queryClient.invalidateQueries({ queryKey: goalKeys.all });
      queryClient.invalidateQueries({ queryKey: goalKeys.contributions(input.goalId) });
    },
  });

  return mutation;
}
