
import React, { useState, useRef, useEffect, useCallback } from 'react';
import JSZip from 'https://esm.sh/jszip';
import { 
  Camera, 
  Video, 
  Clock, 
  Scissors, 
  Pointer, 
  Trash2, 
  Download, 
  CheckCircle2, 
  Layout, 
  Zap, 
  Settings, 
  X,
  ChevronLeft,
  ChevronRight,
  Maximize2
} from 'lucide-react';

interface Shot {
  id: string;
  time: number;
  blob: Blob;
  url: string;
  name: string;
}

const ScreenshotTool: React.FC = () => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [mode, setMode] = useState<'scene' | 'interval' | 'manual'>('scene');
  const [format, setFormat] = useState<'png' | 'jpg' | 'webp'>('png');
  const [quality, setQuality] = useState(95);
  
  // Scene settings
  const [sensitivity, setSensitivity] = useState(0.16);
  const [step, setStep] = useState(0.35);
  const [minGap, setMinGap] = useState(0.90);
  
  // Interval settings
  const [interval, setIntervalVal] = useState(2);
  
  // State
  const [shots, setShots] = useState<Shot[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState('Pronto para começar');
  const [scenesCount, setScenesCount] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Stats
  const capturesCount = shots.length;
  const durationText = videoRef.current ? formatTime(videoRef.current.duration || 0) : '0:00';

  function formatTime(seconds: number) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  const handleFile = (file: File) => {
    if (!file.type.startsWith('video/')) {
      alert('⚠️ Selecione um arquivo de vídeo');
      return;
    }
    setShots([]);
    setSelectedIds(new Set());
    setScenesCount(0);
    setProgress(0);
    setProgressLabel('Vídeo carregado');
    setVideoFile(file);
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setVideoUrl(URL.createObjectURL(file));
  };

  const seekTo = (t: number): Promise<void> => {
    return new Promise((resolve) => {
      if (!videoRef.current) return resolve();
      const video = videoRef.current;
      const onSeeked = () => {
        video.removeEventListener('seeked', onSeeked);
        resolve();
      };
      video.addEventListener('seeked', onSeeked);
      video.currentTime = Math.min(Math.max(t, 0), video.duration || t);
    });
  };

  const captureFrameAt = async (t: number) => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    await seekTo(t);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const mimeType = format === 'png' ? 'image/png' : format === 'jpg' ? 'image/jpeg' : 'image/webp';
    const blob = await new Promise<Blob>((res) => canvas.toBlob((b) => res(b!), mimeType, quality / 100));
    
    const id = Math.random().toString(36).substr(2, 9);
    const safeTime = t.toFixed(2).replace('.', '_');
    const name = `capture_${safeTime}s.${format}`;
    const url = URL.createObjectURL(blob);

    const newShot = { id, time: t, blob, url, name };
    setShots(prev => [...prev, newShot]);
  };

  const frameDiff = (a: Uint8ClampedArray, b: Uint8ClampedArray) => {
    if (!a || !b) return 0;
    const len = Math.min(a.length, b.length);
    let sum = 0, count = 0;
    for (let i = 0; i < len; i += 16) {
      const dr = Math.abs(a[i] - b[i]);
      const dg = Math.abs(a[i + 1] - b[i + 1]);
      const db = Math.abs(a[i + 2] - b[i + 2]);
      sum += (dr + dg + db) / (3 * 255);
      count++;
    }
    return count ? (sum / count) : 0;
  };

  const runSceneDetection = async () => {
    if (!videoRef.current || isRunning) return;
    setIsRunning(true);
    setShots([]);
    setScenesCount(0);
    const video = videoRef.current;
    const duration = video.duration;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    const targetW = Math.min(640, video.videoWidth);
    const scale = targetW / video.videoWidth;
    canvas.width = targetW;
    canvas.height = Math.floor(video.videoHeight * scale);

    let lastCutTime = -Infinity;
    let prevData: Uint8ClampedArray | null = null;
    let scenes = 0;

    await seekTo(0);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    prevData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    await captureFrameAt(0);
    scenes++;
    setScenesCount(scenes);

    for (let t = step; t < duration; t += step) {
      if (!isRunning) {
        // This is a bit tricky with async/await, simplified for this component
      }
      const pct = (t / duration) * 100;
      setProgress(pct);
      
      await seekTo(t);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const currData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      const diff = frameDiff(prevData!, currData);
      const canCut = (t - lastCutTime) >= minGap;

      setProgressLabel(`Analisando ${formatTime(t)} / ${formatTime(duration)} (diff: ${diff.toFixed(3)})`);

      if (canCut && diff >= sensitivity) {
        await captureFrameAt(t);
        lastCutTime = t;
        scenes++;
        setScenesCount(scenes);
        await seekTo(t);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        prevData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      } else {
        prevData = currData;
      }
    }

    setProgress(100);
    setProgressLabel(`Concluído! ${scenes} cenas detectadas.`);
    setIsRunning(false);
  };

  const runIntervalCapture = async () => {
    if (!videoRef.current || isRunning) return;
    setIsRunning(true);
    setShots([]);
    const video = videoRef.current;
    const duration = video.duration;

    for (let t = 0; t < duration; t += interval) {
      const pct = (t / duration) * 100;
      setProgress(pct);
      setProgressLabel(`Capturando em ${formatTime(t)} / ${formatTime(duration)}`);
      await captureFrameAt(t);
    }

    setProgress(100);
    setProgressLabel(`Finalizado! ${shots.length} capturas.`);
    setIsRunning(false);
  };

  const handleStart = () => {
    if (mode === 'scene') runSceneDetection();
    else if (mode === 'interval') runIntervalCapture();
  };

  const handleManualCapture = () => {
    if (!videoRef.current) return;
    captureFrameAt(videoRef.current.currentTime);
  };

  const downloadZip = async () => {
    const zip = new JSZip();
    const targets = selectedIds.size > 0 ? shots.filter(s => selectedIds.has(s.id)) : shots;
    if (targets.length === 0) return;

    targets.forEach((shot, i) => {
      const name = shot.name || `screenshot_${i}.${format}`;
      zip.file(name, shot.blob);
    });

    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = `umbra_screenshots_${Date.now()}.zip`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const deleteShot = (id: string) => {
    setShots(prev => prev.filter(s => s.id !== id));
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Keyboard support
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      if (e.key === ' ' && mode === 'manual' && videoUrl) {
        e.preventDefault();
        handleManualCapture();
      }
      if (e.key === 'k' || e.key === 'K') {
        if (videoRef.current?.paused) videoRef.current.play();
        else videoRef.current?.pause();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [mode, videoUrl]);

  return (
    <div className="font-rajdhani space-y-8 animate-in fade-in duration-700 pb-20">
      <header className="flex flex-col md:flex-row items-center justify-between gap-6 bg-background-mid/50 p-8 rounded-[32px] border border-white/5 backdrop-blur-xl">
        <div>
          <h1 className="text-4xl font-black tracking-tighter bg-gradient-to-r from-brand-cyan to-brand-green bg-clip-text text-transparent uppercase">
            Tirador de Screenshots
          </h1>
          <p className="text-gray-500 font-medium mt-1">Extração inteligente de frames para canais Dark e Edição</p>
        </div>
        
        <div className="flex gap-4 flex-wrap justify-center">
          <div className="bg-background-deep border border-white/5 rounded-2xl px-5 py-3 text-center shadow-xl">
            <div className="text-2xl font-black text-brand-cyan leading-none mb-1">{capturesCount}</div>
            <div className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Capturas</div>
          </div>
          <div className="bg-background-deep border border-white/5 rounded-2xl px-5 py-3 text-center shadow-xl">
            <div className="text-2xl font-black text-brand-green leading-none mb-1">{scenesCount}</div>
            <div className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Cenas</div>
          </div>
          <div className="bg-background-deep border border-white/5 rounded-2xl px-5 py-3 text-center shadow-xl">
            <div className="text-2xl font-black text-white leading-none mb-1">{durationText}</div>
            <div className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Duração</div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Control Panel */}
        <div className="lg:col-span-4 space-y-6">
          {/* Upload Area */}
          <div 
            onClick={() => fileInputRef.current?.click()}
            className={`group bg-background-mid border-2 border-dashed rounded-[32px] p-8 text-center cursor-pointer transition-all hover:border-brand-cyan/40 hover:bg-brand-cyan/5 ${videoFile ? 'border-brand-green/30 bg-brand-green/5' : 'border-white/10'}`}
          >
            <input type="file" ref={fileInputRef} className="hidden" accept="video/*" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-all ${videoFile ? 'bg-brand-green text-background-deep' : 'bg-white/5 text-gray-600 group-hover:text-brand-cyan'}`}>
              <Video className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-bold mb-1 truncate px-4">{videoFile ? videoFile.name : 'Selecionar Vídeo'}</h4>
            <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Arraste ou clique aqui</p>
          </div>

          {/* Mode Selector */}
          <div className="bg-background-mid border border-white/5 rounded-[28px] p-2 flex gap-1">
            {[
              { id: 'scene', label: 'Cenas', icon: Scissors },
              { id: 'interval', label: 'Intervalo', icon: Clock },
              { id: 'manual', label: 'Manual', icon: Pointer },
            ].map(m => (
              <button 
                key={m.id}
                onClick={() => setMode(m.id as any)}
                className={`flex-1 flex flex-col items-center gap-2 py-4 rounded-2xl transition-all border ${mode === m.id ? 'bg-brand-cyan/10 border-brand-cyan/30 text-brand-cyan shadow-xl' : 'bg-transparent border-transparent text-gray-600 hover:text-gray-400'}`}
              >
                <m.icon className="w-5 h-5" />
                <span className="text-[10px] font-black uppercase tracking-widest">{m.label}</span>
              </button>
            ))}
          </div>

          {/* Settings Sub-panel */}
          <div className="bg-background-mid border border-white/5 rounded-[32px] p-8 space-y-6 shadow-xl">
             <div className="flex items-center gap-2 mb-2">
               <Settings className="w-4 h-4 text-brand-purple" />
               <h3 className="font-orbitron text-[10px] font-black uppercase tracking-widest text-white">Configurações</h3>
             </div>

             {mode === 'scene' && (
               <div className="space-y-6">
                 <div className="space-y-2">
                   <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                     <span className="text-gray-500">Sensibilidade</span>
                     <span className="text-brand-cyan">{sensitivity.toFixed(2)}</span>
                   </div>
                   <input type="range" min="0.06" max="0.40" step="0.01" value={sensitivity} onChange={e => setSensitivity(parseFloat(e.target.value))} className="w-full h-1.5 bg-background-deep rounded-lg appearance-none cursor-pointer accent-brand-cyan" />
                 </div>
                 <div className="space-y-2">
                   <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                     <span className="text-gray-500">Passo de Análise</span>
                     <span className="text-brand-cyan">{step.toFixed(2)}s</span>
                   </div>
                   <input type="range" min="0.10" max="1.50" step="0.05" value={step} onChange={e => setStep(parseFloat(e.target.value))} className="w-full h-1.5 bg-background-deep rounded-lg appearance-none cursor-pointer accent-brand-cyan" />
                 </div>
                 <div className="space-y-2">
                   <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                     <span className="text-gray-500">Gap Mínimo</span>
                     <span className="text-brand-cyan">{minGap.toFixed(2)}s</span>
                   </div>
                   <input type="range" min="0.30" max="3.00" step="0.10" value={minGap} onChange={e => setMinGap(parseFloat(e.target.value))} className="w-full h-1.5 bg-background-deep rounded-lg appearance-none cursor-pointer accent-brand-cyan" />
                 </div>
               </div>
             )}

             {mode === 'interval' && (
               <div className="space-y-2">
                 <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                   <span className="text-gray-500">Intervalo de tempo</span>
                   <span className="text-brand-cyan">{interval.toFixed(1)}s</span>
                 </div>
                 <input type="range" min="0.5" max="10" step="0.5" value={interval} onChange={e => setIntervalVal(parseFloat(e.target.value))} className="w-full h-1.5 bg-background-deep rounded-lg appearance-none cursor-pointer accent-brand-cyan" />
               </div>
             )}

             {mode === 'manual' && (
               <div className="p-4 bg-background-deep/50 rounded-2xl border border-white/5 text-center">
                 <p className="text-xs text-gray-500 font-medium">Capture frames manualmente clicando no botão de captura ou pressionando <kbd className="bg-white/5 px-2 py-0.5 rounded text-brand-cyan font-bold">Espaço</kbd></p>
               </div>
             )}

             <div className="pt-4 border-t border-white/5 space-y-4">
               <div className="space-y-2">
                 <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Formato</label>
                 <div className="flex gap-2">
                   {['png', 'jpg', 'webp'].map(f => (
                     <button key={f} onClick={() => setFormat(f as any)} className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-tighter border transition-all ${format === f ? 'bg-brand-purple/10 border-brand-purple text-brand-purple' : 'bg-background-deep border-white/5 text-gray-600'}`}>
                       {f}
                     </button>
                   ))}
                 </div>
               </div>
               <div className="space-y-2">
                 <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                   <span className="text-gray-500">Qualidade</span>
                   <span className="text-brand-purple">{quality}%</span>
                 </div>
                 <input type="range" min="50" max="100" step="5" value={quality} onChange={e => setQuality(parseInt(e.target.value))} className="w-full h-1.5 bg-background-deep rounded-lg appearance-none cursor-pointer accent-brand-purple" />
               </div>
             </div>
          </div>
        </div>

        {/* Right Preview Panel */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-background-mid border border-white/5 rounded-[40px] p-8 shadow-2xl relative overflow-hidden">
            <div className="video-container relative bg-black rounded-[24px] overflow-hidden border border-white/5 shadow-inner aspect-video flex items-center justify-center">
              {videoUrl ? (
                <video ref={videoRef} src={videoUrl} controls className="max-h-full" />
              ) : (
                <div className="text-center space-y-4 opacity-30">
                  <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto"><Video className="w-10 h-10" /></div>
                  <p className="font-orbitron text-xs font-black uppercase tracking-widest">Carregue um vídeo</p>
                </div>
              )}
            </div>

            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              {mode !== 'manual' ? (
                <button 
                  onClick={handleStart}
                  disabled={!videoUrl || isRunning}
                  className="flex-1 py-5 bg-gradient-to-r from-brand-cyan to-brand-green text-background-deep font-orbitron text-xs font-black tracking-[0.3em] rounded-2xl shadow-xl shadow-brand-cyan/20 hover:scale-105 transition-all disabled:opacity-30 uppercase flex items-center justify-center gap-3"
                >
                  <Zap className="w-5 h-5" /> Iniciar Processamento
                </button>
              ) : (
                <button 
                  onClick={handleManualCapture}
                  disabled={!videoUrl}
                  className="flex-1 py-5 bg-brand-cyan text-background-deep font-orbitron text-xs font-black tracking-[0.3em] rounded-2xl shadow-xl shadow-brand-cyan/20 hover:scale-105 transition-all disabled:opacity-30 uppercase flex items-center justify-center gap-3"
                >
                  <Camera className="w-5 h-5" /> Capturar Frame Atual
                </button>
              )}
              
              {shots.length > 0 && (
                <button 
                  onClick={() => { setShots([]); setScenesCount(0); setSelectedIds(new Set()); }}
                  className="px-8 py-5 bg-white/5 border border-white/10 text-gray-500 font-orbitron text-xs font-black tracking-[0.3em] rounded-2xl hover:text-brand-pink hover:bg-brand-pink/10 transition-all uppercase flex items-center justify-center gap-3"
                >
                  <Trash2 className="w-5 h-5" /> Limpar
                </button>
              )}
            </div>

            {/* Progress Bar */}
            {isRunning && (
              <div className="mt-8 space-y-4 animate-in fade-in duration-300">
                <div className="flex justify-between items-end px-2">
                  <span className="text-[10px] font-black text-brand-cyan uppercase tracking-[0.2em] animate-pulse">{progressLabel}</span>
                  <span className="font-orbitron text-xs font-black text-white">{Math.round(progress)}%</span>
                </div>
                <div className="h-2 bg-background-deep rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-brand-cyan to-brand-green transition-all duration-300 shadow-[0_0_15px_rgba(0,245,255,0.4)]" style={{ width: `${progress}%` }} />
                </div>
              </div>
            )}
          </div>

          {/* Results Gallery */}
          <div className="bg-background-mid border border-white/5 rounded-[40px] p-8 shadow-2xl min-h-[400px]">
             <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-10 pb-6 border-b border-white/5">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-brand-cyan/10 rounded-xl flex items-center justify-center text-brand-cyan shadow-xl"><Camera className="w-5 h-5" /></div>
                  <h2 className="text-2xl font-black tracking-tight">Capturas Realizadas</h2>
                </div>
                
                {shots.length > 0 && (
                  <div className="flex gap-3">
                    <button 
                      onClick={() => {
                        if (selectedIds.size === shots.length) setSelectedIds(new Set());
                        else setSelectedIds(new Set(shots.map(s => s.id)));
                      }}
                      className="px-5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                    >
                      {selectedIds.size === shots.length ? 'Desmarcar Tudo' : 'Selecionar Tudo'}
                    </button>
                    <button 
                      onClick={downloadZip}
                      className="px-6 py-2.5 bg-brand-green text-background-deep font-black rounded-xl text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-brand-green/20 hover:scale-105 transition-all flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" /> Baixar ZIP
                    </button>
                  </div>
                )}
             </div>

             {shots.length === 0 ? (
               <div className="py-24 text-center opacity-20">
                 <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6"><Layout className="w-10 h-10" /></div>
                 <p className="font-orbitron text-xs font-black uppercase tracking-widest">Nenhuma captura disponível</p>
               </div>
             ) : (
               <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                 {shots.map((shot, idx) => (
                   <div key={shot.id} className={`group relative bg-background-deep border rounded-2xl overflow-hidden transition-all hover:scale-[1.03] ${selectedIds.has(shot.id) ? 'border-brand-cyan ring-1 ring-brand-cyan ring-offset-2 ring-offset-background-deep' : 'border-white/5'}`}>
                     <div 
                      onClick={(e) => {
                        if (e.shiftKey) toggleSelect(shot.id);
                        else setLightboxIndex(idx);
                      }}
                      className="aspect-video relative cursor-pointer overflow-hidden"
                     >
                        <img src={shot.url} alt={shot.name} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Maximize2 className="w-6 h-6 text-white" />
                        </div>
                     </div>
                     
                     <div className="p-4 flex items-center justify-between">
                        <span className="px-2 py-1 bg-brand-cyan/10 border border-brand-cyan/20 rounded-lg text-[9px] font-black text-brand-cyan uppercase tracking-widest">{formatTime(shot.time)}</span>
                        <div className="flex gap-2">
                           <button onClick={() => toggleSelect(shot.id)} className={`p-2 rounded-lg transition-all ${selectedIds.has(shot.id) ? 'bg-brand-cyan text-background-deep' : 'bg-white/5 text-gray-500 hover:text-white'}`}>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                           </button>
                           <button onClick={() => deleteShot(shot.id)} className="p-2 bg-white/5 rounded-lg text-gray-600 hover:text-brand-pink transition-all">
                              <Trash2 className="w-3.5 h-3.5" />
                           </button>
                        </div>
                     </div>
                   </div>
                 ))}
               </div>
             )}
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-2xl" onClick={() => setLightboxIndex(null)} />
          <div className="relative max-w-7xl w-full max-h-full flex flex-col items-center">
             <button onClick={() => setLightboxIndex(null)} className="absolute top-0 right-0 p-4 text-gray-500 hover:text-white transition-all"><X className="w-10 h-10" /></button>
             <div className="relative w-full aspect-video flex items-center justify-center">
                <button 
                  onClick={() => setLightboxIndex(prev => prev! > 0 ? prev! - 1 : shots.length - 1)}
                  className="absolute left-4 p-4 bg-white/5 hover:bg-white/10 rounded-full text-white transition-all shadow-2xl"
                >
                  <ChevronLeft className="w-10 h-10" />
                </button>
                <img src={shots[lightboxIndex].url} className="max-h-full max-w-full rounded-2xl shadow-2xl border border-white/10" />
                <button 
                  onClick={() => setLightboxIndex(prev => prev! < shots.length - 1 ? prev! + 1 : 0)}
                  className="absolute right-4 p-4 bg-white/5 hover:bg-white/10 rounded-full text-white transition-all shadow-2xl"
                >
                  <ChevronRight className="w-10 h-10" />
                </button>
             </div>
             <div className="mt-8 px-8 py-4 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-6">
                <span className="text-sm font-bold text-gray-400">Captura em {formatTime(shots[lightboxIndex].time)}</span>
                <span className="text-gray-700">|</span>
                <span className="text-xs font-black uppercase tracking-[0.2em] text-brand-cyan">{lightboxIndex + 1} / {shots.length}</span>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScreenshotTool;
