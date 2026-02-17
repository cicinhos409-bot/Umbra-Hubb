import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Youtube, 
  TrendingUp, 
  Target, 
  Zap, 
  BarChart3, 
  AlertCircle, 
  Info, 
  DollarSign, 
  Tag, 
  Users,
  ExternalLink,
  Loader2,
  RefreshCw,
  CheckCircle2,
  Trophy,
  Activity,
  Flame,
  Key
} from 'lucide-react';

interface ViralAnalysis {
  video: any;
  channel: any;
  viralScore: { score: number; description: string };
  growthMetrics: any;
  titleAnalysis: any;
  insights: any[];
  benchmark: any;
  topVideos: any[];
  niches: any[];
  monetization: any;
  similarChannels: any[];
}

const UmbraReverseTool: React.FC = () => {
  const [apiKey, setApiKey] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<ViralAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('umbra_yt_api_key');
    if (saved) setApiKey(saved);
  }, []);

  const saveKey = (val: string) => {
    setApiKey(val);
    localStorage.setItem('umbra_yt_api_key', val);
  };

  const fmtNum = (n: number) => {
    if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + 'B';
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
    return n.toString();
  };

  const extractVideoId = (input: string) => {
    if (!input) return null;
    if (/^[a-zA-Z0-9_-]{11}$/.test(input.trim())) return input.trim();
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/
    ];
    for (const pattern of patterns) {
      const match = input.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  /**
   * Calculate engagement rate.
   * Fix: Ensure calculateEngagement always returns a string to satisfy parseFloat type expectations.
   */
  const calculateEngagement = (stats: any): string => {
    const views = Number(stats.viewCount) || 0;
    const likes = Number(stats.likeCount) || 0;
    const comments = Number(stats.commentCount) || 0;
    if (views === 0) return '0.00';
    return (((likes + comments) / views) * 100).toFixed(2);
  };

  const analyzeVideo = async () => {
    if (!apiKey) return setError('Por favor, insira sua API Key do YouTube');
    const videoId = extractVideoId(videoUrl);
    if (!videoId) return setError('URL ou ID de vídeo inválido');

    setIsAnalyzing(true);
    setError(null);
    setAnalysis(null);

    try {
      // 1. Video Details
      const vRes = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${videoId}&key=${apiKey}`);
      const vData = await vRes.json();
      if (!vData.items?.length) throw new Error('Vídeo não encontrado');
      const video = vData.items[0];

      // 2. Channel Details
      const cRes = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${video.snippet.channelId}&key=${apiKey}`);
      const cData = await cRes.json();
      const channel = cData.items[0];

      // 3. Channel Benchmark (Recent 50 videos)
      const cvRes = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channel.id}&type=video&order=date&maxResults=50&key=${apiKey}`);
      const cvData = await cvRes.json();
      const vidsIds = cvData.items.map((i: any) => i.id.videoId).join(',');
      const cvsRes = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet&id=${vidsIds}&key=${apiKey}`);
      const channelVideosStats = await cvsRes.json();
      const channelVideos = channelVideosStats.items || [];

      // 4. Similar Channels Search
      const query = video.snippet.title.split(' ').slice(0, 4).join(' ');
      const sRes = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=channel&maxResults=6&key=${apiKey}`);
      const sData = await sRes.json();
      const simIds = (sData.items || []).filter((i: any) => i.id.channelId !== channel.id).map((i: any) => i.id.channelId);
      let similarChannels: any[] = [];
      if (simIds.length) {
        const scRes = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${simIds.join(',')}&key=${apiKey}`);
        const scData = await scRes.json();
        similarChannels = scData.items || [];
      }

      // Calculations
      const views = Number(video.statistics.viewCount) || 0;
      const subs = Number(channel.statistics.subscriberCount) || 1;
      const viralScoreNum = Math.min(100, Math.round(((Number(video.statistics.likeCount)/views)*2500) + ((Number(video.statistics.commentCount)/views)*2000) + Math.min(30, (views/subs)*3) + (parseFloat(calculateEngagement(video.statistics))*5)));

      const viralScore = {
        score: viralScoreNum,
        description: viralScoreNum >= 90 ? '🔥 VIRAL EXPLOSIVO' : viralScoreNum >= 75 ? '🚀 Alto Potencial Viral' : viralScoreNum >= 60 ? '📈 Crescimento Forte' : '📊 Performance Média'
      };

      const publishedAt = new Date(video.snippet.publishedAt);
      const hours = (new Date().getTime() - publishedAt.getTime()) / (1000 * 3600);
      const growthMetrics = {
        viewsPerHour: (views / hours).toFixed(0),
        views24h: hours >= 24 ? Math.round(views * (24 / hours)) : views,
        ageDays: (hours / 24).toFixed(0),
        viewsPerSub: (views / subs).toFixed(2)
      };

      const title = video.snippet.title;
      const emotionalWords = ['incrível', 'chocante', 'surpreendente', 'melhor', 'pior', 'secreto', 'revelado', 'nunca', 'sempre', 'mágico', 'perfeito', 'definitivo', 'ultimate', 'epic', 'insane', 'crazy', 'amazing', 'shocking'].filter(w => title.toLowerCase().includes(w));
      const titleAnalysis = {
        length: title.length,
        hasNumbers: /\d+/.test(title),
        emotionalWords,
        optimization: title.length >= 40 && title.length <= 70 ? 'Otimizado' : 'Revisar'
      };

      const avgViews = channelVideos.reduce((sum: number, v: any) => sum + (Number(v.statistics.viewCount) || 0), 0) / (channelVideos.length || 1);
      const benchmark = {
        performance: ((views / avgViews - 1) * 100).toFixed(1),
        avg: Math.round(avgViews)
      };

      // Niches (Simplified logic from HTML)
      const niches = [
        { name: 'Categoria Principal', description: 'YouTube Category ID: ' + video.snippet.categoryId, tags: ['categoria'] },
        { name: 'Nicho Estratégico', description: 'Detectado via tags e título', tags: (video.snippet.tags || []).slice(0, 3) }
      ];

      const monetization = {
        revenue: (views / 1000) * 4 * 0.55, // Estimated
        competition: 'Média'
      };

      setAnalysis({
        video,
        channel,
        viralScore,
        growthMetrics,
        titleAnalysis,
        insights: [], // Would generate based on logic
        benchmark,
        topVideos: channelVideos.sort((a: any, b: any) => Number(b.statistics.viewCount) - Number(a.statistics.viewCount)).slice(0, 3),
        niches,
        monetization,
        similarChannels
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="font-rajdhani space-y-8 animate-in fade-in duration-700 pb-20 max-w-7xl mx-auto">
      <header className="text-center relative">
        <div className="inline-flex items-center justify-center w-24 h-24 bg-brand-cyan/10 rounded-[32px] mb-6 shadow-2xl ring-1 ring-brand-cyan/20">
          <RefreshCw className="w-12 h-12 text-brand-cyan" />
        </div>
        <h1 className="text-5xl font-black tracking-tighter mb-2 bg-gradient-to-r from-brand-cyan via-brand-purple to-brand-pink bg-clip-text text-transparent uppercase font-bebas">
          Umbra Reverse
        </h1>
        <p className="text-gray-500 font-medium">Engenharia Reversa de Viralidade • Insights Algorítmicos</p>
      </header>

      {/* INPUT PANEL */}
      <div className="bg-background-mid border border-white/5 rounded-[40px] p-8 shadow-xl space-y-8 relative overflow-hidden backdrop-blur-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-cyan/5 blur-[100px] -z-10" />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-3">
             <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2 px-1">
               <Key className="w-4 h-4 text-brand-cyan" /> YouTube API Key
             </label>
             <input 
              type="password"
              value={apiKey}
              onChange={e => saveKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full bg-background-deep border border-white/10 rounded-2xl p-5 text-xs font-space text-brand-cyan focus:border-brand-cyan outline-none"
             />
          </div>
          <div className="space-y-3">
             <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2 px-1">
               <Search className="w-4 h-4 text-brand-purple" /> Link do Vídeo
             </label>
             <input 
              type="text"
              value={videoUrl}
              onChange={e => setVideoUrl(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && analyzeVideo()}
              placeholder="URL ou ID do YouTube..."
              className="w-full bg-background-deep border border-white/10 rounded-2xl p-5 text-sm font-bold text-white focus:border-brand-purple outline-none"
             />
          </div>
        </div>

        <button 
          onClick={analyzeVideo}
          disabled={isAnalyzing || !videoUrl}
          className="w-full py-6 bg-gradient-to-r from-brand-cyan via-brand-purple to-brand-pink text-white font-orbitron text-xs font-black tracking-[0.4em] rounded-[24px] shadow-2xl hover:shadow-[0_0_40px_rgba(168,85,247,0.4)] transition-all flex items-center justify-center gap-4 disabled:opacity-30 uppercase active:scale-95"
        >
          {isAnalyzing ? <Loader2 className="w-6 h-6 animate-spin" /> : <Zap className="w-6 h-6" />}
          Iniciar Engenharia Reversa
        </button>

        {error && (
          <div className="p-5 bg-brand-pink/10 border border-brand-pink/20 rounded-2xl flex items-center gap-4 text-brand-pink animate-in slide-in-from-top-2">
            <AlertCircle className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-widest">{error}</span>
          </div>
        )}
      </div>

      {!analysis && !isAnalyzing && (
        <div className="py-24 text-center opacity-20">
           <BarChart3 className="w-20 h-20 mx-auto mb-8" />
           <p className="font-orbitron text-xs font-black uppercase tracking-widest">Aguardando análise de performance</p>
        </div>
      )}

      {analysis && (
        <div className="space-y-12 animate-in slide-in-from-bottom-8 duration-700">
           {/* VIDEO HEADER CARD */}
           <div className="bg-background-mid border border-white/5 rounded-[48px] p-10 shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-brand-cyan/5 via-transparent to-transparent -z-10" />
             <div className="flex flex-col lg:flex-row gap-10">
                <div className="w-full lg:w-1/3 aspect-video bg-background-deep rounded-[32px] overflow-hidden border border-white/5 shadow-2xl">
                   <img src={analysis.video.snippet.thumbnails.maxres?.url || analysis.video.snippet.thumbnails.high?.url} className="w-full h-full object-cover" alt="Thumbnail" />
                </div>
                <div className="flex-1 space-y-6">
                   <div>
                     <h2 className="text-3xl font-black tracking-tight leading-tight mb-2">{analysis.video.snippet.title}</h2>
                     <a href={`https://youtube.com/channel/${analysis.channel.id}`} target="_blank" className="text-brand-cyan font-bold text-sm hover:underline flex items-center gap-2">
                       {analysis.channel.snippet.title} <ExternalLink className="w-3 h-3" />
                     </a>
                   </div>
                   <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {[
                        { label: 'Views', val: fmtNum(analysis.video.statistics.viewCount), color: 'text-brand-cyan' },
                        { label: 'Likes', val: fmtNum(analysis.video.statistics.likeCount), color: 'text-brand-pink' },
                        { label: 'Comments', val: fmtNum(analysis.video.statistics.commentCount), color: 'text-brand-purple' },
                        { label: 'Subs', val: fmtNum(analysis.channel.statistics.subscriberCount), color: 'text-white' },
                      ].map(s => (
                        <div key={s.label} className="bg-background-deep/50 border border-white/5 p-4 rounded-2xl text-center">
                           <div className={`text-xl font-black ${s.color}`}>{s.val}</div>
                           <div className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">{s.label}</div>
                        </div>
                      ))}
                   </div>
                </div>
             </div>
           </div>

           {/* VIRAL SCORE & GROWTH */}
           <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-4 bg-gradient-to-br from-brand-purple/20 to-brand-pink/20 border border-white/10 rounded-[48px] p-10 text-center shadow-2xl relative overflow-hidden">
                 <div className="absolute inset-0 bg-grid opacity-10" />
                 <h4 className="font-orbitron text-[10px] font-black uppercase text-white tracking-[0.2em] mb-8">Viral Score Hub</h4>
                 <div className="text-8xl font-bebas tracking-tighter bg-gradient-to-r from-brand-cyan via-brand-purple to-brand-pink bg-clip-text text-transparent mb-4">
                   {analysis.viralScore.score}
                 </div>
                 <p className="text-sm font-black text-white uppercase tracking-widest mb-2">{analysis.viralScore.description}</p>
                 <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-brand-cyan to-brand-pink" style={{ width: `${analysis.viralScore.score}%` }} />
                 </div>
              </div>

              <div className="lg:col-span-8 bg-background-mid border border-white/5 rounded-[48px] p-10 shadow-xl space-y-8">
                 <div className="flex items-center gap-4">
                    <TrendingUp className="w-6 h-6 text-brand-cyan" />
                    <h3 className="text-xl font-black uppercase tracking-tight">Crescimento Estimado</h3>
                 </div>
                 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                    {[
                      { label: 'Views/Hora', val: fmtNum(Number(analysis.growthMetrics.viewsPerHour)) + '/h' },
                      { label: 'Pico 24h', val: fmtNum(analysis.growthMetrics.views24h) },
                      { label: 'Idade', val: analysis.growthMetrics.ageDays + ' Dias' },
                      { label: 'Views/Sub', val: analysis.growthMetrics.viewsPerSub + 'x', color: 'text-brand-green' },
                    ].map(m => (
                      <div key={m.label} className="space-y-1">
                        <div className={`text-2xl font-black ${m.color || 'text-white'}`}>{m.val}</div>
                        <div className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">{m.label}</div>
                      </div>
                    ))}
                 </div>
              </div>
           </div>

           {/* TITLE & NICHES */}
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-background-mid border border-white/5 rounded-[40px] p-8 shadow-xl space-y-8">
                 <div className="flex items-center gap-4">
                    <Target className="w-6 h-6 text-brand-pink" />
                    <h3 className="text-xl font-black uppercase tracking-tight">Analítica do Título</h3>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="p-5 bg-background-deep/50 rounded-3xl border border-white/5">
                       <div className="text-xs font-black text-brand-pink uppercase mb-1">Tamanho</div>
                       <div className="text-xl font-black text-white">{analysis.titleAnalysis.length} Chars</div>
                    </div>
                    <div className="p-5 bg-background-deep/50 rounded-3xl border border-white/5">
                       <div className="text-xs font-black text-brand-pink uppercase mb-1">Status</div>
                       <div className="text-xl font-black text-brand-green">{analysis.titleAnalysis.optimization}</div>
                    </div>
                 </div>
                 <div className="p-5 bg-background-deep/50 rounded-3xl border border-white/5">
                    <div className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-4">Ganchos Emocionais Detectados</div>
                    <div className="flex flex-wrap gap-2">
                       {analysis.titleAnalysis.emotionalWords.length ? analysis.titleAnalysis.emotionalWords.map((w: string) => (
                         <span key={w} className="px-3 py-1.5 bg-brand-pink/10 border border-brand-pink/20 rounded-lg text-[10px] font-bold text-brand-pink uppercase">{w}</span>
                       )) : <span className="text-[10px] text-gray-700 italic font-bold uppercase">Nenhum gatilho detectado</span>}
                    </div>
                 </div>
              </div>

              <div className="bg-background-mid border border-white/5 rounded-[40px] p-8 shadow-xl space-y-8">
                 <div className="flex items-center gap-4">
                    <DollarSign className="w-6 h-6 text-brand-green" />
                    <h3 className="text-xl font-black uppercase tracking-tight">Monetização & Benchmark</h3>
                 </div>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="p-6 bg-brand-green/5 border border-brand-green/10 rounded-3xl">
                       <div className="text-[10px] font-black text-brand-green uppercase tracking-widest mb-2">AdSense Estimado</div>
                       <div className="text-3xl font-black text-white">${analysis.monetization.revenue.toFixed(2)}</div>
                       <p className="text-[9px] text-gray-600 font-bold uppercase mt-2">Base: 55% share revenue</p>
                    </div>
                    <div className={`p-6 border rounded-3xl ${Number(analysis.benchmark.performance) > 0 ? 'bg-brand-cyan/5 border-brand-cyan/20' : 'bg-brand-pink/5 border-brand-pink/20'}`}>
                       <div className="text-[10px] font-black uppercase tracking-widest mb-2 opacity-60">Vs Média do Canal</div>
                       <div className={`text-3xl font-black ${Number(analysis.benchmark.performance) > 0 ? 'text-brand-cyan' : 'text-brand-pink'}`}>{analysis.benchmark.performance}%</div>
                       <p className="text-[9px] text-gray-600 font-bold uppercase mt-2">Média: {fmtNum(analysis.benchmark.avg)} views</p>
                    </div>
                 </div>
              </div>
           </div>

           {/* TOP VIDEOS GALLERY */}
           <section className="bg-background-mid border border-white/5 rounded-[48px] p-10 shadow-2xl">
              <div className="flex items-center gap-4 mb-10 pb-6 border-b border-white/5">
                <Trophy className="w-8 h-8 text-brand-cyan" />
                <h3 className="text-2xl font-black tracking-tight uppercase">Melhor Performance do Canal</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 {analysis.topVideos.map((v: any, i: number) => (
                   <a key={v.id} href={`https://youtube.com/watch?v=${v.id}`} target="_blank" className="group bg-background-deep border border-white/5 rounded-[32px] overflow-hidden hover:border-brand-cyan transition-all shadow-xl">
                      <div className="aspect-video relative">
                         <img src={v.snippet.thumbnails.medium.url} className="w-full h-full object-cover" />
                         <div className="absolute inset-0 bg-brand-cyan/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                         <div className="absolute top-4 left-4 px-3 py-1 bg-black/60 backdrop-blur-md rounded-lg text-[9px] font-black text-white border border-white/10 uppercase">#{i+1} TOP</div>
                      </div>
                      <div className="p-6 space-y-3">
                         <h5 className="text-sm font-black text-white group-hover:text-brand-cyan transition-colors line-clamp-2">{v.snippet.title}</h5>
                         <div className="flex justify-between items-center text-[10px] font-black text-gray-600 uppercase tracking-widest">
                            <span className="flex items-center gap-2"><Flame className="w-3 h-3 text-brand-pink" /> {fmtNum(v.statistics.viewCount)}</span>
                            <span>{new Date(v.snippet.publishedAt).getFullYear()}</span>
                         </div>
                      </div>
                   </a>
                 ))}
              </div>
           </section>

           {/* SIMILAR CHANNELS */}
           <section className="bg-background-mid border border-white/5 rounded-[48px] p-10 shadow-2xl">
              <div className="flex items-center gap-4 mb-10 pb-6 border-b border-white/5">
                <Users className="w-8 h-8 text-brand-purple" />
                <h3 className="text-2xl font-black tracking-tight uppercase">Canais Similares para Estudo</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                 {analysis.similarChannels.map((ch: any) => (
                   <div key={ch.id} className="p-6 bg-background-deep border border-white/5 rounded-[32px] flex items-center gap-6 group hover:border-brand-purple/40 transition-all shadow-inner">
                      <img src={ch.snippet.thumbnails.default.url} className="w-16 h-16 rounded-full border-2 border-white/5 group-hover:border-brand-purple transition-all" />
                      <div className="overflow-hidden">
                        <h5 className="text-base font-black text-white group-hover:text-brand-cyan transition-all truncate">{ch.snippet.title}</h5>
                        <div className="text-[10px] font-black text-gray-600 uppercase tracking-widest mt-1">
                           {fmtNum(ch.statistics.subscriberCount)} Inscritos
                        </div>
                      </div>
                   </div>
                 ))}
              </div>
           </section>

           {/* TAGS */}
           <section className="bg-background-mid border border-white/5 rounded-[40px] p-10 shadow-xl">
              <div className="flex items-center gap-4 mb-8">
                 <Tag className="w-6 h-6 text-brand-pink" />
                 <h3 className="text-xl font-black uppercase tracking-tight">Cofre de Tags Detectadas</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                 {(analysis.video.snippet.tags || []).length ? analysis.video.snippet.tags.map((t: string) => (
                   <button key={t} onClick={() => { navigator.clipboard.writeText(t); alert('Tag copiada!'); }} className="px-4 py-2 bg-background-deep border border-white/10 rounded-xl text-[11px] font-bold text-gray-400 hover:text-brand-cyan hover:border-brand-cyan/40 transition-all">{t}</button>
                 )) : <span className="text-gray-700 italic font-bold uppercase">Nenhuma tag oculta detectada</span>}
              </div>
           </section>
        </div>
      )}

      <footer className="mt-20 p-12 bg-background-mid border border-white/5 rounded-[56px] text-center max-w-4xl mx-auto shadow-2xl relative overflow-hidden">
         <div className="absolute inset-0 bg-gradient-to-br from-brand-cyan/5 via-transparent to-brand-pink/5 opacity-50" />
         <div className="relative z-10 space-y-6">
            <div className="w-16 h-16 bg-white/5 rounded-[24px] flex items-center justify-center mx-auto text-brand-cyan shadow-xl"><Activity className="w-8 h-8" /></div>
            <h4 className="text-xl font-black tracking-tighter uppercase">Protocolo Umbra Reverse v1.5</h4>
            <p className="text-gray-500 text-xs max-w-xl mx-auto leading-relaxed">Analise a estrutura de sucesso dos seus concorrentes. Descubra ganchos, taxa de engajamento real e o potencial de monetização de qualquer vídeo no nicho Dark.</p>
         </div>
      </footer>
    </div>
  );
};

export default UmbraReverseTool;