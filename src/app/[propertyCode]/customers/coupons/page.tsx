'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Tag, Plus, RefreshCw, Trash2, Calendar, 
  Percent, DollarSign, Users, Award, ShieldAlert
} from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { SearchToolbar } from '@/components/shared/search-toolbar';
import { DataTable } from '@/components/shared/data-table';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';

interface Coupon {
  id: string;
  code: string;
  discountType: string;
  discountValue: number;
  minOrderValue: number;
  maxDiscount?: number;
  expiryDate: string;
  isActive: boolean;
  assignedGuest?: { id: string; firstName: string; lastName?: string; mobile?: string };
}

interface Customer {
  id: string;
  firstName: string;
  lastName?: string;
  mobile?: string;
}

export default function CouponsPage() {
  const { showToast } = useToast();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [mutationLoading, setMutationLoading] = useState(false);
  const [search, setSearch] = useState('');

  // Coupon states
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState('PERCENTAGE');
  const [discountValue, setDiscountValue] = useState('');
  const [minOrderValue, setMinOrderValue] = useState('');
  const [maxDiscount, setMaxDiscount] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [assignedGuestId, setAssignedGuestId] = useState('');

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/marketing/coupons');
      const data = await res.json();
      if (data.success) {
        setCoupons(data.data || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await fetch('/api/customers');
      const data = await res.json();
      if (data.success) {
        setCustomers(data.data || []);
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchCoupons();
    fetchCustomers();
  }, []);

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !discountType || !discountValue || !expiryDate) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    setMutationLoading(true);
    try {
      const res = await fetch('/api/marketing/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code.toUpperCase().trim(),
          discountType,
          discountValue: Number(discountValue),
          minOrderValue: minOrderValue ? Number(minOrderValue) : 0,
          maxDiscount: maxDiscount ? Number(maxDiscount) : null,
          expiryDate: new Date(expiryDate).toISOString(),
          assignedGuestId: assignedGuestId || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Coupon created successfully!', 'success');
        setIsFormOpen(false);
        // Reset state
        setCode('');
        setDiscountType('PERCENTAGE');
        setDiscountValue('');
        setMinOrderValue('');
        setMaxDiscount('');
        setExpiryDate('');
        setAssignedGuestId('');
        fetchCoupons();
      } else {
        showToast(data.message || 'Failed to create coupon', 'error');
      }
    } catch (error) {
      showToast('Error creating coupon', 'error');
    } finally {
      setMutationLoading(false);
    }
  };

  const filteredCoupons = coupons.filter(c => 
    c.code.toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    {
      header: 'Coupon Code',
      cell: (row: Coupon) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-pos-primary/10 flex items-center justify-center text-pos-primary shrink-0 font-mono font-black">
            %
          </div>
          <div>
            <p className="text-xs font-mono font-black uppercase text-slate-800 dark:text-slate-100 tracking-widest">{row.code}</p>
            {row.assignedGuest && (
              <p className="text-[9px] text-indigo-500 font-bold uppercase mt-0.5">Assigned to: {row.assignedGuest.firstName} ({row.assignedGuest.mobile || 'No phone'})</p>
            )}
          </div>
        </div>
      )
    },
    {
      header: 'Discount Details',
      cell: (row: Coupon) => (
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-black text-slate-800 dark:text-slate-200">
            {row.discountType === 'PERCENTAGE' ? `${row.discountValue}% Off` : `₹${row.discountValue} Off`}
          </span>
          <span className="text-[10px] text-slate-400 font-bold">Min Order: ₹{row.minOrderValue}</span>
        </div>
      ),
      width: '180px'
    },
    {
      header: 'Expires On',
      cell: (row: Coupon) => (
        <span className="text-xs text-slate-500 font-bold">
          {new Date(row.expiryDate).toLocaleDateString()}
        </span>
      ),
      width: '140px'
    },
    {
      header: 'Status',
      cell: (row: Coupon) => {
        const isExpired = new Date(row.expiryDate) < new Date();
        const active = row.isActive && !isExpired;
        return (
          <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
            active 
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' 
              : 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-455'
          }`}>
            {active ? 'ACTIVE' : isExpired ? 'EXPIRED' : 'INACTIVE'}
          </span>
        );
      },
      width: '120px'
    }
  ];

  return (
    <div className="space-y-8">
      <PageHeader 
        title="Smart Coupons Builder" 
        subtitle="Create discount campaigns and guest loyalty vouchers"
        showBack
        backUrl="/customers"
        actions={
          <Button 
            onClick={() => setIsFormOpen(true)}
            className="bg-pos-primary hover:bg-red-700 text-white font-bold text-xs tracking-widest px-6 py-3 rounded-lg shadow-lg shadow-red-200"
          >
             CREATE NEW COUPON
          </Button>
        }
      />

      {/* CRM Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-white/10 pb-4">
        <Link
          href="/customers"
          className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 text-slate-500 hover:text-slate-800 dark:hover:text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all"
        >
          Guests List
        </Link>
        <Link
          href="/customers/campaigns"
          className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 text-slate-500 hover:text-slate-800 dark:hover:text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all"
        >
          Marketing Campaigns
        </Link>
        <Link
          href="/customers/coupons"
          className="px-4 py-2 bg-pos-primary text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-md"
        >
          Smart Coupons
        </Link>
        <Link
          href="/customers/loyalty-settings"
          className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 text-slate-500 hover:text-slate-800 dark:hover:text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all"
        >
          Loyalty Rules
        </Link>
      </div>

      {/* 📊 STATS SUMMARY */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-lg flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-pos-primary/10 flex items-center justify-center text-pos-primary shrink-0">
            <Tag size={20} />
          </div>
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Total Coupons</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none">{coupons.length} coupons</p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-lg flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-600/10 flex items-center justify-center text-emerald-600 shrink-0">
            <Users size={20} />
          </div>
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Assigned Guest Coupons</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none">{coupons.filter(c => c.assignedGuest).length} personalized</p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-lg flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-violet-600/10 flex items-center justify-center text-violet-600 shrink-0">
            <Award size={20} />
          </div>
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Active Coupons</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
              {coupons.filter(c => c.isActive && new Date(c.expiryDate) >= new Date()).length} active
            </p>
          </div>
        </div>
      </div>

      <SearchToolbar 
        value={search}
        onChange={setSearch}
        placeholder="Search coupons by code name..."
      />

      <DataTable 
        columns={columns} 
        data={filteredCoupons} 
        loading={loading}
      />

      {/* Coupon Builder Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title="Generate Smart Coupon"
      >
        <form onSubmit={handleCreateCoupon} className="space-y-4 p-4">
          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest ml-1">Coupon Code</label>
            <input
              type="text"
              placeholder="e.g., WELCOME50 or SAVEMORE"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 dark:text-white border border-transparent dark:border-slate-600 rounded-xl text-sm font-semibold focus:outline-none uppercase tracking-widest placeholder:text-slate-300"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest ml-1">Discount Type</label>
              <select
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 dark:text-white border border-transparent dark:border-slate-600 rounded-xl text-sm font-semibold focus:outline-none cursor-pointer"
              >
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FIXED">Fixed Amount (₹)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest ml-1">Discount Value</label>
              <input
                type="number"
                placeholder="e.g., 10 or 150"
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 dark:text-white border border-transparent dark:border-slate-600 rounded-xl text-sm font-semibold focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest ml-1">Min Order Value (₹)</label>
              <input
                type="number"
                placeholder="e.g., 500"
                value={minOrderValue}
                onChange={(e) => setMinOrderValue(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 dark:text-white border border-transparent dark:border-slate-600 rounded-xl text-sm font-semibold focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest ml-1">Max Discount Cap (₹)</label>
              <input
                type="number"
                placeholder="Only for % discount"
                disabled={discountType !== 'PERCENTAGE'}
                value={maxDiscount}
                onChange={(e) => setMaxDiscount(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 dark:text-white border border-transparent dark:border-slate-600 rounded-xl text-sm font-semibold focus:outline-none disabled:opacity-50"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest ml-1">Expiry Date</label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 dark:text-white border border-transparent dark:border-slate-600 rounded-xl text-sm font-semibold focus:outline-none cursor-pointer"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest ml-1">Assign to Customer (Optional)</label>
              <select
                value={assignedGuestId}
                onChange={(e) => setAssignedGuestId(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 dark:text-white border border-transparent dark:border-slate-600 rounded-xl text-sm font-semibold focus:outline-none cursor-pointer"
              >
                <option value="">Public Coupon (Open to all)</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.firstName} {c.lastName || ''} ({c.mobile || 'No mobile'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsFormOpen(false)}
              className="flex-1 py-3 text-xs font-bold uppercase tracking-widest bg-white dark:bg-slate-800 dark:text-slate-300"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={mutationLoading}
              className="flex-1 py-3 text-xs font-bold uppercase tracking-widest bg-pos-primary hover:bg-red-700 text-white shadow-lg shadow-red-100"
            >
              Generate Coupon
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
