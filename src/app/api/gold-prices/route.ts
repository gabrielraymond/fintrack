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
 * Primary source for Antam: goldpedia.org homepage table
 * HTML structure (as of May 2026):
 *   <td ...><a href="/pasar/antam/">Antam (LM)</a></td>
 *   <td class="align-right">Rp2,847,100</td>   ← sell
 *   <td class="align-right">Rp2,645,000</td>   ← buyback
 */
async function scrapeAntamFromGoldpedia(): Promise<GoldPriceData | null> {
  const res = await fetch('https://www.goldpedia.org/', {
    signal: AbortSignal.timeout(15000),
    headers: FETCH_HEADERS,
  });
  if (!res.ok) return null;
  const html = await res.text();
  const now = new Date().toISOString();

  const antamRegex = /href="\/pasar\/antam\/">Antam\s*\(LM\)<\/a><\/td>\s*<td[^>]*>Rp([\d,]+)<\/td>\s*<td[^>]*>Rp([\d,]+)<\/td>/;
  const m = html.match(antamRegex);
  if (!m) return null;

  return {
    brand: 'antam',
    sellPrice: parsePrice(m[1]),
    buybackPrice: parsePrice(m[2]),
    updatedAt: now,
  };
}

/**
 * Primary source for Galeri24: goldpedia.org/pasar/galeri24/
 * Uses the dedicated page which shows Galeri24 murni (bukan Antam di Galeri24).
 * HTML structure (as of May 2026):
 *   <div id="buy"  class="tab-content active"><div class="price-top"><span class="price">2,822,000</span>  ← sell
 *   <div id="sell" class="tab-content">       <div class="price-top"><span class="price">2,646,000</span>  ← buyback
 */
async function scrapeGaleri24FromGoldpedia(): Promise<GoldPriceData | null> {
  const res = await fetch('https://www.goldpedia.org/pasar/galeri24/', {
    signal: AbortSignal.timeout(15000),
    headers: FETCH_HEADERS,
  });
  if (!res.ok) return null;
  const html = await res.text();
  const now = new Date().toISOString();

  // sell price: inside id="buy" tab (harga beli konsumen)
  const sellMatch = html.match(/id="buy"[^>]*>[\s\S]*?<span class="price">([\d,]+)<\/span>/);
  // buyback price: inside id="sell" tab (harga jual konsumen ke toko)
  const buybackMatch = html.match(/id="sell"[^>]*>[\s\S]*?<span class="price">([\d,]+)<\/span>/);

  const sellPrice = sellMatch ? parsePrice(sellMatch[1]) : 0;
  const buybackPrice = buybackMatch ? parsePrice(buybackMatch[1]) : 0;

  if (sellPrice === 0 && buybackPrice === 0) return null;

  return {
    brand: 'galeri24',
    sellPrice,
    buybackPrice,
    updatedAt: now,
  };
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
  const results: GoldPriceData[] = [];

  // Fetch Antam and Galeri24 in parallel
  const [antamResult, galeriResult] = await Promise.allSettled([
    scrapeAntamFromGoldpedia().catch(() => null),
    scrapeGaleri24FromGoldpedia().catch(() => null),
  ]);

  const antam = antamResult.status === 'fulfilled' ? antamResult.value : null;
  const galeri = galeriResult.status === 'fulfilled' ? galeriResult.value : null;

  if (antam) results.push(antam);
  if (galeri) results.push(galeri);

  // Fallback for Antam: logammulia.com
  if (!results.find((r) => r.brand === 'antam')) {
    try {
      const antamFallback = await scrapeLogamMulia();
      if (antamFallback) results.push(antamFallback);
    } catch {
      // Silently fail
    }
  }

  // Fill missing brands with zero (UI shows "tidak tersedia")
  if (!results.find((r) => r.brand === 'antam')) {
    results.push({ brand: 'antam', sellPrice: 0, buybackPrice: 0, updatedAt: new Date().toISOString() });
  }
  if (!results.find((r) => r.brand === 'galeri24')) {
    results.push({ brand: 'galeri24', sellPrice: 0, buybackPrice: 0, updatedAt: new Date().toISOString() });
  }

  return results;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const force = searchParams.get('force') === '1';

  try {
    // Serve from cache if fresh (unless force refresh requested)
    if (!force && cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
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
