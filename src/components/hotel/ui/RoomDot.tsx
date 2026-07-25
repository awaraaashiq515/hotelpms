import React from 'react';
import Link from 'next/link';
import type { RoomSummary } from '@/types/hotel/dashboard.types';

interface RoomDotProps {
  room: RoomSummary;
  href?: string;
}

function getRoomColor(room: RoomSummary): string {
  if (room.maintenanceStatus && room.maintenanceStatus !== 'NONE') return 'bg-purple-400';
  if (room.status === 'OCCUPIED') return 'bg-rose-400 animate-pulse';
  if (room.housekeepingStatus === 'DIRTY') return 'bg-amber-400';
  if (room.status === 'OUT_OF_ORDER') return 'bg-slate-600';
  if (room.housekeepingStatus === 'INSPECTED') return 'bg-teal-400';
  return 'bg-emerald-400';
}

function getRoomLabel(room: RoomSummary): string {
  if (room.maintenanceStatus && room.maintenanceStatus !== 'NONE') return 'Maintenance';
  if (room.status === 'OCCUPIED') return 'Occupied';
  if (room.housekeepingStatus === 'DIRTY') return 'Dirty';
  if (room.status === 'OUT_OF_ORDER') return 'Out of Order';
  return 'Available';
}

export function RoomDot({ room, href = '/hotel/rooms' }: RoomDotProps) {
  const color = getRoomColor(room);
  const label = getRoomLabel(room);

  return (
    <Link href={href} title={`Room ${room.roomNumber} — ${label}`}
      className="flex flex-col items-center gap-1 p-1.5 rounded-lg hover:bg-white/5 transition-colors">
      <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
      <span className="text-[8px] font-black text-slate-500">{room.roomNumber}</span>
    </Link>
  );
}
