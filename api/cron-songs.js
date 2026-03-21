/**
 * api/cron-songs.js
 * 
 * Vercel Cron Job — roda todo dia à meia-noite (UTC)
 * Busca as músicas em alta no Countik e salva no KV Store
 */

const COUNTIK_URL = 'https://countik.com/api/popular/songs?country=BR&page=1';

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Accept': 'application/json',
  'Referer': 'https://countik.com/pt/popular/songs',
  'Origin': 'https://countik.com',
};

export default async function handler(req, res) {
  // Só permite chamada do cron do Vercel ou chamada manual com secret
  const authHeader = req.headers.authorization;
  const secret = process.env.CRON_SECRET;

  if (
    req.headers['x-vercel-cron'] !== '1' &&
    authHeader !== `Bearer ${secret}`
  ) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    console.log('[cron-songs] Iniciando busca...');

    const songs = await fetchSongs('BR');

    if (!songs || songs.length === 0) {
      console.warn('[cron-songs] Nenhuma música encontrada');
      return res.status(200).json({ ok: false, message: 'Sem músicas' });
    }

    // Salva no Vercel KV
    const { kv } = await import('@vercel/kv');
    
    const payload = {
      songs,
      updatedAt: new Date().toISOString(),
      country: 'BR',
      total: songs.length,
    };

    await kv.set('tiktok:songs:BR', JSON.stringify(payload), {
      ex: 60 * 60 * 26, // expira em 26h (garante que nunca fica vazio)
    });

    console.log(`[cron-songs] Salvo ${songs.length} músicas`);
    return res.status(200).json({ ok: true, total: songs.length, updatedAt: payload.updatedAt });

  } catch (err) {
    console.error('[cron-songs] Erro:', err.message);
    return res.status(500).json({ error: err.message });
  }
}

async function fetchSongs(country = 'BR') {
  // Tenta múltiplos endpoints do Countik
  const urls = [
    `https://countik.com/api/popular/songs?country=${country}&page=1`,
    `https://countik.com/api/trending/songs?region=${country}`,
  ];

  for (const url of urls) {
    try {
      const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(10000) });
      if (!res.ok) continue;

      const json = await res.json();
      const raw = json.songs || json.data || json.results || json.items || [];

      if (raw.length > 0) {
        return raw.map((s, i) => ({
          rank: s.rank || i + 1,
          title: s.title || s.name || s.song_name || '',
          artist: s.artist || s.artist_name || s.author || '',
          duration: s.duration || s.dur || '1:00',
          cover: s.cover_url || s.image || s.thumbnail || null,
          tiktokId: s.id || s.music_id || null,
        })).filter(s => s.title);
      }
    } catch (e) {
      console.warn(`[fetchSongs] falhou ${url}:`, e.message);
    }
  }

  // Fallback: scraping da página HTML (caso a API mude)
  return await scrapeSongsPage(country);
}

async function scrapeSongsPage(country = 'BR') {
  try {
    const res = await fetch(`https://countik.com/pt/popular/songs?country=${country}`, {
      headers: { ...HEADERS, 'Accept': 'text/html' },
      signal: AbortSignal.timeout(12000),
    });
    const html = await res.text();

    const match = html.match(/window\.__NUXT__\s*=\s*\(function[^;]+\)\s*;/);
    if (!match) return [];

    const songs = [];
    const titleRx = /class="title"[^>]*>([^<]+)<\/div>/g;
    const artistRx = /class="artist"[^>]*>([^<]+)<\/div>/g;

    let tm, am;
    while ((tm = titleRx.exec(html)) && (am = artistRx.exec(html))) {
      songs.push({
        rank: songs.length + 1,
        title: tm[1].trim(),
        artist: am[1].trim(),
        duration: '1:00',
        cover: null,
        tiktokId: null,
      });
    }

    return songs;
  } catch (e) {
    console.error('[scrapeSongsPage]', e.message);
    return [];
  }
}
