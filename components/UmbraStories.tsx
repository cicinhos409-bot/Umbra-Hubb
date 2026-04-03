
import React, { useState, useEffect, useRef } from 'react';
import { Play, X, ChevronLeft, ChevronRight } from 'lucide-react';

interface StoryCard {
  id: string;
  title: string;
  sub: string;
  driveId: string;
}

const DARK_STORIES: StoryCard[] = [
  { id: 'd1', title: 'O SEGREDO DAS SOMBRAS', sub: 'Canal Dark · 8:42', driveId: '1LpDk99j5N6n_YyXQ6H9p19-869999999' },
  { id: 'd2', title: 'MISTÉRIOS SEM RESPOSTA', sub: 'Canal Dark · 11:20', driveId: '1LpDk99j5N6n_YyXQ6H9p19-869999991' },
  { id: 'd3', title: 'A VERDADE OCULTA', sub: 'Canal Dark · 9:15', driveId: '1LpDk99j5N6n_YyXQ6H9p19-869999992' },
  { id: 'd4', title: 'FENÔMENOS INEXPLICÁVEIS', sub: 'Canal Dark · 7:58', driveId: '1LpDk99j5N6n_YyXQ6H9p19-869999993' },
  { id: 'd5', title: 'O LADO NEGRO DA HISTÓRIA', sub: 'Canal Dark · 10:33', driveId: '1LpDk99j5N6n_YyXQ6H9p19-869999994' },
  { id: 'd6', title: 'CASOS PERTURBADORES', sub: 'Canal Dark · 12:01', driveId: '1LpDk99j5N6n_YyXQ6H9p19-869999995' },
  { id: 'd7', title: 'SEGREDOS PROIBIDOS', sub: 'Canal Dark · 8:50', driveId: '1LpDk99j5N6n_YyXQ6H9p19-869999996' },
  { id: 'd8', title: 'CONSPIRAÇÕES REAIS', sub: 'Canal Dark · 9:44', driveId: '1LpDk99j5N6n_YyXQ6H9p19-869999997' },
  { id: 'd9', title: 'O ARQUIVO SECRETO', sub: 'Canal Dark · 13:10', driveId: '1LpDk99j5N6n_YyXQ6H9p19-869999998' },
];

const REELS_STORIES: StoryCard[] = [
  { id: 'r1', title: 'VOCÊ SABIA DISSO?', sub: 'Short · 0:45', driveId: '1LpDk99j5N6n_YyXQ6H9p19-R1' },
  { id: 'r2', title: '3 SEGREDOS DARK', sub: 'Reel · 0:58', driveId: '1LpDk99j5N6n_YyXQ6H9p19-R2' },
  { id: 'r3', title: 'ISSO É REAL?', sub: 'Short · 0:32', driveId: '1LpDk99j5N6n_YyXQ6H9p19-R3' },
  { id: 'r4', title: 'O MISTÉRIO REVELADO', sub: 'Reel · 1:00', driveId: '1LpDk99j5N6n_YyXQ6H9p19-R4' },
  { id: 'r5', title: 'NINGUÉM FALA ISSO', sub: 'Short · 0:50', driveId: '1LpDk99j5N6n_YyXQ6H9p19-R5' },
  { id: 'r6', title: 'DARK FACTS #1', sub: 'Reel · 0:40', driveId: '1LpDk99j5N6n_YyXQ6H9p19-R6' },
  { id: 'r7', title: 'ASSUSTADOR DEMAIS', sub: 'Short · 0:55', driveId: '1LpDk99j5N6n_YyXQ6H9p19-R7' },
  { id: 'r8', title: 'VERDADE SOMBRIA', sub: 'Reel · 0:48', driveId: '1LpDk99j5N6n_YyXQ6H9p19-R8' },
  { id: 'r9', title: 'FIM DO MISTÉRIO', sub: 'Short · 1:00', driveId: '1LpDk99j5N6n_YyXQ6H9p19-R9' },
];

