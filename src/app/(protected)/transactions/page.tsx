'use client';

import React, { useState, useCallback } from 'react';
import SkeletonLoader from '@/components/ui/SkeletonLoader';
import EmptyState from '@/components/ui/EmptyState';
import ErrorState from '@/components/ui/ErrorState';
import ConfirmationDialog from '@/components/ui/ConfirmationDialog';
import TransactionList from '@/components/transactions/TransactionList';
import TransactionSearch from '@/components/transactions/TransactionSearch';
import TransactionFilters from '@/components/transactions/TransactionFilters';
import TransactionModal from '@/components/transactions/TransactionModal';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { useDeleteTransaction } from '@/hooks/useTransactions';
import { formatIDR, formatDate } from '@/lib/formatters';
import type { TransactionFilters as TFilters } from '@/types';
import type { TransactionWithRelations } from '@/hooks/useInfiniteScroll';

export default function TransactionsPage() {
  const [filters, setFilters] = useState<TFilters>({});
  const [editingTransaction, setEditingTransaction] = useState<TransactionWithRelations | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TransactionWithRelations | null>(null);

  const deleteMutation = useDeleteTransaction();

  const handleSearchChange = useCallback((search: string) => {
    setFilters((prev) => ({ ...prev, search: search || undefined }));
  }, []);

  const handleFilterChange = useCallback((newFilters: TFilters) => {
    setFilters((prev) => ({ ...newFilters, search: prev.search }));
  }, []);

  const handleEdit = useCallback((tx: TransactionWithRelations) => {
    setEditingTransaction(tx);
  }, []);

  const handleDelete = useCallback((tx: TransactionWithRelations) => {
    setDeleteTarget(tx);
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id);
    setDeleteTarget(null);
  }, [deleteTarget, deleteMutation]);

  const handleDeleteCancel = useCallback(() => {
    setDeleteTarget(null);
  }, []);

  const {
    data,
    isLoading,
    isFetchingNextPage,
    sentinelRef,
    error,
    refetch,
  } = useInfiniteScroll(filters);

  const typeLabel = (type: string) => {
    switch (type) {
      case 'income': return 'Pemasukan';
      case 'expense': return 'Pengeluaran';
      case 'transfer': return 'Transfer';
      default: return type;
    }
  };

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <h1 className="text-heading text-text-primary mb-4">Transaksi</h1>

      {/* Search */}
      <div className="mb-3">
        <TransactionSearch onSearchChange={handleSearchChange} />
      </div>

      {/* Filters */}
      <div className="mb-6">
        <TransactionFilters filters={filters} onFilterChange={handleFilterChange} />
      </div>

      {/* Initial loading skeleton */}
      {isLoading && (
        <div className="space-y-4" role="status" aria-label="Memuat transaksi...">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-2">
              {i === 0 && <SkeletonLoader width="40%" height="1rem" shape="rect" />}
              <SkeletonLoader height="4.5rem" shape="rect" />
            </div>
          ))}
        </div>
      )}

      {/* Error state */}
      {!isLoading && error && (
        <ErrorState
          message="Gagal memuat daftar transaksi. Silakan coba lagi."
          onRetry={() => refetch()}
        />
      )}

      {/* Empty state */}
      {!isLoading && !error && data.length === 0 && (
        <EmptyState
          title="Belum ada transaksi"
          description="Mulai catat transaksi pertama Anda."
        />
      )}

      {/* Transaction list */}
      {!isLoading && !error && data.length > 0 && (
        <TransactionList
          transactions={data}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      {/* Infinite scroll sentinel + loading indicator */}
      {!isLoading && (
        <div ref={sentinelRef} className="py-4" aria-hidden="true">
          {isFetchingNextPage && (
            <div className="flex justify-center items-center gap-2" role="status" aria-label="Memuat lebih banyak transaksi...">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-caption text-text-muted">Memuat...</span>
            </div>
          )}
        </div>
      )}

      {/* Edit Transaction Modal */}
      <TransactionModal
        open={!!editingTransaction}
        onClose={() => setEditingTransaction(null)}
        transaction={editingTransaction ? {
          id: editingTransaction.id,
          user_id: editingTransaction.user_id,
          account_id: editingTransaction.account_id,
          destination_account_id: editingTransaction.destination_account_id,
          category_id: editingTransaction.category_id,
          type: editingTransaction.type,
          amount: editingTransaction.amount,
          note: editingTransaction.note,
          date: editingTransaction.date,
          created_at: editingTransaction.created_at,
          updated_at: editingTransaction.updated_at,
        } : undefined}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={!!deleteTarget}
        title="Hapus Transaksi"
        description={
          deleteTarget
            ? `Apakah Anda yakin ingin menghapus transaksi ${typeLabel(deleteTarget.type)} sebesar ${formatIDR(deleteTarget.amount)}${deleteTarget.category?.name ? ` (${deleteTarget.category.name})` : ''} pada ${formatDate(deleteTarget.date)}?`
            : ''
        }
        confirmLabel="Hapus"
        cancelLabel="Batal"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </div>
  );
}
