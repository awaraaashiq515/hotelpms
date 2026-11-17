'use client';

import React, { useState } from 'react';
import {
  BedDouble, User, Users, CheckCircle2, Clock, Phone,
  ChevronRight, ArrowRight, Flame, Bell, UserCheck, UserX,
  AlertTriangle, RefreshCw, Printer, Shield, Sparkles, Filter
} from 'lucide-react';
import { MasterTicket, StaffSummary, DispatchLogItem } from './types';
import { MasterOrderCard } from './MasterOrderCard';

interface DualSplitViewProps {
  tickets: MasterTicket[];
  staffMembers: StaffSummary[];
  dispatchLogs: DispatchLogItem[];
  checkedItems: Record<string, boolean>;
  updatingKotId: string | null;
  onToggleCheckItem: (itemId: string) => void;
  onUpdateStatus: (kotId: string, status: 'PREPARING' | 'READY' | 'SERVED') => void;
  onAssignStaff: (kotId: string, staffMemberId: string, staffName: string) => void;
  onPrintTicket?: (ticket: MasterTicket) => void;
}

export const DualSplitView: React.FC<DualSplitViewProps> = ({
  tickets,
  staffMembers,
  dispatchLogs,
  checkedItems,
  updatingKotId,
  onToggleCheckItem,
  onUpdateStatus,
  onAssignStaff,
  onPrintTicket,
}) => {
  // Left Panel: Room Orders Filter
  const [roomFilter, setRoomFilter] = useState<'ALL' | 'NEW' | 'PREPARING' | 'READY' | 'SERVED'>('ALL');

  // Right Panel: Staff View Sub-tab ('WORKLOAD' vs 'TIMELINE')
  const [staffTab, setStaffTab] = useState<'WORKLOAD' | 'TIMELINE'>('WORKLOAD');

  // Filter Room Orders
  const allRoomTickets = tickets.filter(
    (t) => t.sourceCategory === 'ROOM_SERVICE' || Boolean(t.roomNumber)
  );

  const filteredRoomTickets = allRoomTickets.filter((t) => {
    if (roomFilter === 'ALL') return ['NEW', 'PREPARING', 'READY'].includes(t.status);
    return t.status === roomFilter;
  });

  // Calculate Staff Metrics
  const totalStaff = staffMembers.length;
  const staffDelivering = staffMembers.filter((s) => s.status !== 'AVAILABLE').length;
  const staffAvailable = totalStaff - staffDelivering;

  // Selected Order for quick staff assign modal / dropdown
  const [assigningKotId, setAssigningKotId] = useState<string | null>(null);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[calc(100vh-190px)] min-h-[520px]">
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* LEFT 50%: LIVE ROOM ORDERS DESK (ROOMS & IN-ROOM DINING)                  */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col bg-[#070b14] rounded-3xl border border-indigo-500/30 overflow-hidden shadow-2xl">
        {/* Header Strip */}
        <div className="p-4 bg-gradient-to-r from-indigo-950 via-[#0d1326] to-[#070b14] border-b border-indigo-500/20 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0 shadow-lg shadow-indigo-600/20">
              <BedDouble size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-white tracking-tight uppercase">
                  Room Orders Live Desk
                </h2>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              </div>
              <p className="text-[11px] text-indigo-300/80 font-medium">
                Hotel Guest Rooms & In-Room Dining Service
              </p>
            </div>
          </div>

          {/* Room Order Counters */}
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-indigo-600 text-white text-xs font-black shadow-md shadow-indigo-600/30">
              {filteredRoomTickets.length} Active {filteredRoomTickets.length === 1 ? 'Room' : 'Rooms'}
            </span>
          </div>
        </div>

        {/* Room Filter Pills */}
        <div className="px-4 py-2 bg-[#090e1c] border-b border-slate-800/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {(['ALL', 'NEW', 'PREPARING', 'READY', 'SERVED'] as const).map((filter) => {
            const count =
              filter === 'ALL'
                ? allRoomTickets.filter((t) => ['NEW', 'PREPARING', 'READY'].includes(t.status)).length
                : allRoomTickets.filter((t) => t.status === filter).length;

            return (
              <button
                key={filter}
                onClick={() => setRoomFilter(filter)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                  roomFilter === filter
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <span>{filter === 'ALL' ? 'Active Rooms' : filter}</span>
                <span className="px-1.5 py-0.2 rounded bg-black/40 text-[10px] font-black">
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Room Orders List */}
        <div className="flex-1 p-3.5 overflow-y-auto space-y-3.5">
          {filteredRoomTickets.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center py-24 text-center opacity-40 select-none">
              <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-3 text-indigo-400">
                <BedDouble size={32} />
              </div>
              <h3 className="text-base font-bold text-slate-200">No Active Room Orders</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">
                When guests order from Room QR Standees, Room Tablet, or Front Desk, they will appear here live.
              </p>
            </div>
          ) : (
            filteredRoomTickets.map((ticket) => {
              const isAssigned = Boolean(ticket.assignedStaffName || ticket.serverName);

              return (
                <div
                  key={ticket.id}
                  className="bg-[#0b101e] rounded-2xl border border-indigo-500/30 overflow-hidden shadow-xl transition hover:border-indigo-400"
                >
                  {/* Card Top Strip */}
                  <div className="p-3.5 bg-gradient-to-r from-indigo-950/90 via-indigo-900/40 to-slate-900 border-b border-indigo-500/20 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2.5 py-0.5 rounded-lg bg-indigo-600 text-white text-xs font-black flex items-center gap-1">
                          <BedDouble size={13} />
                          {ticket.sourceBadge}
                        </span>
                        <span className="text-xs font-bold text-indigo-200 bg-black/40 px-2 py-0.5 rounded">
                          KOT #{ticket.kotNo}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">
                          #{ticket.orderNo}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 font-medium">
                        {ticket.sourceLocation} {ticket.guestName && `• Guest: ${ticket.guestName}`}
                      </p>
                    </div>

                    {/* Timer & Status */}
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <div
                        className={`px-2.5 py-1 rounded-xl text-xs flex items-center gap-1 font-black ${
                          ticket.urgency === 'CRITICAL'
                            ? 'bg-red-500 text-white animate-bounce shadow-md shadow-red-500/40'
                            : ticket.urgency === 'WARNING'
                            ? 'bg-amber-500/20 border border-amber-500/50 text-amber-300'
                            : 'bg-emerald-950/60 border border-emerald-600/30 text-emerald-400'
                        }`}
                      >
                        <Clock size={12} />
                        <span>{ticket.elapsedMinutes}m ago</span>
                      </div>

                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        {ticket.status}
                      </span>
                    </div>
                  </div>

                  {/* Staff Assignment Bar (Crucial requirement: Kis-kis staff ko order gaya hai) */}
                  <div className="px-3.5 py-2 bg-[#080d18] border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                        isAssigned
                          ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400'
                          : 'bg-amber-500/20 border border-amber-500/40 text-amber-400'
                      }`}>
                        <User size={13} />
                      </div>
                      <div>
                        {isAssigned ? (
                          <p className="text-xs text-slate-200 font-bold flex items-center gap-1.5">
                            <span>Delivering by:</span>
                            <span className="text-emerald-400 font-black underline decoration-emerald-500/40">
                              {ticket.assignedStaffName || ticket.serverName}
                            </span>
                            <span className="text-[10px] text-slate-400 font-normal">
                              ({ticket.assignedStaffDesignation || 'Staff'})
                            </span>
                          </p>
                        ) : (
                          <p className="text-xs text-amber-400 font-bold flex items-center gap-1">
                            <AlertTriangle size={12} />
                            <span>Unassigned — Ready for Staff Pickup</span>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Staff Assign Dropdown Button */}
                    <div className="relative">
                      <button
                        onClick={() =>
                          setAssigningKotId(assigningKotId === ticket.id ? null : ticket.id)
                        }
                        className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1 transition"
                      >
                        <UserCheck size={12} className="text-indigo-400" />
                        <span>{isAssigned ? 'Reassign Staff' : 'Assign to Staff'}</span>
                      </button>

                      {/* Dropdown Menu to Pick Staff */}
                      {assigningKotId === ticket.id && (
                        <div className="absolute right-0 top-full mt-1.5 w-56 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2 z-40 space-y-1 animate-in fade-in zoom-in-95 duration-150">
                          <p className="text-[10px] font-black uppercase text-slate-400 px-2 py-1 border-b border-slate-800">
                            Select Staff Member:
                          </p>
                          <div className="max-h-48 overflow-y-auto space-y-1">
                            {staffMembers.map((staff) => (
                              <button
                                key={staff.id}
                                onClick={() => {
                                  onAssignStaff(ticket.id, staff.id, staff.name);
                                  setAssigningKotId(null);
                                }}
                                className="w-full px-2 py-1.5 rounded-lg text-left text-xs font-bold hover:bg-indigo-600 hover:text-white text-slate-200 flex items-center justify-between transition"
                              >
                                <span>{staff.name}</span>
                                <span className="text-[10px] text-slate-400 font-normal">
                                  {staff.designation}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="p-3.5 space-y-2 bg-[#090d16]">
                    <div className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center justify-between pb-1 border-b border-slate-800">
                      <span>Items ({ticket.totalItemsCount})</span>
                      <span className="text-[10px] text-slate-500 lowercase">tap to mark prepared</span>
                    </div>

                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {ticket.items.map((item) => {
                        const isDone = checkedItems[item.id] || item.status === 'READY' || item.status === 'SERVED';
                        return (
                          <div
                            key={item.id}
                            onClick={() => onToggleCheckItem(item.id)}
                            className={`p-2 rounded-xl flex items-start gap-2.5 cursor-pointer transition select-none ${
                              isDone
                                ? 'bg-slate-900/60 opacity-60 border border-transparent'
                                : 'bg-[#101726] hover:bg-[#151f33] border border-slate-800'
                            }`}
                          >
                            <div
                              className={`w-4 h-4 mt-0.5 rounded-md flex items-center justify-center shrink-0 border transition ${
                                isDone
                                  ? 'bg-emerald-600 border-emerald-500 text-white'
                                  : 'border-slate-700 bg-slate-900/60 text-transparent'
                              }`}
                            >
                              <CheckCircle2 size={11} strokeWidth={3} />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-baseline justify-between gap-1">
                                <span
                                  className={`text-sm font-black truncate ${
                                    isDone ? 'line-through text-slate-500' : 'text-slate-100'
                                  }`}
                                >
                                  {item.itemName}
                                </span>
                                <span className="text-xs font-black px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-700/40">
                                  x{item.quantity}
                                </span>
                              </div>

                              {item.notes && (
                                <p className="text-[11px] text-amber-400 font-bold mt-0.5 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                                  ⚠️ Note: {item.notes}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="p-3 bg-[#080c16] border-t border-slate-800 flex items-center gap-2">
                    {onPrintTicket && (
                      <button
                        onClick={() => onPrintTicket(ticket)}
                        title="Print Thermal Ticket"
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                      >
                        <Printer size={15} />
                      </button>
                    )}

                    {ticket.status === 'NEW' && (
                      <button
                        disabled={updatingKotId === ticket.id}
                        onClick={() => onUpdateStatus(ticket.id, 'PREPARING')}
                        className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-black text-xs shadow-md shadow-orange-600/30 flex items-center justify-center gap-1.5 transition active:scale-95 disabled:opacity-50"
                      >
                        <Flame size={14} />
                        Start Cooking Order
                      </button>
                    )}

                    {ticket.status === 'PREPARING' && (
                      <button
                        disabled={updatingKotId === ticket.id}
                        onClick={() => onUpdateStatus(ticket.id, 'READY')}
                        className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-md shadow-emerald-600/30 flex items-center justify-center gap-1.5 transition active:scale-95 disabled:opacity-50"
                      >
                        <Bell size={14} />
                        Mark Ready for Room Delivery
                      </button>
                    )}

                    {ticket.status === 'READY' && (
                      <button
                        disabled={updatingKotId === ticket.id}
                        onClick={() => onUpdateStatus(ticket.id, 'SERVED')}
                        className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs shadow-md shadow-blue-600/30 flex items-center justify-center gap-1.5 transition active:scale-95 disabled:opacity-50"
                      >
                        <CheckCircle2 size={14} />
                        Mark Delivered to Room
                      </button>
                    )}

                    {ticket.status === 'SERVED' && (
                      <span className="text-xs text-slate-400 font-bold flex items-center gap-1 mx-auto py-1">
                        <CheckCircle2 size={14} className="text-emerald-500" />
                        Delivered Successfully
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* RIGHT 50%: LIVE STAFF DELIVERY & DISPATCH TRACKER                         */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col bg-[#070b14] rounded-3xl border border-emerald-500/30 overflow-hidden shadow-2xl">
        {/* Header Strip */}
        <div className="p-4 bg-gradient-to-r from-emerald-950 via-[#0d1f18] to-[#070b14] border-b border-emerald-500/20 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0 shadow-lg shadow-emerald-600/20">
              <Users size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-white tracking-tight uppercase">
                  Staff Delivery & Dispatch Tracker
                </h2>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              </div>
              <p className="text-[11px] text-emerald-300/80 font-medium">
                Live Staff Order Assignments & Real-time Delivery Tracker
              </p>
            </div>
          </div>

          {/* Quick Sub-tabs: Workload vs Timeline */}
          <div className="flex items-center bg-black/40 p-1 rounded-xl border border-slate-800 text-xs font-bold">
            <button
              onClick={() => setStaffTab('WORKLOAD')}
              className={`px-3 py-1 rounded-lg transition ${
                staffTab === 'WORKLOAD'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Staff Workload ({totalStaff})
            </button>
            <button
              onClick={() => setStaffTab('TIMELINE')}
              className={`px-3 py-1 rounded-lg transition ${
                staffTab === 'TIMELINE'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Live Dispatch Log ({dispatchLogs.length})
            </button>
          </div>
        </div>

        {/* Staff Metrics Bar */}
        <div className="px-4 py-2.5 bg-[#09101d] border-b border-slate-800/80 grid grid-cols-3 gap-2 text-center">
          <div className="bg-[#0e172a] p-2 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-black block">Staff on Duty</span>
            <span className="text-base font-black text-white">{totalStaff}</span>
          </div>

          <div className="bg-[#0e172a] p-2 rounded-xl border border-blue-500/30">
            <span className="text-[10px] text-blue-400 uppercase font-black block">Delivering Now</span>
            <span className="text-base font-black text-blue-300">{staffDelivering}</span>
          </div>

          <div className="bg-[#0e172a] p-2 rounded-xl border border-emerald-500/30">
            <span className="text-[10px] text-emerald-400 uppercase font-black block">Available</span>
            <span className="text-base font-black text-emerald-300">{staffAvailable}</span>
          </div>
        </div>

        {/* Content Section */}
        <div className="flex-1 p-3.5 overflow-y-auto space-y-3">
          {/* TAB 1: STAFF WORKLOAD CARDS */}
          {staffTab === 'WORKLOAD' && (
            <div className="space-y-3">
              {staffMembers.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center py-20 text-center opacity-40">
                  <Users size={32} className="text-slate-500 mb-2" />
                  <p className="text-sm font-bold text-slate-300">No Staff Members Registered</p>
                  <p className="text-xs text-slate-500">Configure staff in Hotel Admin to track room deliveries.</p>
                </div>
              ) : (
                staffMembers.map((staff) => {
                  const hasActiveOrders = staff.activeOrders.length > 0;

                  return (
                    <div
                      key={staff.id}
                      className={`p-3.5 rounded-2xl border transition-all ${
                        hasActiveOrders
                          ? 'bg-[#0d1627] border-blue-500/40 shadow-lg shadow-blue-500/10'
                          : 'bg-[#090e1a] border-slate-800'
                      }`}
                    >
                      {/* Staff Header */}
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm uppercase shrink-0 ${
                            hasActiveOrders
                              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                              : 'bg-slate-800 text-slate-300 border border-slate-700'
                          }`}>
                            {staff.name.slice(0, 2)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-black text-white">{staff.name}</h4>
                              <span className="text-[10px] font-bold px-2 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700">
                                {staff.designation}
                              </span>
                            </div>
                            {staff.phone && (
                              <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                                <Phone size={10} /> {staff.phone}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div className="flex items-center gap-2">
                          {hasActiveOrders ? (
                            <span className="px-2.5 py-1 rounded-full text-xs font-black bg-blue-500/20 border border-blue-500/50 text-blue-300 flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
                              Delivering ({staff.activeOrders.length})
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                              Available
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Orders Currently In Hand / Assigned to this Staff */}
                      {hasActiveOrders ? (
                        <div className="mt-3 pt-2.5 border-t border-slate-800/80 space-y-2">
                          <span className="text-[10px] font-black uppercase text-blue-400 tracking-wider block">
                            Active Orders Assigned to {staff.name}:
                          </span>

                          <div className="space-y-1.5">
                            {staff.activeOrders.map((ord, idx) => (
                              <div
                                key={idx}
                                className="p-2.5 rounded-xl bg-[#090d18] border border-blue-500/30 flex items-center justify-between gap-2"
                              >
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-black text-white bg-indigo-950 px-2 py-0.5 rounded border border-indigo-700/40">
                                      {ord.roomNumber}
                                    </span>
                                    <span className="text-xs font-bold text-slate-300">
                                      #{ord.orderNo}
                                    </span>
                                  </div>
                                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                                    Status: <strong className="text-amber-400">{ord.status}</strong> • Elapsed: {ord.elapsedMinutes}m
                                  </span>
                                </div>

                                <button
                                  onClick={() => onUpdateStatus(ord.kotId, 'SERVED')}
                                  className="px-2.5 py-1 rounded-lg text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm flex items-center gap-1 transition shrink-0 active:scale-95"
                                >
                                  <CheckCircle2 size={12} />
                                  <span>Mark Delivered</span>
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="mt-2 text-[11px] text-slate-500 italic">
                          No active orders currently assigned. Ready to take next room delivery.
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 2: LIVE DISPATCH ACTIVITY TIMELINE */}
          {staffTab === 'TIMELINE' && (
            <div className="space-y-2.5">
              {dispatchLogs.length === 0 ? (
                <div className="py-20 text-center opacity-40">
                  <Clock size={32} className="text-slate-500 mx-auto mb-2" />
                  <p className="text-xs text-slate-400">No dispatch events recorded today.</p>
                </div>
              ) : (
                dispatchLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 rounded-2xl bg-[#0a0f1d] border border-slate-800 flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                        <CheckCircle2 size={13} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-white">{log.staffName}</span>
                          <span className="text-[10px] bg-slate-800 px-1.5 py-0.2 rounded font-bold text-slate-300">
                            {log.roomOrTable}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">{log.action}</p>
                      </div>
                    </div>

                    <span className="text-[11px] font-mono text-slate-500 shrink-0">
                      {log.time}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

