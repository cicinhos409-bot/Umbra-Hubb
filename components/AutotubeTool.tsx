
import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, 
  Check, 
  X, 
  RefreshCw, 
  Copy, 
  Youtube, 
  Image as ImageIcon, 
  Palette, 
  BarChart3, 
  Zap, 
  Heart, 
  MessageCircle,
  Loader2,
  ChevronRight
} from 'lucide-react';

type Step = 'theme' | 'characterChoice' | 'characterDesc' | 'characterAction' | 'text' | 'colorChoice' | 'colorInput' | 'loading' | 'result';

const ACTION_SUGGESTIONS = [
  "Olhar chocado", "Boca aberta de surpresa", "Mãos na cabeça", "Olhos arregalados", "Expressão de medo",
  "Rosto confuso", "Cara de nojo", "Sorriso sarcástico", "Olhar desconfiado", "Expressão de raiva",
  "Gritando", "Apontando para a câmera", "Apontando algo", "Chorando", "Segurando o rosto",
  "Mão na boca", "Espanto extremo", "Olhar assustado", "Olhar incrédulo", "Sorriso malicioso",
  "Descobriu algo", "Olhar penetrante", "Olhar ameaçador", "Olhar de julgamento", "Choque total",
  "Pego no flagra", "Cara de vergonha", "Olhar triste", "Lágrimas nos olhos", "Cara de desprezo",
  "Expressão de vitória", "Sorriso provocador", "Olhar intenso", "Olhar vazio", "Perdeu tudo",
  "Olhar de ódio", "Cara de decepção", "Expressão de pânico", "Olhar desesperado", "Vai chorar",
  "Olhar calculista", "Cara de frustração", "Expressão de culpa", "Foi traído", "Olhar frio",
  "Fixo na câmera", "Cara de alerta", "Olhar nervoso", "Olhar agressivo", "Expressão dramática"
];

const TEXT_SUGGESTIONS = [
  { cat: '🔥 Choque', tags: ["URGENTE", "CHOCANTE", "PROIBIDO", "IMPOSSÍVEL", "EXPOSTO", "DESCOBERTO", "NINGUÉM SABIA", "TUDO MUDOU", "EU NÃO ACREDITO", "SEM PALAVRAS"] },
  { cat: '💔 Emocional', tags: ["VERDADE", "MENTIRA", "SEGREDO", "TRAIÇÃO", "ISSO ME DESTRUIU", "ISSO ME QUEBROU", "ISSO DÓI", "FOI TARDE DEMAIS", "ERA MENTIRA", "FOI TRAIÇÃO"] },
  { cat: '⚠️ Alerta', tags: ["CUIDADO", "ALERTA", "GRAVE", "O PIOR", "ERRADO", "FOI um erro", "NÃO ERA PRA ISSO", "ISSO ASSUSTA", "NÃO ERA PRA VER", "ISSO VAZOU"] },
  { cat: '🎯 Curiosidade', tags: ["VOCÊ NÃO SABE", "VOCÊ PRECISA VER", "VOCÊ VAI ENTENDER", "NINGUÉM PERCEBEU", "NINGUÉM CONTOU", "NUNCA IMAGINEI", "VOCÊ FOI ENGANADO", "AGORA ENTENDO", "ISSO EXPLICA TUDO", "A VERDADE"] },
  { cat: '🔚 Decisão', tags: ["CHEGA", "BASTA", "ACABOU", "FIM", "SEM VOLTA", "SEM PERDÃO", "NÃO DÁ MAIS", "EU DESISTI", "TUDO ACABOU", "FINALMENTE"] }
];

const STEP_PROGRESS: Record<Step, number> = {
  theme: 10, characterChoice: 25, characterDesc: 40, characterAction: 55,
  text: 70, colorChoice: 85, colorInput: 95, loading: 98, result: 100
};

