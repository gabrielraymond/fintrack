'use client';

import React from 'react';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import { useDashboardGoals } from '@/hooks/useGoals';
import { useGoals } from '@/hooks/useGoals';

export default function GoalsProgressSection() {
  const { data: topGoals, isLoading } = useDashboardGoals();
  const { data: allActiveGoals } = useGoals('active');

  if (isLoading) return null;
  if (!topGoals || topGoals.length === 0) return null;

  const hasMore = (allActiveGoals?.length ?? 0) > 3;

  return (
    <Card className="!p-3">
      <div className="flex justify-between items-center mb-2">
        <p className="text-[11px] text-text-secondary">Tujuan Keuangan</p>
        {hasMore && (
          <Link
            href="/goals"
            className="text-[11px] text-primary hover:underline"
          >
            Lihat Semua
          </Link>
        )}
      </div>
      <div className="space-y-2">
        {topGoals.map((goal) => {
          const progress =
            goal.target_amount > 0
              ? Math.round((goal.current_amount / goal.target_amount) * 100)
              : 0;

          return (
            <div key={goal.id}>
              <div className="flex justify-between items-center mb-0.5">
                <span className="text-[11px] text-text-primary font-medium">
                  {goal.name}
                </span>
                <span className="text-[11px] text-text-secondary">
                  {progress}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                  role="progressbar"
                  aria-valuenow={progress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
