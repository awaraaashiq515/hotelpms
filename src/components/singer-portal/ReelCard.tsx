import React, { useRef, useState, useEffect } from 'react';
import { Trash2, Play, Video } from 'lucide-react';

interface ReelCardProps {
  vid: {
    id: string;
    title: string;
    videoUrl: string;
    description: string | null;
  };
  isSingerDashboard?: boolean;
  onDelete?: () => void;
}

export const ReelCard = ({ vid, isSingerDashboard, onDelete }: ReelCardProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = true;
      videoRef.current.defaultMuted = true;
    }
  }, []);

  const handleMouseEnter = () => {
    if (typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches) return;
    setIsPlaying(true);
    if (videoRef.current) {
      videoRef.current.muted = true;
      videoRef.current.play().catch(() => {});
    }
  };

  const handleMouseLeave = () => {
    if (typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches) return;
    setIsPlaying(false);
    if (videoRef.current) {
      videoRef.current.pause();
    }
  };

  const handleToggle = () => {
    if (videoRef.current) {
      videoRef.current.muted = true;
      if (videoRef.current.paused) {
        setIsPlaying(true);
        videoRef.current.play().catch(() => {});
      } else {
        setIsPlaying(false);
        videoRef.current.pause();
      }
    }
  };

  const isLocalVideo = vid.videoUrl.startsWith('/api/images/') || vid.videoUrl.match(/\.(mp4|webm|ogg|mov)$/i);

  return (
    <div 
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleToggle}
      className="relative aspect-[9/16] rounded-3xl bg-slate-950 overflow-hidden border border-slate-800/80 group shadow-lg flex flex-col justify-end cursor-pointer"
    >
      {isSingerDashboard && onDelete && (
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }} 
          className="absolute top-3 right-3 z-20 p-2 rounded-xl bg-black/60 border border-slate-800 text-rose-500 hover:text-rose-450 hover:bg-black/80 transition-colors"
        >
          <Trash2 size={12} />
        </button>
      )}

      {isLocalVideo ? (
        <>
          <video 
            ref={videoRef}
            loop
            muted
            playsInline
            preload="metadata"
            className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none"
            src={vid.videoUrl}
          />
          {!isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 z-10 transition-opacity duration-300 pointer-events-none">
              <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                <Play className="text-white fill-white ml-0.5" size={18} />
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-[#090f1e] to-[#020617]/90 p-4 text-center z-0">
          <Video className="text-slate-700 mb-2 animate-pulse" size={28} />
          <span className="text-[9px] font-black uppercase text-indigo-400">YouTube Cover Clip</span>
          <a href={vid.videoUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-slate-400 hover:text-white underline mt-2 block z-10" onClick={e => e.stopPropagation()}>Play Link ↗</a>
        </div>
      )}

      <div className="relative z-10 p-4 bg-gradient-to-t from-black/95 via-black/40 to-transparent pt-12 text-left pointer-events-none">
        <h4 className="text-xs font-black text-white drop-shadow-md flex items-center gap-1.5"><Play size={11} fill="currentColor" className="text-indigo-400" /> {vid.title}</h4>
        {vid.description && <p className="text-[10px] text-slate-300 mt-1 drop-shadow">{vid.description}</p>}
      </div>
    </div>
  );
};
