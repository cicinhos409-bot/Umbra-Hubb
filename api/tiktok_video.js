const RAILWAY_URL = "https://umbra-hubb-production.up.railway.app";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();
  const { url, video_id } = req.query;
  const params = new URLSearchParams();
  if (url) params.set("url", url);
  if (video_id) params.set("video_id", video_id);
  try {
    const r = await fetch(`${RAILWAY_URL}/api/tiktok_video?${params}`, { signal: AbortSignal.timeout(15000) });
    const json = await r.json();
    res.setHeader("Cache-Control", "public, s-maxage=25");
    return res.status(r.status).json(json);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
