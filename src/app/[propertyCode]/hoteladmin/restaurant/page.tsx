'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Coffee, UtensilsCrossed, RefreshCw, ArrowLeft, Clock,
  CheckCircle2, BedDouble, AlertCircle, IndianRupee
} from 'lucide-react';

export default function HotelAdminRestaurantPage() {
  const params = useParams();
  const propertyCode = (params?.propertyCode as string) || '';

  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<any[]>([
    {
      id: 'RS-101',
      roomNumber: '204',
      items: '2x Paneer Butter Masala, 4x Butter Naan, 1x Dal Makhani',
      status: 'DELIVERED',
      total: 850,
      time: '12:45 PM',
      guestName: 'Rohit Sharma',
    },
    {
      id: 'RS-102',
      roomNumber: '305',
      items: '1x Club Sandwich, 2x Cold Coffee, 1x French Fries',
      status: 'IN_DELIVERY',
      total: 480,
      time: '01:15 PM',
      guestName: 'Ananya Verma',
    },
    {
      id: 'RS-103',
      roomNumber: '108',
      items: '1x Veg Biryani, 1x Raita, 1x Gulab Jamun',
      status: 'COOKING',
      total: 390,
      time: '01:30 PM',
      guestName: 'Amit Patel',
    },
  ]);

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
            <Coffee className="text-amber-500" size={26} />
            Restaurant & Room Service Overview
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Monitor hotel dining, kitchen orders, and in-room food delivery status
          </p>
        </div>

        <button
          onClick={() => {}}
          className="flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors w-fit"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Today's Room Service Orders</p>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{orders.length}</p>
          <p className="text-[10px] text-slate-400 mt-1">Orders dispatched to rooms</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-500/20 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-wider text-emerald-500">F&B Total Today</p>
          <p className="text-2xl font-black text-emerald-500 mt-1">
            ₹{orders.reduce((sum, o) => sum + o.total, 0).toLocaleString('en-IN')}
          </p>
          <p className="text-[10px] text-slate-400 mt-1">In-room dining billed</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-amber-500/20 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-wider text-amber-500">Active in Kitchen</p>
          <p className="text-2xl font-black text-amber-500 mt-1">
            {orders.filter((o) => o.status !== 'DELIVERED').length}
          </p>
          <p className="text-[10px] text-slate-400 mt-1">Cooking or in transit</p>
        </div>
      </div>

      {/* Live Room Service Orders */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-sm font-black text-slate-900 dark:text-white">Recent Room Service Orders</h2>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
          {orders.map((o) => (
            <div key={o.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500 font-black text-xs shrink-0 flex items-center gap-1">
                  <BedDouble size={14} />
                  <span>Room {o.roomNumber}</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white text-xs">{o.guestName}</span>
                    <span className="text-[10px] text-slate-400">· {o.time}</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">{o.items}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 self-end sm:self-center">
                <span className="font-black text-slate-900 dark:text-white text-sm">
                  ₹{o.total}
                </span>
                <span
                  className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                    o.status === 'DELIVERED'
                      ? 'bg-emerald-500/15 text-emerald-500'
                      : o.status === 'IN_DELIVERY'
                      ? 'bg-blue-500/15 text-blue-500'
                      : 'bg-amber-500/15 text-amber-500'
                  }`}
                >
                  {o.status.replace('_', ' ')}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