const TIKTOK_STORIES: StoryCard[] = [
  { id: 't1', title: 'Mulher Apresentado O Produto VIRAL', sub: 'TikTok Shop · 0:29', driveId: '18h2h69NABPgXs7QZig0bX4zMc6QR182l' },
  { id: 't2', title: 'VENDI 500 EM 1 DIA', sub: 'TikTok Shop · 0:45', driveId: '1LpDk99j5N6n_YyXQ6H9p19-T2' },
  { id: 't3', title: 'REVIEW HONESTO', sub: 'TikTok Shop · 0:38', driveId: '1LpDk99j5N6n_YyXQ6H9p19-T3' },
  { id: 't4', title: 'UGC QUE CONVERTE', sub: 'TikTok Shop · 0:52', driveId: '1LpDk99j5N6n_YyXQ6H9p19-T4' },
  { id: 't5', title: 'MINHA RENDA PASSIVA', sub: 'TikTok Shop · 0:44', driveId: '1LpDk99j5N6n_YyXQ6H9p19-T5' },
  { id: 't6', title: 'HOOK PERFEITO', sub: 'TikTok Shop · 0:29', driveId: '1LpDk99j5N6n_YyXQ6H9p19-T6' },
  { id: 't7', title: 'PRODUTO TENDÊNCIA', sub: 'TikTok Shop · 0:35', driveId: '1LpDk99j5N6n_YyXQ6H9p19-T7' },
  { id: 't8', title: 'SCRIPT QUE VENDE', sub: 'TikTok Shop · 0:50', driveId: '1LpDk99j5N6n_YyXQ6H9p19-T8' },
  { id: 't9', title: 'FATUREI R$10K', sub: 'TikTok Shop · 0:58', driveId: '1LpDk99j5N6n_YyXQ6H9p19-T9' },
];

