'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  Bell, PlusCircle, X, TrendingUp, BadgeCheck,
  AlarmClock, AlertCircle, Loader2, Clock, Trash2
} from 'lucide-react';

const MONTHS = [
  { val: '01', label: 'January — Jan' },
  { val: '02', label: 'February — Feb' },
  { val: '03', label: 'March — Mar' },
  { val: '04', label: 'April — Apr' },
  { val: '05', label: 'May — May' },
  { val: '06', label: 'June — Jun' },
  { val: '07', label: 'July — Jul' },
  { val: '08', label: 'August — Aug' },
  { val: '09', label: 'September — Sep' },
  { val: '10', label: 'October — Oct' },
  { val: '11', label: 'November — Nov' },
  { val: '12', label: 'December — Dec' },
];

const GST_RETURN_TYPES = [
  { type: 'GSTR-1', name: 'GSTR-1', desc: 'Outward Supplies', dueDayOfMonth: 11, color: 'blue', freq: 'Monthly' },
  { type: 'GSTR-3B', name: 'GSTR-3B', desc: 'Monthly Summary Return', dueDayOfMonth: 20, color: 'purple', freq: 'Monthly' },
  { type: 'GSTR-9', name: 'GSTR-9', desc: 'Annual Return', dueDayOfMonth: 31, color: 'emerald', freq: 'Annual' },
  { type: 'GSTR-9C', name: 'GSTR-9C', desc: 'Reconciliation Statement', dueDayOfMonth: 31, color: 'orange', freq: 'Annual' },
  { type: 'GSTR-4', name: 'GSTR-4', desc: 'Composition Dealer Annual', dueDayOfMonth: 30, color: 'pink', freq: 'Annual' },
];

const currentDate = new Date();
const prevMonth = currentDate.getMonth() === 0 
  ? '12' 
  : String(currentDate.getMonth()).padStart(2, '0');
const prevYear = currentDate.getMonth() === 0
  ? String(currentDate.getFullYear() - 1)
  : currentDate.getFullYear().toString();

interface DueDatesCardProps {
  showToast: (type: 'success' | 'error', msg: string) => void;
  formatPeriod: (fp: string) => string;
}

