'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ShieldAlert,
  Percent,
  CheckCircle2,
  XCircle,
  Clock,
  KeyRound,
  Filter,
  RefreshCw,
  ArrowLeft,
  Search,
  Sliders,
  Save,
  Check,
  X,
  AlertTriangle,
  User,
  Calendar,
  Sparkles,
  DollarSign
} from 'lucide-react';

export default function HotelAdminDiscountApprovalsPage() {
  const params = useParams();
  const propertyCode = (params?.propertyCode as string) || '';

  const [activeTab, setActiveTab] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL'>('PENDING');
  const [approvals, setApprovals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Settings State
  const [settings, setSettings] = useState({
    discountApprovalEnabled: true,
    maxStaffDiscountPercent: 10,
    maxStaffDiscountAmount: 200,
    managerDiscountPin: '1234',
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState('');

  // Fetch approvals and settings
  const fetchData = async () => {
    setLoading(true);
    try {
      const [appRes, setRes] = useState<any>();
      const res = await fetch(`/api/discounts/approval?propertyCode=${propertyCode}&status=${activeTab}&limit=100`);
      const data = await res.json();
      if (data.success && data.data) {
        setApprovals(data.data.approvals || []);
        if (data.data.settings) {
          setSettings((prev) => ({
            ...prev,
            ...data.data.settings,
          }));
        }
      }

      // Fetch pin explicitly
      const settingsRes = await fetch(`/api/discounts/settings?propertyCode=${propertyCode}`);
      const settingsData = await settingsRes.json();
      if (settingsData.success && settingsData.data) {
        setSettings({
          discountApprovalEnabled: settingsData.data.discountApprovalEnabled ?? true,
          maxStaffDiscountPercent: settingsData.data.maxStaffDiscountPercent ?? 10,
          maxStaffDiscountAmount: settingsData.data.maxStaffDiscountAmount ?? 200,
          managerDiscountPin: settingsData.data.managerDiscountPin || '1234',
        });
      }
    } catch (err) {
      console.error('Error fetching discount approvals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [propertyCode, activeTab]);

  // Handle Approve / Reject
  const handleAction = async (id: string, action: 'APPROVE' | 'REJECT') => {
    setActionLoadingId(id);
    try {
      const res = await fetch('/api/discounts/approval', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action }),
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
      }
    } catch (err) {
      console.error('Error updating approval:', err);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setSettingsSuccess('');
    try {
      const res = await fetch('/api/discounts/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyCode,
          ...settings,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSettingsSuccess('Discount policy settings updated successfully!');
        setTimeout(() => setSettingsSuccess(''), 4000);
      }
    } catch (err) {
      console.error('Error saving settings:', err);
    } finally {
      setSavingSettings(false);
    }
  };

  // Filtered approvals
  const filteredApprovals = approvals.filter((item) => {
    const q = searchQuery.toLowerCase();
    const titleMatch = item.referenceTitle?.toLowerCase().includes(q);
    const staffMatch = item.requestedByName?.toLowerCase().includes(q);
    const reasonMatch = item.reason?.toLowerCase().includes(q);
    return !searchQuery || titleMatch || staffMatch || reasonMatch;
  });

  // Calculate summary stats
  const pendingCount = approvals.filter((a) => a.status === 'PENDING').length;
  const approvedCount = approvals.filter((a) => a.status === 'APPROVED').length;
  const totalApprovedDiscountAmount = approvals
    .filter((a) => a.status === 'APPROVED')
    .reduce((sum, a) => sum + (a.discountAmount || 0), 0);

  return (
    <div className="space-y-6 pb-16 max-w-7xl mx-auto">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href={`/${propertyCode}/hoteladmin`}
              className="text-xs font-bold text-slate-500 hover:text-amber-500 flex items-center gap-1 transition-colors"
            >
              <ArrowLeft size={13} /> Back to Dashboard
            </Link>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-500 border border-amber-500/30">
              <ShieldAlert size={20} />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                Extra Discount Approval & Audit Hub
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Control cashier & staff discounts, manage manager PIN, and prevent revenue leakage.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors self-start md:self-auto"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Pending Approvals</span>
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500">
              <Clock size={16} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-500">{pendingCount}</span>
            {pendingCount > 0 && (
              <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full animate-pulse">
                Needs Review
              </span>
            )}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Approved Discounts</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">{approvedCount}</span>
            <span className="text-xs text-slate-400 font-medium">orders/bookings</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Concession Given</span>
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-500">
              <Percent size={16} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black font-mono text-emerald-500">
              ₹{totalApprovedDiscountAmount.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Active Policy Limit</span>
            <div className="p-1.5 rounded-lg bg-orange-500/10 text-orange-500">
              <Sliders size={16} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-black text-slate-900 dark:text-white">
              {settings.maxStaffDiscountPercent}% <span className="text-xs font-normal text-slate-400">or</span> ₹{settings.maxStaffDiscountAmount}
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Policy Settings & Approvals Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Quick Policy Settings Form */}
        <div className="lg:col-span-1">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
              <Sliders size={16} className="text-amber-500" />
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                Discount Control Policy
              </h2>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4">
              {/* Toggle Enabled */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    Enforce Admin Approval
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    Require approval when discount exceeds thresholds
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.discountApprovalEnabled}
                    onChange={(e) => setSettings({ ...settings, discountApprovalEnabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
              </div>

              {/* Max Staff Discount % */}
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Max Allowed Staff Discount (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={settings.maxStaffDiscountPercent}
                  onChange={(e) => setSettings({ ...settings, maxStaffDiscountPercent: Number(e.target.value) })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold dark:text-white outline-none focus:border-amber-500"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Discounts higher than this percentage require approval.
                </span>
              </div>

              {/* Max Staff Discount Amount ₹ */}
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Max Allowed Staff Discount (₹ Flat)
                </label>
                <input
                  type="number"
                  min="0"
                  step="10"
                  value={settings.maxStaffDiscountAmount}
                  onChange={(e) => setSettings({ ...settings, maxStaffDiscountAmount: Number(e.target.value) })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold dark:text-white outline-none focus:border-amber-500"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Flat discounts higher than this amount require approval.
                </span>
              </div>

              {/* Manager Secret PIN */}
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1 flex items-center justify-between">
                  <span>Manager Override 4-Digit PIN</span>
                  <KeyRound size={12} className="text-amber-500" />
                </label>
                <input
                  type="text"
                  maxLength={8}
                  value={settings.managerDiscountPin}
                  onChange={(e) => setSettings({ ...settings, managerDiscountPin: e.target.value })}
                  placeholder="1234"
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono tracking-widest font-black dark:text-white outline-none focus:border-amber-500 text-center"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Managers can enter this PIN directly at counter terminals to approve on the spot.
                </span>
              </div>

              {settingsSuccess && (
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold text-emerald-500 flex items-center gap-2">
                  <CheckCircle2 size={14} /> {settingsSuccess}
                </div>
              )}

              <button
                type="submit"
                disabled={savingSettings}
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Save size={14} /> {savingSettings ? 'Saving Policy...' : 'Save Discount Policy'}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Approvals Ledger & Action Table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            
            {/* Filter Tabs & Search */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3 flex-wrap">
              <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
                {(['PENDING', 'APPROVED', 'REJECTED', 'ALL'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      activeTab === tab
                        ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {tab === 'PENDING' ? `Pending (${pendingCount})` : tab}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-60">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search table, room, staff..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:border-amber-500 dark:text-white"
                />
              </div>
            </div>

            {/* List / Cards */}
            {loading ? (
              <div className="py-12 text-center text-slate-400 flex items-center justify-center gap-2">
                <RefreshCw size={18} className="animate-spin text-amber-500" /> Loading requests...
              </div>
            ) : filteredApprovals.length === 0 ? (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <CheckCircle2 size={36} className="mx-auto text-emerald-500/40" />
                <p className="text-sm font-bold text-slate-600 dark:text-slate-300">No {activeTab.toLowerCase()} discount requests</p>
                <p className="text-xs text-slate-400">All cashier and frontdesk discounts are accounted for.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredApprovals.map((item) => {
                  const isPending = item.status === 'PENDING';
                  const isApproved = item.status === 'APPROVED';
                  const isRejected = item.status === 'REJECTED';

                  return (
                    <div
                      key={item.id}
                      className={`p-4 rounded-xl border transition-all ${
                        isPending
                          ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-500/40 shadow-sm'
                          : 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-black px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                              {item.referenceTitle || 'Order'}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                              {item.source}
                            </span>
                            {isPending && (
                              <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                                <Clock size={10} /> Pending Approval
                              </span>
                            )}
                            {isApproved && (
                              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <CheckCircle2 size={10} /> Approved ({item.approvalMethod || 'ADMIN'})
                              </span>
                            )}
                            {isRejected && (
                              <span className="text-[10px] font-black uppercase tracking-wider text-rose-600 dark:text-rose-400 bg-rose-500/10 border border-rose-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <XCircle size={10} /> Rejected
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                            <span>Requested by: <strong className="text-slate-700 dark:text-slate-200">{item.requestedByName}</strong></span>
                            <span>•</span>
                            <span>{new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </p>

                          {item.reason && (
                            <p className="text-xs text-slate-600 dark:text-slate-300 italic pt-0.5">
                              "{item.reason}"
                            </p>
                          )}
                        </div>

                        {/* Amount & Actions */}
                        <div className="flex items-center gap-4 self-end sm:self-center">
                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 block font-semibold">Bill: ₹{item.billAmount}</span>
                            <span className="text-base font-black font-mono text-rose-500">
                              -₹{item.discountAmount}
                              <span className="text-[10px] font-normal text-slate-400 ml-1">
                                ({item.discountType === 'PERCENTAGE' ? `${item.discountValue}%` : 'Flat'})
                              </span>
                            </span>
                            <span className="text-xs font-bold font-mono text-emerald-500 block">
                              Net: ₹{item.finalAmount}
                            </span>
                          </div>

                          {/* Action Buttons for Pending */}
                          {isPending && (
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                onClick={() => handleAction(item.id, 'REJECT')}
                                disabled={actionLoadingId === item.id}
                                className="p-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-rose-500 hover:text-white text-slate-600 dark:text-slate-300 transition-colors disabled:opacity-50"
                                title="Reject Discount"
                              >
                                <X size={15} />
                              </button>
                              <button
                                onClick={() => handleAction(item.id, 'APPROVE')}
                                disabled={actionLoadingId === item.id}
                                className="px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-1 shadow-md shadow-emerald-500/20 transition-all disabled:opacity-50"
                              >
                                <Check size={14} strokeWidth={3} /> Approve
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </div>
        </div>

      </div>

    </div>
  );
}
