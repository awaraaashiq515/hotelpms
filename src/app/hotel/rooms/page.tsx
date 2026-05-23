'use client';

import React, { useState, useEffect } from 'react';
import { 
  Bed, 
  Sparkles, 
  Loader2, 
  CheckCircle2, 
  AlertTriangle, 
  Wrench, 
  Plus, 
  Trash2,
  ListFilter
} from 'lucide-react';
import { toast, Toaster } from 'sonner';

export default function HotelRooms() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [roomTypes, setRoomTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFloor, setActiveFloor] = useState<string>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'rooms' | 'types'>('rooms');

  // New Room form state
  const [newRoomNumber, setNewRoomNumber] = useState('');
  const [newRoomTypeId, setNewRoomTypeId] = useState('');
  const [newRoomFloor, setNewRoomFloor] = useState('1');
  const [showAddRoom, setShowAddRoom] = useState(false);

  // New Room Type form state
  const [newTypeName, setNewTypeName] = useState('');
  const [newTypeCode, setNewTypeCode] = useState('');
  const [newTypeRate, setNewTypeRate] = useState('');
  const [newTypeOccupancy, setNewTypeOccupancy] = useState('2');
  const [showAddType, setShowAddType] = useState(false);

  // Load rooms and room types
  const loadData = () => {
    setLoading(true);
    Promise.all([
      fetch('/api/hotel/rooms').then((res) => res.json()),
      fetch('/api/hotel/room-types').then((res) => res.json()),
    ])
      .then(([roomsRes, typesRes]) => {
        if (roomsRes.success) setRooms(roomsRes.data);
        if (typesRes.success) setRoomTypes(typesRes.data);
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

  const handleUpdateStatus = async (roomId: string, updates: { status?: string; housekeepingStatus?: string }) => {
    setUpdatingId(roomId);
    try {
      const res = await fetch('/api/hotel/rooms', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: roomId, ...updates }),
      });
      const data = await res.json();
      if (data.success) {
        setRooms(rooms.map((r) => (r.id === roomId ? data.data : r)));
        toast.success(data.message || 'Room updated successfully');
      } else {
        toast.error(data.message || 'Update failed');
      }
    } catch (err) {
      toast.error('Connection error updating room');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomNumber || !newRoomTypeId) {
      toast.error('Please enter Room Number and select Room Type');
      return;
    }

    try {
      const res = await fetch('/api/hotel/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomNumber: newRoomNumber,
          roomTypeId: newRoomTypeId,
          floor: newRoomFloor,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setRooms([...rooms, data.data].sort((a, b) => a.roomNumber.localeCompare(b.roomNumber)));
        setNewRoomNumber('');
        setShowAddRoom(false);
        toast.success('Room created successfully');
      } else {
        toast.error(data.message || 'Failed to create room');
      }
    } catch (err) {
      toast.error('Error creating room');
    }
  };

  const handleCreateRoomType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTypeName || !newTypeCode || !newTypeRate) {
      toast.error('Please enter Name, Code, and Base Rate');
      return;
    }

    try {
      const res = await fetch('/api/hotel/room-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newTypeName,
          code: newTypeCode.toUpperCase().trim(),
          baseRate: Number(newTypeRate),
          maxOccupancy: Number(newTypeOccupancy),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setRoomTypes([...roomTypes, data.data].sort((a, b) => a.name.localeCompare(b.name)));
        setNewTypeName('');
        setNewTypeCode('');
        setNewTypeRate('');
        setNewTypeOccupancy('2');
        setShowAddType(false);
        toast.success('Room Category created successfully');
      } else {
        toast.error(data.message || 'Failed to create room category');
      }
    } catch (err) {
      toast.error('Error creating room category');
    }
  };

  const handleDeleteRoomType = async (typeId: string) => {
    if (!confirm('Are you sure you want to delete this room category?')) return;

    try {
      const res = await fetch(`/api/hotel/room-types?id=${typeId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setRoomTypes(roomTypes.filter((t) => t.id !== typeId));
        toast.success('Room Category deleted successfully');
      } else {
        toast.error(data.message || 'Failed to delete room category');
      }
    } catch (err) {
      toast.error('Error deleting room category');
    }
  };

  const handleDeleteRoom = async (roomId: string) => {
    if (!confirm('Are you sure you want to delete this room?')) return;

    try {
      const res = await fetch(`/api/hotel/rooms?id=${roomId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setRooms(rooms.filter((r) => r.id !== roomId));
        toast.success('Room deleted successfully');
      } else {
        toast.error(data.message || 'Failed to delete room');
      }
    } catch (err) {
      toast.error('Error deleting room');
    }
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-indigo-500" size={32} />
      </div>
    );
  }

  // Get unique floors
  const floors = ['all', ...Array.from(new Set(rooms.map((r) => r.floor || '1'))).sort()];
  
  // Filtered Rooms
  const filteredRooms = activeFloor === 'all' 
    ? rooms 
    : rooms.filter((r) => r.floor === activeFloor);

  return (
    <div className="space-y-8 pb-12">
      <Toaster position="top-right" richColors />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-indigo-400">
            <Sparkles size={12} /> Live Inventory
          </span>
          <h1 className="text-2xl md:text-3xl font-black text-white leading-none">
            Rooms & Categories Panel
          </h1>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-slate-800">
        <button
          onClick={() => setActiveTab('rooms')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all ${
            activeTab === 'rooms'
              ? 'border-indigo-500 text-indigo-400 font-black'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Rooms List ({rooms.length})
        </button>
        <button
          onClick={() => setActiveTab('types')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all ${
            activeTab === 'types'
              ? 'border-indigo-500 text-indigo-400 font-black'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Room Categories ({roomTypes.length})
        </button>
      </div>

      {/* Rooms Tab */}
      {activeTab === 'rooms' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-white">Physical Rooms</h2>
            <button
              onClick={() => setShowAddRoom(!showAddRoom)}
              className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 self-start"
            >
              <Plus size={16} /> Add Physical Room
            </button>
          </div>

          {/* Quick Add Room Modal/Form */}
          {showAddRoom && (
            <form onSubmit={handleCreateRoom} className="p-6 rounded-3xl bg-[#0f172a] border border-slate-800 space-y-4 max-w-xl animate-in fade-in zoom-in duration-200">
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-300">Add New Room</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Room Number</label>
                  <input
                    type="text"
                    required
                    value={newRoomNumber}
                    onChange={(e) => setNewRoomNumber(e.target.value)}
                    placeholder="e.g. 104"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-100 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Room Type</label>
                  <select
                    required
                    value={newRoomTypeId}
                    onChange={(e) => setNewRoomTypeId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-100 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  >
                    <option value="">Select Type</option>
                    {roomTypes.map((t) => (
                      <option key={t.id} value={t.id}>{t.name} ({t.code})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Floor</label>
                  <input
                    type="text"
                    required
                    value={newRoomFloor}
                    onChange={(e) => setNewRoomFloor(e.target.value)}
                    placeholder="e.g. 1"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-100 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddRoom(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold transition-colors"
                >
                  Save Room
                </button>
              </div>
            </form>
          )}

          {/* Floor Filter Tray */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800/80">
            <ListFilter size={16} className="text-slate-500 shrink-0" />
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider shrink-0 mr-2">Filter Floors:</span>
            {floors.map((floor) => (
              <button
                key={floor}
                onClick={() => setActiveFloor(floor)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold capitalize transition-all border shrink-0 ${
                  activeFloor === floor
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                    : 'border-slate-800 hover:border-slate-700 bg-slate-900 text-slate-400 hover:text-slate-200'
                }`}
              >
                {floor === 'all' ? 'All Floors' : `Floor ${floor}`}
              </button>
            ))}
          </div>

          {/* Room Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {filteredRooms.map((room) => {
              const isOccupied = room.status === 'OCCUPIED';
              const isMaintenance = room.status === 'MAINTENANCE';
              const isDirty = room.housekeepingStatus === 'DIRTY';

              // Determine Card styling
              let borderClass = 'border-slate-800';
              let statusLabel = 'Vacant';
              let badgeColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';

              if (isOccupied) {
                borderClass = 'border-rose-500/30';
                statusLabel = 'Occupied';
                badgeColor = 'bg-rose-500/10 text-rose-400 border-rose-500/20';
              } else if (isMaintenance) {
                borderClass = 'border-slate-700';
                statusLabel = 'Blocked';
                badgeColor = 'bg-slate-700 text-slate-400 border-slate-600';
              }

              return (
                <div
                  key={room.id}
                  className={`relative rounded-3xl bg-[#0f172a] border ${borderClass} p-5 space-y-4 hover:shadow-xl hover:shadow-indigo-500/[0.02] transition-all`}
                >
                  {/* Room ID / Code */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-black text-white">Room {room.roomNumber}</h3>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{room.roomType?.name}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${badgeColor}`}>
                        {statusLabel}
                      </span>
                      {!isOccupied && (
                        <button
                          onClick={() => handleDeleteRoom(room.id)}
                          className="p-1 rounded-md text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title="Delete Room"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Status Pills */}
                  <div className="space-y-2">
                    {/* Housekeeping Pill */}
                    <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/80 border border-slate-800/40">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Housekeeping</span>
                      <button
                        disabled={updatingId === room.id}
                        onClick={() => handleUpdateStatus(room.id, { housekeepingStatus: isDirty ? 'CLEAN' : 'DIRTY' })}
                        className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider transition-colors ${
                          isDirty 
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20' 
                            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                        }`}
                      >
                        {isDirty ? (
                          <>
                            <AlertTriangle size={8} /> Dirty
                          </>
                        ) : (
                          <>
                            <CheckCircle2 size={8} /> Clean
                          </>
                        )}
                      </button>
                    </div>

                    {/* Maintenance Toggle */}
                    <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/80 border border-slate-800/40">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Maintenance</span>
                      <button
                        disabled={updatingId === room.id || isOccupied}
                        onClick={() => handleUpdateStatus(room.id, { status: isMaintenance ? 'AVAILABLE' : 'MAINTENANCE' })}
                        className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider transition-colors ${
                          isMaintenance
                            ? 'bg-rose-500/15 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20'
                            : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-slate-200'
                        }`}
                        title={isOccupied ? 'Cannot block occupied room' : ''}
                      >
                        <Wrench size={8} /> {isMaintenance ? 'Blocked' : 'Service'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Room Categories (Types) Tab */}
      {activeTab === 'types' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-white">Room Categories</h2>
            <button
              onClick={() => setShowAddType(!showAddType)}
              className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2"
            >
              <Plus size={16} /> Add Category
            </button>
          </div>

          {/* Add Category Form */}
          {showAddType && (
            <form onSubmit={handleCreateRoomType} className="p-6 rounded-3xl bg-[#0f172a] border border-slate-800 space-y-4 max-w-xl animate-in fade-in zoom-in duration-200">
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-300">Add New Room Category</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Category Name</label>
                  <input
                    type="text"
                    required
                    value={newTypeName}
                    onChange={(e) => setNewTypeName(e.target.value)}
                    placeholder="e.g. Executive Suite"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-100 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Category Code</label>
                  <input
                    type="text"
                    required
                    value={newTypeCode}
                    onChange={(e) => setNewTypeCode(e.target.value)}
                    placeholder="e.g. EXEC"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-100 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Base Rate (per night)</label>
                  <input
                    type="number"
                    required
                    value={newTypeRate}
                    onChange={(e) => setNewTypeRate(e.target.value)}
                    placeholder="e.g. 6000"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-100 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Max Occupancy</label>
                  <select
                    value={newTypeOccupancy}
                    onChange={(e) => setNewTypeOccupancy(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-100 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  >
                    <option value="1">1 Person</option>
                    <option value="2">2 People</option>
                    <option value="3">3 People</option>
                    <option value="4">4 People</option>
                    <option value="5">5 People</option>
                    <option value="6">6 People</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddType(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold transition-colors"
                >
                  Save Category
                </button>
              </div>
            </form>
          )}

          {/* Categories Table */}
          <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-[#0f172a]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800/80 bg-slate-900/40 text-slate-400 text-xs font-bold uppercase tracking-wider">
                  <th className="p-4 pl-6">Category Name</th>
                  <th className="p-4">Code</th>
                  <th className="p-4">Max Occupancy</th>
                  <th className="p-4">Base Rate</th>
                  <th className="p-4">Total Rooms</th>
                  <th className="p-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-sm">
                {roomTypes.map((type) => {
                  const roomsAssigned = rooms.filter((r) => r.roomTypeId === type.id).length;
                  return (
                    <tr key={type.id} className="hover:bg-slate-900/30 transition-colors text-slate-300">
                      <td className="p-4 pl-6 font-bold text-white">{type.name}</td>
                      <td className="p-4 font-mono text-xs">{type.code}</td>
                      <td className="p-4">{type.maxOccupancy} {type.maxOccupancy > 1 ? 'Guests' : 'Guest'}</td>
                      <td className="p-4 font-bold text-indigo-400">₹{type.baseRate}</td>
                      <td className="p-4">
                        <span className="px-2.5 py-0.5 rounded-full text-xs bg-slate-800 text-slate-300 font-bold border border-slate-700/50">
                          {roomsAssigned} {roomsAssigned === 1 ? 'room' : 'rooms'}
                        </span>
                      </td>
                      <td className="p-4 pr-6 text-right">
                        {roomsAssigned === 0 ? (
                          <button
                            onClick={() => handleDeleteRoomType(type.id)}
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 transition-colors border border-rose-500/20"
                            title="Delete Category"
                          >
                            <Trash2 size={14} />
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-md">In Use</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
