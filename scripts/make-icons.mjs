// Генерация PWA-иконок из SVG через sharp.
// Запуск: npm run icons
import sharp from 'sharp';
import { mkdirSync, writeFile } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const pWriteFile = promisify(writeFile);
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pub = join(root, 'public');
mkdirSync(pub, { recursive: true });

function iconSvg({ rounded = true, scale = 1 }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#4f46e5"/>
      <stop offset="1" stop-color="#7c3aed"/>
    </linearGradient>
    <mask id="tk">
      <rect x="106" y="166" width="300" height="180" rx="22" fill="#fff"/>
      <circle cx="106" cy="256" r="26" fill="#000"/>
      <circle cx="406" cy="256" r="26" fill="#000"/>
    </mask>
  </defs>
  <rect width="512" height="512" rx="${rounded ? 120 : 0}" fill="url(#bg)"/>
  <g transform="translate(256 256) scale(${scale}) translate(-256 -256)">
    <rect x="106" y="166" width="300" height="180" rx="22" fill="#ffffff" mask="url(#tk)"/>
    <line x1="206" y1="188" x2="206" y2="324" stroke="#c7d2fe" stroke-width="9" stroke-dasharray="1 22" stroke-linecap="round"/>
    <circle cx="156" cy="238" r="15" fill="#c7d2fe"/>
    <rect x="138" y="268" width="36" height="24" rx="9" fill="#e0e7ff"/>
    <rect x="244" y="214" width="132" height="26" rx="13" fill="#c7d2fe"/>
    <rect x="244" y="266" width="96" height="26" rx="13" fill="#e0e7ff"/>
  </g>
</svg>`;
}

const variants = [
  ['pwa-192.png', 192, iconSvg({ rounded: true, scale: 1 })],
  ['pwa-512.png', 512, iconSvg({ rounded: true, scale: 1 })],
  ['maskable-512.png', 512, iconSvg({ rounded: false, scale: 0.68 })],
  ['apple-touch-icon.png', 180, iconSvg({ rounded: false, scale: 0.82 })]
];

for (const [name, size, svg] of variants) {
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(join(pub, name));
  console.log(`✓ ${name} (${size}x${size})`);
}

await pWriteFile(join(pub, 'favicon.svg'), iconSvg({ rounded: true, scale: 1 }), 'utf8');
console.log('✓ favicon.svg');
