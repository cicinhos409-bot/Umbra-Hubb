
import React, { useState, useRef } from 'react';
import { Play, X, ChevronLeft, ChevronRight } from 'lucide-react';

interface StoryCard {
  id: string;
  title: string;
  sub: string;
  driveId: string;
}

const DARK_STORIES: StoryCard[] = [
  { id: 'd1', title: 'DOCUMENTARY 1', sub: 'Documentário · 8:58',  driveId: '1FzKa6URsMwz6mcyTcjtTFGHwulLfrfZJ' },
  { id: 'd2', title: 'DOCUMENTARY 2', sub: 'Documentário · 14:41', driveId: '1CnW6Ex8AKcQm9iu9lF7mNEKi9HIfosKx' },
  { id: 'd3', title: 'DOCUMENTARY 3', sub: 'Documentário · 33:03', driveId: '1zTX-jYOQI99oy0X5vTamTwccscwt6Sdq' },
  { id: 'd4', title: 'DOCUMENTARY 4', sub: 'Documentário · 15:42', driveId: '1k1DCPPUrT4mvquP5rleq3TNU1JkooqWz' },
  { id: 'd5', title: 'DOCUMENTARY 5', sub: 'Documentário · 18:50', driveId: '1bCxTfhuS_BiaXFhuIe_3nS5kH9rkbTWa' },
  { id: 'd6', title: 'EDUCATIVO',     sub: 'Educativo · 12:46',    driveId: '1Ag3teuuak-ScCuWmPvw4bh5vXk-aGNmC' },
  { id: 'd7', title: 'EDUCATIVO 1',   sub: 'Educativo · 34:40',    driveId: '1SXkQjKLElWP89wYF69E_5gTMrZ6m1iYX' },
  { id: 'd8', title: 'EDUCATIVO 2',   sub: 'Educativo · 19:02',    driveId: '1cSYJWa2pgFIaq_GtizR7K1LrNAKxpHTZ' },
  { id: 'd9', title: 'EDUCATIVO 3',   sub: 'Educativo · 27:48',    driveId: '1nkcEDJT1qu6O-eq5V8nEA_uyUf3OSQN3' },
];

const REELS_STORIES: StoryCard[] = [
  { id: 'r1', title: 'LAGOSTAS SÃO IMORTAIS?', sub: 'Short · 1:08', driveId: '1hAyDJUgwW0316nJbKkD3_RqEqNcwk2Wg' },
  { id: 'r2', title: 'ABACAXI ME TRAINDO NA ACADEMIA??', sub: 'Short · 1:15', driveId: '14U_jFGtp7L46IgNOLsnzT07c9GoF6n1d' },
  { id: 'r3', title: 'O QUE ACONTECE COM O SEU CORPO SE VC NUNCA MAIS COMER AÇUCAR?', sub: 'Short · 1:04', driveId: '1FpF_KBAfE5y86c7FSCWwRAnxOOfmY7K5' },
  { id: 'r4', title: 'O REI DO SASHIMI', sub: 'Short · 1:00', driveId: '1WSlvjuPWZ1EUNZHp73JKEs__Fc-Jchgt' },
  { id: 'r5', title: 'VOCÊ JÁ VIU UM CAVALO QUE PARECE SER FEITO DE OURO?', sub: 'Short · 1:01', driveId: '1fJ03qXIIEMjv-gADTA8UucbpOzs_sMBZ' },
  { id: 'r6', title: 'PORQUE OS DANÇARINOS HOMENS DE SABRINA CARPENTER RECEBEM MAIS DE 500MIL DÓLARES', sub: 'Short · 1:07', driveId: '1hq0dg1WulDGEPf-JZLg0Hssxy3S08RXG' },
  { id: 'r7', title: 'TREND', sub: 'Short · 0:10', driveId: '18rGVxHlvlInTjTcZBKrayKWgD1c-tdnM' },
  { id: 'r8', title: 'VÍDEO ENGRAÇADO DE ANIMAIS', sub: 'Short · 1:01', driveId: '1LmSdPCA26wszgxjSVdKSGRoIDoF-Iugn' },
  { id: 'r9', title: "VOCÊ MORARIA EM BAIXO D'ÁGUA POR 5 MILHÕES?", sub: 'Short · 1:07', driveId: '1vv7cppJ0tdwFrY1tv5oEgfGdVcUrCVfI' },
];

