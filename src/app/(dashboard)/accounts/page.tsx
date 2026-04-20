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
  Calendar
} from 'lucide-react';

export default function AccountsDashboard() {
  const cards = [
    {
      title: 'Day Book',
      description: 'Daily transaction summary and voucher register.',
      href: '/accounts/day-book',
      icon: BookOpen,
      iconColor: 'text-violet-500',
      bgColor: 'bg-violet-50',
      borderColor: 'border-violet-100',
      hoverBorder: 'hover:border-violet-300'
    },
    {
      title: 'Cash Book',
      description: 'Track all cash receipts and payments with running balance.',
      href: '/accounts/cash-book',
      icon: Banknote,
      iconColor: 'text-emerald-500',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-100',
      hoverBorder: 'hover:border-emerald-300'
    },
    {
      title: 'Ledger',
      description: 'Account-wise transaction history and balance statements.',
      href: '/accounts/ledger',
      icon: BookMarked,
      iconColor: 'text-blue-500',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-100',
      hoverBorder: 'hover:border-blue-300'
    }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Accounting Hub</h1>
          <p className="text-xs font-bold text-slate-400 tracking-widest mt-0.5">Financial reporting and management</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
          <Calendar size={16} className="text-pos-primary" />
          <span className="text-sm font-bold text-slate-600 dark:text-slate-300">
            {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
        </div>
      </div>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Current Liquidity', value: '₹0.00', icon: Wallet, change: '+5.2%', color: 'text-emerald-600' },
          { label: 'Today Receivables', value: '₹0.00', icon: ArrowUpRight, change: '0.0%', color: 'text-blue-600' },
          { label: 'Today Payables', value: '₹0.00', icon: ArrowDownLeft, change: '0.0%', color: 'text-rose-600' }
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
             <div className="absolute top-0 right-0 w-24 h-24 bg-pos-primary/5 rounded-full -mr-12 -mt-12 transition-all group-hover:scale-150" />
             <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                   <div className="p-3 bg-slate-50 dark:bg-slate-700 rounded-2xl text-slate-400 group-hover:text-pos-primary transition-colors">
                      <stat.icon size={20} />
                   </div>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full bg-slate-50 dark:bg-slate-700 ${stat.color}`}>
                       {stat.change}
                    </span>
                 </div>
                 <p className="text-xs font-bold text-slate-400 tracking-widest">{stat.label}</p>
                 <p className="text-lg font-bold text-slate-900 dark:text-white mt-1">{stat.value}</p>
             </div>
          </div>
        ))}
      </div>

      {/* Main Navigation Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((card, i) => (
          <Link key={i} href={card.href} className="group">
            <div className={`h-full p-8 rounded-[2.5rem] bg-white dark:bg-slate-800 border-2 ${card.borderColor} ${card.hoverBorder} transition-all duration-300 shadow-xl shadow-slate-200/50 dark:shadow-none hover:-translate-y-2 flex flex-col items-start gap-6 relative overflow-hidden`}>
              {/* Icon Section */}
              <div className={`p-5 ${card.bgColor} dark:bg-slate-700 rounded-[1.5rem] shadow-inner transition-transform group-hover:scale-110 duration-500`}>
                <card.icon className={card.iconColor} size={32} />
              </div>

              {/* Text Section */}
              <div className="flex-1">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight mb-1.5">
                  {card.title}
                </h3>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
                  {card.description}
                </p>
              </div>

              {/* Footer Section */}
              <div className="flex items-center gap-2 text-pos-primary font-bold text-xs tracking-widest group-hover:gap-4 transition-all">
                Access Module
                <ChevronRight size={18} />
              </div>

              {/* Decorative Background Element */}
              <div className="absolute bottom-0 right-0 p-4 opacity-5 translate-y-4 translate-x-4">
                <card.icon size={120} />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Bottom Information Card */}
      <div className="bg-slate-900 dark:bg-violet-950 p-10 rounded-[3rem] relative overflow-hidden group">
         <div className="absolute inset-0 bg-pos-primary/10 animate-pulse" />
         <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex-1">
               <h2 className="text-xl font-bold text-white tracking-tight mb-2">Professional Restaurant Accounting</h2>
               <p className="text-slate-400 text-sm font-medium max-w-xl">
                  Automated voucher posting from POS orders, expense tracking, and real-time ledger management.
               </p>
            </div>
            <div className="flex items-center gap-6">
               <div className="text-center">
                  <p className="text-[10px] font-bold text-slate-500 tracking-widest mb-1">Status</p>
                  <span className="px-4 py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-bold uppercase tracking-widest">
                     Live & Synced
                  </span>
               </div>
               <div className="text-center">
                  <p className="text-[10px] font-bold text-slate-500 tracking-widest mb-1">Reports</p>
                  <span className="px-4 py-2 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-[10px] font-bold uppercase tracking-widest">
                     Automated
                  </span>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
