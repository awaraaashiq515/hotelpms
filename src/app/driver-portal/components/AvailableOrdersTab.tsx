'use client';

import React from 'react';
import { Bike, HelpCircle, ShieldAlert, Radio } from 'lucide-react';
import { PosOrder } from '../types';
import { CustomerLocationMap } from './CustomerLocationMap';

interface AvailableOrdersTabProps {
  t: any;
  unassignedOrders: PosOrder[];
  fetchingOrders: boolean;
  handleAcceptOffer: (id: string) => void;
  dutyStatus: string;
  handleToggleDuty: () => void;
}

export function AvailableOrdersTab({
  t,
  unassignedOrders,
  fetchingOrders,
  handleAcceptOffer,
  dutyStatus,
  handleToggleDuty
}: AvailableOrdersTabProps) {
  
  if (dutyStatus !== 'online') {
    return (
      <div className="text-center py-16 bg-[#0f172a] rounded-[2rem] border border-[#1e293b] p-6 space-y-4 animate-in fade-in duration-200">
        <div className="w-12 h-12 bg-slate-850 border border-slate-700/60 rounded-2xl flex items-center justify-center text-slate-400 mx-auto relative">
          <Radio size={22} className="animate-pulse" />
          <div className="absolute top-0 right-0 w-2.5 h-2.5 rounded-full bg-slate-500 border-2 border-[#090b10]" />
        </div>
        
        <div className="space-y-1.5">
          <h4 className="font-black text-white text-xs uppercase tracking-tight">Duty Status: Offline</h4>
          <p className="text-[10px] text-slate-500 max-w-[240px] mx-auto leading-relaxed font-bold uppercase">
            You must switch your duty status to Online to scan nearby orders and receive customer delivery assignments.
          </p>
        </div>

        <button
          onClick={handleToggleDuty}
          className="w-full max-w-[200px] mx-auto h-10 rounded-xl text-[9px] font-black uppercase tracking-widest bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-emerald-500/20"
        >
          <Radio size={11} /> Go Online Now
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {fetchingOrders && unassignedOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 space-y-3">
          <div className="w-6 h-6 border-2 border-indigo-500/20 rounded-full animate-spin border-t-indigo-500" />
          <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">Searching nearby orders...</p>
        </div>
      ) : unassignedOrders.length === 0 ? (
        <div className="text-center py-12 bg-[#0f172a] rounded-2xl border border-[#1e293b] p-5 space-y-3">
          <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400 mx-auto border border-indigo-500/20">
            <HelpCircle size={20} />
          </div>
          <div>
            <h4 className="font-bold text-white text-xs uppercase">No Nearby Orders Available</h4>
            <p className="text-[10px] text-slate-500 max-w-[200px] mx-auto leading-relaxed uppercase font-bold">
              There are no pending delivery assignments matching your outlet routing or delivery radius at the moment.
            </p>
          </div>
        </div>
      ) : (
        unassignedOrders.map(order => (
          <div key={order.id} className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-4 shadow-md space-y-3">
            <div className="flex justify-between items-start border-b border-[#1e293b] pb-2">
              <div>
                <span className="text-[7.5px] font-black text-slate-500 uppercase tracking-widest block">ORDER NO</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-xs font-black text-white font-mono">{order.orderNo}</span>
                  {order.isPrepaid ? (
                    <span className="bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[6.5px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded">
                      Already Paid
                    </span>
                  ) : (
                    <span className="bg-amber-500/10 border border-amber-500/25 text-amber-400 text-[6.5px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded">
                      Pay on Delivery
                    </span>
                  )}
                </div>
              </div>
              <span className="text-sm font-black text-rose-500">₹{order.grandTotal.toFixed(0)}</span>
            </div>

            <div className="bg-[#070b12] p-2 rounded-xl border border-[#1e293b]/60">
              <CustomerLocationMap order={order} />
            </div>

            <button
              onClick={() => handleAcceptOffer(order.id)}
              className="w-full h-10 rounded-xl text-[9px] font-black uppercase tracking-widest bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center gap-1 transition-all"
            >
              <Bike size={11} /> {t.claimDeliver}
            </button>
          </div>
        ))
      )}
    </div>
  );
}
