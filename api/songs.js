/**
 * api/songs.js
 * 
 * GET /api/songs?country=BR
 * Retorna as músicas em alta salvas pelo cron job
 */

const FALLBACK_SONGS = [
  { rank:1,  title:"Pega Aquí, Vol. 10",           artist:"Taanga Producciones",              duration:"0:17", cover:null },
  { rank:2,  title:"Pyre (STEM synth)",             artist:"Altitude Music / BMGPM",           duration:"1:00", cover:null },
  { rank:3,  title:"Self Aware",                    artist:"Temper City",                      duration:"0:29", cover:null },
  { rank:4,  title:"Something Just Like This",      artist:"The Chainsmokers & Coldplay",      duration:"1:00", cover:null },
  { rank:5,  title:"The Dark Sorcerers Trial",      artist:"Perfect, So Dystopian",            duration:"2:24", cover:null },
  { rank:6,  title:"Lacrimosa",                     artist:"Jairos & Isabel",                  duration:"1:00", cover:null },
  { rank:7,  title:"Tenderness",                    artist:"Elia Lo Monaco",                   duration:"1:00", cover:null },
  { rank:8,  title:"Cabelo Loirinho",               artist:"cjnobeat & Mc Morena",             duration:"0:15", cover:null },
  { rank:9,  title:"Gorof (Elixir)",                artist:"Dur Dur Band",                     duration:"0:30", cover:null },
  { rank:10, title:"Bad Reputation",                artist:"Joan Jett",                        duration:"1:00", cover:null },
  { rank:11, title:"Moonlight",                     artist:"XXXTENTACION",                     duration:"1:00", cover:null },
  { rank:12, title:"Roller Coaster",                artist:"narr",                             duration:"1:00", cover:null },
  { rank:13, title:"Golden",                        artist:"HUNTR/X & EJAE",                   duration:"1:00", cover:null },
  { rank:14, title:"Eu Mato Ela",                   artist:"MC NANINHA & JK NO BEAT",          duration:"1:00", cover:null },
  { rank:15, title:"are you ready?",                artist:"NEU SONG.",                        duration:"1:00", cover:null },
  { rank:16, title:"Marketing",                     artist:"MIDYTUNES",                        duration:"0:46", cover:null },
  { rank:17, title:"Divine",                        artist:"Ominous",                          duration:"1:36", cover:null },
  { rank:18, title:"Starry Eyes",                   artist:"Ekkstacy",                         duration:"1:00", cover:null },
  { rank:19, title:"Happy Nation",                  artist:"Ace of Base",                      duration:"1:00", cover:null },
  { rank:20, title:"Pink Lemonade (Str8 Reload)",   artist:"LeoStayTrill & Str8 Reload",       duration:"0:59", cover:null },
  { rank:21, title:"Baile de Favela",               artist:"MC João",                          duration:"1:00", cover:null },
  { rank:22, title:"Ai Se Eu Te Pego",              artist:"Michel Teló",                      duration:"1:00", cover:null },
  { rank:23, title:"Funk Rave",                     artist:"Anitta",                           duration:"1:00", cover:null },
  { rank:24, title:"Savage Love",                   artist:"Jawsh 685 & Jason Derulo",         duration:"1:00", cover:null },
  { rank:25, title:"Blinding Lights",               artist:"The Weeknd",                       duration:"1:00", cover:null },
  { rank:26, title:"Levitating",                    artist:"Dua Lipa",                         duration:"1:00", cover:null },
  { rank:27, title:"Stay",                          artist:"The Kid LAROI & Justin Bieber",    duration:"1:00", cover:null },
  { rank:28, title:"Industry Baby",                 artist:"Lil Nas X & Jack Harlow",          duration:"1:00", cover:null },
  { rank:29, title:"Peaches",                       artist:"Justin Bieber ft. Daniel Caesar",  duration:"1:00", cover:null },
  { rank:30, title:"Butter",                        artist:"BTS",                              duration:"1:00", cover:null },
];

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(204).end();

  const country = (req.query.country || 'BR').toUpperCase();

  try {
    const { kv } = await import('@vercel/kv');
    const cached = await kv.get(`tiktok:songs:${country}`);

    if (cached) {
      const data = typeof cached === 'string' ? JSON.parse(cached) : cached;
      res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
      return res.status(200).json({ ...data, source: 'cache' });
    }

    return res.status(200).json({
      songs: FALLBACK_SONGS,
      updatedAt: new Date().toISOString(),
      country,
      total: FALLBACK_SONGS.length,
      source: 'fallback',
    });

  } catch (err) {
    console.error('[songs] Erro KV:', err.message);
    return res.status(200).json({
      songs: FALLBACK_SONGS,
      updatedAt: new Date().toISOString(),
      country,
      total: FALLBACK_SONGS.length,
      source: 'fallback',
    });
  }
}
