import React from 'react';
import { Target, ExternalLink, X, Eye, EyeOff } from 'lucide-react';
import { type PhantomChannel, fmtNum } from './phantom/phantomData';

interface Props {
  ch: PhantomChannel;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  onIgnore: () => void;
}

const ChannelCard: React.FC<Props> = ({ ch, isExpanded, onToggle, onIgnore }) => {
  const metrics = [
    { label: 'Score', value: `${ch.outlierScore.toFixed(1)}x`, bold: true },
    { label: 'Views', value: fmtNum(ch.avgViews) },
    { label: 'Likes', value: fmtNum(ch.likes) },
    { label: 'Comentários', value: fmtNum(ch.comments) },
    { label: 'Inscritos', value: ch.subscriberLabel },
    { label: 'Publicado', value: ch.videoPublishedAt },
    { label: 'Canal Criado', value: ch.channelCreatedAt },
  ];

  const [avatarError, setAvatarError] = React.useState(false);

  return (
    <div
      className={`w-full rounded-2xl transition-all duration-500 ${
        isExpanded
          ? 'border-2 border-black shadow-xl p-6'
          : 'border border-gray-200 hover:border-black p-4'
      } bg-white`}
    >
      {/* HEADER */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4 cursor-pointer group" onClick={onToggle}>
          <div className="relative w-12 h-12 rounded-full overflow-hidden border border-gray-200 bg-gray-100 flex items-center justify-center shrink-0 group-hover:border-black transition-all">
            {!avatarError && ch.avatar ? (
              <img
                src={ch.avatar}
                alt=""
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                onError={() => setAvatarError(true)}
              />
            ) : (
              <span className="text-sm font-black text-black">
                {ch.name.match(/[a-zA-Z]/) ? ch.name.match(/[a-zA-Z]/g)?.slice(0, 2).join('').toUpperCase() : '??'}
              </span>
            )}
          </div>
          <div>
            <h3 className="text-base md:text-lg font-black text-gray-900 leading-tight group-hover:text-black transition-colors">
              {ch.name}
            </h3>
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">{ch.subscriberLabel} inscritos</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onToggle}
            className="p-2 rounded-lg bg-white border border-gray-200 text-gray-500 hover:bg-black hover:text-white hover:border-black transition-all"
            title={isExpanded ? 'Recolher' : 'Expandir Inteligência'}
          >
            {isExpanded ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
          <button
            onClick={onIgnore}
            className="p-2 rounded-lg bg-white border border-gray-200 text-gray-500 hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-all"
            title="Ignorar Canal"
          >
            <X className="w-4 h-4" />
          </button>
          <a
            href={ch.channelUrl}
            target="_blank"
            rel="noreferrer"
            className="p-2 rounded-lg bg-white border border-gray-200 text-gray-500 hover:bg-black hover:text-white hover:border-black transition-all"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* EXPANDED CONTENT */}
      <div
        className={`transition-all duration-500 origin-top overflow-hidden ${
          isExpanded ? 'max-h-[2000px] opacity-100 mt-8' : 'max-h-0 opacity-0'
        }`}
      >
        {/* METRICS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mb-8">
          {metrics.map((m, i) => (
            <div
              key={i}
              className={`flex flex-col items-center justify-center py-4 px-1 rounded-xl border transition-all ${
                m.bold
                  ? 'bg-black border-black'
                  : 'bg-gray-50 border-gray-200 hover:border-black'
              }`}
            >
              <span className={`text-[9px] font-black uppercase tracking-wider mb-2 text-center whitespace-nowrap ${m.bold ? 'text-white/60' : 'text-gray-400'}`}>
                {m.label}
              </span>
              <span className={`text-base md:text-lg font-black tracking-tight text-center ${m.bold ? 'text-white' : 'text-gray-900'}`}>
                {m.value}
              </span>
            </div>
          ))}
        </div>

        {/* VIDEOS */}
        <div className="space-y-4">
          <h4 className="text-[10px] font-black text-black uppercase tracking-[0.3em] border-b border-black/10 pb-3">
            Vídeos Mais Populares
          </h4>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {ch.topVideos.map((v, i) => {
              const [thumbError, setThumbError] = React.useState(false);
              return (
                <div key={i} className="group cursor-pointer">
                  <div className="relative aspect-video rounded-xl overflow-hidden mb-2 border border-gray-200 bg-gray-100 group-hover:border-black transition-all">
                    {!thumbError && v.thumbnail ? (
                      <img
                        src={v.thumbnail}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        alt=""
                        onError={() => setThumbError(true)}
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                        <Target className="w-6 h-6 text-gray-300" />
                      </div>
                    )}
                    <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black text-[9px] font-black text-white">
                      {v.duration}
                    </div>
                  </div>
                  <p className="text-[11px] font-black text-gray-900 line-clamp-2 leading-snug group-hover:text-black transition-colors mb-1">
                    {v.title}
                  </p>
                  <div className="flex flex-col text-[9px] text-gray-400 font-black uppercase tracking-wider">
                    <span>{v.views} views</span>
                    <span>• {v.timeAgo}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* COLLAPSED HINT */}
      {!isExpanded && (
        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
          <div className="flex gap-4">
            <div className="flex flex-col">
              <span className="text-[8px] text-gray-400 uppercase font-black tracking-widest">Outlier</span>
              <span className="text-xs font-black text-black">{ch.outlierScore.toFixed(1)}x</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[8px] text-gray-400 uppercase font-black tracking-widest">Nível</span>
              <span className="text-xs font-black text-gray-900">{ch.level}</span>
            </div>
          </div>
          <button
            onClick={onToggle}
            className="text-[9px] font-black text-black uppercase tracking-widest hover:underline underline-offset-2"
          >
            Ver Inteligência Completa
          </button>
        </div>
      )}
    </div>
  );
};

export default ChannelCard;
