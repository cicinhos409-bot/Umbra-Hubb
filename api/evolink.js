
const EVOLINK_API_KEY = process.env.EVOLINK_API_KEY;
const BASE_URL = "https://api.evolink.ai/v1";

const evoHeaders = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${EVOLINK_API_KEY}`,
};

// ── MODELS LIST ─────────────────────────────────────────────
const MODELS = [
  { id: "doubao-seedance-1.0-pro-fast", provider: "BytePlus (Seedance)", price: "$0.019/s", modes: ["T2V", "I2V"], duration: "2–12s", quality: ["480p","720p","1080p"], note: "⭐ Melhor custo-benefício" },
  { id: "seedance-1.5-pro", provider: "BytePlus (Seedance)", price: "$0.025/s", modes: ["T2V", "I2V", "FLF"], duration: "4–12s", quality: ["480p","720p","1080p"], note: "Áudio nativo (voz, SFX, música)" },
  { id: "kling-v3-text-to-video", provider: "Kling", price: "$0.075/s", modes: ["T2V"], duration: "3–15s", quality: ["720p","1080p"], note: "Multi-shot + efeitos sonoros" },
  { id: "kling-v3-image-to-video", provider: "Kling", price: "$0.075/s", modes: ["I2V"], duration: "3–15s", quality: ["720p","1080p"], note: "First/last frame" },
  { id: "kling-o3-text-to-video", provider: "Kling", price: "$0.075/s", modes: ["T2V"], duration: "3–15s", quality: ["720p","1080p"], note: "Multi-shot avançado" },
  { id: "kling-o3-image-to-video", provider: "Kling", price: "$0.075/s", modes: ["I2V"], duration: "3–15s", quality: ["720p","1080p"], note: "First/last/reference frame" },
  { id: "wan2.5-text-to-video", provider: "Alibaba (Wan)", price: "$0.071/s", modes: ["T2V"], duration: "2–15s", quality: ["720p","1080p"] },
  { id: "wan2.5-image-to-video", provider: "Alibaba (Wan)", price: "$0.071/s", modes: ["I2V"], duration: "5s ou 10s", quality: ["480p","720p","1080p"] },
  { id: "wan2.6-text-to-video", provider: "Alibaba (Wan)", price: "$0.071/s", modes: ["T2V"], duration: "2–15s", quality: ["720p","1080p"], note: "Suporta audio_url" },
  { id: "wan2.6-image-to-video", provider: "Alibaba (Wan)", price: "$0.071/s", modes: ["I2V"], duration: "3–15s", quality: ["720p","1080p"] },
  { id: "veo-3.1-fast-generate-preview", provider: "Google (Veo)", price: "$0.169/vídeo", modes: ["T2V", "I2V"], duration: "4/6/8s", quality: ["720p","1080p","4K"], note: "Áudio opcional, alta qualidade" },
  { id: "veo-3.1-generate-preview", provider: "Google (Veo)", price: "$0.169/vídeo", modes: ["T2V", "I2V"], duration: "4/6/8s", quality: ["720p","1080p","4K"], note: "Versão Pro do Veo 3.1" },
  { id: "sora-2-preview", provider: "OpenAI (Sora)", price: "$0.080/s", modes: ["T2V", "I2V"], duration: "4/8/12s", quality: ["720p","1080p"], note: "Moderação rígida" },
  { id: "sora-2-pro-preview", provider: "OpenAI (Sora)", price: "$0.240/s", modes: ["T2V", "I2V"], duration: "4/8/12s", quality: ["720p","1080p"], note: "Qualidade profissional" },
  { id: "MiniMax-Hailuo-02", provider: "MiniMax (Hailuo)", price: "$0.250/vídeo", modes: ["T2V", "I2V", "FLF"], duration: "6s ou 10s", quality: ["512p","768p","1080p"], note: "15 comandos de câmera" },
  { id: "MiniMax-Hailuo-2.3", provider: "MiniMax (Hailuo)", price: "$0.250/vídeo", modes: ["T2V", "I2V"], duration: "6s ou 10s", quality: ["768p","1080p"], note: "Qualidade máxima MiniMax" },
  { id: "grok-imagine-video", provider: "xAI (Grok)", price: "$0.064/vídeo", modes: ["T2V", "I2V"], duration: "6–10s", note: "Estilos: fun / normal / spicy" },
  { id: "omnihuman-1.5", provider: "BytePlus (OmniHuman)", price: "$0.167/s", modes: ["Avatar"], duration: "baseado no áudio", note: "Lip-sync: foto + áudio → vídeo falante" },
];

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (!EVOLINK_API_KEY) {
    return res.status(500).json({ error: "EVOLINK_API_KEY não configurada" });
  }

  const { action, taskId } = req.query;

  try {
    // ── GET MODELS ─────────────────────────────────────────
    if (action === "models") {
      return res.status(200).json({ models: MODELS });
    }

    // ── GENERATE ───────────────────────────────────────────
    if (action === "generate" && req.method === "POST") {
      const {
        prompt,
        model = "doubao-seedance-1.0-pro-fast",
        aspect_ratio = "16:9",
        duration = 5,
        quality = "720p",
        image_urls,
        audio_url,
        generate_audio,
        sound,
        negative_prompt,
        model_params,
      } = req.body;

      if (!prompt && !image_urls && !audio_url) {
        return res.status(400).json({ error: "prompt é obrigatório" });
      }

      const body = {
        model,
        prompt,
        aspect_ratio,
        duration,
        quality,
        ...(image_urls && { image_urls }),
        ...(audio_url && { audio_url }),
        ...(generate_audio !== undefined && { generate_audio }),
        ...(sound && { sound }),
        ...(negative_prompt && { negative_prompt }),
        ...(model_params && { model_params }),
      };

      const response = await fetch(`${BASE_URL}/videos/generations`, {
        method: "POST",
        headers: evoHeaders,
        body: JSON.stringify(body),
      });

      const data = await response.json();
      if (!response.ok) {
        return res.status(response.status).json({ error: data });
      }

      return res.status(200).json({
        task_id: data.id,
        status: data.status,
        model: data.model,
        estimated_time: data.task_info?.estimated_time,
        credits_reserved: data.usage?.credits_reserved,
      });
    }

    // ── STATUS ─────────────────────────────────────────────
    if (action === "status" && taskId) {
      const response = await fetch(`${BASE_URL}/tasks/${taskId}`, {
        headers: evoHeaders,
      });

      const data = await response.json();
      if (!response.ok) {
        return res.status(response.status).json({ error: data });
      }

      const result = {
        task_id: data.id,
        status: data.status,
        progress: data.progress ?? 0,
        model: data.model,
      };

      if (data.status === "completed") {
        result.video_url = data.results?.[0] ?? null;
        result.all_results = data.results ?? [];
      }

      if (data.status === "failed") {
        result.error = data.error ?? "Falha desconhecida";
      }

      return res.status(200).json(result);
    }

    return res.status(400).json({ error: "Ação inválida. Use: generate, status, models" });

  } catch (err) {
    console.error("[evolink handler]", err);
    return res.status(500).json({ error: err.message || "Erro interno" });
  }
}
