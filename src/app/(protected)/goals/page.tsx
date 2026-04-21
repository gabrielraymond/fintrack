'use client';

import React, { useState } from 'react';
import Button from '@/components/ui/Button';
import SkeletonLoader from '@/components/ui/SkeletonLoader';
import EmptyState from '@/components/ui/EmptyState';
import ErrorState from '@/components/ui/ErrorState';
import ConfirmationDialog from '@/components/ui/ConfirmationDialog';
import GoalCard from '@/components/goals/GoalCard';
import GoalForm from '@/components/goals/GoalForm';
import GoalDetailView from '@/components/goals/GoalDetailView';
import ContributionForm from '@/components/goals/ContributionForm';
import {
  useGoals,
  useCreateGoal,
  useUpdateGoal,
  useDeleteGoal,
  useCancelGoal,
  useAddContribution,
  useWithdrawContribution,
} from '@/hooks/useGoals';
import type { FinancialGoal, GoalFormInput, GoalStatus, ContributionFormInput } from '@/types';

const STATUS_TABS: { label: string; value: GoalStatus }[] = [
  { label: 'Aktif', value: 'active' },
  { label: 'Tercapai', value: 'completed' },
  { label: 'Dibatalkan', value: 'cancelled' },
];

export default function GoalsPage() {
  const [statusFilter, setStatusFilter] = useState<GoalStatus>('active');
  const { data: goals, isLoading, error, refetch } = useGoals(statusFilter);

  const createGoal = useCreateGoal();
  const updateGoal = useUpdateGoal();
  const deleteGoal = useDeleteGoal();
  const cancelGoal = useCancelGoal();
  const addContribution = useAddContribution();
  const withdrawContribution = useWithdrawContribution();

  // Form state
  const [formOpen, setFormOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<FinancialGoal | null>(null);

  // Detail view state
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState<FinancialGoal | null>(null);

  // Cancel confirmation state
  const [cancelTarget, setCancelTarget] = useState<FinancialGoal | null>(null);

  // Contribution form state
  const [contributionGoal, setContributionGoal] = useState<FinancialGoal | null>(null);
  const [contributionMode, setContributionMode] = useState<'add' | 'withdraw'>('add');

  // Handlers
  const handleCreate = (data: GoalFormInput) => {
    createGoal.mutate(data, {
      onSuccess: () => setFormOpen(false),
    });
  };

  const handleEdit = (data: GoalFormInput) => {
    if (!editingGoal) return;
    updateGoal.mutate(
      { id: editingGoal.id, ...data },
      { onSuccess: () => setEditingGoal(null) },
    );
  };

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    deleteGoal.mutate(deleteTarget.id, {
      onSuccess: () => {
        setDeleteTarget(null);
        if (selectedGoalId === deleteTarget.id) {
          setSelectedGoalId(null);
        }
      },
    });
  };

  const handleCancelConfirm = () => {
    if (!cancelTarget) return;
    cancelGoal.mutate(cancelTarget.id, {
      onSuccess: () => setCancelTarget(null),
    });
  };

  const handleAddContribution = (data: ContributionFormInput) => {
    if (!contributionGoal) return;
    addContribution.mutate(
      { goalId: contributionGoal.id, amount: data.amount, note: data.note },
      { onSuccess: () => setContributionGoal(null) },
    );
  };

  const handleWithdrawContribution = (data: ContributionFormInput) => {
    if (!contributionGoal) return;
    withdrawContribution.mutate(
      { goalId: contributionGoal.id, amount: data.amount, note: data.note },
      { onSuccess: () => setContributionGoal(null) },
    );
  };

  const openContributionForm = (goal: FinancialGoal, mode: 'add' | 'withdraw') => {
    setContributionGoal(goal);
    setContributionMode(mode);
  };

  // Find the selected goal from the list for contribution forms triggered from detail view
  const selectedGoal = goals?.find((g) => g.id === selectedGoalId) ?? null;

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-heading text-text-primary">Tujuan Keuangan</h1>
        <Button variant="primary" onClick={() => setFormOpen(true)}>
          Tambah Goal
        </Button>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2 mb-4" role="tablist" aria-label="Filter status goal">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            role="tab"
            aria-selected={statusFilter === tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={`px-4 py-2 rounded-lg text-body font-medium transition-colors ${
              statusFilter === tab.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-surface-secondary text-text-secondary hover:bg-surface-secondary/80'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="space-y-4" role="status" aria-label="Memuat goals...">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonLoader key={i} height="8rem" shape="rect" />
          ))}
        </div>
      )}

      {/* Error state */}
      {!isLoading && error && (
        <ErrorState
          message="Gagal memuat daftar goal. Silakan coba lagi."
          onRetry={() => refetch()}
        />
      )}

      {/* Empty state */}
      {!isLoading && !error && (!goals || goals.length === 0) && (
        <EmptyState
          title="Belum ada goal"
          description="Buat tujuan keuangan untuk mulai melacak progres tabungan Anda."
          actionLabel="Tambah Goal"
          onAction={() => setFormOpen(true)}
        />
      )}

      {/* Goal cards */}
      {!isLoading && !error && goals && goals.length > 0 && (
        <div className="space-y-4">
          {goals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onEdit={(g) => setEditingGoal(g)}
              onDelete={(g) => setDeleteTarget(g)}
              onCancel={(g) => setCancelTarget(g)}
              onClick={(g) => setSelectedGoalId(g.id)}
            />
          ))}
        </div>
      )}

      {/* Goal detail view */}
      {selectedGoalId && (
        <div className="mt-6">
          <GoalDetailView
            goalId={selectedGoalId}
            onAddContribution={() => {
              if (selectedGoal) openContributionForm(selectedGoal, 'add');
            }}
            onWithdrawContribution={() => {
              if (selectedGoal) openContributionForm(selectedGoal, 'withdraw');
            }}
            onCancel={() => {
              if (selectedGoal) setCancelTarget(selectedGoal);
            }}
            onClose={() => setSelectedGoalId(null)}
          />
        </div>
      )}

      {/* Create form */}
      <GoalForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleCreate}
        loading={createGoal.isPending}
      />

      {/* Edit form */}
      <GoalForm
        open={!!editingGoal}
        onClose={() => setEditingGoal(null)}
        onSubmit={handleEdit}
        loading={updateGoal.isPending}
        goal={editingGoal}
      />

      {/* Contribution form */}
      <ContributionForm
        open={!!contributionGoal}
        onClose={() => setContributionGoal(null)}
        onSubmit={contributionMode === 'add' ? handleAddContribution : handleWithdrawContribution}
        mode={contributionMode}
        currentAmount={contributionGoal?.current_amount ?? 0}
        loading={contributionMode === 'add' ? addContribution.isPending : withdrawContribution.isPending}
      />

      {/* Delete confirmation */}
      <ConfirmationDialog
        open={!!deleteTarget}
        title="Hapus Goal"
        description={`Apakah Anda yakin ingin menghapus goal "${deleteTarget?.name ?? ''}"? Semua data kontribusi terkait juga akan dihapus.`}
        confirmLabel="Hapus"
        cancelLabel="Batal"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Cancel confirmation */}
      <ConfirmationDialog
        open={!!cancelTarget}
        title="Batalkan Goal"
        description={`Apakah Anda yakin ingin membatalkan goal "${cancelTarget?.name ?? ''}"? Goal yang dibatalkan tidak dapat diaktifkan kembali.`}
        confirmLabel="Batalkan"
        cancelLabel="Kembali"
        onConfirm={handleCancelConfirm}
        onCancel={() => setCancelTarget(null)}
      />
    </div>
  );
}
