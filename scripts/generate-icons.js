/**
 * Generate PWA icons as valid PNG files.
 * Renders the FinTrack brand icon:
 *   - Navy (#0B2340) rounded-square background
 *   - White "F" letterform (vertical bar + top bar + mid bar)
 *   - Teal (#0D9E75) upward trend line + dot in top-right
 *
 * Uses raw PNG encoding with zlib (built-in Node.js) — no external deps.
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// ─── PNG primitives ──────────────────────────────────────────────────────────

function createPNG(width, height, drawFn) {
  const pixels = Buffer.alloc(width * height * 4, 0);
  drawFn(pixels, width, height);

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; ihdr[9] = 6; // RGBA
  const ihdrChunk = makeChunk('IHDR', ihdr);

  const rawData = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    rawData[y * (1 + width * 4)] = 0;
    pixels.copy(rawData, y * (1 + width * 4) + 1, y * width * 4, (y + 1) * width * 4);
  }
  const idatChunk = makeChunk('IDAT', zlib.deflateSync(rawData));
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function makeChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const typeBuffer = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);
  return Buffer.concat([length, typeBuffer, data, crc]);
}

function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0);
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

// ─── Drawing helpers ─────────────────────────────────────────────────────────

function setPixel(pixels, width, x, y, r, g, b, a = 255) {
  x = Math.round(x); y = Math.round(y);
  if (x < 0 || x >= width || y < 0 || y >= pixels.length / width / 4) return;
  const idx = (y * width + x) * 4;
  // Alpha-blend over existing pixel
  const srcA = a / 255;
  const dstA = pixels[idx + 3] / 255;
  const outA = srcA + dstA * (1 - srcA);
  if (outA === 0) return;
  pixels[idx]     = Math.round((r * srcA + pixels[idx]     * dstA * (1 - srcA)) / outA);
  pixels[idx + 1] = Math.round((g * srcA + pixels[idx + 1] * dstA * (1 - srcA)) / outA);
  pixels[idx + 2] = Math.round((b * srcA + pixels[idx + 2] * dstA * (1 - srcA)) / outA);
  pixels[idx + 3] = Math.round(outA * 255);
}

/** Fill a rectangle */
function fillRect(pixels, W, x, y, w, h, r, g, b, a = 255) {
  for (let py = y; py < y + h; py++)
    for (let px = x; px < x + w; px++)
      setPixel(pixels, W, px, py, r, g, b, a);
}

/** Rounded rectangle fill */
function fillRoundRect(pixels, W, H, x, y, w, h, radius, r, g, b, a = 255) {
  for (let py = y; py < y + h; py++) {
    for (let px = x; px < x + w; px++) {
      const dx = Math.min(px - x, x + w - 1 - px);
      const dy = Math.min(py - y, y + h - 1 - py);
      if (dx < radius && dy < radius) {
        const dist = Math.sqrt((radius - dx) ** 2 + (radius - dy) ** 2);
        if (dist > radius) continue;
        // Anti-alias edge
        const alpha = Math.max(0, Math.min(1, radius - dist + 0.5));
        setPixel(pixels, W, px, py, r, g, b, Math.round(a * alpha));
      } else {
        setPixel(pixels, W, px, py, r, g, b, a);
      }
    }
  }
}

/** Draw anti-aliased thick line using Wu's algorithm approximation */
function drawThickLine(pixels, W, x0, y0, x1, y1, thickness, r, g, b) {
  const dx = x1 - x0, dy = y1 - y0;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len === 0) return;
  const nx = -dy / len, ny = dx / len; // normal
  const steps = Math.ceil(len * 2);
  const half = thickness / 2;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const cx = x0 + dx * t, cy = y0 + dy * t;
    for (let d = -half - 1; d <= half + 1; d++) {
      const px = cx + nx * d, py = cy + ny * d;
      const dist = Math.abs(d);
      const alpha = Math.max(0, Math.min(1, half - dist + 0.5));
      if (alpha > 0) setPixel(pixels, W, Math.round(px), Math.round(py), r, g, b, Math.round(255 * alpha));
    }
  }
}

/** Filled circle */
function fillCircle(pixels, W, cx, cy, radius, r, g, b) {
  for (let py = Math.floor(cy - radius - 1); py <= Math.ceil(cy + radius + 1); py++) {
    for (let px = Math.floor(cx - radius - 1); px <= Math.ceil(cx + radius + 1); px++) {
      const dist = Math.sqrt((px - cx) ** 2 + (py - cy) ** 2);
      const alpha = Math.max(0, Math.min(1, radius - dist + 0.5));
      if (alpha > 0) setPixel(pixels, W, px, py, r, g, b, Math.round(255 * alpha));
    }
  }
}

// ─── FinTrack icon renderer ───────────────────────────────────────────────────

function drawFinTrackIcon(pixels, W, H) {
  const s = W / 192; // scale factor relative to 192px base

  // ── Background: navy rounded square ──
  const radius = Math.round(36 * s);
  fillRoundRect(pixels, W, H, 0, 0, W, H, radius, 0x0B, 0x23, 0x40);

  // ── White "F" letterform ──
  // Based on SVG: vertical bar x=16,y=14,w=10,h=56 | top bar x=16,y=14,w=37,h=10 | mid bar x=16,y=35,w=25,h=9
  // Scale from 84px SVG viewBox to W
  const sv = W / 84; // SVG-to-canvas scale

  const barX  = Math.round(16 * sv), barY = Math.round(14 * sv);
  const barW  = Math.round(10 * sv), barH = Math.round(56 * sv);
  const topW  = Math.round(37 * sv), topH = Math.round(10 * sv);
  const midX  = Math.round(16 * sv), midY = Math.round(35 * sv);
  const midW  = Math.round(25 * sv), midH = Math.round(9  * sv);

  fillRect(pixels, W, barX, barY, barW, barH, 255, 255, 255); // vertical
  fillRect(pixels, W, barX, barY, topW, topH, 255, 255, 255); // top bar
  fillRect(pixels, W, midX, midY, midW, midH, 255, 255, 255); // mid bar

  // ── Teal trend line + dot ──
  // SVG points: 53,19 → 63,30 → 72,19 → 79,10  (in 84px space)
  const pts = [[53,19],[63,30],[72,19],[79,10]].map(([x,y]) => [x * sv, y * sv]);
  const lw = Math.max(2, Math.round(3.5 * sv));
  for (let i = 0; i < pts.length - 1; i++) {
    drawThickLine(pixels, W, pts[i][0], pts[i][1], pts[i+1][0], pts[i+1][1], lw, 0x2D, 0xD4, 0xA0);
  }
  // Dot at end point
  const dotR = Math.max(2, Math.round(4.5 * sv));
  fillCircle(pixels, W, pts[pts.length-1][0], pts[pts.length-1][1], dotR, 0x2D, 0xD4, 0xA0);
}

// ─── Generate files ───────────────────────────────────────────────────────────

const iconsDir = path.join(__dirname, '..', 'public', 'icons');
fs.mkdirSync(iconsDir, { recursive: true });

const sizes = [
  { name: 'icon-192x192.png',    width: 192, height: 192 },
  { name: 'icon-512x512.png',    width: 512, height: 512 },
  { name: 'apple-touch-icon.png', width: 180, height: 180 },
];

for (const { name, width, height } of sizes) {
  const png = createPNG(width, height, drawFinTrackIcon);
  const filePath = path.join(iconsDir, name);
  fs.writeFileSync(filePath, png);
  console.log(`✓ ${name} (${width}x${height}, ${png.length} bytes)`);
}

console.log('\nDone! All PWA icons generated with new FinTrack brand.');
