'use client';

import React from 'react';
import { useCategories } from '@/hooks/useCategories';

interface CategoryStepProps {
  selectedId: string | null;
  onSelect: (categoryId: string) => void;
}

export default function CategoryStep({ selectedId, onSelect }: CategoryStepProps) {
  const { data: categories, isLoading } = useCategories();

  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <div
            key={i}
            className="h-20 rounded-lg bg-surface-secondary animate-pulse"
            aria-hidden="true"
          />
        ))}
      </div>
    );
  }

  if (!categories || categories.length === 0) {
    return (
      <p className="text-body text-text-secondary text-center py-8">
        Belum ada kategori
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-body text-text-secondary mb-2">Pilih kategori</p>
      <div className="grid grid-cols-3 gap-3" role="radiogroup" aria-label="Pilih kategori">
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            role="radio"
            aria-checked={selectedId === cat.id}
            onClick={() => onSelect(cat.id)}
            className={`flex flex-col items-center justify-center gap-1 p-3 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-primary ${
              selectedId === cat.id
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border hover:border-primary hover:bg-surface-secondary text-text-primary'
            }`}
            aria-label={cat.name}
          >
            <span className="text-2xl" aria-hidden="true">{cat.icon}</span>
            <span className="text-caption truncate w-full text-center">{cat.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
