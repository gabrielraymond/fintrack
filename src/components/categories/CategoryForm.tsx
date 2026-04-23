'use client';

import React, { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import type { CategoryFormInput } from '@/types';

export interface CategoryFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CategoryFormInput) => void;
  loading?: boolean;
}

export default function CategoryForm({
  open,
  onClose,
  onSubmit,
  loading = false,
}: CategoryFormProps) {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('');
  const [errors, setErrors] = useState<{ name?: string; icon?: string }>({});

  useEffect(() => {
    setName('');
    setIcon('');
    setErrors({});
  }, [open]);

  const validate = (): boolean => {
    const newErrors: typeof errors = {};

    if (name.trim().length === 0) {
      newErrors.name = 'Nama kategori tidak boleh kosong';
    }

    if (icon.length === 0) {
      newErrors.icon = 'Ikon tidak boleh kosong';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    onSubmit({ name: name.trim(), icon });
  };

  return (
    <Modal open={open} onClose={onClose} title="Tambah Kategori">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Nama Kategori */}
        <div>
          <label htmlFor="category-name" className="block text-caption text-text-secondary mb-1">
            Nama Kategori
          </label>
          <input
            id="category-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg text-body text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Contoh: Transportasi"
          />
          {errors.name && (
            <p className="text-caption text-danger mt-1">{errors.name}</p>
          )}
        </div>

        {/* Ikon */}
        <div>
          <label htmlFor="category-icon" className="block text-caption text-text-secondary mb-1">
            Ikon
          </label>
          <input
            id="category-icon"
            type="text"
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg text-body text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Contoh: 🚗"
          />
          {errors.icon && (
            <p className="text-caption text-danger mt-1">{errors.icon}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="ghost" type="button" onClick={onClose}>
            Batal
          </Button>
          <Button variant="primary" type="submit" loading={loading}>
            Simpan
          </Button>
        </div>
      </form>
    </Modal>
  );
}
