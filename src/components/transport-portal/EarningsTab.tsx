'use client';

import React, { useState, useEffect } from 'react';
import { TrendingUp, IndianRupee, Car, CheckCircle, Loader2, Calendar } from 'lucide-react';
import { toast } from 'sonner';

export function EarningsTab({ token }: { token: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEarnings = async () => {
      try {
        const res = await fetch('/api/transport/earnings', { headers: { Authorization: `Bearer ${token}` } });
        const json = await res.json();
        if (json.success) setData(json);
        else toast.error('Failed to load earnings');
      } catch {
        toast.error('Connection error');
      } finally {
        setLoading(false);
      }
    };
    fetchEarnings();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center py-24"><Loader2 className="animate-spin text-blue-400" size={32} /></div>;
  }

  if (!data) return null;

  const maxAmount = Math.max(...(data.last7Days?.map((d: any) => d.amount) || [1]), 1);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-black text-white">My Earnings</h2>
        <p className="text-xs text-slate-500 mt-0.5">Track your ride revenue and performance</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gradient-to-br from-green-600/20 to-emerald-600/10 border border-green-500/20 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl bg-green-500/20 flex items-center justify-center">
              <IndianRupee size={16} className="text-green-400" />
            </div>
            <span className="text-[10px] font-black text-green-400 uppercase tracking-wider">Total Revenue</span>
          </div>
          <p className="text-2xl font-black text-white">₹{data.totalEarnings?.toFixed(0) || 0}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">From completed trips</p>
        </div>

        <div className="bg-gradient-to-br from-blue-600/20 to-indigo-600/10 border border-blue-500/20 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <Car size={16} className="text-blue-400" />
            </div>
            <span className="text-[10px] font-black text-blue-400 uppercase tracking-wider">Total Trips</span>
          </div>
          <p className="text-2xl font-black text-white">{data.totalTrips || 0}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Completed trips</p>
        </div>
      </div>

      {/* Bar Chart */}
      {data.last7Days && data.last7Days.length > 0 && (
        <div className="bg-[#0c1525]/70 border border-slate-800/60 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={14} className="text-blue-400" />
            <span className="text-xs font-black text-white">Last 7 Days Earnings</span>
          </div>
          <div className="flex items-end gap-2 h-24">
            {data.last7Days.map((d: any, i: number) => {
              const height = maxAmount > 0 ? (d.amount / maxAmount) * 100 : 0;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[9px] text-green-400 font-bold">
                    {d.amount > 0 ? `₹${d.amount}` : ''}
                  </span>
                  <div
                    className="w-full rounded-t-md bg-gradient-to-t from-blue-600 to-indigo-500 transition-all"
                    style={{ height: `${Math.max(height, 5)}%`, minHeight: '4px' }}
                  />
                  <span className="text-[8px] text-slate-500">
                    {new Date(d.date).toLocaleDateString('en', { weekday: 'short' }).slice(0, 2)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Trips */}
      {data.recentBookings && data.recentBookings.length > 0 && (
        <div>
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3">Recent Completed Trips</h3>
          <div className="space-y-2">
            {data.recentBookings.map((b: any) => (
              <div key={b.id} className="bg-[#0c1525]/70 border border-slate-800/60 rounded-xl p-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center shrink-0">
                  <CheckCircle size={14} className="text-green-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black text-white truncate">{b.guestName}</p>
                  <p className="text-[10px] text-slate-500 truncate">{b.fromLocation} → {b.toLocation}</p>
                  <p className="text-[10px] text-slate-600">{b.travelDate} • {b.travelTime}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-black text-green-400">₹{b.totalAmount}</p>
                  <p className="text-[10px] text-slate-500">{b.seats} seat{b.seats > 1 ? 's' : ''}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.totalTrips === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-2xl bg-slate-800/60 flex items-center justify-center mx-auto mb-4">
            <IndianRupee size={28} className="text-slate-600" />
          </div>
          <p className="text-slate-400 text-sm font-bold">No Earnings Yet</p>
          <p className="text-slate-600 text-xs mt-1">Complete booking trips to see your earnings</p>
        </div>
      )}
    </div>
  );
}
