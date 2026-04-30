'use client';

import React from 'react';
import Link from 'next/link';
import { 
  BarChart3, 
  Package, 
  ShieldCheck, 
  Building2, 
  Users2, 
  CreditCard,
  ChevronRight,
  BookOpen,
  Wallet,
  FileText
} from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';

export default function ReportsHub() {
  const sections = [
    {
      title: 'Operational Insights',
      reports: [
        { 
          name: 'Sales Intelligence', 
          icon: <BarChart3 className="text-blue-500" />, 
          desc: 'Comprehensive revenue analytics and product performance tracking.', 
          href: '/reports/sales' 
        },
        { 
          name: 'Inventory Status', 
          icon: <Package className="text-orange-500" />, 
          desc: 'Real-time stock levels and low stock alerts.', 
          href: '/reports/inventory' 
        },
        { 
          name: 'Settlement Report', 
          icon: <CreditCard className="text-purple-500" />, 
          desc: 'Breakdown of payments (Cash, Card, UPI).', 
          href: '/reports/settlements' 
        },
      ]
    },
    {
      title: 'Financial Statements',
      reports: [
        { 
          name: 'Day Book', 
          icon: <BookOpen className="text-emerald-500" />, 
          desc: 'Daily transaction register and vouchers.', 
          href: '/accounts/day-book' 
        },
        { 
          name: 'Cash Book', 
          icon: <Wallet className="text-green-500" />, 
          desc: 'Cash receipts, payments, and balance.', 
          href: '/accounts/cash-book' 
        },
        { 
          name: 'GST / Tax Report', 
          icon: <Building2 className="text-cyan-500" />, 
          desc: 'Tax computations and filing reports.', 
          href: '/reports/tax' 
        },
      ]
    },
    {
      title: 'Audits & History',
      reports: [
        { 
          name: 'Audit Log', 
          icon: <ShieldCheck className="text-rose-500" />, 
          desc: 'Track system activity and user changes.', 
          href: '/reports/audit' 
        },
        { 
          name: 'Guest History', 
          icon: <Users2 className="text-indigo-500" />, 
          desc: 'Customer visiting patterns and spending.', 
          href: '/reports/guests' 
        },
        { 
          name: 'Ledger Statement', 
          icon: <FileText className="text-gray-500" />, 
          desc: 'Detailed account-wise ledger books.', 
          href: '/accounts/ledger' 
        },
      ]
    }
  ];

  return (
    <div className="space-y-10 pb-10">
      <PageHeader
        title="Reports & Intelligence"
        subtitle="Real-time business performance analytics"
        showBack
        backUrl="/operations"
      />

      {/* Report Sections */}
      {sections.map((section, idx) => (
        <div key={idx} className="space-y-6">
          <div className="flex items-center gap-4 px-2">
            <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.3em]">{section.title}</h2>
            <div className="h-px bg-slate-100 dark:bg-slate-800 flex-1" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {section.reports.map((report) => (
              <Link key={report.name} href={report.href}>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-700 hover:border-pos-primary/30 dark:hover:border-pos-primary/50 shadow-sm hover:shadow-xl hover:shadow-pos-primary/5 transition-all duration-300 group relative overflow-hidden h-full flex flex-col">
                  {/* Decorative faint icon in background */}
                  <div className="absolute top-2 right-2 opacity-5 scale-150 rotate-12 transition-transform group-hover:scale-[2] duration-500">
                    {report.icon}
                  </div>

                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-700 flex items-center justify-center text-xl group-hover:bg-pos-primary group-hover:text-white transition-all shadow-inner">
                      {report.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-black text-slate-900 dark:text-white uppercase text-xs tracking-wider mb-1 pt-1.5 group-hover:text-pos-primary transition-colors">
                        {report.name}
                      </h3>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest leading-relaxed">
                        Module Ready
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium mb-6">
                    {report.desc}
                  </p>

                  <div className="mt-auto flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-pos-primary opacity-0 group-hover:opacity-100 transition-opacity">
                    View Data
                    <ChevronRight size={14} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ))}

      {/* Tip Card */}
      <div className="bg-slate-900 p-8 rounded-[2rem] text-white flex flex-col md:flex-row items-center gap-8 border border-white/10 shadow-2xl">
         <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
            <ShieldCheck size={32} className="text-emerald-400" />
         </div>
         <div>
            <h4 className="text-lg font-black tracking-tight mb-1">Automated Statutory Sync</h4>
            <p className="text-slate-400 text-xs font-medium max-w-xl">
               All reports are real-time and synced with your POS transactions. Use the export button within specific reports to download Excel or PDF versions for your CA.
            </p>
         </div>
      </div>
    </div>
  );
}
