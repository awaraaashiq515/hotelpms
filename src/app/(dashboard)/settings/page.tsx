'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Printer, ShieldCheck, Globe, Wine, QrCode } from 'lucide-react';

// --- Extracted Components ---
import { BusinessProfileForm } from '@/components/settings/BusinessProfileForm';
import { AiConfigForm } from '@/components/settings/AiConfigForm';
import { PosSecurityForm } from '@/components/settings/PosSecurityForm';
import { TabletSetupCard } from '@/components/settings/TabletSetupCard';
import { WebsiteBrandingForm } from '@/components/settings/WebsiteBrandingForm';
import { BarPosSettingsForm } from '@/components/settings/BarPosSettingsForm';
import { UpiPaymentForm } from '@/components/settings/UpiPaymentForm';
import { TwoFactorSection } from '@/components/settings/TwoFactorSection';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'payments' | 'bar' | 'branding' | 'admin' | 'website' | 'printers'>('profile');
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    fetch('/api/auth/session')
      .then(res => res.json())
      .then(data => {
        if (data.authenticated) {
          setSession(data.user);
        }
      })
      .catch(err => console.error('Failed to fetch session', err));
  }, []);

  const tabs = [
    { id: 'profile', label: 'Business Profile', icon: ShieldCheck, color: 'text-pos-primary', bg: 'bg-pos-primary/10' },
    { id: 'printers', label: 'Printers', icon: Printer, color: 'text-blue-600', bg: 'bg-blue-50' },
    { id: 'payments', label: '💳 UPI Payments', icon: QrCode, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { id: 'bar', label: '🍺 Bar POS', icon: Wine, color: 'text-amber-600', bg: 'bg-amber-50' },
    { id: 'admin', label: 'Admin', icon: ShieldCheck, color: 'text-slate-900', bg: 'bg-slate-100' },
    ...(session?.role === 'SUPER_ADMIN' ? [{ id: 'website', label: 'Website (OrderMint)', icon: Globe, color: 'text-pos-primary', bg: 'bg-pos-primary/10' }] : []),
  ];

  const isSuperAdmin = session?.role === 'SUPER_ADMIN';

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <PageHeader
        title="Settings"
        description="Configure your restaurant profile, logo, and system parameters."
        showBack
        backUrl="/operations"
      />

      {/* Modern Tab Navigation - Scrollable on Mobile */}
      <div className="overflow-x-auto no-scrollbar pb-2 lg:pb-0">
        <div className="flex items-center gap-2 lg:gap-3 bg-gray-100/50 dark:bg-slate-800/50 p-1 lg:p-1.5 rounded-2xl lg:rounded-[2rem] w-max border border-gray-200/50 dark:border-slate-700/50 backdrop-blur-sm">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`
                  flex items-center gap-2 lg:gap-3 px-4 lg:px-6 py-2.5 lg:py-3.5 rounded-xl lg:rounded-[1.5rem] text-[9px] lg:text-[10px] font-black uppercase tracking-[0.15em] transition-all duration-300 whitespace-nowrap
                  ${isActive
                    ? `${tab.bg} ${tab.color} shadow-lg shadow-white/50 ring-1 ring-white/10`
                    : 'text-gray-400 hover:text-gray-600 hover:bg-white/50'
                  }
                `}
              >
                <Icon size={14} className={isActive ? 'animate-pulse' : ''} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="w-full pb-20">
        {activeTab === 'profile' && (
          <div className="animate-in slide-in-from-bottom-4 duration-500 max-w-4xl">
            <BusinessProfileForm />
          </div>
        )}

        {activeTab === 'printers' && (
          <div className="animate-in slide-in-from-bottom-4 duration-500 max-w-4xl">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-gray-100 dark:border-slate-800 shadow-sm">
                <h3 className="text-xl font-bold mb-4">Printer Management</h3>
                <p className="text-gray-500 mb-6">Manage your thermal printers for billing and kitchen orders. Configure IP addresses, paper sizes, and roles.</p>
                <Button variant="primary" onClick={() => window.location.href = '/settings/printers'}>
                    Go to Printer Settings
                </Button>
            </div>
          </div>
        )}

        {activeTab === 'payments' && (
          <div className="animate-in slide-in-from-bottom-4 duration-500">
            <UpiPaymentForm />
          </div>
        )}

        {activeTab === 'bar' && (
          <div className="animate-in slide-in-from-bottom-4 duration-500 max-w-2xl">
            <BarPosSettingsForm />
          </div>
        )}

        {activeTab === 'admin' && (
          <div className="flex flex-col gap-8 items-stretch animate-in slide-in-from-bottom-4 duration-500 w-full max-w-6xl">
            {isSuperAdmin && (
              <div className="max-w-4xl">
                <AiConfigForm />
              </div>
            )}
            <PosSecurityForm />
            <div className="max-w-4xl">
              <TabletSetupCard />
            </div>
            {/* ── 2FA Section ── */}
            <div className="max-w-4xl">
              <TwoFactorSection />
            </div>
          </div>
        )}

        {activeTab === 'website' && isSuperAdmin && (
          <div className="animate-in slide-in-from-bottom-4 duration-500 max-w-4xl">
            <WebsiteBrandingForm />
          </div>
        )}
      </div>
    </div>
  );
}
