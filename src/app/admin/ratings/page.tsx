"use client";

import React, { useState, useEffect } from 'react';
import { Star, MessageSquare, Calendar, Building2, RefreshCcw, Search } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/Button';

interface Feedback {
  id: string;
  tableId: string;
  rating: number;
  comments: string | null;
  createdAt: string;
  table: {
    name: string;
  };
  property: {
    name: string;
    brandName: string | null;
  };
}

export default function AdminRatingsPage() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [filtered, setFiltered] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchFeedbacks = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/ratings');
      const result = await res.json();
      if (result.success) {
        setFeedbacks(result.data);
        setFiltered(result.data);
      }
    } catch (err) {
      console.error('Failed to fetch feedbacks', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  useEffect(() => {
    const s = search.toLowerCase();
    setFiltered(
      feedbacks.filter(f => 
        f.property.name.toLowerCase().includes(s) || 
        (f.property.brandName && f.property.brandName.toLowerCase().includes(s)) ||
        f.table.name.toLowerCase().includes(s) ||
        (f.comments && f.comments.toLowerCase().includes(s))
      )
    );
  }, [search, feedbacks]);

  return (
    <div className="p-6 space-y-8">
      <PageHeader
        title="All Restaurant Feedbacks"
        subtitle="Global insights across all properties"
        actions={
          <div className="flex gap-3">
             <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input 
                   type="text"
                   placeholder="Search restaurant or table..."
                   className="pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm w-64"
                   value={search}
                   onChange={(e) => setSearch(e.target.value)}
                />
             </div>
             <Button variant="outline" onClick={fetchFeedbacks} disabled={loading} className="rounded-xl gap-2">
               <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
               Sync
             </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          [1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-100 dark:bg-slate-800 animate-pulse rounded-2xl" />)
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200">
             <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">No feedbacks found</p>
          </div>
        ) : (
          <div className="overflow-x-auto bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800">
                  <th className="p-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Restaurant</th>
                  <th className="p-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Table</th>
                  <th className="p-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Rating</th>
                  <th className="p-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Comment</th>
                  <th className="p-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                {filtered.map((feedback) => (
                  <tr key={feedback.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="p-5">
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-500">
                            <Building2 size={16} />
                         </div>
                         <div className="font-bold text-slate-700 dark:text-slate-200 text-sm">
                           {feedback.property.brandName || feedback.property.name}
                         </div>
                      </div>
                    </td>
                    <td className="p-5">
                      <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-xs font-bold text-slate-500">
                        {feedback.table.name}
                      </span>
                    </td>
                    <td className="p-5">
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star 
                            key={s} 
                            size={12} 
                            className={s <= feedback.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200 dark:text-slate-700'} 
                          />
                        ))}
                      </div>
                    </td>
                    <td className="p-5">
                       <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 max-w-xs font-medium">
                         {feedback.comments || 'No comment'}
                       </p>
                    </td>
                    <td className="p-5">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                          {new Date(feedback.createdAt).toLocaleDateString()}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(feedback.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
