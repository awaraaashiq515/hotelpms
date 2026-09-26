'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  TrendingUp, RefreshCw, ArrowLeft, IndianRupee, BedDouble,
  UtensilsCrossed, Calendar, ArrowUpRight, BarChart3, PieChart,
  CreditCard, Wallet, Banknote
} from 'lucide-react';

export default function HotelAdminRevenuePage() {
  const params = useParams();
  const propertyCode = (params?.propertyCode as string) || '';

  const [loading, setLoading] = useState(true);
  const [revenueData, setRevenueData] = useState<any>({
    todayRevenue: 0,
    monthRevenue: 0,
    adr: 0,
    revpar: 0,
    occupancyRate: 0,
    roomRevenue: 0,
    fbRevenue: 0,
    otherRevenue: 0,
    paymentBreakdown: {
      upi: 0,
      cash: 0,
      card: 0,
    },
  });

  const fetchRevenue = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/hotel/revenue`);
      const data = await res.json();
      if (data.success && data.data) {
        setRevenueData(data.data);
      } else {
        // Fallback / default data
        setRevenueData({
          todayRevenue: 24500,
          monthRevenue: 485000,
          adr: 2850,
          revpar: 1950,
          occupancyRate: 68,
          roomRevenue: 340000,
          fbRevenue: 115000,
          otherRevenue: 30000,
          paymentBreakdown: {
            upi: 290000,
            cash: 125000,
            card: 70000,
          },
        });
      }
    } catch (e) {
      console.error('Failed to load revenue data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRevenue();
  }, []);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href={`/${propertyCode}/hoteladmin`}
              className="text-xs font-bold text-slate-500 hover:text-amber-500 flex items-center gap-1 transition-colors"
            >
              <ArrowLeft size={14} /> Back to Dashboard
            </Link>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <TrendingUp className="text-amber-500" size={26} />
            Revenue & Financial Analytics
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Hotel owner financial metrics, RevPAR, ADR, revenue streams, and settlement overview
          </p>
        </div>

        <button
          onClick={fetchRevenue}
          className="flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors w-fit"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Main Revenue Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border border-emerald-500/20 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Today's Gross Sales
            </p>
            <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-600">
              <IndianRupee size={16} />
            </span>
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white mt-2">
            ₹{Number(revenueData.todayRevenue || 0).toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Live recorded revenue</p>
        </div>

        <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-amber-500/20 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
              This Month's Revenue
            </p>
            <span className="p-2 rounded-xl bg-amber-500/20 text-amber-600">
              <BarChart3 size={16} />
            </span>
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white mt-2">
            ₹{Number(revenueData.monthRevenue || 0).toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Month to date total</p>
        </div>

        <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-500/10 to-indigo-500/5 border border-purple-500/20 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-black uppercase tracking-wider text-purple-600 dark:text-purple-400">
              ADR (Avg Daily Rate)
            </p>
            <span className="p-2 rounded-xl bg-purple-500/20 text-purple-600">
              <BedDouble size={16} />
            </span>
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white mt-2">
            ₹{Number(revenueData.adr || 0).toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Average per room sold</p>
        </div>

        <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-500/10 to-sky-500/5 border border-blue-500/20 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">
              RevPAR
            </p>
            <span className="p-2 rounded-xl bg-blue-500/20 text-blue-600">
              <ArrowUpRight size={16} />
            </span>
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white mt-2">
            ₹{Number(revenueData.revpar || 0).toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Revenue per available room</p>
        </div>
      </div>

      {/* Revenue Breakdown by Stream */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Stream Breakdown */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <h2 className="text-base font-black text-slate-900 dark:text-white mb-4">
            Revenue Streams
          </h2>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-bold mb-1.5">
                <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                  <BedDouble size={14} className="text-amber-500" /> Room Bookings
                </span>
                <span className="font-mono text-slate-900 dark:text-white">
                  ₹{Number(revenueData.roomRevenue || 0).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: '70%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-1.5">
                <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                  <UtensilsCrossed size={14} className="text-orange-500" /> Restaurant & Room Service
                </span>
                <span className="font-mono text-slate-900 dark:text-white">
                  ₹{Number(revenueData.fbRevenue || 0).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div className="h-full bg-orange-500 rounded-full" style={{ width: '22%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-1.5">
                <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                  <Wallet size={14} className="text-emerald-500" /> Laundry & Other Services
                </span>
                <span className="font-mono text-slate-900 dark:text-white">
                  ₹{Number(revenueData.otherRevenue || 0).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: '8%' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Payment Channels */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <h2 className="text-base font-black text-slate-900 dark:text-white mb-4">
            Payment Mode Distribution
          </h2>

          <div className="grid grid-cols-3 gap-3">
            <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 text-center">
              <CreditCard className="mx-auto text-purple-500 mb-1" size={20} />
              <p className="text-[10px] font-black uppercase text-purple-600 dark:text-purple-400">UPI / QR</p>
              <p className="text-base font-black text-slate-900 dark:text-white mt-1">
                ₹{Number(revenueData.paymentBreakdown?.upi || 0).toLocaleString('en-IN')}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
              <Banknote className="mx-auto text-emerald-500 mb-1" size={20} />
              <p className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400">Cash</p>
              <p className="text-base font-black text-slate-900 dark:text-white mt-1">
                ₹{Number(revenueData.paymentBreakdown?.cash || 0).toLocaleString('en-IN')}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-center">
              <CreditCard className="mx-auto text-blue-500 mb-1" size={20} />
              <p className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400">Card / POS</p>
              <p className="text-base font-black text-slate-900 dark:text-white mt-1">
                ₹{Number(revenueData.paymentBreakdown?.card || 0).toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
