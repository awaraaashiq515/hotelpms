import React from 'react';
import { Star } from 'lucide-react';

interface Feedback {
  id: string;
  guestName: string | null;
  rating: number;
  comment: string | null;
  createdAt: string;
}

interface ReviewsTabProps {
  feedbacks: Feedback[];
}

export const ReviewsTab = ({ feedbacks }: ReviewsTabProps) => {
  return (
    <div className="space-y-4">
      {feedbacks.length === 0 ? (
        <div className="p-8 text-center text-slate-500 border border-slate-800 rounded-2xl">
          No guest feedback reviews received yet.
        </div>
      ) : (
        feedbacks.map(f => (
          <div key={f.id} className="p-4 rounded-xl bg-[#090f1e]/85 border border-slate-800 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-black text-white">{f.guestName || 'Anonymous Guest'}</span>
              <div className="flex gap-0.5 text-amber-400">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={11} fill={i < f.rating ? 'currentColor' : 'none'} className={i < f.rating ? 'text-amber-400' : 'text-slate-700'} />
                ))}
              </div>
            </div>
            {f.comment && <p className="text-xs text-slate-350 leading-relaxed italic">"{f.comment}"</p>}
            <span className="text-[9px] text-slate-600 block">{new Date(f.createdAt).toLocaleDateString()}</span>
          </div>
        ))
      )}
    </div>
  );
};
