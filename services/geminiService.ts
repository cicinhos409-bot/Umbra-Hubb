import { GoogleGenerativeAI } from "@google/generative-ai";

// Atualizado de "gemini-3-flash-preview" (deprecated) para versão estável atual
const MODEL_NAME = "gemini-1.5-flash";

const API_KEYS = [
  import.meta.env.VITE_GEMINI_API_KEY,
  import.meta.env.VITE_GEMINI_API_KEY_1,
  import.meta.env.VITE_GEMINI_API_KEY_2,
  import.meta.env.VITE_GEMINI_API_KEY_3,
  import.meta.env.VITE_GEMINI_API_KEY_4,
  import.meta.env.VITE_GEMINI_API_KEY_5,
  import.meta.env.VITE_GEMINI_API_KEY_6,
  import.meta.env.VITE_GEMINI_API_KEY_7,
  import.meta.env.VITE_GEMINI_API_KEY_8,
  import.meta.env.VITE_GEMINI_API_KEY_9,
  import.meta.env.VITE_GEMINI_API_KEY_10,
  import.meta.env.VITE_GEMINI_API_KEY_11,
  import.meta.env.VITE_GEMINI_API_KEY_12,
].map(k => k?.trim()).filter(Boolean) as string[];

let currentKeyIndex = 0;

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

const isRateLimitError = (err: unknown): boolean => {
  const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
  return msg.includes('429') || msg.includes('quota') || msg.includes('rate') || msg.includes('404');
};

// Circuit breaker: tenta cada chave disponível com backoff exponencial.
// Lança erro se todas as chaves estiverem esgotadas.
const withKeyRotation = async <T>(
  fn: (key: string) => Promise<T>,
  label = 'gemini'
): Promise<T> => {
  const total = API_KEYS.length || 1;
  let attempts = 0;

  while (attempts < total) {
    const key = API_KEYS[currentKeyIndex];
    try {
      return await fn(key);
    } catch (err) {
      if (isRateLimitError(err)) {
        attempts++;
        currentKeyIndex = (currentKeyIndex + 1) % (API_KEYS.length || 1);
        const delay = Math.min(1000 * Math.pow(2, attempts), 16000); // 2s, 4s, 8s, 16s
        console.warn(`[Umbra Cloud/${label}] Chave ${attempts}/${total} esgotada. Aguardando ${delay}ms...`);
        await sleep(delay);
      } else {
        throw err;
      }
    }
  }
  throw new Error(`[Umbra Cloud/${label}] Todas as ${total} chaves Gemini estão esgotadas. Tente novamente mais tarde.`);
};

export const generateVideoIdeas = async (niche: string): Promise<unknown> => {
  return withKeyRotation(async (key) => {
    const model = new GoogleGenerativeAI(key).getGenerativeModel({ model: MODEL_NAME });
    const result = await model.generateContent(`Crie 5 ideias de vídeos JSON para: ${niche}`);
    return JSON.parse(result.response.text());
  }, 'generateVideoIdeas');
};

export const optimizeTitle = async (boringTitle: string): Promise<unknown> => {
  return withKeyRotation(async (key) => {
    const model = new GoogleGenerativeAI(key).getGenerativeModel({ model: MODEL_NAME });
    const result = await model.generateContent(`Otimize o título: ${boringTitle}`);
    return JSON.parse(result.response.text());
  }, 'optimizeTitle');
};

export async function* transcribeAudioStream(file: File, durationSeconds: number) {
  // Limite de segurança: máx 3 horas de áudio
  if (durationSeconds > 10800) {
    throw new Error('Arquivo muito longo. Limite: 3 horas. Divida o arquivo e tente novamente.');
  }

  const minutes = Math.floor(durationSeconds / 60);
  const seconds = Math.floor(durationSeconds % 60);
  const durationFormatted = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  const totalPrompts = Math.ceil(durationSeconds / 8);

  const promptInstruction = `
Você é um especialista em sincronização de áudio para legendas.
TRANSCREVA o áudio anexo seguindo RIGOROSAMENTE as regras abaixo:

1. CABEÇALHO INICIAL:
============================================================
SINCRONIZAÇÃO UMBRA CONNECT - BLOCOS DE 8 SEGUNDOS
============================================================
Arquivo: ${file.name}
Duração Estimada: ${durationFormatted}
Total de prompts: ${totalPrompts}
============================================================

2. FORMATO DOS BLOCOS:
Divida o áudio em blocos EXATOS de 8 segundos. Cada bloco deve seguir este padrão:

PROMPT [NÚMERO_DO_PROMPT] | [TEMPO_INICIAL] - [TEMPO_FINAL]
[Texto transcrito neste intervalo]
------------------------------------------------------------

EXEMPLO DE BLOCO:
PROMPT 001 | 00:00 - 00:08
Texto falado nos primeiros 8 segundos aqui.
------------------------------------------------------------

3. REGRAS CRÍTICAS:
- Não pule nenhum segundo.
- Mantenha a pontuação e gramática fiéis ao áudio.
- Não resuma. Transcreva cada palavra.
- Use zeros à esquerda nos números dos prompts (ex: 001, 002, 010, 100).

Comece a transcrição agora:`;

  const base64Data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.onerror = () => reject(new Error('Falha ao ler arquivo de áudio.'));
    reader.readAsDataURL(file);
  });

  // Transcrição com circuit breaker: tenta trocar chave em caso de rate limit
  const total = API_KEYS.length || 1;
  let attempts = 0;

  while (attempts < total) {
    const key = API_KEYS[currentKeyIndex];
    try {
      const model = new GoogleGenerativeAI(key).getGenerativeModel({ model: MODEL_NAME });
      const result = await model.generateContentStream([
        { inlineData: { data: base64Data, mimeType: file.type } },
        { text: promptInstruction },
      ]);
      for await (const chunk of result.stream) {
        const text = chunk.text();
        if (text) yield text;
      }
      return; // sucesso — encerra o loop
    } catch (err) {
      if (isRateLimitError(err)) {
        attempts++;
        currentKeyIndex = (currentKeyIndex + 1) % (API_KEYS.length || 1);
        const delay = Math.min(1000 * Math.pow(2, attempts), 16000);
        console.warn(`[Umbra Cloud/transcribe] Chave ${attempts}/${total} esgotada. Aguardando ${delay}ms...`);
        await sleep(delay);
      } else {
        throw err;
      }
    }
  }
  throw new Error('Todas as chaves Gemini estão esgotadas. Tente novamente mais tarde.');
}
