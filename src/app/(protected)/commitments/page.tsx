'use client';

import React, { useState, useMemo, Suspense, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import SkeletonLoader from '@/components/ui/SkeletonLoader';
import EmptyState from '@/components/ui/EmptyState';
import ConfirmationDialog from '@/components/ui/ConfirmationDialog';
import AccountLimitSummary from '@/components/commitments/AccountLimitSummary';
import InstallmentCard from '@/components/commitments/InstallmentCard';
import InstallmentForm from '@/components/commitments/InstallmentForm';
import RecurringCommitmentCard from '@/components/commitments/RecurringCommitmentCard';
import RecurringCommitmentForm from '@/components/commitments/RecurringCommitmentForm';
import {
  useActiveInstallments,
  useInstallmentPaymentLogs,
  useCreateInstallment,
  useUpdateInstallment,
  useDeleteInstallment,
  useConfirmPayment,
} from '@/hooks/useInstallments';
import {
  useAllCommitments,
  useCreateCommitment,
  useUpdateCommitment,
  useDeleteCommitment,
  useToggleCommitmentActive,
} from '@/hooks/useRecurringCommitments';
import { useCommitmentLimits } from '@/hooks/useCommitmentLimits';
import { useAccounts } from '@/hooks/useAccounts';
import { useFormatIDR } from '@/hooks/useFormatIDR';
import { useAuth } from '@/providers/AuthProvider';
import { evaluateCommitmentAlerts, evaluatePaymentDueToday } from '@/lib/notifications';
import type {
  Installment,
  RecurringCommitment,
  InstallmentFormInput,
  RecurringCommitmentFormInput,
} from '@/types';

// ── currentMonth helper ──────────────────────────────────────
function getCurrentMonth(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}-01`;
}

// ── Inner page (uses useSearchParams) ───────────────────────
function CommitmentsPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const formatIDR = useFormatIDR();
  const { user } = useAuth();

  const today = new Date();
  const currentMonth = getCurrentMonth();

  // ── Data fetching ──────────────────────────────────────────
  const { data: accountsData, isLoading: accountsLoading } = useAccounts();
  const accounts = useMemo(() => accountsData?.data ?? [], [accountsData?.data]);

  const { data: installments = [], isLoading: installmentsLoading } = useActiveInstallments();
  const { data: allCommitments = [], isLoading: commitmentsLoading } = useAllCommitments();
  const { data: paymentLogs = [], isLoading: logsLoading } = useInstallmentPaymentLogs(currentMonth);
  const { data: limitData, isLoading: limitsLoading } = useCommitmentLimits(accounts);

  const isLoading =
    accountsLoading || installmentsLoading || commitmentsLoading || logsLoading || limitsLoading;

  // ── Evaluate notifications when data is ready ──────────────
  useEffect(() => {
    if (isLoading || !user || accounts.length === 0) return;

    const accountMap = Object.fromEntries(accounts.map((a) => [a.id, a]));

    // Fire-and-forget — errors are logged inside the functions
    evaluateCommitmentAlerts(user.id, accounts, installments, allCommitments).catch(
      (err) => console.error('evaluateCommitmentAlerts error:', err)
    );
    evaluatePaymentDueToday(user.id, installments, accountMap, today).catch(
      (err) => console.error('evaluatePaymentDueToday error:', err)
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);

  // ── Mutations ──────────────────────────────────────────────
  const createInstallment = useCreateInstallment();
  const updateInstallment = useUpdateInstallment();
  const deleteInstallment = useDeleteInstallment();
  const confirmPayment = useConfirmPayment();

  const createCommitment = useCreateCommitment();
  const updateCommitment = useUpdateCommitment();
  const deleteCommitment = useDeleteCommitment();
  const toggleCommitmentActive = useToggleCommitmentActive();

  // ── Selected account (from query param or local state) ────
  const queryAccountId = searchParams.get('account');
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(
    queryAccountId ?? null
  );

  // Sync query param changes to local state
  React.useEffect(() => {
    if (queryAccountId) {
      setSelectedAccountId(queryAccountId);
    }
  }, [queryAccountId]);

  const handleSelectAccount = (accountId: string) => {
    const next = selectedAccountId === accountId ? null : accountId;
    setSelectedAccountId(next);
    // Update URL query param
    if (next) {
      router.replace(`/commitments?account=${next}`, { scroll: false });
    } else {
      router.replace('/commitments', { scroll: false });
    }
  };

  // ── Installment form state ─────────────────────────────────
  const [installmentFormOpen, setInstallmentFormOpen] = useState(false);
  const [editingInstallment, setEditingInstallment] = useState<Installment | null>(null);
  const [deleteInstallmentTarget, setDeleteInstallmentTarget] = useState<Installment | null>(null);

  // ── Commitment form state ──────────────────────────────────
  const [commitmentFormOpen, setCommitmentFormOpen] = useState(false);
  const [editingCommitment, setEditingCommitment] = useState<RecurringCommitment | null>(null);
  const [deleteCommitmentTarget, setDeleteCommitmentTarget] = useState<RecurringCommitment | null>(null);

  // ── Accounts that have active installments OR any commitments ──
  const activeAccountIds = useMemo(() => {
    const ids = new Set<string>();
    installments.forEach((i) => ids.add(i.account_id));
    allCommitments.forEach((c) => ids.add(c.account_id));
    return ids;
  }, [installments, allCommitments]);

  const activeAccounts = useMemo(
    () => accounts.filter((a) => activeAccountIds.has(a.id)),
    [accounts, activeAccountIds]
  );

  // ── Total monthly obligation across all accounts ───────────
  const totalMonthlyObligation = useMemo(() => {
    return Object.values(limitData).reduce(
      (sum, d) => sum + d.totalMonthlyObligation,
      0
    );
  }, [limitData]);

  // ── Per-account data for selected account ─────────────────
  const selectedAccountInstallments = useMemo(
    () => installments.filter((i) => i.account_id === selectedAccountId),
    [installments, selectedAccountId]
  );

  const selectedAccountCommitments = useMemo(
    () => allCommitments.filter((c) => c.account_id === selectedAccountId),
    [allCommitments, selectedAccountId]
  );

  // ── Handlers: Installments ─────────────────────────────────
  const handleCreateInstallment = (
    data: InstallmentFormInput & { installment_type: 'cc' | 'non_cc' }
  ) => {
    createInstallment.mutate(data, {
      onSuccess: () => setInstallmentFormOpen(false),
    });
  };

  const handleEditInstallment = (
    data: InstallmentFormInput & { installment_type: 'cc' | 'non_cc' }
  ) => {
    if (!editingInstallment) return;
    updateInstallment.mutate(
      { id: editingInstallment.id, ...data },
      { onSuccess: () => setEditingInstallment(null) }
    );
  };

  const handleDeleteInstallmentConfirm = () => {
    if (!deleteInstallmentTarget) return;
    deleteInstallment.mutate(deleteInstallmentTarget.id, {
      onSuccess: () => setDeleteInstallmentTarget(null),
    });
  };

  const handleConfirmPayment = (installmentId: string) => {
    confirmPayment.mutate({ installmentId, paymentMonth: currentMonth });
  };

  // ── Handlers: Commitments ──────────────────────────────────
  const handleCreateCommitment = (data: RecurringCommitmentFormInput) => {
    createCommitment.mutate(data, {
      onSuccess: () => setCommitmentFormOpen(false),
    });
  };

  const handleEditCommitment = (data: RecurringCommitmentFormInput) => {
    if (!editingCommitment) return;
    updateCommitment.mutate(
      { id: editingCommitment.id, ...data },
      { onSuccess: () => setEditingCommitment(null) }
    );
  };

  const handleDeleteCommitmentConfirm = () => {
    if (!deleteCommitmentTarget) return;
    deleteCommitment.mutate(deleteCommitmentTarget.id, {
      onSuccess: () => setDeleteCommitmentTarget(null),
    });
  };

  const handleToggleCommitmentActive = (id: string, isActive: boolean) => {
    toggleCommitmentActive.mutate({ id, isActive });
  };

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className="p-4 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <h1 className="text-heading text-text-primary">Cicilan &amp; Komitmen</h1>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={() => setCommitmentFormOpen(true)}
          >
            Tambah Komitmen
          </Button>
          <Button
            variant="primary"
            onClick={() => setInstallmentFormOpen(true)}
          >
            Tambah Cicilan
          </Button>
        </div>
      </div>

      {/* Skeleton loader */}
      {isLoading && (
        <div className="space-y-4" role="status" aria-label="Memuat data cicilan dan komitmen...">
          <SkeletonLoader height="4rem" shape="rect" />
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonLoader key={i} height="8rem" shape="rect" />
          ))}
        </div>
      )}

      {/* Content */}
      {!isLoading && (
        <>
          {/* Empty state */}
          {activeAccounts.length === 0 ? (
            <EmptyState
              title="Belum ada cicilan atau komitmen"
              description="Tambahkan cicilan atau komitmen berulang untuk mulai melacak kewajiban finansial Anda."
              actionLabel="Tambah Cicilan"
              onAction={() => setInstallmentFormOpen(true)}
            />
          ) : (
            <>
              {/* Total monthly obligation summary */}
              <div className="mb-6 p-4 bg-surface-secondary rounded-xl border border-border">
                <p className="text-caption text-text-secondary mb-1">
                  Total Kewajiban Bulanan (Semua Akun)
                </p>
                <p className="text-subheading font-bold text-text-primary">
                  {formatIDR(totalMonthlyObligation)}
                </p>
              </div>

              {/* Account list */}
              <div className="space-y-4">
                {activeAccounts.map((account) => {
                  const limit = limitData[account.id];
                  const isSelected = selectedAccountId === account.id;

                  return (
                    <div key={account.id}>
                      {/* AccountLimitSummary — clickable to expand */}
                      <button
                        type="button"
                        className="w-full text-left focus:outline-none focus:ring-2 focus:ring-primary rounded-xl"
                        onClick={() => handleSelectAccount(account.id)}
                        aria-expanded={isSelected}
                        aria-controls={`account-detail-${account.id}`}
                      >
                        <AccountLimitSummary
                          account={account}
                          totalMonthlyObligation={limit?.totalMonthlyObligation ?? 0}
                          currentEffectiveLimit={limit?.currentEffectiveLimit ?? null}
                          projectedEffectiveLimit={limit?.projectedEffectiveLimit ?? null}
                        />
                      </button>

                      {/* Account detail: installments + commitments */}
                      {isSelected && (
                        <div
                          id={`account-detail-${account.id}`}
                          className="mt-3 pl-2 border-l-2 border-primary/30 space-y-4"
                        >
                          {/* Active installments */}
                          {selectedAccountInstallments.length > 0 && (
                            <div>
                              <h2 className="text-caption font-semibold text-text-secondary mb-2 uppercase tracking-wide">
                                Cicilan Aktif
                              </h2>
                              <div className="space-y-2">
                                {selectedAccountInstallments.map((installment) => {
                                  const paymentLog =
                                    paymentLogs.find(
                                      (log) => log.installment_id === installment.id
                                    ) ?? null;
                                  return (
                                    <InstallmentCard
                                      key={installment.id}
                                      installment={installment}
                                      paymentLog={paymentLog}
                                      today={today}
                                      onConfirmPayment={handleConfirmPayment}
                                      onEdit={(i) => setEditingInstallment(i)}
                                      onDelete={(i) => setDeleteInstallmentTarget(i)}
                                    />
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Recurring commitments (all: active + inactive) */}
                          {selectedAccountCommitments.length > 0 && (
                            <div>
                              <h2 className="text-caption font-semibold text-text-secondary mb-2 uppercase tracking-wide">
                                Komitmen Berulang
                              </h2>
                              <div className="space-y-2">
                                {selectedAccountCommitments.map((commitment) => (
                                  <RecurringCommitmentCard
                                    key={commitment.id}
                                    commitment={commitment}
                                    onToggleActive={handleToggleCommitmentActive}
                                    onEdit={(c) => setEditingCommitment(c)}
                                    onDelete={(c) => setDeleteCommitmentTarget(c)}
                                  />
                                ))}
                              </div>
                            </div>
                          )}

                          {/* No items for this account */}
                          {selectedAccountInstallments.length === 0 &&
                            selectedAccountCommitments.length === 0 && (
                              <p className="text-caption text-text-muted py-2">
                                Tidak ada cicilan atau komitmen untuk akun ini.
                              </p>
                            )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}

      {/* ── Installment Forms ── */}
      <InstallmentForm
        open={installmentFormOpen}
        onClose={() => setInstallmentFormOpen(false)}
        onSubmit={handleCreateInstallment}
        loading={createInstallment.isPending}
        accounts={accounts}
      />

      <InstallmentForm
        open={!!editingInstallment}
        onClose={() => setEditingInstallment(null)}
        onSubmit={handleEditInstallment}
        loading={updateInstallment.isPending}
        installment={editingInstallment}
        accounts={accounts}
      />

      {/* ── Commitment Forms ── */}
      <RecurringCommitmentForm
        open={commitmentFormOpen}
        onClose={() => setCommitmentFormOpen(false)}
        onSubmit={handleCreateCommitment}
        loading={createCommitment.isPending}
        accounts={accounts}
      />

      <RecurringCommitmentForm
        open={!!editingCommitment}
        onClose={() => setEditingCommitment(null)}
        onSubmit={handleEditCommitment}
        loading={updateCommitment.isPending}
        commitment={editingCommitment}
        accounts={accounts}
      />

      {/* ── Delete Confirmations ── */}
      <ConfirmationDialog
        open={!!deleteInstallmentTarget}
        title="Hapus Cicilan"
        description={`Apakah Anda yakin ingin menghapus cicilan "${deleteInstallmentTarget?.name ?? ''}"? Data cicilan ini akan dihapus permanen.`}
        confirmLabel="Hapus"
        cancelLabel="Batal"
        onConfirm={handleDeleteInstallmentConfirm}
        onCancel={() => setDeleteInstallmentTarget(null)}
      />

      <ConfirmationDialog
        open={!!deleteCommitmentTarget}
        title="Hapus Komitmen"
        description={`Apakah Anda yakin ingin menghapus komitmen "${deleteCommitmentTarget?.name ?? ''}"? Data komitmen ini akan dihapus permanen.`}
        confirmLabel="Hapus"
        cancelLabel="Batal"
        onConfirm={handleDeleteCommitmentConfirm}
        onCancel={() => setDeleteCommitmentTarget(null)}
      />
    </div>
  );
}

// ── Page wrapper with Suspense (required for useSearchParams) ─
export default function CommitmentsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-4 max-w-5xl mx-auto space-y-4" role="status" aria-label="Memuat...">
          <SkeletonLoader height="2.5rem" shape="rect" width="50%" />
          <SkeletonLoader height="4rem" shape="rect" />
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonLoader key={i} height="8rem" shape="rect" />
          ))}
        </div>
      }
    >
      <CommitmentsPageInner />
    </Suspense>
  );
}
