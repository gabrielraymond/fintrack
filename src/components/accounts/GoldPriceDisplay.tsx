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
  const { price, isLoading, isError } = useGoldPrice(brand);
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
        {updatedTime && (
          <span className="text-caption text-text-muted">
            {updatedTime}
          </span>
        )}
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
