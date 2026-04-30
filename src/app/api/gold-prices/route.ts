import { NextResponse } from 'next/server';

export interface GoldPriceData {
  brand: 'antam' | 'galeri24';
  sellPrice: number;    // harga jual per gram (harga beli konsumen)
  buybackPrice: number; // harga buyback per gram (harga jual konsumen ke toko)
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
  const cleaned = text.replace(/[,.\s]/g, '');
  const num = parseInt(cleaned, 10);
  return isNaN(num) ? 0 : num;
}

const FETCH_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Accept': 'text/html,application/xhtml+xml',
};

/**
 * Primary source: goldpedia.org
 * Returns both Antam and Galeri24 with sell + buyback prices.
 * Data is server-rendered in HTML table cells.
 */
async function scrapeGoldpedia(): Promise<GoldPriceData[]> {
  const results: GoldPriceData[] = [];

  const res = await fetch('https://www.goldpedia.org/', {
    signal: AbortSignal.timeout(15000),
    headers: FETCH_HEADERS,
  });

  if (!res.ok) return results;
  const html = await res.text();
  const now = new Date().toISOString();

  // Antam (LM): <a>Antam (LM)</a></td> <td>Rp2,775,923</td> <td>Rp2,549,000</td>
  const antamRegex = /Antam\s*\(LM\)<\/a><\/td>\s*<td[^>]*>Rp([\d,]+)<\/td>\s*<td[^>]*>Rp([\d,]+)<\/td>/;
  const antamMatch = html.match(antamRegex);
  if (antamMatch) {
    results.push({
      brand: 'antam',
      sellPrice: parsePrice(antamMatch[1]),
      buybackPrice: parsePrice(antamMatch[2]),
      updatedAt: now,
    });
  }

  // Galeri24 (standalone): <a>Galeri24</a></td> <td>Rp2,775,000</td> <td>Rp2,605,000</td>
  const galeriRegex = /(?<!\()Galeri24<\/a><\/td>\s*<td[^>]*>Rp([\d,]+)<\/td>\s*<td[^>]*>Rp([\d,]+)<\/td>/;
  const galeriMatch = html.match(galeriRegex);
  if (galeriMatch) {
    results.push({
      brand: 'galeri24',
      sellPrice: parsePrice(galeriMatch[1]),
      buybackPrice: parsePrice(galeriMatch[2]),
      updatedAt: now,
    });
  }

  return results;
}

/**
 * Fallback source: logammulia.com (official Antam site)
 * Returns Antam sell price from price table + buyback from sell page.
 */
async function scrapeLogamMulia(): Promise<GoldPriceData | null> {
  const now = new Date().toISOString();

  // Get sell price from main page
  const mainRes = await fetch('https://www.logammulia.com/en/harga-emas-hari-ini', {
    signal: AbortSignal.timeout(15000),
    headers: FETCH_HEADERS,
  });

  if (!mainRes.ok) return null;
  const mainHtml = await mainRes.text();

  // Find 1 gr row: <td>1 gr</td> <td>2,769,000</td> <td>2,775,923</td>
  const sellMatch = mainHtml.match(
    /1\s*gr<\/td>\s*<td[^>]*>\s*([\d,]+)\s*<\/td>\s*(?:<!--[\s\S]*?-->\s*)?<td[^>]*>\s*([\d,]+)\s*<\/td>/
  );
  const sellPrice = sellMatch ? parsePrice(sellMatch[2]) : 0;

  // Get buyback price from sell page
  let buybackPrice = 0;
  try {
    const sellRes = await fetch('https://www.logammulia.com/sell/gold', {
      signal: AbortSignal.timeout(15000),
      headers: FETCH_HEADERS,
    });

    if (sellRes.ok) {
      const sellHtml = await sellRes.text();
      // Buyback price appears as "Rp 2,549,000"
      const buybackMatch = sellHtml.match(/Rp\s*([\d,]+(?:,\d{3})*)/);
      if (buybackMatch) {
        buybackPrice = parsePrice(buybackMatch[1]);
      }
    }
  } catch {
    // Buyback fetch failed, continue with sell price only
  }

  if (sellPrice === 0) return null;

  return {
    brand: 'antam',
    sellPrice,
    buybackPrice,
    updatedAt: now,
  };
}

async function fetchGoldPrices(): Promise<GoldPriceData[]> {
  let results: GoldPriceData[] = [];

  // Strategy 1: goldpedia.org (has both Antam + Galeri24 with buyback)
  try {
    results = await scrapeGoldpedia();
  } catch {
    // Silently fail, try fallback
  }

  // Strategy 2: If no Antam from goldpedia, try logammulia.com
  if (!results.find((r) => r.brand === 'antam')) {
    try {
      const antam = await scrapeLogamMulia();
      if (antam) results.push(antam);
    } catch {
      // Silently fail
    }
  }

  // Fill missing brands with zero (UI shows "tidak tersedia")
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
    // Serve from cache if fresh
    if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
      return NextResponse.json({
        data: cache.data,
        cached: true,
        cachedAt: new Date(cache.fetchedAt).toISOString(),
      });
    }

    const prices = await fetchGoldPrices();

    // Only update cache if we got real data
    if (prices.some((p) => p.buybackPrice > 0)) {
      cache = { data: prices, fetchedAt: Date.now() };
    }

    return NextResponse.json({
      data: prices,
      cached: false,
      cachedAt: new Date().toISOString(),
    });
  } catch {
    // Return stale cache if available
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
