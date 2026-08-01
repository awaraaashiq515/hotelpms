'use client';

import React, { useState, useEffect, useCallback } from 'react';

interface HousekeepingRoom {
  id: string;
  roomNumber: string;
  floor?: string | null;
  status: string;
  housekeepingStatus: string;
  roomType: { name: string };
  housekeepingTasks: HousekeepingTask[];
  checkIns: { guest: { firstName: string; lastName: string } }[];
}

interface HousekeepingTask {
  id: string;
  taskType: string;
  priority?: string | null;
  status: string;
  scheduledAt?: string | null;
  remarks?: string | null;
}

const HK_STATUS_CONFIG: Record<string, { label: string; emoji: string; bg: string; color: string; border: string }> = {
  CLEAN: { label: 'Clean', emoji: '✅', bg: 'rgba(16,185,129,0.12)', color: '#34d399', border: 'rgba(16,185,129,0.25)' },
  DIRTY: { label: 'Dirty', emoji: '🧹', bg: 'rgba(239,68,68,0.12)', color: '#f87171', border: 'rgba(239,68,68,0.25)' },
  INSPECTING: { label: 'Inspecting', emoji: '🔍', bg: 'rgba(99,102,241,0.12)', color: '#818cf8', border: 'rgba(99,102,241,0.25)' },
  DO_NOT_DISTURB: { label: 'DND', emoji: '🚫', bg: 'rgba(251,191,36,0.12)', color: '#fbbf24', border: 'rgba(251,191,36,0.25)' },
  OUT_OF_ORDER: { label: 'Out of Order', emoji: '🔧', bg: 'rgba(107,114,128,0.12)', color: '#9ca3af', border: 'rgba(107,114,128,0.25)' },
};

const ROOM_STATUS_CONFIG: Record<string, { label: string; emoji: string; color: string }> = {
  AVAILABLE: { label: 'Available', emoji: '🟢', color: '#34d399' },
  OCCUPIED: { label: 'Occupied', emoji: '🔵', color: '#60a5fa' },
  RESERVED: { label: 'Reserved', emoji: '🟡', color: '#fbbf24' },
  MAINTENANCE: { label: 'Maintenance', emoji: '🔧', color: '#f87171' },
  CHECKOUT: { label: 'Checkout', emoji: '📤', color: '#a78bfa' },
};

const NEXT_HK_STATUSES = ['CLEAN', 'DIRTY', 'INSPECTING', 'DO_NOT_DISTURB', 'OUT_OF_ORDER'];

interface HousekeepingPanelProps {
  wtToken: string;
  propertyCode?: string;
}

