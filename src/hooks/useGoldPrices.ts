'use client';

import { useQuery } from '@tanstack/react-query';
import type { GoldBrand } from '@/types';

export interface GoldPrice {
  brand: GoldBrand;
  buyPrice: number;
  sellPrice: number;
  updatedAt: string;
}

interface GoldPriceResponse {
  data: GoldPrice[];
  cached: boolean;
  cachedAt: string;
}

async function fetchGoldPrices(): Promise<GoldPrice[]> {
  const res = await fetch('/api/gold-prices');
  if (!res.ok) throw new Error('Failed to fetch gold prices');
  const json: GoldPriceResponse = await res.json();
  return json.data;
}

// ── Query Keys ──────────────────────────────────────────────
export const goldPriceKeys = {
  all: ['gold-prices'] as const,
};

/**
 * Fetches realtime gold prices for Antam and Galeri24.
 * Auto-refreshes every 15 minutes.
 */
export function useGoldPrices() {
  return useQuery({
    queryKey: goldPriceKeys.all,
    queryFn: fetchGoldPrices,
    staleTime: 15 * 60 * 1000, // 15 minutes
    refetchInterval: 15 * 60 * 1000, // auto-refresh every 15 min
    retry: 2,
  });
}

/**
 * Returns the price for a specific gold brand.
 */
export function useGoldPrice(brand: GoldBrand | null) {
  const { data: prices, ...rest } = useGoldPrices();
  const price = brand ? prices?.find((p) => p.brand === brand) ?? null : null;
  return { price, ...rest };
}

/**
 * Calculates the estimated value of gold holdings.
 */
export function calculateGoldValue(
  weightGrams: number,
  sellPricePerGram: number
): number {
  return Math.round(weightGrams * sellPricePerGram);
}
