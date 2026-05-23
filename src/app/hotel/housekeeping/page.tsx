'use client';

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Loader2, 
  CheckCircle2, 
  AlertTriangle, 
  Wrench, 
  Plus, 
  Clock, 
  User, 
  Activity, 
  ClipboardCheck,
  Check
} from 'lucide-react';
import { toast, Toaster } from 'sonner';

export default function HousekeepingConsole() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'housekeeping' | 'maintenance'>('housekeeping');
  const [filterDirty, setFilterDirty] = useState(true); // default to only show dirty rooms
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Maintenance Form State
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [issueType, setIssueType] = useState('Plumbing');
  const [priority, setPriority] = useState('MEDIUM');
  const [description, setDescription] = useState('');
  const [showAddTicket, setShowAddTicket] = useState(false);
  const [submittingTicket, setSubmittingTicket] = useState(false);

  const loadData = () => {
    setLoading(true);
    Promise.all([
      fetch('/api/hotel/rooms').then((res) => res.json()),
      fetch('/api/hotel/maintenance').then((res) => res.json()),
    ])
      .then(([roomsRes, ticketsRes]) => {
        if (roomsRes.success) setRooms(roomsRes.data);
        if (ticketsRes.success) setTickets(ticketsRes.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error loading data:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateHousekeeping = async (roomId: string, currentStatus: string) => {
    setUpdatingId(roomId);
    const newHousekeepingStatus = currentStatus === 'DIRTY' ? 'CLEAN' : 'DIRTY';
    
    try {
      const res = await fetch('/api/hotel/rooms', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: roomId, housekeepingStatus: newHousekeepingStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setRooms(rooms.map((r) => (r.id === roomId ? data.data : r)));
        toast.success(`Room marked as ${newHousekeepingStatus}`);
      } else {
        toast.error(data.message || 'Failed to update status');
      }
    } catch (err) {
      toast.error('Network error updating room');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoomId) {
      toast.error('Please select a room');
      return;
    }

    setSubmittingTicket(true);
    try {
      const res = await fetch('/api/hotel/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: selectedRoomId,
          issueType,
          priority,
          description,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Maintenance ticket created. Room has been blocked.');
        setTickets([data.data, ...tickets]);
        
        // Update room status local state to MAINTENANCE
        setRooms(rooms.map((r) => r.id === selectedRoomId ? { ...r, status: 'MAINTENANCE' } : r));
        
        // Reset form
        setSelectedRoomId('');
        setDescription('');
        setShowAddTicket(false);
      } else {
        toast.error(data.message || 'Failed to file ticket');
      }
    } catch (err) {
      toast.error('Network error filing ticket');
    } finally {
      setSubmittingTicket(false);
    }
  };

  const handleResolveTicket = async (ticketId: string) => {
    try {
      const res = await fetch('/api/hotel/maintenance', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId,
          status: 'RESOLVED',
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Ticket marked as resolved. Room is available.');
        setTickets(tickets.map((t) => t.id === ticketId ? { ...t, status: 'RESOLVED', resolvedAt: new Date().toISOString() } : t));
        loadData(); // reload rooms status
      } else {
        toast.error(data.message || 'Failed to update ticket');
      }
    } catch (err) {
      toast.error('Network error updating ticket');
    }
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-indigo-500" size={32} />
      </div>
    );
  }

  // Filter rooms based on selection
  const filteredRooms = filterDirty 
    ? rooms.filter((r) => r.housekeepingStatus === 'DIRTY')
    : rooms;

  return (
    <div className="space-y-8 pb-12">
      <Toaster position="top-right" richColors />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-indigo-400">
            <Sparkles size={12} /> Service Hub
          </span>
          <h1 className="text-2xl md:text-3xl font-black text-white leading-none">
            Housekeeping & Maintenance Console
          </h1>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-slate-800">
        <button
          onClick={() => setActiveTab('housekeeping')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all ${
            activeTab === 'housekeeping'
              ? 'border-indigo-500 text-indigo-400 font-black'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Rooms Cleaning List
        </button>
        <button
          onClick={() => setActiveTab('maintenance')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all ${
            activeTab === 'maintenance'
              ? 'border-indigo-500 text-indigo-400 font-black'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Maintenance Log ({tickets.filter(t => t.status === 'OPEN').length} Open)
        </button>
      </div>

      {/* Housekeeping Tab Content */}
      {activeTab === 'housekeeping' && (
        <div className="space-y-6">
          {/* Quick Filters */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFilterDirty(true)}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  filterDirty
                    ? 'bg-amber-500/20 border border-amber-500/30 text-amber-400'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                Show Dirty Rooms ({rooms.filter(r => r.housekeepingStatus === 'DIRTY').length})
              </button>
              <button
                onClick={() => setFilterDirty(false)}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  !filterDirty
                    ? 'bg-indigo-600 border border-indigo-500 text-white shadow-lg shadow-indigo-600/10'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                Show All Rooms ({rooms.length})
              </button>
            </div>
          </div>

          {/* Rooms List Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredRooms.length === 0 ? (
              <div className="col-span-full py-16 text-center rounded-3xl bg-[#0f172a] border border-slate-800/80 text-slate-500 text-sm italic">
                All rooms are clean and in pristine condition! ✨
              </div>
            ) : (
              filteredRooms.map((room) => {
                const isDirty = room.housekeepingStatus === 'DIRTY';
                const isOccupied = room.status === 'OCCUPIED';
                const isMaintenance = room.status === 'MAINTENANCE';

                return (
                  <div
                    key={room.id}
                    className={`rounded-3xl bg-[#0f172a] border p-5 flex flex-col justify-between gap-5 transition-all ${
                      isDirty ? 'border-amber-500/20' : 'border-slate-800'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-black text-white">Room {room.roomNumber}</h3>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">{room.roomType?.name}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1.5">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                          isOccupied 
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' 
                            : isMaintenance
                            ? 'bg-slate-800 text-slate-400 border-slate-700'
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        }`}>
                          {isOccupied ? 'Occupied' : isMaintenance ? 'Blocked' : 'Vacant'}
                        </span>
                        
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                          isDirty 
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' 
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        }`}>
                          {isDirty ? 'Dirty' : 'Clean'}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <button
                        disabled={updatingId === room.id}
                        onClick={() => handleUpdateHousekeeping(room.id, room.housekeepingStatus)}
                        className={`w-full py-2.5 rounded-xl text-xs font-black uppercase tracking-wide border flex items-center justify-center gap-1.5 transition-colors ${
                          isDirty
                            ? 'bg-emerald-600 hover:bg-emerald-500 border-emerald-600 text-white shadow-lg shadow-emerald-600/10'
                            : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {isDirty ? (
                          <>
                            <CheckCircle2 size={12} /> Mark Clean
                          </>
                        ) : (
                          <>
                            <AlertTriangle size={12} /> Mark Dirty
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => {
                          setSelectedRoomId(room.id);
                          setActiveTab('maintenance');
                          setShowAddTicket(true);
                        }}
                        className="w-full py-2.5 rounded-xl text-xs font-black uppercase tracking-wide border border-slate-800 hover:border-slate-700 bg-slate-900/60 hover:bg-slate-900 text-slate-400 hover:text-slate-200 flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Wrench size={12} /> Report Fix
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Maintenance Tab Content */}
      {activeTab === 'maintenance' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-white">Maintenance Tickets</h2>
            <button
              onClick={() => setShowAddTicket(!showAddTicket)}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-1.5"
            >
              <Plus size={14} /> File Issue Ticket
            </button>
          </div>

          {/* Add Ticket Form */}
          {showAddTicket && (
            <form onSubmit={handleCreateTicket} className="p-6 rounded-3xl bg-[#0f172a] border border-slate-800 space-y-4 max-w-xl animate-in fade-in zoom-in duration-200">
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-300">File Room Issue Ticket</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Select Room *</label>
                  <select
                    required
                    value={selectedRoomId}
                    onChange={(e) => setSelectedRoomId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-100 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  >
                    <option value="">Select Room</option>
                    {rooms.map((r) => (
                      <option key={r.id} value={r.id}>Room {r.roomNumber} ({r.roomType?.code})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Issue Type *</label>
                  <select
                    required
                    value={issueType}
                    onChange={(e) => setIssueType(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-100 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  >
                    <option value="Plumbing">Plumbing</option>
                    <option value="Electrical">Electrical</option>
                    <option value="AC / Heating">AC / Heating</option>
                    <option value="Furniture">Furniture</option>
                    <option value="Housekeeping">Housekeeping</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Priority *</label>
                  <select
                    required
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-100 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Problem Details</label>
                <textarea
                  placeholder="Describe the issue (e.g. AC remote missing, bathroom flush leaking)..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-100 text-sm focus:outline-none focus:border-indigo-500 min-h-[80px]"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddTicket(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingTicket}
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold transition-colors disabled:opacity-50"
                >
                  {submittingTicket ? 'Filing...' : 'File Ticket & Block Room'}
                </button>
              </div>
            </form>
          )}

          {/* Tickets Log List */}
          <div className="space-y-4">
            {tickets.length === 0 ? (
              <div className="py-12 text-center rounded-3xl bg-[#0f172a] border border-slate-800/80 text-slate-500 text-sm italic">
                No maintenance tickets filed yet.
              </div>
            ) : (
              tickets.map((t) => {
                const isOpen = t.status === 'OPEN';
                const createdDate = new Date(t.openedAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit'
                });

                return (
                  <div
                    key={t.id}
                    className={`p-5 rounded-3xl bg-[#0f172a] border transition-all flex flex-col sm:flex-row justify-between sm:items-center gap-4 ${
                      isOpen ? 'border-rose-500/20' : 'border-slate-800/60'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border ${
                          isOpen 
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        }`}>
                          {t.status}
                        </span>
                        <span className="text-[10px] text-slate-500 font-bold">{t.ticketNo}</span>
                        <span className="text-[10px] text-slate-400 font-bold">• {t.issueType}</span>
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                          t.priority === 'CRITICAL' ? 'bg-rose-600/20 text-rose-300 border border-rose-500/30' :
                          t.priority === 'HIGH' ? 'bg-amber-600/20 text-amber-300 border border-amber-500/30' :
                          t.priority === 'MEDIUM' ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30' :
                          'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}>{t.priority}</span>
                      </div>
                      
                      <h4 className="text-base font-bold text-white">
                        Room {t.room?.roomNumber || 'Unknown'} — <span className="text-sm font-normal text-slate-400">{t.description || 'No description provided'}</span>
                      </h4>

                      <div className="flex items-center gap-4 text-[10px] text-slate-500">
                        <span className="flex items-center gap-1"><Clock size={10} /> Opened: {createdDate}</span>
                        {t.raisedBy && <span className="flex items-center gap-1"><User size={10} /> Raised by: {t.raisedBy}</span>}
                      </div>
                    </div>

                    {isOpen && (
                      <button
                        onClick={() => handleResolveTicket(t.id)}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition-all self-start sm:self-center flex items-center gap-1.5"
                      >
                        <Check size={14} /> Mark Resolved
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
