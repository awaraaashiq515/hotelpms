'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Wrench, Plus, Search, RefreshCw, AlertTriangle,
  CheckCircle2, Clock, User, Bed, Calendar,
  Circle, AlertCircle, Zap, ChevronRight, X,
} from 'lucide-react';

interface MaintenanceTicket {
  id: string;
  title: string;
  description?: string;
  priority: string;
  status: string;
  category: string;
  reportedAt: string;
  resolvedAt?: string;
  room?: { roomNumber: string; floor?: string };
  assignedTo?: string;
}

const PRIORITY_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string; icon: React.FC<any> }> = {
  LOW:    { label: 'Low',    color: 'text-slate-400',  bg: 'bg-slate-700/40 border-slate-600/30',   dot: 'bg-slate-500',  icon: Circle },
  MEDIUM: { label: 'Medium', color: 'text-yellow-400', bg: 'bg-yellow-500/15 border-yellow-500/30', dot: 'bg-yellow-400', icon: AlertCircle },
  HIGH:   { label: 'High',   color: 'text-orange-400', bg: 'bg-orange-500/15 border-orange-500/30', dot: 'bg-orange-400', icon: AlertTriangle },
  URGENT: { label: 'Urgent', color: 'text-red-400',    bg: 'bg-red-500/15 border-red-500/30',       dot: 'bg-red-400 animate-pulse', icon: Zap },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  OPEN:        { label: 'Open',        color: 'text-sky-400',     bg: 'bg-sky-500/15 border-sky-500/30' },
  IN_PROGRESS: { label: 'In Progress', color: 'text-amber-400',   bg: 'bg-amber-500/15 border-amber-500/30' },
  RESOLVED:    { label: 'Resolved',    color: 'text-emerald-400', bg: 'bg-emerald-500/15 border-emerald-500/30' },
  CLOSED:      { label: 'Closed',      color: 'text-slate-500',   bg: 'bg-slate-700/30 border-slate-600/20' },
};

const CATEGORIES = ['Electrical', 'Plumbing', 'HVAC', 'Furniture', 'Door/Lock', 'Bathroom', 'TV/Electronics', 'Other'];

// Mock tickets since API may not exist yet
const MOCK_TICKETS: MaintenanceTicket[] = [
  { id: '1', title: 'AC not cooling properly', priority: 'HIGH', status: 'OPEN', category: 'HVAC', reportedAt: new Date().toISOString(), room: { roomNumber: '101', floor: '1' } },
  { id: '2', title: 'Leaking tap in bathroom', priority: 'MEDIUM', status: 'IN_PROGRESS', category: 'Plumbing', reportedAt: new Date(Date.now() - 3600000).toISOString(), assignedTo: 'Raju', room: { roomNumber: '205', floor: '2' } },
  { id: '3', title: 'TV remote not working', priority: 'LOW', status: 'RESOLVED', category: 'TV/Electronics', reportedAt: new Date(Date.now() - 86400000).toISOString(), resolvedAt: new Date().toISOString(), room: { roomNumber: '310', floor: '3' } },
  { id: '4', title: 'Door lock jammed', priority: 'URGENT', status: 'OPEN', category: 'Door/Lock', reportedAt: new Date(Date.now() - 1800000).toISOString(), room: { roomNumber: '402', floor: '4' } },
];