const TIKTOK_STORIES: StoryCard[] = [
  { id: 't1', title: 'MULHER APRESENTANDO O PRODUTO VIRAL', sub: 'TikTok Shop · 0:29', driveId: '18h2h69NABPgXs7QZig0bX4zMc6QR182l' },
  { id: 't2', title: 'BERMUDA DE COMPRESSÃO 2 EM 1 DRY-FIT COM ELASTANO', sub: 'TikTok Shop · 0:21', driveId: '1Bnbo7u3Y0t_Ny4lWsoquVOgzfj7eQE5i' },
  { id: 't3', title: 'BODY', sub: 'TikTok Shop · 0:15', driveId: '1SbIf1N4327GQt3wLBzQ75vnj_fFbA7Lx' },
  { id: 't4', title: 'BOLSA ESTILO DORAMA', sub: 'TikTok Shop · 0:24', driveId: '1yiS3qg5MLshw00KS-iC3tl5LS5VuqTYc' },
  { id: 't5', title: 'CARRINHO DE FERRO MINIATURA 1:36 FRICÇÃO', sub: 'TikTok Shop · 0:29', driveId: '1JLxTxg_k8kwxuPXj_lIWFrozxD4GzOk0' },
  { id: 't6', title: 'CONJUNTO CAMISA + CALÇÃO', sub: 'TikTok Shop · 0:13', driveId: '1IcjimsKAlZNkphC6HdcKM8vnWQgg3CRm' },
  { id: 't7', title: 'KIT CAMA', sub: 'TikTok Shop · 0:16', driveId: '18o4IMGxpjw4mBjQHn9OrNxavQs3y7dM_' },
  { id: 't8', title: 'MOCHILA TÉRMICA IMPERMEÁVEL', sub: 'TikTok Shop · 0:24', driveId: '1FUbgbZSySR6bD55tzW4SvQgxU5uFtMyt' },
  { id: 't9', title: 'VESTIDO GOLA POLO TUBINHO FEMININO', sub: 'TikTok Shop · 0:16', driveId: '1mt48hfwii59XvNckP5xZt6DOIUaCXdF1' },
];

const sections = [
  { key: 'dark'   as const, label: '📺 Canais Dark · 16:9',    stories: DARK_STORIES,   isWide: true  },
  { key: 'reels'  as const, label: '⚡ Shorts/Reels · 9:16',   stories: REELS_STORIES,  isWide: false },
  { key: 'tiktok' as const, label: '🛒 TikTok Shop · 9:16',    stories: TIKTOK_STORIES, isWide: false },
];