export default function HousekeepingPanel({ wtToken }: HousekeepingPanelProps) {
  const [rooms, setRooms] = useState<HousekeepingRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [selectedRoom, setSelectedRoom] = useState<HousekeepingRoom | null>(null);
  const [updatingRoomId, setUpdatingRoomId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchRooms = useCallback(async () => {
    try {
      const res = await fetch('/api/housekeeping-rooms', {
        headers: { Authorization: `Bearer ${wtToken}` },
      });
      const data = await res.json();
      if (data.success) {
        setRooms(data.data);
      }
    } catch {
      console.error('Failed to load rooms');
    } finally {
      setLoading(false);
    }
  }, [wtToken]);

  useEffect(() => {
    fetchRooms();
    const interval = setInterval(fetchRooms, 30000);
    return () => clearInterval(interval);
  }, [fetchRooms]);

  const updateHKStatus = async (roomId: string, housekeepingStatus: string) => {
    setUpdatingRoomId(roomId);
    try {
      await fetch('/api/housekeeping-rooms', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${wtToken}` },
        body: JSON.stringify({ roomId, housekeepingStatus }),
      });
      setRooms(prev => prev.map(r => r.id === roomId ? { ...r, housekeepingStatus } : r));
      if (selectedRoom?.id === roomId) {
        setSelectedRoom(prev => prev ? { ...prev, housekeepingStatus } : null);
      }
    } catch {
      console.error('Failed to update room status');
    } finally {
      setUpdatingRoomId(null);
    }
  };

  const updateTaskStatus = async (taskId: string, roomId: string, taskStatus: string) => {
    try {
      await fetch('/api/housekeeping-rooms', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${wtToken}` },
        body: JSON.stringify({ taskId, taskStatus }),
      });
      setRooms(prev => prev.map(r => {
        if (r.id !== roomId) return r;
        return {
          ...r,
          housekeepingTasks: r.housekeepingTasks.map(t =>
            t.id === taskId ? { ...t, status: taskStatus } : t
          ).filter(t => t.status !== 'COMPLETED'),
        };
      }));
      if (selectedRoom?.id === roomId) {
        setSelectedRoom(prev => prev ? {
          ...prev,
          housekeepingTasks: prev.housekeepingTasks.map(t =>
            t.id === taskId ? { ...t, status: taskStatus } : t
          ).filter(t => t.status !== 'COMPLETED'),
        } : null);
      }
    } catch {
      console.error('Failed to update task');
    }
  };

  const filteredRooms = rooms.filter(r => {
    const matchStatus = filterStatus === 'ALL' || r.housekeepingStatus === filterStatus;
    const matchSearch = !searchTerm || r.roomNumber.includes(searchTerm) || (r.floor || '').includes(searchTerm);
    return matchStatus && matchSearch;
  });

  const stats = {
    CLEAN: rooms.filter(r => r.housekeepingStatus === 'CLEAN').length,
    DIRTY: rooms.filter(r => r.housekeepingStatus === 'DIRTY').length,
    INSPECTING: rooms.filter(r => r.housekeepingStatus === 'INSPECTING').length,
    DND: rooms.filter(r => r.housekeepingStatus === 'DO_NOT_DISTURB').length,
    tasks: rooms.reduce((a, r) => a + r.housekeepingTasks.length, 0),
  };

  if (loading) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
        <div style={{ width: 20, height: 20, borderRadius: '50%', border: '2.5px solid #6366f1', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
        <span style={{ fontSize: 12, color: '#64748b' }}>Loading rooms…</span>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* Sticky header */}
      <div style={{ padding: '12px 14px 0', background: '#0a0c12', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ fontSize: 9, fontWeight: 900, color: '#6366f1', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 10 }}>
          🧹 Housekeeping Dashboard
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          {[
            { label: 'Clean', val: stats.CLEAN, color: '#34d399' },
            { label: 'Dirty', val: stats.DIRTY, color: '#f87171' },
            { label: 'Checking', val: stats.INSPECTING, color: '#818cf8' },
            { label: 'Tasks', val: stats.tasks, color: '#fbbf24' },
          ].map(s => (
            <div key={s.label} style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '8px 4px', textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 900, color: s.color }}>{s.val}</div>
              <div style={{ fontSize: 8, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: 10 }}>
          <input
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search room or floor…"
            style={{ width: '100%', padding: '8px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: '#f1f5f9', fontSize: 11, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>

        {/* Filter chips */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 10, scrollbarWidth: 'none' }}>
          {['ALL', ...NEXT_HK_STATUSES].map(s => {
            const cfg = HK_STATUS_CONFIG[s];
            const isActive = filterStatus === s;
            return (
              <button key={s} onClick={() => setFilterStatus(s)}
                style={{ flexShrink: 0, padding: '5px 12px', borderRadius: 999, fontSize: 10, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', border: isActive ? `1.5px solid ${cfg?.color || '#6366f1'}` : '1.5px solid rgba(255,255,255,0.08)', background: isActive ? (cfg ? cfg.bg : 'rgba(99,102,241,0.15)') : 'rgba(255,255,255,0.03)', color: isActive ? (cfg?.color || '#818cf8') : '#64748b', transition: 'all 0.15s' }}>
                {cfg?.emoji} {cfg?.label || 'All Rooms'}
              </button>
            );
          })}
        </div>
      </div>

      {/* Room Grid */}
      <div style={{ padding: '0 14px 80px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {filteredRooms.length === 0 ? (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px 16px', color: '#475569', fontSize: 11 }}>
            No rooms found
          </div>
        ) : filteredRooms.map(room => {
          const hkCfg = HK_STATUS_CONFIG[room.housekeepingStatus] || HK_STATUS_CONFIG['DIRTY'];
          const roomCfg = ROOM_STATUS_CONFIG[room.status] || { label: room.status, emoji: '○', color: '#64748b' };
          const guest = room.checkIns[0]?.guest;
          const hasTasks = room.housekeepingTasks.length > 0;
          const isUpdating = updatingRoomId === room.id;

          return (
            <div key={room.id}
              onClick={() => setSelectedRoom(room)}
              style={{ background: 'rgba(255,255,255,0.035)', border: `1.5px solid ${hkCfg.border}`, borderRadius: 14, padding: '12px 11px', cursor: 'pointer', transition: 'all 0.15s', position: 'relative', opacity: isUpdating ? 0.6 : 1 }}>
              {hasTasks && (
                <div style={{ position: 'absolute', top: 8, right: 8, width: 7, height: 7, borderRadius: '50%', background: '#fbbf24', boxShadow: '0 0 4px #fbbf2488' }} />
              )}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 16, fontWeight: 900, color: '#f1f5f9' }}>Room {room.roomNumber}</span>
                <span style={{ fontSize: 14 }}>{hkCfg.emoji}</span>
              </div>
              <div style={{ fontSize: 9, fontWeight: 700, color: '#64748b', marginBottom: 4 }}>{room.floor ? `Floor ${room.floor}` : ''} · {room.roomType.name}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 999, background: hkCfg.bg, color: hkCfg.color, alignSelf: 'flex-start' }}>
                  {hkCfg.label}
                </span>
                <span style={{ fontSize: 9, fontWeight: 700, color: roomCfg.color }}>
                  {roomCfg.emoji} {roomCfg.label} {guest ? `· ${guest.firstName}` : ''}
                </span>
              </div>
              {hasTasks && (
                <div style={{ fontSize: 9, color: '#fbbf24', marginTop: 5, fontWeight: 700 }}>
                  ⚠ {room.housekeepingTasks.length} pending task{room.housekeepingTasks.length > 1 ? 's' : ''}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Room Detail Bottom Sheet */}
      {selectedRoom && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          <div onClick={() => setSelectedRoom(null)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }} />
          <div style={{ position: 'relative', background: '#0f1117', borderRadius: '20px 20px 0 0', padding: '20px 18px 40px', maxHeight: '75vh', overflowY: 'auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 20, fontWeight: 900, color: '#f1f5f9' }}>Room {selectedRoom.roomNumber}</div>
                <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700, marginTop: 2 }}>{selectedRoom.floor ? `Floor ${selectedRoom.floor}` : ''} · {selectedRoom.roomType.name}</div>
              </div>
              <button onClick={() => setSelectedRoom(null)} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 9, padding: '6px 9px', color: '#94a3b8', cursor: 'pointer', fontSize: 13 }}>✕</button>
            </div>

            {/* Current HK Status */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 9, fontWeight: 900, color: '#475569', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 8 }}>Update Status</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                {NEXT_HK_STATUSES.map(s => {
                  const cfg = HK_STATUS_CONFIG[s];
                  const isCurrent = selectedRoom.housekeepingStatus === s;
                  return (
                    <button key={s}
                      onClick={() => !isCurrent && updateHKStatus(selectedRoom.id, s)}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 13px', borderRadius: 999, fontSize: 11, fontWeight: 800, cursor: isCurrent ? 'default' : 'pointer', fontFamily: 'inherit', border: isCurrent ? `2px solid ${cfg.color}` : '1.5px solid rgba(255,255,255,0.08)', background: isCurrent ? cfg.bg : 'rgba(255,255,255,0.03)', color: isCurrent ? cfg.color : '#64748b', transition: 'all 0.15s', transform: isCurrent ? 'scale(1.05)' : 'scale(1)' }}>
                      {cfg.emoji} {cfg.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Guest */}
            {selectedRoom.checkIns[0]?.guest && (
              <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 12, padding: '10px 13px', marginBottom: 14 }}>
                <div style={{ fontSize: 9, color: '#818cf8', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Current Guest</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#f1f5f9' }}>
                  {selectedRoom.checkIns[0].guest.firstName} {selectedRoom.checkIns[0].guest.lastName}
                </div>
              </div>
            )}

            {/* Tasks */}
            <div>
              <div style={{ fontSize: 9, fontWeight: 900, color: '#475569', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 8 }}>
                Pending Tasks {selectedRoom.housekeepingTasks.length > 0 && `(${selectedRoom.housekeepingTasks.length})`}
              </div>
              {selectedRoom.housekeepingTasks.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '16px 0', color: '#34d399', fontSize: 11, fontWeight: 700 }}>✅ No pending tasks</div>
              ) : selectedRoom.housekeepingTasks.map(task => (
                <div key={task.id} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 11, padding: '10px 12px', marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 800, color: '#f1f5f9' }}>{task.taskType.replace(/_/g, ' ')}</div>
                      {task.priority && <div style={{ fontSize: 9, color: task.priority === 'HIGH' ? '#f87171' : '#94a3b8', fontWeight: 700, marginTop: 2 }}>⚡ {task.priority}</div>}
                      {task.remarks && <div style={{ fontSize: 10, color: '#64748b', marginTop: 4 }}>{task.remarks}</div>}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
                      {task.status !== 'IN_PROGRESS' && (
                        <button onClick={() => updateTaskStatus(task.id, selectedRoom.id, 'IN_PROGRESS')}
                          style={{ padding: '5px 10px', borderRadius: 8, fontSize: 9, fontWeight: 800, cursor: 'pointer', border: '1px solid rgba(99,102,241,0.4)', background: 'rgba(99,102,241,0.12)', color: '#818cf8', fontFamily: 'inherit' }}>
                          Start
                        </button>
                      )}
                      <button onClick={() => updateTaskStatus(task.id, selectedRoom.id, 'COMPLETED')}
                        style={{ padding: '5px 10px', borderRadius: 8, fontSize: 9, fontWeight: 800, cursor: 'pointer', border: '1px solid rgba(16,185,129,0.4)', background: 'rgba(16,185,129,0.12)', color: '#34d399', fontFamily: 'inherit' }}>
                        Done ✓
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
