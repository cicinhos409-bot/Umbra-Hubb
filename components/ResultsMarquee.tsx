import React from "react";
import { ArrowRight } from "lucide-react";

export default function ResultsMarquee() {
  const results = [
    { img: "result1.png", label: "63K views em 2 dias",                sub: "+1,5 mil inscritos" },
    { img: "result2.png", label: "2.833.701 em 30 dias",               sub: "R$ 10.168 de receita" },
    { img: "result3.png", label: "890.173 views em 15 dias",           sub: "+15,7 mil inscritos" },
    { img: "result4.png", label: "2.437.134 views em 28 dias (2 Canal)", sub: "20.853 em tempo real" },
  ];

  const doubled = [...results, ...results];

  return (
    <section id="resultados" className="py-24 bg-white overflow-hidden relative">
      <style>{`
        .mrq-track {
          display: flex; gap: 20px;
          width: max-content;
          animation: marquee 32s linear infinite;
        }
        .mrq-track:hover { animation-play-state: paused; }
        @keyframes marquee {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .mrq-fade-left {
          position: absolute; left: 0; top: 0; bottom: 0;
          width: 140px; z-index: 2; pointer-events: none;
          background: linear-gradient(to right, #ffffff 0%, transparent 100%);
        }
        .mrq-fade-right {
          position: absolute; right: 0; top: 0; bottom: 0;
          width: 140px; z-index: 2; pointer-events: none;
          background: linear-gradient(to left, #ffffff 0%, transparent 100%);
        }
      `}</style>

      {/* Header */}
      <div className="text-center mb-14 px-4">
        <div className="inline-flex items-center gap-2 bg-gray-100 border border-gray-200 px-4 py-2 rounded-full text-[10px] font-black text-gray-600 mb-6 uppercase tracking-widest">
          ✦ Resultados Reais
        </div>
        <h2 className="text-4xl md:text-6xl font-black text-gray-900 tracking-tighter mb-4 leading-[0.95]">
          Números que falam<br />por si só
        </h2>
        <p className="text-gray-500 text-base font-black">
          Canais gerenciados com o <span className="text-gray-900 italic">UmbraHub</span> — sem aparecer, sem complicar.
        </p>
      </div>

      {/* Marquee */}
      <div className="relative">
        <div className="mrq-fade-left" />
        <div className="mrq-fade-right" />
        <div style={{ display: 'flex', overflow: 'hidden' }}>
          <div className="mrq-track">
            {doubled.map((r, i) => (
              <div
                key={i}
                className="flex-shrink-0 w-[320px] bg-white border border-gray-200 rounded-2xl overflow-hidden hover:-translate-y-1 hover:border-gray-400 hover:shadow-md transition-all duration-300 cursor-default"
              >
                <div className="w-full h-[190px] bg-gray-100 overflow-hidden">
                  <img src={r.img} alt={r.label} className="w-full h-full object-cover object-top hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="p-4 flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-gray-900 shrink-0 animate-pulse" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-gray-900 truncate">{r.label}</p>
                    <p className="text-[11px] font-black text-gray-500">{r.sub}</p>
                  </div>
                  <span className="shrink-0 text-[9px] font-black uppercase tracking-widest bg-gray-100 border border-gray-200 text-gray-600 px-2.5 py-1 rounded-lg">
                    REAL
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="text-center mt-14 px-4">
        <a
          href="https://pay.cakto.com.br/3dko6xr_769683"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-3 bg-black hover:bg-gray-900 text-white font-black text-sm uppercase tracking-widest px-10 py-5 rounded-2xl transition-all active:scale-95 shadow-sm"
        >
          Quero o mesmo resultado <ArrowRight className="w-4 h-4" />
        </a>
      </div>
    </section>
  );
}
