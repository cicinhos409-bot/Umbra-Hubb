import React, { useState, useRef } from 'react';
import { ScannerResult } from '../types';
import { FolderOpen, Search, Copy, X, Layers, CheckCircle, AlertCircle } from 'lucide-react';

const UmbraControlTool: React.FC = () => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [startNum, setStartNum] = useState<string>('1');
  const [endNum, setEndNum] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<ScannerResult | null>(null);
  const [padding, setPadding] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles(filesArray);
      setResult(null);

      if (filesArray.length > 0) {
        let min = Infinity;
        let max = -Infinity;
        let detectedPadding = 0;

        filesArray.forEach((file: File) => {
          const name = file.name.substring(0, file.name.lastIndexOf('.'));
          const matches = name.match(/\d+/g);
          if (matches) {
            const lastMatch = matches[matches.length - 1];
            const num = parseInt(lastMatch, 10);
            if (!isNaN(num)) {
              if (num < min) min = num;
              if (num > max) max = num;
              detectedPadding = Math.max(detectedPadding, lastMatch.length);
            }
          }
        });

        if (min !== Infinity) setStartNum(min.toString());
        if (max !== -Infinity) setEndNum(max.toString());
        setPadding(detectedPadding);
      }
    }
  };

  const getMissingSequences = (missing: number[], pad: number) => {
    if (missing.length === 0) return [];
    const ranges = [];
    let start = missing[0];
    let prev = missing[0];

    for (let i = 1; i <= missing.length; i++) {
      if (i === missing.length || missing[i] !== prev + 1) {
        const count = prev - start + 1;
        const startStr = String(start).padStart(pad, '0');
        const prevStr = String(prev).padStart(pad, '0');
        ranges.push(start === prev
          ? `${startStr} (1 arquivo)`
          : `${startStr} até ${prevStr} (${count} arquivos)`);
        if (i < missing.length) { start = missing[i]; prev = missing[i]; }
      } else {
        prev = missing[i];
      }
    }
    return ranges;
  };

  const scanSequence = () => {
    if (selectedFiles.length === 0) return;
    const start = parseInt(startNum);
    const end = parseInt(endNum);

    if (isNaN(start) || isNaN(end) || start > end) {
      alert('Por favor, insira um intervalo válido (Início <= Fim).');
      return;
    }

    setIsAnalyzing(true);
    const numSet = new Set<number>();

    selectedFiles.forEach(file => {
      const fileName = file.name.substring(0, file.name.lastIndexOf('.'));
      const matches = fileName.match(/\d+/g);
      if (matches && matches.length > 0) {
        numSet.add(parseInt(matches[matches.length - 1], 10));
      }
    });

    const missing: number[] = [];
    let foundInRangeCount = 0;

    for (let i = start; i <= end; i++) {
      if (!numSet.has(i)) missing.push(i);
      else foundInRangeCount++;
    }

    const expected = end - start + 1;
    const missingSeqs = getMissingSequences(missing, padding);

    const output = `======================================================================
RELATORIO UMBRA CONTROL - ANALISE DE SEQUENCIA
======================================================================

PARAMETROS DE BUSCA:
   Intervalo Solicitado: ${String(start).padStart(padding, '0')} ate ${String(end).padStart(padding, '0')}
   Total de arquivos na pasta: ${selectedFiles.length}
   Padding detectado: ${padding} digitos

----------------------------------------------------------------------
RESULTADO DA VERIFICACAO:
   Frames Esperados:  ${expected}
   Frames Encontrados: ${foundInRangeCount}
   Frames Faltantes:  ${missing.length}
----------------------------------------------------------------------

${missing.length > 0
  ? `LACUNAS DETECTADAS (${missing.length} frames):
   ${missing.map(m => String(m).padStart(padding, '0')).join(', ')}

SEQUENCIAS PARA RE-RENDER (GROUPED):
${missingSeqs.map(s => `   ${s}`).join('\n')}

Dica: Copie os numeros faltantes para usar no Umbra Dispatch.`
  : `SEQUENCIA 100% COMPLETA!
   Nenhum frame faltando no intervalo definido.`}

======================================================================`;

    setTimeout(() => {
      setResult({ expected, found: foundInRangeCount, missingCount: missing.length, missing, output });
      setIsAnalyzing(false);
    }, 800);
  };

  const copyToClipboard = (text: string) => navigator.clipboard.writeText(text);

  const copyMissingNumbers = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.missing.map(m => String(m).padStart(padding, '0')).join(', '));
  };

  const inputCls = 'w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 font-mono font-black text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary/40 outline-none transition-all';
  const labelCls = 'text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]';

  return (
    <div className="space-y-4 animate-in fade-in duration-300">

      {/* ── CONFIG CARD ── */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center gap-3">
          <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
            <Search className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-black text-gray-900">Umbra Control</h3>
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Parâmetros de análise de sequência</p>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className={labelCls}>Frame Início</label>
              <input
                type="number"
                value={startNum}
                onChange={e => setStartNum(e.target.value)}
                className={inputCls}
                placeholder="1"
              />
            </div>
            <div className="space-y-2">
              <label className={labelCls}>Frame Fim</label>
              <input
                type="number"
                value={endNum}
                onChange={e => setEndNum(e.target.value)}
                className={inputCls}
                placeholder="1000"
              />
            </div>
            <div className="space-y-2">
              <label className={labelCls}>Padding (zeros)</label>
              <input
                type="number"
                value={padding}
                onChange={e => setPadding(parseInt(e.target.value) || 0)}
                className={inputCls}
                placeholder="4"
              />
            </div>
          </div>

          <div className="flex items-start gap-2 p-4 bg-gray-50 border border-gray-200 rounded-xl">
            <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0 animate-pulse" />
            <p className="text-xs font-black text-gray-500 leading-relaxed">
              Detectamos automaticamente o intervalo ao carregar os arquivos. O Umbra Control foca apenas nos números sequenciais finais dos nomes de arquivo.
            </p>
          </div>
        </div>
      </div>

      {/* ── FILE UPLOAD CARD ── */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
              <FolderOpen className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-black text-gray-900">Fonte de Dados</h3>
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">PNG, JPG, EXR, TIFF, MP4</p>
            </div>
          </div>
          {selectedFiles.length > 0 && (
            <button
              onClick={() => { setSelectedFiles([]); setResult(null); }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-red-600 bg-white border border-gray-200 hover:border-red-300 rounded-lg transition-all"
            >
              <X className="w-3.5 h-3.5" /> Limpar
            </button>
          )}
        </div>

        <div className="p-6 space-y-4">
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
              selectedFiles.length > 0
                ? 'border-primary/40 bg-primary/5'
                : 'border-gray-300 hover:border-primary/50 hover:bg-gray-50'
            }`}
          >
            <FolderOpen className={`w-10 h-10 mx-auto mb-3 ${selectedFiles.length > 0 ? 'text-primary' : 'text-gray-400'}`} />
            <p className="text-base font-black text-gray-900">
              {selectedFiles.length > 0
                ? `${selectedFiles.length} arquivos selecionados`
                : 'Clique para selecionar arquivos'}
            </p>
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-1">
              {selectedFiles.length > 0 ? 'Clique para atualizar a lista' : 'Selecione toda a pasta de frames'}
            </p>
          </div>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} multiple className="hidden" />

          {selectedFiles.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Amostra da Sequência</p>
                <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                  {selectedFiles.slice(0, 100).map((f, i) => (
                    <div key={i} className="flex justify-between items-center text-[11px] font-mono text-gray-600 border-b border-gray-200 pb-1.5 last:border-0">
                      <span className="truncate max-w-[70%]">{f.name}</span>
                      <span className="text-gray-400 font-black shrink-0">{(f.size / 1024).toFixed(0)} KB</span>
                    </div>
                  ))}
                  {selectedFiles.length > 100 && (
                    <p className="text-[10px] text-center text-primary/60 font-black py-2 uppercase tracking-widest">
                      ... e mais {selectedFiles.length - 100} itens
                    </p>
                  )}
                </div>
              </div>

              <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl flex flex-col justify-center items-center text-center gap-3">
                <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
                  <Layers className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-black text-gray-900 uppercase tracking-tight">Análise Pronta</p>
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-0.5">Configure o intervalo e execute</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── SCAN BUTTON ── */}
      <button
        onClick={scanSequence}
        disabled={selectedFiles.length === 0 || isAnalyzing}
        className="w-full py-4 bg-primary hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black rounded-xl transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-widest"
      >
        {isAnalyzing ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Analisando...
          </>
        ) : (
          <>
            <Search className="w-4 h-4" /> Executar Control
          </>
        )}
      </button>

      {/* ── RESULTS ── */}
      {result && (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
                {result.missingCount > 0
                  ? <AlertCircle className="w-4 h-4 text-red-500" />
                  : <CheckCircle className="w-4 h-4 text-green-500" />
                }
              </div>
              <div>
                <h3 className="text-sm font-black text-gray-900">Relatório Umbra Control</h3>
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Umbra Engine v1.0</p>
              </div>
            </div>
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black border uppercase tracking-widest ${
              result.missingCount > 0
                ? 'bg-red-50 text-red-600 border-red-200'
                : 'bg-green-50 text-green-700 border-green-200'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${result.missingCount > 0 ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`} />
              {result.missingCount > 0 ? `${result.missingCount} gaps detectados` : 'Sequência íntegra'}
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Total Esperado', value: result.expected, color: 'text-gray-900' },
                { label: 'Encontrados',    value: result.found,    color: 'text-green-600' },
                { label: 'Faltantes',      value: result.missingCount, color: result.missingCount > 0 ? 'text-red-500' : 'text-green-600' },
              ].map(stat => (
                <div key={stat.label} className="p-5 bg-gray-50 border border-gray-200 rounded-xl">
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">{stat.label}</p>
                  <p className={`text-3xl font-black font-mono ${stat.color}`}>{stat.value}</p>
                </div>
              ))}
            </div>

            {/* Log output */}
            <div className="relative">
              <div className="absolute top-4 right-4 flex gap-2 z-10">
                <button
                  onClick={() => copyToClipboard(result.output)}
                  className="px-3 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 shadow-sm"
                >
                  <Copy className="w-3.5 h-3.5" /> Copiar Log
                </button>
                {result.missingCount > 0 && (
                  <button
                    onClick={copyMissingNumbers}
                    className="px-3 py-2 bg-primary text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 shadow-sm hover:bg-primary/90"
                  >
                    <Copy className="w-3.5 h-3.5" /> Copiar Lista
                  </button>
                )}
              </div>
              <div className="bg-gray-900 rounded-xl pt-14 px-6 pb-6 overflow-x-auto min-h-[200px]">
                <pre className="text-sm text-gray-300 font-mono leading-relaxed whitespace-pre">
                  {result.output}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UmbraControlTool;
