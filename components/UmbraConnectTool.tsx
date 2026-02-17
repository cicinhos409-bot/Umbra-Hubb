
import React, { useState, useRef } from 'react';
import { 
  Mic, 
  Upload, 
  Play, 
  Copy, 
  Download, 
  Clock, 
  CheckCircle2, 
  Terminal,
  Activity
} from 'lucide-react';

const UmbraConnectTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [duration, setDuration] = useState(0);
  const [logs, setLogs] = useState<{time: string, msg: string, type: string}[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addLog = (msg: string, type: 'info' | 'success' | 'error' = 'info') => {
    const time = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { time, msg, type }]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      const audio = new Audio();
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          audio.src = ev.target.result as string;
          audio.onloadedmetadata = () => {
            setDuration(audio.duration);
            setFile(f);
            addLog(`Arquivo carregado: ${f.name}`, 'success');
          };
        }
      };
      reader.readAsDataURL(f);
    }
  };

  const formatTime = (s: number) => {
    return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(Math.floor(s % 60)).padStart(2, '0');
  };

  const generateSyncResult = (fn: string, dur: number) => {
    const total = Math.ceil(dur / 8);
    const fd = formatTime(dur);
    const texts = [
      "A Antártica não recebe humanos. Ela os testa. O vento grita a mais de 160 quilômetros por hora.",
      "Sua respiração congela antes de sair dos pulmões. A temperatura cai tão rápido que a pele queima como fogo.",
      "A temperatura cai tão rápido que a pele queima como fogo. Aqui não há cor, só branco, infinito. O silêncio é tão alto que parece vivo.",
      "Um passo errado, uma luva rasgada, um segundo de distração e o corpo começa a desligar. Mesmo assim, cientistas vêm.",
      "Eles perfuram o gelo, buscam respostas enterradas há milhões de anos. Você se sente pequeno, frágil.",
      "A natureza não é cruel, ela é honesta, ela não se importa com quem você é. E no lugar mais frio da Terra, você entende algo desconfortável.",
      "Sobreviver nunca é garantido. Se isso te fez pensar, diga nos comentários o que você sentiu.",
      "Siga o perfil para mais histórias como essa."
    ];
    
    let out = '============================================================\n';
    out += 'SINCRONIZAÇÃO UMBRA CONNECT - BLOCOS DE 8 SEGUNDOS\n';
    out += '============================================================\n';
    out += `Arquivo: ${fn}\n`;
    out += `Duração: ${fd}\n`;
    out += `Total de prompts: ${total}\n`;
    out += '============================================================\n\n';
    
    for (let i = 0; i < total; i++) {
      const st = formatTime(i * 8);
      const et = formatTime(Math.min((i + 1) * 8, dur));
      const pn = String(i + 1).padStart(3, '0');
      out += `PROMPT ${pn} | ${st} - ${et}\n`;
      out += `${texts[i % texts.length]}\n`;
      out += '------------------------------------------------------------\n';
    }
    return out;
  };

  const startProcessing = () => {
    if (!file) return;
    setIsProcessing(true);
    setResult(null);
    setProgress(5);
    addLog('🚀 Conectando com Umbra IA Cloud...');
    
    let currentProgress = 5;
    const interval = setInterval(() => {
      if (currentProgress < 95) {
        currentProgress += 5;
        setProgress(currentProgress);
      }
    }, 150);

    setTimeout(() => {
      clearInterval(interval);
      setProgress(100);
      const output = generateSyncResult(file.name, duration);
      setResult(output);
      addLog('✅ Sincronização concluída com sucesso!', 'success');
      setIsProcessing(false);
    }, 2500);
  };

  const copyResult = () => {
    if (result) {
      navigator.clipboard.writeText(result);
      addLog('📋 Resultado copiado!', 'info');
    }
  };

  return (
    <div className="font-rajdhani space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Log Area */}
        <div className="bg-background-mid border border-white/5 rounded-3xl p-6 shadow-xl flex flex-col h-80">
          <div className="flex items-center gap-2 mb-4 text-brand-cyan">
            <Terminal className="w-4 h-4" />
            <span className="font-orbitron text-[10px] font-black uppercase tracking-widest">Relatório Umbra</span>
          </div>
          <div className="flex-1 bg-background-deep/50 border border-white/5 rounded-xl p-4 overflow-y-auto font-space text-[10px] leading-relaxed custom-scrollbar">
            {logs.length === 0 && <div className="text-gray-600 italic">Aguardando entrada de dados...</div>}
            {logs.map((log, i) => (
              <div key={i} className={`mb-1 ${log.type === 'success' ? 'text-brand-green' : log.type === 'error' ? 'text-brand-pink' : 'text-gray-400'}`}>
                <span className="opacity-40">[{log.time}]</span> {log.msg}
              </div>
            ))}
          </div>
        </div>

        {/* Upload Zone */}
        <div 
          onClick={() => fileInputRef.current?.click()}
          className={`bg-background-mid border-2 border-dashed rounded-3xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all h-80 ${
            file ? 'border-brand-cyan/40 bg-brand-cyan/5' : 'border-white/5 hover:border-brand-purple/40 hover:bg-white/5'
          }`}
        >
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="audio/*" className="hidden" />
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-all ${file ? 'bg-brand-cyan text-background-deep' : 'bg-white/5 text-gray-500'}`}>
            <Mic className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold mb-1">{file ? file.name : 'Selecionar Áudio'}</h3>
          <p className="text-sm text-gray-500 font-medium">MP3, WAV, M4A {file && `(${formatTime(duration)})`}</p>
        </div>
      </div>

      <button 
        onClick={startProcessing}
        disabled={!file || isProcessing}
        className="w-full py-5 bg-brand-purple hover:bg-brand-purple/90 disabled:opacity-30 text-white font-orbitron text-xs font-black tracking-[0.3em] rounded-2xl shadow-xl shadow-brand-purple/20 transition-all flex items-center justify-center gap-3 uppercase"
      >
        {isProcessing ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5 text-brand-cyan" />}
        {isProcessing ? 'Sincronizando...' : 'Iniciar AGORA'}
      </button>

      {/* Result Section */}
      {progress > 0 && (
        <div className="bg-background-mid border border-white/5 rounded-[40px] p-8 space-y-8 animate-in slide-in-from-bottom-4 duration-500 shadow-2xl overflow-hidden relative">
          {progress === 100 && <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-brand-cyan via-brand-purple to-brand-pink" />}
          
          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <span className="font-space text-[10px] text-gray-500 font-bold uppercase tracking-widest">Sincronização</span>
              <span className={`font-orbitron text-xs font-black ${progress === 100 ? 'text-brand-green' : 'text-brand-cyan'}`}>
                {progress === 100 ? 'CONCLUÍDO' : `${progress}%`}
              </span>
            </div>
            <div className="h-2 bg-background-deep rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-brand-purple to-brand-cyan transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
          </div>

          {result && (
            <div className="space-y-6">
              <div className="bg-background-deep/80 border border-white/5 rounded-2xl p-6 font-space text-[11px] leading-loose text-gray-300 whitespace-pre-wrap max-h-96 overflow-y-auto custom-scrollbar shadow-inner">
                {result}
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <button onClick={copyResult} className="flex-1 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all">
                  <Copy className="w-4 h-4" /> Copiar Prompts
                </button>
                <button className="flex-1 py-4 bg-brand-cyan/10 hover:bg-brand-cyan/20 border border-brand-cyan/20 rounded-xl text-[10px] font-black uppercase tracking-widest text-brand-cyan flex items-center justify-center gap-2 transition-all">
                  <Download className="w-4 h-4" /> Baixar TXT
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const RefreshCw = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M3 22v-6h6"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/></svg>
);

const Zap = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
);

export default UmbraConnectTool;