export function DueDatesCard({ showToast, formatPeriod }: DueDatesCardProps) {
  const [returnDues, setReturnDues] = useState<any[]>([]);
  const [duesLoading, setDuesLoading] = useState(true);
  const [showAddDue, setShowAddDue] = useState(false);
  const [dueForm, setDueForm] = useState({
    returnType: 'GSTR-1',
    period: `${prevMonth}${prevYear}`,
    dueDate: '',
    notes: '',
  });
  const [dueSubmitting, setDueSubmitting] = useState(false);

  const loadReturnDues = async () => {
    setDuesLoading(true);
    try {
      const r = await fetch('/api/gst/return-dues');
      const d = await r.json();
      if (d.success) {
        const now = new Date();
        const updated = (d.data || []).map((due: any) => ({
          ...due,
          status: due.status === 'FILED' ? 'FILED'
            : new Date(due.dueDate) < now ? 'OVERDUE'
            : 'PENDING',
        }));
        setReturnDues(updated);
      }
    } catch {}
    setDuesLoading(false);
  };

  const handleAddDue = async () => {
    if (!dueForm.returnType || !dueForm.period || !dueForm.dueDate) {
      showToast('error', 'Return type, period aur due date zaroori hai!');
      return;
    }
    setDueSubmitting(true);
    try {
      const r = await fetch('/api/gst/return-dues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dueForm),
      });
      const d = await r.json();
      if (d.success) {
        showToast('success', 'GST Return Due Date add ho gayi!');
        setShowAddDue(false);
        setDueForm({ returnType: 'GSTR-1', period: `${prevMonth}${prevYear}`, dueDate: '', notes: '' });
        loadReturnDues();
      } else {
        showToast('error', d.message || 'Error adding due date');
      }
    } catch {
      showToast('error', 'Network error');
    }
    setDueSubmitting(false);
  };

  const handleMarkFiled = async (id: string) => {
    const r = await fetch('/api/gst/return-dues', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, filedDate: new Date().toISOString() }),
    });
    const d = await r.json();
    if (d.success) {
      showToast('success', 'Return FILED mark ho gaya! ✅');
      loadReturnDues();
    }
  };

  const handleDeleteDue = async (id: string) => {
    if (!confirm('Yeh entry delete karein?')) return;
    const r = await fetch(`/api/gst/return-dues?id=${id}`, { method: 'DELETE' });
    const d = await r.json();
    if (d.success) {
      showToast('success', 'Entry deleted');
      loadReturnDues();
    }
  };

  useEffect(() => {
    loadReturnDues();
  }, []);

  const years = Array.from({ length: 5 }, (_, i) => String(currentDate.getFullYear() - i));

  const totalDues = returnDues.length;
  const filedDues = returnDues.filter(d => d.status === 'FILED').length;
  const pendingDues = returnDues.filter(d => d.status === 'PENDING').length;
  const overdueDues = returnDues.filter(d => d.status === 'OVERDUE').length;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="bg-amber-50 dark:bg-amber-500/10 p-3 rounded-xl">
            <Bell className="text-amber-500" size={20} />
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">GST Return Due Dates</h2>
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-tight">Sabhi GST returns ki due dates track karo</p>
          </div>
        </div>
        <button
          onClick={() => setShowAddDue(!showAddDue)}
          className="flex items-center gap-2 px-4 py-2 bg-pos-primary text-white rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-red-700 transition-colors"
        >
          {showAddDue ? <X size={13} /> : <PlusCircle size={13} />}
          {showAddDue ? 'Cancel' : 'Due Date Add Karo'}
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Total Returns', val: totalDues, icon: <TrendingUp size={14} />, color: 'blue' },
          { label: 'Filed ✅', val: filedDues, icon: <BadgeCheck size={14} />, color: 'emerald' },
          { label: 'Pending ⏳', val: pendingDues, icon: <AlarmClock size={14} />, color: 'amber' },
          { label: 'Overdue ❌', val: overdueDues, icon: <AlertCircle size={14} />, color: 'red' },
        ].map((s, i) => (
          <div key={i} className={`p-3 rounded-xl bg-${s.color}-50 dark:bg-${s.color}-500/10 border border-${s.color}-100 dark:border-${s.color}-500/20 flex items-center gap-3`}>
            <span className={`text-${s.color}-500`}>{s.icon}</span>
            <div>
              <p className={`text-[10px] font-black text-${s.color}-500 uppercase tracking-widest`}>{s.label}</p>
              <p className={`text-xl font-black text-${s.color}-700 dark:text-${s.color}-300`}>{s.val}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Add Due Date Form */}
      {showAddDue && (
        <div className="mb-5 p-5 rounded-2xl border border-dashed border-pos-primary/30 bg-pos-primary/5">
          <h3 className="text-[11px] font-black text-pos-primary uppercase tracking-widest mb-4">🗓 Nayi Due Date Add Karo</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Return Type</label>
              <select
                value={dueForm.returnType}
                onChange={e => setDueForm(f => ({ ...f, returnType: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary dark:text-slate-100"
              >
                {GST_RETURN_TYPES.map(t => (
                  <option key={t.type} value={t.type}>{t.name} - {t.desc}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Period (MM/YYYY)</label>
              <div className="flex gap-2">
                <select
                  value={dueForm.period.slice(0, 2)}
                  onChange={e => setDueForm(f => ({ ...f, period: e.target.value + f.period.slice(2) }))}
                  className="w-1/2 px-2 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-pos-primary/20 dark:text-slate-100"
                >
                  {MONTHS.map(m => <option key={m.val} value={m.val}>{m.label.split('—')[0].trim()}</option>)}
                </select>
                <select
                  value={dueForm.period.slice(2)}
                  onChange={e => setDueForm(f => ({ ...f, period: f.period.slice(0, 2) + e.target.value }))}
                  className="w-1/2 px-2 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-pos-primary/20 dark:text-slate-100"
                >
                  {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Due Date</label>
              <input
                type="date"
                value={dueForm.dueDate}
                onChange={e => setDueForm(f => ({ ...f, dueDate: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Notes (Optional)</label>
              <input
                type="text"
                placeholder="Koi notes..."
                value={dueForm.notes}
                onChange={e => setDueForm(f => ({ ...f, notes: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary dark:text-slate-100 placeholder:text-gray-300"
              />
            </div>
          </div>
          <div className="mt-4">
            <Button
              onClick={handleAddDue}
              disabled={dueSubmitting}
              className="bg-pos-primary hover:bg-red-700 text-white font-black tracking-widest px-6 py-2.5 rounded-xl shadow-md flex items-center gap-2 text-sm"
            >
              {dueSubmitting ? <Loader2 size={14} className="animate-spin" /> : <PlusCircle size={14} />}
              Due Date Save Karo
            </Button>
          </div>
        </div>
      )}

      {/* Due Dates Table */}
      {duesLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="animate-spin text-gray-400" size={24} />
        </div>
      ) : returnDues.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 dark:bg-slate-800/30 rounded-2xl">
          <Bell size={32} className="mx-auto mb-2 text-gray-300" />
          <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Abhi koi due date add nahi ki</p>
          <p className="text-[10px] text-gray-300 mt-1">Upar &quot;Due Date Add Karo&quot; button click karo</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 dark:border-slate-800">
                {['Return Type', 'Period', 'Due Date', 'Days Left', 'Status', 'Filed On', 'Actions'].map(h => (
                  <th key={h} className="text-left text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pb-3 pr-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-slate-800/50">
              {returnDues.map((due) => {
                const dueD = new Date(due.dueDate);
                const today = new Date();
                const diffMs = dueD.getTime() - today.getTime();
                const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
                const rtInfo = GST_RETURN_TYPES.find(t => t.type === due.returnType);

                return (
                  <tr key={due.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 pr-4">
                      <span className={`px-2 py-1 bg-${rtInfo?.color || 'blue'}-50 dark:bg-${rtInfo?.color || 'blue'}-500/10 text-${rtInfo?.color || 'blue'}-600 dark:text-${rtInfo?.color || 'blue'}-400 rounded text-[10px] font-black uppercase`}>
                        {due.returnType}
                      </span>
                      {rtInfo && <p className="text-[9px] text-gray-400 mt-0.5">{rtInfo.desc}</p>}
                    </td>
                    <td className="py-3 pr-4 text-sm font-bold text-slate-700 dark:text-slate-300">
                      {formatPeriod(due.period)}
                    </td>
                    <td className="py-3 pr-4 text-sm font-bold text-slate-700 dark:text-slate-300">
                      {dueD.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="py-3 pr-4">
                      {due.status === 'FILED' ? (
                        <span className="text-[10px] text-emerald-500 font-black">— Filed —</span>
                      ) : diffDays > 0 ? (
                        <span className={`text-[11px] font-black ${ diffDays <= 7 ? 'text-orange-500' : 'text-slate-500 dark:text-slate-400' }`}>
                          {diffDays} din bache
                        </span>
                      ) : (
                        <span className="text-[11px] font-black text-red-500">{Math.abs(diffDays)} din late!</span>
                      )}
                    </td>
                    <td className="py-3 pr-4">
                      <span className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-black uppercase w-fit ${
                        due.status === 'FILED'
                          ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600'
                          : due.status === 'OVERDUE'
                          ? 'bg-red-50 dark:bg-red-500/10 text-red-600'
                          : 'bg-amber-50 dark:bg-amber-500/10 text-amber-600'
                      }`}>
                        {due.status === 'FILED' ? <BadgeCheck size={11} /> : due.status === 'OVERDUE' ? <AlertCircle size={11} /> : <Clock size={11} />}
                        {due.status}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-[11px] text-slate-400 font-bold">
                      {due.filedDate ? new Date(due.filedDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        {due.status !== 'FILED' && (
                          <button
                            onClick={() => handleMarkFiled(due.id)}
                            className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-500 hover:text-white transition-all text-emerald-600"
                            title="Mark as Filed"
                          >
                            <BadgeCheck size={13} />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteDue(due.id)}
                          className="p-2 rounded-lg bg-red-50 dark:bg-red-500/10 hover:bg-red-500 hover:text-white transition-all text-red-400"
                          title="Delete"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Legend */}
      {returnDues.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-800 flex flex-wrap gap-4">
          <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">GST Return Types Ki Due Dates:</div>
          {GST_RETURN_TYPES.map(t => (
            <div key={t.type} className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full bg-${t.color}-400`} />
              <span className="text-[10px] font-bold text-gray-500">{t.name} — {t.freq} (Day {t.dueDayOfMonth})</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
