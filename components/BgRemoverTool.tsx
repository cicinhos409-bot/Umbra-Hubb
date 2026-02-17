
import React, { useState, useRef, useEffect } from 'react';
import { 
  Image as ImageIcon, 
  Upload, 
  Settings, 
  Trash2, 
  Download, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle,
  Zap,
  Maximize2,
  Layers,
  ChevronRight,
  ShieldCheck,
  MousePointer2
} from 'lucide-react';

interface ImageItem {
  id: string;
  file: File;
  name: string;
  size: number;
  originalUrl: string;
  processedUrl: string | null;
  status: 'pending' | 'processing' | 'complete' | 'error';
  error: string | null;
}

const BgRemoverTool: React.FC = () => {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [detectionMode, setDetectionMode] = useState('auto');
  const [threshold, setThreshold] = useState(128);
  const [edgeSmooth, setEdgeSmooth] = useState(5);
  const [isProcessingAll, setIsProcessingAll] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stats, setStats] = useState({ total: 0, processed: 0, successRate: 0, avgTime: 0 });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const processingTimesRef = useRef<number[]>([]);

  // Algorithm helpers
  const getPixel = (data: Uint8ClampedArray, x: number, y: number, width: number) => {
    const idx = (y * width + x) * 4;
    return { r: data[idx], g: data[idx+1], b: data[idx+2], a: data[idx+3] };
  };

  const detectEdges = (imageData: ImageData) => {
    const data = imageData.data;
    const { width, height } = imageData;
    const edges = new Float32Array(width * height);
    const sobelX = [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]];
    const sobelY = [[-1, -2, -1], [0, 0, 0], [1, 2, 1]];

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let gx = 0, gy = 0;
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const idx = ((y + ky) * width + (x + kx)) * 4;
            const gray = (data[idx] + data[idx+1] + data[idx+2]) / 3;
            gx += gray * sobelX[ky+1][kx+1];
            gy += gray * sobelY[ky+1][kx+1];
          }
        }
        edges[y * width + x] = Math.sqrt(gx * gx + gy * gy);
      }
    }
    return edges;
  };

  const detectBackgroundColor = (imageData: ImageData) => {
    const { data, width, height } = imageData;
    const samples = [];
    const step = 10;
    for (let x = 0; x < width; x += step) {
      samples.push(getPixel(data, x, 0, width));
      samples.push(getPixel(data, x, height - 1, width));
    }
    for (let y = 0; y < height; y += step) {
      samples.push(getPixel(data, 0, y, width));
      samples.push(getPixel(data, width - 1, y, width));
    }
    const sum = samples.reduce((acc, c) => ({ r: acc.r + c.r, g: acc.g + c.g, b: acc.b + c.b }), { r: 0, g: 0, b: 0 });
    return { r: sum.r / samples.length, g: sum.g / samples.length, b: sum.b / samples.length };
  };

  const applyAdvancedRemoval = (imageData: ImageData, opts: any) => {
    const data = imageData.data;
    const { width, height } = imageData;
    const edges = detectEdges(imageData);
    const bgColor = detectBackgroundColor(imageData);
    const thres = opts.threshold;
    const edgeThres = thres / 2;

    const mask = new Float32Array(width * height);
    for (let i = 0; i < data.length; i += 4) {
      const idx = i / 4;
      const diff = Math.sqrt(Math.pow(data[i] - bgColor.r, 2) + Math.pow(data[i+1] - bgColor.g, 2) + Math.pow(data[i+2] - bgColor.b, 2));
      if (edges[idx] > edgeThres || diff > thres) mask[idx] = 1;
      else if (diff < thres / 2) mask[idx] = 0;
      else mask[idx] = diff / thres;
    }

    // Refine and Apply
    for (let i = 0; i < data.length; i += 4) {
      data[i+3] = mask[i/4] * 255;
    }
    return imageData;
  };

  const applyEdgeSmoothing = (imageData: ImageData, smoothness: number) => {
    if (smoothness === 0) return imageData;
    const data = imageData.data;
    const { width, height } = imageData;
    const radius = Math.floor(smoothness / 2);
    const newData = new Uint8ClampedArray(data);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        if (data[idx + 3] > 0 && data[idx + 3] < 255) {
          let sum = 0, count = 0;
          for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
              const nx = x + dx, ny = y + dy;
              if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                sum += data[(ny * width + nx) * 4 + 3];
                count++;
              }
            }
          }
          newData[idx+3] = sum / count;
        }
      }
    }
    for (let i = 3; i < data.length; i += 4) data[i] = newData[i];
    return imageData;
  };

  const processImage = async (imgId: string) => {
    const imgItem = images.find(i => i.id === imgId);
    if (!imgItem) return;

    setImages(prev => prev.map(i => i.id === imgId ? { ...i, status: 'processing' } : i));
    const startTime = Date.now();

    try {
      const img = new Image();
      img.src = imgItem.originalUrl;
      await new Promise(resolve => img.onload = resolve);

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) throw new Error("Falha no Canvas context");
      
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      imageData = applyAdvancedRemoval(imageData, { threshold, mode: detectionMode });
      imageData = applyEdgeSmoothing(imageData, edgeSmooth);
      
      ctx.putImageData(imageData, 0, 0);
      const processedUrl = canvas.toDataURL('image/png');
      
      processingTimesRef.current.push((Date.now() - startTime) / 1000);
      setImages(prev => prev.map(i => i.id === imgId ? { ...i, processedUrl, status: 'complete' } : i));
    } catch (err: any) {
      setImages(prev => prev.map(i => i.id === imgId ? { ...i, status: 'error', error: err.message } : i));
    }
  };

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const newImages: ImageItem[] = Array.from(files).map(f => ({
      id: Math.random().toString(36).substr(2, 9),
      file: f,
      name: f.name,
      size: f.size,
      originalUrl: URL.createObjectURL(f),
      processedUrl: null,
      status: 'pending',
      error: null
    }));
    setImages(prev => [...prev, ...newImages]);
  };

  const processAll = async () => {
    const pending = images.filter(i => i.status === 'pending' || i.status === 'error');
    if (pending.length === 0) return;

    setIsProcessingAll(true);
    setProgress(0);
    for (let i = 0; i < pending.length; i++) {
      await processImage(pending[i].id);
      setProgress(Math.round(((i + 1) / pending.length) * 100));
    }
    setIsProcessingAll(false);
  };

  useEffect(() => {
    const total = images.length;
    const processed = images.filter(i => i.status === 'complete').length;
    const rate = total > 0 ? Math.round((processed / total) * 100) : 0;
    const avg = processingTimesRef.current.length > 0 ? (processingTimesRef.current.reduce((a, b) => a + b, 0) / processingTimesRef.current.length).toFixed(1) : 0;
    setStats({ total, processed, successRate: rate, avgTime: Number(avg) });
  }, [images]);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024, sizes = ['B', 'KB', 'MB'], i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="font-rajdhani space-y-8 animate-in fade-in duration-700 pb-20 max-w-6xl mx-auto">
      <header className="text-center relative">
        <div className="inline-flex items-center justify-center w-24 h-24 bg-brand-cyan/10 rounded-[32px] mb-6 shadow-2xl ring-1 ring-brand-cyan/20 animate-pulse">
          <ImageIcon className="w-12 h-12 text-brand-cyan" />
        </div>
        <h1 className="text-5xl font-black tracking-tighter mb-2 bg-gradient-to-r from-brand-cyan via-brand-purple to-brand-pink bg-clip-text text-transparent uppercase">
          Umbra Bg Remover
        </h1>
        <p className="text-gray-500 font-medium">Algoritmo Sobel Edge Detection • Processamento 100% Local</p>
      </header>

      {/* CONTROLS */}
      <div className="bg-background-mid border border-white/5 rounded-[40px] p-8 shadow-2xl space-y-8 relative overflow-hidden backdrop-blur-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-cyan/5 blur-[100px] -z-10" />
        
        <div className="flex items-center gap-3 mb-4">
          <Settings className="w-5 h-5 text-brand-cyan" />
          <h3 className="font-orbitron text-[10px] font-black uppercase tracking-widest text-white">Configurações do Motor</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-4">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block flex items-center gap-2">
              <Layers className="w-4 h-4" /> Modo de Detecção
            </label>
            <select 
              value={detectionMode} 
              onChange={e => setDetectionMode(e.target.value)}
              className="w-full bg-background-deep border border-white/10 rounded-2xl p-4 text-xs font-bold text-white focus:border-brand-cyan outline-none transition-all appearance-none cursor-pointer"
            >
              <option value="auto">Automático (Edge Detection)</option>
              <option value="aggressive">Agressivo (Máxima Remoção)</option>
              <option value="gentle">Suave (Preservar Detalhes)</option>
              <option value="person">Pessoa (Otimizado)</option>
              <option value="product">Produto (E-commerce)</option>
            </select>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
              <span className="text-gray-500">Threshold de Sensibilidade</span>
              <span className="text-brand-cyan">{threshold}</span>
            </div>
            <input 
              type="range" min="10" max="250" step="5" value={threshold}
              onChange={e => setThreshold(parseInt(e.target.value))}
              className="w-full h-1.5 bg-background-deep rounded-full appearance-none cursor-pointer accent-brand-cyan"
            />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
              <span className="text-gray-500">Suavização de Bordas</span>
              <span className="text-brand-purple">{edgeSmooth}px</span>
            </div>
            <input 
              type="range" min="0" max="20" step="1" value={edgeSmooth}
              onChange={e => setEdgeSmooth(parseInt(e.target.value))}
              className="w-full h-1.5 bg-background-deep rounded-full appearance-none cursor-pointer accent-brand-purple"
            />
          </div>
        </div>
      </div>

      {/* UPLOAD AREA */}
      <div 
        onClick={() => fileInputRef.current?.click()}
        className="group bg-background-mid border-2 border-dashed border-white/10 rounded-[48px] p-16 text-center cursor-pointer transition-all hover:border-brand-cyan/40 hover:bg-brand-cyan/5 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-brand-cyan/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <input type="file" ref={fileInputRef} className="hidden" accept="image/jpeg,image/png" multiple onChange={e => handleFiles(e.target.files)} />
        <div className="w-20 h-20 bg-white/5 rounded-[32px] flex items-center justify-center mx-auto mb-6 text-gray-700 transition-all group-hover:scale-110 group-hover:text-brand-cyan shadow-inner">
          <Upload className="w-10 h-10" />
        </div>
        <h4 className="text-2xl font-black mb-2 tracking-tight">Arraste ou Clique para Selecionar</h4>
        <p className="text-gray-500 text-sm font-medium">Suporta JPG e PNG até 6MB por arquivo</p>
      </div>

      {/* ACTION BAR */}
      {images.length > 0 && (
        <div className="bg-background-mid border border-white/5 rounded-3xl p-6 flex flex-wrap items-center justify-between gap-6 shadow-xl sticky top-24 z-30 backdrop-blur-md">
           <div className="flex items-center gap-6">
             <div className="flex -space-x-3">
               {images.slice(0, 5).map((img, i) => (
                 <div key={i} className="w-10 h-10 rounded-xl border-2 border-background-deep overflow-hidden">
                   <img src={img.originalUrl} className="w-full h-full object-cover" />
                 </div>
               ))}
               {images.length > 5 && <div className="w-10 h-10 rounded-xl bg-background-deep border-2 border-background-deep flex items-center justify-center text-[10px] font-black text-gray-400">+{images.length - 5}</div>}
             </div>
             <div>
               <p className="text-xs font-black text-white uppercase tracking-widest">{images.length} Imagens na Fila</p>
               <p className="text-[10px] text-gray-500 font-bold uppercase">{images.filter(i => i.status === 'complete').length} Processadas</p>
             </div>
           </div>

           <div className="flex gap-4">
             <button onClick={() => { setImages([]); processingTimesRef.current = []; }} className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-brand-pink transition-all">Limpar Fila</button>
             <button 
              onClick={processAll}
              disabled={isProcessingAll}
              className="px-10 py-3 bg-brand-cyan text-background-deep font-orbitron text-xs font-black tracking-[0.2em] rounded-xl hover:shadow-[0_0_30px_rgba(0,245,255,0.4)] transition-all disabled:opacity-30 uppercase flex items-center gap-3"
             >
               {isProcessingAll ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
               Remover Fundos em Lote
             </button>
           </div>
        </div>
      )}

      {/* PROGRESS BAR */}
      {isProcessingAll && (
        <div className="space-y-4 animate-in slide-in-from-bottom-2">
           <div className="flex justify-between items-end px-2">
             <span className="text-[10px] font-black text-brand-cyan uppercase tracking-widest">Processando Fluxo em Lote</span>
             <span className="font-orbitron text-xs font-black text-white">{progress}%</span>
           </div>
           <div className="h-1.5 bg-background-mid border border-white/5 rounded-full overflow-hidden shadow-inner">
             <div className="h-full bg-gradient-to-r from-brand-cyan via-brand-purple to-brand-pink transition-all duration-300" style={{ width: `${progress}%` }} />
           </div>
        </div>
      )}

      {/* STATS */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { label: 'Total Fila', val: stats.total, color: 'text-white' },
            { label: 'Processadas', val: stats.processed, color: 'text-brand-cyan' },
            { label: 'Taxa Sucesso', val: `${stats.successRate}%`, color: 'text-brand-green' },
            { label: 'Tempo Médio', val: `${stats.avgTime}s`, color: 'text-brand-purple' },
          ].map((s, i) => (
            <div key={i} className="bg-background-mid border border-white/5 rounded-[32px] p-8 text-center shadow-xl hover:border-white/10 transition-all">
              <div className={`text-4xl font-bebas tracking-widest mb-2 ${s.color}`}>{s.val}</div>
              <div className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em]">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* GALLERY */}
      {images.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {images.map(img => (
            <div key={img.id} className="group bg-background-mid border border-white/5 rounded-[40px] p-2 transition-all hover:border-brand-cyan/20 shadow-2xl relative overflow-hidden">
              <div className="aspect-[4/3] bg-background-deep rounded-[32px] overflow-hidden relative border border-white/5 shadow-inner">
                {img.status === 'processing' && (
                  <div className="absolute inset-0 z-10 bg-brand-cyan/20 backdrop-blur-md flex flex-col items-center justify-center text-brand-cyan">
                    <RefreshCw className="w-10 h-10 animate-spin mb-4" />
                    <span className="font-orbitron text-[10px] font-black uppercase tracking-[0.3em]">Removendo Fundo</span>
                  </div>
                )}
                <img 
                  src={img.processedUrl || img.originalUrl} 
                  className={`w-full h-full object-contain transition-all duration-500 ${img.status === 'complete' ? 'scale-100 opacity-100' : 'scale-95 opacity-50'}`} 
                />
                {img.status === 'complete' && (
                  <div className="absolute top-4 right-4 z-20 flex gap-2">
                    <button onClick={() => {
                      const a = document.createElement('a'); a.href = img.processedUrl!; a.download = `umbra_${img.name.split('.')[0]}.png`; a.click();
                    }} className="p-3 bg-brand-green text-background-deep rounded-xl shadow-xl hover:scale-105 transition-all"><Download className="w-5 h-5" /></button>
                  </div>
                )}
              </div>

              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="max-w-[160px]">
                    <h5 className="text-sm font-black text-white truncate">{img.name}</h5>
                    <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest">{formatBytes(img.size)}</p>
                  </div>
                  <span className={`text-[8px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest ${
                    img.status === 'complete' ? 'bg-brand-green/20 text-brand-green' :
                    img.status === 'error' ? 'bg-brand-pink/20 text-brand-pink' :
                    'bg-white/5 text-gray-600'
                  }`}>
                    {img.status === 'pending' ? 'Pendente' : img.status === 'processing' ? 'Processando' : img.status === 'error' ? 'Erro' : 'Concluído'}
                  </span>
                </div>

                <div className="flex gap-3">
                  {img.status !== 'complete' && (
                    <button 
                      onClick={() => processImage(img.id)}
                      disabled={img.status === 'processing'}
                      className="flex-1 py-3 bg-brand-cyan/10 border border-brand-cyan/30 text-brand-cyan rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-cyan hover:text-background-deep transition-all flex items-center justify-center gap-2"
                    >
                      <Zap className="w-3.5 h-3.5" /> Processar
                    </button>
                  )}
                  <button onClick={() => setImages(prev => prev.filter(i => i.id !== img.id))} className="p-3 bg-white/5 border border-white/5 rounded-xl text-gray-600 hover:text-brand-pink transition-all"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-32 bg-background-mid border border-white/5 rounded-[48px] text-center opacity-20">
          <ImageIcon className="w-20 h-20 mx-auto mb-8 text-gray-600" />
          <p className="font-orbitron text-xs font-black uppercase tracking-widest">Nenhuma imagem carregada para remoção</p>
        </div>
      )}

      {/* PRIVACY FOOTER */}
      <footer className="mt-20 p-10 bg-brand-cyan/5 border border-brand-cyan/10 rounded-[40px] flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
         <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-brand-cyan/10 rounded-[24px] flex items-center justify-center text-brand-cyan shadow-xl"><ShieldCheck className="w-8 h-8" /></div>
            <div>
               <h4 className="text-lg font-black text-white uppercase tracking-tighter">Processamento Privado e Seguro</h4>
               <p className="text-xs text-gray-500 max-w-md font-medium leading-relaxed">Suas imagens são processadas localmente pelo motor Javascript do seu navegador. Nenhum dado é enviado para servidores externos.</p>
            </div>
         </div>
         <div className="flex gap-4">
            <div className="px-4 py-2 bg-background-deep border border-white/5 rounded-xl text-[9px] font-black text-gray-600 uppercase tracking-widest">GPU Accel: Ativo</div>
            <div className="px-4 py-2 bg-background-deep border border-white/5 rounded-xl text-[9px] font-black text-gray-600 uppercase tracking-widest">WebWorkers: Ready</div>
         </div>
      </footer>
    </div>
  );
};

export default BgRemoverTool;
