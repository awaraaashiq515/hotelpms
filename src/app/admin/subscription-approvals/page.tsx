'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  CheckCircle2,
  XCircle,
  Search,
  Calendar,
  CreditCard,
  Building2,
  Sparkles,
  AlertCircle,
  ShieldCheck,
  Zap,
  Filter,
  DollarSign,
  UserCheck,
  SearchCheck,
  Eye,
} from 'lucide-react';

type Organization = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  subscriptionStatus: string;
  paymentReference: string | null;
  paymentAmount: number | null;
  paymentDate: string | null;
  pendingPackageId: string | null;
  packageId: string | null;
  packageEndDate: string | null;
};

type Pkg = {
  id: string;
  name: string;
  priceINR: number;
  priceUSD: number;
  color: string | null;
};

export default function SubscriptionApprovalsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [packages, setPackages] = useState<Pkg[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'ACTIVE' | 'TRIAL'>('PENDING');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch packages
      const pkgsRes = await fetch('/api/admin/packages').then((r) => r.json());
      if (pkgsRes.success) {
        setPackages(pkgsRes.data);
      }

      // Fetch organizations
      const orgsRes = await fetch('/api/super-admin/organizations').then((r) => r.json());
      if (orgsRes.success) {
        setOrganizations(orgsRes.data);
      } else {
        showToast(orgsRes.error || 'Failed to fetch organizations', 'error');
      }
    } catch (err) {
      showToast('An unexpected error occurred while loading data.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleApproveSubscription = async (orgId: string, action: 'APPROVE' | 'REJECT') => {
    try {
      setProcessingId(orgId);
      const res = await fetch('/api/super-admin/approve-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId: orgId, action }),
      }).then((r) => r.json());

      if (res.success) {
        showToast(
          action === 'APPROVE'
            ? 'Subscription approved and activated successfully!'
            : 'Subscription payment reference rejected successfully.'
        );
        fetchData();
      } else {
        showToast(res.error || 'Failed to process subscription', 'error');
      }
    } catch (err) {
      showToast('An error occurred during submission', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  // Filter organizations
  const filteredOrgs = organizations.filter((org) => {
    // Search match
    const matchesSearch =
      org.name.toLowerCase().includes(search.toLowerCase()) ||
      (org.email && org.email.toLowerCase().includes(search.toLowerCase())) ||
      (org.paymentReference && org.paymentReference.toLowerCase().includes(search.toLowerCase())) ||
      org.id.toLowerCase().includes(search.toLowerCase());

    // Status filter match
    if (statusFilter === 'PENDING') {
      return matchesSearch && org.subscriptionStatus === 'PENDING_APPROVAL';
    }
    if (statusFilter === 'ACTIVE') {
      return matchesSearch && org.subscriptionStatus === 'ACTIVE';
    }
    if (statusFilter === 'TRIAL') {
      return matchesSearch && org.subscriptionStatus === 'TRIAL';
    }
    return matchesSearch;
  });

  const pendingCount = organizations.filter((o) => o.subscriptionStatus === 'PENDING_APPROVAL').length;
  const activeCount = organizations.filter((o) => o.subscriptionStatus === 'ACTIVE').length;
  const trialCount = organizations.filter((o) => o.subscriptionStatus === 'TRIAL').length;

  return (
    <div className="relative min-h-screen space-y-8" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Background glow effects */}
      <div className="absolute top-[-5%] left-[-5%] w-[35%] h-[35%] bg-indigo-500/10 rounded-full blur-[90px] -z-10 pointer-events-none" />
      <div className="absolute bottom-[-5%] right-[-5%] w-[35%] h-[35%] bg-rose-500/5 rounded-full blur-[90px] -z-10 pointer-events-none" />

      {/* Toast Alert */}
      {toast && (
        <div className={`fixed top-6 right-6 z-[100] flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl text-sm font-bold animate-slide-in-right ${
          toast.type === 'success' ? 'bg-emerald-600 text-white shadow-emerald-600/20' : 'bg-rose-600 text-white shadow-rose-600/20'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
          {toast.msg}
        </div>
      )}

      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-1.5 w-6 bg-indigo-600 rounded-full" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400">
              Subscription Management
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Subscription Approvals
            {pendingCount > 0 && (
              <span className="ml-3 text-xs font-black bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-3 py-1.5 rounded-full tracking-widest border border-indigo-500/25 animate-pulse">
                {pendingCount} Pending Payment Verification
              </span>
            )}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-2 max-w-xl">
            Review incoming signup subscription payments, verify bank or UPI reference numbers, and unlock live POS systems in a single click.
          </p>
        </div>
      </div>

      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[
          { label: 'Awaiting Verification', count: pendingCount, icon: ClockIcon, color: 'from-amber-500 to-orange-600', shadow: 'shadow-amber-500/10' },
          { label: 'Active Subscriptions', count: activeCount, icon: Sparkles, color: 'from-emerald-500 to-teal-600', shadow: 'shadow-emerald-500/10' },
          { label: 'Free Trial Accounts', count: trialCount, icon: Building2, color: 'from-indigo-500 to-blue-600', shadow: 'shadow-indigo-500/10' }
        ].map((stat, i) => (
          <div key={i} className={`p-6 rounded-[28px] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-5 ${stat.shadow}`}>
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center shrink-0 shadow-md`}>
              <stat.icon size={20} className="text-white" />
            </div>
            <div>
              <p className="text-3xl font-black text-slate-900 dark:text-white tabular-nums">{stat.count}</p>
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[36px] shadow-sm overflow-hidden">
        
        {/* Controls Bar */}
        <div className="p-6 md:p-8 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          
          {/* Tab Selector */}
          <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl w-full md:w-auto">
            {[
              { id: 'PENDING', label: 'Pending Payment Review', count: pendingCount },
              { id: 'ACTIVE', label: 'Active Subscribed', count: activeCount },
              { id: 'TRIAL', label: 'Trial Mode', count: trialCount },
              { id: 'ALL', label: 'All Businesses', count: organizations.length }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id as any)}
                className={`flex-1 md:flex-initial py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  statusFilter === tab.id
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                {tab.label}
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${statusFilter === tab.id ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'}`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
              <Search size={16} />
            </span>
            <input
              type="text"
              placeholder="Search business name, ref ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-indigo-600 rounded-2xl text-sm font-semibold text-slate-800 dark:text-white outline-none transition-all"
            />
          </div>

        </div>

        {/* Data Grid / Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-20 text-center flex flex-col justify-center items-center gap-4">
              <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-slate-500 dark:text-slate-400 text-sm font-semibold">Loading data...</span>
            </div>
          ) : filteredOrgs.length === 0 ? (
            <div className="py-20 text-center space-y-4">
              <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800/40 rounded-full flex items-center justify-center mx-auto text-slate-400">
                <SearchCheck size={32} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">No Organizations Found</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto font-medium">
                We couldn't find any organizations matching the status filter "{statusFilter}" and search query "{search}".
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest bg-slate-50/50 dark:bg-slate-900/30">
                  <th className="px-8 py-5">Business Name & details</th>
                  <th className="px-8 py-5">Requested package</th>
                  <th className="px-8 py-5">Reference details</th>
                  <th className="px-8 py-5">Amount paid</th>
                  <th className="px-8 py-5">Date of transfer</th>
                  <th className="px-8 py-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300">
                {filteredOrgs.map((org) => {
                  const matchedPkg = packages.find((p) => p.id === (org.pendingPackageId || org.packageId));
                  const selectedPkgName = matchedPkg?.name || 'Premium Plan';
                  const isINR = (matchedPkg?.priceINR ?? 0) > 0;
                  
                  const displayAmount = org.paymentAmount
                    ? (isINR ? `₹${org.paymentAmount}` : `$${org.paymentAmount}`)
                    : '---';

                  const dateStr = org.paymentDate
                    ? new Date(org.paymentDate).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : '---';

                  const statusBadges: Record<string, React.ReactNode> = {
                    PENDING_APPROVAL: (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/50">
                        Pending Review
                      </span>
                    ),
                    PENDING_PAYMENT: (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-rose-50 dark:bg-rose-950/30 text-rose-500 dark:text-rose-450 border border-rose-100 dark:border-rose-900/50">
                        Awaiting Payment
                      </span>
                    ),
                    ACTIVE: (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-450 border border-emerald-100 dark:border-emerald-900/50">
                        Active Subscribed
                      </span>
                    ),
                    TRIAL: (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50">
                        Trial Mode
                      </span>
                    ),
                  };

                  return (
                    <tr key={org.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition-colors">
                      <td className="px-8 py-5">
                        <div className="space-y-1">
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-sm text-slate-900 dark:text-white uppercase tracking-tight block">
                              {org.name}
                            </span>
                            {statusBadges[org.subscriptionStatus] || (
                              <span className="text-[9px] uppercase font-black px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                                {org.subscriptionStatus}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-col gap-0.5 text-[10px] text-slate-400 dark:text-slate-500">
                            <span>ID: {org.id}</span>
                            {org.email && <span>Email: {org.email}</span>}
                            {org.phone && <span>Phone: {org.phone}</span>}
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span 
                          className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border"
                          style={{
                            backgroundColor: `${matchedPkg?.color || '#6366f1'}15`,
                            borderColor: `${matchedPkg?.color || '#6366f1'}35`,
                            color: matchedPkg?.color || '#6366f1',
                          }}
                        >
                          {selectedPkgName}
                        </span>
                      </td>
                      <td className="px-8 py-5">
                        {org.paymentReference ? (
                          <span className="font-mono font-bold tracking-tight text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-3 py-1.5 rounded-xl border border-indigo-100 dark:border-indigo-900/50">
                            {org.paymentReference}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-bold">---</span>
                        )}
                      </td>
                      <td className="px-8 py-5 font-bold text-slate-900 dark:text-white text-sm">
                        {displayAmount}
                      </td>
                      <td className="px-8 py-5 text-slate-450 dark:text-slate-500 text-[11px]">
                        {dateStr}
                      </td>
                      <td className="px-8 py-5 text-right">
                        {org.subscriptionStatus === 'PENDING_APPROVAL' ? (
                          <div className="flex items-center justify-end gap-2.5">
                            <button
                              type="button"
                              disabled={processingId === org.id}
                              onClick={() => handleApproveSubscription(org.id, 'APPROVE')}
                              className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/10 hover:shadow-emerald-600/25 transition-all flex items-center gap-1.5 disabled:opacity-50"
                            >
                              {processingId === org.id ? (
                                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              ) : (
                                <CheckCircle2 size={12} />
                              )}
                              Approve
                            </button>
                            <button
                              type="button"
                              disabled={processingId === org.id}
                              onClick={() => handleApproveSubscription(org.id, 'REJECT')}
                              className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/10 hover:shadow-rose-600/25 transition-all flex items-center gap-1.5 disabled:opacity-50"
                            >
                              {processingId === org.id ? (
                                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              ) : (
                                <XCircle size={12} />
                              )}
                              Reject
                            </button>
                          </div>
                        ) : org.subscriptionStatus === 'ACTIVE' && org.packageEndDate ? (
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-end gap-1.5">
                            <ShieldCheck size={14} className="text-emerald-500" />
                            Expires: {new Date(org.packageEndDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-widest">
                            No Actions Required
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

      </div>

    </div>
  );
}

// Simple clock icon replacement since lucide doesn't always bundle Clock correctly in some frameworks
function ClockIcon(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={props.size || 24}
      height={props.size || 24}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={props.className}
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
