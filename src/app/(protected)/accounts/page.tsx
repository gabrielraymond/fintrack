'use client';

import React, { useState, useMemo } from 'react';
import Button from '@/components/ui/Button';
import SkeletonLoader from '@/components/ui/SkeletonLoader';
import EmptyState from '@/components/ui/EmptyState';
import ErrorState from '@/components/ui/ErrorState';
import ConfirmationDialog from '@/components/ui/ConfirmationDialog';
import AccountCard from '@/components/accounts/AccountCard';
import AccountForm from '@/components/accounts/AccountForm';
import SoftDeletedAccounts from '@/components/accounts/SoftDeletedAccounts';
import {
  useAccounts,
  useCreateAccount,
  useUpdateAccount,
  useSoftDeleteAccount,
} from '@/hooks/useAccounts';
import { partitionAccounts } from '@/lib/accountClassifier';
import type { Account, AccountType } from '@/types';

export default function AccountsPage() {
  const [page, setPage] = useState(0);
  const { data, isLoading, error, refetch } = useAccounts(page);

  const createAccount = useCreateAccount();
  const updateAccount = useUpdateAccount();
  const softDelete = useSoftDeleteAccount();

  // Form state
  const [formOpen, setFormOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState<Account | null>(null);

  // Soft-deleted toggle
  const [showDeleted, setShowDeleted] = useState(false);

  const accounts = useMemo(() => data?.data ?? [], [data?.data]);
  const totalCount = data?.count ?? 0;
  const totalPages = Math.ceil(totalCount / 20);

  const { operational: regularAccounts, savings: savingsAccounts } = useMemo(
    () => partitionAccounts(accounts),
    [accounts],
  );

  const handleCreate = (formData: {
    name: string;
    type: AccountType;
    balance: number;
    credit_limit?: number;
    due_date?: number;
    target_amount?: number;
  }) => {
    createAccount.mutate(formData, {
      onSuccess: () => setFormOpen(false),
    });
  };

  const handleEdit = (formData: {
    name: string;
    type: AccountType;
    balance: number;
    credit_limit?: number;
    due_date?: number;
    target_amount?: number;
  }) => {
    if (!editingAccount) return;
    updateAccount.mutate(
      { id: editingAccount.id, name: formData.name, type: formData.type },
      { onSuccess: () => setEditingAccount(null) },
    );
  };

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    softDelete.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
    });
  };

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-heading text-text-primary">Akun</h1>
        <Button variant="primary" onClick={() => setFormOpen(true)}>
          Tambah Akun
        </Button>
      </div>

      {/* Error state */}
      {!isLoading && error && (
        <ErrorState
          message="Gagal memuat daftar akun. Silakan coba lagi."
          onRetry={() => refetch()}
        />
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="space-y-4" role="status" aria-label="Memuat akun...">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonLoader key={i} height="8rem" shape="rect" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && accounts.length === 0 && (
        <EmptyState
          title="Belum ada akun"
          description="Buat akun pertama Anda untuk mulai melacak keuangan."
          actionLabel="Tambah Akun"
          onAction={() => setFormOpen(true)}
        />
      )}

      {/* Account cards */}
      {!isLoading && !error && accounts.length > 0 && (
        <>
          {/* Regular accounts */}
          {regularAccounts.length > 0 && (
            <div className="space-y-4">
              {regularAccounts.map((account) => (
                <AccountCard
                  key={account.id}
                  account={account}
                  onEdit={(a) => setEditingAccount(a)}
                  onDelete={(a) => setDeleteTarget(a)}
                />
              ))}
            </div>
          )}

          {/* Savings & Emergency Fund section */}
          {savingsAccounts.length > 0 && (
            <div className={regularAccounts.length > 0 ? 'mt-8' : ''}>
              <h2 className="text-subheading text-text-primary mb-4">
                Tabungan, Investasi &amp; Dana Darurat
              </h2>
              <div className="space-y-4">
                {savingsAccounts.map((account) => (
                  <AccountCard
                    key={account.id}
                    account={account}
                    onEdit={(a) => setEditingAccount(a)}
                    onDelete={(a) => setDeleteTarget(a)}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <Button
            variant="ghost"
            size="sm"
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
          >
            Sebelumnya
          </Button>
          <span className="text-caption text-text-secondary self-center">
            {page + 1} / {totalPages}
          </span>
          <Button
            variant="ghost"
            size="sm"
            disabled={page >= totalPages - 1}
            onClick={() => setPage((p) => p + 1)}
          >
            Berikutnya
          </Button>
        </div>
      )}

      {/* Soft-deleted accounts section */}
      <SoftDeletedAccounts
        show={showDeleted}
        onToggle={() => setShowDeleted((s) => !s)}
      />

      {/* Create form */}
      <AccountForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleCreate}
        loading={createAccount.isPending}
      />

      {/* Edit form */}
      <AccountForm
        open={!!editingAccount}
        onClose={() => setEditingAccount(null)}
        onSubmit={handleEdit}
        loading={updateAccount.isPending}
        account={editingAccount}
      />

      {/* Delete confirmation */}
      <ConfirmationDialog
        open={!!deleteTarget}
        title="Hapus Akun"
        description={`Apakah Anda yakin ingin menghapus akun "${deleteTarget?.name ?? ''}"? Akun akan disembunyikan tetapi data transaksi tetap tersimpan.`}
        confirmLabel="Hapus"
        cancelLabel="Batal"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
