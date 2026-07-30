
import { useState } from "react";
import { Clapperboard, Zap, BarChart3, ArrowRight } from "lucide-react";

const cards = [
  {
    num: "01",
    Icon: Clapperboard,
    title: "Produção Completa",
    desc: "Scripts, vozes, thumbnails e prompts de vídeo — produza um canal completo com IA sem aparecer na câmera.",
    items: ["Scripts com IA", "Voz Neural Google TTS", "Thumbnails & Prompts", "Umbra Prompt Vault"],
  },
  {
    num: "02",
    Icon: Zap,
    title: "Escala em Lote",
    desc: "Traduza, processe e gere dezenas de vídeos de uma vez. Pare de trabalhar um por um e multiplique sua saída.",
    items: ["Turbo Hub", "Processamento em massa", "Umbra Screen Recorder", "Download em lote"],
  },
  {
    num: "03",
    Icon: BarChart3,
    title: "Análise Viral",
    desc: "Descubra o que está viralizando agora, faça engenharia reversa e replique o sucesso dos maiores canais.",
    items: ["YouTube Hub", "Outliers & Keywords", "Busca de tendências", "Engenharia reversa"],
  },
];

const stats = [
  { value: "15+", label: "Canais monetizados" },
  { value: "5+",  label: "Perfis TikTok Shop" },
  { value: "20+", label: "Ferramentas IA" },
  { value: "10k+",label: "Vídeos gerados" },
];

export default function WhyUmbra() {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <section className="py-24 bg-white relative overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-[0.04] pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 relative z-10">

        {/* Header */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 bg-gray-100 border border-gray-200 px-4 py-2 rounded-full text-[10px] font-black text-gray-600 mb-6 uppercase tracking-widest">
            ✦ Por que UmbraHub?
          </div>
          <h2 className="text-4xl md:text-6xl font-black text-gray-900 tracking-tighter mb-4 leading-[0.95]">
            Tudo que você precisa<br />
            <span className="italic text-gray-400">para crescer rápido</span>
          </h2>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 border border-gray-200 rounded-2xl overflow-hidden mb-14">
          {stats.map((s, i) => (
            <div
              key={i}
              className={`py-8 px-6 text-center bg-white ${i < 3 ? 'border-r border-gray-100' : ''}`}
            >
              <div className="text-3xl font-black text-gray-900 tracking-tight mb-1">{s.value}</div>
              <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          {cards.map((c, i) => {
            const isHovered = hovered === i;
            return (
              <div
                key={i}
                className={`relative bg-white border rounded-2xl overflow-hidden transition-all duration-300 cursor-default ${isHovered ? 'border-gray-400 shadow-md -translate-y-2' : 'border-gray-200'}`}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
              >
                {/* Large number watermark */}
                <span className="absolute top-4 right-5 text-[72px] font-black text-gray-900 opacity-[0.04] leading-none pointer-events-none select-none">
                  {c.num}
                </span>

                <div className="p-8">
                  {/* Icon */}
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 border transition-all duration-300 ${isHovered ? 'bg-gray-900 border-gray-900' : 'bg-gray-100 border-gray-200'}`}>
                    <c.Icon className={`w-5 h-5 transition-colors duration-300 ${isHovered ? 'text-white' : 'text-gray-700'}`} />
                  </div>

                  <h3 className="text-xl font-black text-gray-900 mb-2 tracking-tight">{c.title}</h3>
                  <p className="text-sm text-gray-500 font-black leading-relaxed mb-6">{c.desc}</p>

                  <div className="h-px bg-gray-100 mb-5" />

                  <ul className="space-y-2.5">
                    {c.items.map((item, j) => (
                      <li key={j} className="flex items-center gap-3 text-sm font-black text-gray-600">
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 transition-colors duration-300 ${isHovered ? 'bg-gray-900' : 'bg-gray-300'}`} />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA bar */}
        <div className="bg-gray-50 border border-gray-200 rounded-2xl px-8 py-7 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <p className="text-base font-black text-gray-900 mb-1">
              Mais de <strong>500 criadores</strong> já estão escalando com o UmbraHub.
            </p>
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">
              Novas ferramentas adicionadas toda semana — sem custo extra.
            </p>
          </div>
          <a
            href="#precos"
            onClick={(e) => { e.preventDefault(); document.getElementById('precos')?.scrollIntoView({ behavior: 'smooth' }); }}
            className="inline-flex items-center gap-2 bg-black hover:bg-gray-900 text-white font-black text-xs uppercase tracking-widest px-8 py-4 rounded-xl transition-all active:scale-95 whitespace-nowrap"
          >
            Ver planos <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </section>
  );
}
