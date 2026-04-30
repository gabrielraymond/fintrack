'use client';

import React from 'react';
import { useGoldPrice, calculateGoldValue } from '@/hooks/useGoldPrices';
import { useFormatIDR } from '@/hooks/useFormatIDR';
import type { GoldBrand } from '@/types';
import { GOLD_BRANDS } from '@/lib/constants';

interface GoldPriceDisplayProps {
  brand: GoldBrand;
  weightGrams: number;
}

export default function GoldPriceDisplay({ brand, weightGrams }: GoldPriceDisplayProps) {
  const formatIDR = useFormatIDR();
  const { price, isLoading, isError } = useGoldPrice(brand);
  const brandLabel = GOLD_BRANDS.find((b) => b.value === brand)?.label ?? brand;

  if (isLoading) {
    return (
      <div className="mt-3 p-3 bg-surface-secondary rounded-lg animate-pulse">
        <div className="h-4 bg-border rounded w-3/4 mb-2" />
        <div className="h-3 bg-border rounded w-1/2" />
      </div>
    );
  }

  if (isError || !price || price.buyPrice === 0) {
    return (
      <div className="mt-3 p-3 bg-surface-secondary rounded-lg">
        <div className="flex items-center gap-2">
          <span className="text-caption">🥇</span>
          <div>
            <p className="text-caption text-text-secondary">
              {brandLabel} · {weightGrams}g
            </p>
            <p className="text-caption text-text-muted">
              Harga tidak tersedia saat ini
            </p>
          </div>
        </div>
      </div>
    );
  }

  const estimatedValue = calculateGoldValue(weightGrams, price.sellPrice);
  const updatedTime = new Date(price.updatedAt).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="mt-3 p-3 bg-surface-secondary rounded-lg space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-body">🥇</span>
          <span className="text-caption font-medium text-text-primary">
            {brandLabel} · {weightGrams}g
          </span>
        </div>
        <span className="text-caption text-text-muted">
          {updatedTime}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-caption">
        <div>
          <p className="text-text-muted">Harga Beli/g</p>
          <p className="text-text-secondary font-medium">
            {formatIDR(price.buyPrice)}
          </p>
        </div>
        <div>
          <p className="text-text-muted">Harga Jual/g</p>
          <p className="text-text-secondary font-medium">
            {formatIDR(price.sellPrice)}
          </p>
        </div>
      </div>

      <div className="pt-1 border-t border-border">
        <div className="flex justify-between items-center">
          <p className="text-caption text-text-muted">Estimasi Nilai</p>
          <p className="text-body font-semibold text-success">
            {formatIDR(estimatedValue)}
          </p>
        </div>
      </div>
    </div>
  );
}
