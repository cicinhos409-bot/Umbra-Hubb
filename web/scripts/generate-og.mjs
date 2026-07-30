/**
 * Gerador de imagens OG para posts do blog UmbraHub
 *
 * Uso: node scripts/generate-og.mjs "slug-do-post" "Título do Post" "Categoria" "emoji" "#cor"
 *
 * Exemplos:
 *   node scripts/generate-og.mjs "tiktok-2026" "Como Crescer no TikTok" "TikTok" "📱" "#ec4899"
 *   node scripts/generate-og.mjs "shorts-guia" "Guia de YouTube Shorts" "Shorts" "🎬" "#06b6d4"
 */

import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '../public/images/blog');

const [,, slug, title = 'Novo Post', category = 'BLOG', emoji = '✨', accentColor = '#8b5cf6'] = process.argv;

if (!slug) {
  console.error('Uso: node scripts/generate-og.mjs <slug> [título] [categoria] [emoji] [cor]');
  process.exit(1);
}

// Quebra o título em até 2 linhas de ~25 chars
function wrapTitle(text, maxLen = 24) {
  const words = text.split(' ');
  const lines = [];
  let current = '';
  for (const word of words) {
    if ((current + ' ' + word).trim().length > maxLen && current) {
      lines.push(current.trim());
      current = word;
    } else {
      current = (current + ' ' + word).trim();
    }
    if (lines.length === 2) { current = ''; break; }
  }
  if (current) lines.push(current.trim());
  return lines.slice(0, 3);
}

const titleLines = wrapTitle(title, 22);
const titleY = [240, 300, 360];
const darkBg = accentColor + '22'; // hex com alpha

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0f0a1e"/>
      <stop offset="100%" style="stop-color:#1e0a3c"/>
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="15" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>

  <rect width="1200" height="630" fill="url(#bg)"/>
  <circle cx="150" cy="315" r="280" fill="${accentColor}" opacity="0.10"/>
  <circle cx="1050" cy="315" r="220" fill="${accentColor}" opacity="0.08"/>
  <rect x="0" y="0" width="1200" height="5" fill="${accentColor}"/>
  <rect x="80" y="70" width="1040" height="490" rx="24" fill="#ffffff" fill-opacity="0.04" stroke="#ffffff" stroke-opacity="0.07" stroke-width="1"/>

  <rect x="120" y="110" width="${category.length * 13 + 40}" height="38" rx="19" fill="${accentColor}" opacity="0.9"/>
  <text x="${120 + (category.length * 13 + 40) / 2}" y="134" font-family="system-ui,-apple-system,sans-serif" font-size="15" font-weight="700" fill="white" text-anchor="middle" letter-spacing="1">${category.toUpperCase()}</text>

  <text x="200" y="340" font-size="120" text-anchor="middle" filter="url(#glow)">${emoji}</text>

  ${titleLines.map((line, i) => `<text x="420" y="${titleY[i]}" font-family="system-ui,-apple-system,sans-serif" font-size="52" font-weight="900" fill="${i === 1 ? accentColor : 'white'}" letter-spacing="-1">${line}</text>`).join('\n  ')}

  <text x="420" y="440" font-family="system-ui,sans-serif" font-size="18" fill="#94a3b8">UmbraHub Blog · Por Time UmbraHub</text>

  <rect x="960" y="490" width="140" height="50" rx="12" fill="${accentColor}" opacity="0.9"/>
  <text x="1030" y="520" font-family="system-ui,sans-serif" font-size="20" font-weight="900" fill="white" text-anchor="middle">UmbraHub</text>
</svg>`;

mkdirSync(OUT_DIR, { recursive: true });
const outPath = join(OUT_DIR, `${slug}.svg`);
writeFileSync(outPath, svg, 'utf-8');

console.log(`✓ Imagem criada: public/images/blog/${slug}.svg`);
console.log(`  Adicione no frontmatter do post: image: "/images/blog/${slug}.svg"`);
