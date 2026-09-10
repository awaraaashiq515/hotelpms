'use client';

import React, { useState } from 'react';
import {
  X,
  Users,
  UserCheck,
  Phone,
  Clock,
  ShieldCheck,
  Plus,
  Brush,
  Building2,
  CheckCircle2
} from 'lucide-react';

interface StaffItem {
  id: string;
  name: string;
  phone?: string | null;
  designation?: string | null;
  shiftHours?: number | null;
  isActive?: boolean;
}

interface HousekeepersModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffList: StaffItem[];
  rooms: any[];
  assignedMap: Record<string, string>; // roomId -> staffName
  onAddStaff?: () => void;
}

export function HousekeepersModal({
  isOpen,
  onClose,
  staffList,
  rooms,
  assignedMap,
  onAddStaff,
}: HousekeepersModalProps) {
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  // Filter housekeepers/staff
  const housekeepers = staffList.filter((s) => {
    const q = search.toLowerCase();
    const matchesQuery = s.name.toLowerCase().includes(q) || (s.designation || '').toLowerCase().includes(q);
    return matchesQuery;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in">
      <div className="bg-[#0f172a] rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-800 text-white relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
            <Users className="w-4.5 h-4.5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">
              Housekeeping Staff Roster
            </h3>
            <p className="text-xs text-slate-400">
              Active cleaning crew, room assignments, and duty status.
            </p>
          </div>
        </div>

        {/* Search and Action Bar */}
        <div className="flex items-center justify-between gap-3 mt-4 mb-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search housekeepers..."
            className="w-full bg-[#1e293b]/70 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#00b894] placeholder:text-slate-500"
          />
        </div>

        {/* Staff List */}
        <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
          {housekeepers.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              No housekeeping staff members found.
            </div>
          ) : (
            housekeepers.map((staff) => {
              // Count assigned rooms to this staff member
              const assignedRooms = Object.entries(assignedMap)
                .filter(([_, staffName]) => staffName.toLowerCase() === staff.name.toLowerCase())
                .map(([roomId]) => {
                  const r = rooms.find((rm) => rm.id === roomId);
                  return r?.roomNumber || roomId;
                });

              return (
                <div
                  key={staff.id}
                  className="bg-[#1e293b]/60 border border-slate-700/80 rounded-xl p-3.5 flex items-center justify-between gap-3 hover:border-slate-600 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 text-white font-extrabold text-xs flex items-center justify-center shrink-0">
                      {staff.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-xs">{staff.name}</span>
                        <span className="text-[10px] font-semibold bg-sky-500/15 text-sky-300 px-2 py-0.5 rounded-md border border-sky-500/30">
                          {staff.designation || 'Housekeeper'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                        {staff.phone && (
                          <span className="flex items-center gap-1 font-mono">
                            <Phone className="w-3 h-3 text-slate-500" />
                            {staff.phone}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-500" />
                          {staff.shiftHours || 8}h Shift
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Assigned Rooms Tag */}
                  <div className="text-right shrink-0">
                    <div className="text-[11px] font-semibold text-slate-300">
                      {assignedRooms.length > 0 ? (
                        <span className="text-emerald-400 font-bold">
                          {assignedRooms.length} Unit{assignedRooms.length > 1 ? 's' : ''} Assigned
                        </span>
                      ) : (
                        <span className="text-slate-500">No units assigned</span>
                      )}
                    </div>
                    {assignedRooms.length > 0 && (
                      <div className="text-[10px] text-slate-400 mt-0.5 max-w-[140px] truncate">
                        Units: {assignedRooms.join(', ')}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div>
            Total Housekeepers on duty: <strong className="text-white">{staffList.length}</strong>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
