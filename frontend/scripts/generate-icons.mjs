import sharp from 'sharp';
import { readFileSync, mkdirSync, copyFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = resolve(__dirname, '..', 'public');
const iconsDir = resolve(publicDir, 'icons');

const sizes = [192, 512];

async function generatePngIcons() {
  for (const size of sizes) {
    const svgPath = resolve(iconsDir, `icon-${size}.svg`);
    const pngPath = resolve(iconsDir, `icon-${size}.png`);

    const svgBuffer = readFileSync(svgPath);
    await sharp(svgBuffer).resize(size, size).png().toFile(pngPath);

    console.log(`Generated: icon-${size}.png`);
  }
  console.log('Done! PNG icons generated successfully.');
}

async function generateEcommerceIcons() {
  const ecomIconsDir = resolve(__dirname, '..', '..', '..', 'Stockpulse-Ecommerce', 'ecommerce-frontend', 'public', 'icons');
  mkdirSync(ecomIconsDir, { recursive: true });

  const svg192 = `<svg xmlns="http://www.w3.org/2000/svg" width="192" height="192" viewBox="0 0 192 192">
  <rect width="192" height="192" rx="40" fill="url(#grad)"/>
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#059669"/>
      <stop offset="100%" style="stop-color:#0d9488"/>
    </linearGradient>
  </defs>
  <path d="M64 72h64l-8 48H72L64 72z" fill="none" stroke="white" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M64 72L58 52h-10" fill="none" stroke="white" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="80" cy="140" r="8" fill="white"/>
  <circle cx="112" cy="140" r="8" fill="white"/>
</svg>`;

  const svg512 = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="100" fill="url(#grad)"/>
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#059669"/>
      <stop offset="100%" style="stop-color:#0d9488"/>
    </linearGradient>
  </defs>
  <path d="M170 192h172l-22 128H192L170 192z" fill="none" stroke="white" stroke-width="22" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M170 192L154 138h-28" fill="none" stroke="white" stroke-width="22" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="214" cy="374" r="22" fill="white"/>
  <circle cx="298" cy="374" r="22" fill="white"/>
</svg>`;

  for (const size of sizes) {
    const svgStr = size === 192 ? svg192 : svg512;
    const pngPath = resolve(ecomIconsDir, `icon-${size}.png`);
    const svgPath = resolve(ecomIconsDir, `icon-${size}.svg`);

    await sharp(Buffer.from(svgStr)).resize(size, size).png().toFile(pngPath);
    const { writeFileSync } = await import('fs');
    writeFileSync(svgPath, svgStr);
    console.log(`Generated ecommerce: icon-${size}.png + svg`);
  }

  console.log('Done! Ecommerce icons generated successfully.');
}

await generatePngIcons();
await generateEcommerceIcons();