const UmbraStories: React.FC = () => {
  const [modalData, setModalData] = useState<{ story: StoryCard; isWide: boolean } | null>(null);

  const scrollRefs = {
    dark: useRef<HTMLDivElement>(null),
    reels: useRef<HTMLDivElement>(null),
    tiktok: useRef<HTMLDivElement>(null),
  };

  const scroll = (tab: 'dark' | 'reels' | 'tiktok', dir: number) => {
    const ref = scrollRefs[tab].current;
    if (ref) {
      const scrollAmount = ref.offsetWidth * 0.8;
      ref.scrollBy({ left: dir * scrollAmount, behavior: 'smooth' });
    }
  };

  const getDriveUrl = (id: string) => `https://drive.google.com/file/d/${id}/preview`;

  return (
    <section className="py-16 md:py-24 relative overflow-hidden bg-[#030308]">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-grid opacity-10 pointer-events-none" />
      <div className="absolute top-1/4 left-0 w-[500px] h-[500px] bg-brand-purple/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 right-0 w-[500px] h-[500px] bg-brand-cyan/5 blur-[150px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10">
        <header className="text-center mb-12 md:mb-16">
          <div className="inline-block px-4 py-1.5 rounded-full bg-brand-purple/10 border border-brand-purple/20 text-brand-purple text-[10px] font-black tracking-[0.2em] uppercase mb-6">
            ✦ Umbra Hub · AI Stories
          </div>
          <h2 className="text-4xl md:text-7xl font-black text-white mb-6 uppercase tracking-tighter leading-none">
            Veja o que é<br />
            <span className="bg-gradient-to-r from-brand-cyan via-brand-purple to-brand-pink bg-clip-text text-transparent italic">
              possível criar
            </span>
          </h2>
          <p className="text-gray-400 text-base md:text-lg max-w-xl mx-auto font-medium">
            Exemplos reais gerados com nossas ferramentas de IA — deslize para ver mais
          </p>
        </header>

        {/* --- SECTION 1: DARK CHANNELS --- */}
        <div className="mb-16 md:mb-20">
          <div className="flex items-center gap-4 mb-6">
            <span className="px-4 py-1 rounded-full bg-brand-purple/20 border border-brand-purple/30 text-brand-purple text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
              📺 Canais Dark · 16:9
            </span>
            <div className="flex-1 h-px bg-gradient-to-r from-brand-purple/30 to-transparent" />
          </div>

          <div className="relative group">
            <div
              ref={scrollRefs.dark}
              className="flex gap-4 md:gap-6 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4 px-2"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {DARK_STORIES.map((story) => (
                <div key={story.id} className="flex-shrink-0 w-[280px] md:w-[calc(33.333%-16px)] snap-start">
                  <div
                    className="relative rounded-[20px] md:rounded-[24px] overflow-hidden border border-white/5 bg-background-light group/card cursor-pointer hover:border-brand-purple/50 transition-all duration-500"
                    onClick={() => setModalData({ story, isWide: true })}
                  >
                    <div className="aspect-video relative">
                      <iframe
                        src={getDriveUrl(story.driveId)}
                        className="w-full h-full pointer-events-none scale-105 group-hover/card:scale-100 transition-transform duration-1000"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background-deep via-transparent to-transparent opacity-80" />
                      <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-brand-purple/50 backdrop-blur-md flex items-center justify-center group-hover/card:bg-brand-purple transition-all">
                        <Play className="w-3 h-3 text-white fill-white ml-0.5" />
                      </div>
                    </div>
                    <div className="p-4 md:p-6">
                      <h4 className="text-lg font-black text-white uppercase tracking-tight mb-0.5 group-hover/card:text-brand-purple transition-colors font-bebas">
                        {story.title}
                      </h4>
                      <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">{story.sub}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => scroll('dark', -1)}
              className="hidden lg:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-6 w-12 h-12 rounded-full bg-white/5 border border-white/10 items-center justify-center text-white hover:bg-brand-purple hover:border-brand-purple transition-all opacity-0 group-hover:opacity-100 group-hover:-translate-x-2 z-20"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={() => scroll('dark', 1)}
              className="hidden lg:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-6 w-12 h-12 rounded-full bg-white/5 border border-white/10 items-center justify-center text-white hover:bg-brand-purple hover:border-brand-purple transition-all opacity-0 group-hover:opacity-100 group-hover:translate-x-2 z-20"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* --- SECTION 2: REELS/SHORTS --- */}
        <div className="mb-16 md:mb-20">
          <div className="flex items-center gap-4 mb-6">
            <span className="px-4 py-1 rounded-full bg-brand-cyan/20 border border-brand-cyan/30 text-brand-cyan text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
              ⚡ Shorts/Reels · 9:16
            </span>
            <div className="flex-1 h-px bg-gradient-to-r from-brand-cyan/30 to-transparent" />
          </div>

          <div className="relative group">
            <div
              ref={scrollRefs.reels}
              className="flex gap-4 md:gap-6 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4 px-2"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {REELS_STORIES.map((story) => (
                <div key={story.id} className="flex-shrink-0 w-[180px] md:w-[calc(25%-18px)] snap-start">
                  <div
                    className="relative rounded-[20px] md:rounded-[24px] overflow-hidden border border-white/5 bg-background-light group/card cursor-pointer hover:border-brand-cyan/50 transition-all duration-500"
                    onClick={() => setModalData({ story, isWide: false })}
                  >
                    <div className="aspect-[9/16] relative">
                      <iframe
                        src={getDriveUrl(story.driveId)}
                        className="w-full h-full pointer-events-none scale-105 group-hover/card:scale-100 transition-transform duration-1000"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background-deep via-transparent to-transparent opacity-80" />
                      <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-brand-cyan/50 backdrop-blur-md flex items-center justify-center group-hover/card:bg-brand-cyan transition-all">
                        <Play className="w-3 h-3 text-white fill-white ml-0.5" />
                      </div>
                    </div>
                    <div className="p-4 md:p-6">
                      <h4 className="text-lg font-black text-white uppercase tracking-tight mb-0.5 group-hover/card:text-brand-cyan transition-colors font-bebas">
                        {story.title}
                      </h4>
                      <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">{story.sub}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => scroll('reels', -1)}
              className="hidden lg:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-6 w-12 h-12 rounded-full bg-white/5 border border-white/10 items-center justify-center text-white hover:bg-brand-cyan hover:border-brand-cyan transition-all opacity-0 group-hover:opacity-100 group-hover:-translate-x-2 z-20"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={() => scroll('reels', 1)}
              className="hidden lg:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-6 w-12 h-12 rounded-full bg-white/5 border border-white/10 items-center justify-center text-white hover:bg-brand-cyan hover:border-brand-cyan transition-all opacity-0 group-hover:opacity-100 group-hover:translate-x-2 z-20"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* --- SECTION 3: TIKTOK SHOP --- */}
        <div className="mb-16 md:mb-20">
          <div className="flex items-center gap-4 mb-6">
            <span className="px-4 py-1 rounded-full bg-brand-pink/20 border border-brand-pink/30 text-brand-pink text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
              🛒 TikTok Shop · 9:16
            </span>
            <div className="flex-1 h-px bg-gradient-to-r from-brand-pink/30 to-transparent" />
          </div>

          <div className="relative group">
            <div
              ref={scrollRefs.tiktok}
              className="flex gap-4 md:gap-6 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4 px-2"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {TIKTOK_STORIES.map((story) => (
                <div key={story.id} className="flex-shrink-0 w-[180px] md:w-[calc(25%-18px)] snap-start">
                  <div
                    className="relative rounded-[20px] md:rounded-[24px] overflow-hidden border border-white/5 bg-background-light group/card cursor-pointer hover:border-brand-pink/50 transition-all duration-500"
                    onClick={() => setModalData({ story, isWide: false })}
                  >
                    <div className="aspect-[9/16] relative">
                      <iframe
                        src={getDriveUrl(story.driveId)}
                        className="w-full h-full pointer-events-none scale-105 group-hover/card:scale-100 transition-transform duration-1000"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background-deep via-transparent to-transparent opacity-80" />
                      <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-brand-pink/50 backdrop-blur-md flex items-center justify-center group-hover/card:bg-brand-pink transition-all">
                        <Play className="w-3 h-3 text-white fill-white ml-0.5" />
                      </div>
                    </div>
                    <div className="p-4 md:p-6">
                      <h4 className="text-lg font-black text-white uppercase tracking-tight mb-0.5 group-hover/card:text-brand-pink transition-colors font-bebas">
                        {story.title}
                      </h4>
                      <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">{story.sub}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => scroll('tiktok', -1)}
              className="hidden lg:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-6 w-12 h-12 rounded-full bg-white/5 border border-white/10 items-center justify-center text-white hover:bg-brand-pink hover:border-brand-pink transition-all opacity-0 group-hover:opacity-100 group-hover:-translate-x-2 z-20"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={() => scroll('tiktok', 1)}
              className="hidden lg:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-6 w-12 h-12 rounded-full bg-white/5 border border-white/10 items-center justify-center text-white hover:bg-brand-pink hover:border-brand-pink transition-all opacity-0 group-hover:opacity-100 group-hover:translate-x-2 z-20"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* MODAL */}
      {modalData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-background-deep/95 backdrop-blur-2xl transition-opacity animate-in fade-in duration-300"
            onClick={() => setModalData(null)}
          />
          <div className="relative w-full max-w-4xl bg-background-light border border-white/10 rounded-[32px] md:rounded-[40px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
            <button
              onClick={() => setModalData(null)}
              className="absolute top-4 right-4 md:top-6 md:right-6 w-10 h-10 md:w-12 md:h-12 rounded-full bg-black/50 border border-white/10 flex items-center justify-center text-white hover:bg-brand-purple transition-all z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex flex-col md:flex-row">
              <div className={`bg-black ${modalData.isWide ? 'w-full' : 'w-full md:w-[450px] mx-auto'}`}>
                <div className={`${modalData.isWide ? 'aspect-video' : 'aspect-[9/16] h-[60vh] md:h-auto'}`}>
                  <iframe
                    src={getDriveUrl(modalData.story.driveId)}
                    className="w-full h-full border-none"
                    allow="autoplay; fullscreen"
                  />
                </div>
              </div>
              <div className="p-6 md:p-10 flex-1 flex flex-col justify-center">
                <div className="inline-block px-3 py-1 rounded-full bg-brand-purple/10 border border-brand-purple/20 text-brand-purple text-[10px] font-black uppercase tracking-widest mb-4">
                  Player Exclusivo
                </div>
                <h3 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter mb-4 leading-none font-bebas">
                  {modalData.story.title}
                </h3>
                <p className="text-gray-400 text-sm md:text-lg font-medium leading-relaxed mb-6 md:mb-8">
                  Crie narrativas virais e domine os algoritmos com o arsenal do Umbra Hub.
                </p>
                <div className="flex items-center gap-4 pt-6 md:pt-8 border-t border-white/5">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-brand-purple/20 flex items-center justify-center">
                    <Play className="w-4 h-4 text-brand-purple fill-brand-purple" />
                  </div>
                  <div>
                    <div className="font-black text-white uppercase tracking-tight text-sm md:text-base">{modalData.story.sub}</div>
                    <div className="text-[9px] text-gray-500 font-black uppercase tracking-widest">Qualidade 4K</div>
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
