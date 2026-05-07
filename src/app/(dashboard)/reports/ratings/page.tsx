"use client";

import React, { useState, useEffect } from 'react';
import { Star, MessageSquare, Calendar, Table as TableIcon, RefreshCcw, FileSpreadsheet, FileText } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/Button';
import { exportToExcel, exportToPDF } from '@/lib/export-utils';

interface Feedback {
  id: string;
  tableId: string;
  rating: number;
  comments: string | null;
  createdAt: string;
  table: {
    name: string;
  };
}

export default function RatingsReportPage() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFeedbacks = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/reports/ratings');
      const result = await res.json();
      if (result.success) {
        setFeedbacks(result.data);
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

  const averageRating = feedbacks.length > 0
    ? (feedbacks.reduce((acc, f) => acc + f.rating, 0) / feedbacks.length).toFixed(1)
    : 0;

  const handleExcelExport = () => {
    exportToExcel(
      feedbacks.map(f => ({
        Table: f.table.name,
        Rating: f.rating,
        Comments: f.comments || '',
        Date: new Date(f.createdAt).toLocaleDateString('en-IN'),
        Time: new Date(f.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      })),
      `customer-feedback-${new Date().toISOString().slice(0, 10)}`,
      'Customer Feedback'
    );
  };

  const handlePDFExport = () => {
    exportToPDF(
      ['Table', 'Rating', 'Comments', 'Date'],
      feedbacks.map(f => [
        f.table.name,
        `${f.rating}/5 ★`,
        f.comments || 'No comment',
        new Date(f.createdAt).toLocaleDateString('en-IN'),
      ]),
      `customer-feedback-${new Date().toISOString().slice(0, 10)}`,
      'Customer Feedback Report',
      `Average Rating: ${averageRating}/5 | Total Responses: ${feedbacks.length}`
    );
  };

  return (
    <div className="space-y-8 pb-10">
      <PageHeader
        title="Customer Feedback"
        subtitle="Insights from table QR scans"
        showBack
        backUrl="/reports"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleExcelExport} disabled={feedbacks.length === 0} className="rounded-xl gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 text-[10px] font-black uppercase h-9 px-3">
              <FileSpreadsheet size={14} /> Excel
            </Button>
            <Button variant="outline" onClick={handlePDFExport} disabled={feedbacks.length === 0} className="rounded-xl gap-2 border-rose-200 text-rose-700 hover:bg-rose-50 dark:border-rose-800 dark:text-rose-400 text-[10px] font-black uppercase h-9 px-3">
              <FileText size={14} /> PDF
            </Button>
            <Button variant="outline" onClick={fetchFeedbacks} disabled={loading} className="rounded-xl gap-2 h-9">
              <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
              Refresh
            </Button>
          </div>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center mb-4">
            <Star className="text-amber-500 fill-amber-500" size={24} />
          </div>
          <h3 className="text-4xl font-black text-slate-900 dark:text-white mb-1">{averageRating}</h3>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Average Rating</p>
        </div>
        
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mb-4">
            <MessageSquare className="text-blue-500" size={24} />
          </div>
          <h3 className="text-4xl font-black text-slate-900 dark:text-white mb-1">{feedbacks.length}</h3>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Feedbacks</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-2xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center mb-4">
            <TableIcon className="text-green-500" size={24} />
          </div>
          <h3 className="text-4xl font-black text-slate-900 dark:text-white mb-1">
            {new Set(feedbacks.map(f => f.tableId)).size}
          </h3>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Tables</p>
        </div>
      </div>

      {/* Feedbacks List */}
      <div className="space-y-4">
        <div className="flex items-center gap-4 px-2">
          <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.3em]">Recent Feedbacks</h2>
          <div className="h-px bg-slate-100 dark:bg-slate-800 flex-1" />
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-48 bg-slate-100 dark:bg-slate-800/50 rounded-[2rem] animate-pulse" />
            ))}
          </div>
        ) : feedbacks.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-dashed border-slate-200 dark:border-slate-800 py-20 text-center">
            <p className="text-slate-400 font-bold uppercase tracking-widest">No feedback received yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {feedbacks.map((feedback) => (
              <div key={feedback.id} className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center font-black text-xs">
                      {feedback.table.name}
                    </div>
                    <div>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star 
                            key={s} 
                            size={14} 
                            className={s <= feedback.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200 dark:text-slate-700'} 
                          />
                        ))}
                      </div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                        Table Feedback
                      </p>
                    </div>
                  </div>
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-tighter flex items-center gap-1 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-full">
                    <Calendar size={10} />
                    {new Date(feedback.createdAt).toLocaleDateString()} {new Date(feedback.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                {feedback.comments ? (
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl italic text-slate-600 dark:text-slate-300 text-xs leading-relaxed border-l-4 border-amber-400">
                    "{feedback.comments}"
                  </div>
                ) : (
                  <p className="text-[10px] font-bold text-slate-300 uppercase italic">No comments provided</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
