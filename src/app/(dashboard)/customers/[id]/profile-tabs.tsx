'use client';

import React, { useState, useEffect } from 'react';
import { 
  User, Wallet, ShoppingBag, Award, Tag, Share2, 
  ChevronRight, Calendar, Mail, Phone, MapPin, 
  Plus, Minus, RefreshCw, Star
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

interface ProfileData {
  guest: {
    id: string;
    firstName: string;
    lastName?: string;
    mobile?: string;
    email?: string;
    gender?: string;
    nationality?: string;
    address?: string;
    segment: string;
    birthDate?: string;
    loyaltyPoints: number;
    referralCode?: string;
    referredBy?: { id: string; firstName: string; lastName: string };
    createdAt?: string;
  };
  metrics: {
    totalSpend: number;
    totalVisits: number;
    averageOrderValue: number;
  };
  favoriteDishes: Array<{ id: string; name: string; count: number; totalRevenue: number }>;
  visitHistory: Array<{ id: string; orderNo: string; orderType: string; status: string; grandTotal: number; createdAt: string; itemSummary: string }>;
  loyaltyLogs: Array<{ id: string; points: number; reason: string; createdAt: string }>;
  referrals: Array<{ id: string; firstName: string; lastName?: string; createdAt: string; loyaltyPoints: number }>;
  coupons: Array<{ id: string; code: string; discountType: string; discountValue: number; expiryDate: string }>;
}

export function CustomerProfileTabs({ customerId }: { customerId: string }) {
  const { showToast } = useToast();
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'visits' | 'dishes' | 'loyalty' | 'referrals' | 'coupons'>('overview');
  
  // Points adjustment form
  const [adjustPoints, setAdjustPoints] = useState<string>('');
  const [adjustReason, setAdjustReason] = useState<string>('');
  const [submittingPoints, setSubmittingPoints] = useState(false);

  // Segment update state
  const [updatingSegment, setUpdatingSegment] = useState(false);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/customers/${customerId}/profile`);
      const resJson = await res.json();
      if (resJson.success) {
        setData(resJson.data);
      } else {
        showToast(resJson.message || 'Failed to load customer profile', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error fetching profile details', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [customerId]);

  const handleAdjustPoints = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustPoints || isNaN(Number(adjustPoints))) {
      showToast('Please enter a valid number of points', 'error');
      return;
    }
    setSubmittingPoints(true);
    try {
      const res = await fetch(`/api/customers/${customerId}/loyalty-logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          points: Number(adjustPoints),
          reason: adjustReason || 'Manual adjustment by Admin',
        }),
      });
      const resJson = await res.json();
      if (resJson.success) {
        showToast('Loyalty points adjusted successfully!', 'success');
        setAdjustPoints('');
        setAdjustReason('');
        fetchProfile();
      } else {
        showToast(resJson.message || 'Failed to adjust points', 'error');
      }
    } catch (err) {
      showToast('Error adjusting loyalty points', 'error');
    } finally {
      setSubmittingPoints(false);
    }
  };

  const handleUpdateSegment = async (newSegment: string) => {
    setUpdatingSegment(true);
    try {
      const res = await fetch(`/api/customers/${customerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: data?.guest.firstName,
          segment: newSegment,
        }),
      });
      const resJson = await res.json();
      if (resJson.success) {
        showToast('Segment updated successfully', 'success');
        fetchProfile();
      } else {
        showToast(resJson.message || 'Failed to update segment', 'error');
      }
    } catch (err) {
      showToast('Error updating segment', 'error');
    } finally {
      setUpdatingSegment(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3">
        <RefreshCw size={24} className="text-pos-primary animate-spin" />
        <span className="text-xs font-black uppercase text-slate-400 tracking-wider">Loading Customer Profile...</span>
      </div>
    );
  }

  if (!data) return <div className="text-center py-12 text-slate-400">Guest not found.</div>;

  const { guest, metrics, favoriteDishes, visitHistory, loyaltyLogs, referrals, coupons } = data;

  const tabs = [
    { id: 'overview', name: 'Overview', icon: User },
    { id: 'visits', name: 'Visit History', icon: ShoppingBag },
    { id: 'dishes', name: 'Favorite Dishes', icon: Star },
    { id: 'loyalty', name: 'Loyalty Wallet', icon: Award },
    { id: 'referrals', name: 'Referral System', icon: Share2 },
    { id: 'coupons', name: 'Coupon Wallet', icon: Tag },
  ] as const;

  return (
    <div className="space-y-6">
      {/* 💳 1. HEADER PROFILE CARD */}
      <div className="relative overflow-hidden bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-white/5 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row justify-between gap-6">
        <div className="flex gap-4 items-start min-w-0">
          <div className="w-16 h-16 rounded-2xl bg-pos-primary/10 dark:bg-pos-primary/20 flex items-center justify-center text-pos-primary shrink-0">
            <User size={32} />
          </div>
          <div className="space-y-1.5 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight truncate">
                {guest.firstName} {guest.lastName || ''}
              </h2>
              <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                guest.segment === 'VIP' ? 'bg-violet-600 text-white shadow-md shadow-violet-600/20 animate-pulse' :
                guest.segment === 'INACTIVE' ? 'bg-slate-200 dark:bg-slate-800 text-slate-500' :
                guest.segment === 'NEW' ? 'bg-blue-100 text-blue-800 dark:bg-blue-500/10 dark:text-blue-400' :
                'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
              }`}>
                {guest.segment}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-400 font-bold">
              {guest.mobile && <span className="flex items-center gap-1.5"><Phone size={12} className="text-slate-500" /> {guest.mobile}</span>}
              {guest.email && <span className="flex items-center gap-1.5 truncate"><Mail size={12} className="text-slate-500" /> {guest.email}</span>}
              {guest.birthDate && <span className="flex items-center gap-1.5"><Calendar size={12} className="text-slate-500" /> Birthday: {new Date(guest.birthDate).toLocaleDateString([], { month: 'long', day: 'numeric' })}</span>}
              {guest.address && <span className="flex items-center gap-1.5 truncate"><MapPin size={12} className="text-slate-500" /> {guest.address}</span>}
            </div>
          </div>
        </div>

        {/* Dynamic Action Controls (Segment updates & referral codes) */}
        <div className="flex flex-col justify-between items-end gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Set Segment:</span>
            <select
              value={guest.segment}
              onChange={(e) => handleUpdateSegment(e.target.value)}
              disabled={updatingSegment}
              className="bg-gray-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl px-2.5 py-1.5 text-xs font-bold outline-none uppercase tracking-wider dark:text-white"
            >
              <option value="VIP">VIP</option>
              <option value="REGULAR">Regular</option>
              <option value="NEW">New</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-100 dark:border-white/5">
            <div>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5">Referral Code</p>
              <p className="text-xs font-mono font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100">{guest.referralCode || 'N/A'}</p>
            </div>
            {guest.referredBy && (
              <div className="border-l border-slate-200 dark:border-white/10 pl-2.5 ml-1">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5">Referred By</p>
                <p className="text-xs font-bold uppercase text-slate-500">{guest.referredBy.firstName}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 📊 2. METRICS WIDGETS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-lg flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-pos-primary/10 flex items-center justify-center text-pos-primary shrink-0">
            <ShoppingBag size={20} />
          </div>
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Total visits</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none">{metrics.totalVisits} orders</p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-lg flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-600/10 flex items-center justify-center text-emerald-600 shrink-0">
            <Wallet size={20} />
          </div>
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Total revenue spend</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none">₹{metrics.totalSpend.toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-lg flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/10 flex items-center justify-center text-indigo-600 shrink-0">
            <Award size={20} />
          </div>
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Average Ticket size</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none">₹{Math.round(metrics.averageOrderValue).toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* 📑 3. TAB CONTROLS */}
      <div className="flex border-b border-slate-200 dark:border-white/10 overflow-x-auto no-scrollbar gap-1 pt-2">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 border-b-2 font-black text-xs uppercase tracking-wider transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-pos-primary text-pos-primary bg-pos-primary/5 rounded-t-xl'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <Icon size={14} />
              {tab.name}
            </button>
          );
        })}
      </div>

      {/* 📥 4. TAB CONTENTS */}
      <div className="bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-white/5 rounded-2xl p-6 shadow-xl min-h-[300px]">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-4">Customer Details & Preferences</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex justify-between border-b border-slate-100 dark:border-white/5 pb-2">
                    <span className="text-xs font-bold text-slate-400">First Name</span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-100">{guest.firstName}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 dark:border-white/5 pb-2">
                    <span className="text-xs font-bold text-slate-400">Last Name</span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-100">{guest.lastName || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 dark:border-white/5 pb-2">
                    <span className="text-xs font-bold text-slate-400">Mobile Phone</span>
                    <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-100">{guest.mobile || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 dark:border-white/5 pb-2">
                    <span className="text-xs font-bold text-slate-400">Email Address</span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-100">{guest.email || 'N/A'}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between border-b border-slate-100 dark:border-white/5 pb-2">
                    <span className="text-xs font-bold text-slate-400">Gender</span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">{guest.gender || 'Not specified'}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 dark:border-white/5 pb-2">
                    <span className="text-xs font-bold text-slate-400">Nationality</span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-100">{guest.nationality || 'Not specified'}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 dark:border-white/5 pb-2">
                    <span className="text-xs font-bold text-slate-400">Loyalty Level</span>
                    <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">{guest.loyaltyPoints} Points</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 dark:border-white/5 pb-2">
                    <span className="text-xs font-bold text-slate-400">Member Since</span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-100">{guest.createdAt ? new Date(guest.createdAt).toLocaleDateString() : 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'visits' && (
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-2">Visit Logs</h3>
            {visitHistory.length === 0 ? (
              <p className="text-slate-400 text-xs italic text-center py-12">No orders placed by this guest yet.</p>
            ) : (
              <div className="overflow-x-auto no-scrollbar">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-white/10 text-[9px] font-black text-slate-400 uppercase tracking-wider">
                      <th className="pb-3 pl-2">Order No</th>
                      <th className="pb-3">Date</th>
                      <th className="pb-3">Type</th>
                      <th className="pb-3">Items Summary</th>
                      <th className="pb-3">Total Amount</th>
                      <th className="pb-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                    {visitHistory.map(order => (
                      <tr key={order.id} className="text-xs font-bold hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                        <td className="py-3.5 pl-2 font-mono text-slate-800 dark:text-white uppercase">#{order.orderNo}</td>
                        <td className="py-3.5 text-slate-500">{new Date(order.createdAt).toLocaleString()}</td>
                        <td className="py-3.5"><span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[10px] font-black uppercase">{order.orderType}</span></td>
                        <td className="py-3.5 text-slate-500 font-medium truncate max-w-[250px]">{order.itemSummary}</td>
                        <td className="py-3.5 font-mono text-slate-800 dark:text-slate-200">₹{order.grandTotal.toFixed(2)}</td>
                        <td className="py-3.5">
                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                            order.status === 'SETTLED' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-amber-50 text-amber-700'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'dishes' && (
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-4">Most Ordered Dishes</h3>
            {favoriteDishes.length === 0 ? (
              <p className="text-slate-400 text-xs italic text-center py-12">No dish analytics available. Place orders to see statistics.</p>
            ) : (
              <div className="space-y-4">
                {favoriteDishes.map((dish, index) => {
                  const maxCount = favoriteDishes[0]?.count || 1;
                  const percentage = (dish.count / maxCount) * 100;
                  return (
                    <div key={dish.id} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-tight">
                        <span className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-md bg-pos-primary/10 flex items-center justify-center text-[10px] font-black text-pos-primary">
                            {index + 1}
                          </span>
                          {dish.name}
                        </span>
                        <span className="font-mono text-slate-400">{dish.count} orders (₹{dish.totalRevenue.toLocaleString()})</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
                        <div 
                          className="h-full bg-pos-primary rounded-full transition-all duration-1000 shadow-md"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'loyalty' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Loyalty Logs Timeline */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-2">Points Statement History</h3>
              {loyaltyLogs.length === 0 ? (
                <p className="text-slate-400 text-xs italic text-center py-12">No loyalty points transactions logged yet.</p>
              ) : (
                <div className="relative border-l-2 border-slate-100 dark:border-white/5 pl-4 ml-2 space-y-4 max-h-[400px] overflow-y-auto pr-2 no-scrollbar">
                  {loyaltyLogs.map(log => (
                    <div key={log.id} className="relative space-y-0.5">
                      {/* Timeline dot */}
                      <span className={`absolute -left-[21px] top-1.5 w-2 h-2 rounded-full border-2 ${
                        log.points > 0 ? 'bg-emerald-500 border-emerald-500' : 'bg-rose-500 border-rose-500'
                      }`} />
                      <div className="flex justify-between text-xs font-bold uppercase tracking-tight">
                        <span className="text-slate-800 dark:text-slate-200">{log.reason}</span>
                        <span className={`font-mono ${log.points > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {log.points > 0 ? `+${log.points}` : log.points} PTS
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-bold">{new Date(log.createdAt).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Adjust Loyalty Points Form */}
            <div className="bg-slate-50 dark:bg-slate-800/20 border border-slate-100 dark:border-white/5 p-5 rounded-2xl shadow-inner space-y-4 self-start">
              <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Adjust Points Balance</h4>
              <form onSubmit={handleAdjustPoints} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Points Change</label>
                  <input
                    type="number"
                    placeholder="e.g. 50 or -50"
                    value={adjustPoints}
                    onChange={(e) => setAdjustPoints(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white dark:bg-[#111] dark:text-white border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold outline-none placeholder:text-slate-300"
                  />
                  <p className="text-[8px] text-slate-400 font-bold ml-1">Use negative values to deduct points manually.</p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Reason / Note</label>
                  <textarea
                    placeholder="Reason for adjustment"
                    rows={2}
                    value={adjustReason}
                    onChange={(e) => setAdjustReason(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white dark:bg-[#111] dark:text-white border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold outline-none placeholder:text-slate-300 resize-none"
                  />
                </div>
                <Button
                  type="submit"
                  loading={submittingPoints}
                  className="w-full bg-pos-primary text-white font-bold py-2.5 rounded-xl hover:bg-red-700 tracking-wider text-xs uppercase"
                >
                  Adjust Balance
                </Button>
              </form>
            </div>
          </div>
        )}

        {activeTab === 'referrals' && (
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-2">Referred Customers List</h3>
            {referrals.length === 0 ? (
              <p className="text-slate-400 text-xs italic text-center py-12">No customers referred yet. Share referral code to start!</p>
            ) : (
              <div className="overflow-x-auto no-scrollbar">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-white/10 text-[9px] font-black text-slate-400 uppercase tracking-wider">
                      <th className="pb-3 pl-2">Invited Customer</th>
                      <th className="pb-3">Signup Date</th>
                      <th className="pb-3">Their Points</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                    {referrals.map(ref => (
                      <tr key={ref.id} className="text-xs font-bold">
                        <td className="py-3.5 pl-2 text-slate-800 dark:text-white uppercase">{ref.firstName} {ref.lastName || ''}</td>
                        <td className="py-3.5 text-slate-500">{new Date(ref.createdAt).toLocaleDateString()}</td>
                        <td className="py-3.5"><span className="text-[10px] font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-md">{ref.loyaltyPoints} PTS</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'coupons' && (
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-2">Active Personal Coupons</h3>
            {coupons.length === 0 ? (
              <p className="text-slate-400 text-xs italic text-center py-12">No active coupons in this customer's wallet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {coupons.map(coupon => (
                  <div key={coupon.id} className="border border-dashed border-emerald-500/35 bg-emerald-50/20 dark:bg-emerald-500/5 p-4 rounded-2xl flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Tag size={14} className="text-emerald-600" />
                        <span className="text-xs font-mono font-black uppercase tracking-widest text-emerald-600">{coupon.code}</span>
                      </div>
                      <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                        Discount: {coupon.discountType === 'PERCENTAGE' ? `${coupon.discountValue}%` : `₹${coupon.discountValue}`} Off
                      </p>
                      <p className="text-[10px] text-slate-400 font-bold">
                        Expires: {new Date(coupon.expiryDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
