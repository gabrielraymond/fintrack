'use client';

import React, { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { GOAL_CATEGORIES } from '@/lib/constants';
import type { FinancialGoal, GoalCategory, GoalFormInput } from '@/types';

export interface GoalFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: GoalFormInput) => void;
  loading?: boolean;
  /** Pass a goal to edit; omit for create mode */
  goal?: FinancialGoal | null;
}

export default function GoalForm({
  open,
  onClose,
  onSubmit,
  loading = false,
  goal,
}: GoalFormProps) {
  const isEdit = !!goal;

  const [name, setName] = useState('');
  const [category, setCategory] = useState<GoalCategory>('tabungan');
  const [targetAmount, setTargetAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [note, setNote] = useState('');

  const [errors, setErrors] = useState<{
    name?: string;
    targetAmount?: string;
    targetDate?: string;
  }>({});

  useEffect(() => {
    if (goal) {
      setName(goal.name);
      setCategory(goal.category);
      setTargetAmount(String(goal.target_amount));
      setTargetDate(goal.target_date ?? '');
      setNote(goal.note ?? '');
    } else {
      setName('');
      setCategory('tabungan');
      setTargetAmount('');
      setTargetDate('');
      setNote('');
    }
    setErrors({});
  }, [goal, open]);

  const validate = (): boolean => {
    const newErrors: typeof errors = {};

    if (!name.trim()) {
      newErrors.name = 'Nama goal tidak boleh kosong';
    }

    const amount = Number(targetAmount);
    if (!targetAmount || isNaN(amount) || amount <= 0) {
      newErrors.targetAmount = 'Target nominal harus lebih besar dari 0';
    }

    if (targetDate) {
      const selected = new Date(targetDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      selected.setHours(0, 0, 0, 0);
      if (selected <= today) {
        newErrors.targetDate = 'Tanggal target harus di masa depan';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const data: GoalFormInput = {
      name: name.trim(),
      category,
      target_amount: Number(targetAmount),
    };
    if (targetDate) data.target_date = targetDate;
    if (note.trim()) data.note = note.trim();

    onSubmit(data);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit Goal' : 'Tambah Goal'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div>
          <label htmlFor="goal-name" className="block text-caption text-text-secondary mb-1">
            Nama Goal
          </label>
          <input
            id="goal-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg text-body text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Contoh: Liburan ke Bali"
          />
          {errors.name && (
            <p className="text-caption text-danger mt-1">{errors.name}</p>
          )}
        </div>

        {/* Category */}
        <div>
          <label htmlFor="goal-category" className="block text-caption text-text-secondary mb-1">
            Kategori
          </label>
          <select
            id="goal-category"
            value={category}
            onChange={(e) => setCategory(e.target.value as GoalCategory)}
            className="w-full px-3 py-2 border border-border rounded-lg text-body text-text-primary focus:outline-none focus:ring-2 focus:ring-primary bg-surface"
          >
            {GOAL_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        {/* Target Amount */}
        <div>
          <label htmlFor="goal-target-amount" className="block text-caption text-text-secondary mb-1">
            Target Nominal (IDR)
          </label>
          <input
            id="goal-target-amount"
            type="number"
            value={targetAmount}
            onChange={(e) => setTargetAmount(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg text-body text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="0"
          />
          {errors.targetAmount && (
            <p className="text-caption text-danger mt-1">{errors.targetAmount}</p>
          )}
        </div>

        {/* Target Date */}
        <div>
          <label htmlFor="goal-target-date" className="block text-caption text-text-secondary mb-1">
            Tanggal Target (opsional)
          </label>
          <input
            id="goal-target-date"
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg text-body text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {errors.targetDate && (
            <p className="text-caption text-danger mt-1">{errors.targetDate}</p>
          )}
        </div>

        {/* Note */}
        <div>
          <label htmlFor="goal-note" className="block text-caption text-text-secondary mb-1">
            Catatan (opsional)
          </label>
          <textarea
            id="goal-note"
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
