// api/tiktok_video.js — Vercel relay → Railway proxy
// O Railway faz a chamada real ao Countik (sem bloqueio de IP)

const RAILWAY_URL = process.env.RAILWAY_PROXY_URL || "https://umbra-hubb-production.up.railway.app";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { url, video_id } = req.query;
  if (!url && !video_id) {
    return res.status(400).json({ error: "Parâmetro 'url' ou 'video_id' obrigatório" });
  }

  try {
    const params = new URLSearchParams();
    if (url)      params.set("url",      url);
    if (video_id) params.set("video_id", video_id);

    const railwayRes = await fetch(`${RAILWAY_URL}/video?${params}`, {
      signal: AbortSignal.timeout(15000),
    });

    const json = await railwayRes.json();

    res.setHeader("Cache-Control", "public, s-maxage=25, stale-while-revalidate=10");
    return res.status(railwayRes.status).json(json);

  } catch (err) {
    console.error(`[tiktok_video] relay error: ${err.message}`);
    return res.status(500).json({ error: err.message });
  }
}
