/**
 * api/tiktok_analytics.js
 * Vercel Serverless — proxy para TikTok user data
 * 
 * Strategy: tikwm.com (no Cloudflare) → Countik (may be blocked) → 502
 */

const RAPIDAPI_KEYS = Array.from({length: 15}, (_, i) => 
  process.env[`RAPIDAPI_KEY_${i + 1}`]
).filter(Boolean);

async function fetchPostsRapidAPI(username) {
  const keys = [...RAPIDAPI_KEYS].sort(() => Math.random() - 0.5);
  for (const key of keys) {
    try {
      const res = await fetch(
        `https://tiktok-scraper7.p.rapidapi.com/user/posts?unique_id=${encodeURIComponent(username)}&count=20`,
        {
          headers: {
            'x-rapidapi-host': 'tiktok-scraper7.p.rapidapi.com',
            'x-rapidapi-key': key,
          },
          signal: AbortSignal.timeout(12000),
        }
      );
      if (res.status === 429) {
        console.warn(`[tiktok_analytics] Key ...${key.slice(-6)} rate limited (429), trying next...`);
        continue;
      }
      if (res.ok) {
        const j = await res.json();
        const d = j?.data;
        if (Array.isArray(d)) return d;
        if (typeof d === 'object') {
          const vids = d?.videos || d?.aweme_list || d?.list || d?.data || [];
          if (vids.length) return vids;
        }
      }
    } catch (e) { 
      console.error(`[tiktok_analytics] RapidAPI error with key ...${key.slice(-6)}:`, e.message);
      continue; 
    }
  }
  return [];
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  const username = req.query.u;
  if (!username) {
    return res.status(400).json({ error: 'Parâmetro ?u= necessário' });
  }

  const clean = username.replace(/^@/, '').trim();

  // ── Strategy 1: tikwm.com (no Cloudflare, most reliable) ──
  try {
    const result = await tryTikwm(clean);
    if (result) {
      console.log(`[tiktok_analytics] ✓ tikwm.com success for @${clean}`);
      return res.status(200).json(result);
    }
  } catch (e) {
    console.warn(`[tiktok_analytics] tikwm.com failed:`, e.message);
  }

  // ── Strategy 2: Countik (may be Cloudflare-blocked) ──
  try {
    const result = await tryCountik(clean);
    if (result) {
      console.log(`[tiktok_analytics] ✓ countik.com success for @${clean}`);
      return res.status(200).json(result);
    }
  } catch (e) {
    console.warn(`[tiktok_analytics] countik.com failed:`, e.message);
  }

  // ── All strategies failed ──
  return res.status(502).json({
    error: 'Não foi possível obter dados do perfil',
    hint: 'Todas as fontes de dados falharam ou o usuário não existe',
    username: clean,
  });
}


