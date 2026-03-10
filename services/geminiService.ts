import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.API_KEY || '');

export const generateVideoIdeas = async (niche: string) => {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    const prompt = `Gere 5 ideias de vídeos virais para um Canal Dark do YouTube sobre o nicho: "${niche}". 
    Para cada ideia, forneça um título chamativo e uma breve descrição do "gancho" inicial. 
    Responda em Português do Brasil no formato JSON:
    [
      {"title": "...", "hook": "..."},
      ...
    ]`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return JSON.parse(response.text());
  } catch (error) {
    console.error("Error generating ideas:", error);
    throw error;
  }
};

export const optimizeTitle = async (boringTitle: string) => {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    const prompt = `Otimize o seguinte título de vídeo para aumentar o CTR (Click-Through Rate): "${boringTitle}". 
    Gere 3 variações: uma Curiosa, uma Urgente e uma Controversa.
    Responda no formato JSON:
    {
      "curious": "...",
      "urgent": "...",
      "controversial": "..."
    }`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return JSON.parse(response.text());
  } catch (error) {
    console.error("Error optimizing title:", error);
    throw error;
  }
};
