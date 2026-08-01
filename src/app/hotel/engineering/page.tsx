'use client';
import React, { useState } from 'react';
import { Cpu, Wrench, Zap } from 'lucide-react';
import { PPMSchedule, type PPMTask } from './components/PPMSchedule';
import { AssetRegistry, type Asset } from './components/AssetRegistry';

const MOCK_TASKS: PPMTask[] = [
  { id:'1', assetName:'HVAC Unit - Floor 1',   assetId:'A-001', taskType:'Filter Cleaning',     frequency:'MONTHLY',    nextDue:'2026-07-15', status:'DUE_SOON', priority:'HIGH',   assignedTo:'Raju K.' },
  { id:'2', assetName:'Generator',             assetId:'A-002', taskType:'Oil Change',           frequency:'QUARTERLY',  nextDue:'2026-07-20', status:'OK',       priority:'MEDIUM', assignedTo:'Suresh M.' },
  { id:'3', assetName:'Elevator - Block A',    assetId:'A-003', taskType:'Safety Inspection',    frequency:'MONTHLY',    nextDue:'2026-07-10', status:'OVERDUE',  priority:'HIGH',   assignedTo:'AMC Team' },
  { id:'4', assetName:'Swimming Pool',         assetId:'A-004', taskType:'Water Chemical Check', frequency:'DAILY',      nextDue:'2026-07-14', status:'OK',       priority:'MEDIUM', assignedTo:'Pool Staff' },
  { id:'5', assetName:'Kitchen Exhaust',       assetId:'A-005', taskType:'Deep Cleaning',        frequency:'WEEKLY',     nextDue:'2026-07-16', status:'DUE_SOON', priority:'MEDIUM', assignedTo:'Kitchen Team' },
  { id:'6', assetName:'Fire Suppression Sys',  assetId:'A-006', taskType:'Annual Test',          frequency:'ANNUALLY',   nextDue:'2026-12-01', status:'OK',       priority:'HIGH',   assignedTo:'Fire AMC' },
];

const MOCK_ASSETS: Asset[] = [
  { id:'1', name:'HVAC Unit - Floor 1',  assetCode:'A-001', category:'HVAC',           location:'Basement', brand:'Daikin',   model:'VRV-IV',    status:'OPERATIONAL',       purchaseDate:'2022-03-01', warrantyExpiry:'2027-03-01', lastServiced:'2026-06-15', nextService:'2026-07-15' },
  { id:'2', name:'Diesel Generator',     assetCode:'A-002', category:'Power',          location:'Generator Room', brand:'Kirloskar', model:'KG-250', status:'OPERATIONAL',   purchaseDate:'2021-01-15', warrantyExpiry:'2026-01-15', lastServiced:'2026-04-20', nextService:'2026-07-20' },
  { id:'3', name:'Elevator - Block A',   assetCode:'A-003', category:'Elevator',       location:'Block A',  brand:'Otis',    model:'GEN2',      status:'UNDER_MAINTENANCE', purchaseDate:'2020-06-01', warrantyExpiry:'2025-06-01', lastServiced:'2026-01-10', nextService:'2026-07-10' },
  { id:'4', name:'CCTV System',          assetCode:'A-004', category:'Security',       location:'All Floors',brand:'Hikvision',model:'DS-2CD', status:'OPERATIONAL',       purchaseDate:'2023-08-01', warrantyExpiry:'2026-08-01', lastServiced:'2026-06-01', nextService:'2026-12-01' },
  { id:'5', name:'Industrial Dishwasher',assetCode:'A-005', category:'Kitchen',        location:'Kitchen',  brand:'Winterhalter',model:'PT-M', status:'OPERATIONAL',       purchaseDate:'2022-05-01', warrantyExpiry:'2025-05-01', lastServiced:'2026-05-15', nextService:'2026-08-15' },
  { id:'6', name:'Laundry Machine L1',   assetCode:'A-006', category:'Laundry',        location:'Laundry',  brand:'Electrolux',model:'W5180N', status:'FAULTY',            purchaseDate:'2021-11-01', warrantyExpiry:'2024-11-01', lastServiced:'2026-06-01', nextService:'Pending Repair' },
];

export default function EngineeringPage() {
  const [tab, setTab] = useState<'ppm'|'assets'>('ppm');
  const [tasks, setTasks] = useState(MOCK_TASKS);

  return (
    <div className="space-y-5 pb-10 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Cpu size={14} className="text-cyan-400" />
            <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">Operations · Engineering</span>
          </div>
          <h1 className="text-2xl font-black text-white">Engineering Department</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {MOCK_ASSETS.length} assets · {tasks.filter(t=>t.status==='OVERDUE').length} overdue tasks
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label:'Total Assets',    value:MOCK_ASSETS.length,                                          color:'text-cyan-300 border-cyan-500/20 bg-cyan-900/20' },
          { label:'Operational',     value:MOCK_ASSETS.filter(a=>a.status==='OPERATIONAL').length,      color:'text-emerald-300 border-emerald-500/20 bg-emerald-900/20' },
          { label:'Under Maintenance',value:MOCK_ASSETS.filter(a=>a.status==='UNDER_MAINTENANCE').length,color:'text-amber-300 border-amber-500/20 bg-amber-900/20' },
          { label:'Overdue PPM',     value:tasks.filter(t=>t.status==='OVERDUE').length,               color:'text-rose-300 border-rose-500/20 bg-rose-900/20' },
        ].map(s => (
          <div key={s.label} className={`rounded-2xl border p-4 ${s.color}`}>
            <p className="text-2xl font-black text-white">{s.value}</p>
            <p className="text-[9px] font-bold uppercase tracking-widest opacity-60 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        {([['ppm','PPM Schedule'],['assets','Asset Registry']] as const).map(([v,l]) => (
          <button key={v} onClick={() => setTab(v)}
            className={`px-4 h-9 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors ${tab===v ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
            {v === 'ppm' ? <><Wrench size={11} className="inline mr-1" />{l}</> : <><Cpu size={11} className="inline mr-1" />{l}</>}
          </button>
        ))}
      </div>

      {tab === 'ppm' && (
        <PPMSchedule tasks={tasks}
          onComplete={id => setTasks(prev => prev.map(t => t.id===id ? {...t, status:'COMPLETED'} : t))} />
      )}
      {tab === 'assets' && <AssetRegistry assets={MOCK_ASSETS} />}
    </div>
  );
}
