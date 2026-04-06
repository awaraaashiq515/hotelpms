'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import AdminSetupWizard from '@/components/dashboard/AdminSetupWizard';
import { BarChart, ShoppingCart, Users, Building2, Store, ReceiptText, Layers, UtensilsCrossed, LayoutGrid, Tag, X } from 'lucide-react';

export default function DashboardPage() {
  const [session, setSession] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showWizard, setShowWizard] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [sessionRes, statsRes] = await Promise.all([
          fetch('/api/auth/session').then(res => res.json()),
          fetch('/api/admin/dashboard').then(res => res.json())
        ]);

        if (sessionRes.authenticated) {
          setSession(sessionRes.user);
          // Show wizard by default for ADMIN (not SUPER_ADMIN) if onboarding is not completed
          if (sessionRes.user?.role === 'RESTAURANTS_ADMIN' && !sessionRes.user?.onboardingCompleted) {
            setShowWizard(true);
          }
        }
        if (statsRes.success) setStats(statsRes.data);
      } catch (error) {
        console.error('Failed to fetch dashboard data', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const statCards = [
    { label: 'Total Sales', value: formatCurrency(stats?.totalSales || 0), icon: BarChart, color: 'text-emerald-600' },
    { label: 'Total Businesses', value: stats?.totalBusinesses?.toString() || '0', icon: Building2, color: 'text-pos-primary' },
    { label: 'Active Outlets', value: stats?.totalOutlets?.toString() || '0', icon: Store, color: 'text-pos-primary' },
    { label: 'System Users', value: stats?.totalUsers?.toString() || '0', icon: Users, color: 'text-pos-primary' },
  ];

  if (loading) {
    return (
      <div className="h-[80vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-pos-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-slate-500">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  const isAdmin = session?.role === 'RESTAURANTS_ADMIN';

  const hasFeature = (feature: string) => {
    if (session?.role === 'SUPER_ADMIN') return true;
    return session?.packageFeatures?.includes(feature);
  };

  return (
    <div className="space-y-8 h-full">
      <div className="flex justify-between items-end">
        <PageHeader
          title={`${session?.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Restaurants Admin'} Dashboard`}
          description={session?.role === 'SUPER_ADMIN'
            ? "Global oversight of all organizations and systems."
            : "Manage your restaurant setup and view performance."}
        />
        <div className="pb-1 hidden md:flex items-center gap-3">
          {isAdmin && (
            <button
              onClick={() => setShowWizard(v => !v)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border transition-all ${showWizard ? 'bg-pos-primary text-white border-pos-primary shadow-md' : 'bg-white dark:bg-slate-900 text-pos-primary dark:text-pos-primary border-pos-primary/30 dark:border-pos-primary/20 hover:border-pos-primary dark:hover:border-pos-primary/50'}`}
            >
              <Layers size={14} />
              {showWizard ? 'Hide Setup' : 'Restaurant Setup'}
            </button>
          )}
          <span className="px-3 py-1.5 bg-pos-primary/10 dark:bg-pos-primary/20 text-pos-primary dark:text-pos-primary rounded-xl text-[10px] font-black uppercase tracking-widest border border-pos-primary/20 dark:border-pos-primary/30 shadow-sm">
            {session?.organizationName || 'System Access'}
          </span>
        </div>
      </div>

      {/* ── Setup Wizard for Admin ── */}
      {isAdmin && showWizard && (
        <div className="relative">
          <AdminSetupWizard onDismiss={() => setShowWizard(false)} />
        </div>
      )}

      {/* ── Stats Row ── */}
      {!showWizard && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {statCards.map((stat, i) => (
              <Card key={i} className="hover:border-pos-primary/20 transition-shadow,transform duration-200 transform-gpu group border-2 dark:border-slate-800 dark:bg-slate-900/40">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1 transition-colors">{stat.label}</p>
                    <p className="text-2xl font-black text-gray-900 dark:text-white tracking-tight transition-colors">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-xl bg-gray-50 dark:bg-slate-800 transition-colors duration-200 ${stat.color}`}>
                    <stat.icon size={24} />
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-2 dark:border-slate-800 p-8 min-h-[350px] flex flex-col justify-between overflow-hidden relative shadow-2xl transition-colors duration-500">
              <div className="absolute inset-0 bg-gradient-to-br from-pos-primary/10 to-slate-50/20 dark:from-pos-primary/20 dark:to-slate-950/20 -z-0 pointer-events-none" />
              <div className="relative z-10">
                <h3 className="text-2xl font-black tracking-tight uppercase mb-2">Organization Pulse</h3>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-widest max-w-md">
                  Real-time monitoring across all {stats?.totalBusinesses || 0} businesses in your portfolio.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10 mt-8">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Recent Activity</p>
                  <p className="text-xl font-bold">Live Monitoring</p>
                </div>
                <div className="space-y-1 border-l border-slate-200 dark:border-slate-800 pl-6">
                  <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Total Users</p>
                  <p className="text-xl font-bold">{stats?.totalUsers || 0} Team Members</p>
                </div>
                <div className="space-y-1 border-l border-slate-200 dark:border-slate-800 pl-6">
                  <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">System Health</p>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-xl font-bold text-emerald-400 uppercase tracking-tighter">Stable</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-800/50 relative z-10">
                <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4">Latest Orders (Across Portfolio)</p>
                <div className="space-y-3">
                  {stats?.recentOrders?.length > 0 ? stats.recentOrders.map((order: any) => (
                    <div key={order.id} className="flex items-center justify-between text-xs py-1 border-b border-slate-100 dark:border-white/5 last:border-0 pb-2">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-slate-600 dark:text-slate-300">#{order.orderNo}</span>
                        <span className="text-[10px] px-2 py-0.5 bg-slate-100 dark:bg-white/10 rounded uppercase font-bold text-slate-500 dark:text-slate-400">{order.property?.name}</span>
                      </div>
                      <span className="font-black text-emerald-600 dark:text-emerald-400 tracking-tighter">{formatCurrency(order.grandTotal)}</span>
                    </div>
                  )) : (
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-bold italic uppercase">No recent activity found.</p>
                  )}
                </div>
              </div>

              <div className="absolute -right-20 -top-20 w-64 h-64 bg-pos-primary/10 rounded-full blur-3xl invisible md:visible"></div>
              <div className="absolute right-1/4 bottom-0 w-32 h-32 bg-pos-primary/10 rounded-full blur-3xl invisible md:visible"></div>
            </Card>

            <div className="space-y-6">
              <Card className="p-6 border-2 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl transition-colors duration-300">
                <h3 className="text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-[0.2em] mb-8 border-b border-gray-100 dark:border-slate-800 pb-4 transition-colors">Quick Admin Actions</h3>
                <div className="space-y-4">
                  {isAdmin && <AddActionButton label="Restaurant Setup" icon={<Layers size={16} />} onClick={() => setShowWizard(true)} />}
                  {hasFeature('POS') && <AddActionButton label="View All Bills" icon={<ReceiptText size={16} />} href="/all-bills" />}
                  <AddActionButton label="Add New Business" icon={<Building2 size={16} />} href="/manage-properties" />
                  <AddActionButton label="Create System User" icon={<Users size={16} />} href="/manage-users" />
                  {hasFeature('REPORTS') && <AddActionButton label="Global Reports" icon={<BarChart size={16} />} href="/reports/sales-summary" />}
                  <AddActionButton label="Organization Settings" icon={<Store size={16} />} href="/settings" />
                </div>
              </Card>
            </div>
          </div>
        </>
      )}

      {/* When wizard is open, show a compact quick-actions bar below */}
      {isAdmin && showWizard && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
          {hasFeature('POS') && <QuickLink label="All Bills" icon={<ReceiptText size={14} />} href="/all-bills" />}
          <QuickLink label="Manage Users" icon={<Users size={14} />} href="/manage-users" />
          {hasFeature('REPORTS') && <QuickLink label="Reports" icon={<BarChart size={14} />} href="/reports/sales-summary" />}
          <QuickLink label="Settings" icon={<Store size={14} />} href="/settings" />
        </div>
      )}
    </div>
  );
}

const AddActionButton = ({ label, icon, href, onClick }: { label: string; icon: React.ReactNode; href?: string; onClick?: () => void }) => (
  <button
    onClick={onClick || (() => href && (window.location.href = href))}
    className="w-full p-4 bg-slate-50 dark:bg-slate-800/50 hover:bg-pos-primary hover:text-white transform-gpu transition-colors duration-200 rounded-xl font-bold text-[11px] uppercase tracking-widest text-gray-600 dark:text-slate-300 flex items-center justify-between group border border-slate-100 dark:border-slate-700 hover:border-pos-primary/20"
  >
    {label}
    <span className="opacity-40 group-hover:opacity-100 transition-opacity">{icon}</span>
  </button>
);

const QuickLink = ({ label, icon, href }: { label: string; icon: React.ReactNode; href: string }) => (
  <a
    href={href}
    className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl text-xs font-bold text-gray-600 dark:text-slate-400 hover:border-pos-primary/40 dark:hover:border-pos-primary/30 hover:text-pos-primary dark:hover:text-pos-primary hover:bg-pos-primary/5 dark:hover:bg-slate-800 transition-all shadow-sm"
  >
    {icon} {label}
  </a>
);
