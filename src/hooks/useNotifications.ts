'use client';

import { useEffect, useRef } from 'react';
import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import type { Notification } from '@/types';
import { evaluateCreditCardReminders } from '@/lib/notifications';

// ── Query Keys ──────────────────────────────────────────────
export const notificationKeys = {
  all: ['notifications'] as const,
  unread: (userId: string) => [...notificationKeys.all, 'unread', userId] as const,
  list: (userId: string) => [...notificationKeys.all, 'list', userId] as const,
};

// ── Hooks ───────────────────────────────────────────────────

/**
 * Polls unread notification count every 60 seconds.
 * Requirements: 4.2, 5.3
 */
export function useUnreadCount() {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: notificationKeys.unread(user?.id ?? ''),
    queryFn: async () => {
      const supabase = createClient();
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user!.id)
        .eq('is_read', false);

      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!user,
    refetchInterval: 60_000,
  });

  return { count: query.data ?? 0, isLoading: query.isLoading };
}


/**
 * Fetches all notifications ordered by created_at DESC.
 * On first load, evaluates credit card reminders.
 * Requirements: 4.3, 5.3, 2.1, 2.2, 2.3
 */
export function useNotifications() {
  const { user } = useAuth();
  const ccEvaluatedRef = useRef(false);

  const query = useQuery<Notification[]>({
    queryKey: notificationKeys.list(user?.id ?? ''),
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data as Notification[]) ?? [];
    },
    enabled: !!user,
  });

  // Task 5.6: On first load, evaluate credit card reminders
  useEffect(() => {
    if (!user || ccEvaluatedRef.current) return;
    ccEvaluatedRef.current = true;

    const evaluateCC = async () => {
      try {
        const supabase = createClient();
        const { data: accounts } = await supabase
          .from('accounts')
          .select('*')
          .eq('user_id', user.id)
          .eq('type', 'credit_card')
          .eq('is_deleted', false);

        if (accounts && accounts.length > 0) {
          await evaluateCreditCardReminders(user.id, accounts);
        }
      } catch {
        // Non-blocking: CC reminder evaluation failure shouldn't break the app
      }
    };

    evaluateCC();
  }, [user]);

  return query;
}

/**
 * Marks a single notification as read.
 * Requirements: 4.4
 */
export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const supabase = createClient();
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
        .eq('user_id', user!.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

/**
 * Marks all notifications as read.
 * Requirements: 4.6
 */
export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async () => {
      const supabase = createClient();
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user!.id)
        .eq('is_read', false);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}
