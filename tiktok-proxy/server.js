import express from "express";

const app = express();
const PORT = process.env.PORT || 3000;

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  next();
});

const COUNTIK_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Accept": "application/json, text/plain, */*",
  "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
  "Origin": "https://countik.com",
  "Referer": "https://countik.com/",
  "sec-ch-ua": '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
  "sec-ch-ua-mobile": "?0",
  "sec-ch-ua-platform": '"Windows"',
  "Sec-Fetch-Dest": "empty",
  "Sec-Fetch-Mode": "cors",
  "Sec-Fetch-Site": "same-origin",
};

const BROWSER_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "none",
  "Upgrade-Insecure-Requests": "1",
};

app.get("/", (req, res) => {
  res.json({ status: "ok", service: "tiktok-proxy", version: "1.0.0" });
});

app.get("/video", async (req, res) => {
  const { url, video_id } = req.query;
  if (!url && !video_id) {
    return res.status(400).json({ error: "Parâmetro 'url' ou 'video_id' obrigatório" });
  }

  try {
    let resolvedUrl = url || "";
    if (url && /vm\.tiktok\.com|vt\.tiktok\.com/i.test(url)) {
      try {
        const r = await fetch(url, { method: "GET", redirect: "follow", headers: BROWSER_HEADERS, signal: AbortSignal.timeout(8000) });
        resolvedUrl = r.url || url;
      } catch (e) {}
    }

    const videoId = video_id || extractVideoId(resolvedUrl);
    if (!videoId) {
      return res.status(422).json({ error: "URL inválida", detail: "Use: tiktok.com/@user/video/ID" });
    }

    console.log(`[proxy/video] video_id=${videoId}`);

    let countikRes, lastStatus;
    for (let attempt = 1; attempt <= 3; attempt++) {
      countikRes = await fetch(`https://countik.com/api/video?video_id=${videoId}`, {
        headers: COUNTIK_HEADERS,
        signal: AbortSignal.timeout(12000),
      });
      lastStatus = countikRes.status;
      console.log(`[proxy/video] attempt=${attempt} status=${lastStatus}`);
      if (countikRes.ok) break;
      if (attempt < 3) await new Promise(r => setTimeout(r, attempt * 600));
    }

    if (!countikRes.ok) {
      return res.status(502).json({ error: `Countik retornou ${lastStatus}`, video_id: videoId });
    }

    const raw = await countikRes.json();
    const normalized = normalizeVideo(raw, videoId);
    if (!normalized) {
      return res.status(502).json({ error: "Formato inesperado", raw_keys: Object.keys(raw) });
    }

    res.setHeader("Cache-Control", "public, max-age=25");
    return res.json(normalized);
  } catch (err) {
    console.error(`[proxy/video] error: ${err.message}`);
    return res.status(500).json({ error: err.message });
  }
});

app.get("/userinfo", async (req, res) => {
  const { unique_id } = req.query;
  if (!unique_id) {
    return res.status(400).json({ error: "Parâmetro 'unique_id' obrigatório" });
  }

  try {
    console.log(`[proxy/userinfo] unique_id=${unique_id}`);

    let countikRes, lastStatus;
    for (let attempt = 1; attempt <= 3; attempt++) {
      countikRes = await fetch(`https://countik.com/api/userinfo?unique_id=${encodeURIComponent(unique_id)}`, {
        headers: COUNTIK_HEADERS,
        signal: AbortSignal.timeout(12000),
      });
      lastStatus = countikRes.status;
      console.log(`[proxy/userinfo] attempt=${attempt} status=${lastStatus}`);
      if (countikRes.ok) break;
      if (attempt < 3) await new Promise(r => setTimeout(r, attempt * 600));
    }

    if (!countikRes.ok) {
      return res.status(502).json({ error: `Countik retornou ${lastStatus}`, unique_id });
    }

    const raw = await countikRes.json();
    const normalized = normalizeUserInfo(raw);
    if (!normalized) {
      return res.status(502).json({ error: "Formato inesperado", raw_keys: Object.keys(raw) });
    }

    res.setHeader("Cache-Control", "public, max-age=60");
    return res.json(normalized);
  } catch (err) {
    console.error(`[proxy/userinfo] error: ${err.message}`);
    return res.status(500).json({ error: err.message });
  }
});

function extractVideoId(url) {
  if (!url) return null;
  const standard = url.match(/\/video\/(\d{15,20})/);
  if (standard) return standard[1];
  const mobile = url.match(/\/v\/(\d{15,20})/);
  if (mobile) return mobile[1];
  const bare = url.match(/\b(\d{15,20})\b/);
  if (bare) return bare[1];
  return null;
}

function normalizeVideo(raw, videoId) {
  if (raw.stats && typeof raw.stats.playCount !== "undefined")
    return buildVideoOutput(raw.stats, raw.author || {}, raw.desc || "", raw.createTime, videoId);
  if (raw.data?.stats)
    return buildVideoOutput(raw.data.stats, raw.data.author || {}, raw.data.desc || "", raw.data.createTime, videoId);
  if (typeof raw.playCount !== "undefined")
    return buildVideoOutput(raw, raw.author || {}, raw.desc || "", raw.createTime, videoId);
  if (raw.video?.stats)
    return buildVideoOutput(raw.video.stats, raw.video.author || {}, raw.video.desc || "", raw.video.createTime, videoId);
  return null;
}

function buildVideoOutput(stats, author, desc, createTime, videoId) {
  return {
    video_id: videoId,
    desc: desc || "",
    create_time: createTime || null,
    stats: {
      play_count:    toInt(stats.playCount    ?? stats.play_count    ?? stats.views),
      like_count:    toInt(stats.diggCount    ?? stats.like_count    ?? stats.likes),
      comment_count: toInt(stats.commentCount ?? stats.comment_count ?? stats.comments),
      share_count:   toInt(stats.shareCount   ?? stats.share_count   ?? stats.shares),
    },
    author: {
      unique_id:    author.uniqueId    || author.unique_id    || "",
      nickname:     author.nickname    || "",
      avatar_thumb: author.avatarThumb || author.avatar_thumb || "",
      verified:     author.verified    || false,
    },
    fetched_at: Date.now(),
    source: "railway_proxy",
  };
}

function normalizeUserInfo(raw) {
  const user =
    raw.author || raw.userInfo?.user || raw.data?.author ||
    (raw.uniqueId ? raw : null);
  const stats =
    raw.stats || raw.authorStats || raw.userInfo?.stats || raw.data?.stats ||
    (raw.followerCount != null ? raw : null);

  if (!user && !stats) return null;

  return {
    author: {
      uniqueId:    user?.uniqueId    || user?.unique_id    || "",
      nickname:    user?.nickname    || "",
      avatarThumb: user?.avatarThumb || user?.avatar_thumb || "",
      signature:   user?.signature   || "",
      verified:    user?.verified    || false,
    },
    stats: {
      followerCount:  toInt(stats?.followerCount  ?? stats?.fans),
      followingCount: toInt(stats?.followingCount ?? stats?.following),
      heartCount:     toInt(stats?.heartCount     ?? stats?.heart ?? stats?.digg),
      videoCount:     toInt(stats?.videoCount     ?? stats?.video),
    },
    fetched_at: Date.now(),
    raw_source: "railway_proxy",
  };
}

function toInt(v) {
  const n = parseInt(v, 10);
  return isNaN(n) ? 0 : n;
}

app.listen(PORT, () => {
  console.log(`[proxy] running on port ${PORT}`);
});
