import { execSync } from 'child_process';
import { cpSync, mkdirSync, rmSync, existsSync } from 'fs';

const run = (cmd, opts = {}) => execSync(cmd, { stdio: 'inherit', ...opts });

// Limpa outputs anteriores
if (existsSync('dist'))       rmSync('dist',       { recursive: true, force: true });
if (existsSync('dist-react')) rmSync('dist-react', { recursive: true, force: true });

// 1. Build Astro (landing + blog — rotas públicas)
console.log('\n=== Build Astro (landing + blog) ===');
run('npm install', { cwd: 'web' });
run('npm run build', { cwd: 'web' });

// 2. Build React (dashboard — /app)
console.log('\n=== Build React (dashboard) ===');
run('npx vite build --outDir dist-react');

// 3. Merge: Astro é a base (blog, about, etc.), React sobrescreve a raiz
console.log('\n=== Merge outputs ===');
cpSync('web/dist', 'dist', { recursive: true });
cpSync('dist-react', 'dist', { recursive: true });

// Limpa temporário
rmSync('dist-react', { recursive: true, force: true });

console.log('\n=== Build completo! Output em dist/ ===');