// ───────────────────────────────────────────────
// TIKWM.COM — Primary source (no Cloudflare)
// ───────────────────────────────────────────────
async function tryTikwm(username) {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept': 'application/json',
    'Referer': 'https://www.tikwm.com/',
  };

  // 1. Get User Info (try direct first, then search fallback)
  let userData = null;
  try {
    const infoUrl = `https://www.tikwm.com/api/user/info?unique_id=${encodeURIComponent(username)}`;
    const infoRes = await fetch(infoUrl, { headers, signal: AbortSignal.timeout(8000) });
    if (infoRes.ok) {
      const json = await infoRes.json();
      if (json?.code === 0 || json?.code === '0') userData = json.data;
    }
  } catch (e) {
    console.warn(`[tiktok_analytics] tikwm info direct failed for @${username}:`, e.message);
  }

  // Fallback: Search for user if direct info failed
  if (!userData) {
    try {
      const searchUrl = `https://www.tikwm.com/api/user/search?keywords=${encodeURIComponent(username)}&count=1`;
      const searchRes = await fetch(searchUrl, { headers, signal: AbortSignal.timeout(8000) });
      if (searchRes.ok) {
        const json = await searchRes.json();
        if (json?.code === 0 && json.data?.users?.[0]) {
          userData = json.data.users[0];
          console.log(`[tiktok_analytics] ✓ Found @${username} via search`);
        }
      }
    } catch (e) {
      console.warn(`[tiktok_analytics] tikwm search failed for @${username}:`, e.message);
    }
  }

  if (!userData) return null;

  const user = userData.user || userData;
  const secUid = userData.secUid || user.secUid || user.sec_uid || '';
  const stats = userData.stats || user.stats || userData.authorStats || {};

  // Normalize Global Stats
  const followerCount = num(stats.followerCount || stats.follower_count || stats.fans || user.followerCount || user.fans);
  const followingCount = num(stats.followingCount || stats.following_count || stats.following || user.followingCount);
  const heartCount = num(stats.heartCount || stats.heart_count || stats.heart || stats.diggCount || user.heartCount || user.heart);
  const videoCount = num(stats.videoCount || stats.video_count || stats.video || user.videoCount);

  // 2. Get User Posts via RapidAPI (Stabilized Fix with Rotation)
  let videosList = [];
  if (RAPIDAPI_KEYS.length > 0) {
    try {
      console.log(`[tiktok_analytics] Fetching posts for @${username} via RapidAPI Rotation...`);
      const rawVideos = await fetchPostsRapidAPI(username);
      console.log(`[tiktok_analytics] Found ${rawVideos.length} videos for @${username}`);

      videosList = rawVideos.map(v => ({
        id: v.video_id || v.id,
        desc: v.title || v.desc || '',
        plays: num(v.play_count || v.playCount || v.stats?.playCount),
        likes: num(v.digg_count || v.diggCount || v.stats?.diggCount),
        comments: num(v.comment_count || v.commentCount || v.stats?.commentCount),
        shares: num(v.share_count || v.shareCount || v.stats?.shareCount),
        create_date: v.create_time || v.createTime || 0,
        engRate: (followerCount > 0) ? (((num(v.digg_count || v.diggCount || v.stats?.diggCount) + num(v.comment_count || v.commentCount || v.stats?.commentCount) + num(v.share_count || v.shareCount || v.stats?.shareCount)) / followerCount) * 100) : 0
      }));
    } catch (e) {
      console.warn(`[tiktok_analytics] RapidAPI rotation failed for @${username}:`, e.message);
    }
  }

  // 3. Calculate Global Analytics from videos
  let analytics = null;
  if (videosList.length > 0) {
    const totalPlays = videosList.reduce((sum, v) => sum + v.plays, 0);
    const totalLikes = videosList.reduce((sum, v) => sum + v.likes, 0);
    const totalComments = videosList.reduce((sum, v) => sum + v.comments, 0);
    const totalShares = videosList.reduce((sum, v) => sum + v.shares, 0);
    
    const avgEng = (followerCount > 0) ? (((totalLikes + totalComments + totalShares) / (videosList.length * followerCount)) * 100) : 0;
    
    analytics = {
      engagementRates: {
        total_rate: avgEng,
        likes_rate: (followerCount > 0) ? ((totalLikes / (videosList.length * followerCount)) * 100) : 0,
        comments_rate: (followerCount > 0) ? ((totalComments / (videosList.length * followerCount)) * 100) : 0,
        shares_rate: (followerCount > 0) ? ((totalShares / (videosList.length * followerCount)) * 100) : 0,
      },
      performance: {
        avgViews: Math.round(totalPlays / videosList.length),
        avgLikes: Math.round(totalLikes / videosList.length),
        avgComments: Math.round(totalComments / videosList.length),
        avgShares: Math.round(totalShares / videosList.length),
      },
      dataset: videosList.slice(0, 10).map(v => v.engRate),
      videos: videosList,
      hashtags: extractHashtags(videosList),
      mentions: extractMentions(videosList),
      earnings: calculateEarnings(followerCount, avgEng)
    };
  }

  return {
    author: {
      uniqueId: user.uniqueId || user.unique_id || username,
      nickname: user.nickname || user.uniqueId || username,
      avatarThumb: user.avatarThumb || user.avatar_thumb || user.avatarMedium || user.avatar_medium || user.avatar_larger || '',
      signature: user.signature || user.bio || '',
      verified: Boolean(user.verified || user.is_verified),
      secUid
    },
    stats: {
      followerCount: followerCount || num(user.followerCount || user.fans),
      followingCount: followingCount || num(user.followingCount || user.following),
      heartCount: heartCount || num(user.heartCount || user.heart),
      videoCount: videoCount || num(user.videoCount || user.video),
    },
    analytics,
    raw_source: 'tikwm',
  };
}


