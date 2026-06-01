'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Trophy, Percent, Banknote, Calendar, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { useTheme } from '@/components/providers/ThemeProvider';

interface MembershipPlan {
  id: string;
  name: string;
  description: string | null;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  minOrderValue: number;
  validityDays: number;
  isActive: boolean;
  _count: { cards: number };
}

export default function MembershipPlansPage() {
  const { theme } = useTheme();
  const { addToast } = useToast();
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<MembershipPlan | null>(null);
  const [mutationLoading, setMutationLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    discountType: 'PERCENTAGE',
    discountValue: '',
    minOrderValue: '',
    validityDays: '365',
    isActive: true,
  });

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/memberships/plans');
      const data = await res.json();
      if (data.success) setPlans(data.data);
    } catch (err) {
      addToast('error', 'Failed to fetch membership plans');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (plan?: MembershipPlan) => {
    if (plan) {
      setSelectedPlan(plan);
      setFormData({
        name: plan.name,
        description: plan.description || '',
        discountType: plan.discountType,
        discountValue: plan.discountValue.toString(),
        minOrderValue: plan.minOrderValue.toString(),
        validityDays: plan.validityDays.toString(),
        isActive: plan.isActive,
      });
    } else {
      setSelectedPlan(null);
      setFormData({
        name: '',
        description: '',
        discountType: 'PERCENTAGE',
        discountValue: '',
        minOrderValue: '0',
        validityDays: '365',
        isActive: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMutationLoading(true);
    try {
      const url = selectedPlan ? `/api/memberships/plans/${selectedPlan.id}` : '/api/memberships/plans';
      const method = selectedPlan ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        addToast('success', `Plan ${selectedPlan ? 'updated' : 'created'} successfully`);
        fetchPlans();
        setIsModalOpen(false);
      } else {
        addToast('error', data.message || 'Action failed');
      }
    } catch (err) {
      addToast('error', 'An error occurred');
    } finally {
      setMutationLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this plan? This may affect issued cards.')) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/memberships/plans/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        addToast('success', 'Plan deleted');
        fetchPlans();
      } else {
        addToast('error', data.message || 'Delete failed');
      }
    } catch (err) {
      addToast('error', 'An error occurred');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className={`p-6 lg:p-10 min-h-screen ${theme === 'dark' ? 'bg-[#0f172a]' : 'bg-slate-50/50'}`}>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div className="flex items-center gap-5">
            <div className={`w-14 h-14 rounded-[1.25rem] flex items-center justify-center shadow-lg transition-all ${theme === 'dark' ? 'bg-indigo-500/20 text-indigo-400 shadow-indigo-500/10' : 'bg-indigo-600 text-white shadow-indigo-200'}`}>
              <Trophy size={28} />
            </div>
            <div>
              <h1 className={`text-2xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Membership Plans</h1>
              <p className={`text-sm font-bold mt-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Create and manage loyalty tiers for your restaurant</p>
            </div>
          </div>
          <Button 
            onClick={() => handleOpenModal()} 
            className="h-12 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-200 dark:shadow-none flex items-center gap-2 font-black uppercase text-[11px] tracking-widest transition-all active:scale-95"
          >
            <Plus size={18} /> Create Plan
          </Button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className={`h-64 rounded-3xl animate-pulse ${theme === 'dark' ? 'bg-slate-800' : 'bg-white border border-slate-100'}`} />
            ))}
          </div>
        ) : plans.length === 0 ? (
          <div className={`flex flex-col items-center justify-center py-20 rounded-[2.5rem] border-2 border-dashed ${theme === 'dark' ? 'border-slate-800 text-slate-500' : 'border-slate-200 text-slate-400'}`}>
            <Trophy size={64} className="mb-6 opacity-20" />
            <p className="text-lg font-black uppercase tracking-widest mb-4">No Plans Created Yet</p>
            <Button onClick={() => handleOpenModal()} className="bg-indigo-600/10 text-indigo-600 hover:bg-indigo-600 hover:text-white border border-indigo-600/20">
              Create Your First Plan
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div 
                key={plan.id}
                className={`group relative rounded-[2rem] p-8 transition-all duration-300 hover:scale-[1.02] ${
                  theme === 'dark' 
                  ? 'bg-slate-900 border border-slate-800 hover:border-indigo-500/50 shadow-2xl shadow-black/20' 
                  : 'bg-white border border-slate-100 hover:border-indigo-200 shadow-xl shadow-slate-200/50'
                }`}
              >
                <div className="flex items-start justify-between mb-6">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${theme === 'dark' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                    <Trophy size={24} />
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleOpenModal(plan)} className={`p-2 rounded-xl transition-all ${theme === 'dark' ? 'hover:bg-slate-800 text-slate-500 hover:text-white' : 'hover:bg-slate-50 text-slate-400 hover:text-indigo-600'}`}>
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDelete(plan.id)} className={`p-2 rounded-xl transition-all ${theme === 'dark' ? 'hover:bg-rose-500/10 text-slate-500 hover:text-rose-400' : 'hover:bg-rose-50 text-slate-400 hover:text-rose-600'}`}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <h3 className={`text-xl font-black mb-2 tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{plan.name}</h3>
                <p className={`text-sm font-bold mb-6 line-clamp-2 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>{plan.description || 'No description provided'}</p>

                <div className="space-y-4 mb-8">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Percent size={16} className="text-emerald-500" />
                      <span className={`text-xs font-black uppercase tracking-widest ${theme === 'dark' ? 'text-slate-400' : 'text-slate-400'}`}>Discount</span>
                    </div>
                    <span className={`text-sm font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                      {plan.discountValue}{plan.discountType === 'PERCENTAGE' ? '%' : ' FIXED'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Banknote size={16} className="text-amber-500" />
                      <span className={`text-xs font-black uppercase tracking-widest ${theme === 'dark' ? 'text-slate-400' : 'text-slate-400'}`}>Min Order</span>
                    </div>
                    <span className={`text-sm font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>₹{plan.minOrderValue}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar size={16} className="text-blue-500" />
                      <span className={`text-xs font-black uppercase tracking-widest ${theme === 'dark' ? 'text-slate-400' : 'text-slate-400'}`}>Validity</span>
                    </div>
                    <span className={`text-sm font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{plan.validityDays} Days</span>
                  </div>
                </div>

                <div className={`pt-6 border-t ${theme === 'dark' ? 'border-slate-800' : 'border-slate-50'} flex items-center justify-between`}>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${plan.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">{plan.isActive ? 'Active' : 'Inactive'}</span>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{plan._count.cards} Cards Issued</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedPlan ? "Edit Membership Plan" : "Create New Plan"}
        maxWidth="md"
      >
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Plan Name</label>
              <input 
                required
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Platinum Club"
                className={`w-full px-5 py-4 rounded-2xl border outline-none transition-all font-bold ${theme === 'dark' ? 'bg-slate-900 border-slate-800 text-white focus:border-indigo-500' : 'bg-slate-50 border-slate-100 text-slate-900 focus:border-indigo-600 focus:bg-white'}`}
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Description</label>
              <textarea 
                rows={3}
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the benefits..."
                className={`w-full px-5 py-4 rounded-2xl border outline-none transition-all font-bold ${theme === 'dark' ? 'bg-slate-900 border-slate-800 text-white focus:border-indigo-500' : 'bg-slate-50 border-slate-100 text-slate-900 focus:border-indigo-600 focus:bg-white'}`}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Discount Type</label>
                <select 
                  value={formData.discountType}
                  onChange={e => setFormData({ ...formData, discountType: e.target.value })}
                  className={`w-full px-5 py-4 rounded-2xl border outline-none transition-all font-bold ${theme === 'dark' ? 'bg-slate-900 border-slate-800 text-white focus:border-indigo-500' : 'bg-slate-50 border-slate-100 text-slate-900 focus:border-indigo-600 focus:bg-white'}`}
                >
                  <option value="PERCENTAGE">Percentage (%)</option>
                  <option value="FIXED">Fixed Amount (₹)</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Value</label>
                <input 
                  required
                  type="number"
                  value={formData.discountValue}
                  onChange={e => setFormData({ ...formData, discountValue: e.target.value })}
                  placeholder="20"
                  className={`w-full px-5 py-4 rounded-2xl border outline-none transition-all font-bold ${theme === 'dark' ? 'bg-slate-900 border-slate-800 text-white focus:border-indigo-500' : 'bg-slate-50 border-slate-100 text-slate-900 focus:border-indigo-600 focus:bg-white'}`}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Min Order (₹)</label>
                <input 
                  required
                  type="number"
                  value={formData.minOrderValue}
                  onChange={e => setFormData({ ...formData, minOrderValue: e.target.value })}
                  placeholder="0"
                  className={`w-full px-5 py-4 rounded-2xl border outline-none transition-all font-bold ${theme === 'dark' ? 'bg-slate-900 border-slate-800 text-white focus:border-indigo-500' : 'bg-slate-50 border-slate-100 text-slate-900 focus:border-indigo-600 focus:bg-white'}`}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Validity (Days)</label>
                <input 
                  required
                  type="number"
                  value={formData.validityDays}
                  onChange={e => setFormData({ ...formData, validityDays: e.target.value })}
                  placeholder="365"
                  className={`w-full px-5 py-4 rounded-2xl border outline-none transition-all font-bold ${theme === 'dark' ? 'bg-slate-900 border-slate-800 text-white focus:border-indigo-500' : 'bg-slate-50 border-slate-100 text-slate-900 focus:border-indigo-600 focus:bg-white'}`}
                />
              </div>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <input 
                type="checkbox"
                checked={formData.isActive}
                onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-5 h-5 rounded-lg border-slate-300 text-indigo-600 focus:ring-indigo-600"
              />
              <span className="text-[11px] font-black uppercase tracking-widest text-slate-500">Plan is currently active</span>
            </div>
          </div>

          <div className="pt-6 flex gap-3">
            <Button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 h-14 bg-slate-100 text-slate-600 hover:bg-slate-200 font-black uppercase text-[11px] tracking-widest rounded-2xl">
              Cancel
            </Button>
            <Button 
              type="submit" 
              loading={mutationLoading}
              className="flex-2 h-14 bg-indigo-600 text-white hover:bg-indigo-700 font-black uppercase text-[11px] tracking-widest rounded-2xl shadow-lg shadow-indigo-100 dark:shadow-none"
            >
              {selectedPlan ? 'Update Plan' : 'Create Plan'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