const UmbraStories: React.FC = () => {
  const [modalData, setModalData] = useState<{ story: StoryCard; isWide: boolean } | null>(null);

  const scrollRefs = {
    dark:   useRef<HTMLDivElement>(null),
    reels:  useRef<HTMLDivElement>(null),
    tiktok: useRef<HTMLDivElement>(null),
  };

  const scroll = (key: 'dark' | 'reels' | 'tiktok', dir: number) => {
    const ref = scrollRefs[key].current;
    if (ref) ref.scrollBy({ left: dir * ref.offsetWidth * 0.8, behavior: 'smooth' });
  };

  const getDriveUrl = (id: string) => `https://drive.google.com/file/d/${id}/preview`;

  return (
    <section id="ai-stories" className="py-16 md:py-24 bg-white relative overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-[0.03] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10">

        {/* Header */}
        <header className="text-center mb-12 md:mb-16">
          <div className="inline-block px-4 py-2 rounded-full bg-gray-100 border border-gray-200 text-gray-600 text-[10px] font-black tracking-widest uppercase mb-6">
            ✦ Umbra Hub · AI Stories
          </div>
          <h2 className="text-4xl md:text-7xl font-black text-gray-900 mb-4 uppercase tracking-tighter leading-none">
            Veja o que é<br />
            <span className="italic text-gray-400">possível criar</span>
          </h2>
        </header>

        {/* Story sections */}
        {sections.map(({ key, label, stories, isWide }) => (
          <div key={key} className="mb-16 md:mb-20">
            {/* Section label */}
            <div className="flex items-center gap-4 mb-6">
              <span className="px-4 py-1.5 rounded-full bg-gray-100 border border-gray-200 text-gray-700 text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
                {label}
              </span>
              <div className="flex-1 h-px bg-gray-200" />
              {key === 'dark' && (
                <p className="hidden md:block text-[10px] text-gray-400 font-black italic max-w-xs text-right">
                  Qualidade pode oscilar pelo player do Drive. São demonstrações reais.
                </p>
              )}
            </div>

            {/* Scroll row */}
            <div className="relative group">
              <div
                ref={scrollRefs[key]}
                className="flex gap-4 md:gap-5 overflow-x-auto snap-x snap-mandatory pb-4 px-1"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {stories.map((story) => (
                  <div
                    key={story.id}
                    className={`flex-shrink-0 snap-start ${isWide ? 'w-[280px] md:w-[calc(33.333%-14px)]' : 'w-[180px] md:w-[calc(25%-15px)]'}`}
                  >
                    <div
                      className="relative rounded-2xl overflow-hidden border border-gray-200 bg-gray-50 group/card cursor-pointer hover:border-gray-400 hover:shadow-sm transition-all duration-300"
                      onClick={() => setModalData({ story, isWide })}
                    >
                      <div className={isWide ? 'aspect-video relative' : 'aspect-[9/16] relative'}>
                        <iframe
                          src={getDriveUrl(story.driveId)}
                          className="w-full h-full pointer-events-none scale-105 group-hover/card:scale-100 transition-transform duration-700"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                        <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center group-hover/card:bg-black transition-all">
                          <Play className="w-3 h-3 text-white fill-white ml-0.5" />
                        </div>
                      </div>
                      <div className="p-4">
                        <h4 className="text-sm font-black text-gray-900 uppercase tracking-tight mb-1 leading-tight line-clamp-2">
                          {story.title}
                        </h4>
                        <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest">{story.sub}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Nav arrows */}
              <button
                onClick={() => scroll(key, -1)}
                className="hidden lg:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-5 w-10 h-10 rounded-full bg-white border border-gray-200 items-center justify-center text-gray-600 hover:bg-black hover:border-black hover:text-white transition-all opacity-0 group-hover:opacity-100 group-hover:-translate-x-3 z-10 shadow-sm"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => scroll(key, 1)}
                className="hidden lg:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-5 w-10 h-10 rounded-full bg-white border border-gray-200 items-center justify-center text-gray-600 hover:bg-black hover:border-black hover:text-white transition-all opacity-0 group-hover:opacity-100 group-hover:translate-x-3 z-10 shadow-sm"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {modalData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setModalData(null)}
          />
          <div className="relative w-full max-w-4xl bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setModalData(null)}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-900 hover:text-white transition-all z-10"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex flex-col md:flex-row">
              <div className={`bg-black ${modalData.isWide ? 'w-full' : 'w-full md:w-[420px]'}`}>
                <div className={`${modalData.isWide ? 'aspect-video' : 'aspect-[9/16] h-[55vh] md:h-auto'}`}>
                  <iframe
                    src={getDriveUrl(modalData.story.driveId)}
                    className="w-full h-full border-none"
                    allow="autoplay; fullscreen"
                  />
                </div>
              </div>

              <div className="p-8 flex-1 flex flex-col justify-center">
                <div className="inline-block px-3 py-1.5 rounded-full bg-gray-100 border border-gray-200 text-gray-600 text-[10px] font-black uppercase tracking-widest mb-4">
                  Exemplo de Automação
                </div>
                <h3 className="text-3xl font-black text-gray-900 uppercase tracking-tighter mb-4 leading-none">
                  {modalData.story.title}
                </h3>
                <p className="text-gray-500 text-sm font-black leading-relaxed mb-8">
                  Veja o nível de qualidade e retenção que você pode alcançar utilizando nossas automações inteligentes.
                </p>
                <div className="flex items-center gap-4 pt-6 border-t border-gray-100">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                    <Play className="w-4 h-4 text-gray-700 fill-gray-700" />
                  </div>
                  <div>
                    <div className="font-black text-gray-900 uppercase tracking-tight text-sm">{modalData.story.sub}</div>
                    <div className="text-[9px] text-gray-400 font-black uppercase tracking-widest">Qualidade 4K</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default UmbraStories;
