/**
 * Generate PWA icons as valid PNG files.
 * Uses raw PNG encoding with zlib (built-in Node.js) — no external dependencies.
 * Creates green (#628141) background with white "F" letter.
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function createPNG(width, height, drawFn) {
  // Create RGBA pixel buffer
  const pixels = Buffer.alloc(width * height * 4);

  drawFn(pixels, width, height);

  // Build PNG file
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // color type: RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace
  const ihdrChunk = makeChunk('IHDR', ihdr);

  // IDAT chunk - raw pixel data with filter bytes
  const rawData = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    rawData[y * (1 + width * 4)] = 0; // filter: none
    pixels.copy(rawData, y * (1 + width * 4) + 1, y * width * 4, (y + 1) * width * 4);
  }
  const compressed = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', compressed);

  // IEND chunk
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function makeChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const typeBuffer = Buffer.from(type, 'ascii');
  const crcData = Buffer.concat([typeBuffer, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(crcData), 0);
  return Buffer.concat([length, typeBuffer, data, crc]);
}

function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0);
    }
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function setPixel(pixels, width, x, y, r, g, b, a) {
  const idx = (y * width + x) * 4;
  pixels[idx] = r;
  pixels[idx + 1] = g;
  pixels[idx + 2] = b;
  pixels[idx + 3] = a;
}

function drawIcon(pixels, width, height) {
  // Background: #628141
  const bgR = 0x62, bgG = 0x81, bgB = 0x41;
  // Letter color: white
  const fgR = 255, fgG = 255, fgB = 255;

  // Fill background
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      setPixel(pixels, width, x, y, bgR, bgG, bgB, 255);
    }
  }

  // Draw "F" letter - proportional to icon size
  const margin = Math.floor(width * 0.25);
  const thickness = Math.max(Math.floor(width * 0.12), 2);
  const left = margin;
  const right = width - margin;
  const top = margin;
  const bottom = height - margin;
  const midY = Math.floor((top + bottom) / 2);

  // Vertical bar of F
  for (let y = top; y < bottom; y++) {
    for (let x = left; x < left + thickness; x++) {
      if (x >= 0 && x < width && y >= 0 && y < height) {
        setPixel(pixels, width, x, y, fgR, fgG, fgB, 255);
      }
    }
  }

  // Top horizontal bar of F
  for (let y = top; y < top + thickness; y++) {
    for (let x = left; x < right; x++) {
      if (x >= 0 && x < width && y >= 0 && y < height) {
        setPixel(pixels, width, x, y, fgR, fgG, fgB, 255);
      }
    }
  }

  // Middle horizontal bar of F (slightly shorter)
  const midRight = left + Math.floor((right - left) * 0.75);
  for (let y = midY - Math.floor(thickness / 2); y < midY + Math.ceil(thickness / 2); y++) {
    for (let x = left; x < midRight; x++) {
      if (x >= 0 && x < width && y >= 0 && y < height) {
        setPixel(pixels, width, x, y, fgR, fgG, fgB, 255);
      }
    }
  }
}

// Ensure output directory exists
const iconsDir = path.join(__dirname, '..', 'public', 'icons');
fs.mkdirSync(iconsDir, { recursive: true });

// Generate icons
const sizes = [
  { name: 'icon-192x192.png', width: 192, height: 192 },
  { name: 'icon-512x512.png', width: 512, height: 512 },
  { name: 'apple-touch-icon.png', width: 180, height: 180 },
];

for (const { name, width, height } of sizes) {
  const png = createPNG(width, height, drawIcon);
  const filePath = path.join(iconsDir, name);
  fs.writeFileSync(filePath, png);
  console.log(`Created ${filePath} (${width}x${height}, ${png.length} bytes)`);
}

console.log('Done! All icons generated.');
