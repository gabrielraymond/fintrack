import { NextResponse } from 'next/server';

export interface GoldPriceData {
  brand: 'antam' | 'galeri24';
  buyPrice: number;   // harga beli per gram (IDR)
  sellPrice: number;  // harga jual/buyback per gram (IDR)
  updatedAt: string;
}

interface CachedPrices {
  data: GoldPriceData[];
  fetchedAt: number;
}

// In-memory cache with 15-minute TTL
let cache: CachedPrices | null = null;
const CACHE_TTL_MS = 15 * 60 * 1000;

async function fetchFromLogamMuliaAPI(): Promise<GoldPriceData[]> {
  const results: GoldPriceData[] = [];

  try {
    // Fetch from logam-mulia-api (community scraper) for Antam prices
    const antamRes = await fetch(
      'https://logam-mulia-api.vercel.app/prices/hargaemas-org',
      { signal: AbortSignal.timeout(10000) }
    );

    if (antamRes.ok) {
      const antamData = await antamRes.json();
      if (antamData?.data && Array.isArray(antamData.data)) {
        // Find antam entry
        const antamEntry = antamData.data.find(
          (d: { type?: string }) =>
            d.type?.toLowerCase() === 'antam' || d.type?.toLowerCase() === 'antam (1gr)'
        );
        if (antamEntry && antamEntry.buy) {
          results.push({
            brand: 'antam',
            buyPrice: Number(antamEntry.buy),
            sellPrice: Number(antamEntry.sel || antamEntry.sell || antamEntry.buy * 0.95),
            updatedAt: new Date().toISOString(),
          });
        }

        // Find galeri24/UBS entry (Galeri24 is Pegadaian's gold brand)
        const galeri24Entry = antamData.data.find(
          (d: { type?: string }) =>
            d.type?.toLowerCase().includes('galeri') ||
            d.type?.toLowerCase().includes('ubs') ||
            d.type?.toLowerCase().includes('pegadaian')
        );
        if (galeri24Entry && galeri24Entry.buy) {
          results.push({
            brand: 'galeri24',
            buyPrice: Number(galeri24Entry.buy),
            sellPrice: Number(galeri24Entry.sel || galeri24Entry.sell || galeri24Entry.buy * 0.95),
            updatedAt: new Date().toISOString(),
          });
        }
      }
    }
  } catch {
    // Silently fail, will try fallback
  }

  return results;
}

async function fetchFromPegadaian(): Promise<GoldPriceData | null> {
  try {
    const res = await fetch(
      'https://logam-mulia-api.vercel.app/prices/pegadaian',
      { signal: AbortSignal.timeout(10000) }
    );

    if (res.ok) {
      const data = await res.json();
      if (data?.data && Array.isArray(data.data) && data.data.length > 0) {
        const entry = data.data[0];
        if (entry.buy) {
          return {
            brand: 'galeri24',
            buyPrice: Number(entry.buy),
            sellPrice: Number(entry.sel || entry.sell || entry.buy * 0.95),
            updatedAt: new Date().toISOString(),
          };
        }
      }
    }
  } catch {
    // Silently fail
  }
  return null;
}

async function fetchGoldPrices(): Promise<GoldPriceData[]> {
  const results = await fetchFromLogamMuliaAPI();

  // If we don't have galeri24 price, try pegadaian endpoint
  if (!results.find((r) => r.brand === 'galeri24')) {
    const galeri24 = await fetchFromPegadaian();
    if (galeri24) results.push(galeri24);
  }

  // If we still don't have any data, return fallback with last known approximate prices
  if (results.length === 0) {
    return [
      {
        brand: 'antam',
        buyPrice: 0,
        sellPrice: 0,
        updatedAt: new Date().toISOString(),
      },
      {
        brand: 'galeri24',
        buyPrice: 0,
        sellPrice: 0,
        updatedAt: new Date().toISOString(),
      },
    ];
  }

  return results;
}

export async function GET() {
  try {
    // Check cache
    if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
      return NextResponse.json({
        data: cache.data,
        cached: true,
        cachedAt: new Date(cache.fetchedAt).toISOString(),
      });
    }

    const prices = await fetchGoldPrices();

    // Update cache
    cache = { data: prices, fetchedAt: Date.now() };

    return NextResponse.json({
      data: prices,
      cached: false,
      cachedAt: new Date().toISOString(),
    });
  } catch {
    // Return cached data if available, even if stale
    if (cache) {
      return NextResponse.json({
        data: cache.data,
        cached: true,
        stale: true,
        cachedAt: new Date(cache.fetchedAt).toISOString(),
      });
    }

    return NextResponse.json(
      { error: 'Gagal mengambil harga emas' },
      { status: 500 }
    );
  }
}
