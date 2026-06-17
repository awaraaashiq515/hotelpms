'use client';

import React, { useEffect, useState } from 'react';

interface LiveKitchenTickerProps {
  activeOrders: any[];
}

export function LiveKitchenTicker({ activeOrders }: LiveKitchenTickerProps) {
  // Trigger local state updates to refresh the elapsed minutes ticker occasionally
  const [, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 30000); // refresh every 30 seconds
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="h-11 shrink-0 bg-slate-950/45 border-b border-white/[0.06] backdrop-blur-md flex items-center justify-between px-6 select-none overflow-hidden text-[9px] font-black tracking-widest uppercase relative z-50">
      <div className="flex items-center gap-2 shrink-0 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
        <span className="text-emerald-400 font-black">Live Status</span>
      </div>
      <div className="flex-1 flex items-center gap-6 overflow-x-auto no-scrollbar ml-8 mr-4 py-1.5">
        {activeOrders.length === 0 ? (
          <span className="text-slate-500 font-semibold tracking-normal normal-case">All orders served. Kitchen is clear.</span>
        ) : (
          activeOrders.map(order => {
            const tableName = order.table?.name || `Table ${order.tableNo || '?'}`;
            const isReady = order.status === 'READY';
            const isAwaiting = order.status === 'PAYMENT_AWAITING_APPROVAL';

            const elapsedMins = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000);
            const limit = order.preparationTime || 15;
            const isLate = (order.status === 'KOT_RUNNING' || order.status === 'IN_KITCHEN') && elapsedMins >= limit;

            const readyPickupLimit = typeof window !== 'undefined' ? parseInt(localStorage.getItem('kds_ready_pickup_time') || '5', 10) : 5;
            const readyWaitMin = order.updatedAt ? Math.floor((Date.now() - new Date(order.updatedAt).getTime()) / 60000) : 0;
            const isPickupLate = isReady && readyPickupLimit > 0 && readyWaitMin >= readyPickupLimit;

            let statusLabel = 'In Kitchen';
            let badgeColor = 'bg-amber-500/10 border-amber-500/20 text-amber-400';
            let pulseClass = '';

            if (isLate) {
              statusLabel = 'Late Kitchen';
              badgeColor = 'bg-rose-500/20 border-rose-500/30 text-rose-400';
              pulseClass = 'animate-pulse';
            } else if (isPickupLate) {
              statusLabel = 'Late Pickup';
              badgeColor = 'bg-blue-500/20 border-blue-500/30 text-blue-400';
              pulseClass = 'animate-pulse';
            } else if (isReady) {
              statusLabel = 'Ready to Serve';
              badgeColor = 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400';
              pulseClass = 'animate-pulse';
            } else if (isAwaiting) {
              statusLabel = 'Awaiting Settle';
              badgeColor = 'bg-blue-500/10 border-blue-500/20 text-blue-400';
            }

            return (
              <div key={order.id} className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-[8px] font-black uppercase tracking-wider ${badgeColor} ${pulseClass} shrink-0`}>
                <span className="text-white">{tableName}</span>
                <span className="opacity-40">•</span>
                <span>{statusLabel}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
