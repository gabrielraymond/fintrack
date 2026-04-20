'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import type { TransactionFilters } from '@/types';
import { transactionKeys } from './useTransactions';

const PAGE_SIZE = 20;

export interface TransactionWithRelations {
  id: string;
  user_id: string;
  account_id: string;
  destination_account_id: string | null;
  category_id: string | null;
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  note: string | null;
  date: string;
  created_at: string;
  updated_at: string;
  category: { name: string; icon: string } | null;
  account: { name: string } | null;
}

async function fetchTransactions(
  userId: string,
  filters: TransactionFilters,
  pageParam: number,
) {
  const supabase = createClient();
  const offset = pageParam * PAGE_SIZE;

  let query = supabase
    .from('transactions')
    .select('*, category:categories(name, icon), account:accounts(name)')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  if (filters.accountId) {
    query = query.eq('account_id', filters.accountId);
  }
  if (filters.categoryId) {
    query = query.eq('category_id', filters.categoryId);
  }
  if (filters.type) {
    query = query.eq('type', filters.type);
  }
  if (filters.month) {
    const start = `${filters.month}-01`;
    const [year, month] = filters.month.split('-').map(Number);
    const lastDay = new Date(year, month, 0).getDate();
    const end = `${filters.month}-${String(lastDay).padStart(2, '0')}`;
    query = query.gte('date', start).lte('date', end);
  }
  if (filters.search) {
    query = query.or(
      `note.ilike.%${filters.search}%,category.name.ilike.%${filters.search}%`,
    );
  }

  const { data, error } = await query;
  if (error) throw error;

  return {
    items: (data ?? []) as TransactionWithRelations[],
    nextPage: (data ?? []).length === PAGE_SIZE ? pageParam + 1 : undefined,
  };
}

export function useInfiniteScroll(filters: TransactionFilters = {}) {
  const { user } = useAuth();
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const query = useInfiniteQuery({
    queryKey: [...transactionKeys.all, 'infinite', user?.id, filters],
    queryFn: ({ pageParam }) =>
      fetchTransactions(user!.id, filters, pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextPage,
    enabled: !!user,
  });

  const { fetchNextPage, hasNextPage, isFetchingNextPage } = query;

  const handleIntersect = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage],
  );

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(handleIntersect, {
      rootMargin: '200px',
    });
    observer.observe(node);

    return () => observer.disconnect();
  }, [handleIntersect]);

  const allItems =
    query.data?.pages.flatMap((page) => page.items) ?? [];

  return {
    data: allItems,
    isLoading: query.isLoading,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: query.hasNextPage ?? false,
    sentinelRef,
    error: query.error,
    refetch: query.refetch,
  };
}
