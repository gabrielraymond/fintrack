'use client';

import React, { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { useFormatIDR } from '@/hooks/useFormatIDR';
import type { ContributionFormInput, Account } from '@/types';

export interface ContributionFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: ContributionFormInput) => void;
  mode: 'add' | 'withdraw';
  currentAmount: number;
  loading?: boolean;
  accounts: Account[];
}

export default function ContributionForm({
  open,
  onClose,
  onSubmit,
  mode,
  currentAmount,
  loading = false,
  accounts,
}: ContributionFormProps) {
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [accountId, setAccountId] = useState('');
  const [errors, setErrors] = useState<{ amount?: string; accountId?: string }>({});
  const formatIDR = useFormatIDR();

  useEffect(() => {
    setAmount('');
    setNote('');
    setAccountId('');
    setErrors({});
  }, [open, mode]);

  const validate = (): boolean => {
    const newErrors: typeof errors = {};

    if (!accountId) {
      newErrors.accountId =
        mode === 'add'
          ? 'Pilih akun sumber terlebih dahulu'
          : 'Pilih akun tujuan terlebih dahulu';
    }

    const parsed = Number(amount);

    if (!amount || isNaN(parsed) || parsed <= 0) {
      newErrors.amount = 'Jumlah harus lebih besar dari 0';
    } else if (mode === 'withdraw' && parsed > currentAmount) {
      newErrors.amount = 'Jumlah penarikan melebihi saldo goal';
    } else if (mode === 'add' && accountId) {
      const selectedAccount = accounts.find((a) => a.id === accountId);
      if (selectedAccount && parsed > selectedAccount.balance) {
        newErrors.amount = 'Saldo akun tidak mencukupi';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const data: ContributionFormInput = {
      amount: Number(amount),
      account_id: accountId,
    };
    if (note.trim()) data.note = note.trim();

    onSubmit(data);
  };

  const title = mode === 'add' ? 'Tambah Kontribusi' : 'Tarik Dana';
  const submitText = mode === 'add' ? 'Tambah' : 'Tarik';
  const accountLabel = mode === 'add' ? 'Pilih Akun Sumber' : 'Pilih Akun Tujuan';

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Account Selection */}
        <div>
          <label htmlFor="contribution-account" className="block text-caption text-text-secondary mb-1">
            {accountLabel}
          </label>
          <select
            id="contribution-account"
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg text-body text-text-primary focus:outline-none focus:ring-2 focus:ring-primary bg-surface"
          >
            <option value="">{accountLabel}</option>
            {accounts.filter((a) => !a.is_deleted).map((account) => (
              <option key={account.id} value={account.id}>
                {account.name} — {formatIDR(account.balance)}
              </option>
            ))}
          </select>
          {errors.accountId && (
            <p className="text-caption text-danger mt-1">{errors.accountId}</p>
          )}
        </div>

        {/* Amount */}
        <div>
          <label htmlFor="contribution-amount" className="block text-caption text-text-secondary mb-1">
            Jumlah (IDR)
          </label>
          <input
            id="contribution-amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg text-body text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="0"
          />
          {errors.amount && (
            <p className="text-caption text-danger mt-1">{errors.amount}</p>
          )}
        </div>

        {/* Note */}
        <div>
          <label htmlFor="contribution-note" className="block text-caption text-text-secondary mb-1">
            Catatan (opsional)
          </label>
          <textarea
            id="contribution-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg text-body text-text-primary focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            placeholder="Catatan tambahan..."
            rows={3}
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="ghost" type="button" onClick={onClose}>
            Batal
          </Button>
          <Button variant="primary" type="submit" loading={loading}>
            {submitText}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