const AutotubeTool: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<Step>('theme');
  const [payload, setPayload] = useState({
    theme: '',
    hasCharacter: false,
    character: '',
    characterAction: 'emoção intensa',
    text: 'CLICK AQUI!',
    textFormat: 'branco com contorno preto',
  });
  const [resultPrompt, setResultPrompt] = useState('');
  const [copied, setCopied] = useState(false);

  const resetApp = () => {
    setCurrentStep('theme');
    setPayload({
      theme: '',
      hasCharacter: false,
      character: '',
      characterAction: 'emoção intensa',
      text: 'CLICK AQUI!',
      textFormat: 'branco com contorno preto',
    });
    setResultPrompt('');
  };

  const handleNext = (next: Step) => {
    setCurrentStep(next);
  };

  const getRandom = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)];

  const generatePrompt = (isRegen = false) => {
    if (!isRegen) setCurrentStep('loading');

    setTimeout(() => {
      const { character, characterAction, text, textFormat, hasCharacter } = payload;

      const expressions = ['intense surprise', 'determined shock', 'curious amazement', 'powerful determination', 'dramatic realization'];
      const lightingColors = ['cool blue and deep purple', 'vibrant red and orange', 'electric cyan and magenta', 'golden yellow and warm amber', 'neon green and teal'];
      const visualEffects = [
        'subtle digital glows, floating particles, faint data streams, and cinematic textures',
        'lens flares, bokeh effects, dynamic light rays, and atmospheric haze',
        'energy particles, motion blur trails, and dramatic vignette',
        'sparkling highlights, volumetric lighting, and depth blur',
        'glitch effects, holographic overlays, and neon reflections'
      ];
      const compositions = [
        'positioned slightly off-center to the left (rule of thirds)',
        'centered with dramatic framing',
        'positioned to the right with dynamic angle',
        'slightly tilted for dramatic effect'
      ];

      const formattedText = text.split(' ').join('\n');
      const lighting = getRandom(lightingColors);
      const effects = getRandom(visualEffects);
      const expression = getRandom(expressions);
      const composition = getRandom(compositions);

      let prompt = '';
      if (hasCharacter && character) {
        prompt = `A hyper-realistic, professional YouTube thumbnail designed for maximum clicks, inspired by top-tier Behance designs. Feature a close-up of ${character}, displaying an expression of ${expression}, ${characterAction || 'showing intense emotion'}. Their face is ${composition}, ensuring no facial overlap and leaving ample space for text. The background is a highly contextual, cinematic environment with immersive details and atmospheric depth. Dramatic ${lighting} backlighting creates depth and mystery. Visual effects include ${effects}. On the side with more space, clearly legible and vertically stacked, is the 3D bold ${textFormat || 'white text with a sharp black outline'} and professional drop shadow, ensuring high contrast and impact:\n${formattedText}\nThe text is large, impactful, and free from clipping or distortion. The overall visual tone is intense and curious, with vibrant colors and high contrast to highlight the main subject and attract instant clicks. No additional text, letters, logos, or watermarks are present. The composition is clean with a clear focal point. Style: professional YouTube thumbnail, photorealistic, 16:9 aspect ratio, attention-grabbing, click-worthy.`;
      } else {
        prompt = `A hyper-realistic, professional YouTube thumbnail designed for maximum clicks, inspired by top-tier Behance designs. The scene features stunning visual detail and cinematic quality with an immersive atmosphere. The background is highly contextual, with dramatic ${lighting} lighting creating depth and atmosphere. Visual effects include ${effects}. Prominently displayed with clear legibility is the 3D bold ${textFormat || 'white text with a sharp black outline'} and professional drop shadow, ensuring high contrast and impact:\n${formattedText}\nThe text is large, impactful, positioned for maximum visibility, and free from clipping or distortion. The overall visual tone is intense and captivating, with vibrant colors and high contrast to attract instant clicks. No additional text, letters, logos, or watermarks are present. The composition is clean with a clear focal point. Style: professional YouTube thumbnail, photorealistic, 16:9 aspect ratio, attention-grabbing, click-worthy.`;
      }

      setResultPrompt(prompt);
      if (!isRegen) setCurrentStep('result');
    }, isRegen ? 500 : 1500);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(resultPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="font-rajdhani space-y-8 animate-in fade-in duration-700 pb-20 max-w-lg mx-auto">
      {/* HEADER */}
      <header className="text-center relative">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-brand-pink/10 rounded-[28px] mb-6 shadow-2xl shadow-brand-pink/10 ring-1 ring-brand-pink/20">
          <ImageIcon className="w-10 h-10 text-brand-pink" />
        </div>
        <h1 className="text-4xl font-black tracking-tighter mb-2 bg-gradient-to-r from-brand-pink to-brand-purple bg-clip-text text-transparent uppercase font-bebas">
          Umbra <span className="text-white">AutoTube</span>
        </h1>
        <p className="text-gray-500 font-medium">Design • Thumbnail Intelligent Engine</p>
        <div className="h-px w-32 bg-gradient-to-r from-transparent via-brand-pink/30 to-transparent mx-auto mt-6" />
      </header>

      {/* PROGRESS */}
      <div className="relative h-1 bg-white/5 rounded-full overflow-hidden">
        <div 
          className="absolute top-0 left-0 h-full bg-brand-pink transition-all duration-500 shadow-[0_0_10px_rgba(236,72,153,0.5)]" 
          style={{ width: `${STEP_PROGRESS[currentStep]}%` }} 
        />
      </div>

      <div className="bg-background-mid border border-white/5 rounded-[40px] p-8 shadow-2xl space-y-8 min-h-[400px] flex flex-col">
        
        {/* STEP 1: THEME */}
        {currentStep === 'theme' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-2">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-full bg-brand-pink flex items-center justify-center font-bold text-xs">1</div>
              <h2 className="font-bold text-lg text-white">Qual o tema do seu vídeo?</h2>
            </div>
            <div className="flex gap-2">
              <input 
                type="text"
                placeholder="Ex: Mistérios de Marte"
                className="flex-1 bg-background-deep border border-white/10 rounded-2xl p-4 text-sm font-medium focus:border-brand-pink outline-none transition-all"
                value={payload.theme}
                onChange={e => setPayload({...payload, theme: e.target.value})}
                onKeyDown={e => e.key === 'Enter' && handleNext('characterChoice')}
              />
              <button 
                onClick={() => handleNext('characterChoice')}
                className="w-12 h-12 bg-brand-pink text-background-deep rounded-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
              >
                <ArrowRight className="w-6 h-6" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-8">
              <div className="p-4 bg-white/5 border border-white/5 rounded-2xl text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-relaxed">
                <BarChart3 className="w-4 h-4 mb-2 text-brand-pink" /> Alta Conversão
              </div>
              <div className="p-4 bg-white/5 border border-white/5 rounded-2xl text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-relaxed">
                <Palette className="w-4 h-4 mb-2 text-brand-purple" /> Design Behance
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: CHARACTER CHOICE */}
        {currentStep === 'characterChoice' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-2">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-full bg-brand-pink flex items-center justify-center font-bold text-xs">2</div>
              <h2 className="font-bold text-lg text-white">Deseja um personagem na capa?</h2>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed px-12">Personagens com emoções fortes aumentam o CTR drasticamente em canais Dark.</p>
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => { setPayload({...payload, hasCharacter: true}); handleNext('characterDesc'); }}
                className="py-12 bg-brand-pink/10 border border-brand-pink/20 rounded-3xl text-brand-pink font-bold flex flex-col items-center justify-center gap-3 hover:bg-brand-pink/20 transition-all"
              >
                <Check className="w-8 h-8" />
                <span className="text-xs uppercase tracking-widest">Sim</span>
              </button>
              <button 
                onClick={() => { setPayload({...payload, hasCharacter: false}); handleNext('text'); }}
                className="py-12 bg-white/5 border border-white/5 rounded-3xl text-gray-500 font-bold flex flex-col items-center justify-center gap-3 hover:bg-white/10 transition-all"
              >
                <X className="w-8 h-8" />
                <span className="text-xs uppercase tracking-widest">Não</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: CHARACTER DESC */}
        {currentStep === 'characterDesc' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-2">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-full bg-brand-pink flex items-center justify-center font-bold text-xs">3</div>
              <h2 className="font-bold text-lg text-white">Descreva o personagem</h2>
            </div>
            <div className="flex gap-2">
              <input 
                type="text"
                placeholder="Ex: Um explorador espacial sujo de terra"
                className="flex-1 bg-background-deep border border-white/10 rounded-2xl p-4 text-sm font-medium focus:border-brand-pink outline-none transition-all"
                value={payload.character}
                onChange={e => setPayload({...payload, character: e.target.value})}
                onKeyDown={e => e.key === 'Enter' && handleNext('characterAction')}
              />
              <button 
                onClick={() => handleNext('characterAction')}
                className="w-12 h-12 bg-brand-pink text-background-deep rounded-2xl flex items-center justify-center"
              >
                <ArrowRight className="w-6 h-6" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: CHARACTER ACTION */}
        {currentStep === 'characterAction' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-2 flex-1 flex flex-col">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-full bg-brand-pink flex items-center justify-center font-bold text-xs">4</div>
              <h2 className="font-bold text-lg text-white">Qual a ação ou emoção?</h2>
            </div>
            <div className="flex-1 overflow-y-auto max-h-64 custom-scrollbar pr-2 flex flex-wrap gap-2">
              {ACTION_SUGGESTIONS.map(s => (
                <button 
                  key={s} 
                  onClick={() => setPayload({...payload, characterAction: s})}
                  className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase border transition-all ${payload.characterAction === s ? 'bg-brand-pink border-brand-pink text-background-deep shadow-lg shadow-brand-pink/20' : 'bg-white/5 border-white/5 text-gray-500 hover:border-brand-pink/40'}`}
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="flex gap-2 pt-4 border-t border-white/5">
              <input 
                type="text"
                placeholder="Customizar emoção..."
                className="flex-1 bg-background-deep border border-white/10 rounded-2xl p-4 text-sm font-medium focus:border-brand-pink outline-none"
                value={payload.characterAction}
                onChange={e => setPayload({...payload, characterAction: e.target.value})}
              />
              <button onClick={() => handleNext('text')} className="w-12 h-12 bg-brand-pink text-background-deep rounded-2xl flex items-center justify-center"><ArrowRight className="w-6 h-6" /></button>
            </div>
          </div>
        )}

        {/* STEP 5: TEXT */}
        {currentStep === 'text' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-2 flex-1 flex flex-col">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-full bg-brand-pink flex items-center justify-center font-bold text-xs">5</div>
              <h2 className="font-bold text-lg text-white">Texto da Thumbnail</h2>
            </div>
            <div className="flex-1 overflow-y-auto max-h-64 custom-scrollbar pr-2 space-y-6">
              {TEXT_SUGGESTIONS.map(group => (
                <div key={group.cat} className="space-y-3">
                   <h4 className="text-[10px] font-black text-gray-700 uppercase tracking-widest">{group.cat}</h4>
                   <div className="flex flex-wrap gap-2">
                     {group.tags.map(t => (
                       <button 
                        key={t}
                        onClick={() => setPayload({...payload, text: t})}
                        className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase border transition-all ${payload.text === t ? 'bg-brand-purple border-brand-purple text-white shadow-lg shadow-brand-purple/20' : 'bg-white/5 border-white/5 text-gray-500 hover:border-brand-purple/40'}`}
                       >
                         {t}
                       </button>
                     ))}
                   </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2 pt-4 border-t border-white/5">
              <input 
                type="text"
                placeholder="Ex: URGENTE!"
                className="flex-1 bg-background-deep border border-white/10 rounded-2xl p-4 text-sm font-medium focus:border-brand-pink outline-none"
                value={payload.text}
                onChange={e => setPayload({...payload, text: e.target.value.toUpperCase()})}
              />
              <button onClick={() => handleNext('colorChoice')} className="w-12 h-12 bg-brand-pink text-background-deep rounded-2xl flex items-center justify-center"><ArrowRight className="w-6 h-6" /></button>
            </div>
          </div>
        )}

        {/* STEP 6: COLOR CHOICE */}
        {currentStep === 'colorChoice' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-2">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-full bg-brand-pink flex items-center justify-center font-bold text-xs">6</div>
              <h2 className="font-bold text-lg text-white">Customizar cor do texto?</h2>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <button 
                onClick={() => handleNext('colorInput')}
                className="p-6 bg-brand-purple/10 border border-brand-purple/20 rounded-3xl text-brand-purple font-bold flex items-center justify-between group hover:bg-brand-purple/20 transition-all"
              >
                <div className="flex items-center gap-4">
                  <Palette className="w-6 h-6" />
                  <span className="text-xs uppercase tracking-widest">Sim, quero escolher</span>
                </div>
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button 
                onClick={() => { setPayload({...payload, textFormat: '3D branco com contorno preto'}); generatePrompt(); }}
                className="p-6 bg-white/5 border border-white/5 rounded-3xl text-gray-500 font-bold flex items-center justify-between group hover:bg-white/10 transition-all"
              >
                <div className="flex items-center gap-4">
                  <Check className="w-6 h-6" />
                  <span className="text-xs uppercase tracking-widest">Usar padrão (B&W)</span>
                </div>
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 7: COLOR INPUT */}
        {currentStep === 'colorInput' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-2">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-full bg-brand-pink flex items-center justify-center font-bold text-xs">7</div>
              <h2 className="font-bold text-lg text-white">Qual a combinação de cores?</h2>
            </div>
            <div className="flex gap-2">
              <input 
                type="text"
                placeholder="Ex: Amarelo vibrante com contorno preto"
                className="flex-1 bg-background-deep border border-white/10 rounded-2xl p-4 text-sm font-medium focus:border-brand-pink outline-none"
                value={payload.textFormat.replace('3D negrito, ', '')}
                onChange={e => setPayload({...payload, textFormat: '3D negrito, ' + e.target.value})}
                onKeyDown={e => e.key === 'Enter' && generatePrompt()}
              />
              <button onClick={() => generatePrompt()} className="w-12 h-12 bg-brand-pink text-background-deep rounded-2xl flex items-center justify-center"><ArrowRight className="w-6 h-6" /></button>
            </div>
          </div>
        )}

        {/* STEP: LOADING */}
        {currentStep === 'loading' && (
          <div className="flex-1 flex flex-col items-center justify-center space-y-8 py-20 animate-in fade-in">
             <div className="relative">
                <div className="w-20 h-20 border-4 border-white/5 border-t-brand-pink rounded-full animate-spin" />
                <Zap className="absolute inset-0 m-auto w-8 h-8 text-brand-pink animate-pulse" />
             </div>
             <div className="text-center">
                <h3 className="font-bold text-white mb-2">Construindo Prompt</h3>
                <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.3em]">Otimizando para IA de Imagem...</p>
             </div>
          </div>
        )}

        {/* STEP: RESULT */}
        {currentStep === 'result' && (
          <div className="space-y-6 animate-in zoom-in-95 duration-500 flex-1 flex flex-col">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-brand-green/10 rounded-xl flex items-center justify-center text-brand-green shadow-xl"><Check className="w-5 h-5" /></div>
                <h2 className="font-black text-xl tracking-tighter">Prompt Gerado!</h2>
              </div>
            </div>
            
            <div className="flex-1 relative group">
              <textarea 
                readOnly
                value={resultPrompt}
                className="w-full h-64 bg-background-deep/50 border border-white/10 rounded-[32px] p-6 text-xs font-mono leading-relaxed text-gray-400 focus:outline-none resize-none custom-scrollbar"
              />
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-pink/5 blur-[60px] -z-10 group-hover:bg-brand-pink/10 transition-all" />
            </div>

            <div className="space-y-3">
              <button 
                onClick={handleCopy}
                className={`w-full py-5 rounded-2xl font-orbitron text-xs font-black tracking-[0.3em] uppercase flex items-center justify-center gap-3 transition-all ${copied ? 'bg-brand-green text-background-deep' : 'bg-brand-pink text-white shadow-xl shadow-brand-pink/20 hover:scale-[1.02]'}`}
              >
                {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                {copied ? 'Copiado!' : 'Copiar Prompt'}
              </button>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => generatePrompt(true)} className="py-4 bg-white/5 border border-white/5 text-gray-500 rounded-2xl font-bold text-[10px] uppercase tracking-widest hover:bg-white/10 flex items-center justify-center gap-2"><RefreshCw className="w-4 h-4" /> Variação</button>
                <button onClick={resetApp} className="py-4 bg-white/5 border border-white/5 text-gray-500 rounded-2xl font-bold text-[10px] uppercase tracking-widest hover:bg-white/10 flex items-center justify-center gap-2">Novo Prompt</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* FOOTER LINKS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <a href="https://www.youtube.com/channel/UC3ljRCyGc_Atq6ld8iTVYfw" target="_blank" rel="noopener noreferrer" className="p-4 bg-background-mid border border-white/5 rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-brand-purple/40 transition-all group">
          <Youtube className="w-5 h-5 text-gray-600 group-hover:text-brand-purple transition-colors" />
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-600">Canal Umbra</span>
        </a>
        <a href="https://livepix.gg/cicerosantos" target="_blank" rel="noopener noreferrer" className="p-4 bg-background-mid border border-white/5 rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-brand-pink/40 transition-all group">
          <Heart className="w-5 h-5 text-gray-600 group-hover:text-brand-pink transition-colors" />
          <span className="text-[10px) font-black uppercase tracking-widest text-gray-600">Apoiar</span>
        </a>
        <a href="https://wa.me/message/EF4DJTI6JTOTH1" target="_blank" rel="noopener noreferrer" className="p-4 bg-background-mid border border-white/5 rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-brand-cyan/40 transition-all group">
          <MessageCircle className="w-5 h-5 text-gray-600 group-hover:text-brand-cyan transition-colors" />
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-600">Suporte</span>
        </a>
      </div>
    </div>
  );
};

export default AutotubeTool;
