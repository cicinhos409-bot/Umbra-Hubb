
import React, { useState } from 'react';
import { ChevronDown, HelpCircle, MessageCircle } from 'lucide-react';

const FAQ_DATA = [
  { q: 'O que é o Umbra Hub?',            a: 'O Umbra Hub é um ecossistema de ferramentas e extensões que ajudam você a criar, automatizar e escalar conteúdos para TikTok, YouTube e outras redes usando IA.' },
  { q: 'O Umbra Hub cria vídeos automaticamente?', a: 'Não. Ele fornece prompts, roteiros, análises e automações para você usar em outras IAs que geram os vídeos.' },
  { q: 'Então como exatamente eu crio os vídeos?', a: 'Você usa os prompts e estruturas do Umbra Hub em ferramentas externas de vídeo, imagem e voz para gerar seus conteúdos rapidamente.' },
  { q: 'Preciso pagar outras IAs?',        a: 'Depende. Existem opções gratuitas e pagas. Você pode começar sem investimento e escalar conforme seus resultados.' },
  { q: 'Funciona para TikTok Shop?',       a: 'Sim. O Umbra Hub é otimizado para criar conteúdos que vendem no TikTok Shop, incluindo roteiros UGC e análise de produtos virais.' },
  { q: 'Posso usar para YouTube também?',  a: 'Sim. A plataforma é perfeita para canais dark no YouTube, incluindo Shorts e vídeos longos.' },
  { q: 'Funciona para Instagram Reels e Shorts?', a: 'Sim. Você pode adaptar os conteúdos para qualquer plataforma de vídeo curto.' },
  { q: 'Preciso aparecer nos vídeos?',     a: 'Não. Todo o sistema é focado em conteúdo "faceless" (sem aparecer).' },
  { q: 'Isso funciona para iniciantes?',   a: 'Sim. Mesmo sem experiência, você consegue seguir os modelos prontos e começar rapidamente.' },
  { q: 'E para quem já é avançado?',       a: 'Melhor ainda. Você consegue escalar produção, automatizar tarefas e testar mais ideias em menos tempo.' },
  { q: 'Quantos vídeos posso criar por dia?', a: 'Depende da sua dedicação e das ferramentas externas, mas o Umbra Hub permite escalar para dezenas de vídeos por dia.' },
  { q: 'O Umbra Hub ajuda a encontrar vídeos virais?', a: 'Sim. Você consegue analisar conteúdos que estão performando e aplicar engenharia reversa.' },
  { q: 'Dá pra encontrar produtos virais para vender?', a: 'Sim. As ferramentas ajudam a identificar tendências e oportunidades no TikTok Shop.' },
  { q: 'As extensões fazem o quê exatamente?', a: 'Elas automatizam tarefas como extração de dados, downloads, análises e organização do fluxo de criação.' },
  { q: 'Eu preciso entender de marketing?', a: 'Não. O Umbra Hub já entrega estruturas prontas que seguem o que funciona no mercado.' },
  { q: 'Quanto tempo leva para ver resultados?', a: 'Depende da consistência, mas muitos usuários começam a ver resultados nas primeiras semanas.' },
  { q: 'Posso cancelar quando quiser?',    a: 'Sim. Você pode cancelar seu plano a qualquer momento sem burocracia.' },
  { q: 'O Umbra Hub vale a pena mesmo sem gerar vídeos direto?', a: 'Sim, porque o maior diferencial está na estratégia, nos prompts e na automação — que é o que realmente gera escala e resultado.' },
  { q: 'Existe suporte ou comunidade?',    a: 'Sim. Você terá acesso a suporte e atualizações constantes com novas ferramentas e melhorias.' },
];

const FAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="py-24 bg-white relative overflow-hidden" id="faq">
      <div className="absolute inset-0 bg-grid opacity-[0.03] pointer-events-none" />

      <div className="max-w-3xl mx-auto px-6 relative z-10">

        {/* Header */}
        <header className="text-center mb-14">
          <div className="inline-flex items-center gap-2 bg-gray-100 border border-gray-200 px-4 py-2 rounded-full text-[10px] font-black text-gray-600 mb-6 uppercase tracking-widest">
            <HelpCircle className="w-3 h-3" /> Dúvidas Frequentes
          </div>
          <h2 className="text-4xl md:text-6xl font-black text-gray-900 uppercase tracking-tighter mb-4">
            Perguntas Frequentes
          </h2>
          <p className="text-gray-500 text-lg font-black">Tudo o que você precisa saber sobre o Umbra Hub.</p>
        </header>

        {/* Accordion */}
        <div className="space-y-2">
          {FAQ_DATA.map((item, i) => {
            const isOpen = openIndex === i;
            return (
              <div
                key={i}
                className={`border rounded-2xl overflow-hidden transition-all duration-300 ${
                  isOpen ? 'bg-gray-50 border-gray-300' : 'bg-white border-gray-200 hover:border-gray-300'
                }`}
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left gap-4"
                >
                  <span className={`text-base font-black tracking-tight transition-colors ${isOpen ? 'text-gray-900' : 'text-gray-700'}`}>
                    {item.q}
                  </span>
                  <ChevronDown className={`w-5 h-5 text-gray-400 shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180 text-gray-900' : ''}`} />
                </button>

                <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                  <div className="px-6 pb-6 text-gray-600 text-sm leading-relaxed font-black border-t border-gray-200 pt-4">
                    {item.a}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="mt-14 text-center">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">Ainda tem alguma dúvida?</p>
          <a
            href="https://wa.me/seu-numero"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 bg-black text-white font-black px-10 py-4 rounded-xl hover:bg-gray-900 transition-all active:scale-95 text-xs tracking-widest uppercase"
          >
            <MessageCircle className="w-4 h-4" />
            Falar com Suporte no WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
};

export default FAQ;
