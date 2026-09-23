'use client';

import React from 'react';
import Link from 'next/link';
import { 
  BookOpen, 
  Banknote, 
  BookMarked, 
  ChevronRight, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft,
  Calendar,
  TrendingDown,
  PlusCircle,
  Layers,
  Receipt,
  FileText
} from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';

export default function AccountsDashboard() {
  const cards = [
    {
      title: 'Expenses',
      description: 'View and track all hotel operational expenses & receipts.',
      href: '/hotel/expenses',
      icon: TrendingDown,
      iconColor: 'text-rose-500',
      bgColor: 'bg-rose-500/10',
      borderColor: 'border-rose-500/20',
      hoverBorder: 'hover:border-rose-500/50'
    },
    {
      title: 'New Expense',
      description: 'Record a new petty cash or vendor expense voucher.',
      href: '/hotel/expenses/new',
      icon: PlusCircle,
      iconColor: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20',
      hoverBorder: 'hover:border-emerald-500/50'
    },
    {
      title: 'Expense Categories',
      description: 'Manage accounting expense heads, budget tags & categories.',
      href: '/hotel/expenses/categories',
      icon: Layers,
      iconColor: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/20',
      hoverBorder: 'hover:border-amber-500/50'
    },
    {
      title: 'New Voucher',
      description: 'Create receipt, payment, contra or journal vouchers.',
      href: '/hotel/vouchers/new',
      icon: PlusCircle,
      iconColor: 'text-indigo-500',
      bgColor: 'bg-indigo-500/10',
      borderColor: 'border-indigo-500/20',
      hoverBorder: 'hover:border-indigo-500/50'
    },
    {
      title: 'Vouchers List',
      description: 'Complete journal voucher entries and transaction history.',
      href: '/hotel/vouchers',
      icon: FileText,
      iconColor: 'text-sky-500',
      bgColor: 'bg-sky-500/10',
      borderColor: 'border-sky-500/20',
      hoverBorder: 'hover:border-sky-500/50'
    },
    {
      title: 'Cash Book',
      description: 'Track all cash inflows and outflows with running balance.',
      href: '/hotel/accounts/cash-book',
      icon: Banknote,
      iconColor: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20',
      hoverBorder: 'hover:border-emerald-500/50'
    },
    {
      title: 'Day Book',
      description: 'Daily transaction summary, invoices & voucher register.',
      href: '/hotel/accounts/day-book',
      icon: BookOpen,
      iconColor: 'text-violet-500',
      bgColor: 'bg-violet-500/10',
      borderColor: 'border-violet-500/20',
      hoverBorder: 'hover:border-violet-500/50'
    },
    {
      title: 'Ledger',
      description: 'Account-wise general ledger statements & balance sheets.',
      href: '/hotel/accounts/ledger',
      icon: BookMarked,
      iconColor: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20',
      hoverBorder: 'hover:border-blue-500/50'
    },
    {
      title: 'Folios & Billing',
      description: 'Guest room folios, invoices, settlements and deposits.',
      href: '/hotel/billing',
      icon: Receipt,
      iconColor: 'text-teal-500',
      bgColor: 'bg-teal-500/10',
      borderColor: 'border-teal-500/20',
      hoverBorder: 'hover:border-teal-500/50'
    }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageHeader
        title="Accounting & Finance Hub"
        subtitle="Manage hotel expenses, journal vouchers, cash book, day book & general ledger"
        showBack
        backUrl="/hotel"
        actions={
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-900/80 rounded-2xl border border-slate-800 shadow-sm">
            <Calendar size={16} className="text-indigo-400" />
            <span className="text-xs font-bold text-slate-300">
              {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </div>
        }
      />

      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Current Liquidity', value: '₹0.00', icon: Wallet, change: 'Live', color: 'text-emerald-400' },
          { label: 'Today Receivables', value: '₹0.00', icon: ArrowUpRight, change: 'Hotel Folios', color: 'text-blue-400' },
          { label: 'Today Payables', value: '₹0.00', icon: ArrowDownLeft, change: 'Expenses', color: 'text-rose-400' }
        ].map((stat, i) => (
          <div key={i} className="bg-slate-900/60 backdrop-blur-md p-4 rounded-[1.5rem] border border-slate-800 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
             <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500/5 rounded-full -mr-8 -mt-8 transition-all group-hover:scale-150" />
             <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                   <div className="p-2 bg-slate-800 rounded-xl text-slate-400 group-hover:text-indigo-400 transition-colors">
                      <stat.icon size={18} />
                   </div>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full bg-slate-800 ${stat.color}`}>
                       {stat.change}
                    </span>
                 </div>
                 <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">{stat.label}</p>
                 <p className="text-xl font-black text-white mt-1">{stat.value}</p>
             </div>
          </div>
        ))}
      </div>

      {/* Main Navigation Grid - 9 Complete Expense & Accounting Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {cards.map((card, i) => (
          <Link key={i} href={card.href} className="group">
            <div className={`h-full p-6 rounded-3xl bg-slate-900/60 backdrop-blur-md border ${card.borderColor} ${card.hoverBorder} transition-all duration-300 shadow-xl hover:-translate-y-1.5 flex flex-col items-start gap-4 relative overflow-hidden`}>
              {/* Icon Section */}
              <div className={`p-3.5 ${card.bgColor} rounded-2xl transition-transform group-hover:scale-110 duration-300`}>
                <card.icon className={card.iconColor} size={22} />
              </div>

              {/* Text Section */}
              <div className="flex-1">
                <h3 className="text-base font-black text-white tracking-tight mb-1 group-hover:text-indigo-300 transition-colors">
                  {card.title}
                </h3>
                <p className="text-xs font-medium text-slate-400 leading-relaxed">
                  {card.description}
                </p>
              </div>

              {/* Footer Section */}
              <div className="flex items-center gap-2 text-indigo-400 font-bold text-[10px] tracking-widest uppercase group-hover:gap-3 transition-all">
                Open Module
                <ChevronRight size={14} />
              </div>

              {/* Decorative Background Element */}
              <div className="absolute bottom-0 right-0 p-4 opacity-5 translate-y-4 translate-x-4 pointer-events-none">
                <card.icon size={80} />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Bottom Information Card */}
      <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-[2rem] relative overflow-hidden group">
         <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex-1">
               <h2 className="text-base font-black text-white tracking-tight mb-1">Hotel Central Accounting & Finance</h2>
               <p className="text-slate-400 text-xs font-medium max-w-xl">
                  Centralized accounting for hotel room folios, property expenses, vouchers, cash/bank register and financial ledger balance sheets.
               </p>
            </div>
            <div className="flex items-center gap-4">
               <div className="text-center">
                  <p className="text-[10px] font-bold text-slate-500 tracking-widest uppercase mb-1">Status</p>
                  <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-bold uppercase tracking-widest">
                     Live & Synced
                  </span>
               </div>
               <div className="text-center">
                  <p className="text-[10px] font-bold text-slate-500 tracking-widest uppercase mb-1">Mode</p>
                  <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full text-[10px] font-bold uppercase tracking-widest">
                     Hotel PMS
                  </span>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
