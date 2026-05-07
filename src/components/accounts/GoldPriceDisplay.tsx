'use client';

import React from 'react';
import { useGoldPrice } from '@/hooks/useGoldPrices';
import { useFormatIDR } from '@/hooks/useFormatIDR';
import type { GoldBrand } from '@/types';
import { GOLD_BRANDS } from '@/lib/constants';

interface GoldPriceDisplayProps {
  brand: GoldBrand;
  weightGrams: number;
  purchasePricePerGram: number;
}

export default function GoldPriceDisplay({
  brand,
  weightGrams,
  purchasePricePerGram,
}: GoldPriceDisplayProps) {
  const formatIDR = useFormatIDR();
  const { price, isLoading, isError, isFetching, forceRefetch } = useGoldPrice(brand);
  const brandLabel = GOLD_BRANDS.find((b) => b.value === brand)?.label ?? brand;

  const totalPurchase = Math.round(purchasePricePerGram * weightGrams);

  if (isLoading) {
    return (
      <div className="mt-3 p-3 bg-surface-secondary rounded-lg animate-pulse">
        <div className="h-4 bg-border rounded w-3/4 mb-2" />
        <div className="h-3 bg-border rounded w-1/2 mb-2" />
        <div className="h-3 bg-border rounded w-2/3" />
      </div>
    );
  }

  const hasBuyback = price && price.buybackPrice > 0;
  const totalBuyback = hasBuyback ? Math.round(price.buybackPrice * weightGrams) : 0;
  const profitLoss = hasBuyback ? totalBuyback - totalPurchase : 0;
  const profitPercent = totalPurchase > 0 && hasBuyback
    ? ((profitLoss / totalPurchase) * 100).toFixed(2)
    : '0';
  const isProfit = profitLoss >= 0;

  const updatedTime = price
    ? new Date(price.updatedAt).toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  return (
    <div className="mt-3 p-3 bg-surface-secondary rounded-lg space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-body">🥇</span>
          <span className="text-caption font-medium text-text-primary">
            {brandLabel} · {weightGrams}g
          </span>
        </div>
        <div className="flex items-center gap-2">
          {updatedTime && (
            <span className="text-caption text-text-muted">
              {updatedTime}
            </span>
          )}
          <button
            onClick={() => forceRefetch()}
            disabled={isFetching}
            title="Refresh harga emas"
            className="p-1 rounded text-text-muted hover:text-text-primary hover:bg-border transition-colors disabled:opacity-40"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={isFetching ? 'animate-spin' : ''}
            >
              <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
              <path d="M21 3v5h-5" />
            </svg>
          </button>
        </div>
      </div>

      {/* Harga Beli (user's purchase price) */}
      <div className="grid grid-cols-2 gap-2 text-caption">
        <div>
          <p className="text-text-muted">Harga Beli/g</p>
          <p className="text-text-secondary font-medium">
            {formatIDR(purchasePricePerGram)}
          </p>
        </div>
        <div>
          <p className="text-text-muted">Total Modal</p>
          <p className="text-text-secondary font-medium">
            {formatIDR(totalPurchase)}
          </p>
        </div>
      </div>

      {/* Harga Jual Saat Ini (realtime buyback) */}
      {(isError || !hasBuyback) ? (
        <div className="pt-1 border-t border-border">
          <p className="text-caption text-text-muted">
            Harga jual realtime tidak tersedia saat ini
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2 text-caption pt-1 border-t border-border">
            <div>
              <p className="text-text-muted">Harga Jual/g (Buyback)</p>
              <p className="text-text-secondary font-medium">
                {formatIDR(price.buybackPrice)}
              </p>
            </div>
            <div>
              <p className="text-text-muted">Estimasi Jual</p>
              <p className="text-text-secondary font-medium">
                {formatIDR(totalBuyback)}
              </p>
            </div>
          </div>

          {/* Profit/Loss */}
          <div className="pt-1 border-t border-border">
            <div className="flex justify-between items-center">
              <p className="text-caption text-text-muted">
                {isProfit ? 'Keuntungan' : 'Kerugian'}
              </p>
              <div className="text-right">
                <p className={`text-body font-semibold ${isProfit ? 'text-success' : 'text-danger'}`}>
                  {isProfit ? '+' : ''}{formatIDR(profitLoss)}
                </p>
                <p className={`text-caption ${isProfit ? 'text-success' : 'text-danger'}`}>
                  ({isProfit ? '+' : ''}{profitPercent}%)
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
