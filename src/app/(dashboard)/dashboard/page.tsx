'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import AdminSetupWizard from '@/components/dashboard/AdminSetupWizard';
import { BarChart, ShoppingCart, Users, Building2, Store, ReceiptText, Layers, UtensilsCrossed, LayoutGrid, Tag, X, ArrowRightCircle, Plus } from 'lucide-react';

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
    <div className="space-y-6 lg:space-y-8 h-full pb-10 lg:pb-0">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <PageHeader
          title={`${session?.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Restaurants Admin'} Dashboard`}
          description={session?.role === 'SUPER_ADMIN'
            ? "Global oversight of all organizations."
            : "Manage your restaurant portfolio."}
        />
        <div className="flex items-center gap-3">
          {isAdmin && (
            <button
              onClick={() => setShowWizard(v => !v)}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 lg:py-2 rounded-xl text-[10px] lg:text-xs font-black uppercase tracking-widest border transition-all ${showWizard ? 'bg-pos-primary text-white border-pos-primary shadow-md' : 'bg-white dark:bg-slate-900 text-pos-primary dark:text-pos-primary border-pos-primary/30 dark:border-pos-primary/20 hover:border-pos-primary dark:hover:border-pos-primary/50'}`}
            >
              <Layers size={14} />
              {showWizard ? 'Hide Setup' : 'Setup'}
            </button>
          )}
          <span className="flex-1 md:flex-none text-center px-3 py-2.5 lg:py-1.5 bg-pos-primary/10 dark:bg-pos-primary/20 text-pos-primary dark:text-pos-primary rounded-xl text-[9px] lg:text-[10px] font-black uppercase tracking-widest border border-pos-primary/20 dark:border-pos-primary/30 shadow-sm truncate">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {statCards.map((stat, i) => (
              <Card key={i} className="hover:border-pos-primary/20 transition-shadow duration-200 group border-2 dark:border-slate-800 dark:bg-slate-900/40 p-4 lg:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[9px] lg:text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1">{stat.label}</p>
                    <p className="text-xl lg:text-2xl font-black text-gray-900 dark:text-white tracking-tight">{stat.value}</p>
                  </div>
                  <div className={`p-2.5 lg:p-3 rounded-xl bg-gray-50 dark:bg-slate-800 ${stat.color}`}>
                    <stat.icon size={20} className="lg:w-6 lg:h-6" />
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            <Card className="lg:col-span-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-2 dark:border-slate-800 p-5 lg:p-8 min-h-[350px] flex flex-col justify-between overflow-hidden relative shadow-xl transition-colors duration-500">
              <div className="absolute inset-0 bg-gradient-to-br from-pos-primary/5 to-slate-50/10 dark:from-pos-primary/10 dark:to-slate-950/10 -z-0 pointer-events-none" />
              <div className="relative z-10">
                <h3 className="text-xl lg:text-2xl font-black tracking-tight uppercase mb-2">Organization Pulse</h3>
                <p className="text-[10px] lg:text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-widest max-w-md">
                  Monitoring {stats?.totalBusinesses || 0} businesses in your portfolio.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 relative z-10 mt-6 lg:mt-8">
                <div className="space-y-1">
                  <p className="text-[9px] lg:text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Recent Activity</p>
                  <p className="text-lg lg:text-xl font-bold">Live Monitoring</p>
                </div>
                <div className="space-y-1 md:border-l border-slate-200 dark:border-slate-800 md:pl-6">
                  <p className="text-[9px] lg:text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Total Users</p>
                  <p className="text-lg lg:text-xl font-bold">{stats?.totalUsers || 0} Members</p>
                </div>
                <div className="space-y-1 md:border-l border-slate-200 dark:border-slate-800 md:pl-6">
                  <p className="text-[9px] lg:text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">System Health</p>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-lg lg:text-xl font-bold text-emerald-500 dark:text-emerald-400 uppercase tracking-tighter">Stable</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 lg:mt-8 pt-6 lg:pt-8 border-t border-slate-200 dark:border-slate-800/50 relative z-10">
                <p className="text-[9px] lg:text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4">Latest Portfolio Activity</p>
                <div className="space-y-3">
                  {stats?.recentOrders?.length > 0 ? stats.recentOrders.map((order: any) => (
                    <div key={order.id} className="flex items-center justify-between text-[11px] lg:text-xs py-2 border-b border-slate-100 dark:border-white/5 last:border-0">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <span className="font-bold text-slate-600 dark:text-slate-300 shrink-0">#{order.orderNo}</span>
                        <span className="text-[9px] lg:text-[10px] px-2 py-0.5 bg-slate-100 dark:bg-white/10 rounded uppercase font-bold text-slate-500 dark:text-slate-400 truncate">{order.property?.name}</span>
                      </div>
                      <span className="font-black text-emerald-600 dark:text-emerald-400 tracking-tighter ml-2">{formatCurrency(order.grandTotal)}</span>
                    </div>
                  )) : (
                    <p className="text-[10px] text-slate-600 dark:text-slate-400 font-bold italic uppercase">No recent activity found.</p>
                  )}
                </div>
              </div>
            </Card>

            <div className="space-y-6">
              <Card className="p-5 lg:p-6 border-2 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg">
                <h3 className="text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-[0.2em] mb-6 border-b border-gray-100 dark:border-slate-800 pb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
                  {isAdmin && <AddActionButton label="Setup Wizard" icon={<Layers size={14} />} onClick={() => setShowWizard(true)} />}
                  <AddActionButton label="Businesses" icon={<Building2 size={14} />} href="/manage-properties" />
                  <AddActionButton label="System Users" icon={<Users size={14} />} href="/manage-users" />
                  {hasFeature('REPORTS') && <AddActionButton label="Reports" icon={<BarChart size={14} />} href="/reports/sales-summary" />}
                  <AddActionButton label="Settings" icon={<Store size={14} />} href="/settings" />
                </div>
              </Card>
            </div>
          </div>

          {/* ── Property Performance Breakdown ── */}
          <div className="space-y-6 pt-4">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em]">Portfolio Breakdown</h3>
              <a href="/manage-properties" className="text-[9px] font-black text-pos-primary uppercase tracking-widest hover:underline">View All →</a>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
              {stats?.propertiesBreakdown?.map((prop: any) => (
                <Card key={prop.id} className="relative overflow-hidden group border-2 dark:border-slate-800 hover:border-pos-primary/40 transition-all duration-300 p-5">
                  <div className="flex justify-between items-start mb-4">
                    <div className="min-w-0">
                      <h4 className="font-black text-slate-900 dark:text-white text-sm uppercase tracking-tight group-hover:text-pos-primary transition-colors truncate">{prop.name}</h4>
                      <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-1 truncate">{prop.city || 'Global Outlet'}</p>
                    </div>
                    <div className="shrink-0 px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-[8px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                      {prop.type || 'RESTAURANT'}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-[8px] lg:text-[9px] font-black text-slate-400 uppercase tracking-widest">Revenue</p>
                      <p className="text-base lg:text-lg font-black text-emerald-600 dark:text-emerald-400 tracking-tighter">{formatCurrency(prop.totalSales)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[8px] lg:text-[9px] font-black text-slate-400 uppercase tracking-widest">Orders</p>
                      <p className="text-base lg:text-lg font-black text-slate-900 dark:text-white">{prop.orderCount}</p>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col">
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Outlets</span>
                        <span className="text-xs font-black text-slate-700 dark:text-slate-300">{prop.outletCount}</span>
                      </div>
                      <div className="w-[1px] h-6 bg-slate-100 dark:bg-slate-800" />
                      <div className="flex flex-col">
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Users</span>
                        <span className="text-xs font-black text-slate-700 dark:text-slate-300">{prop.userCount}</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => window.location.href = `/manage-properties`}
                      className="p-2 bg-pos-primary/10 text-pos-primary rounded-lg lg:opacity-0 lg:group-hover:opacity-100 transition-all transform translate-x-2 lg:group-hover:translate-x-0"
                    >
                      <ArrowRightCircle size={16} />
                    </button>
                  </div>
                </Card>
              ))}
              
              <button 
                onClick={() => window.location.href = '/manage-properties'}
                className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-6 lg:p-8 text-slate-300 hover:border-pos-primary hover:text-pos-primary hover:bg-pos-primary/5 transition-all group min-h-[160px]"
              >
                <div className="w-10 h-10 lg:w-12 lg:h-12 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Plus size={20} />
                </div>
                <span className="text-[9px] lg:text-[10px] font-black uppercase tracking-widest">Add New Branch</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* When wizard is open, show a compact quick-actions bar below */}
      {isAdmin && showWizard && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 lg:gap-3 mt-4">
          {hasFeature('POS') && <QuickLink label="Bills" icon={<ReceiptText size={14} />} href="/all-bills" />}
          <QuickLink label="Users" icon={<Users size={14} />} href="/manage-users" />
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
