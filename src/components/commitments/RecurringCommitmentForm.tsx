'use client';

import React, { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { ACCOUNT_TYPES } from '@/lib/constants';
import type { Account, RecurringCommitment, RecurringCommitmentFormInput } from '@/types';

export interface RecurringCommitmentFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: RecurringCommitmentFormInput) => void;
  loading?: boolean;
  /** Pass a commitment to edit; omit or null for create mode */
  commitment?: RecurringCommitment | null;
  accounts: Account[];
}

export default function RecurringCommitmentForm({
  open,
  onClose,
  onSubmit,
  loading = false,
  commitment,
  accounts,
}: RecurringCommitmentFormProps) {
  const isEdit = !!commitment;

  const [name, setName] = useState('');
  const [accountId, setAccountId] = useState('');
  const [monthlyAmount, setMonthlyAmount] = useState('');
  const [note, setNote] = useState('');

  const [errors, setErrors] = useState<{
    name?: string;
    accountId?: string;
    monthlyAmount?: string;
  }>({});

  // Reset form when modal opens or commitment changes
  useEffect(() => {
    if (commitment) {
      setName(commitment.name);
      setAccountId(commitment.account_id);
      setMonthlyAmount(String(commitment.monthly_amount));
      setNote(commitment.note ?? '');
    } else {
      setName('');
      setAccountId(accounts.length > 0 ? accounts[0].id : '');
      setMonthlyAmount('');
      setNote('');
    }
    setErrors({});
  }, [commitment, open, accounts]);

  const validate = (): boolean => {
    const newErrors: typeof errors = {};

    if (!name.trim()) {
      newErrors.name = 'Nama komitmen tidak boleh kosong';
    }

    if (!accountId) {
      newErrors.accountId = 'Pilih akun terlebih dahulu';
    }

    const amount = Number(monthlyAmount);
    if (!monthlyAmount || isNaN(amount) || amount <= 0) {
      newErrors.monthlyAmount = 'Jumlah per bulan harus lebih besar dari 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const data: RecurringCommitmentFormInput = {
      account_id: accountId,
      name: name.trim(),
      monthly_amount: Number(monthlyAmount),
    };

    if (note.trim()) {
      data.note = note.trim();
    }

    onSubmit(data);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit Komitmen Berulang' : 'Tambah Komitmen Berulang'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div>
          <label htmlFor="commitment-name" className="block text-caption text-text-secondary mb-1">
            Nama Komitmen
          </label>
          <input
            id="commitment-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg text-body text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Contoh: Netflix, Spotify, Iuran RT"
          />
          {errors.name && (
            <p className="text-caption text-danger mt-1">{errors.name}</p>
          )}
        </div>

        {/* Account */}
        <div>
          <label htmlFor="commitment-account" className="block text-caption text-text-secondary mb-1">
            Akun
          </label>
          <select
            id="commitment-account"
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg text-body text-text-primary focus:outline-none focus:ring-2 focus:ring-primary bg-surface"
          >
            {accounts.length === 0 && (
              <option value="">Tidak ada akun tersedia</option>
            )}
            {accounts.map((account) => {
              const typeLabel = ACCOUNT_TYPES.find((t) => t.value === account.type)?.label ?? account.type;
              return (
                <option key={account.id} value={account.id}>
                  {account.name} ({typeLabel})
                </option>
              );
            })}
          </select>
          {errors.accountId && (
            <p className="text-caption text-danger mt-1">{errors.accountId}</p>
          )}
        </div>

        {/* Monthly Amount */}
        <div>
          <label htmlFor="commitment-monthly-amount" className="block text-caption text-text-secondary mb-1">
            Jumlah per Bulan (IDR)
          </label>
          <input
            id="commitment-monthly-amount"
            type="number"
            min={1}
            value={monthlyAmount}
            onChange={(e) => setMonthlyAmount(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg text-body text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="0"
          />
          {errors.monthlyAmount && (
            <p className="text-caption text-danger mt-1">{errors.monthlyAmount}</p>
          )}
          {monthlyAmount && Number(monthlyAmount) > 0 && (
            <p className="text-caption text-text-muted mt-1">
              {new Intl.NumberFormat('id-ID', {
                style: 'currency',
                currency: 'IDR',
                minimumFractionDigits: 0,
              }).format(Number(monthlyAmount))}
            </p>
          )}
        </div>

        {/* Note */}
        <div>
          <label htmlFor="commitment-note" className="block text-caption text-text-secondary mb-1">
            Catatan (opsional)
          </label>
          <textarea
            id="commitment-note"
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
          <Button
            variant="primary"
            type="submit"
            loading={loading}
          >
            {isEdit ? 'Simpan' : 'Tambah'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