// ───────────────────────────────────────────────
// COUNTIK — Fallback (may be Cloudflare-blocked)
// ───────────────────────────────────────────────
async function tryCountik(username) {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
    'Referer': `https://countik.com/pt/tiktok-analytics/user/${username}`,
    'Origin': 'https://countik.com',
  };

  const endpoints = [
    `https://countik.com/api/userinfo?unique_id=${encodeURIComponent(username)}`,
    `https://countik.com/api/analytics?unique_id=${encodeURIComponent(username)}`,
  ];

  for (const ep of endpoints) {
    try {
      const response = await fetch(ep, {
        headers,
        signal: AbortSignal.timeout(8000),
      });

      const text = await response.text();
      if (!response.ok) continue;

      if (text.includes('Just a moment') || text.includes('cf-browser-verification')) continue;

      let json;
      try { json = JSON.parse(text); } catch { continue; }

      const normalized = normalizeCountik(json, username);
      if (normalized) return normalized;

    } catch (e) {
      console.warn(`[tiktok_analytics] countik ${ep} error:`, e.message);
    }
  }

  return null;
}

function normalizeCountik(json, username) {
  if (json?.author?.uniqueId || json?.author?.unique_id) {
    return {
      author: sanitizeAuthor(json.author),
      stats: sanitizeStats(json.stats || json.authorStats || {}),
      analytics: json.analytics || null,
      raw_source: 'countik_userinfo',
    };
  }
  if (json?.userInfo?.user) {
    return {
      author: sanitizeAuthor(json.userInfo.user),
      stats: sanitizeStats(json.userInfo.stats || {}),
      analytics: json.analytics || null,
      raw_source: 'countik_userInfo',
    };
  }
  if (json?.data?.author) return normalizeCountik(json.data, username);
  
  // Flat format
  if (json?.uniqueId || json?.unique_id || json?.followerCount || json?.fans) {
    return {
      author: sanitizeAuthor(json),
      stats: sanitizeStats(json),
      analytics: null,
      raw_source: 'countik_flat',
    };
  }
  return null;
}

function sanitizeAuthor(a = {}) {
  return {
    uniqueId: a.uniqueId || a.unique_id || a.username || '',
    nickname: a.nickname || a.name || a.display_name || a.uniqueId || '',
    avatarThumb: a.avatarThumb || a.avatar_thumb || a.avatarMedium || '',
    signature: a.signature || a.bio || '',
    verified: Boolean(a.verified || a.is_verified),
  };
}

function sanitizeStats(s = {}) {
  return {
    followerCount: num(s.followerCount || s.follower_count || s.fans || s.followers),
    followingCount: num(s.followingCount || s.following_count || s.following),
    heartCount: num(s.heartCount || s.heart_count || s.heart || s.diggCount || s.likes),
    videoCount: num(s.videoCount || s.video_count || s.video || s.videos),
  };
}

function num(v) {
  if (typeof v === 'number') return v;
  if (!v) return 0;
  // Handle strings like "1.2M", "10K"
  const s = String(v).toUpperCase().trim();
  if (s.endsWith('K')) return parseFloat(s) * 1000;
  if (s.endsWith('M')) return parseFloat(s) * 1000000;
  if (s.endsWith('B')) return parseFloat(s) * 1000000000;
  return parseInt(s.replace(/[^0-9]/g, ''), 10) || 0;
}

function extractHashtags(videos) {
  const tagsMap = {};
  videos.forEach(v => {
    const matches = (v.desc || '').match(/#[a-zA-Z0-9_\u00C0-\u00FF]+/g);
    if (matches) {
      matches.forEach(tag => {
        const cleanTag = tag.replace('#', '').toLowerCase();
        tagsMap[cleanTag] = (tagsMap[cleanTag] || 0) + 1;
      });
    }
  });
  return Object.entries(tagsMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);
}

function extractMentions(videos) {
  const mentionsMap = {};
  videos.forEach(v => {
    const matches = (v.desc || '').match(/@[a-zA-Z0-9._]+/g);
    if (matches) {
      matches.forEach(m => {
        const clean = m.replace('@', '').toLowerCase();
        if (clean.length > 1) {
          mentionsMap[clean] = (mentionsMap[clean] || 0) + 1;
        }
      });
    }
  });
  return Object.entries(mentionsMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

function calculateEarnings(followers, engRate) {
  // Rough estimation: base price per 1k followers * engagement multiplier
  // Base rate $2 per 1000 followers for good engagement (5%)
  const baseRate = 0.002; 
  const engMultiplier = Math.max(0.1, engRate / 5);
  const min = followers * baseRate * engMultiplier * 0.7;
  const max = followers * baseRate * engMultiplier * 1.3;
  return { min: Math.round(min), max: Math.round(max) };
}
