'use client';

import React, { useMemo, useState } from 'react';
import SkeletonLoader from '@/components/ui/SkeletonLoader';
import ErrorState from '@/components/ui/ErrorState';
import FAB from '@/components/ui/FAB';
import TransactionModal from '@/components/transactions/TransactionModal';
import TransactionPresetChips from '@/components/transactions/TransactionPresetChips';
import NetWorthCard from '@/components/dashboard/NetWorthCard';
import AccountSummaryStrip from '@/components/dashboard/AccountSummaryStrip';
import MonthlySummaryCard, { useCurrentMonthTransactions } from '@/components/dashboard/MonthlySummaryCard';
import CashFlowChart from '@/components/dashboard/CashFlowChart';
import BudgetProgressSection from '@/components/dashboard/BudgetProgressSection';
import SavingsProgressSection from '@/components/dashboard/SavingsProgressSection';
import GoalsProgressSection from '@/components/dashboard/GoalsProgressSection';
import RecentTransactions from '@/components/dashboard/RecentTransactions';
import { useNetWorth } from '@/hooks/useNetWorth';
import { partitionAccounts } from '@/lib/accountClassifier';
import type { Account } from '@/types';

function CreditCardDueWarnings({ accounts }: { accounts: Account[] }) {
  const creditCards = accounts.filter(
    (a) => a.type === 'credit_card' && a.due_date !== null
  );

  const warnings = creditCards.filter((cc) => {
    const today = new Date();
    const currentDay = today.getDate();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    let dueMonth = currentMonth;
    let dueYear = currentYear;

    if (cc.due_date! < currentDay) {
      dueMonth += 1;
      if (dueMonth > 11) {
        dueMonth = 0;
        dueYear += 1;
      }
    }

    const nextDue = new Date(dueYear, dueMonth, cc.due_date!);
    const diffMs = nextDue.getTime() - today.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 7;
  });

  if (warnings.length === 0) return null;

  return (
    <div className="space-y-2">
      {warnings.map((cc) => (
        <div
          key={cc.id}
          className="flex items-center gap-2 rounded-lg border border-warning bg-warning/10 p-3"
          role="alert"
        >
          <span aria-hidden="true">⚠️</span>
          <p className="text-caption text-warning font-medium">
            Kartu kredit &quot;{cc.name}&quot; jatuh tempo tanggal {cc.due_date}
          </p>
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const { breakdown, accounts, isLoading: accountsLoading, error: accountsError, refetch: refetchAccounts } = useNetWorth();
  const { data: monthlyTransactions, isLoading: txLoading, error: txError, refetch: refetchTx } = useCurrentMonthTransactions();

  const { operational, savings } = useMemo(() => partitionAccounts(accounts), [accounts]);

  const isLoading = accountsLoading || txLoading;
  const hasError = accountsError || txError;

  if (hasError && !isLoading) {
    return (
      <div className="px-3 py-2 md:p-4 max-w-5xl mx-auto">
        <h1 className="text-body font-bold text-text-primary md:text-heading mb-3">Dashboard</h1>
        <ErrorState
          message="Gagal memuat data dashboard. Silakan coba lagi."
          onRetry={() => {
            refetchAccounts();
            refetchTx();
          }}
        />
      </div>
    );
  }

  return (
    <div className="px-3 py-2 md:p-4 max-w-5xl mx-auto space-y-3">
      <h1 className="text-body font-bold text-text-primary md:text-heading">Dashboard</h1>

      {/* Credit card due date warnings */}
      {!accountsLoading && <CreditCardDueWarnings accounts={accounts} />}

      {/* Transaction Preset Chips */}
      <TransactionPresetChips />

      {/* Net Worth + Monthly Summary — side by side on md+ */}
      {isLoading ? (
        <div className="grid md:grid-cols-2 gap-3">
          <SkeletonLoader height="5rem" shape="rect" />
          <SkeletonLoader height="5rem" shape="rect" />
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-3">
          <NetWorthCard total={breakdown.total} operational={breakdown.operational} savings={breakdown.savings} />
          <MonthlySummaryCard />
        </div>
      )}

      {/* Account Summary Strips */}
      {isLoading ? (
        <div className="flex gap-2 overflow-hidden">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonLoader key={i} width="120px" height="3rem" shape="rect" />
          ))}
        </div>
      ) : (
        <>
          <AccountSummaryStrip accounts={operational} label="Akun Operasional" />
          <AccountSummaryStrip accounts={savings} label="Simpanan & Investasi" />
        </>
      )}

      {/* Cash Flow Chart */}
      {isLoading ? (
        <SkeletonLoader height="12rem" shape="rect" />
      ) : (
        <CashFlowChart transactions={monthlyTransactions ?? []} />
      )}

      {/* Budget + Savings — side by side on md+ */}
      {isLoading ? (
        <SkeletonLoader height="8rem" shape="rect" />
      ) : (
        <div className="grid md:grid-cols-2 gap-3">
          <BudgetProgressSection />
          <SavingsProgressSection accounts={accounts} />
        </div>
      )}

      {/* Goals + Recent Transactions — side by side on md+ */}
      {isLoading ? (
        <SkeletonLoader height="8rem" shape="rect" />
      ) : (
        <div className="grid md:grid-cols-2 gap-3">
          <GoalsProgressSection />
          <RecentTransactions />
        </div>
      )}

      {/* FAB */}
      <FAB onClick={() => setModalOpen(true)} aria-label="Tambah transaksi baru">
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </FAB>

      {/* Transaction Modal */}
      <TransactionModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
