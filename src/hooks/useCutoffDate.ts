'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/providers/AuthProvider';

const DEFAULT_CUTOFF_DATE = 1;

export function useCutoffDate() {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ['user-profile', 'cutoff-date', user?.id],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('user_profiles')
        .select('cutoff_date')
        .eq('id', user!.id)
        .single();

      if (error) throw error;
      return data?.cutoff_date ?? DEFAULT_CUTOFF_DATE;
    },
    enabled: !!user,
  });

  return {
    cutoffDate: query.data ?? DEFAULT_CUTOFF_DATE,
    isLoading: query.isLoading,
    isReady: query.isFetched && !query.isLoading,
  };
}
