'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
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

async function fetchGoldPrices(force = false): Promise<GoldPrice[]> {
  const url = force ? '/api/gold-prices?force=1' : '/api/gold-prices';
  const res = await fetch(url);
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
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: goldPriceKeys.all,
    queryFn: () => fetchGoldPrices(false),
    staleTime: 30 * 60 * 1000,
    refetchInterval: 30 * 60 * 1000,
    retry: 2,
  });

  const forceRefetch = async () => {
    const fresh = await fetchGoldPrices(true);
    queryClient.setQueryData(goldPriceKeys.all, fresh);
    return fresh;
  };

  return { ...query, forceRefetch };
}

/**
 * Returns the price for a specific gold brand.
 */
export function useGoldPrice(brand: GoldBrand | null) {
  const { data: prices, forceRefetch, isFetching, ...rest } = useGoldPrices();
  const price = brand ? prices?.find((p) => p.brand === brand) ?? null : null;
  return { price, forceRefetch, isFetching, ...rest };
}
