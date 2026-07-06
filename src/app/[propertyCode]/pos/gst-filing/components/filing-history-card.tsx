'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import {
  FileText, RefreshCw, Loader2, FileJson, Download, BadgeCheck, Clock, Trash2
} from 'lucide-react';

function fmt(n: number) {
  return new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

interface FilingHistoryCardProps {
  filings: any[];
  historyLoading: boolean;
  loadHistory: () => Promise<void>;
  handleDownload: (id: string) => void;
  handleMarkSubmitted: (id: string) => Promise<void>;
  handleDelete: (id: string) => Promise<void>;
  formatPeriod: (fp: string) => string;
}

export function FilingHistoryCard({
  filings,
  historyLoading,
  loadHistory,
  handleDownload,
  handleMarkSubmitted,
  handleDelete,
  formatPeriod,
}: FilingHistoryCardProps) {
  return (
    <Card className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-gray-100 dark:bg-slate-800 p-3 rounded-xl">
            <FileText className="text-gray-500 dark:text-slate-400" size={22} />
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Filing History</h2>
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-tight">Track all your past GST filings</p>
          </div>
        </div>
        <button onClick={loadHistory} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
          <RefreshCw size={15} className="text-gray-400" />
        </button>
      </div>

      {historyLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="animate-spin text-gray-400" size={24} />
        </div>
      ) : filings.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <FileJson size={32} className="mx-auto mb-2 opacity-30" />
          <p className="text-[11px] font-black uppercase tracking-widest">No filings found yet</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 dark:border-slate-800">
                {['Period', 'Type', 'Invoices', 'Total Amount', 'Status', 'Generated', 'Actions'].map(h => (
                  <th key={h} className="text-left text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pb-3 pr-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-slate-800/50">
              {filings.map((f) => (
                <tr key={f.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/40 transition-colors border-b border-slate-50 dark:border-slate-800/50">
                  <td className="py-3 pr-4 text-sm font-bold text-slate-800 dark:text-slate-200">{formatPeriod(f.filingMonth)}</td>
                  <td className="py-3 pr-4">
                    <span className="px-2 py-1 bg-pos-primary/10 text-pos-primary rounded text-[10px] font-black uppercase">{f.returnType}</span>
                  </td>
                  <td className="py-3 pr-4 text-sm text-slate-600 dark:text-slate-400 font-bold">{f.invoiceCount}</td>
                  <td className="py-3 pr-4 text-sm font-bold text-slate-800 dark:text-slate-200">₹{fmt(f.totalAmount)}</td>
                  <td className="py-3 pr-4">
                    <span className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-black uppercase w-fit ${
                      f.status === 'SUBMITTED'
                        ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400'
                    }`}>
                      {f.status === 'SUBMITTED' ? <BadgeCheck size={11} /> : <Clock size={11} />}
                      {f.status}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-[11px] text-slate-400 dark:text-slate-500 font-bold">
                    {new Date(f.generatedAt).toLocaleDateString('en-IN')}
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDownload(f.id)}
                        className="p-2 rounded-lg bg-gray-100 dark:bg-slate-800 hover:bg-pos-primary hover:text-white transition-all text-gray-500 dark:text-slate-400"
                        title="Download JSON"
                      >
                        <Download size={13} />
                      </button>
                      {f.status === 'DRAFT' && (
                        <>
                          <button
                            onClick={() => handleMarkSubmitted(f.id)}
                            className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-500 hover:text-white transition-all text-emerald-600 dark:text-emerald-400"
                            title="Mark as Submitted"
                          >
                            <BadgeCheck size={13} />
                          </button>
                          <button
                            onClick={() => handleDelete(f.id)}
                            className="p-2 rounded-lg bg-red-50 dark:bg-red-500/10 hover:bg-red-500 hover:text-white transition-all text-red-400 dark:text-red-400"
                            title="Delete Draft"
                          >
                            <Trash2 size={13} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
