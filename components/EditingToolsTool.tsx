
import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  FileText, 
  Scissors, 
  Clock, 
  Download, 
  Copy, 
  Trash2, 
  CheckCircle2, 
  Zap,
  Layout,
  Type,
  ChevronRight
} from 'lucide-react';

const EditingToolsTool: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'srt' | 'divisor' | 'contador'>('srt');
  const [toast, setToast] = useState<{ message: string; isError?: boolean } | null>(null);

  const showToast = (message: string, isError = false) => {
    setToast({ message, isError });
    setTimeout(() => setToast(null), 3000);
  };

  // Helper for padding numbers
  const pad = (numero: number, tamanho = 2) => numero.toString().padStart(tamanho, '0');

  // ========================================
  // CONVERSOR SRT STATE & LOGIC
  // ========================================
  const [srtSettings, setSrtSettings] = useState({
    charsPerBlock: 500,
    wordsMin: 80,
    wordsMax: 100,
    duration: 30,
    interval: 10
  });
  const [srtInput, setSrtInput] = useState('');
  const [srtOutput, setSrtOutput] = useState('');
  const [srtStats, setSrtStats] = useState({ blocks: 0, words: 0, chars: 0, duration: '00:00' });

  const formatTime = (segundos: number) => {
    const horas = Math.floor(segundos / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);
    const segsRestantes = Math.floor(segundos % 60);
    const milissegundos = Math.floor((segundos % 1) * 1000);
    return `${pad(horas)}:${pad(minutos)}:${pad(segsRestantes)},${pad(milissegundos, 3)}`;
  };

  const formatDuration = (segundos: number) => {
    const minutos = Math.floor(segundos / 60);
    const segs = Math.floor(segundos % 60);
    return `${pad(minutos)}:${pad(segs)}`;
  };

  const handleSrtConvert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!srtInput.trim()) {
      showToast('Por favor, insira algum texto!', true);
      return;
    }

    let srt = '';
    let contador = 1;
    let tempoAcumulado = 0;
    const palavras = srtInput.split(/\s+/).filter(p => p.length > 0);
    let blocoAtual = '';
    let palavrasNoBloco = 0;

    for (let palavra of palavras) {
      if (blocoAtual.length + palavra.length <= srtSettings.charsPerBlock && palavrasNoBloco < srtSettings.wordsMax) {
        blocoAtual += palavra + ' ';
        palavrasNoBloco++;
      } else {
        let ultimoPontoFinal = blocoAtual.lastIndexOf('.');
        if (ultimoPontoFinal !== -1 && ultimoPontoFinal !== blocoAtual.length - 1) {
          let resto = blocoAtual.substring(ultimoPontoFinal + 1);
          blocoAtual = blocoAtual.substring(0, ultimoPontoFinal + 1);
          srt += `${contador}\n${formatTime(tempoAcumulado)} --> ${formatTime(tempoAcumulado + srtSettings.duration)}\n${blocoAtual.trim()}\n\n`;
          contador++;
          tempoAcumulado += srtSettings.duration + srtSettings.interval;
          blocoAtual = resto + palavra + ' ';
          palavrasNoBloco = resto.split(/\s+/).filter(p => p.length > 0).length + 1;
        } else {
          srt += `${contador}\n${formatTime(tempoAcumulado)} --> ${formatTime(tempoAcumulado + srtSettings.duration)}\n${blocoAtual.trim()}\n\n`;
          contador++;
          tempoAcumulado += srtSettings.duration + srtSettings.interval;
          blocoAtual = palavra + ' ';
          palavrasNoBloco = 1;
        }
      }
    }

    if (blocoAtual.trim()) {
      srt += `${contador}\n${formatTime(tempoAcumulado)} --> ${formatTime(tempoAcumulado + srtSettings.duration)}\n${blocoAtual.trim()}\n\n`;
      tempoAcumulado += srtSettings.duration;
    }

    setSrtOutput(srt.trim());
    setSrtStats({
      blocks: contador,
      words: palavras.length,
      chars: srtInput.length,
      duration: formatDuration(tempoAcumulado)
    });
    showToast(`${contador} blocos gerados com sucesso!`);
  };

  const downloadSrt = () => {
    const blob = new Blob([srtOutput], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'legendas.srt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Arquivo SRT baixado!');
  };

  // ========================================
  // DIVISOR DE TEXTO STATE & LOGIC
  // ========================================
  const [divisorInput, setDivisorInput] = useState('');
  const [divisorLimit, setDivisorLimit] = useState(7000);
  const [divisorBlocks, setDivisorBlocks] = useState<string[]>([]);

  const handleDivide = () => {
    if (!divisorInput.trim()) {
      showToast('Por favor, insira algum texto para dividir!', true);
      return;
    }

    const blocks: string[] = [];
    let posicao = 0;
    const texto = divisorInput.trim();

    while (posicao < texto.length) {
      let fim = Math.min(posicao + divisorLimit, texto.length);
      
      if (fim < texto.length) {
        const ultimoPonto = texto.lastIndexOf('.', fim);
        const ultimaQuebraLinha = texto.lastIndexOf('\n', fim);
        const melhorCorte = Math.max(ultimoPonto, ultimaQuebraLinha);
        
        if (melhorCorte > posicao) {
          fim = melhorCorte + 1;
        }
      }
      
      blocks.push(texto.substring(posicao, fim).trim());
      posicao = fim;
    }

    setDivisorBlocks(blocks);
    showToast(`Texto dividido em ${blocks.length} blocos!`);
  };

  // ========================================
  // CONTADOR DE PALAVRAS STATE & LOGIC
  // ========================================
  const [scriptInput, setScriptInput] = useState('');
  const [speed, setSpeed] = useState<'slow' | 'normal' | 'fast'>('normal');
  const [scriptStats, setScriptStats] = useState<any>(null);

  const calculateScript = () => {
    if (!scriptInput.trim()) {
      showToast('Por favor, insira um script!', true);
      return;
    }

    const words = scriptInput.split(/\s+/).filter(p => p.length > 0);
    const speeds = { slow: 130, normal: 150, fast: 180 };

    setScriptStats({
      words: words.length,
      chars: scriptInput.length,
      lines: scriptInput.split('\n').length,
      slowTime: formatDuration((words.length / speeds.slow) * 60),
      normalTime: formatDuration((words.length / speeds.normal) * 60),
      fastTime: formatDuration((words.length / speeds.fast) * 60)
    });
    showToast('Tempo calculado com sucesso!');
  };

  return (
    <div className="font-rajdhani min-h-screen bg-background-deep text-white p-4 md:p-8 animate-in fade-in duration-700 pb-20">
      <header className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-brand-cyan to-brand-purple rounded-2xl mb-6 shadow-2xl shadow-brand-cyan/20">
          <FileText className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-4xl font-black tracking-tighter mb-2 bg-gradient-to-r from-brand-cyan to-brand-purple bg-clip-text text-transparent uppercase">
          Ferramentas de Edição
        </h1>
        <p className="text-gray-500 font-medium tracking-wide">Otimize seus roteiros e legendas para produção em escala</p>
      </header>

      {/* TABS NAVIGATION */}
      <div className="flex flex-col sm:flex-row gap-2 bg-background-mid p-1.5 rounded-2xl border border-white/5 mb-8 max-w-2xl mx-auto shadow-xl">
        <button 
          onClick={() => setActiveTab('srt')}
          className={`flex-1 py-3.5 px-6 rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === 'srt' ? 'bg-brand-purple text-white shadow-lg' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
        >
          <Type className="w-4 h-4" /> Conversor SRT
        </button>
        <button 
          onClick={() => setActiveTab('divisor')}
          className={`flex-1 py-3.5 px-6 rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === 'divisor' ? 'bg-brand-purple text-white shadow-lg' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
        >
          <Scissors className="w-4 h-4" /> Divisor
        </button>
        <button 
          onClick={() => setActiveTab('contador')}
          className={`flex-1 py-3.5 px-6 rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === 'contador' ? 'bg-brand-purple text-white shadow-lg' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
        >
          <Clock className="w-4 h-4" /> Contador
        </button>
      </div>

      <div className="max-w-5xl mx-auto">
        {/* --- TAB 1: CONVERSOR SRT --- */}
        {activeTab === 'srt' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <div className="bg-background-mid border border-white/5 rounded-3xl p-8 shadow-2xl">
              <div className="flex items-center gap-3 mb-8">
                <Settings className="w-5 h-5 text-brand-cyan" />
                <h3 className="font-orbitron text-xs font-black uppercase tracking-[0.2em] text-white">Configurações de Blocos</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                {[
                  { label: 'Caracteres', key: 'charsPerBlock', min: 100, max: 1000 },
                  { label: 'Palavras Mín.', key: 'wordsMin', min: 10, max: 150 },
                  { label: 'Palavras Máx.', key: 'wordsMax', min: 50, max: 200 },
                  { label: 'Duração (s)', key: 'duration', min: 5, max: 60 },
                  { label: 'Intervalo (s)', key: 'interval', min: 0, max: 30 },
                ].map(item => (
                  <div key={item.key} className="space-y-2">
                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest">{item.label}</label>
                    <input 
                      type="number" 
                      value={(srtSettings as any)[item.key]} 
                      min={item.min}
                      max={item.max}
                      onChange={e => setSrtSettings({...srtSettings, [item.key]: parseInt(e.target.value)})}
                      className="w-full bg-background-deep border border-white/5 rounded-xl px-4 py-3 text-xs font-bold focus:border-brand-cyan/50 outline-none" 
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-background-mid border border-white/5 rounded-3xl p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-orbitron text-[10px] font-black uppercase tracking-widest text-gray-400">Texto Original</h4>
                  <span className="text-[10px] font-bold text-gray-600">{srtInput.length} chars</span>
                </div>
                <textarea 
                  value={srtInput}
                  onChange={e => setSrtInput(e.target.value)}
                  placeholder="Cole seu roteiro final aqui para gerar o arquivo de legendas SRT perfeitamente sincronizado..."
                  className="w-full h-[300px] bg-background-deep/50 border border-white/5 rounded-2xl p-6 text-xs leading-relaxed focus:border-brand-purple/40 outline-none resize-none custom-scrollbar"
                />
                <div className="flex gap-2">
                  <button onClick={handleSrtConvert} className="flex-1 bg-brand-purple hover:bg-brand-purple/90 text-white font-black py-4 rounded-2xl text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2">
                    <Zap className="w-4 h-4 text-brand-cyan" /> Gerar SRT
                  </button>
                  <button onClick={() => { setSrtInput(''); setSrtOutput(''); }} className="p-4 bg-white/5 hover:bg-brand-pink/10 rounded-2xl text-gray-500 hover:text-brand-pink transition-all">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="bg-background-mid border border-white/5 rounded-3xl p-6 shadow-xl space-y-4 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <h4 className="font-orbitron text-[10px] font-black uppercase tracking-widest text-brand-cyan">Resultado SRT</h4>
                  {srtOutput && <span className="text-[10px] font-black text-brand-green uppercase">✓ Gerado</span>}
                </div>
                <textarea 
                  value={srtOutput}
                  readOnly
                  placeholder="O arquivo formatado aparecerá aqui após o processamento..."
                  className="w-full h-[300px] bg-background-deep border border-white/5 rounded-2xl p-6 text-xs font-space leading-relaxed text-gray-400 outline-none resize-none custom-scrollbar"
                />
                <div className="flex gap-2">
                  <button 
                    onClick={() => { navigator.clipboard.writeText(srtOutput); showToast('Copiado!'); }}
                    disabled={!srtOutput}
                    className="flex-1 bg-white/5 hover:bg-white/10 disabled:opacity-30 border border-white/10 rounded-2xl font-black py-4 text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
                  >
                    <Copy className="w-4 h-4" /> Copiar
                  </button>
                  <button 
                    onClick={downloadSrt}
                    disabled={!srtOutput}
                    className="flex-1 bg-brand-cyan/10 hover:bg-brand-cyan/20 disabled:opacity-30 border border-brand-cyan/20 text-brand-cyan rounded-2xl font-black py-4 text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
                  >
                    <Download className="w-4 h-4" /> Baixar .srt
                  </button>
                </div>
              </div>
            </div>

            {/* SRT STATS */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Blocos', val: srtStats.blocks },
                { label: 'Palavras', val: srtStats.words },
                { label: 'Caracteres', val: srtStats.chars },
                { label: 'Duração Total', val: srtStats.duration, highlight: true },
              ].map((stat, i) => (
                <div key={i} className="bg-background-mid border border-white/5 rounded-2xl p-6 text-center shadow-lg">
                  <div className={`text-2xl font-black tracking-tighter mb-1 ${stat.highlight ? 'text-brand-cyan' : 'text-white'}`}>{stat.val}</div>
                  <div className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- TAB 2: DIVISOR DE TEXTO --- */}
        {activeTab === 'divisor' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <div className="bg-background-mid border border-white/5 rounded-3xl p-8 shadow-2xl">
              <div className="flex items-center gap-3 mb-4">
                <Scissors className="w-5 h-5 text-brand-purple" />
                <h3 className="font-orbitron text-xs font-black uppercase tracking-[0.2em] text-white">Configurações de Divisão</h3>
              </div>
              <p className="text-gray-500 text-sm mb-8 leading-relaxed max-w-2xl">
                Divida textos extremamente longos em blocos compatíveis com limites de legendas de editores como CapCut ou Premiere.
              </p>
              <div className="max-w-xs space-y-2">
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest">Limite de Caracteres por Bloco</label>
                <input 
                  type="number" 
                  value={divisorLimit}
                  step={500}
                  onChange={e => setDivisorLimit(parseInt(e.target.value))}
                  className="w-full bg-background-deep border border-white/5 rounded-xl px-4 py-3 text-xs font-bold focus:border-brand-purple/50 outline-none" 
                />
              </div>
            </div>

            <div className="bg-background-mid border border-white/5 rounded-3xl p-8 shadow-xl space-y-6">
              <textarea 
                value={divisorInput}
                onChange={e => setDivisorInput(e.target.value)}
                placeholder="Cole o texto longo aqui..."
                className="w-full h-64 bg-background-deep/50 border border-white/5 rounded-2xl p-6 text-sm leading-relaxed focus:border-brand-purple/40 outline-none resize-none custom-scrollbar"
              />
              <div className="flex gap-3">
                <button onClick={handleDivide} className="flex-1 bg-brand-purple hover:bg-brand-purple/90 text-white font-black py-5 rounded-2xl text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2">
                  <Scissors className="w-4 h-4" /> Dividir em Blocos
                </button>
                <button onClick={() => { setDivisorInput(''); setDivisorBlocks([]); }} className="px-8 bg-white/5 hover:bg-brand-pink/10 border border-white/10 rounded-2xl text-gray-500 hover:text-brand-pink transition-all">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            {divisorBlocks.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="h-px flex-1 bg-white/5"></div>
                  <h4 className="font-orbitron text-[10px] font-black text-gray-600 uppercase tracking-widest">{divisorBlocks.length} Blocos Gerados</h4>
                  <div className="h-px flex-1 bg-white/5"></div>
                </div>
                <div className="grid gap-4">
                  {divisorBlocks.map((block, idx) => (
                    <div key={idx} className="bg-background-mid border border-white/5 rounded-2xl p-6 shadow-xl group hover:border-brand-purple/20 transition-all">
                      <div className="flex items-center justify-between mb-4">
                        <span className="font-black text-brand-purple text-xs uppercase tracking-widest">Bloco {idx + 1}</span>
                        <span className="text-[10px] font-bold text-gray-700">{block.length} caracteres</span>
                      </div>
                      <div className="bg-background-deep/50 rounded-xl p-4 text-xs text-gray-400 font-medium leading-relaxed mb-6 whitespace-pre-wrap max-h-40 overflow-y-auto custom-scrollbar">
                        {block}
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => { navigator.clipboard.writeText(block); showToast(`Bloco ${idx+1} copiado!`); }}
                          className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
                        >
                          <Copy className="w-3.5 h-3.5" /> Copiar
                        </button>
                        <button 
                          onClick={() => {
                            const blob = new Blob([block], { type: 'text/plain' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a'); a.href = url; a.download = `bloco_${idx+1}.txt`; a.click();
                          }}
                          className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-gray-500 hover:text-white transition-all"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- TAB 3: CONTADOR DE PALAVRAS --- */}
        {activeTab === 'contador' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <div className="bg-background-mid border border-white/5 rounded-3xl p-8 shadow-2xl">
              <div className="flex items-center gap-3 mb-4">
                <Clock className="w-5 h-5 text-brand-pink" />
                <h3 className="font-orbitron text-xs font-black uppercase tracking-[0.2em] text-white">Calculadora de Roteiro</h3>
              </div>
              <p className="text-gray-500 text-sm leading-relaxed mb-10">
                Estime a duração final do seu vídeo do YouTube baseado na velocidade de narração.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { id: 'slow', name: 'Lento', val: '130 p/min' },
                  { id: 'normal', name: 'Normal', val: '150 p/min' },
                  { id: 'fast', name: 'Rápido', val: '180 p/min' },
                ].map(opt => (
                  <button 
                    key={opt.id}
                    onClick={() => setSpeed(opt.id as any)}
                    className={`p-6 rounded-2xl border transition-all text-center group ${speed === opt.id ? 'bg-brand-purple/10 border-brand-purple text-white shadow-xl' : 'bg-background-deep border-white/5 text-gray-500 hover:border-white/20'}`}
                  >
                    <div className="font-black text-xs uppercase tracking-widest mb-1">{opt.name}</div>
                    <div className="text-[10px] opacity-60 font-bold uppercase">{opt.val}</div>
                  </button>
                ))}
              </div>
              <div className="mt-8 p-4 bg-brand-green/5 border border-brand-green/20 rounded-xl flex items-center gap-3">
                <span className="text-lg">💡</span>
                <p className="text-xs text-brand-green font-medium">A maioria dos YouTubers fala entre o ritmo Normal e Rápido.</p>
              </div>
            </div>

            <div className="bg-background-mid border border-white/5 rounded-3xl p-8 shadow-xl space-y-6">
              <textarea 
                value={scriptInput}
                onChange={e => setScriptInput(e.target.value)}
                placeholder="Cole seu script aqui..."
                className="w-full h-64 bg-background-deep/50 border border-white/5 rounded-2xl p-6 text-sm leading-loose focus:border-brand-pink/40 outline-none resize-none custom-scrollbar"
              />
              <div className="flex gap-3">
                <button onClick={calculateScript} className="flex-1 bg-brand-pink hover:bg-brand-pink/90 text-white font-black py-5 rounded-2xl text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-xl shadow-brand-pink/10">
                  <Clock className="w-4 h-4" /> Calcular Tempo Estimado
                </button>
                <button onClick={() => { setScriptInput(''); setScriptStats(null); }} className="px-8 bg-white/5 hover:bg-brand-pink/10 border border-white/10 rounded-2xl text-gray-500 hover:text-brand-pink transition-all">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            {scriptStats ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4 duration-500">
                <div className="md:col-span-3 grid grid-cols-3 gap-4">
                  {[
                    { label: 'Palavras', val: scriptStats.words },
                    { label: 'Caracteres', val: scriptStats.chars },
                    { label: 'Linhas', val: scriptStats.lines },
                  ].map((s, i) => (
                    <div key={i} className="bg-background-mid border border-white/5 rounded-2xl p-5 text-center">
                       <div className="text-xl font-black text-white">{s.val.toLocaleString()}</div>
                       <div className="text-[9px] font-black text-gray-600 uppercase tracking-widest">{s.label}</div>
                    </div>
                  ))}
                </div>

                <div className="p-8 bg-background-mid border-t-2 border-brand-pink/40 border-l border-r border-b border-white/5 rounded-3xl text-center shadow-xl">
                  <div className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-4">Velocidade Lenta</div>
                  <div className="text-5xl font-black font-orbitron tracking-tighter text-white mb-2">{scriptStats.slowTime}</div>
                  <div className="text-[10px] text-gray-700 font-bold uppercase">Minutos</div>
                </div>
                <div className="p-8 bg-background-mid border-t-2 border-brand-purple/40 border-l border-r border-b border-white/5 rounded-3xl text-center shadow-xl scale-105 ring-4 ring-brand-purple/10">
                  <div className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-4">Velocidade Normal</div>
                  <div className="text-5xl font-black font-orbitron tracking-tighter text-brand-purple mb-2">{scriptStats.normalTime}</div>
                  <div className="text-[10px] text-gray-700 font-bold uppercase">Minutos</div>
                </div>
                <div className="p-8 bg-background-mid border-t-2 border-brand-cyan/40 border-l border-r border-b border-white/5 rounded-3xl text-center shadow-xl">
                  <div className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-4">Velocidade Rápida</div>
                  <div className="text-5xl font-black font-orbitron tracking-tighter text-brand-cyan mb-2">{scriptStats.fastTime}</div>
                  <div className="text-[10px] text-gray-700 font-bold uppercase">Minutos</div>
                </div>
              </div>
            ) : (
              <div className="py-20 text-center text-gray-700 font-black uppercase tracking-widest text-xs opacity-50">
                📝 Cole seu script para analisar a minutagem
              </div>
            )}
          </div>
        )}
      </div>

      <footer className="mt-20 py-10 text-center border-t border-white/5">
        <p className="text-gray-600 font-bold uppercase tracking-widest text-[10px]">Desenvolvido com tecnologia de precisão por <span className="text-brand-purple">UMBRA HUB</span></p>
      </footer>

      {/* TOAST */}
      {toast && (
        <div className="fixed bottom-10 right-10 z-[200] animate-in slide-in-from-right-4 duration-300">
           <div className={`px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 border ${toast.isError ? 'bg-brand-pink/20 border-brand-pink text-brand-pink' : 'bg-brand-green/20 border-brand-green text-brand-green'} backdrop-blur-xl`}>
             {toast.isError ? <Trash2 className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
             <span className="font-bold text-sm tracking-tight">{toast.message}</span>
           </div>
        </div>
      )}
    </div>
  );
};

export default EditingToolsTool;
