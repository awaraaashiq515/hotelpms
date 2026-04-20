'use client';

import React, { useState, useEffect } from 'react';
import { 
  Eye, RefreshCw, LayoutGrid, Users, 
  CheckCircle2, Clock, Calculator, Map 
} from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';

interface TableStats {
  total: number;
  vacant: number;
  occupied: number;
  billed: number;
  kotRunning: number;
}

interface TableSummary {
  id: string;
  name: string;
  status: string;
  capacity: number;
  floorName: string;
  activeOrder?: {
    totalAmount: number;
    startTime: string;
  };
}

export default function OccupancyPage() {
  const [stats, setStats] = useState<TableStats>({ total: 0, vacant: 0, occupied: 0, billed: 0, kotRunning: 0 });
  const [tables, setTables] = useState<TableSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOccupancy = async () => {
    try {
      const res = await fetch('/api/floors');
      const json = await res.json();
      if (json.success) {
        const allFloors = json.data;
        const flatTables: TableSummary[] = [];
        let t = 0, v = 0, o = 0, b = 0, k = 0;

        allFloors.forEach((floor: any) => {
          floor.tables.forEach((table: any) => {
            t++;
            if (table.status === 'VACANT') v++;
            else {
              o++;
              if (table.status === 'BILL_PRINTED') b++;
              // Note: KOT running is often inferred from active order items
              if (table.activeOrder?.items?.length > 0) k++;
            }

            flatTables.push({
              id: table.id,
              name: table.name,
              status: table.status,
              capacity: table.capacity,
              floorName: floor.name,
              activeOrder: table.activeOrder ? {
                totalAmount: table.activeOrder.grandTotal || 0,
                startTime: table.activeOrder.createdAt
              } : undefined
            });
          });
        });

        setStats({ total: t, vacant: v, occupied: o, billed: b, kotRunning: k });
        setTables(flatTables);
      }
    } catch (err) {
      console.error('Failed to fetch occupancy:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOccupancy();
    const interval = setInterval(fetchOccupancy, 15000); // Refresh every 15s
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchOccupancy();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'VACANT': return 'bg-emerald-500';
      case 'BILL_PRINTED': return 'bg-pos-primary';
      default: return 'bg-red-500';
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <PageHeader 
        title="Live Occupancy" 
        subtitle="Real-time monitoring of floor utilization and table status"
        showBack
        actions={
          <button 
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-[10px] font-bold uppercase tracking-widest text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700 transition-all shadow-sm"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Refreshing...' : 'Refresh Live Data'}
          </button>
        }
      />

      {/* ── Occupancy Pulse ────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Tables', value: stats.total, icon: LayoutGrid, color: 'text-gray-400 dark:text-slate-500' },
          { label: 'Vacant / Free', value: stats.vacant, icon: CheckCircle2, color: 'text-emerald-500' },
          { label: 'Currently Live', value: stats.occupied, icon: Users, color: 'text-red-500' },
          { label: 'Billed / Clearing', value: stats.billed, icon: Calculator, color: 'text-pos-primary' },
        ].map((card) => (
          <div key={card.label} className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-10 h-10 rounded-xl bg-gray-50 dark:bg-slate-800 flex items-center justify-center ${card.color}`}>
                <card.icon size={20} />
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{card.value}</p>
                <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">{card.label}</p>
              </div>
            </div>
            <div className="w-full bg-gray-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-1000 ${card.color.replace('text-', 'bg-')}`} 
                style={{ width: `${stats.total > 0 ? (card.value / stats.total) * 100 : 0}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Visual Floor Map Summary ───────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-8 py-6 border-b border-gray-50 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-widest">Live Floor Overview</h3>
            <p className="text-[10px] text-gray-400 dark:text-slate-500 font-bold mt-1 uppercase tracking-tight">Quick glance at table availability across all floors</p>
          </div>
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                <span className="text-[9px] font-bold text-gray-400 dark:text-slate-500 uppercase">Available</span>
             </div>
             <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                <span className="text-[9px] font-bold text-gray-400 dark:text-slate-500 uppercase">Busy</span>
             </div>
          </div>
        </div>

        <div className="p-8">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <RefreshCw className="animate-spin text-pos-primary" size={32} />
            </div>
          ) : tables.length === 0 ? (
             <div className="text-center py-20">
                <Map size={48} className="mx-auto text-gray-200 dark:text-slate-800 mb-4" />
                <p className="text-xs font-bold text-gray-400 dark:text-slate-600 uppercase tracking-widest">No tables found in system</p>
             </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3">
              {tables.map((table) => (
                <div 
                  key={table.id}
                  className={`relative aspect-square rounded-2xl flex flex-col items-center justify-center p-2 transition-all border ${
                    table.status === 'VACANT' 
                      ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30' 
                      : table.status === 'BILL_PRINTED'
                      ? 'bg-pos-primary/10 border-pos-primary/20'
                      : 'bg-red-50 dark:bg-red-950/20 border-red-100 dark:border-red-900/30'
                  }`}
                >
                  <span className={`text-[10px] font-bold ${table.status === 'VACANT' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'} uppercase`}>
                    {table.name}
                  </span>
                  <p className="text-[8px] font-bold text-gray-400 dark:text-slate-500 mt-0.5">{table.floorName}</p>
                  
                  {table.status !== 'VACANT' && table.activeOrder && (
                    <div className="mt-1">
                       <p className="text-[9px] font-bold text-gray-900 dark:text-white">₹{table.activeOrder.totalAmount.toFixed(0)}</p>
                    </div>
                  )}
                  
                  <div className={`absolute top-2 right-2 w-1.5 h-1.5 rounded-full ${getStatusColor(table.status)} shadow-sm shadow-black/10`}></div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="px-8 py-4 bg-gray-50/50 dark:bg-slate-800/30 border-t border-gray-50 dark:border-slate-800">
           <p className="text-[10px] font-bold text-gray-400 dark:text-slate-600 italic">
              * This view provides a high-density summary for floor management. Use the "Table Layout" page for full operational control.
           </p>
        </div>
      </div>
    </div>
  );
}
