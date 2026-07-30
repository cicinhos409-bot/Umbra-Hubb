
import React, { useState } from 'react';
import {
  FileText,
  Scissors,
  Clock,
  Download,
  Copy,
  Trash2,
  CheckCircle2,
  Zap,
  Type,
  Settings,
  ChevronRight,
  BarChart3,
} from 'lucide-react';

const EditingToolsTool: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'srt' | 'divisor' | 'contador'>('srt');
  const [toast, setToast] = useState<{ message: string; isError?: boolean } | null>(null);

  const showToast = (message: string, isError = false) => {
    setToast({ message, isError });
    setTimeout(() => setToast(null), 3000);
  };

  const pad = (numero: number, tamanho = 2) => numero.toString().padStart(tamanho, '0');

  // ── CONVERSOR SRT ──────────────────────────────────────────────
  const [srtSettings, setSrtSettings] = useState({
    charsPerBlock: 500,
    wordsMin: 80,
    wordsMax: 100,
    duration: 30,
    interval: 10,
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
    if (!srtInput.trim()) { showToast('Por favor, insira algum texto!', true); return; }

    let srt = '';
    let contador = 1;
    let tempoAcumulado = 0;
    const palavras = srtInput.split(/\s+/).filter(p => p.length > 0);
    let blocoAtual = '';
    let palavrasNoBloco = 0;

    for (const palavra of palavras) {
      if (blocoAtual.length + palavra.length <= srtSettings.charsPerBlock && palavrasNoBloco < srtSettings.wordsMax) {
        blocoAtual += palavra + ' ';
        palavrasNoBloco++;
      } else {
        const ultimoPontoFinal = blocoAtual.lastIndexOf('.');
        if (ultimoPontoFinal !== -1 && ultimoPontoFinal !== blocoAtual.length - 1) {
          const resto = blocoAtual.substring(ultimoPontoFinal + 1);
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
    setSrtStats({ blocks: contador, words: palavras.length, chars: srtInput.length, duration: formatDuration(tempoAcumulado) });
    showToast(`${contador} blocos gerados com sucesso!`);
  };

  const downloadSrt = () => {
    const blob = new Blob([srtOutput], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'legendas.srt';
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
    showToast('Arquivo SRT baixado!');
  };

  // ── DIVISOR DE TEXTO ───────────────────────────────────────────
  const [divisorInput, setDivisorInput] = useState('');
  const [divisorLimit, setDivisorLimit] = useState(7000);
  const [divisorBlocks, setDivisorBlocks] = useState<string[]>([]);

  const handleDivide = () => {
    if (!divisorInput.trim()) { showToast('Por favor, insira algum texto para dividir!', true); return; }

    const blocks: string[] = [];
    let posicao = 0;
    const texto = divisorInput.trim();

    while (posicao < texto.length) {
      let fim = Math.min(posicao + divisorLimit, texto.length);
      if (fim < texto.length) {
        const ultimoPonto = texto.lastIndexOf('.', fim);
        const ultimaQuebraLinha = texto.lastIndexOf('\n', fim);
        const melhorCorte = Math.max(ultimoPonto, ultimaQuebraLinha);
        if (melhorCorte > posicao) fim = melhorCorte + 1;
      }
      blocks.push(texto.substring(posicao, fim).trim());
      posicao = fim;
    }

    setDivisorBlocks(blocks);
    showToast(`Texto dividido em ${blocks.length} blocos!`);
  };

  // ── CONTADOR DE PALAVRAS ───────────────────────────────────────
  const [scriptInput, setScriptInput] = useState('');
  const [speed, setSpeed] = useState<'slow' | 'normal' | 'fast'>('normal');
  const [scriptStats, setScriptStats] = useState<{
    words: number; chars: number; lines: number;
    slowTime: string; normalTime: string; fastTime: string;
  } | null>(null);

  const calculateScript = () => {
    if (!scriptInput.trim()) { showToast('Por favor, insira um script!', true); return; }
    const words = scriptInput.split(/\s+/).filter(p => p.length > 0);
    const speeds = { slow: 130, normal: 150, fast: 180 };
    setScriptStats({
      words: words.length,
      chars: scriptInput.length,
      lines: scriptInput.split('\n').length,
      slowTime: formatDuration((words.length / speeds.slow) * 60),
      normalTime: formatDuration((words.length / speeds.normal) * 60),
      fastTime: formatDuration((words.length / speeds.fast) * 60),
    });
    showToast('Tempo calculado com sucesso!');
  };

  // ── SHARED STYLES ──────────────────────────────────────────────
  const cardClass = 'bg-white border border-gray-200 rounded-2xl overflow-hidden';
  const cardHeaderClass = 'px-6 py-5 border-b border-gray-200 bg-gray-50 flex items-center gap-3';
  const inputClass = 'w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-black text-gray-900 focus:border-primary/40 focus:ring-2 focus:ring-primary/10 outline-none transition-all';
  const textareaClass = 'w-full bg-gray-50 border border-gray-200 rounded-xl px-5 py-4 text-sm text-gray-900 leading-relaxed focus:border-primary/40 focus:ring-2 focus:ring-primary/10 outline-none resize-none transition-all custom-scrollbar';
  const btnPrimary = 'flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white font-black py-3 px-6 rounded-xl text-xs uppercase tracking-widest transition-all';
  const btnSecondary = 'flex items-center justify-center gap-2 bg-white hover:bg-gray-50 border border-gray-200 hover:border-gray-300 text-gray-700 font-black py-3 px-6 rounded-xl text-xs uppercase tracking-widest transition-all';

  const TABS = [
    { id: 'srt' as const, label: 'Conversor SRT', icon: <Type className="w-4 h-4" /> },
    { id: 'divisor' as const, label: 'Divisor de Texto', icon: <Scissors className="w-4 h-4" /> },
    { id: 'contador' as const, label: 'Calculadora', icon: <Clock className="w-4 h-4" /> },
  ];

  return (
    <div className="font-rajdhani animate-in fade-in duration-500 pb-10">

      {/* ── PAGE HEADER ── */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20 shrink-0">
          <FileText className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900">Ferramentas de Edição</h1>
          <p className="text-[11px] font-black text-gray-500 uppercase tracking-widest">Otimize roteiros e legendas para produção em escala</p>
        </div>
      </div>

      {/* ── TAB NAVIGATION ── */}
      <div className="flex gap-1.5 bg-gray-100 border border-gray-200 p-1.5 rounded-xl mb-8 w-fit">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
              activeTab === tab.id
                ? 'bg-white text-primary shadow-sm border border-gray-200'
                : 'text-gray-500 hover:text-gray-900 hover:bg-white/50'
            }`}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════════
          TAB 1 — CONVERSOR SRT
      ═══════════════════════════════════════════════════════════ */}
      {activeTab === 'srt' && (
        <div className="space-y-5 animate-in slide-in-from-bottom-4 duration-400">

          {/* Config */}
          <div className={cardClass}>
            <div className={cardHeaderClass}>
              <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center border border-primary/20">
                <Settings className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-black text-gray-900">Configurações de Blocos</h3>
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Ajuste os parâmetros de geração do SRT</p>
              </div>
            </div>
            <div className="p-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {[
                { label: 'Caracteres', key: 'charsPerBlock', min: 100, max: 1000 },
                { label: 'Palavras Mín.', key: 'wordsMin', min: 10, max: 150 },
                { label: 'Palavras Máx.', key: 'wordsMax', min: 50, max: 200 },
                { label: 'Duração (s)', key: 'duration', min: 5, max: 60 },
                { label: 'Intervalo (s)', key: 'interval', min: 0, max: 30 },
              ].map(item => (
                <div key={item.key} className="space-y-1.5">
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">{item.label}</label>
                  <input
                    type="number"
                    value={(srtSettings as any)[item.key]}
                    min={item.min} max={item.max}
                    onChange={e => setSrtSettings({ ...srtSettings, [item.key]: parseInt(e.target.value) })}
                    className={inputClass}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Editor area */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Input */}
            <div className={cardClass}>
              <div className={cardHeaderClass}>
                <div>
                  <h4 className="text-sm font-black text-gray-900">Texto Original</h4>
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{srtInput.length} caracteres</p>
                </div>
              </div>
              <div className="p-5 space-y-4">
                <textarea
                  value={srtInput}
                  onChange={e => setSrtInput(e.target.value)}
                  placeholder="Cole seu roteiro final aqui para gerar o arquivo de legendas SRT..."
                  className={`${textareaClass} h-[280px]`}
                />
                <div className="flex gap-2">
                  <button onClick={handleSrtConvert} className={`${btnPrimary} flex-1`}>
                    <Zap className="w-4 h-4" /> Gerar SRT
                  </button>
                  <button
                    onClick={() => { setSrtInput(''); setSrtOutput(''); }}
                    className="p-3 bg-white hover:bg-red-50 border border-gray-200 hover:border-red-200 rounded-xl text-gray-400 hover:text-red-500 transition-all"
                    title="Limpar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Output */}
            <div className={cardClass}>
              <div className={cardHeaderClass}>
                <div className="flex items-center justify-between w-full">
                  <div>
                    <h4 className="text-sm font-black text-gray-900">Resultado SRT</h4>
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Arquivo formatado para importação</p>
                  </div>
                  {srtOutput && (
                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 border border-green-200 text-[10px] font-black text-green-700 uppercase tracking-widest">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Gerado
                    </span>
                  )}
                </div>
              </div>
              <div className="p-5 space-y-4">
                <textarea
                  value={srtOutput}
                  readOnly
                  placeholder="O arquivo formatado aparecerá aqui após o processamento..."
                  className={`${textareaClass} h-[280px] font-mono text-xs`}
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => { navigator.clipboard.writeText(srtOutput); showToast('Copiado!'); }}
                    disabled={!srtOutput}
                    className={`${btnSecondary} flex-1 disabled:opacity-40 disabled:cursor-not-allowed`}
                  >
                    <Copy className="w-4 h-4" /> Copiar
                  </button>
                  <button
                    onClick={downloadSrt}
                    disabled={!srtOutput}
                    className={`${btnPrimary} flex-1 disabled:opacity-40 disabled:cursor-not-allowed`}
                  >
                    <Download className="w-4 h-4" /> Baixar .srt
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Blocos', val: srtStats.blocks, highlight: false },
              { label: 'Palavras', val: srtStats.words, highlight: false },
              { label: 'Caracteres', val: srtStats.chars, highlight: false },
              { label: 'Duração Total', val: srtStats.duration, highlight: true },
            ].map((stat, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl p-5 text-center hover:border-primary/30 transition-all">
                <div className={`text-2xl font-black tracking-tighter mb-1 ${stat.highlight ? 'text-primary' : 'text-gray-900'}`}>
                  {stat.val || (stat.highlight ? '00:00' : '0')}
                </div>
                <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          TAB 2 — DIVISOR DE TEXTO
      ═══════════════════════════════════════════════════════════ */}
      {activeTab === 'divisor' && (
        <div className="space-y-5 animate-in slide-in-from-bottom-4 duration-400">

          {/* Config */}
          <div className={cardClass}>
            <div className={cardHeaderClass}>
              <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center border border-primary/20">
                <Scissors className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-black text-gray-900">Configurações de Divisão</h3>
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Compatível com CapCut, Premiere e outros editores</p>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm font-black text-gray-600 leading-relaxed max-w-2xl">
                Divida textos longos em blocos compatíveis com limites de caracteres de editores de legenda.
              </p>
              <div className="max-w-xs space-y-1.5">
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Limite de Caracteres por Bloco</label>
                <input
                  type="number"
                  value={divisorLimit}
                  step={500}
                  onChange={e => setDivisorLimit(parseInt(e.target.value))}
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* Input */}
          <div className={cardClass}>
            <div className={cardHeaderClass}>
              <div>
                <h4 className="text-sm font-black text-gray-900">Texto para Dividir</h4>
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{divisorInput.length} caracteres</p>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <textarea
                value={divisorInput}
                onChange={e => setDivisorInput(e.target.value)}
                placeholder="Cole o texto longo aqui..."
                className={`${textareaClass} h-56`}
              />
              <div className="flex gap-2">
                <button onClick={handleDivide} className={`${btnPrimary} flex-1`}>
                  <Scissors className="w-4 h-4" /> Dividir em Blocos
                </button>
                <button
                  onClick={() => { setDivisorInput(''); setDivisorBlocks([]); }}
                  className="p-3 bg-white hover:bg-red-50 border border-gray-200 hover:border-red-200 rounded-xl text-gray-400 hover:text-red-500 transition-all"
                  title="Limpar"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Blocks output */}
          {divisorBlocks.length > 0 && (
            <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-400">
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-gray-200" />
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-2">
                  {divisorBlocks.length} Blocos Gerados
                </span>
                <div className="h-px flex-1 bg-gray-200" />
              </div>

              <div className="grid gap-4">
                {divisorBlocks.map((block, idx) => (
                  <div key={idx} className={`${cardClass} group hover:border-primary/30 transition-all`}>
                    <div className={`${cardHeaderClass} justify-between`}>
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 bg-primary text-white rounded-lg flex items-center justify-center text-[11px] font-black shrink-0">
                          {idx + 1}
                        </span>
                        <span className="text-sm font-black text-gray-900">Bloco {idx + 1}</span>
                      </div>
                      <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{block.length} chars</span>
                    </div>
                    <div className="p-5 space-y-4">
                      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap max-h-36 overflow-y-auto custom-scrollbar">
                        {block}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => { navigator.clipboard.writeText(block); showToast(`Bloco ${idx + 1} copiado!`); }}
                          className={`${btnSecondary} flex-1`}
                        >
                          <Copy className="w-3.5 h-3.5" /> Copiar
                        </button>
                        <button
                          onClick={() => {
                            const blob = new Blob([block], { type: 'text/plain' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url; a.download = `bloco_${idx + 1}.txt`; a.click();
                            URL.revokeObjectURL(url);
                          }}
                          className={`${btnSecondary} px-4`}
                          title="Baixar bloco"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          TAB 3 — CALCULADORA DE ROTEIRO
      ═══════════════════════════════════════════════════════════ */}
      {activeTab === 'contador' && (
        <div className="space-y-5 animate-in slide-in-from-bottom-4 duration-400">

          {/* Speed selector */}
          <div className={cardClass}>
            <div className={cardHeaderClass}>
              <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center border border-primary/20">
                <Clock className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-black text-gray-900">Calculadora de Roteiro</h3>
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Estime a duração do vídeo pela velocidade de narração</p>
              </div>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  { id: 'slow' as const, name: 'Lento', wpm: '130 p/min', desc: 'Narração pausada e clara' },
                  { id: 'normal' as const, name: 'Normal', wpm: '150 p/min', desc: 'Ritmo médio de YouTubers' },
                  { id: 'fast' as const, name: 'Rápido', wpm: '180 p/min', desc: 'Narração ágil e dinâmica' },
                ].map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => setSpeed(opt.id)}
                    className={`p-5 rounded-xl border text-left transition-all group ${
                      speed === opt.id
                        ? 'bg-primary/5 border-primary ring-2 ring-primary/20'
                        : 'bg-white border-gray-200 hover:border-primary/30 hover:bg-primary/5'
                    }`}
                  >
                    <div className={`text-sm font-black mb-0.5 ${speed === opt.id ? 'text-primary' : 'text-gray-900'}`}>
                      {opt.name}
                    </div>
                    <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">{opt.wpm}</div>
                    <div className="text-xs font-black text-gray-400">{opt.desc}</div>
                    {speed === opt.id && (
                      <div className="mt-3 flex items-center gap-1.5 text-[10px] font-black text-primary uppercase tracking-widest">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Selecionado
                      </div>
                    )}
                  </button>
                ))}
              </div>

              <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl flex items-center gap-3">
                <span className="text-base">💡</span>
                <p className="text-xs font-black text-gray-600">A maioria dos YouTubers fala entre o ritmo <span className="text-gray-900">Normal</span> e <span className="text-gray-900">Rápido</span>.</p>
              </div>
            </div>
          </div>

          {/* Script input */}
          <div className={cardClass}>
            <div className={cardHeaderClass}>
              <div>
                <h4 className="text-sm font-black text-gray-900">Seu Script</h4>
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Cole o texto para análise</p>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <textarea
                value={scriptInput}
                onChange={e => setScriptInput(e.target.value)}
                placeholder="Cole seu script aqui..."
                className={`${textareaClass} h-56`}
              />
              <div className="flex gap-2">
                <button onClick={calculateScript} className={`${btnPrimary} flex-1`}>
                  <BarChart3 className="w-4 h-4" /> Calcular Tempo Estimado
                </button>
                <button
                  onClick={() => { setScriptInput(''); setScriptStats(null); }}
                  className="p-3 bg-white hover:bg-red-50 border border-gray-200 hover:border-red-200 rounded-xl text-gray-400 hover:text-red-500 transition-all"
                  title="Limpar"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Results */}
          {scriptStats ? (
            <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-400">
              {/* Text stats */}
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Palavras', val: scriptStats.words.toLocaleString() },
                  { label: 'Caracteres', val: scriptStats.chars.toLocaleString() },
                  { label: 'Linhas', val: scriptStats.lines.toLocaleString() },
                ].map((s, i) => (
                  <div key={i} className="bg-white border border-gray-200 rounded-xl p-5 text-center hover:border-primary/30 transition-all">
                    <div className="text-2xl font-black text-gray-900 tracking-tight mb-1">{s.val}</div>
                    <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Duration cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { label: 'Velocidade Lenta', time: scriptStats.slowTime, id: 'slow' as const },
                  { label: 'Velocidade Normal', time: scriptStats.normalTime, id: 'normal' as const },
                  { label: 'Velocidade Rápida', time: scriptStats.fastTime, id: 'fast' as const },
                ].map((r) => (
                  <div
                    key={r.id}
                    className={`${cardClass} text-center p-8 transition-all ${
                      speed === r.id ? 'border-primary ring-2 ring-primary/20' : 'hover:border-primary/30'
                    }`}
                  >
                    <div className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-4">{r.label}</div>
                    <div className={`text-5xl font-black font-orbitron tracking-tighter mb-2 ${speed === r.id ? 'text-primary' : 'text-gray-900'}`}>
                      {r.time}
                    </div>
                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Minutos Estimados</div>
                    {speed === r.id && (
                      <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-black text-primary uppercase tracking-widest">
                        <CheckCircle2 className="w-3 h-3" /> Velocidade Atual
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-16 text-center border border-dashed border-gray-200 rounded-2xl bg-gray-50">
              <BarChart3 className="w-8 h-8 text-gray-300 mx-auto mb-3" />
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Cole um script e clique em calcular para ver a minutagem</p>
            </div>
          )}
        </div>
      )}

      {/* ── TOAST ── */}
      {toast && (
        <div className="fixed bottom-8 right-8 z-[200] animate-in slide-in-from-right-4 duration-300">
          <div className={`px-5 py-4 rounded-xl shadow-xl flex items-center gap-3 border ${
            toast.isError
              ? 'bg-red-50 border-red-200 text-red-700'
              : 'bg-green-50 border-green-200 text-green-700'
          }`}>
            {toast.isError
              ? <Trash2 className="w-4 h-4 shrink-0" />
              : <CheckCircle2 className="w-4 h-4 shrink-0" />}
            <span className="font-black text-sm">{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditingToolsTool;
