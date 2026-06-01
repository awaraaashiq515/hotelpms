'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Trophy,
  RefreshCw,
  Plus,
  Gift,
  Edit,
  Trash2,
  Activity,
  Award,
  Search,
  Users,
  Target,
  RotateCcw,
  ChevronDown
} from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

// Types
export interface DriverProgress {
  id: string;
  name: string;
  phone: string;
  status: string;
  activeOffer: string;
  completedRides: number;
  referredCustomers: number;
  targetRides: number;
  targetReferrals: number;
  progressPercent: number;
  completedOffersCount: number;
}

function DriverOffersContent() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<'tracker' | 'rules'>(
    searchParams.get('tab') === 'slabs' ? 'rules' : 'tracker'
  );

  const [data, setData] = useState<DriverProgress[]>([]);
  const [offersList, setOffersList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [propertyId, setPropertyId] = useState<string | null>(null);

  // Modal states
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(searchParams.get('action') === 'new-slab');
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
  const [editingOfferId, setEditingOfferId] = useState<string | null>(null);

  // Form states
  const [offerForm, setOfferForm] = useState({
    title: '',
    offerType: 'RIDES',
    targetRides: 0,
    targetReferrals: 0,
    rewardValue: 0,
    rewardType: 'CASH',
    rewardItem: '',
    resetType: 'SAME_OFFER',
    priority: 1,
    nextOfferId: ''
  });
  const [assignForm, setAssignForm] = useState({ offerId: '' });

  const fetchProgress = async (pid?: string) => {
    const activePid = pid || propertyId;
    setLoading(true);
    try {
      const respOffers = await fetch(`/api/drivers/offers${activePid ? `?propertyId=${activePid}` : ''}`);
      if (respOffers.status === 401) return;
      const resultOffers = await respOffers.json();
      if (resultOffers.success) setOffersList(resultOffers.data);

      const progressUrl = `/api/drivers/offers/progress${activePid ? `?propertyId=${activePid}` : ''}`;
      const response = await fetch(progressUrl);
      if (response.status === 401) return;
      const result = await response.json();
      if (result.success) setData(result.data);
    } catch (error) {
      console.error('Failed to fetch tracking data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const sessionResponse = await fetch('/api/auth/session').then(res => res.json());
        const role = sessionResponse.user?.role;
        const orgId = sessionResponse.user?.organizationId;
        let currentPid = sessionResponse.user?.propertyId;

        if (!currentPid && (role === 'RESTAURANTS_ADMIN' || role === 'SUPER_ADMIN') && orgId) {
          const propResp = await fetch(`/api/setup/properties?organizationId=${orgId}`).then(res => res.json());
          if (propResp.success && propResp.data.length > 0) {
            currentPid = propResp.data[0].id;
          }
        }

        if (currentPid) {
          setPropertyId(currentPid);
          fetchProgress(currentPid);
        } else {
          fetchProgress();
        }
      } catch (err) {
        console.error('Session init failed:', err);
        fetchProgress();
      }
    };
    init();
  }, []);

  const handleCreateOrUpdateOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingOfferId ? `/api/drivers/offers/${editingOfferId}` : '/api/drivers/offers';
      const method = editingOfferId ? 'PATCH' : 'POST';
      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...offerForm, propertyId })
      });
      setIsOfferModalOpen(false);
      setEditingOfferId(null);
      setOfferForm({ title: '', offerType: 'RIDES', targetRides: 0, targetReferrals: 0, rewardValue: 0, rewardType: 'CASH', rewardItem: '', resetType: 'SAME_OFFER', priority: 1, nextOfferId: '' });
      fetchProgress();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteOffer = async (id: string) => {
    if (!confirm('Kya aap yeh reward rule delete karna chahte hain?')) return;
    try {
      await fetch(`/api/drivers/offers/${id}`, { method: 'DELETE' });
      fetchProgress();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAssignOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDriverId || !assignForm.offerId) return;
    try {
      await fetch('/api/drivers/offers/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driverId: selectedDriverId, offerId: assignForm.offerId, propertyId })
      });
      setIsAssignModalOpen(false);
      fetchProgress();
    } catch (err) {
      console.error(err);
    }
  };

  const [syncing, setSyncing] = useState(false);

  const handleReSync = async () => {
    setSyncing(true);
    try {
      await fetch('/api/drivers/offers/re-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId })
      });
      await fetchProgress();
      alert('Done! All driver progress has been updated.');
    } catch (err) {
      console.error('Sync failed:', err);
      alert('Update failed. Please try again.');
    } finally {
      setSyncing(false);
    }
  };

  const handleManageAction = async (driverId: string, action: 'RESET' | 'REDEEM_AND_RESET') => {
    const confirmMsg = action === 'RESET'
      ? 'Are you sure you want to reset this driver\'s progress to zero?'
      : 'Give reward and restart this driver from zero?';
    if (!confirm(confirmMsg)) return;
    try {
      await fetch('/api/drivers/offers/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driverId, action, propertyId })
      });
      fetchProgress();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredData = data.filter(d => {
    const s = search.toLowerCase();
    return d.name.toLowerCase().includes(s) || (d.phone || '').includes(s);
  });

  return (
    <div className="space-y-6 pb-16">
      <PageHeader
        title="Driver Progress"
        subtitle="Track how many customers your drivers bring and give them rewards."
        showBack
        backUrl="/drivers"
        actions={
          <div className="flex items-center gap-3">
            <Button
              disabled={syncing}
              variant="secondary"
              className="h-10 px-4 text-sm font-medium border border-slate-200 rounded-xl bg-white text-slate-600 gap-2"
              onClick={handleReSync}
            >
              <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
              {syncing ? 'Updating...' : 'Refresh'}
            </Button>
            <Button
              className="h-10 px-4 text-sm font-medium bg-pos-primary text-white rounded-xl gap-2"
              onClick={() => { setActiveTab('rules'); setIsOfferModalOpen(true); }}
            >
              <Plus size={14} />
              Add Reward Rule
            </Button>
          </div>
        }
      />

      {/* Simple Info Box */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-start gap-3">
        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
          <Activity size={16} className="text-blue-600" />
        </div>
        <div>
          <p className="text-sm font-semibold text-blue-900">How it works?</p>
          <p className="text-sm text-blue-700 mt-0.5">
            Every time you select a driver on the POS Billing page, it counts as 1 customer for them.
            Once they reach their target, they automatically earn a cash or gift reward.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('tracker')}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'tracker' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Users size={15} />
          Driver Progress
        </button>
        <button
          onClick={() => setActiveTab('rules')}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'rules' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Gift size={15} />
          Reward Rules
        </button>
      </div>

      {/* TAB: Driver Progress */}
      {activeTab === 'tracker' && (
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search driver by name or phone number..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary"
            />
          </div>

          {/* Driver Table */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-slate-400 text-sm">Loading...</div>
            ) : filteredData.length === 0 ? (
              <div className="p-12 text-center">
                <Users size={32} className="mx-auto text-slate-200 mb-3" />
                <p className="text-sm font-semibold text-slate-600">No drivers found</p>
                <p className="text-xs text-slate-400 mt-1">Assign a reward level to your drivers first.</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="text-left text-xs font-semibold text-slate-500 px-5 py-3">Driver</th>
                    <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">Current Level</th>
                    <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">Progress</th>
                    <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">Wins</th>
                    <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredData.map(row => {
                    const hasNoLevel = row.activeOffer === 'No Level Assigned';
                    const isDone = row.progressPercent >= 100;
                    const isNear = row.progressPercent >= 80 && row.progressPercent < 100;

                    return (
                      <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                        {/* Driver Name */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-pos-primary/10 text-pos-primary flex items-center justify-center text-xs font-bold flex-shrink-0 uppercase">
                              {row.name.substring(0, 2)}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-800">{row.name}</p>
                              <p className="text-xs text-slate-400">{row.phone || 'No phone'}</p>
                            </div>
                          </div>
                        </td>

                        {/* Level */}
                        <td className="px-4 py-4">
                          {hasNoLevel ? (
                            <button
                              onClick={() => { setSelectedDriverId(row.id); setAssignForm({ offerId: '' }); setIsAssignModalOpen(true); }}
                              className="text-xs font-semibold text-red-500 border border-red-200 bg-red-50 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors flex items-center gap-1"
                            >
                              <Plus size={12} /> Assign Level
                            </button>
                          ) : (
                            <button
                              onClick={() => { setSelectedDriverId(row.id); setAssignForm({ offerId: '' }); setIsAssignModalOpen(true); }}
                              className="text-xs font-semibold text-slate-700 border border-slate-200 bg-slate-50 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors flex items-center gap-1"
                            >
                              {row.activeOffer} <ChevronDown size={12} />
                            </button>
                          )}
                        </td>

                        {/* Progress */}
                        <td className="px-4 py-4">
                          {hasNoLevel ? (
                            <span className="text-xs text-slate-300">—</span>
                          ) : (
                            <div className="w-44 space-y-1.5">
                              <div className="flex justify-between text-xs text-slate-500">
                                <span>{row.completedRides} customers</span>
                                <span>Target: {row.targetRides}</span>
                              </div>
                              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-700 ${isDone ? 'bg-emerald-500' : 'bg-pos-primary'}`}
                                  style={{ width: `${Math.min(row.progressPercent, 100)}%` }}
                                />
                              </div>
                              <p className={`text-xs font-semibold ${isDone ? 'text-emerald-600' : isNear ? 'text-orange-500' : 'text-slate-400'}`}>
                                {isDone ? '✓ Target reached!' : isNear ? 'Almost there!' : `${row.progressPercent.toFixed(0)}%`}
                              </p>
                            </div>
                          )}
                        </td>

                        {/* Wins */}
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <Trophy size={15} className={row.completedOffersCount > 0 ? 'text-amber-500' : 'text-slate-200'} />
                            <span className="text-sm font-semibold text-slate-600">{row.completedOffersCount}</span>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleManageAction(row.id, 'REDEEM_AND_RESET')}
                              className="text-xs font-semibold text-amber-600 border border-amber-200 bg-amber-50 px-3 py-1.5 rounded-lg hover:bg-amber-100 transition-colors flex items-center gap-1"
                              title="Give reward and restart"
                            >
                              <Award size={12} /> Force Win
                            </button>
                            <button
                              onClick={() => handleManageAction(row.id, 'RESET')}
                              className="text-xs font-semibold text-slate-500 border border-slate-200 bg-white px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors flex items-center gap-1"
                              title="Reset progress to zero"
                            >
                              <RotateCcw size={12} /> Reset
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* TAB: Reward Rules */}
      {activeTab === 'rules' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-800">Reward Rules</h3>
              <p className="text-sm text-slate-500">Set how many customers a driver must bring to earn a reward.</p>
            </div>
            <Button
              className="h-10 px-4 text-sm font-medium bg-pos-primary text-white rounded-xl gap-2"
              onClick={() => setIsOfferModalOpen(true)}
            >
              <Plus size={14} /> Add New Rule
            </Button>
          </div>

          {offersList.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center">
              <Gift size={32} className="mx-auto text-slate-200 mb-3" />
              <p className="text-sm font-semibold text-slate-600">No reward rules yet</p>
              <p className="text-xs text-slate-400 mt-1">Add your first rule to get started.</p>
              <Button
                className="mt-5 h-10 px-5 text-sm bg-pos-primary text-white rounded-xl"
                onClick={() => setIsOfferModalOpen(true)}
              >
                <Plus size={14} className="mr-1" /> Add Rule
              </Button>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="text-left text-xs font-semibold text-slate-500 px-5 py-3">Level</th>
                    <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">Target</th>
                    <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">Reward</th>
                    <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">Baad mein</th>
                    <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {offersList.map(offer => (
                    <tr key={offer.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-pos-primary/10 text-pos-primary flex items-center justify-center text-xs font-bold">
                            {offer.priority}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-800">{offer.title}</p>
                            {!offer.isActive && <p className="text-xs text-slate-400">Inactive</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm text-slate-700">
                          <span className="font-bold">{offer.targetRides}</span> customers
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        {offer.rewardType === 'CASH' ? (
                          <span className="text-sm font-bold text-emerald-600">₹{offer.rewardValue} cash</span>
                        ) : (
                          <span className="text-sm font-bold text-amber-600 flex items-center gap-1">
                            <Gift size={13} /> {offer.rewardItem}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-xs text-slate-500">
                          {offer.resetType === 'SAME_OFFER' ? 'Repeat same level' : offer.resetType === 'NEXT_OFFER' ? 'Move to next level' : 'Stop after reward'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => { setEditingOfferId(offer.id); setOfferForm({ ...offer, rewardItem: offer.rewardItem || '' }); setIsOfferModalOpen(true); }}
                            className="text-xs font-semibold text-pos-primary border border-pos-primary/20 bg-pos-primary/5 px-3 py-1.5 rounded-lg hover:bg-pos-primary/10 transition-colors flex items-center gap-1"
                          >
                            <Edit size={12} /> Edit
                          </button>
                          <button
                            onClick={() => handleDeleteOffer(offer.id)}
                            className="text-xs font-semibold text-red-500 border border-red-200 bg-red-50 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal: Add / Edit Reward Rule */}
      <Modal
        isOpen={isOfferModalOpen}
        onClose={() => { setIsOfferModalOpen(false); setEditingOfferId(null); }}
        title={editingOfferId ? 'Edit Reward Rule' : 'Add New Reward Rule'}
      >
        <form onSubmit={handleCreateOrUpdateOffer} className="space-y-5 pt-2">
          {/* Level Name */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Level Name</label>
            <input
              required
              type="text"
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary"
              value={offerForm.title}
              onChange={e => setOfferForm({ ...offerForm, title: e.target.value })}
              placeholder="e.g. Level 1 - Starter"
            />
          </div>

          {/* Target & Level Number */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Customers Required</label>
              <input
                required
                type="number"
                min="1"
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary"
                value={offerForm.targetRides}
                onChange={e => setOfferForm({ ...offerForm, targetRides: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Level Number</label>
              <input
                type="number"
                min="1"
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary"
                value={offerForm.priority}
                onChange={e => setOfferForm({ ...offerForm, priority: parseInt(e.target.value) || 1 })}
              />
            </div>
          </div>

          {/* Reward Type */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Reward Type</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setOfferForm({ ...offerForm, rewardType: 'CASH' })}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all ${offerForm.rewardType === 'CASH' ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'bg-white border-slate-200 text-slate-500'}`}
              >
                💵 Cash
              </button>
              <button
                type="button"
                onClick={() => setOfferForm({ ...offerForm, rewardType: 'GIFT' })}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all ${offerForm.rewardType === 'GIFT' ? 'bg-amber-50 border-amber-300 text-amber-700' : 'bg-white border-slate-200 text-slate-500'}`}
              >
                🎁 Gift
              </button>
            </div>
          </div>

          {/* Reward value */}
          <div>
            {offerForm.rewardType === 'CASH' ? (
              <>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Cash Amount (₹)</label>
                <input
                  required
                  type="number"
                  min="0"
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400"
                  value={offerForm.rewardValue}
                  onChange={e => setOfferForm({ ...offerForm, rewardValue: parseFloat(e.target.value) || 0 })}
                  placeholder="e.g. 500"
                />
              </>
            ) : (
              <>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Gift Item Name</label>
                <input
                  required
                  type="text"
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-400"
                  placeholder="e.g. Helmet, T-Shirt"
                  value={offerForm.rewardItem}
                  onChange={e => setOfferForm({ ...offerForm, rewardItem: e.target.value })}
                />
              </>
            )}
          </div>

          {/* After completing */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">After target is reached?</label>
            <select
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-pos-primary/20"
              value={offerForm.resetType}
              onChange={e => setOfferForm({ ...offerForm, resetType: e.target.value })}
            >
              <option value="SAME_OFFER">Repeat the same level</option>
              <option value="NEXT_OFFER">Move to next level</option>
              <option value="CAMPAIGN_RESET">Stop after giving reward</option>
            </select>
          </div>

          {offerForm.resetType === 'NEXT_OFFER' && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Which level comes next?</label>
              <select
                required
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-pos-primary/20"
                value={offerForm.nextOfferId}
                onChange={e => setOfferForm({ ...offerForm, nextOfferId: e.target.value })}
              >
                <option value="">-- Select a level --</option>
                {offersList.filter(o => o.id !== editingOfferId).map(offer => (
                  <option key={offer.id} value={offer.id}>{offer.title} (Level {offer.priority})</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex gap-3 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="secondary"
              className="flex-1 h-11 rounded-xl border border-slate-200 text-sm font-semibold"
              onClick={() => { setIsOfferModalOpen(false); setEditingOfferId(null); }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 h-11 rounded-xl bg-pos-primary text-white text-sm font-semibold"
            >
              {editingOfferId ? 'Save Changes' : 'Add Rule'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Assign Level */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title="Change Driver Level"
      >
        <form onSubmit={handleAssignOffer} className="space-y-5 pt-2">
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-sm text-amber-800">
            ⚠️ Changing the level will reset this driver's current progress.
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Select New Level</label>
            <select
              required
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-pos-primary/20"
              value={assignForm.offerId}
              onChange={e => setAssignForm({ offerId: e.target.value })}
            >
              <option value="" disabled>-- Choose a level --</option>
              {offersList.map(offer => (
                <option key={offer.id} value={offer.id}>{offer.title} (Target: {offer.targetRides} customers)</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 border-t border-slate-100 pt-2">
            <Button
              type="button"
              variant="secondary"
              className="flex-1 h-11 rounded-xl border border-slate-200 text-sm font-semibold"
              onClick={() => setIsAssignModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 h-11 rounded-xl bg-slate-800 text-white text-sm font-semibold"
            >
              Change Level
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default function DriverOffersPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Loading...</div>}>
      <DriverOffersContent />
    </Suspense>
  );
}
