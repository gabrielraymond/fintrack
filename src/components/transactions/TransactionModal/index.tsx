'use client';

import React, { useState, useCallback, useMemo } from 'react';
import Modal from '@/components/ui/Modal';
import { useCreateTransaction, useUpdateTransaction } from '@/hooks/useTransactions';
import type {
  TransactionModalState,
  TransactionModalStep,
  TransactionType,
  Transaction,
  TransactionPreset,
} from '@/types';
import TypeStep from './TypeStep';
import CategoryStep from './CategoryStep';
import NumpadStep from './NumpadStep';
import AccountStep from './AccountStep';
import DetailsStep from './DetailsStep';

interface TransactionModalProps {
  open: boolean;
  onClose: () => void;
  /** Pre-fill from a preset (for quick preset chips) */
  preset?: Partial<Pick<TransactionPreset, 'type' | 'category_id' | 'account_id' | 'destination_account_id' | 'amount'>>;
  /** Existing transaction for editing */
  transaction?: Transaction;
}

const STEP_TITLES: Record<TransactionModalStep, string> = {
  type: 'Transaksi Baru',
  category: 'Pilih Kategori',
  numpad: 'Masukkan Jumlah',
  account: 'Pilih Akun',
  details: 'Detail Transaksi',
};

function createInitialState(
  preset?: TransactionModalProps['preset'],
  transaction?: Transaction
): TransactionModalState {
  if (transaction) {
    return {
      step: 'type',
      type: transaction.type,
      categoryId: transaction.category_id,
      amount: transaction.amount,
      accountId: transaction.account_id,
      destinationAccountId: transaction.destination_account_id,
      note: transaction.note ?? '',
      date: new Date(transaction.date + 'T00:00:00'),
    };
  }

  if (preset) {
    // Determine starting step based on what's pre-filled
    let step: TransactionModalStep = 'type';
    if (preset.type) {
      step = preset.type === 'transfer' ? 'numpad' : 'category';
      if (preset.category_id) step = 'numpad';
      if (preset.amount && preset.amount > 0) step = 'account';
      if (preset.account_id) step = 'details';
    }

    return {
      step,
      type: preset.type ?? null,
      categoryId: preset.category_id ?? null,
      amount: preset.amount ?? 0,
      accountId: preset.account_id ?? null,
      destinationAccountId: preset.destination_account_id ?? null,
      note: '',
      date: new Date(),
    };
  }

  return {
    step: 'type',
    type: null,
    categoryId: null,
    amount: 0,
    accountId: null,
    destinationAccountId: null,
    note: '',
    date: new Date(),
  };
}

export default function TransactionModal({
  open,
  onClose,
  preset,
  transaction,
}: TransactionModalProps) {
  const [state, setState] = useState<TransactionModalState>(() =>
    createInitialState(preset, transaction)
  );
  const [stepFooter, setStepFooter] = useState<React.ReactNode>(null);

  const createMutation = useCreateTransaction();
  const updateMutation = useUpdateTransaction();
  const isEditing = !!transaction;
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  // Reset state when modal opens
  const handleClose = useCallback(() => {
    setState(createInitialState(preset, transaction));
    onClose();
  }, [onClose, preset, transaction]);

  // Re-initialize when open changes to true
  React.useEffect(() => {
    if (open) {
      setState(createInitialState(preset, transaction));
      setStepFooter(null);
    }
  }, [open, preset, transaction]);

  const title = useMemo(() => {
    if (isEditing && state.step === 'type') return 'Edit Transaksi';
    return STEP_TITLES[state.step];
  }, [state.step, isEditing]);

  // Clear step footer when step changes (non-account steps don't provide a footer)
  React.useEffect(() => {
    if (state.step !== 'account') {
      setStepFooter(null);
    }
  }, [state.step]);

  // ── Step handlers ──

  const handleTypeSelect = useCallback((type: TransactionType) => {
    setState((prev) => ({
      ...prev,
      type,
      // Transfer skips category step
      step: type === 'transfer' ? 'numpad' : 'category',
    }));
  }, []);

  const handleCategorySelect = useCallback((categoryId: string) => {
    setState((prev) => ({
      ...prev,
      categoryId,
      step: 'numpad',
    }));
  }, []);

  const handleAmountConfirm = useCallback((amount: number) => {
    setState((prev) => ({
      ...prev,
      amount,
      step: 'account',
    }));
  }, []);

  const handleAccountConfirm = useCallback(
    (accountId: string, destinationAccountId?: string) => {
      setState((prev) => ({
        ...prev,
        accountId,
        destinationAccountId: destinationAccountId ?? null,
        step: 'details',
      }));
    },
    []
  );

  const handleDetailsConfirm = useCallback(
    async (note: string, date: Date) => {
      if (!state.type || !state.accountId) return;

      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

      const input = {
        type: state.type,
        account_id: state.accountId,
        destination_account_id: state.type === 'transfer' ? (state.destinationAccountId ?? undefined) : undefined,
        category_id: state.type !== 'transfer' ? (state.categoryId ?? undefined) : undefined,
        amount: state.amount,
        note: note || undefined,
        date: dateStr,
      };

      try {
        if (isEditing && transaction) {
          await updateMutation.mutateAsync({ ...input, id: transaction.id });
        } else {
          await createMutation.mutateAsync(input);
        }
        handleClose();
      } catch {
        // Error handled by mutation's onError (toast)
      }
    },
    [state, isEditing, transaction, createMutation, updateMutation, handleClose]
  );

  // ── Render current step ──

  const renderStep = () => {
    switch (state.step) {
      case 'type':
        return <TypeStep onSelect={handleTypeSelect} />;
      case 'category':
        return (
          <CategoryStep
            selectedId={state.categoryId}
            onSelect={handleCategorySelect}
          />
        );
      case 'numpad':
        return (
          <NumpadStep
            initialAmount={state.amount}
            onConfirm={handleAmountConfirm}
          />
        );
      case 'account':
        return (
          <AccountStep
            isTransfer={state.type === 'transfer'}
            selectedAccountId={state.accountId}
            selectedDestinationId={state.destinationAccountId}
            onConfirm={handleAccountConfirm}
            renderFooter={setStepFooter}
          />
        );
      case 'details':
        return (
          <DetailsStep
            initialNote={state.note}
            initialDate={state.date}
            isSubmitting={isSubmitting}
            onConfirm={handleDetailsConfirm}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Modal open={open} onClose={handleClose} title={title} footer={stepFooter}>
      {renderStep()}
    </Modal>
  );
}
