import React, { useState, useRef } from 'react';
import {
  Upload,
  Video,
  Sparkles,
  Download,
  FileVideo,
  AlertCircle,
  Copy,
  CheckCircle2,
  Zap,
  Layout,
  Clock,
  Brain
} from 'lucide-react';

import { GoogleGenerativeAI } from "@google/generative-ai";

const MISTRAL_URL = 'https://api.mistral.ai/v1/chat/completions';
const MISTRAL_MODEL = 'mistral-large-latest';
const MISTRAL_KEY = 'UCNgkoAkHk5ZvJRjy7EI1PjFoZrx8wKw';

const GEMINI_KEYS = [
  'AIzaSyByBYVqa9fXqWkw-0AVs3ifFGA8okgw8TM',
  'AIzaSyCC8FhQHyTFhO1-2zFgEQtGy47Yt6ipeyw',
  'AIzaSyAej2ZKvhOtHFTGpePGX3pXedFwkukEyJs',
  'AIzaSyAAMXblFJS_aSrroYDnYZdo4DRT2KHzXu4'
];

const getGenAI = (index = 0) => new GoogleGenerativeAI(GEMINI_KEYS[index % GEMINI_KEYS.length]);
const GEMINI_MODEL = "gemini-1.5-flash";

interface UmbraPrompterToolProps {
  userTier?: string;
}

