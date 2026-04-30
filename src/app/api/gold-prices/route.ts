import { NextResponse } from 'next/server';

export interface GoldPriceData {
  brand: 'antam' | 'galeri24';
  sellPrice: number;    // harga jual per gram (harga beli konsumen)
  buybackPrice: number; // harga buyback per gram (harga jual konsumen)
  updatedAt: string;
}

interface CachedPrices {
  data: GoldPriceData[];
  fetchedAt: number;
}

// In-memory cache with 30-minute TTL
let cache: CachedPrices | null = null;
const CACHE_TTL_MS = 30 * 60 * 1000;

function parsePrice(text: string): number {
  // Remove "Rp", dots, commas, spaces and parse
  const cleaned = text.replace(/[Rp.\s]/g, '').replace(/,/g, '');
  const num = parseInt(cleaned, 10);
  return isNaN(num) ? 0 : num;
}

async function scrapeGoldpedia(): Promise<GoldPriceData[]> {
  const results: GoldPriceData[] = [];

  try {
    // Fetch the main goldpedia page which has a summary table
    const res = await fetch('https://www.goldpedia.org/', {
      signal: AbortSignal.timeout(15000),
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml',
      },
    });

    if (!res.ok) return results;

    const html = await res.text();

    // Parse the "HARGA EMAS 1 GRAM" table
    // Format: | Antam (LM) | Rp2,775,923 | Rp2,549,000 |
    //         | Galeri24    | Rp2,775,000 | Rp2,605,000 |

    // Antam (LM) - sell price and buyback
    const antamMatch = html.match(
      /Antam\s*\(LM\)[^<]*<[^>]*>[^<]*<[^>]*>\s*Rp([\d.,]+)[^<]*<[^>]*>[^<]*<[^>]*>\s*Rp([\d.,]+)/i
    );
    if (antamMatch) {
      results.push({
        brand: 'antam',
        sellPrice: parsePrice(antamMatch[1]),
        buybackPrice: parsePrice(antamMatch[2]),
        updatedAt: new Date().toISOString(),
      });
    }

    // Galeri24 - sell price and buyback (non-Pegadaian entry)
    const galeriMatch = html.match(
      /(?<!Antam\s*\()Galeri24(?!\s*\(Pegadaian\))[^<]*<[^>]*>[^<]*<[^>]*>\s*Rp([\d.,]+)[^<]*<[^>]*>[^<]*<[^>]*>\s*Rp([\d.,]+)/i
    );
    if (galeriMatch) {
      results.push({
        brand: 'galeri24',
        sellPrice: parsePrice(galeriMatch[1]),
        buybackPrice: parsePrice(galeriMatch[2]),
        updatedAt: new Date().toISOString(),
      });
    }
  } catch {
    // Silently fail
  }

  return results;
}

async function scrapeLogamMuliaAntam(): Promise<GoldPriceData | null> {
  try {
    const res = await fetch('https://www.logammulia.com/en/harga-emas-hari-ini', {
      signal: AbortSignal.timeout(15000),
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml',
      },
    });

    if (!res.ok) return null;

    const html = await res.text();

    // Find the 1 gr row: "1 gr" followed by base price and price with tax
    // Pattern: 1 gr ... 2,769,000 ... 2,775,923
    const match = html.match(
      /1\s*gr[^<]*<[^>]*>\s*([\d,]+)\s*<[^>]*>\s*([\d,]+)/
    );

    if (match) {
      const sellPrice = parseInt(match[2].replace(/,/g, ''), 10);
      return {
        brand: 'antam',
        sellPrice: isNaN(sellPrice) ? 0 : sellPrice,
        buybackPrice: 0, // Will need buyback from another source
        updatedAt: new Date().toISOString(),
      };
    }
  } catch {
    // Silently fail
  }
  return null;
}

async function fetchFromLogamMuliaAPI(): Promise<GoldPriceData[]> {
  const results: GoldPriceData[] = [];

  try {
    const res = await fetch(
      'https://logam-mulia-api.vercel.app/prices/hargaemas-org',
      { signal: AbortSignal.timeout(10000) }
    );

    if (res.ok) {
      const json = await res.json();
      if (json?.data && Array.isArray(json.data)) {
        for (const entry of json.data) {
          const type = (entry.type || '').toLowerCase();
          if (type === 'antam' || type.includes('antam')) {
            results.push({
              brand: 'antam',
              sellPrice: Number(entry.buy) || 0,
              buybackPrice: Number(entry.sel || entry.sell) || 0,
              updatedAt: new Date().toISOString(),
            });
          }
        }
      }
    }
  } catch {
    // Silently fail
  }

  try {
    const res = await fetch(
      'https://logam-mulia-api.vercel.app/prices/pegadaian',
      { signal: AbortSignal.timeout(10000) }
    );

    if (res.ok) {
      const json = await res.json();
      if (json?.data && Array.isArray(json.data)) {
        for (const entry of json.data) {
          const type = (entry.type || '').toLowerCase();
          if (type.includes('galeri') || type.includes('24')) {
            results.push({
              brand: 'galeri24',
              sellPrice: Number(entry.buy) || 0,
              buybackPrice: Number(entry.sel || entry.sell) || 0,
              updatedAt: new Date().toISOString(),
            });
            break;
          }
        }
        // If no galeri24 found, use first entry as galeri24
        if (!results.find((r) => r.brand === 'galeri24') && json.data.length > 0) {
          const entry = json.data[0];
          results.push({
            brand: 'galeri24',
            sellPrice: Number(entry.buy) || 0,
            buybackPrice: Number(entry.sel || entry.sell) || 0,
            updatedAt: new Date().toISOString(),
          });
        }
      }
    }
  } catch {
    // Silently fail
  }

  return results;
}

async function fetchGoldPrices(): Promise<GoldPriceData[]> {
  // Strategy 1: Try goldpedia.org (has both Antam and Galeri24 with buyback)
  let results = await scrapeGoldpedia();

  // Strategy 2: If goldpedia failed, try logam-mulia-api
  if (results.length === 0) {
    results = await fetchFromLogamMuliaAPI();
  }

  // Strategy 3: If still no Antam, try logammulia.com directly
  if (!results.find((r) => r.brand === 'antam')) {
    const antam = await scrapeLogamMuliaAntam();
    if (antam) results.push(antam);
  }

  // Fill in missing brands with zero prices (UI will show "tidak tersedia")
  if (!results.find((r) => r.brand === 'antam')) {
    results.push({
      brand: 'antam',
      sellPrice: 0,
      buybackPrice: 0,
      updatedAt: new Date().toISOString(),
    });
  }
  if (!results.find((r) => r.brand === 'galeri24')) {
    results.push({
      brand: 'galeri24',
      sellPrice: 0,
      buybackPrice: 0,
      updatedAt: new Date().toISOString(),
    });
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

    // Only cache if we got real data
    if (prices.some((p) => p.sellPrice > 0 || p.buybackPrice > 0)) {
      cache = { data: prices, fetchedAt: Date.now() };
    }

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
