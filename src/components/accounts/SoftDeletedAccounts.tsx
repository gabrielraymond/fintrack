'use client';

import React from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { formatIDR } from '@/lib/formatters';
import { ACCOUNT_TYPES } from '@/lib/constants';
import { useSoftDeletedAccounts, useReactivateAccount } from '@/hooks/useAccounts';
import type { Account } from '@/types';

export interface SoftDeletedAccountsProps {
  show: boolean;
  onToggle: () => void;
}

export default function SoftDeletedAccounts({ show, onToggle }: SoftDeletedAccountsProps) {
  const { data: deletedAccounts, isLoading } = useSoftDeletedAccounts();
  const reactivate = useReactivateAccount();

  const count = deletedAccounts?.length ?? 0;

  const handleRestore = (account: Account) => {
    reactivate.mutate(account.id);
  };

  return (
    <div className="mt-6">
      <button
        onClick={onToggle}
        className="flex items-center gap-2 text-caption text-text-secondary hover:text-text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary rounded px-1"
        aria-expanded={show}
        aria-controls="soft-deleted-accounts"
      >
        <svg
          className={`w-4 h-4 transition-transform ${show ? 'rotate-90' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        Akun Dihapus {count > 0 && `(${count})`}
      </button>

      {show && (
        <div id="soft-deleted-accounts" className="mt-3 space-y-3">
          {isLoading && (
            <p className="text-caption text-text-secondary">Memuat...</p>
          )}

          {!isLoading && count === 0 && (
            <p className="text-caption text-text-secondary">Tidak ada akun yang dihapus.</p>
          )}

          {!isLoading &&
            deletedAccounts?.map((account) => {
              const typeLabel =
                ACCOUNT_TYPES.find((t) => t.value === account.type)?.label ?? account.type;

              return (
                <Card key={account.id} className="opacity-70">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <h4 className="text-body text-text-primary truncate">{account.name}</h4>
                      <p className="text-caption text-text-secondary">{typeLabel}</p>
                      <p
                        className={`text-caption mt-1 ${account.balance < 0 ? 'text-danger' : 'text-text-primary'}`}
                      >
                        {formatIDR(account.balance)}
                      </p>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleRestore(account)}
                      loading={reactivate.isPending}
                      aria-label={`Pulihkan akun ${account.name}`}
                    >
                      Pulihkan
                    </Button>
                  </div>
                </Card>
              );
            })}
        </div>
      )}
    </div>
  );
}
