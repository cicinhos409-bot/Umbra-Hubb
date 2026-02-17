
import React, { useState, useRef } from 'react';
import { 
  FolderSearch, 
  Trash2, 
  Search, 
  Copy, 
  AlertCircle, 
  CheckCircle2, 
  Settings,
  Database,
  RefreshCw,
  FolderOpen
} from 'lucide-react';

const UmbraControlTool: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [startFrame, setStartFrame] = useState<number>(1);
  const [endFrame, setEndFrame] = useState<number | ''>('');
  const [padding, setPadding] = useState<number>(0);
  const [result, setResult] = useState<{
    expected: number,
    found: number,
    missing: number[],
    report: string
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      // Fix: Explicitly type the array from FileList to ensure proper type inference of File objects
      const selectedFiles: File[] = Array.from(e.target.files);
      setFiles(selectedFiles);
      setResult(null);

      if (selectedFiles.length > 0) {
        let min = Infinity;
        let max = -Infinity;
        let maxPadding = 0;

        // Fix: Explicitly type the iteration variable as File to avoid 'unknown' errors
        selectedFiles.forEach((f: File) => {
          const name = f.name.substring(0, f.name.lastIndexOf('.'));
          const matches = name.match(/\d+/g);
          if (matches) {
            const lastMatch = matches[matches.length - 1];
            const num = parseInt(lastMatch, 10);
            if (!isNaN(num)) {
              if (num < min) min = num;
              if (num > max) max = num;
              maxPadding = Math.max(maxPadding, lastMatch.length);
            }
          }
        });

        if (min !== Infinity) setStartFrame(min);
        if (max !== -Infinity) setEndFrame(max);
        setPadding(maxPadding);
      }
    }
  };

  const getMissingSequences = (missing: number[], p: number) => {
    if (missing.length === 0) return [];
    const ranges = [];
    let start = missing[0];
    let prev = missing[0];

    for (let i = 1; i <= missing.length; i++) {
      if (i === missing.length || missing[i] !== prev + 1) {
        const count = prev - start + 1;
        const startStr = String(start).padStart(p, '0');
        const endStr = String(prev).padStart(p, '0');
        ranges.push(start === prev ? `${startStr} (1 arquivo)` : `${startStr} até ${endStr} (${count} arquivos)`);
        if (i < missing.length) {
          start = missing[i];
          prev = missing[i];
        }
      } else {
        prev = missing[i];
      }
    }
    return ranges;
  };

  const generateControlReport = (start: number, end: number, expected: number, found: number, missing: number[], pad: number) => {
    const sp = String(start).padStart(pad, '0');
    const ep = String(end).padStart(pad, '0');
    const mp = missing.map(m => String(m).padStart(pad, '0'));
    const ms = getMissingSequences(missing, pad);

    let o = '======================================================================\n';
    o += '🔍 RELATÓRIO UMBRA CONTROL - ANÁLISE DE SEQUÊNCIA\n';
    o += '======================================================================\n\n';
    o += '📊 PARÂMETROS DE BUSCA:\n';
    o += `   • Intervalo Solicitado: ${sp} até ${ep}\n`;
    o += `   • Total de arquivos na pasta: ${files.length}\n`;
    o += `   • Padding detectado: ${pad} dígitos\n\n`;
    o += '----------------------------------------------------------------------\n';
    o += '📈 RESULTADO DA VERIFICAÇÃO:\n';
    o += `   • Frames Esperados: ${expected}\n`;
    o += `   • Frames Encontrados: ${found}\n`;
    o += `   • Frames Faltantes: ${missing.length}\n`;
    o += '----------------------------------------------------------------------\n\n';

    if (missing.length > 0) {
      o += `❌ LACUNAS DETECTADAS (${missing.length} frames):\n`;
      o += `   ${mp.join(', ')}\n\n`;
      o += '📋 SEQUÊNCIAS PARA RE-RENDER (GROUPED):\n';
      o += ms.map(s => `   • ${s}`).join('\n') + '\n\n';
      o += '💡 Dica: Copie os números faltantes para usar no Umbra Dispatch.';
    } else {
      o += '✅ SEQUÊNCIA 100% COMPLETA!\n   Nenhum frame faltando no intervalo definido.';
    }
    o += '\n\n======================================================================';
    return o;
  };

  const handleAnalyze = () => {
    if (files.length === 0) return;
    const start = startFrame;
    const end = Number(endFrame);
    if (isNaN(start) || isNaN(end) || start > end) {
      alert('Por favor, insira um intervalo válido.');
      return;
    }

    setIsAnalyzing(true);
    
    setTimeout(() => {
      const numSet = new Set();
      // Fix: Explicitly type the iteration variable to avoid 'unknown' errors
      files.forEach((f: File) => {
        const name = f.name.substring(0, f.name.lastIndexOf('.'));
        const matches = name.match(/\d+/g);
        if (matches && matches.length > 0) {
          numSet.add(parseInt(matches[matches.length - 1], 10));
        }
      });

      const missing: number[] = [];
      let foundInRange = 0;
      for (let i = start; i <= end; i++) {
        if (!numSet.has(i)) missing.push(i);
        else foundInRange++;
      }

      const expected = end - start + 1;
      const report = generateControlReport(start, end, expected, foundInRange, missing, padding);

      setResult({
        expected,
        found: foundInRange,
        missing: missing,
        report
      });
      setIsAnalyzing(false);
    }, 800);
  };

  const clearAll = () => {
    setFiles([]);
    setResult(null);
    setEndFrame('');
    setStartFrame(1);
  };

  return (
    <div className="font-rajdhani space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Settings Panel */}
        <div className="bg-background-mid border border-white/5 rounded-[32px] p-8 shadow-xl space-y-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-purple/10 rounded-xl flex items-center justify-center text-brand-purple"><Settings className="w-5 h-5" /></div>
            <h3 className="font-orbitron text-xs font-black text-white tracking-widest uppercase">Umbra Control</h3>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block font-space text-[10px] text-gray-500 font-bold uppercase tracking-widest">Início</label>
              <input type="number" value={startFrame} onChange={e => setStartFrame(Number(e.target.value))} className="w-full bg-background-light border border-white/5 rounded-xl px-4 py-3 text-xs text-white font-space focus:border-brand-purple/50 outline-none" />
            </div>
            <div className="space-y-2">
              <label className="block font-space text-[10px] text-gray-500 font-bold uppercase tracking-widest">Fim</label>
              <input type="number" value={endFrame} onChange={e => setEndFrame(e.target.value === '' ? '' : Number(e.target.value))} placeholder="Auto" className="w-full bg-background-light border border-white/5 rounded-xl px-4 py-3 text-xs text-white font-space focus:border-brand-purple/50 outline-none" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block font-space text-[10px] text-gray-500 font-bold uppercase tracking-widest">Padding (Zeros)</label>
            <input type="number" value={padding} onChange={e => setPadding(Number(e.target.value))} className="w-full bg-background-light border border-white/5 rounded-xl px-4 py-3 text-xs text-white font-space focus:border-brand-purple/50 outline-none" />
          </div>

          <button 
            onClick={handleAnalyze}
            disabled={files.length === 0 || isAnalyzing}
            className="w-full py-4 bg-brand-purple text-white font-orbitron text-xs font-black tracking-[0.2em] rounded-xl hover:shadow-lg hover:shadow-brand-purple/20 transition-all disabled:opacity-30 flex items-center justify-center gap-2"
          >
            {isAnalyzing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            EXECUTAR CONTROL
          </button>

          <div className="bg-brand-purple/5 border border-brand-purple/10 rounded-2xl p-5 space-y-2">
            <div className="flex items-center gap-2 text-[10px] font-black text-brand-purple uppercase tracking-widest">
              <CheckCircle2 className="w-3 h-3" /> Suporte Inteligente
            </div>
            <p className="text-[11px] text-gray-500 leading-relaxed font-medium">Detectamos automaticamente o intervalo ao carregar os arquivos. Focamos apenas nos números sequenciais finais.</p>
          </div>
        </div>

        {/* Upload and Preview */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-background-mid border border-white/5 rounded-[40px] p-8 shadow-xl">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-gray-400"><FolderSearch className="w-5 h-5" /></div>
                <h3 className="font-orbitron text-xs font-black text-white tracking-widest uppercase">Fonte de Dados</h3>
              </div>
              {files.length > 0 && (
                <button onClick={clearAll} className="flex items-center gap-2 text-[10px] font-black text-gray-600 hover:text-brand-pink uppercase tracking-widest transition-colors">
                  <Trash2 className="w-3 h-3" /> Limpar Tudo
                </button>
              )}
            </div>

            <div 
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-[32px] p-12 text-center cursor-pointer transition-all ${
                files.length > 0 ? 'border-brand-cyan/20 bg-brand-cyan/5' : 'border-white/5 hover:border-brand-purple/40 hover:bg-white/5'
              }`}
            >
              <input type="file" ref={fileInputRef} onChange={handleFileChange} multiple className="hidden" />
              <div className={`text-4xl mb-4 transition-transform group-hover:-translate-y-1 ${files.length > 0 ? 'text-brand-cyan' : 'text-gray-700'}`}>
                {files.length > 0 ? '✨' : '📥'}
              </div>
              <h4 className="text-xl font-bold mb-1">{files.length > 0 ? `${files.length} arquivos selecionados` : 'Arraste uma pasta ou clique aqui'}</h4>
              <p className="text-sm text-gray-500">PNG, JPG, EXR, TIFF, MP4</p>
            </div>

            {files.length > 0 && (
              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-300">
                <div className="bg-background-deep/50 border border-white/5 rounded-2xl p-6">
                  <p className="font-space text-[10px] text-gray-600 font-black uppercase tracking-widest mb-4">Amostra da Sequência:</p>
                  <div className="space-y-1 max-h-40 overflow-y-auto custom-scrollbar pr-2">
                    {files.slice(0, 50).map((f, i) => (
                      <div key={i} className="flex justify-between items-center text-[10px] font-space text-gray-400 border-b border-white/5 py-1">
                        <span className="truncate pr-4">{f.name}</span>
                        <span className="shrink-0 opacity-50">{Math.round(f.size/1024)} KB</span>
                      </div>
                    ))}
                    {files.length > 50 && <div className="text-center text-[9px] text-brand-cyan/60 font-black py-4 uppercase">... e mais {files.length - 50} arquivos</div>}
                  </div>
                </div>
                <div className="bg-brand-cyan/5 border border-brand-cyan/10 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
                  <div className="w-12 h-12 bg-brand-cyan/10 rounded-xl flex items-center justify-center text-brand-cyan text-2xl mb-4">🗂️</div>
                  <h5 className="text-sm font-bold text-white uppercase tracking-widest mb-1">Análise Pronta</h5>
                  <p className="text-[10px] text-gray-500 font-black uppercase tracking-tighter">Clique em Executar Control</p>
                </div>
              </div>
            )}
          </div>

          {/* Result Area */}
          {result && (
            <div className="bg-background-mid border border-white/10 rounded-[48px] p-10 shadow-2xl space-y-10 animate-in slide-in-from-bottom-8 duration-500 relative overflow-hidden">
               <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-brand-cyan via-brand-purple to-brand-pink" />
               
               <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                 <div>
                   <h3 className="text-3xl font-black tracking-tighter">Relatório Umbra Control</h3>
                   <p className="text-sm text-gray-500 font-medium mt-1">Processado via Motor Umbra Engine v1.0</p>
                 </div>
                 <div className={`px-6 py-3 rounded-2xl border flex items-center gap-3 text-xs font-black uppercase tracking-widest ${
                   result.missing.length > 0 ? 'bg-brand-pink/10 border-brand-pink/20 text-brand-pink' : 'bg-brand-green/10 border-brand-green/20 text-brand-green'
                 }`}>
                   <div className={`w-2 h-2 rounded-full ${result.missing.length > 0 ? 'bg-brand-pink animate-pulse' : 'bg-brand-green'}`} />
                   {result.missing.length > 0 ? `${result.missing.length} Gaps Identificados` : 'Sequência Íntegra'}
                 </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="bg-background-deep/50 border border-white/5 rounded-2xl p-6 text-center">
                    <p className="font-space text-[10px] text-gray-500 font-black uppercase tracking-widest mb-2">Total Esperado</p>
                    <p className="text-4xl font-bebas tracking-widest text-white">{result.expected}</p>
                 </div>
                 <div className="bg-background-deep/50 border border-white/5 rounded-2xl p-6 text-center">
                    <p className="font-space text-[10px] text-gray-500 font-black uppercase tracking-widest mb-2">Encontrados</p>
                    <p className="text-4xl font-bebas tracking-widest text-brand-green">{result.found}</p>
                 </div>
                 <div className="bg-background-deep/50 border border-white/5 rounded-2xl p-6 text-center">
                    <p className="font-space text-[10px] text-gray-500 font-black uppercase tracking-widest mb-2">Faltantes</p>
                    <p className={`text-4xl font-bebas tracking-widest ${result.missing.length > 0 ? 'text-brand-pink' : 'text-brand-cyan'}`}>{result.missing.length}</p>
                 </div>
               </div>

               <div className="relative group">
                 <div className="absolute top-6 right-6 flex gap-2 z-10">
                    <button onClick={() => navigator.clipboard.writeText(result.report)} className="flex items-center gap-2 px-4 py-2 bg-background-light/80 hover:bg-background-light border border-white/10 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all">
                      <Copy className="w-3 h-3" /> Copiar Log
                    </button>
                    {result.missing.length > 0 && (
                      <button 
                        onClick={() => navigator.clipboard.writeText(result.missing.map(m => String(m).padStart(padding, '0')).join(', '))} 
                        className="flex items-center gap-2 px-4 py-2 bg-brand-purple/20 hover:bg-brand-purple/40 border border-brand-purple/20 rounded-lg text-[9px] font-black uppercase tracking-widest text-brand-purple transition-all"
                      >
                        <RefreshCw className="w-3 h-3" /> Copiar Lista
                      </button>
                    )}
                 </div>
                 <div className="bg-background-deep/80 border border-white/5 rounded-[32px] p-10 font-space text-[12px] leading-relaxed text-gray-400 whitespace-pre overflow-x-auto custom-scrollbar">
                   {result.report}
                 </div>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UmbraControlTool;
