'use client';

import React, { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { ACCOUNT_TYPES } from '@/lib/constants';
import type { Account, Installment, InstallmentFormInput } from '@/types';

export interface InstallmentFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: InstallmentFormInput & { installment_type: 'cc' | 'non_cc' }) => void;
  loading?: boolean;
  /** Pass an installment to edit; omit or null for create mode */
  installment?: Installment | null;
  accounts: Account[];
}

export default function InstallmentForm({
  open,
  onClose,
  onSubmit,
  loading = false,
  installment,
  accounts,
}: InstallmentFormProps) {
  const isEdit = !!installment;

  const [name, setName] = useState('');
  const [accountId, setAccountId] = useState('');
  const [monthlyAmount, setMonthlyAmount] = useState('');
  const [tenorMonths, setTenorMonths] = useState('');
  const [startDate, setStartDate] = useState('');
  const [dueDay, setDueDay] = useState('');
  const [note, setNote] = useState('');

  const [errors, setErrors] = useState<{
    name?: string;
    accountId?: string;
    monthlyAmount?: string;
    tenorMonths?: string;
    startDate?: string;
    dueDay?: string;
  }>({});

  // Reset form when modal opens or installment changes
  useEffect(() => {
    if (installment) {
      setName(installment.name);
      setAccountId(installment.account_id);
      setMonthlyAmount(String(installment.monthly_amount));
      setTenorMonths(String(installment.tenor_months));
      setStartDate(installment.start_date);
      setDueDay(String(installment.due_day));
      setNote(installment.note ?? '');
    } else {
      setName('');
      setAccountId(accounts.length > 0 ? accounts[0].id : '');
      setMonthlyAmount('');
      setTenorMonths('');
      setStartDate('');
      setDueDay('');
      setNote('');
    }
    setErrors({});
  }, [installment, open, accounts]);

  // Determine installment type automatically from selected account type
  const selectedAccount = accounts.find((a) => a.id === accountId);
  const installmentType: 'cc' | 'non_cc' =
    selectedAccount?.type === 'credit_card' ? 'cc' : 'non_cc';

  const validate = (): boolean => {
    const newErrors: typeof errors = {};

    if (!name.trim()) {
      newErrors.name = 'Nama cicilan tidak boleh kosong';
    }

    if (!accountId) {
      newErrors.accountId = 'Pilih akun terlebih dahulu';
    }

    const amount = Number(monthlyAmount);
    if (!monthlyAmount || isNaN(amount) || amount <= 0) {
      newErrors.monthlyAmount = 'Angsuran bulanan harus lebih besar dari 0';
    }

    const tenor = Number(tenorMonths);
    if (!tenorMonths || isNaN(tenor) || tenor < 1 || !Number.isInteger(tenor)) {
      newErrors.tenorMonths = 'Tenor harus minimal 1 bulan';
    }

    if (!startDate) {
      newErrors.startDate = 'Tanggal mulai tidak boleh kosong';
    }

    const due = Number(dueDay);
    if (!dueDay || isNaN(due) || due < 1 || due > 31 || !Number.isInteger(due)) {
      newErrors.dueDay = 'Tanggal jatuh tempo harus antara 1 dan 31';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const data: InstallmentFormInput & { installment_type: 'cc' | 'non_cc' } = {
      account_id: accountId,
      name: name.trim(),
      monthly_amount: Number(monthlyAmount),
      tenor_months: Number(tenorMonths),
      start_date: startDate,
      due_day: Number(dueDay),
      installment_type: installmentType,
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
      title={isEdit ? 'Edit Cicilan' : 'Tambah Cicilan'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div>
          <label htmlFor="installment-name" className="block text-caption text-text-secondary mb-1">
            Nama Cicilan
          </label>
          <input
            id="installment-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg text-body text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Contoh: Cicilan HP, KTA BCA"
          />
          {errors.name && (
            <p className="text-caption text-danger mt-1">{errors.name}</p>
          )}
        </div>

        {/* Account */}
        <div>
          <label htmlFor="installment-account" className="block text-caption text-text-secondary mb-1">
            Akun
          </label>
          <select
            id="installment-account"
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
          {/* Show auto-determined installment type as info */}
          {selectedAccount && (
            <p className="text-caption text-text-muted mt-1">
              Tipe cicilan:{' '}
              <span className="font-medium">
                {installmentType === 'cc' ? 'Cicilan Kartu Kredit (CC)' : 'Cicilan Non-Kartu Kredit (Non-CC)'}
              </span>
            </p>
          )}
        </div>

        {/* Monthly Amount */}
        <div>
          <label htmlFor="installment-monthly-amount" className="block text-caption text-text-secondary mb-1">
            Angsuran Bulanan (IDR)
          </label>
          <input
            id="installment-monthly-amount"
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

        {/* Tenor */}
        <div>
          <label htmlFor="installment-tenor" className="block text-caption text-text-secondary mb-1">
            Tenor (bulan)
          </label>
          <input
            id="installment-tenor"
            type="number"
            min={1}
            step={1}
            value={tenorMonths}
            onChange={(e) => setTenorMonths(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg text-body text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Contoh: 12, 24, 36"
          />
          {errors.tenorMonths && (
            <p className="text-caption text-danger mt-1">{errors.tenorMonths}</p>
          )}
        </div>

        {/* Start Date */}
        <div>
          <label htmlFor="installment-start-date" className="block text-caption text-text-secondary mb-1">
            Tanggal Mulai
          </label>
          <input
            id="installment-start-date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg text-body text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {errors.startDate && (
            <p className="text-caption text-danger mt-1">{errors.startDate}</p>
          )}
        </div>

        {/* Due Day */}
        <div>
          <label htmlFor="installment-due-day" className="block text-caption text-text-secondary mb-1">
            Tanggal Jatuh Tempo (1–31)
          </label>
          <input
            id="installment-due-day"
            type="number"
            min={1}
            max={31}
            step={1}
            value={dueDay}
            onChange={(e) => setDueDay(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg text-body text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Contoh: 15"
          />
          {errors.dueDay && (
            <p className="text-caption text-danger mt-1">{errors.dueDay}</p>
          )}
        </div>

        {/* Note */}
        <div>
          <label htmlFor="installment-note" className="block text-caption text-text-secondary mb-1">
            Catatan (opsional)
          </label>
          <textarea
            id="installment-note"
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
