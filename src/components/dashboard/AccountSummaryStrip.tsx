'use client';

import React from 'react';
import { useFormatIDR } from '@/hooks/useFormatIDR';
import { useGoldPrice } from '@/hooks/useGoldPrices';
import { calculateInvestmentPL } from '@/lib/investmentPL';
import type { Account, GoldBrand } from '@/types';

const typeEmoji: Record<string, string> = {
  bank: '🏦',
  'e-wallet': '📱',
  cash: '💵',
  credit_card: '💳',
  investment: '📈',
};

export interface AccountSummaryStripProps {
  accounts: Account[];
  label?: string;
}

function GoldSummaryInfo({
  brand,
  weightGrams,
  purchasePricePerGram,
}: {
  brand: GoldBrand | null;
  weightGrams: number;
  purchasePricePerGram: number;
}) {
  const formatIDR = useFormatIDR();
  const { price, isLoading } = useGoldPrice(brand);

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-3 bg-border rounded w-14" />
      </div>
    );
  }

  const hasBuyback = price && price.buybackPrice > 0;
  const currentValue = hasBuyback ? Math.round(price.buybackPrice * weightGrams) : 0;
  const totalCost = Math.round(purchasePricePerGram * weightGrams);
  const profitLoss = currentValue - totalCost;
  const isProfit = profitLoss >= 0;

  return hasBuyback ? (
    <>
      <p className="text-caption font-semibold text-text-primary truncate">
        {formatIDR(currentValue)}
      </p>
      <p className={`text-[11px] leading-tight font-medium ${isProfit ? 'text-success' : 'text-danger'}`}>
        {isProfit ? '+' : ''}{formatIDR(profitLoss)}
      </p>
    </>
  ) : (
    <p className="text-[11px] text-text-muted">Harga tidak tersedia</p>
  );
}

function InvestmentSummaryInfo({
  balance,
  investedAmount,
}: {
  balance: number;
  investedAmount: number;
}) {
  const formatIDR = useFormatIDR();
  const pl = calculateInvestmentPL(balance, investedAmount);

  if (!pl) return null;

  return (
    <>
      <p className="text-caption font-semibold text-text-primary truncate">
        {formatIDR(balance)}
      </p>
      <p className={`text-[11px] leading-tight font-medium ${pl.isProfit ? 'text-success' : 'text-danger'}`}>
        {pl.isProfit ? '+' : ''}{formatIDR(pl.profitLoss)}
      </p>
    </>
  );
}

export default function AccountSummaryStrip({ accounts, label }: AccountSummaryStripProps) {
  const formatIDR = useFormatIDR();
  if (accounts.length === 0) return null;

  return (
    <section>
      {label && (
        <h3 className="text-caption font-semibold text-text-primary mb-1.5">{label}</h3>
      )}
      <div
        className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide"
        role="list"
        aria-label={label ?? 'Ringkasan akun'}
      >
      {accounts.map((account) => (
        <div
          key={account.id}
          role="listitem"
          className="flex-shrink-0 min-w-[110px] max-w-[160px] rounded-lg border border-border bg-surface px-2.5 py-2"
        >
          <div className="flex items-center gap-1 mb-0.5">
            <span className="text-xs" aria-hidden="true">{typeEmoji[account.type] ?? '📋'}</span>
            <span className="text-[11px] text-text-secondary truncate">
              {account.name}
            </span>
          </div>
          {account.type === 'gold' && account.gold_weight_grams != null && account.gold_purchase_price_per_gram != null ? (
            <GoldSummaryInfo
              brand={account.gold_brand}
              weightGrams={account.gold_weight_grams}
              purchasePricePerGram={account.gold_purchase_price_per_gram}
            />
          ) : account.type === 'investment' && account.invested_amount != null && account.invested_amount > 0 ? (
            <InvestmentSummaryInfo
              balance={account.balance}
              investedAmount={account.invested_amount}
            />
          ) : (
            <p
              className={`text-caption font-semibold truncate ${account.balance < 0 ? 'text-danger' : 'text-text-primary'}`}
            >
              {formatIDR(account.balance)}
            </p>
          )}
        </div>
      ))}
      </div>
    </section>
  );
}
