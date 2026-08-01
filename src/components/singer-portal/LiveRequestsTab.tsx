import React from 'react';
import { Clock, Loader2, CheckCircle2 } from 'lucide-react';

interface SongRequest {
  id: string;
  songTitle: string;
  artist: string | null;
  guestName: string;
  roomNo: string | null;
  status: string;
}

interface LiveRequestsTabProps {
  activePerformance: {
    id: string;
    status: string;
  } | null;
  songRequests: SongRequest[];
  handleRequestAction: (requestId: string, status: 'ACCEPTED' | 'PLAYED' | 'DECLINED') => Promise<void>;
}

export const LiveRequestsTab = ({
  activePerformance,
  songRequests,
  handleRequestAction
}: LiveRequestsTabProps) => {
  return (
    <div className="space-y-4">
      {activePerformance?.status !== 'LIVE' ? (
        <div className="p-8 text-center bg-slate-900/40 border border-slate-800/80 rounded-2xl text-slate-500">
          <Clock size={36} className="mx-auto mb-2 text-slate-700" />
          <p className="font-bold text-sm">Session is Offline.</p>
          <p className="text-xs text-slate-600 mt-1">Start a Live Session above to begin receiving song requests from guests.</p>
        </div>
      ) : songRequests.length === 0 ? (
        <div className="p-8 text-center bg-slate-900/40 border border-slate-800/80 rounded-2xl text-slate-500">
          <Loader2 className="animate-spin mx-auto mb-2 text-slate-750" size={24} />
          <p className="font-bold text-sm">Listening for requests...</p>
          <p className="text-xs text-slate-650 mt-1">Guests will submit requests from the digital menu dashboard.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {songRequests.map(req => (
            <div key={req.id} className={`p-4 rounded-xl border flex flex-wrap gap-4 justify-between items-center transition-all ${
              req.status === 'PENDING' ? 'bg-[#090f1e]/85 border-slate-800' :
              req.status === 'ACCEPTED' ? 'bg-indigo-950/20 border-indigo-500/20' :
              req.status === 'PLAYED' ? 'bg-emerald-950/10 border-emerald-500/10 opacity-70' :
              'bg-slate-950 border-slate-900 opacity-50'
            }`}>
              <div>
                <h4 className="font-black text-sm text-white">"{req.songTitle}"</h4>
                {req.artist && <p className="text-xs text-slate-400">by {req.artist}</p>}
                <div className="flex gap-3 text-[10px] text-slate-500 mt-2 font-bold uppercase">
                  <span>Guest: {req.guestName}</span>
                  {req.roomNo && <span>Room: {req.roomNo}</span>}
                </div>
              </div>

              <div className="flex gap-2">
                {req.status === 'PENDING' && (
                  <>
                    <button 
                      onClick={() => handleRequestAction(req.id, 'ACCEPTED')}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-[10px] font-black uppercase hover:bg-indigo-500 transition-colors"
                    >
                      Accept
                    </button>
                    <button 
                      onClick={() => handleRequestAction(req.id, 'DECLINED')}
                      className="px-3 py-1.5 rounded-lg border border-slate-800 text-slate-400 hover:text-white text-[10px] font-black uppercase transition-colors"
                    >
                      Decline
                    </button>
                  </>
                )}
                {req.status === 'ACCEPTED' && (
                  <button 
                    onClick={() => handleRequestAction(req.id, 'PLAYED')}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-[10px] font-black uppercase hover:bg-emerald-500 transition-colors flex items-center gap-1"
                  >
                    <CheckCircle2 size={11} /> Mark Played
                  </button>
                )}
                {req.status !== 'PENDING' && req.status !== 'ACCEPTED' && (
                  <span className={`px-2.5 py-1 rounded text-[9px] font-black uppercase tracking-wider ${
                    req.status === 'PLAYED' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-500'
                  }`}>
                    {req.status}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