const UmbraPrompterTool: React.FC<UmbraPrompterToolProps> = ({ userTier }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [copied, setCopied] = useState(false);
  const [briefing, setBriefing] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('00');
  const [durationSeconds, setDurationSeconds] = useState('00');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!file || !file.type.startsWith('video/')) {
      alert("Por favor, selecione um arquivo de vídeo válido.");
      return;
    }

    if (file.size > 600 * 1024 * 1024) {
      alert("O arquivo é muito grande. O limite é 600MB.");
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setResult('');
    setProgress(0);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const extractFrames = async (file: File, frameCount: number = 10): Promise<{ inlineData: { data: string, mimeType: string } }[]> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.src = URL.createObjectURL(file);
      video.muted = true;

      video.onloadedmetadata = async () => {
        const frames: { inlineData: { data: string, mimeType: string } }[] = [];
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        canvas.width = 640; // Low res for Gemini analysis
        canvas.height = 360;

        const duration = video.duration;
        const interval = duration / (frameCount + 1);

        for (let i = 1; i <= frameCount; i++) {
          video.currentTime = i * interval;
          await new Promise(r => {
            const onSeeked = () => {
              ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
              const base64 = canvas.toDataURL('image/jpeg', 0.6).split(',')[1];
              frames.push({
                inlineData: {
                  data: base64,
                  mimeType: 'image/jpeg'
                }
              });
              video.removeEventListener('seeked', onSeeked);
              r(null);
            };
            video.addEventListener('seeked', onSeeked);
          });
        }
        resolve(frames);
      };
    });
  };

  const generatePrompt = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setProgress(0);
    setResult('');

    try {
      // Step 1: Extract Frames (Progress 0-20)
      setProgress(10);
      const frames = await extractFrames(selectedFile, 12);
      setProgress(20);

      // Step 2: Call Gemini AI (Vision)
      let visionReport = "";
      let lastError = null;

      for (let i = 0; i < GEMINI_KEYS.length; i++) {
        try {
          const genAI = getGenAI(i);
          const modelNames = ["gemini-1.5-flash", "gemini-1.5-flash-latest", "gemini-2.0-flash-exp", "gemini-3.1-flash-lite-preview", "gemini-3-flash-preview"];

          for (const modelName of modelNames) {
            try {
              const model = genAI.getGenerativeModel({ model: modelName });
              const visionPrompt = `Analise detalhadamente estes quadros de vídeo. 
Descreva:
1. Todos os personagens (físico, roupas, expressões).
2. Cenários e iluminação.
3. Principais ações ocorrendo.
Seja técnico e descritivo. Identifique cores e texturas.`;

              const resultGemini = await model.generateContent([visionPrompt, ...frames]);
              visionReport = resultGemini.response.text();
              if (visionReport) break;
            } catch (e) { continue; }
          }
          if (visionReport) break;
        } catch (e) { lastError = e; }
      }

      if (!visionReport) throw lastError || new Error("Falha na análise visual (Gemini).");
      setProgress(50);

      // Step 3: Call Mistral AI (Formatting & Prompt Engineering)
      const systemMsg = `Você é o Umbra Prompter, um especialista em engenharia de prompts cinematográficos de elite.
Sua tarefa é receber uma análise visual e transformá-la em um PROMPT ESTRUTURADO DE ALTA QUALIDADE.

MODELO DE SAÍDA OBRIGATÓRIO (SIGA EXATAMENTE):

### **Análise Geral dos Personagens Principais**
* **Nome/Papel:** [Identificação]
  Descrição física detalhada:
  - Idade: [Faixa Etária]
  - Pele: [Tom e Textura]
  - Traços: [Detalhes do rosto, cicatrizes, olhos]
  - Cabelo: [Cor, corte, estilo]
  - Roupas: [Peças detalhadas, tecidos]
  - Postura: [Posição do corpo, tensão]
  - Presença: [Aura, vibe]
  - Ambiente: [Localização exata e iluminação ao redor]

---

### **Cena X: [Título da Cena] (MM:SS - MM:SS)**
* **Descrição Visual:**
  - Ação: [Descrição técnica do movimento]
  - Iluminação: [Estilo de luz, cores, brilho]
  - Enquadramento: [Plano cinematográfico, movimento de câmera]
  - Elementos de fundo: [O que completa o cenário]

* **Descrição do Áudio:**
    * **Idioma:** Português do Brasil.
    * **Identificação do Falante:**
      [Português do Brasil] [Papel] (Físico: ..., Roupas: ..., Ambiente: ...): "[Citação ou tom do que é dito]"
    
* **Prompt de IA:**
[PROMPT COMPLETO EM INGLÊS PARA IA (SORA/KLING/VEO) FOCO EM 4K, CINEMATIC, HIGH PRODUCTION VALUE]

REGRAS:
1. Siga o estilo NEOR-NOIR / PREMIUM do exemplo fornecido pelo usuário.
2. Seja EXTREMAMENTE específico.
3. Use os detalhes da análise visual do Gemini: ${visionReport}
4. Use o briefing do usuário se houver: ${briefing}.
5. Todo o texto deve ser em PORTUGUÊS, ESCETO o bloco "Prompt de IA" que deve ser em INGLÊS.
6. A duração total do vídeo informado pelo usuário é: ${durationMinutes}:${durationSeconds}. Divida as cenas proporcionalmente dentro desse tempo.`;

      const userMsg = "Gere o prompt estruturado premium baseado na análise visual fornecida.";

      const response = await fetch(MISTRAL_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${MISTRAL_KEY}`
        },
        body: JSON.stringify({
          model: MISTRAL_MODEL,
          messages: [
            { role: 'system', content: systemMsg },
            { role: 'user', content: userMsg }
          ],
          temperature: 0.8
        })
      });

      if (!response.ok) throw new Error(`Erro na Mistral AI: ${response.statusText}`);

      const data = await response.json();
      const finalContent = data.choices[0].message.content;

      setProgress(100);
      setResult(finalContent);

    } catch (err: any) {
      console.error(err);
      setResult(`❌ ERRO NO PROCESSO HÍBRIDO: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-6 font-rajdhani animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div className="flex items-center gap-4">
          {/* Hamburger fallback trigger for dashboard sidebar */}
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('toggleSidebar'))}
            className="p-3 bg-white/5 rounded-2xl text-gray-400 hover:text-white md:hidden"
          >
            <Layout className="w-6 h-6" />
          </button>
          <div className="w-16 h-16 bg-brand-purple/10 rounded-2xl flex items-center justify-center text-brand-purple shadow-lg shadow-brand-purple/5">
            <Sparkles className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tighter uppercase">
              Umbra <span className="text-brand-purple">Prompter</span>
            </h1>
            <p className="text-gray-500 font-bold uppercase text-[10px] tracking-widest">
              IA Vision · Transforme vídeos em prompts detalhados
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 px-4 py-2 bg-brand-purple/10 border border-brand-purple/20 rounded-xl text-brand-purple text-[10px] font-black uppercase tracking-widest shadow-lg shadow-brand-purple/5">
            <Zap className="w-3 h-3 fill-current" /> Plano Free Ativo
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Left Column: Upload & Preview */}
        <div className="space-y-8">
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            className={`
              relative group cursor-pointer border-2 border-dashed rounded-[40px] transition-all duration-500 overflow-hidden
              ${isDragging ? 'border-brand-purple bg-brand-purple/5 scale-[0.98]' : 'border-white/5 bg-white/[0.02] hover:bg-white/5 hover:border-white/10'}
            `}
          >
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="video/*"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />

            <div className="p-16 text-center space-y-6">
              <div className={`
                w-20 h-20 bg-background-deep rounded-[32px] flex items-center justify-center mx-auto shadow-2xl transition-transform duration-500
                ${isDragging ? 'scale-110' : 'group-hover:scale-110'}
              `}>
                <Upload className={`w-8 h-8 ${isDragging ? 'text-brand-purple' : 'text-gray-600 group-hover:text-brand-purple'}`} />
              </div>
              <div>
                <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tighter">Enviar Vídeo</h3>
                <p className="text-gray-500 text-sm font-medium leading-relaxed max-w-[240px] mx-auto">
                  Arraste seu vídeo ou clique para buscar em seu dispositivo.
                </p>
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full text-[9px] font-black text-gray-600 uppercase tracking-widest border border-white/5">
                MP4, MOV, AVI, WEBM · MÁX. 600MB
              </div>
            </div>
          </div>

          {previewUrl && (
            <div className="bg-background-mid border border-white/5 rounded-[40px] p-8 space-y-6 animate-in slide-in-from-bottom-6 duration-700 shadow-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-purple/10 rounded-xl flex items-center justify-center text-brand-purple">
                    <FileVideo className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white uppercase tracking-tight truncate max-w-[200px]">
                      {selectedFile?.name}
                    </h4>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                      {(selectedFile!.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                {!isProcessing && (
                  <button
                    onClick={generatePrompt}
                    className="px-6 py-3 bg-brand-purple text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-brand-purple/20 hover:scale-105 transition-all"
                  >
                    Gerar Prompts
                  </button>
                )}
              </div>

              <div className="relative rounded-3xl overflow-hidden bg-black border border-white/5 shadow-inner aspect-video flex items-center justify-center">
                <video src={previewUrl} className="w-full h-full object-contain" controls />
              </div>

              {/* Briefing & Duration Input */}
              <div className="space-y-6 mt-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Brain className="w-4 h-4 text-brand-purple" />
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Breve Briefing/Contexto</label>
                    </div>
                    <textarea
                      value={briefing}
                      onChange={(e) => setBriefing(e.target.value)}
                      placeholder="Ex: Vídeo de um carro correndo no deserto com estilo Mad Max..."
                      className="w-full bg-background-mid border border-white/5 rounded-3xl p-6 text-sm font-medium text-gray-300 focus:border-brand-purple/50 outline-none resize-none h-32 transition-all"
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-brand-purple" />
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Duração do Vídeo (MM:SS)</label>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-background-mid border border-white/5 rounded-2xl p-4 flex flex-col items-center">
                        <span className="text-[8px] font-black text-gray-600 uppercase mb-2">Minutos</span>
                        <input
                          type="text"
                          maxLength={2}
                          value={durationMinutes}
                          onChange={(e) => setDurationMinutes(e.target.value.replace(/\D/g, ''))}
                          className="w-full bg-transparent text-center text-xl font-black text-white focus:outline-none"
                        />
                      </div>
                      <span className="text-xl font-black text-gray-700">:</span>
                      <div className="flex-1 bg-background-mid border border-white/5 rounded-2xl p-4 flex flex-col items-center">
                        <span className="text-[8px] font-black text-gray-600 uppercase mb-2">Segundos</span>
                        <input
                          type="text"
                          maxLength={2}
                          value={durationSeconds}
                          onChange={(e) => setDurationSeconds(e.target.value.replace(/\D/g, ''))}
                          className="w-full bg-transparent text-center text-xl font-black text-white focus:outline-none"
                        />
                      </div>
                    </div>
                    <p className="text-[9px] font-bold text-gray-600 leading-relaxed uppercase">
                      A IA usará esse tempo para criar o roteiro de cenas proporcionalmente.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Processing & Results */}
        <div className="space-y-8">
          {(isProcessing || result) && (
            <div className="bg-background-mid border border-white/5 rounded-[40px] p-8 md:p-10 min-h-[500px] flex flex-col animate-in slide-in-from-right-8 duration-700 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-brand-purple/5 to-transparent pointer-events-none" />

              <div className="flex items-center justify-between mb-10 relative z-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-background-deep border border-white/5 rounded-2xl flex items-center justify-center">
                    <Sparkles className={`w-5 h-5 ${isProcessing ? 'text-brand-purple animate-pulse' : 'text-brand-green'}`} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white uppercase tracking-tighter">
                      {isProcessing ? 'Processando IA Vision...' : 'Análise Concluída'}
                    </h3>
                    <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest">
                      {isProcessing ? 'Escaneando frames e áudio do vídeo' : 'Prompt pronto para cópia'}
                    </p>
                  </div>
                </div>
                {result && (
                  <button
                    onClick={copyToClipboard}
                    className={`p-3 rounded-xl transition-all border ${copied ? 'bg-brand-green/10 border-brand-green/20 text-brand-green' : 'bg-white/5 border-white/5 text-gray-500 hover:text-white hover:bg-white/10'}`}
                    title="Copiar Prompt"
                  >
                    {copied ? <CheckCircle2 className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  </button>
                )}
              </div>

              {isProcessing ? (
                <div className="flex-1 flex flex-col items-center justify-center space-y-8 py-20 relative z-10">
                  <div className="relative">
                    <svg className="w-32 h-32 transform -rotate-90">
                      <circle
                        cx="64" cy="64" r="60"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="transparent"
                        className="text-white/5"
                      />
                      <circle
                        cx="64" cy="64" r="60"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="transparent"
                        strokeDasharray={377}
                        strokeDashoffset={377 - (377 * progress) / 100}
                        className="text-brand-purple transition-all duration-300 ease-out"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl font-black text-white">{progress}%</span>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-gray-500 animate-pulse">
                      {progress < 30 ? 'Extraindo frames chave...' :
                        progress < 70 ? 'Analisando composição e estilo...' :
                          'Formatando descrição detalhada...'}
                    </p>
                  </div>
                </div>
              ) : result && (
                <div className="flex-1 flex flex-col relative z-10">
                  <div className="flex-1 bg-background-deep/50 border border-white/5 rounded-3xl p-8 font-sans text-sm leading-relaxed overflow-y-auto custom-scrollbar group max-h-[600px] whitespace-pre-wrap text-gray-300">
                    {result}
                  </div>
                  <div className="mt-6 flex gap-4">
                    <button
                      onClick={copyToClipboard}
                      className="flex-1 py-4 bg-brand-purple text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-brand-purple/20 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-3"
                    >
                      <Copy className="w-4 h-4" /> {copied ? 'Copiado!' : 'Copiar Prompt Final'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {!isProcessing && !result && (
            <div className="bg-background-mid border border-white/5 border-dashed rounded-[40px] p-12 text-center space-y-6 animate-in fade-in duration-500 shadow-xl min-h-[500px] flex flex-col items-center justify-center opacity-40">
              <div className="w-20 h-20 bg-white/5 rounded-[32px] flex items-center justify-center mb-6">
                <AlertCircle className="w-10 h-10 text-gray-700" />
              </div>
              <h4 className="text-2xl font-black text-white uppercase tracking-tighter">Aguardando Vídeo</h4>
              <p className="text-gray-500 max-w-xs mx-auto text-sm leading-relaxed font-medium">
                Envie um vídeo para que nossa IA Vision possa gerar um prompt detalhado e profissional.
              </p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(139,92,246,0.2); }
      `}</style>
    </div>
  );
};

export default UmbraPrompterTool;