function TicketCard({
  ticket, onStatusChange,
}: {
  ticket: MaintenanceTicket;
  onStatusChange: (id: string, status: string) => void;
}) {
  const pri = PRIORITY_CONFIG[ticket.priority] || PRIORITY_CONFIG.LOW;
  const sta = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.OPEN;
  const PriIcon = pri.icon;

  return (
    <div className={`p-4 rounded-2xl border ${ticket.status === 'RESOLVED' || ticket.status === 'CLOSED' ? 'opacity-60' : ''} bg-slate-900/60 border-slate-800/60 hover:border-slate-700/60 transition-all duration-200 group`}>
      <div className="flex items-start gap-3 mb-3">
        <div className={`w-8 h-8 rounded-xl ${pri.bg} border flex items-center justify-center shrink-0`}>
          <PriIcon size={14} className={pri.color} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white leading-tight">{ticket.title}</p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${pri.bg} ${pri.color}`}>
              {pri.label}
            </span>
            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${sta.bg} ${sta.color}`}>
              {sta.label}
            </span>
            <span className="text-[9px] text-slate-600 font-bold">{ticket.category}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 text-[10px] text-slate-600 font-bold mb-3 flex-wrap">
        {ticket.room && (
          <span className="flex items-center gap-1">
            <Bed size={9} /> Room {ticket.room.roomNumber}
            {ticket.room.floor && ` (F${ticket.room.floor})`}
          </span>
        )}
        {ticket.assignedTo && (
          <span className="flex items-center gap-1">
            <User size={9} /> {ticket.assignedTo}
          </span>
        )}
        <span className="flex items-center gap-1">
          <Clock size={9} />
          {new Date(ticket.reportedAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      {/* Action Buttons */}
      {ticket.status === 'OPEN' && (
        <div className="flex gap-2">
          <button
            onClick={() => onStatusChange(ticket.id, 'IN_PROGRESS')}
            className="flex-1 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold hover:bg-amber-500/20 transition-all"
          >
            Start Work
          </button>
          <button
            onClick={() => onStatusChange(ticket.id, 'RESOLVED')}
            className="flex-1 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold hover:bg-emerald-500/20 transition-all"
          >
            Mark Resolved
          </button>
        </div>
      )}
      {ticket.status === 'IN_PROGRESS' && (
        <button
          onClick={() => onStatusChange(ticket.id, 'RESOLVED')}
          className="w-full py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold hover:bg-emerald-500/20 transition-all"
        >
          ✓ Mark as Resolved
        </button>
      )}
    </div>
  );
}

export default function MaintenancePage() {
  const [tickets, setTickets] = useState<MaintenanceTicket[]>(MOCK_TICKETS);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [showNewForm, setShowNewForm] = useState(false);
  const [newTicket, setNewTicket] = useState({
    title: '', category: 'Electrical', priority: 'MEDIUM', roomNumber: '', description: '',
  });
  const [saving, setSaving] = useState(false);

  const filtered = tickets.filter(t => {
    const q = search.toLowerCase();
    const titleMatch = !q || t.title.toLowerCase().includes(q) || t.room?.roomNumber.includes(q);
    const staMatch = statusFilter === 'all' || t.status === statusFilter;
    const priMatch = priorityFilter === 'all' || t.priority === priorityFilter;
    return titleMatch && staMatch && priMatch;
  });

  const openCount = tickets.filter(t => t.status === 'OPEN').length;
  const inProgressCount = tickets.filter(t => t.status === 'IN_PROGRESS').length;
  const urgentCount = tickets.filter(t => t.priority === 'URGENT' && t.status !== 'RESOLVED').length;
  const resolvedToday = tickets.filter(t => {
    if (!t.resolvedAt) return false;
    const d = new Date(t.resolvedAt).toISOString().split('T')[0];
    return d === new Date().toISOString().split('T')[0];
  }).length;

  const handleStatusChange = (id: string, status: string) => {
    setTickets(prev => prev.map(t => t.id === id ? { ...t, status, resolvedAt: status === 'RESOLVED' ? new Date().toISOString() : t.resolvedAt } : t));
  };

  const handleAdd = async () => {
    if (!newTicket.title.trim()) return;
    setSaving(true);
    const mock: MaintenanceTicket = {
      id: Date.now().toString(),
      title: newTicket.title,
      description: newTicket.description,
      priority: newTicket.priority,
      status: 'OPEN',
      category: newTicket.category,
      reportedAt: new Date().toISOString(),
      room: newTicket.roomNumber ? { roomNumber: newTicket.roomNumber } : undefined,
    };
    setTickets(prev => [mock, ...prev]);
    setShowNewForm(false);
    setNewTicket({ title: '', category: 'Electrical', priority: 'MEDIUM', roomNumber: '', description: '' });
    setSaving(false);
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Wrench className="text-purple-400" size={24} /> Maintenance
          </h1>
          <p className="text-xs text-slate-500 font-bold mt-1">
            {openCount} open · {inProgressCount} in progress
            {urgentCount > 0 && <span className="text-red-400"> · {urgentCount} URGENT</span>}
          </p>
        </div>
        <button
          onClick={() => setShowNewForm(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white transition-all shadow-lg shadow-purple-900/40"
        >
          <Plus size={13} /> New Ticket
        </button>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Open', value: openCount, icon: AlertCircle, color: 'text-sky-400', bg: 'bg-sky-600' },
          { label: 'In Progress', value: inProgressCount, icon: Wrench, color: 'text-amber-400', bg: 'bg-amber-600' },
          { label: 'Urgent', value: urgentCount, icon: Zap, color: 'text-red-400', bg: 'bg-red-600' },
          { label: 'Resolved Today', value: resolvedToday, icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-700' },
        ].map(s => (
          <div key={s.label} className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/60">
            <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
              <s.icon size={16} className="text-white" />
            </div>
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-xs font-bold text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          {['all', 'OPEN', 'IN_PROGRESS', 'RESOLVED'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wide transition-all ${statusFilter === s ? 'bg-purple-500/20 border border-purple-500/40 text-purple-300' : 'bg-slate-800/40 border border-slate-700/30 text-slate-500 hover:text-slate-300'}`}>
              {s === 'all' ? 'All Status' : (STATUS_CONFIG[s]?.label || s)}
            </button>
          ))}
          {['all', 'URGENT', 'HIGH', 'MEDIUM', 'LOW'].map(p => (
            <button key={p} onClick={() => setPriorityFilter(p)}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wide transition-all ${priorityFilter === p ? 'bg-purple-500/20 border border-purple-500/40 text-purple-300' : 'bg-slate-800/40 border border-slate-700/30 text-slate-500 hover:text-slate-300'}`}>
              {p === 'all' ? 'All Priority' : p}
            </button>
          ))}
        </div>
        <div className="relative sm:ml-auto max-w-xs w-full">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tickets…"
            className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700/40 text-white text-xs font-semibold placeholder-slate-600 focus:outline-none focus:border-purple-500/50 transition-all" />
        </div>
      </div>

      {/* Ticket Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map(t => (
          <TicketCard key={t.id} ticket={t} onStatusChange={handleStatusChange} />
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full text-center py-12">
            <CheckCircle2 size={40} className="text-emerald-600 mx-auto mb-3" />
            <p className="text-slate-500 font-bold">No tickets found</p>
          </div>
        )}
      </div>

      {/* New Ticket Modal */}
      {showNewForm && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0d0d1a] border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/8">
              <p className="text-base font-black text-white">New Maintenance Ticket</p>
              <button onClick={() => setShowNewForm(false)} className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400">
                <X size={13} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5">Issue Title *</label>
                <input value={newTicket.title} onChange={e => setNewTicket(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. AC not working in room 101"
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-semibold placeholder-slate-600 focus:outline-none focus:border-purple-500/50 transition-all" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1.5">Category</label>
                  <select value={newTicket.category} onChange={e => setNewTicket(f => ({ ...f, category: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500/50 transition-all">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1.5">Priority</label>
                  <select value={newTicket.priority} onChange={e => setNewTicket(f => ({ ...f, priority: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500/50 transition-all">
                    {Object.entries(PRIORITY_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5">Room Number</label>
                <input value={newTicket.roomNumber} onChange={e => setNewTicket(f => ({ ...f, roomNumber: e.target.value }))}
                  placeholder="e.g. 101"
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-semibold placeholder-slate-600 focus:outline-none focus:border-purple-500/50 transition-all" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5">Description</label>
                <textarea value={newTicket.description} onChange={e => setNewTicket(f => ({ ...f, description: e.target.value }))}
                  rows={3} placeholder="Describe the issue…"
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-semibold placeholder-slate-600 focus:outline-none focus:border-purple-500/50 transition-all resize-none" />
              </div>
            </div>
            <div className="flex gap-2 px-6 pb-6">
              <button onClick={() => setShowNewForm(false)} className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-400 text-sm font-bold hover:bg-white/5 transition-all">Cancel</button>
              <button onClick={handleAdd} disabled={saving || !newTicket.title.trim()} className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold transition-all disabled:opacity-50">
                {saving ? 'Creating…' : 'Create Ticket'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
