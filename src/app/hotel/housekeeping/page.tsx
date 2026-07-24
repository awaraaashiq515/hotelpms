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
  Check,
  ListTodo,
  ShieldAlert,
  UserPlus,
  CalendarDays,
  RefreshCw,
  X,
  Building2
} from 'lucide-react';
import { toast, Toaster } from 'sonner';
import Link from 'next/link';

export default function HousekeepingConsole() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'rooms' | 'tasks' | 'maintenance'>('rooms');
  
  // Filter & Search States
  const [filterRoomType, setFilterRoomType] = useState<string>('ALL'); // 'ALL' | 'DIRTY' | 'CLEAN' | 'OCCUPIED' | 'VACANT' | 'MAINTENANCE'
  const [roomSearch, setRoomSearch] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Housekeeping Task Form State
  const [showAddTask, setShowAddTask] = useState(false);
  const [submittingTask, setSubmittingTask] = useState(false);
  const [taskFormRoomId, setTaskFormRoomId] = useState('');
  const [taskFormType, setTaskFormType] = useState('Standard Cleaning');
  const [taskFormPriority, setTaskFormPriority] = useState('NORMAL');
  const [taskFormAssignedTo, setTaskFormAssignedTo] = useState('');
  const [taskFormScheduledAt, setTaskFormScheduledAt] = useState('');
  const [taskFormRemarks, setTaskFormRemarks] = useState('');

  // Maintenance Ticket Form State
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [issueType, setIssueType] = useState('Plumbing');
  const [priority, setPriority] = useState('MEDIUM');
  const [description, setDescription] = useState('');
  const [showAddTicket, setShowAddTicket] = useState(false);
  const [submittingTicket, setSubmittingTicket] = useState(false);

  const loadData = (isSilent = false) => {
    if (!isSilent) setLoading(true);
    Promise.all([
      fetch('/api/hotel/rooms').then((res) => res.json()),
      fetch('/api/hotel/maintenance').then((res) => res.json()),
      fetch('/api/hotel/housekeeping').then((res) => res.json()),
      fetch('/api/staff-members').then((res) => res.json()),
    ])
      .then(([roomsRes, ticketsRes, hkRes, staffRes]) => {
        if (roomsRes.success) setRooms(roomsRes.data);
        if (ticketsRes.success) setTickets(ticketsRes.data);
        if (hkRes.success) {
          setTasks(hkRes.data.tasks || []);
        }
        if (staffRes.success) {
          setStaff(staffRes.data || []);
        }
      })
      .catch((err) => {
        console.error('Error loading console data:', err);
        if (!isSilent) toast.error('Failed to load system data');
      })
      .finally(() => {
        if (!isSilent) setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
    // Real-time live background sync every 3 seconds
    const syncInterval = setInterval(() => {
      loadData(true);
    }, 3000);
    return () => clearInterval(syncInterval);
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
        toast.error(data.message || 'Failed to update room cleanliness');
      }
    } catch (err) {
      toast.error('Network error updating room status');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskFormRoomId) {
      toast.error('Please select a room');
      return;
    }
    if (!taskFormType) {
      toast.error('Please specify the task type');
      return;
    }

    setSubmittingTask(true);
    try {
      const res = await fetch('/api/hotel/housekeeping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: taskFormRoomId,
          taskType: taskFormType,
          priority: taskFormPriority,
          assignedTo: taskFormAssignedTo || null,
          scheduledAt: taskFormScheduledAt ? new Date(taskFormScheduledAt).toISOString() : null,
          remarks: taskFormRemarks || null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Housekeeping task created successfully');
        
        // Find room name to update locally if needed
        const roomObj = rooms.find(r => r.id === taskFormRoomId);
        const taskWithRoom = { 
          ...data.data, 
          room: roomObj ? { ...roomObj, roomType: { name: roomObj.roomType?.name } } : null 
        };
        
        setTasks([taskWithRoom, ...tasks]);
        
        // Reset form
        setTaskFormRoomId('');
        setTaskFormType('Standard Cleaning');
        setTaskFormPriority('NORMAL');
        setTaskFormAssignedTo('');
        setTaskFormScheduledAt('');
        setTaskFormRemarks('');
        setShowAddTask(false);
        loadData();
      } else {
        toast.error(data.message || 'Failed to create task');
      }
    } catch (err) {
      toast.error('Network error creating task');
    } finally {
      setSubmittingTask(false);
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, newStatus: string, roomId: string) => {
    try {
      const res = await fetch('/api/hotel/housekeeping', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: taskId,
          status: newStatus,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Task status updated to ${newStatus}`);
        
        // If task is completed, automatically mark the room as CLEAN
        if (newStatus === 'COMPLETED' || newStatus === 'DONE') {
          try {
            await fetch('/api/hotel/rooms', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id: roomId, housekeepingStatus: 'CLEAN' }),
            });
            toast.success('Room marked as Clean');
          } catch (err) {
            console.error('Failed to auto-mark room clean:', err);
          }
        }
        
        loadData();
      } else {
        toast.error(data.message || 'Failed to update task');
      }
    } catch (err) {
      toast.error('Network error updating task');
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
        toast.success('Maintenance ticket created. Room status set to Maintenance.');
        setTickets([data.data, ...tickets]);
        
        // Update room status local state to MAINTENANCE
        setRooms(rooms.map((r) => r.id === selectedRoomId ? { ...r, status: 'MAINTENANCE' } : r));
        
        // Reset form
        setSelectedRoomId('');
        setDescription('');
        setShowAddTicket(false);
        loadData();
      } else {
        toast.error(data.message || 'Failed to file maintenance ticket');
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
        toast.success('Ticket resolved. Room is back in active service.');
        setTickets(tickets.map((t) => t.id === ticketId ? { ...t, status: 'RESOLVED', resolvedAt: new Date().toISOString() } : t));
        loadData();
      } else {
        toast.error(data.message || 'Failed to update ticket status');
      }
    } catch (err) {
      toast.error('Network error updating ticket');
    }
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-indigo-500" size={36} />
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">Synchronizing Console...</span>
      </div>
    );
  }

  // Calculate Metrics
  const totalRoomsCount = rooms.length;
  const cleanRoomsCount = rooms.filter((r) => r.housekeepingStatus === 'CLEAN').length;
  const dirtyRoomsCount = rooms.filter((r) => r.housekeepingStatus === 'DIRTY').length;
  const openTicketsCount = tickets.filter((t) => t.status === 'OPEN').length;
  const activeTasksCount = tasks.filter((t) => t.status === 'PENDING' || t.status === 'IN_PROGRESS').length;

  // Filter rooms based on query and type filter
  const filteredRooms = rooms.filter((room) => {
    const matchesSearch = room.roomNumber.toLowerCase().includes(roomSearch.toLowerCase()) ||
      room.roomType?.name?.toLowerCase().includes(roomSearch.toLowerCase());
    
    if (!matchesSearch) return false;

    if (filterRoomType === 'DIRTY') return room.housekeepingStatus === 'DIRTY';
    if (filterRoomType === 'CLEAN') return room.housekeepingStatus === 'CLEAN';
    if (filterRoomType === 'OCCUPIED') return room.status === 'OCCUPIED';
    if (filterRoomType === 'VACANT') return room.status === 'VACANT' || (!room.status && room.status !== 'OCCUPIED' && room.status !== 'MAINTENANCE');
    if (filterRoomType === 'MAINTENANCE') return room.status === 'MAINTENANCE';
    return true;
  });

  const formatDate = (isoString: string | null) => {
    if (!isoString) return 'Unscheduled';
    const date = new Date(isoString);
    return date.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="space-y-8 pb-12">
      <Toaster position="top-right" richColors />

      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0f172a]/40 border border-slate-800/80 p-6 rounded-3xl backdrop-blur-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-indigo-400">
              <Sparkles size={12} className="text-violet-400 animate-pulse" /> HMS Operations Hub
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[9px] font-black uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              LIVE HOUSEKEEPER SYNC
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white leading-none">
            Housekeeping & Maintenance Console
          </h1>
          <p className="text-xs text-slate-500 font-bold">
            Real-time cleanliness monitoring, task assignments, and room engineering log.
          </p>
        </div>
        <div className="flex items-center gap-3 self-start md:self-center">
          <Link
            href="/hotel/lost-found"
            className="px-4 py-2.5 rounded-xl border border-amber-600/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-black text-xs transition-all flex items-center gap-2 shadow-lg shadow-amber-950/20"
          >
            📦 Lost & Found Register
          </Link>
          <button 
            onClick={() => loadData()}
            title="Refresh dashboard data"
            className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-all active:scale-95 cursor-pointer"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* Interactive Metrics Hub */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Card 1: Cleanliness */}
        <div 
          onClick={() => { setActiveTab('rooms'); setFilterRoomType('CLEAN'); }}
          className="group cursor-pointer rounded-3xl bg-[#0f172a] border border-slate-800/80 p-5 flex items-center gap-4 transition-all hover:border-emerald-500/40 hover:shadow-lg hover:shadow-emerald-950/10"
        >
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Clean Rooms</p>
            <h3 className="text-2xl font-black text-white mt-0.5">
              {cleanRoomsCount} <span className="text-xs text-slate-500">/ {totalRoomsCount}</span>
            </h3>
            <div className="w-24 bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1.5">
              <div 
                className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                style={{ width: `${totalRoomsCount > 0 ? (cleanRoomsCount / totalRoomsCount) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card 2: Dirty Rooms */}
        <div 
          onClick={() => { setActiveTab('rooms'); setFilterRoomType('DIRTY'); }}
          className="group cursor-pointer rounded-3xl bg-[#0f172a] border border-slate-800/80 p-5 flex items-center gap-4 transition-all hover:border-amber-500/40 hover:shadow-lg hover:shadow-amber-950/10"
        >
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
            <AlertTriangle size={24} />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Dirty Rooms</p>
            <h3 className="text-2xl font-black text-white mt-0.5">{dirtyRoomsCount}</h3>
            <span className="text-[10px] font-bold text-amber-400/90 block mt-1">Requires service</span>
          </div>
        </div>

        {/* Card 3: Pending Tasks */}
        <div 
          onClick={() => setActiveTab('tasks')}
          className="group cursor-pointer rounded-3xl bg-[#0f172a] border border-slate-800/80 p-5 flex items-center gap-4 transition-all hover:border-indigo-500/40 hover:shadow-lg hover:shadow-indigo-950/10"
        >
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
            <ClipboardCheck size={24} />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Active Cleaning Tasks</p>
            <h3 className="text-2xl font-black text-white mt-0.5">{activeTasksCount}</h3>
            <span className="text-[10px] font-bold text-indigo-400/90 block mt-1">Scheduled or in-progress</span>
          </div>
        </div>

        {/* Card 4: Open Maintenance */}
        <div 
          onClick={() => setActiveTab('maintenance')}
          className="group cursor-pointer rounded-3xl bg-[#0f172a] border border-slate-800/80 p-5 flex items-center gap-4 transition-all hover:border-rose-500/40 hover:shadow-lg hover:shadow-rose-950/10"
        >
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 group-hover:scale-110 transition-transform">
            <Wrench size={24} />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Maintenance Alerts</p>
            <h3 className="text-2xl font-black text-white mt-0.5 text-rose-400">{openTicketsCount}</h3>
            <span className="text-[10px] font-bold text-rose-400/90 block mt-1">Rooms blocked or locked</span>
          </div>
        </div>

      </div>

      {/* Tabs Layout */}
      <div className="flex gap-6 border-b border-slate-800">
        <button
          onClick={() => setActiveTab('rooms')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'rooms'
              ? 'border-indigo-500 text-indigo-400 font-black'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Building2 size={16} /> Room Status Board
        </button>
        <button
          onClick={() => setActiveTab('tasks')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'tasks'
              ? 'border-indigo-500 text-indigo-400 font-black'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <ListTodo size={16} /> Housekeeping Tasks ({tasks.filter(t => t.status === 'PENDING' || t.status === 'IN_PROGRESS').length} Active)
        </button>
        <button
          onClick={() => setActiveTab('maintenance')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'maintenance'
              ? 'border-indigo-500 text-indigo-400 font-black'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Wrench size={16} /> Maintenance Control Log ({openTicketsCount} Open)
        </button>
      </div>

      {/* ────────────────── PANEL 1: ROOMS LIST ────────────────── */}
      {activeTab === 'rooms' && (
        <div className="space-y-6">
          {/* Quick Filters & Room Search */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              {[
                { label: 'All Rooms', val: 'ALL', count: totalRoomsCount, activeStyle: 'bg-indigo-600 border-indigo-500 text-white' },
                { label: 'Dirty', val: 'DIRTY', count: dirtyRoomsCount, activeStyle: 'bg-amber-500/20 border-amber-500/30 text-amber-400' },
                { label: 'Clean', val: 'CLEAN', count: cleanRoomsCount, activeStyle: 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' },
                { label: 'Occupied', val: 'OCCUPIED', count: rooms.filter(r => r.status === 'OCCUPIED').length, activeStyle: 'bg-rose-500/20 border-rose-500/30 text-rose-400' },
                { label: 'Vacant', val: 'VACANT', count: rooms.filter(r => r.status === 'VACANT' || (!r.status && r.status !== 'OCCUPIED' && r.status !== 'MAINTENANCE')).length, activeStyle: 'bg-sky-500/20 border-sky-500/30 text-sky-400' },
                { label: 'Blocked', val: 'MAINTENANCE', count: rooms.filter(r => r.status === 'MAINTENANCE').length, activeStyle: 'bg-slate-700/30 border-slate-700/50 text-slate-300' }
              ].map((btn) => (
                <button
                  key={btn.val}
                  onClick={() => setFilterRoomType(btn.val)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                    filterRoomType === btn.val
                      ? btn.activeStyle
                      : 'bg-slate-900 border-slate-800/80 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {btn.label} ({btn.count})
                </button>
              ))}
            </div>

            <div className="w-full md:max-w-xs">
              <input
                type="text"
                placeholder="Search rooms by number or type..."
                value={roomSearch}
                onChange={(e) => setRoomSearch(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-800 bg-slate-900 text-slate-100 text-xs focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          {/* Rooms Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredRooms.length === 0 ? (
              <div className="col-span-full py-16 text-center rounded-3xl bg-[#0f172a] border border-slate-800/80 text-slate-500 text-sm italic">
                No rooms match the selected filter. ✨
              </div>
            ) : (
              filteredRooms.map((room) => {
                const isDirty = room.housekeepingStatus === 'DIRTY';
                const isOccupied = room.status === 'OCCUPIED';
                const isMaintenance = room.status === 'MAINTENANCE';

                return (
                  <div
                    key={room.id}
                    className={`rounded-3xl bg-[#0f172a] border p-5 flex flex-col justify-between gap-5 transition-all hover:scale-[1.01] ${
                      isDirty ? 'border-amber-500/25 bg-amber-500/[0.01]' : 'border-slate-800'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-black text-white">Room {room.roomNumber}</h3>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                          {room.roomType?.name || 'Standard'}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 font-sans">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                          isOccupied 
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' 
                            : isMaintenance
                            ? 'bg-slate-800 text-slate-400 border-slate-700'
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        }`}>
                          {isOccupied ? 'Occupied' : isMaintenance ? 'Maintenance' : 'Vacant'}
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

                    <div className="space-y-2 mt-2">
                      <button
                        disabled={updatingId === room.id}
                        onClick={() => handleUpdateHousekeeping(room.id, room.housekeepingStatus)}
                        className={`w-full py-2.5 rounded-xl text-xs font-black uppercase tracking-wide border flex items-center justify-center gap-1.5 transition-colors ${
                          isDirty
                            ? 'bg-emerald-600 hover:bg-emerald-500 border-emerald-600 text-white shadow-lg shadow-emerald-600/10 cursor-pointer'
                            : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-400 hover:text-slate-200 cursor-pointer'
                        }`}
                      >
                        {updatingId === room.id ? (
                          <Loader2 className="animate-spin" size={12} />
                        ) : isDirty ? (
                          <>
                            <CheckCircle2 size={12} /> Mark Clean
                          </>
                        ) : (
                          <>
                            <AlertTriangle size={12} /> Mark Dirty
                          </>
                        )}
                      </button>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => {
                            setTaskFormRoomId(room.id);
                            setActiveTab('tasks');
                            setShowAddTask(true);
                          }}
                          className="py-2 rounded-xl text-[10px] font-black uppercase tracking-wider border border-slate-800 hover:border-slate-700 bg-slate-900/60 hover:bg-slate-900 text-slate-400 hover:text-slate-200 flex items-center justify-center gap-1 transition-colors cursor-pointer"
                        >
                          <Plus size={10} /> Schedule Task
                        </button>
                        <button
                          onClick={() => {
                            setSelectedRoomId(room.id);
                            setActiveTab('maintenance');
                            setShowAddTicket(true);
                          }}
                          className="py-2 rounded-xl text-[10px] font-black uppercase tracking-wider border border-slate-800 hover:border-slate-700 bg-slate-900/60 hover:bg-slate-900 text-slate-400 hover:text-slate-200 flex items-center justify-center gap-1 transition-colors cursor-pointer"
                        >
                          <Wrench size={10} /> Report Fix
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ────────────────── PANEL 2: HOUSEKEEPING TASKS ────────────────── */}
      {activeTab === 'tasks' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="space-y-0.5">
              <h2 className="text-xl font-black text-white">Housekeeping Tasks</h2>
              <p className="text-xs text-slate-500">Assign cleaning, deep cleaning, or turn-down services to hotel staff.</p>
            </div>
            <button
              onClick={() => setShowAddTask(!showAddTask)}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              {showAddTask ? <X size={14} /> : <Plus size={14} />} 
              {showAddTask ? 'Close Form' : 'Schedule New Task'}
            </button>
          </div>

          {/* Add Housekeeping Task Form */}
          {showAddTask && (
            <form onSubmit={handleCreateTask} className="p-6 rounded-3xl bg-[#0f172a] border border-slate-800 space-y-4 max-w-2xl animate-in fade-in zoom-in duration-200">
              <h3 className="text-xs font-black uppercase tracking-widest text-indigo-400 flex items-center gap-1.5">
                <UserPlus size={12} /> Schedule New Work Order
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Select Room *</label>
                  <select
                    required
                    value={taskFormRoomId}
                    onChange={(e) => setTaskFormRoomId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-100 text-xs focus:outline-none focus:border-indigo-500 transition-colors animate-none"
                  >
                    <option value="">Select Room</option>
                    {rooms.map((r) => (
                      <option key={r.id} value={r.id}>
                        Room {r.roomNumber} ({r.roomType?.name || 'Standard'}) - {r.housekeepingStatus}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Task Type *</label>
                  <select
                    required
                    value={taskFormType}
                    onChange={(e) => setTaskFormType(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-100 text-xs focus:outline-none focus:border-indigo-500 transition-colors animate-none"
                  >
                    <option value="Standard Cleaning">Standard Cleaning</option>
                    <option value="Deep Cleaning">Deep Cleaning</option>
                    <option value="Room Inspection">Room Inspection</option>
                    <option value="Linen & Laundry">Linen & Laundry Change</option>
                    <option value="Turn Down Service">Turn Down Service</option>
                    <option value="Restock Amenities">Restock Amenities</option>
                    <option value="Room Repairs">Room Repairs</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Priority</label>
                  <select
                    value={taskFormPriority}
                    onChange={(e) => setTaskFormPriority(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-100 text-xs focus:outline-none focus:border-indigo-500 transition-colors animate-none"
                  >
                    <option value="LOW">Low</option>
                    <option value="NORMAL">Normal</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Assign Staff Member</label>
                  <select
                    value={taskFormAssignedTo}
                    onChange={(e) => setTaskFormAssignedTo(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-100 text-xs focus:outline-none focus:border-indigo-500 transition-colors animate-none"
                  >
                    <option value="">Unassigned (Open Pool)</option>
                    {staff.map((member) => (
                      <option key={member.id} value={member.name}>
                        {member.name} ({member.designation || 'Staff'})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Scheduled At</label>
                  <input
                    type="datetime-local"
                    value={taskFormScheduledAt}
                    onChange={(e) => setTaskFormScheduledAt(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-100 text-xs focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Task Remarks / Special Instructions</label>
                <textarea
                  placeholder="e.g. Guest requested extra pillows, pay special attention to the balcony, double sheets required..."
                  value={taskFormRemarks}
                  onChange={(e) => setTaskFormRemarks(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-100 text-xs focus:outline-none focus:border-indigo-500 min-h-[80px]"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddTask(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingTask}
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-500 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {submittingTask ? 'Creating...' : 'Schedule Task'}
                </button>
              </div>
            </form>
          )}

          {/* Active tasks list */}
          <div className="space-y-4">
            {tasks.length === 0 ? (
              <div className="py-16 text-center rounded-3xl bg-[#0f172a] border border-slate-800/80 text-slate-500 text-sm italic">
                No housekeeping tasks scheduled.
              </div>
            ) : (
              tasks.map((task) => {
                const isPending = task.status === 'PENDING';
                const isInProgress = task.status === 'IN_PROGRESS';
                const isCompleted = task.status === 'COMPLETED' || task.status === 'DONE';

                return (
                  <div
                    key={task.id}
                    className={`p-5 rounded-3xl bg-[#0f172a] border transition-all flex flex-col md:flex-row justify-between md:items-center gap-4 ${
                      isCompleted ? 'border-slate-800/60 opacity-70' : 
                      isInProgress ? 'border-indigo-500/20 shadow-md shadow-indigo-950/5' : 
                      'border-slate-800'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border ${
                          isCompleted
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : isInProgress
                            ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20 animate-pulse'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}>
                          {task.status}
                        </span>
                        
                        <span className="text-[10px] text-slate-400 font-bold">• {task.taskType}</span>
                        
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${
                          task.priority === 'URGENT' ? 'bg-rose-600/20 text-rose-300 border-rose-500/30' :
                          task.priority === 'HIGH' ? 'bg-amber-600/20 text-amber-300 border-amber-500/30' :
                          task.priority === 'NORMAL' ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/30' :
                          'bg-slate-800 text-slate-400 border-slate-700'
                        }`}>{task.priority}</span>
                      </div>
                      
                      <h4 className="text-base font-bold text-white">
                        Room {task.room?.roomNumber || 'Unknown'} —{' '}
                        <span className="text-sm font-normal text-slate-400">
                          {task.remarks || 'No instructions provided'}
                        </span>
                      </h4>

                      <div className="flex flex-wrap items-center gap-x-6 gap-y-1.5 text-[10px] text-slate-500">
                        <span className="flex items-center gap-1 shrink-0">
                          <CalendarDays size={10} /> Scheduled: {formatDate(task.scheduledAt)}
                        </span>
                        {task.assignedTo ? (
                          <span className="flex items-center gap-1 shrink-0 text-slate-400">
                            <User size={10} /> Assigned to: <strong className="text-indigo-400 font-semibold">{task.assignedTo}</strong>
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 shrink-0 text-amber-500/80 italic">
                            <User size={10} /> Unassigned (Open Pool)
                          </span>
                        )}
                        {task.completedAt && (
                          <span className="flex items-center gap-1 shrink-0 text-emerald-500/80">
                            <CheckCircle2 size={10} /> Completed at: {formatDate(task.completedAt)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start md:self-center shrink-0">
                      {isPending && (
                        <button
                          onClick={() => handleUpdateTaskStatus(task.id, 'IN_PROGRESS', task.roomId)}
                          className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <Activity size={12} /> Start Task
                        </button>
                      )}
                      
                      {isInProgress && (
                        <button
                          onClick={() => handleUpdateTaskStatus(task.id, 'COMPLETED', task.roomId)}
                          className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <Check size={12} /> Complete Task
                        </button>
                      )}

                      {isCompleted && (
                        <span className="text-slate-600 text-xs font-black uppercase flex items-center gap-1">
                          <CheckCircle2 size={14} className="text-emerald-500" /> Done
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ────────────────── PANEL 3: MAINTENANCE TICKETS ────────────────── */}
      {activeTab === 'maintenance' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="space-y-0.5">
              <h2 className="text-xl font-bold text-white">Maintenance & Repair Tickets</h2>
              <p className="text-xs text-slate-500">Lock rooms for plumbing, electrical, heating or furniture issues.</p>
            </div>
            <button
              onClick={() => setShowAddTicket(!showAddTicket)}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              {showAddTicket ? <X size={14} /> : <Plus size={14} />} 
              {showAddTicket ? 'Close Form' : 'File Issue Ticket'}
            </button>
          </div>

          {/* Add Ticket Form */}
          {showAddTicket && (
            <form onSubmit={handleCreateTicket} className="p-6 rounded-3xl bg-[#0f172a] border border-slate-800 space-y-4 max-w-xl animate-in fade-in zoom-in duration-200">
              <h3 className="text-xs font-black uppercase tracking-widest text-rose-400 flex items-center gap-1.5">
                <ShieldAlert size={12} /> File Room Issue Ticket
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Select Room *</label>
                  <select
                    required
                    value={selectedRoomId}
                    onChange={(e) => setSelectedRoomId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-100 text-xs focus:outline-none focus:border-indigo-500 transition-colors animate-none"
                  >
                    <option value="">Select Room</option>
                    {rooms.map((r) => (
                      <option key={r.id} value={r.id}>Room {r.roomNumber} ({r.roomType?.code || 'RM'})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Issue Type *</label>
                  <select
                    required
                    value={issueType}
                    onChange={(e) => setIssueType(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-100 text-xs focus:outline-none focus:border-indigo-500 transition-colors animate-none"
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
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Priority *</label>
                  <select
                    required
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-100 text-xs focus:outline-none focus:border-indigo-500 transition-colors animate-none"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Problem Details</label>
                <textarea
                  placeholder="Describe the issue (e.g. AC remote missing, bathroom flush leaking, floor tiles broken)..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-100 text-xs focus:outline-none focus:border-indigo-500 min-h-[80px]"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddTicket(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingTicket}
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-500 transition-colors disabled:opacity-50 cursor-pointer"
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
                      isOpen ? 'border-rose-500/25 bg-rose-500/[0.01]' : 'border-slate-800/60 opacity-70'
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
                        Room {t.room?.roomNumber || 'Unknown'} —{' '}
                        <span className="text-sm font-normal text-slate-400">
                          {t.description || 'No description provided'}
                        </span>
                      </h4>

                      <div className="flex items-center gap-4 text-[10px] text-slate-500">
                        <span className="flex items-center gap-1"><Clock size={10} /> Opened: {createdDate}</span>
                        {t.raisedBy && <span className="flex items-center gap-1"><User size={10} /> Raised by: {t.raisedBy}</span>}
                      </div>
                    </div>

                    {isOpen && (
                      <button
                        onClick={() => handleResolveTicket(t.id)}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition-all self-start sm:self-center flex items-center gap-1.5 cursor-pointer"
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
