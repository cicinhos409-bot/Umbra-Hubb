
import { GoogleGenAI, Type } from "@google/genai";

// Fix: Use process.env.API_KEY directly as per guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateVideoIdeas = async (niche: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Gere 5 ideias de vídeos virais para um Canal Dark do YouTube sobre o nicho: "${niche}". 
      Para cada ideia, forneça um título chamativo e uma breve descrição do "gancho" inicial. 
      Responda em Português do Brasil.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: "Título do vídeo" },
              hook: { type: Type.STRING, description: "Gancho inicial do vídeo" }
            },
            required: ["title", "hook"]
          }
        }
      }
    });
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Error generating ideas:", error);
    throw error;
  }
};

export const optimizeTitle = async (boringTitle: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Otimize o seguinte título de vídeo para aumentar o CTR (Click-Through Rate): "${boringTitle}". 
      Gere 3 variações: uma Curiosa, uma Urgente e uma Controversa.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            curious: { type: Type.STRING },
            urgent: { type: Type.STRING },
            controversial: { type: Type.STRING }
          },
          required: ["curious", "urgent", "controversial"]
        }
      }
    });
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Error optimizing title:", error);
    throw error;
  }
};
