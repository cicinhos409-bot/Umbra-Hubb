import React, { useState, useEffect, useRef } from "react";
import { X, Check, ArrowRight } from "lucide-react";

const before = [
  { text: "Várias assinaturas caras que eu nem precisava pagar" },
  { text: "7 horas pra produzir 1 vídeo só" },
  { text: "Horas pesquisando banco de vídeos na mão" },
  { text: "Sem ferramenta de gravação de tela — travava tudo" },
  { text: "Horas perdidas só editando e narrando" },
  { text: "Sem banco de imagens — buscava tudo separado" },
  { text: "Não sabia quais ferramentas usar pro canal dark" },
  { text: "Sem agentes, sem prompts salvos, sem sequência" },
];

const after = [
  { text: "7 horas viraram 4h30 — quase metade do tempo" },
  { text: "Monetizando mais canais ao mesmo tempo" },
  { text: "Banco de vídeos dentro da plataforma" },
  { text: "Gravação de tela integrada, sem travar nada" },
  { text: "Agentes prontos e automação no ChatGPT" },
  { text: "Download de imagens em lote com 1 clique" },
  { text: "Download de vídeos muito mais rápido" },
  { text: "Processo produtivo organizado e escalável" },
];

export default function BeforeAfter() {
  const [active, setActive] = useState<"before" | "after">("before");
  const [revealed, setRevealed] = useState<number[]>([]);
  const [hasEntered, setHasEntered] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !hasEntered) {
          setHasEntered(true);
          before.forEach((_, i) => setTimeout(() => setRevealed((p) => [...p, i]), i * 90));
        }
      },
      { threshold: 0.15 }
    );
    if (sectionRef.current) obs.observe(sectionRef.current);
    return () => obs.disconnect();
  }, [hasEntered]);

  const switchTab = (tab: "before" | "after") => {
    setActive(tab);
    setRevealed([]);
    const items = tab === "before" ? before : after;
    items.forEach((_, i) => setTimeout(() => setRevealed((p) => [...p, i]), i * 80));
  };

  const currentItems = active === "before" ? before : after;
  const isBefore = active === "before";

  return (
    <section ref={sectionRef} className="py-24 bg-white relative overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-[0.03] pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 relative z-10">

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-5">
            ✦ História Real do Fundador
          </div>
          <h2 className="text-4xl md:text-6xl font-black text-gray-900 tracking-tighter leading-[0.95]">
            A vida do Umbra<br />
            <span className={`italic ${isBefore ? 'text-gray-400' : 'text-gray-900'}`}>
              {isBefore ? "antes" : "depois"}
            </span>
          </h2>
        </div>

        {/* Tabs */}
        <div className="flex justify-center mb-10">
          <div className="flex gap-1 bg-gray-100 border border-gray-200 rounded-xl p-1">
            <button
              onClick={() => switchTab("before")}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-black uppercase tracking-widest transition-all duration-300 ${
                isBefore
                  ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
                  : 'text-gray-400 hover:text-gray-700'
              }`}
            >
              <X className="w-3.5 h-3.5" /> Sem UmbraHub
            </button>
            <button
              onClick={() => switchTab("after")}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-black uppercase tracking-widest transition-all duration-300 ${
                !isBefore
                  ? 'bg-black text-white shadow-sm'
                  : 'text-gray-400 hover:text-gray-700'
              }`}
            >
              <Check className="w-3.5 h-3.5" /> Com UmbraHub
            </button>
          </div>
        </div>

        {/* Items grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-14">
          {currentItems.map((item, i) => (
            <div
              key={`${active}-${i}`}
              className={`flex items-center gap-4 p-4 rounded-xl border transition-all duration-300 ${
                revealed.includes(i) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              } ${isBefore ? 'bg-gray-50 border-gray-200' : 'bg-gray-900 border-gray-900'}`}
              style={{ transitionDelay: `${i * 30}ms` }}
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isBefore ? 'bg-gray-200' : 'bg-white/10'}`}>
                {isBefore
                  ? <X className="w-4 h-4 text-gray-500" />
                  : <Check className="w-4 h-4 text-white" strokeWidth={3} />
                }
              </div>
              <span className={`text-sm font-black leading-snug ${isBefore ? 'text-gray-700' : 'text-white'}`}>
                {item.text}
              </span>
            </div>
          ))}
        </div>

        {/* Quote card */}
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8 md:p-10 relative">
          <div className="absolute top-6 left-8 text-6xl text-gray-200 font-serif leading-none select-none">"</div>
          <p className="text-lg font-black text-gray-700 leading-relaxed italic pt-6 mb-6">
            Um vídeo que demorava <strong className="text-gray-900 not-italic">7 horas</strong>, passei a fazer em{" "}
            <strong className="text-gray-900 not-italic">4h30</strong>. Comecei a monetizar mais canais, otimizei todo meu processo
            e parei de pagar várias assinaturas caras. Agora tenho{" "}
            <strong className="text-gray-900 not-italic">tudo que preciso num só lugar.</strong>
          </p>
          <div className="flex items-center justify-between gap-4 pt-6 border-t border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center font-black text-white text-base">U</div>
              <div>
                <p className="text-sm font-black text-gray-900">Umbra</p>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Criador Faceless e fundador do UmbraHub</p>
              </div>
            </div>
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <span key={i} className="text-gray-900 text-lg">★</span>
              ))}
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
