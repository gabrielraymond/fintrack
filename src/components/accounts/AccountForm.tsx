'use client';

import React, { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { ACCOUNT_TYPES } from '@/lib/constants';
import type { Account, AccountType } from '@/types';

export interface AccountFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    type: AccountType;
    balance: number;
    credit_limit?: number;
    due_date?: number;
  }) => void;
  loading?: boolean;
  /** Pass an account to edit; omit for create mode */
  account?: Account | null;
}

export default function AccountForm({
  open,
  onClose,
  onSubmit,
  loading = false,
  account,
}: AccountFormProps) {
  const isEdit = !!account;

  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('bank');
  const [balance, setBalance] = useState('');
  const [creditLimit, setCreditLimit] = useState('');
  const [dueDate, setDueDate] = useState('');

  useEffect(() => {
    if (account) {
      setName(account.name);
      setType(account.type);
      setBalance(String(account.balance));
      setCreditLimit(account.credit_limit !== null ? String(account.credit_limit) : '');
      setDueDate(account.due_date !== null ? String(account.due_date) : '');
    } else {
      setName('');
      setType('bank');
      setBalance('');
      setCreditLimit('');
      setDueDate('');
    }
  }, [account, open]);

  const isCreditCard = type === 'credit_card';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: Parameters<typeof onSubmit>[0] = {
      name: name.trim(),
      type,
      balance: Number(balance) || 0,
    };
    if (isCreditCard) {
      if (creditLimit) data.credit_limit = Number(creditLimit);
      if (dueDate) data.due_date = Number(dueDate);
    }
    onSubmit(data);
  };

  const isValid = name.trim().length > 0;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit Akun' : 'Tambah Akun'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div>
          <label htmlFor="account-name" className="block text-caption text-text-secondary mb-1">
            Nama Akun
          </label>
          <input
            id="account-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg text-body text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Contoh: BCA, GoPay, Tunai"
            required
          />
        </div>

        {/* Type */}
        <div>
          <label htmlFor="account-type" className="block text-caption text-text-secondary mb-1">
            Tipe Akun
          </label>
          <select
            id="account-type"
            value={type}
            onChange={(e) => setType(e.target.value as AccountType)}
            className="w-full px-3 py-2 border border-border rounded-lg text-body text-text-primary focus:outline-none focus:ring-2 focus:ring-primary bg-surface"
          >
            {ACCOUNT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        {/* Initial Balance */}
        <div>
          <label htmlFor="account-balance" className="block text-caption text-text-secondary mb-1">
            Saldo Awal (IDR)
          </label>
          <input
            id="account-balance"
            type="number"
            value={balance}
            onChange={(e) => setBalance(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg text-body text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="0"
          />
        </div>

        {/* Credit Card specific fields */}
        {isCreditCard && (
          <>
            <div>
              <label htmlFor="credit-limit" className="block text-caption text-text-secondary mb-1">
                Limit Kredit (IDR)
              </label>
              <input
                id="credit-limit"
                type="number"
                value={creditLimit}
                onChange={(e) => setCreditLimit(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg text-body text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="0"
              />
            </div>
            <div>
              <label htmlFor="due-date" className="block text-caption text-text-secondary mb-1">
                Tanggal Jatuh Tempo (1-31)
              </label>
              <input
                id="due-date"
                type="number"
                min={1}
                max={31}
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg text-body text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="1"
              />
            </div>
          </>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="ghost" type="button" onClick={onClose}>
            Batal
          </Button>
          <Button
            variant="primary"
            type="submit"
            loading={loading}
            disabled={!isValid}
          >
            {isEdit ? 'Simpan' : 'Tambah'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
