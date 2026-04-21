'use client';

import React, { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import type { ContributionFormInput } from '@/types';

export interface ContributionFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: ContributionFormInput) => void;
  mode: 'add' | 'withdraw';
  currentAmount: number;
  loading?: boolean;
}

export default function ContributionForm({
  open,
  onClose,
  onSubmit,
  mode,
  currentAmount,
  loading = false,
}: ContributionFormProps) {
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<{ amount?: string }>({});

  useEffect(() => {
    setAmount('');
    setNote('');
    setErrors({});
  }, [open, mode]);

  const validate = (): boolean => {
    const newErrors: typeof errors = {};
    const parsed = Number(amount);

    if (!amount || isNaN(parsed) || parsed <= 0) {
      newErrors.amount = 'Jumlah harus lebih besar dari 0';
    } else if (mode === 'withdraw' && parsed > currentAmount) {
      newErrors.amount = 'Jumlah penarikan melebihi saldo goal';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const data: ContributionFormInput = {
      amount: Number(amount),
    };
    if (note.trim()) data.note = note.trim();

    onSubmit(data);
  };

  const title = mode === 'add' ? 'Tambah Kontribusi' : 'Tarik Dana';
  const submitText = mode === 'add' ? 'Tambah' : 'Tarik';

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <form onSubmit={handleSubmit} className="space-y-4">
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
