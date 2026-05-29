'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Megaphone, Plus, RefreshCw, Send, Tag, Gift, 
  CheckCircle, AlertCircle, Calendar, MessageSquare
} from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { SearchToolbar } from '@/components/shared/search-toolbar';
import { DataTable } from '@/components/shared/data-table';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';

interface Campaign {
  id: string;
  name: string;
  type: string;
  targetGroup: string;
  message: string;
  status: string;
  sentAt?: string;
  coupon?: { id: string; code: string; discountValue: number };
}

interface Coupon {
  id: string;
  code: string;
  discountType: string;
  discountValue: number;
}

export default function CampaignsPage() {
  const { showToast } = useToast();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [todayBirthdays, setTodayBirthdays] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [mutationLoading, setMutationLoading] = useState(false);
  const [search, setSearch] = useState('');
  
  // Composer states
  const [name, setName] = useState('');
  const [type, setType] = useState('PROMOTIONAL');
  const [targetGroup, setTargetGroup] = useState('ALL');
  const [message, setMessage] = useState('');
  const [selectedCouponId, setSelectedCouponId] = useState('');

  // Daily birthday run state
  const [triggeringBirthday, setTriggeringBirthday] = useState(false);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/marketing/campaigns');
      const data = await res.json();
      if (data.success) {
        setCampaigns(data.data || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCoupons = async () => {
    try {
      const res = await fetch('/api/marketing/coupons');
      const data = await res.json();
      if (data.success) {
        setCoupons(data.data || []);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchTodayBirthdays = async () => {
    try {
      const res = await fetch('/api/customers');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        const now = new Date();
        const currentDay = now.getDate();
        const currentMonth = now.getMonth();
        const bdays = data.data.filter((c: any) => {
          if (!c.birthDate) return false;
          const b = new Date(c.birthDate);
          return b.getDate() === currentDay && b.getMonth() === currentMonth;
        });
        setTodayBirthdays(bdays);
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchCampaigns();
    fetchCoupons();
    fetchTodayBirthdays();
  }, []);

  const handleLaunchCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !message) {
      showToast('Name and message are required', 'error');
      return;
    }
    setMutationLoading(true);
    try {
      const res = await fetch('/api/marketing/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          type,
          targetGroup,
          message,
          couponId: selectedCouponId || undefined
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Campaign launched successfully in the background!', 'success');
        setIsFormOpen(false);
        // Reset composer
        setName('');
        setType('PROMOTIONAL');
        setTargetGroup('ALL');
        setMessage('');
        setSelectedCouponId('');
        fetchCampaigns();
      } else {
        showToast(data.message || 'Failed to launch campaign', 'error');
      }
    } catch (error) {
      showToast('Error dispatching campaign', 'error');
    } finally {
      setMutationLoading(false);
    }
  };

  const handleTriggerBirthdayCampaigns = async () => {
    setTriggeringBirthday(true);
    try {
      const res = await fetch('/api/marketing/campaigns/birthday', {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'Birthday greetings sent successfully!', 'success');
        fetchCampaigns();
        fetchTodayBirthdays();
      } else {
        showToast(data.message || 'Failed to process birthday greetings', 'error');
      }
    } catch (error) {
      showToast('Error sending birthday campaigns', 'error');
    } finally {
      setTriggeringBirthday(false);
    }
  };

  const filteredCampaigns = campaigns.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.type.toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    {
      header: 'Campaign Detail',
      cell: (row: Campaign) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-pos-primary/10 flex items-center justify-center text-pos-primary shrink-0">
            <Megaphone size={14} />
          </div>
          <div>
            <p className="text-xs font-black uppercase text-slate-800 dark:text-slate-100 leading-tight">{row.name}</p>
            <p className="text-[10px] text-slate-400 font-bold leading-none mt-0.5">{row.type} • Target: {row.targetGroup}</p>
          </div>
        </div>
      )
    },
    {
      header: 'Attached Coupon',
      cell: (row: Campaign) => (
        row.coupon ? (
          <span className="text-[10px] font-mono font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded-md tracking-wider">
            {row.coupon.code}
          </span>
        ) : (
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">None</span>
        )
      ),
      width: '120px'
    },
    {
      header: 'Sent On',
      cell: (row: Campaign) => (
        <span className="text-xs text-slate-500 font-bold">
          {row.sentAt ? new Date(row.sentAt).toLocaleString() : 'N/A'}
        </span>
      ),
      width: '180px'
    },
    {
      header: 'Status',
      cell: (row: Campaign) => (
        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md flex items-center gap-1 w-fit ${
          row.status === 'SENT' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' :
          row.status === 'SENDING' ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 animate-pulse' :
          'bg-rose-50 text-rose-700'
        }`}>
          {row.status === 'SENT' ? <CheckCircle size={10} /> : row.status === 'SENDING' ? <RefreshCw size={10} className="animate-spin" /> : <AlertCircle size={10} />}
          {row.status}
        </span>
      ),
      width: '120px'
    }
  ];

  return (
    <div className="space-y-8">
      <PageHeader 
        title="WhatsApp Campaigns & Marketing" 
        subtitle="Manage targeted customer outreach and birthday rewards"
        showBack
        backUrl="/customers"
        actions={
          <div className="flex gap-2">
            <Button
              onClick={handleTriggerBirthdayCampaigns}
              disabled={triggeringBirthday}
              className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs tracking-widest px-4 py-3 rounded-lg shadow-lg shadow-amber-200 dark:shadow-none"
            >
              {triggeringBirthday ? 'GREATING...' : '🎂 SEND BIRTHDAY GREETINGS'}
            </Button>
            <Button 
              onClick={() => setIsFormOpen(true)}
              className="bg-pos-primary hover:bg-red-700 text-white font-bold text-xs tracking-widest px-5 py-3 rounded-lg shadow-lg shadow-red-200"
            >
               LAUNCH NEW CAMPAIGN
            </Button>
          </div>
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
          className="px-4 py-2 bg-pos-primary text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-md"
        >
          Marketing Campaigns
        </Link>
        <Link
          href="/customers/coupons"
          className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 text-slate-500 hover:text-slate-800 dark:hover:text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all"
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
            <Megaphone size={20} />
          </div>
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Total Campaigns</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none">{campaigns.length} campaigns</p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-lg flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-600/10 flex items-center justify-center text-emerald-600 shrink-0">
            <Tag size={20} />
          </div>
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Attached Coupons</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none">{campaigns.filter(c => c.coupon).length} promo deals</p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-lg flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-violet-600/10 flex items-center justify-center text-violet-600 shrink-0">
            <MessageSquare size={20} />
          </div>
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Active Automated Workflows</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none">2 Active</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Side: Campaigns List Table */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-white/5 rounded-3xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-white/5">
              <div>
                <h3 className="text-xs font-black uppercase text-slate-800 dark:text-slate-100 tracking-wider">
                  Outbox & Campaign History
                </h3>
                <p className="text-[9px] text-slate-450 font-bold uppercase mt-0.5 tracking-tight">
                  Track previous outbound messages and coupon performance logs
                </p>
              </div>
            </div>

            <SearchToolbar 
              value={search}
              onChange={setSearch}
              placeholder="Search campaigns by name or type..."
            />

            <div className="mt-4">
              <DataTable 
                columns={columns} 
                data={filteredCampaigns} 
                loading={loading}
              />
            </div>
          </div>
        </div>

        {/* Right Side: Today's Birthday list widget */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-white/5 rounded-3xl p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-white/5">
              <div className="w-10 h-10 bg-amber-500/10 text-amber-500 rounded-xl flex items-center justify-center shrink-0 text-lg">
                🎂
              </div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-100">
                  Today's Birthdays
                </h3>
                <p className="text-[9px] text-slate-450 font-bold uppercase mt-0.5 tracking-tight">
                  Guests celebrating their birthday today
                </p>
              </div>
            </div>

            {todayBirthdays.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs italic font-medium">
                No guests celebrating birthdays today.
              </div>
            ) : (
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 no-scrollbar">
                {todayBirthdays.map((guest: any) => (
                  <div key={guest.id} className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-100 dark:border-white/5">
                    <div>
                      <p className="text-xs font-black uppercase text-slate-800 dark:text-slate-100">
                        {guest.firstName} {guest.lastName || ''}
                      </p>
                      <p className="text-[10px] font-bold text-slate-400 mt-0.5">
                        📞 {guest.mobile || 'No Phone'}
                      </p>
                    </div>
                    <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      guest.segment === 'VIP' ? 'bg-violet-600 text-white' : 'bg-slate-200 dark:bg-slate-850 text-slate-500'
                    }`}>
                      {guest.segment}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Campaign Composer Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title="Compose & Dispatch Campaign"
      >
        <form onSubmit={handleLaunchCampaign} className="space-y-4 p-4">
          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest ml-1">Campaign Name</label>
            <input
              type="text"
              placeholder="e.g., Weekend Special Discount Offer"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 dark:text-white border border-transparent dark:border-slate-600 rounded-xl text-sm font-semibold focus:outline-none focus:bg-white dark:focus:bg-slate-700 focus:border-pos-primary/20 transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest ml-1">Campaign Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 dark:text-white border border-transparent dark:border-slate-600 rounded-xl text-sm font-semibold focus:outline-none cursor-pointer"
              >
                <option value="PROMOTIONAL">Promotional</option>
                <option value="BIRTHDAY">Birthday Greeting</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest ml-1">Target Customer Segment</label>
              <select
                value={targetGroup}
                onChange={(e) => setTargetGroup(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 dark:text-white border border-transparent dark:border-slate-600 rounded-xl text-sm font-semibold focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Customers</option>
                <option value="VIP">VIP Segment Only</option>
                <option value="REGULAR">Regular Customers Only</option>
                <option value="INACTIVE">Inactive Customers Only</option>
                <option value="BIRTHDAY_TODAY">Today's Birthdays</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest ml-1">Message Text</label>
            <textarea
              placeholder="Hi {NAME}! Try our new Butter Chicken this weekend. Use code {COUPON} to get ₹150 off!"
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 dark:text-white border border-transparent dark:border-slate-600 rounded-xl text-sm font-semibold focus:outline-none focus:bg-white dark:focus:bg-slate-700 focus:border-pos-primary/20 transition-all resize-none"
            />
            <p className="text-[8px] text-slate-400 font-bold ml-1">Supported parameters: {`{NAME}`} for guest name, {`{COUPON}`} for their personalized coupon code.</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest ml-1">Attach Smart Coupon Template (Optional)</label>
            <select
              value={selectedCouponId}
              onChange={(e) => setSelectedCouponId(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 dark:text-white border border-transparent dark:border-slate-600 rounded-xl text-sm font-semibold focus:outline-none cursor-pointer"
            >
              <option value="">No coupon attached</option>
              {coupons.map(coupon => (
                <option key={coupon.id} value={coupon.id}>
                  {coupon.code} ({coupon.discountType === 'PERCENTAGE' ? `${coupon.discountValue}%` : `₹${coupon.discountValue}`} discount)
                </option>
              ))}
            </select>
            <p className="text-[8px] text-slate-400 font-bold ml-1">If attached, the system will auto-generate a personalized copy of this coupon for each guest and substitute the {`{COUPON}`} tag in message.</p>
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
              Dispatch Campaign
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
