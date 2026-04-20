'use client';

import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/providers/ToastProvider';
import type { Category, CategoryFormInput } from '@/types';

// ── Query Keys ──────────────────────────────────────────────
export const categoryKeys = {
  all: ['categories'] as const,
  list: (userId: string) =>
    [...categoryKeys.all, 'list', userId] as const,
};

// ── Data Fetchers ───────────────────────────────────────────

async function fetchCategories(userId: string): Promise<Category[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('user_id', userId)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data as Category[]) ?? [];
}

// ── Hooks ───────────────────────────────────────────────────

/**
 * Fetches all categories for the current user.
 * Requirements: 15.1, 15.2
 */
export function useCategories() {
  const { user } = useAuth();

  return useQuery({
    queryKey: categoryKeys.list(user?.id ?? ''),
    queryFn: () => fetchCategories(user!.id),
    enabled: !!user,
  });
}

/**
 * Creates a new custom category.
 * Requirement 15.2
 */
export function useCreateCategory() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { showError } = useToast();

  const mutation = useMutation({
    mutationFn: async (input: CategoryFormInput) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('categories')
        .insert({
          user_id: user!.id,
          name: input.name,
          icon: input.icon,
          is_default: false,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Category;
    },

    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: categoryKeys.all });

      const listKey = categoryKeys.list(user!.id);
      const previous = queryClient.getQueryData<Category[]>(listKey);

      const optimistic: Category = {
        id: `temp-${Date.now()}`,
        user_id: user!.id,
        name: input.name,
        icon: input.icon,
        is_default: false,
        created_at: new Date().toISOString(),
      };

      if (previous) {
        queryClient.setQueryData(listKey, [...previous, optimistic]);
      }

      return { previous, listKey };
    },

    onError: (_err, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(context.listKey, context.previous);
      }
      showError('Gagal membuat kategori. Silakan coba lagi.', () => {
        mutation.mutate(_input);
      });
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
    },
  });

  return mutation;
}

/**
 * Updates an existing category name or icon.
 * Requirement 15.3
 */
export function useUpdateCategory() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { showError } = useToast();

  const mutation = useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: { id: string } & Partial<Pick<Category, 'name' | 'icon'>>) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('categories')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user!.id)
        .select()
        .single();

      if (error) throw error;
      return data as Category;
    },

    onMutate: async ({ id, ...updates }) => {
      await queryClient.cancelQueries({ queryKey: categoryKeys.all });

      const listKey = categoryKeys.list(user!.id);
      const previous = queryClient.getQueryData<Category[]>(listKey);

      if (previous) {
        queryClient.setQueryData(
          listKey,
          previous.map((c) => (c.id === id ? { ...c, ...updates } : c))
        );
      }

      return { previous, listKey };
    },

    onError: (_err, variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(context.listKey, context.previous);
      }
      showError('Gagal memperbarui kategori. Silakan coba lagi.', () => {
        mutation.mutate(variables);
      });
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
    },
  });

  return mutation;
}

/**
 * Deletes a category, but first checks if it has associated transactions.
 * If transactions exist, shows error toast and aborts.
 * Requirement 15.3, 15.4
 */
export function useDeleteCategory() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { showError } = useToast();

  const mutation = useMutation({
    mutationFn: async (categoryId: string) => {
      const supabase = createClient();

      // Check if category has associated transactions
      const { count, error: countError } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .eq('category_id', categoryId)
        .eq('user_id', user!.id);

      if (countError) throw countError;

      if (count && count > 0) {
        throw new Error(
          'Kategori tidak dapat dihapus karena masih digunakan oleh transaksi.'
        );
      }

      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId)
        .eq('user_id', user!.id);

      if (error) throw error;
      return categoryId;
    },

    onMutate: async (categoryId) => {
      await queryClient.cancelQueries({ queryKey: categoryKeys.all });

      const listKey = categoryKeys.list(user!.id);
      const previous = queryClient.getQueryData<Category[]>(listKey);

      if (previous) {
        queryClient.setQueryData(
          listKey,
          previous.filter((c) => c.id !== categoryId)
        );
      }

      return { previous, listKey };
    },

    onError: (_err, _categoryId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(context.listKey, context.previous);
      }
      const message =
        _err instanceof Error
          ? _err.message
          : 'Gagal menghapus kategori. Silakan coba lagi.';
      showError(message, () => {
        mutation.mutate(_categoryId);
      });
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
    },
  });

  return mutation;
}
