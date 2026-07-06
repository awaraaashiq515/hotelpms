'use client';

import React, { useState, useEffect, Suspense, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { RefreshCw, Plus, Gift, Users, Trophy, TrendingUp, Star, BarChart3, Zap, ArrowRight } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';

// ── Sub-components ──────────────────────────────────────
import RewardRulesTab from './components/RewardRulesTab';
import DriverOverviewTab from './components/DriverOverviewTab';
import HistoryTab from './components/HistoryTab';
import AddRuleModal from './components/AddRuleModal';

// ── Types ───────────────────────────────────────────────
import {
  ActiveTab, DriverProgress, OfferRule, HistoryEntry,
  HistorySummary, OfferForm,
} from './types';

// ── Small Stat Card ─────────────────────────────────────
function StatCard({ icon, label, value, sub, color }: {
  icon: React.ReactNode; label: string;
  value: string | number; sub?: string; color: string;
}) {
  return (
    <div className={`relative overflow-hidden rounded-2xl border p-5 ${color}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider opacity-70">{label}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {sub && <p className="text-xs mt-1 opacity-60">{sub}</p>}
        </div>
        <div className="opacity-80">{icon}</div>
      </div>
    </div>
  );
}

// ── Default offer form ───────────────────────────────────
const DEFAULT_FORM: OfferForm = {
  title: '', offerType: 'RIDES', targetRides: 0, targetReferrals: 0,
  rewardValue: 0, rewardType: 'CASH', rewardItem: '',
  resetType: 'SAME_OFFER', priority: 1, nextOfferId: '', isActive: true,
};

// ═══════════════════════════════════════════════════════
// Main Content
// ═══════════════════════════════════════════════════════
function DriverOffersContent() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<ActiveTab>(
    (searchParams.get('tab') as ActiveTab) || 'rules'
  );

  // ── Core state ───────────────────────────────────────
  const [driversData, setDriversData]     = useState<DriverProgress[]>([]);
  const [offersList, setOffersList]       = useState<OfferRule[]>([]);
  const [historyData, setHistoryData]     = useState<HistoryEntry[]>([]);
  const [historySummary, setHistorySummary] = useState<HistorySummary | null>(null);
  const [loading, setLoading]             = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [propertyId, setPropertyId]       = useState<string | null>(null);
  const [syncing, setSyncing]             = useState(false);

  // ── Driver overview search ───────────────────────────
  const [search, setSearch] = useState('');

  // ── History filters ──────────────────────────────────
  const [historyPeriod, setHistoryPeriod] = useState<'day' | 'month' | 'year' | 'custom'>('month');
  const [historyDateFrom, setHistoryDateFrom] = useState('');
  const [historyDateTo, setHistoryDateTo]     = useState('');
  const [historyDriverFilter, setHistoryDriverFilter] = useState('');
  const [historyOfferFilter, setHistoryOfferFilter]   = useState('');

  // ── Modal state ──────────────────────────────────────
  const [isOfferModalOpen,  setIsOfferModalOpen]  = useState(searchParams.get('action') === 'new-slab');
  const [editingOfferId,    setEditingOfferId]     = useState<string | null>(null);
  const [offerForm,         setOfferForm]          = useState<OfferForm>(DEFAULT_FORM);

  // ── Fetch core data ──────────────────────────────────
  const fetchData = useCallback(async (pid?: string) => {
    const activePid = pid || propertyId;
    setLoading(true);
    try {
      const [oR, pR] = await Promise.all([
        fetch(`/api/drivers/offers${activePid ? `?propertyId=${activePid}` : ''}`),
        fetch(`/api/drivers/offers/progress${activePid ? `?propertyId=${activePid}` : ''}`),
      ]);
      if (oR.status === 401 || pR.status === 401) return;
      const [od, pd] = await Promise.all([oR.json(), pR.json()]);
      if (od.success) setOffersList(od.data);
      if (pd.success) setDriversData(pd.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [propertyId]);

  // ── Fetch history ────────────────────────────────────
  const fetchHistory = useCallback(async (pid?: string) => {
    const activePid = pid || propertyId;
    setHistoryLoading(true);
    try {
      const now = new Date();
      let s = historyDateFrom, e2 = historyDateTo;
      if (historyPeriod === 'day') {
        const t = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        s = e2 = t.toISOString().split('T')[0];
      } else if (historyPeriod === 'month') {
        s = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
        e2 = now.toISOString().split('T')[0];
      } else if (historyPeriod === 'year') {
        s = `${now.getFullYear()}-01-01`;
        e2 = now.toISOString().split('T')[0];
      }
      const params = new URLSearchParams();
      if (activePid)           params.set('propertyId', activePid);
      if (s)                   params.set('startDate', s);
      if (e2)                  params.set('endDate', e2);
      if (historyDriverFilter) params.set('driverId', historyDriverFilter);
      if (historyOfferFilter)  params.set('offerId', historyOfferFilter);

      const res = await fetch(`/api/drivers/offers/history?${params}`);
      if (res.status === 401) return;
      const data = await res.json();
      if (data.success) { setHistoryData(data.data.histories); setHistorySummary(data.data.summary); }
    } catch (e) { console.error(e); }
    finally { setHistoryLoading(false); }
  }, [propertyId, historyPeriod, historyDateFrom, historyDateTo, historyDriverFilter, historyOfferFilter]);

  // ── Init session + auto-sync L1 for unassigned drivers ──
  useEffect(() => {
    (async () => {
      try {
        const s = await fetch('/api/auth/session').then(r => r.json());
        let pid = s.user?.propertyId;
        if (!pid && (s.user?.role === 'RESTAURANTS_ADMIN' || s.user?.role === 'SUPER_ADMIN') && s.user?.organizationId) {
          const p = await fetch(`/api/setup/properties?organizationId=${s.user.organizationId}`).then(r => r.json());
          if (p.success && p.data.length > 0) pid = p.data[0].id;
        }
        setPropertyId(pid || null);
        // Auto-sync first — assigns L1 to any driver without a level
        if (pid) {
          await fetch('/api/drivers/offers/re-sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ propertyId: pid }),
          }).catch(() => {});
        }
        fetchData(pid);
      } catch { fetchData(); }
    })();
  }, []);

  useEffect(() => {
    if (activeTab === 'history' && propertyId) fetchHistory(propertyId);
  }, [activeTab, historyPeriod, historyDriverFilter, historyOfferFilter]);

  // ── Handlers ─────────────────────────────────────────
  const handleReSync = async () => {
    setSyncing(true);
    try {
      await fetch('/api/drivers/offers/re-sync', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ propertyId }) });
      await fetchData();
      if (activeTab === 'history') fetchHistory();
    } catch (e) { console.error(e); }
    finally { setSyncing(false); }
  };

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingOfferId ? `/api/drivers/offers/${editingOfferId}` : '/api/drivers/offers';
    await fetch(url, { method: editingOfferId ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...offerForm, propertyId }) });
    setIsOfferModalOpen(false); setEditingOfferId(null); setOfferForm(DEFAULT_FORM); fetchData();
  };

  const handleDeleteOffer = async (id: string) => {
    if (!confirm('Delete this reward rule?')) return;
    await fetch(`/api/drivers/offers/${id}`, { method: 'DELETE' });
    fetchData();
  };

  const openEditOffer = (offer: OfferRule) => {
    setEditingOfferId(offer.id);
    setOfferForm({ title: offer.title, offerType: offer.offerType, targetRides: offer.targetRides, targetReferrals: offer.targetReferrals, rewardValue: offer.rewardValue, rewardType: offer.rewardType, rewardItem: offer.rewardItem || '', resetType: offer.resetType, priority: offer.priority, nextOfferId: offer.nextOfferId || '', isActive: offer.isActive });
    setIsOfferModalOpen(true);
  };

  const openAddRule = () => { setOfferForm(DEFAULT_FORM); setEditingOfferId(null); setIsOfferModalOpen(true); };

  // ── Derived ──────────────────────────────────────────
  const sortedOffers = [...offersList].sort((a, b) => a.priority - b.priority);
  const filteredDrivers = driversData.filter(d => {
    const s = search.toLowerCase();
    return d.name.toLowerCase().includes(s) || (d.phone || '').includes(s);
  });
  const activeOffers    = offersList.filter(o => o.isActive);
  const totalAssigned   = driversData.filter(d => d.activeOffer !== 'No Level Assigned').length;
  const totalCompleted  = driversData.reduce((sum, d) => sum + d.completedOffersCount, 0);

  // ── Render ───────────────────────────────────────────
  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <PageHeader
        title="Driver Rewards"
        subtitle="Create reward rules, track driver progress, and view performance history."
        showBack
        backUrl="/drivers"
        actions={
          <div className="flex items-center gap-2">
            <button disabled={syncing} onClick={handleReSync}
              className="flex items-center gap-2 h-9 px-4 text-sm font-medium border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all disabled:opacity-50">
              <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
              {syncing ? 'Syncing...' : 'Sync Progress'}
            </button>
            <button onClick={openAddRule}
              className="flex items-center gap-2 h-9 px-4 text-sm font-semibold bg-pos-primary text-white rounded-xl hover:opacity-90 transition-all">
              <Plus size={14} /> Add Reward Rule
            </button>
          </div>
        }
      />

      {/* Auto Level-Up Banner */}
      <div className="bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-950/40 dark:to-violet-950/40 border border-indigo-100 dark:border-indigo-900/50 rounded-2xl p-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/60 rounded-lg flex items-center justify-center flex-shrink-0">
            <Zap size={15} className="text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-indigo-900 dark:text-indigo-200">Automatic Level-Up System</p>
            <p className="text-xs text-indigo-700 dark:text-indigo-400 mt-0.5 leading-relaxed">
              When a driver completes the required customers, they <strong>automatically earn their reward</strong> and move to the next level.
              Set this up in Reward Rules → "Auto Level-Up".
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 flex-shrink-0">
            <span className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg">Level 1</span>
            <ArrowRight size={12} />
            <span className="px-2 py-1 bg-violet-100 dark:bg-violet-900/50 text-violet-600 dark:text-violet-400 rounded-lg">Level 2</span>
            <ArrowRight size={12} />
            <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 rounded-lg">Level 3</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard icon={<Gift size={22} className="text-indigo-500" />}  label="Total Rules"       value={offersList.length}  sub={`${activeOffers.length} active`}         color="bg-indigo-50 dark:bg-indigo-950/40 border-indigo-100 dark:border-indigo-900/50 text-indigo-900 dark:text-indigo-100" />
        <StatCard icon={<Users size={22} className="text-violet-500" />} label="On Reward"         value={totalAssigned}      sub={`of ${driversData.length} total`}         color="bg-violet-50 dark:bg-violet-950/40 border-violet-100 dark:border-violet-900/50 text-violet-900 dark:text-violet-100" />
        <StatCard icon={<Trophy size={22} className="text-amber-500" />} label="Total Wins"        value={totalCompleted}     sub="all time completions"                     color="bg-amber-50 dark:bg-amber-950/40 border-amber-100 dark:border-amber-900/50 text-amber-900 dark:text-amber-100" />
        <StatCard icon={<TrendingUp size={22} className="text-emerald-500" />} label="Active Drivers" value={driversData.filter(d => d.status === 'Active').length} sub="currently active" color="bg-emerald-50 dark:bg-emerald-950/40 border-emerald-100 dark:border-emerald-900/50 text-emerald-900 dark:text-emerald-100" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-fit">
        {([
          { key: 'rules',   label: 'Reward Rules',      icon: <Star size={14} /> },
          { key: 'drivers', label: 'Driver Overview',   icon: <Users size={14} /> },
          { key: 'history', label: 'Reports & History', icon: <BarChart3 size={14} /> },
        ] as { key: ActiveTab; label: string; icon: React.ReactNode }[]).map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === tab.key ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>
            {tab.icon}{tab.label}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      {activeTab === 'rules' && (
        <RewardRulesTab
          offersList={offersList}
          sortedOffers={sortedOffers}
          activeOffersCount={activeOffers.length}
          onAddRule={openAddRule}
          onEditOffer={openEditOffer}
          onDeleteOffer={handleDeleteOffer}
        />
      )}

      {activeTab === 'drivers' && (
        <DriverOverviewTab
          drivers={filteredDrivers}
          offersList={offersList}
          loading={loading}
          search={search}
          propertyId={propertyId}
          onSearchChange={setSearch}
          onRewardGiven={() => { fetchData(); }}
        />
      )}

      {activeTab === 'history' && (
        <HistoryTab
          historyData={historyData}
          historySummary={historySummary}
          historyLoading={historyLoading}
          historyPeriod={historyPeriod}
          historyDateFrom={historyDateFrom}
          historyDateTo={historyDateTo}
          historyDriverFilter={historyDriverFilter}
          historyOfferFilter={historyOfferFilter}
          driversData={driversData}
          offersList={offersList}
          onPeriodChange={setHistoryPeriod}
          onDateFromChange={setHistoryDateFrom}
          onDateToChange={setHistoryDateTo}
          onDriverFilterChange={setHistoryDriverFilter}
          onOfferFilterChange={setHistoryOfferFilter}
          onApplyCustomRange={() => fetchHistory()}
        />
      )}

      {/* Modals */}
      <AddRuleModal
        isOpen={isOfferModalOpen}
        editingOfferId={editingOfferId}
        offerForm={offerForm}
        offersList={offersList}
        onClose={() => { setIsOfferModalOpen(false); setEditingOfferId(null); }}
        onSubmit={handleCreateOrUpdate}
        onChange={setOfferForm}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// Page Export
// ═══════════════════════════════════════════════════════
export default function DriverOffersPage() {
  return (
    <Suspense fallback={
      <div className="p-12 text-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-slate-400 mt-3">Loading Driver Rewards...</p>
      </div>
    }>
      <DriverOffersContent />
    </Suspense>
  );
}
 