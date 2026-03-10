
import React, { useState } from 'react';
import {
  Music,
  Search,
  Download,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Video,
  User,
  FileText,
  Youtube,
  Heart,
  MessageCircle
} from 'lucide-react';

interface VideoData {
  author: {
    unique_id: string;
  };
  title: string;
  play: string;
  hdplay?: string;
  wmplay?: string;
}

const TiktokDownloaderTool: React.FC = () => {
  const [url, setUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<{ type: 'info' | 'success' | 'error' | null, message: string }>({ type: null, message: '' });
  const [videoData, setVideoData] = useState<VideoData | null>(null);
  const [downloadingUrl, setDownloadingUrl] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!url.trim()) {
      setStatus({ type: 'error', message: '❌ Cole o link do TikTok primeiro!' });
      return;
    }

    if (!url.includes('tiktok')) {
      setStatus({ type: 'error', message: '❌ Link inválido! Use um link do TikTok' });
      return;
    }

    setIsProcessing(true);
    setStatus({ type: 'info', message: '🔄 Buscando vídeo...' });
    setVideoData(null);

    try {
      const apiUrl = `https://www.tikwm.com/api/?url=${encodeURIComponent(url)}&hd=1`;
      const response = await fetch(apiUrl);
      const data = await response.json();

      if (data.code === 0 && data.data) {
        setVideoData(data.data);
        setStatus({ type: 'success', message: '✅ Vídeo encontrado! Escolha a qualidade:' });
      } else {
        throw new Error(data.msg || 'Erro ao processar vídeo');
      }
    } catch (err: any) {
      console.error(err);
      setStatus({ type: 'error', message: `❌ Erro: ${err.message}. Tente outro link.` });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = async (videoUrl: string, label: string) => {
    setDownloadingUrl(videoUrl);
    setStatus({ type: 'info', message: `📥 Baixando (${label})...` });

    try {
      // Usar proxy ou fetch direto (tikwm urls geralmente permitem CORS ou o navegador lida bem com blobs)
      const response = await fetch(videoUrl);
      if (!response.ok) throw new Error('Falha no download');

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `@${videoData?.author?.unique_id || 'umbra'}_tiktok_${Date.now()}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Cleanup
      window.URL.revokeObjectURL(blobUrl);
      setStatus({ type: 'success', message: `✅ Download (${label}) concluído!` });
    } catch (err) {
      console.error('Download error:', err);
      // Fallback: abrir em nova aba se o blob falhar (ex: CORS)
      window.open(videoUrl, '_blank');
      setStatus({ type: 'success', message: `✅ Download (${label}) aberto em nova aba!` });
    } finally {
      setDownloadingUrl(null);
    }
  };

  return (
    <div className="font-rajdhani space-y-8 animate-in fade-in duration-700 pb-20 max-w-2xl mx-auto">
      <header className="text-center">
        <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-brand-cyan via-brand-purple to-brand-pink rounded-[32px] mb-6 shadow-2xl animate-pulse ring-4 ring-white/5">
          <Music className="w-12 h-12 text-white" />
        </div>
        <h1 className="text-4xl font-black tracking-tighter mb-2 bg-gradient-to-r from-brand-cyan via-brand-purple to-brand-pink bg-clip-text text-transparent uppercase">
          Umbra TikTok Downloader
        </h1>
        <p className="text-gray-500 font-medium">Baixe vídeos do TikTok sem marca d'água instantaneamente</p>
      </header>

      <div className="bg-background-mid border border-white/5 rounded-[40px] p-10 shadow-2xl space-y-8 relative overflow-hidden backdrop-blur-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-cyan/5 blur-[100px] -z-10" />

        <div className="space-y-4">
          <div className="relative">
            <input
              type="text"
              value={url}
              onChange={e => setUrl(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && !isProcessing && handleSearch()}
              placeholder="Cole o link do TikTok aqui..."
              className="w-full bg-background-deep border-2 border-white/10 rounded-2xl p-6 text-sm font-bold text-white focus:border-brand-cyan/50 outline-none transition-all placeholder:text-gray-700"
            />
          </div>

          <button
            onClick={handleSearch}
            disabled={isProcessing || !url.trim()}
            className="w-full py-5 bg-gradient-to-r from-brand-cyan via-brand-purple to-brand-pink text-white font-orbitron text-xs font-black tracking-[0.3em] rounded-2xl shadow-xl hover:shadow-[0_0_30px_rgba(0,245,255,0.3)] transition-all disabled:opacity-30 uppercase flex items-center justify-center gap-3 active:scale-95"
          >
            {isProcessing ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
            Buscar Vídeo
          </button>
        </div>

        {status.type && (
          <div className={`p-5 rounded-2xl border flex items-center gap-4 animate-in slide-in-from-top-2 duration-300 ${status.type === 'info' ? 'bg-brand-cyan/5 border-brand-cyan/20 text-brand-cyan' :
            status.type === 'success' ? 'bg-brand-green/10 border-brand-green/20 text-brand-green' :
              'bg-brand-pink/10 border-brand-pink/20 text-brand-pink'
            }`}>
            {status.type === 'info' ? <RefreshCw className="w-5 h-5 animate-spin" /> :
              status.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span className="text-xs font-bold uppercase tracking-widest">{status.message}</span>
          </div>
        )}

        {videoData && (
          <div className="bg-background-deep/50 border border-brand-cyan/20 rounded-[32px] p-8 space-y-6 animate-in zoom-in-95 duration-500">
            <div className="flex items-center gap-4 mb-2">
              <Video className="w-6 h-6 text-brand-cyan" />
              <h3 className="font-orbitron text-[10px] font-black uppercase text-white tracking-widest">Informações do Vídeo</h3>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center py-4 border-b border-white/5">
                <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest flex items-center gap-2"><User className="w-3 h-3" /> Criador</span>
                <span className="text-sm font-black text-brand-cyan">@{videoData.author.unique_id}</span>
              </div>
              <div className="flex justify-between items-start py-4 border-b border-white/5 gap-6 text-right">
                <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest flex items-center gap-2 shrink-0"><FileText className="w-3 h-3" /> Descrição</span>
                <span className="text-xs font-bold text-gray-400 line-clamp-2">{videoData.title || 'Sem descrição'}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 pt-4">
              {videoData.hdplay && (
                <button
                  onClick={() => handleDownload(videoData.hdplay!, 'HD')}
                  disabled={!!downloadingUrl}
                  className="w-full py-4 bg-gradient-to-r from-brand-cyan to-brand-purple text-background-deep font-black rounded-xl text-[10px] uppercase tracking-widest shadow-xl transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {downloadingUrl === videoData.hdplay ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  HD (Sem Marca d'água)
                </button>
              )}
              <button
                onClick={() => handleDownload(videoData.play, 'Normal')}
                disabled={!!downloadingUrl}
                className="w-full py-4 bg-white/5 border border-white/10 text-white font-black rounded-xl text-[10px] uppercase tracking-widest transition-all hover:bg-white/10 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {downloadingUrl === videoData.play ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4 text-brand-purple" />}
                Qualidade Normal
              </button>
              {videoData.wmplay && (
                <button
                  onClick={() => handleDownload(videoData.wmplay!, 'Rápido')}
                  disabled={!!downloadingUrl}
                  className="w-full py-4 bg-white/5 border border-white/10 text-gray-500 font-black rounded-xl text-[10px] uppercase tracking-widest transition-all hover:text-white flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {downloadingUrl === videoData.wmplay ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  Download Rápido (Com WM)
                </button>
              )}
            </div>
          </div>
        )}

        <div className="bg-brand-cyan/5 border border-brand-cyan/20 rounded-[28px] p-6 space-y-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-4 h-4 text-brand-cyan" />
            <h4 className="font-orbitron text-[10px] font-black uppercase text-white tracking-widest">Como Usar</h4>
          </div>
          <ol className="text-xs text-gray-500 space-y-2 list-decimal ml-4 font-medium">
            <li>Abra o TikTok e copie o link do vídeo</li>
            <li>Cole o link no campo de busca acima</li>
            <li>Clique em "Buscar Vídeo"</li>
            <li>Escolha a qualidade desejada e baixe!</li>
          </ol>
        </div>
      </div>

      {/* Social Links Section */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <a href="https://www.youtube.com/channel/UC3ljRCyGc_Atq6ld8iTVYfw" target="_blank" rel="noopener noreferrer" className="p-4 bg-background-mid border border-white/5 rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-brand-purple/40 transition-all group">
          <Youtube className="w-5 h-5 text-gray-600 group-hover:text-brand-purple transition-colors" />
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-600">Canal Umbra</span>
        </a>
        <a href="https://livepix.gg/cicerosantos" target="_blank" rel="noopener noreferrer" className="p-4 bg-background-mid border border-white/5 rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-brand-pink/40 transition-all group">
          <Heart className="w-5 h-5 text-gray-600 group-hover:text-brand-pink transition-colors" />
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-600">Apoiar</span>
        </a>
        <a href="https://wa.me/message/EF4DJTI6JTOTH1" target="_blank" rel="noopener noreferrer" className="p-4 bg-background-mid border border-white/5 rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-brand-cyan/40 transition-all group">
          <MessageCircle className="w-5 h-5 text-gray-600 group-hover:text-brand-cyan transition-colors" />
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-600">Suporte</span>
        </a>
      </div>
    </div>
  );
};

export default TiktokDownloaderTool;
