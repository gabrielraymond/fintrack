'use client';

import { useQuery } from '@tanstack/react-query';
import type { GoldBrand } from '@/types';

export interface GoldPrice {
  brand: GoldBrand;
  sellPrice: number;    // harga jual per gram (harga beli konsumen)
  buybackPrice: number; // harga buyback per gram (harga jual konsumen ke toko)
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
 * Auto-refreshes every 30 minutes.
 */
export function useGoldPrices() {
  return useQuery({
    queryKey: goldPriceKeys.all,
    queryFn: fetchGoldPrices,
    staleTime: 30 * 60 * 1000,
    refetchInterval: 30 * 60 * 1000,
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
