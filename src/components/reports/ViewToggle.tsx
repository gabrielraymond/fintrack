'use client';

import React from 'react';
import type { ReportView } from '@/hooks/useReports';

export interface ViewToggleProps {
  activeView: ReportView;
  onViewChange: (view: ReportView) => void;
}

const tabs: { value: ReportView; label: string }[] = [
  { value: 'monthly', label: 'Bulanan' },
  { value: 'yearly', label: 'Tahunan' },
];

export default function ViewToggle({ activeView, onViewChange }: ViewToggleProps) {
  return (
    <div
      role="tablist"
      aria-label="Tampilan laporan"
      className="flex rounded-lg bg-surface-secondary p-1"
    >
      {tabs.map((tab) => {
        const isActive = activeView === tab.value;
        return (
          <button
            key={tab.value}
            role="tab"
            type="button"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onViewChange(tab.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                e.preventDefault();
                const other = tab.value === 'monthly' ? 'yearly' : 'monthly';
                onViewChange(other);
              }
            }}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary ${
              isActive
                ? 'bg-surface-primary text-text-primary shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
