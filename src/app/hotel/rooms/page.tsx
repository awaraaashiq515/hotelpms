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
  Pencil,
  ListFilter,
  UserCheck,
  Coins,
  Wifi,
  Tv,
  Coffee,
  Wind,
  Compass,
  Star,
  Tag
} from 'lucide-react';
import { toast, Toaster } from 'sonner';
import RoomAddModal from '@/components/hotel/RoomAddModal';
import CategoryAddModal from '@/components/hotel/CategoryAddModal';

export default function HotelRooms() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [roomTypes, setRoomTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFloor, setActiveFloor] = useState<string>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'rooms' | 'types'>('rooms');

  // Modal display states
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [showAddType, setShowAddType] = useState(false);
  const [editingRoom, setEditingRoom] = useState<any | null>(null);

  // Load rooms and room types
  const loadData = (isSilent = false) => {
    if (!isSilent) setLoading(true);
    Promise.all([
      fetch('/api/hotel/rooms').then((res) => res.json()),
      fetch('/api/hotel/room-types').then((res) => res.json()),
    ])
      .then(([roomsRes, typesRes]) => {
        if (roomsRes.success) setRooms(roomsRes.data);
        if (typesRes.success) setRoomTypes(typesRes.data);
      })
      .catch((err) => {
        console.error('Error loading data:', err);
      })
      .finally(() => {
        if (!isSilent) setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      loadData(true);
    }, 3000);
    return () => clearInterval(interval);
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

  const handleCreateRoomSubmit = async (payload: any) => {
    const isEdit = !!payload.id;
    try {
      const res = await fetch('/api/hotel/rooms', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        if (isEdit) {
          setRooms(rooms.map((r) => (r.id === payload.id ? data.data : r)));
          toast.success('Room updated successfully');
        } else {
          setRooms([...rooms, data.data].sort((a, b) => a.roomNumber.localeCompare(b.roomNumber)));
          toast.success('Room created successfully');
        }
        setShowAddRoom(false);
        setEditingRoom(null);
      } else {
        toast.error(data.message || `Failed to ${isEdit ? 'update' : 'create'} room`);
      }
    } catch (err) {
      toast.error(`Error ${isEdit ? 'updating' : 'creating'} room`);
    }
  };

  const handleCreateRoomTypeSubmit = async (payload: any) => {
    try {
      const res = await fetch('/api/hotel/room-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setRoomTypes([...roomTypes, data.data].sort((a, b) => a.name.localeCompare(b.name)));
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

  // Dynamic statistics
  const totalRooms = rooms.length;
  const occupiedRooms = rooms.filter(r => r.status === 'OCCUPIED').length;
  const vacantCleanRooms = rooms.filter(r => r.status === 'AVAILABLE' && r.housekeepingStatus === 'CLEAN').length;
  const vacantDirtyRooms = rooms.filter(r => r.status === 'AVAILABLE' && r.housekeepingStatus === 'DIRTY').length;
  const maintenanceRooms = rooms.filter(r => r.status === 'MAINTENANCE').length;

  const getFloorRoomCount = (floor: string) => {
    if (floor === 'all') return rooms.length;
    return rooms.filter(r => r.floor === floor).length;
  };

  // Helper to render amenities icon list
  const renderAmenitiesIcons = (amenitiesString: string) => {
    if (!amenitiesString) return null;
    const items = amenitiesString.split(',').map(i => i.trim());
    return (
      <div className="flex items-center gap-1.5 text-slate-500">
        {items.includes('Free WiFi') && <Wifi size={11} className="text-slate-400" />}
        {items.includes('Air Conditioning') && <Wind size={11} className="text-slate-400" />}
        {items.includes('Smart TV') && <Tv size={11} className="text-slate-400" />}
        {items.includes('Mini Bar') && <Coffee size={11} className="text-slate-400" />}
        {items.includes('Balcony') && <Compass size={11} className="text-slate-400" />}
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-12">
      <Toaster position="top-right" richColors />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div className="space-y-1">
          <span className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-indigo-400">
            <Sparkles size={12} /> Live Inventory
          </span>
          <h1 className="text-2xl md:text-3xl font-black text-white leading-none">
            Rooms & Categories Panel
          </h1>
        </div>

        {/* Tab Controls */}
        <div className="flex bg-slate-950 p-1.5 rounded-2xl border border-slate-800/80 self-start">
          <button
            onClick={() => setActiveTab('rooms')}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 ${
              activeTab === 'rooms' 
                ? 'bg-indigo-600 text-white shadow-md' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bed size={14} /> Rooms Grid ({rooms.length})
          </button>
          <button
            onClick={() => setActiveTab('types')}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 ${
              activeTab === 'types' 
                ? 'bg-indigo-600 text-white shadow-md' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Coins size={14} /> Categories & Rates ({roomTypes.length})
          </button>
        </div>
      </div>

      {/* Real-time Dynamic Metrics Strips */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* Metric 1 */}
        <div className="p-4 rounded-2xl bg-[#0f172a]/30 border border-slate-800/50 flex items-center gap-4">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 shrink-0">
            <Bed size={16} />
          </div>
          <div>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Total Rooms</p>
            <h4 className="text-lg font-black text-white">{totalRooms}</h4>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="p-4 rounded-2xl bg-[#0f172a]/30 border border-slate-800/50 flex items-center gap-4">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
            <CheckCircle2 size={16} />
          </div>
          <div>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Vacant & Ready</p>
            <h4 className="text-lg font-black text-white">{vacantCleanRooms}</h4>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="p-4 rounded-2xl bg-[#0f172a]/30 border border-slate-800/50 flex items-center gap-4">
          <div className="w-9 h-9 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-400 shrink-0">
            <UserCheck size={16} />
          </div>
          <div>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Occupied</p>
            <h4 className="text-lg font-black text-white">{occupiedRooms}</h4>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="p-4 rounded-2xl bg-[#0f172a]/30 border border-slate-800/50 flex items-center gap-4">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 shrink-0">
            <AlertTriangle size={16} />
          </div>
          <div>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Dirty</p>
            <h4 className="text-lg font-black text-white">{vacantDirtyRooms}</h4>
          </div>
        </div>

        {/* Metric 5 */}
        <div className="p-4 rounded-2xl bg-[#0f172a]/30 border border-slate-800/50 flex items-center gap-4 col-span-2 lg:col-span-1">
          <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 shrink-0">
            <Wrench size={16} />
          </div>
          <div>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Blocked</p>
            <h4 className="text-lg font-black text-white">{maintenanceRooms}</h4>
          </div>
        </div>
      </div>

      {/* Rooms Tab View */}
      {activeTab === 'rooms' && (
        showAddRoom ? (
          <RoomAddModal 
            roomTypes={roomTypes} 
            initialRoom={editingRoom}
            onClose={() => { setShowAddRoom(false); setEditingRoom(null); }} 
            onSave={handleCreateRoomSubmit} 
          />
        ) : (
          <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            {/* Floor Filter Tray */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800/80 w-full sm:w-auto">
              <ListFilter size={14} className="text-slate-500 shrink-0" />
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider shrink-0 mr-2">Floor:</span>
              {floors.map((floor) => (
                <button
                  key={floor}
                  onClick={() => setActiveFloor(floor)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 border ${
                    activeFloor === floor
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
                      : 'border-slate-800 hover:border-slate-700 bg-slate-900/60 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {floor === 'all' ? 'All Floors' : `Floor ${floor}`} <span className="text-[10px] opacity-60 font-semibold">({getFloorRoomCount(floor)})</span>
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowAddRoom(true)}
              className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 shrink-0"
            >
              <Plus size={14} /> Add Physical Room
            </button>
          </div>

          {/* Room Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredRooms.map((room) => {
              const isOccupied = room.status === 'OCCUPIED';
              const isMaintenance = room.status === 'MAINTENANCE';
              const isDirty = room.housekeepingStatus === 'DIRTY';

              // Detailed visual configurations based on room states
              let badgeText = 'Clean';
              let badgeColor = 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
              let cardBg = 'bg-[#0f172a]/30';

              if (isOccupied) {
                badgeText = 'Occupied';
                badgeColor = 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
              } else if (isMaintenance) {
                badgeText = 'Blocked';
                badgeColor = 'bg-slate-800 text-slate-400 border border-slate-700';
              } else if (isDirty) {
                badgeText = 'Dirty';
                badgeColor = 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
                cardBg = 'bg-amber-500/[0.01]';
              }

              return (
                <div
                  key={room.id}
                  className={`group relative rounded-2xl ${cardBg} border border-slate-800/80 p-4 hover:border-slate-700/60 transition-all flex flex-col justify-between min-h-[185px]`}
                >
                  <div className="space-y-1.5">
                    {/* Top Room Indicator Row */}
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">FL {room.floor}</span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {room.isVIP && (
                          <span className="p-0.5 rounded bg-amber-500/10 text-amber-400" title="VIP Status Room">
                            <Star size={10} className="fill-amber-400 text-amber-400" />
                          </span>
                        )}
                        <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-wider border ${badgeColor}`}>
                          {badgeText}
                        </span>
                      </div>
                    </div>

                    {/* Room Number & Category */}
                    <div>
                      <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-1.5">
                        Room {room.roomNumber}
                      </h3>
                      <p className="text-[10px] text-slate-400 font-bold truncate mt-0.5">{room.roomType?.name}</p>
                    </div>

                    {/* Room features and discount badges */}
                    <div className="flex items-center justify-between min-h-[16px] pt-1">
                      {/* Amenities checklist icons */}
                      {renderAmenitiesIcons(room.amenities)}

                      {/* Room discount label */}
                      {room.discount ? (
                        <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8px] font-black bg-rose-500/10 text-rose-400 border border-rose-500/20 uppercase tracking-wider">
                          <Tag size={8} /> {room.discount}% off
                        </span>
                      ) : room.customRate ? (
                        <span className="px-1.5 py-0.5 rounded text-[8px] font-black bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase tracking-wider">
                          Custom ₹
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {/* Operational Status Toggles & Mini Toolbar */}
                  <div className="flex items-center justify-between pt-2.5 border-t border-slate-900/60 gap-2">
                    
                    {/* Housekeeping Action Button (Single Clean/Dirty prompt toggle) */}
                    <button
                      disabled={updatingId === room.id}
                      onClick={() => handleUpdateStatus(room.id, { housekeepingStatus: isDirty ? 'CLEAN' : 'DIRTY' })}
                      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-colors ${
                        isDirty 
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/25 hover:bg-amber-500/20' 
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 hover:bg-emerald-500/20'
                      }`}
                    >
                      {isDirty ? '🧹 Clean?' : '🧹 Make Dirty'}
                    </button>

                    {/* Mini Toolbar (Wrench & Trash) */}
                    <div className="flex items-center gap-1">
                      {/* Edit Configuration */}
                      <button
                        onClick={() => {
                          setEditingRoom(room);
                          setShowAddRoom(true);
                        }}
                        className="p-1.5 rounded-lg bg-slate-900 text-slate-500 border border-slate-800 hover:text-slate-300 hover:border-slate-700 transition-colors"
                        title="Edit Room Configuration"
                      >
                        <Pencil size={10} />
                      </button>

                      {/* Maintenance Toggle */}
                      <button
                        disabled={updatingId === room.id || isOccupied}
                        onClick={() => handleUpdateStatus(room.id, { status: isMaintenance ? 'AVAILABLE' : 'MAINTENANCE' })}
                        className={`p-1.5 rounded-lg border transition-colors ${
                          isMaintenance
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20'
                            : 'bg-slate-900 text-slate-500 border-slate-800 hover:text-slate-300'
                        }`}
                        title={isOccupied ? 'Cannot block occupied room' : isMaintenance ? 'Make available' : 'Block for maintenance'}
                      >
                        <Wrench size={10} />
                      </button>

                      {/* Delete room option (only if not occupied) */}
                      {!isOccupied && (
                        <button
                          onClick={() => handleDeleteRoom(room.id)}
                          className="p-1.5 rounded-lg bg-rose-500/5 hover:bg-rose-500/15 text-slate-600 hover:text-rose-400 border border-transparent hover:border-rose-500/20 transition-all opacity-0 group-hover:opacity-100"
                          title="Delete Room"
                        >
                          <Trash2 size={10} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )
    )}

      {/* Room Categories Tab View */}
      {activeTab === 'types' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-white">Room Categories</h2>
            <button
              onClick={() => setShowAddType(true)}
              className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2"
            >
              <Plus size={14} /> Add Category
            </button>
          </div>

          {/* Categories Spreadsheet Table */}
          <div className="overflow-x-auto rounded-3xl border border-slate-800/80 bg-[#0f172a]/30 shadow-xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800/80 bg-slate-900/60 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                  <th className="p-5 pl-6">Category Details</th>
                  <th className="p-5">System Code</th>
                  <th className="p-5">Max Occupancy</th>
                  <th className="p-5">Base Pricing Rate</th>
                  <th className="p-5">Active Inventory</th>
                  <th className="p-5 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {roomTypes.map((type) => {
                  const roomsAssigned = rooms.filter((r) => r.roomTypeId === type.id).length;
                  return (
                    <tr key={type.id} className="hover:bg-slate-900/10 transition-colors text-slate-300">
                      <td className="p-5 pl-6">
                        <div className="flex flex-col">
                          <span className="font-bold text-white text-sm">{type.name}</span>
                          <span className="text-[10px] text-slate-500 mt-0.5">{type.description || 'No description provided'}</span>
                        </div>
                      </td>
                      <td className="p-5 font-mono text-slate-400 text-[11px] tracking-wider">{type.code}</td>
                      <td className="p-5">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-900 text-slate-300 font-bold border border-slate-800">
                          {type.maxOccupancy} Guests max
                        </span>
                      </td>
                      <td className="p-5">
                        <span className="font-black text-indigo-400 text-sm">₹{type.baseRate}</span>
                        <span className="text-[9px] text-slate-500 font-bold uppercase ml-1">/ Night</span>
                      </td>
                      <td className="p-5">
                        <span className="px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 font-bold border border-indigo-500/20">
                          {roomsAssigned} {roomsAssigned === 1 ? 'Room' : 'Rooms'} assigned
                        </span>
                      </td>
                      <td className="p-5 pr-6 text-right">
                        {roomsAssigned === 0 ? (
                          <button
                            onClick={() => handleDeleteRoomType(type.id)}
                            className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 transition-all border border-rose-500/20"
                            title="Delete Category"
                          >
                            <Trash2 size={13} />
                          </button>
                        ) : (
                          <span className="text-[9px] text-slate-500 font-black uppercase tracking-wider bg-slate-950 border border-slate-900 px-3 py-1 rounded-lg">In Active Use</span>
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


      {/* Overlay Modal: Add Room Category */}
      {showAddType && (
        <CategoryAddModal 
          onClose={() => setShowAddType(false)} 
          onSave={handleCreateRoomTypeSubmit} 
        />
      )}
    </div>
  );
}
