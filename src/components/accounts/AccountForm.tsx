'use client';

import React, { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { ACCOUNT_TYPES, GOLD_BRANDS } from '@/lib/constants';
import type { Account, AccountType, GoldBrand } from '@/types';

export interface AccountFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    type: AccountType;
    balance: number;
    credit_limit?: number;
    due_date?: number;
    target_amount?: number;
    gold_brand?: GoldBrand;
    gold_weight_grams?: number;
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
  const [targetAmount, setTargetAmount] = useState('');
  const [goldBrand, setGoldBrand] = useState<GoldBrand>('antam');
  const [goldWeight, setGoldWeight] = useState('');

  useEffect(() => {
    if (account) {
      setName(account.name);
      setType(account.type);
      setBalance(String(account.balance));
      setCreditLimit(account.credit_limit !== null ? String(account.credit_limit) : '');
      setDueDate(account.due_date !== null ? String(account.due_date) : '');
      setTargetAmount(account.target_amount !== null ? String(account.target_amount) : '');
      setGoldBrand(account.gold_brand ?? 'antam');
      setGoldWeight(account.gold_weight_grams !== null ? String(account.gold_weight_grams) : '');
    } else {
      setName('');
      setType('bank');
      setBalance('');
      setCreditLimit('');
      setDueDate('');
      setTargetAmount('');
      setGoldBrand('antam');
      setGoldWeight('');
    }
  }, [account, open]);

  const isCreditCard = type === 'credit_card';
  const isSavingsType = type === 'tabungan' || type === 'dana_darurat';
  const isGold = type === 'gold';

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
    if (isSavingsType && targetAmount) {
      data.target_amount = Number(targetAmount);
    }
    if (isGold) {
      data.gold_brand = goldBrand;
      data.gold_weight_grams = Number(goldWeight) || 0;
    }
    onSubmit(data);
  };

  const isValid = name.trim().length > 0 && (!isGold || (Number(goldWeight) > 0));

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

        {/* Savings / Emergency Fund target amount */}
        {isSavingsType && (
          <div>
            <label htmlFor="target-amount" className="block text-caption text-text-secondary mb-1">
              Target Tabungan (IDR)
            </label>
            <input
              id="target-amount"
              type="number"
              min={1}
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg text-body text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="0"
            />
          </div>
        )}

        {/* Gold / Precious Metal specific fields */}
        {isGold && (
          <>
            <div>
              <label htmlFor="gold-brand" className="block text-caption text-text-secondary mb-1">
                Merek Emas
              </label>
              <select
                id="gold-brand"
                value={goldBrand}
                onChange={(e) => setGoldBrand(e.target.value as GoldBrand)}
                className="w-full px-3 py-2 border border-border rounded-lg text-body text-text-primary focus:outline-none focus:ring-2 focus:ring-primary bg-surface"
              >
                {GOLD_BRANDS.map((b) => (
                  <option key={b.value} value={b.value}>
                    {b.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="gold-weight" className="block text-caption text-text-secondary mb-1">
                Berat (gram)
              </label>
              <input
                id="gold-weight"
                type="number"
                min={0.01}
                step={0.01}
                value={goldWeight}
                onChange={(e) => setGoldWeight(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg text-body text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Contoh: 1, 5, 10, 25"
                required
              />
              <p className="text-caption text-text-muted mt-1">
                Masukkan total berat emas yang dimiliki
              </p>
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
