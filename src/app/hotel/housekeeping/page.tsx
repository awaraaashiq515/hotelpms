'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  Play,
  Users,
  ChevronDown,
  Info,
  Printer,
  Upload,
  ArrowUpDown,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Loader2,
  RefreshCw,
  Sparkles,
  Search,
  SlidersHorizontal,
  X,
  Building2,
  Check
} from 'lucide-react';
import { HousekeepersModal } from '@/components/hotel/housekeeping/HousekeepersModal';
import { LearnToUseModal } from '@/components/hotel/operations/LearnToUseModal';
import { printHousekeepingInspectionSheet, HousekeepingPrintItem } from '@/lib/housekeeping-print-utils';

interface RoomTypeItem {
  id: string;
  name: string;
}

interface RoomItem {
  id: string;
  roomNumber: string;
  roomTypeId: string;
  roomType?: RoomTypeItem;
  status: string;
  housekeepingStatus: string;
  maintenanceStatus?: string | null;
  description?: string | null;
}

interface ReservationItem {
  id: string;
  bookingNo: string;
  guestName?: string;
  guest?: {
    firstName?: string;
    lastName?: string;
  };
  status: string;
  arrivalDate: string;
  departureDate: string;
  assignedRoomId?: string;
  rooms?: Array<{
    roomId?: string;
  }>;
  checkIns?: Array<{
    roomId?: string;
    checkedInAt?: string;
    expectedCheckoutAt?: string;
    status?: string;
  }>;
}

interface StaffItem {
  id: string;
  name: string;
  phone?: string | null;
  designation?: string | null;
  shiftHours?: number | null;
}

export default function HousekeepingInspectionPage() {
  const [rooms, setRooms] = useState<RoomItem[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomTypeItem[]>([]);
  const [bookings, setBookings] = useState<ReservationItem[]>([]);
  const [staffList, setStaffList] = useState<StaffItem[]>([]);
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Local state for assignments and DND (roomId -> staffName / boolean)
  const [assignedMap, setAssignedMap] = useState<Record<string, string>>({});
  const [dndMap, setDndMap] = useState<Record<string, boolean>>({});

  // Modals
  const [isHousekeepersModalOpen, setIsHousekeepersModalOpen] = useState(false);
  const [isLearnOpen, setIsLearnOpen] = useState(false);
  const [isQuickActionOpen, setIsQuickActionOpen] = useState(false);

  // Filter States
  const [selectedUnitType, setSelectedUnitType] = useState<string>('ALL');
  const [selectedFrontdeskStatus, setSelectedFrontdeskStatus] = useState<string>('ALL');
  const [filterOccupied, setFilterOccupied] = useState<boolean>(true);
  const [filterVacant, setFilterVacant] = useState<boolean>(true);
  const [filterClean, setFilterClean] = useState<boolean>(true);
  const [filterDirty, setFilterDirty] = useState<boolean>(true);
  const [filterDndYes, setFilterDndYes] = useState<boolean>(true);
  const [filterDndNo, setFilterDndNo] = useState<boolean>(true);
  const [selectedStaffFilter, setSelectedStaffFilter] = useState<string>('ALL');

  // Sorting
  const [sortField, setSortField] = useState<string>('roomNumber');
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  // Toast feedback
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const showFeedback = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  // Fetch real data from APIs
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [roomsRes, typesRes, bookingsRes, staffRes, propRes] = await Promise.all([
        fetch('/api/hotel/rooms').then((r) => r.json()),
        fetch('/api/hotel/room-types').then((r) => r.json()),
        fetch('/api/hotel/bookings').then((r) => r.json()),
        fetch('/api/staff-members').then((r) => r.json()).catch(() => ({ success: false, data: [] })),
        fetch('/api/setup/properties').then((r) => r.json()).catch(() => ({ data: [] })),
      ]);

      if (roomsRes.success) {
        setRooms(roomsRes.data || []);

        // Initialize DND and assignments from room description / maintenanceStatus
        const initDnd: Record<string, boolean> = {};
        const initAssigned: Record<string, string> = {};

        (roomsRes.data || []).forEach((rm: RoomItem) => {
          if (rm.description?.includes('DND')) {
            initDnd[rm.id] = true;
          }
          if (rm.maintenanceStatus && rm.maintenanceStatus.startsWith('ASSIGNED:')) {
            const rawName = rm.maintenanceStatus.replace('ASSIGNED:', '').trim();
            if (rawName && rawName.toLowerCase() !== 'unassigned') {
              initAssigned[rm.id] = rawName;
            }
          }
        });

        setDndMap(initDnd);
        setAssignedMap(initAssigned);
      }

      if (typesRes.success) setRoomTypes(typesRes.data || []);
      if (bookingsRes.success) setBookings(bookingsRes.data || []);
      if (staffRes.success) setStaffList(staffRes.data || []);
      if (propRes.data && propRes.data.length > 0) setProperty(propRes.data[0]);
    } catch (err) {
      console.error('Error loading housekeeping data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Combine rooms with real reservation / frontdesk data
  const inspectionItems = useMemo(() => {
    return rooms.map((room) => {
      // Find matching active or recent reservation
      const matchingRes = bookings.find((b) => {
        if (b.status === 'CANCELLED') return false;
        if (b.assignedRoomId === room.id) return true;
        if (b.rooms?.some((br) => br.roomId === room.id)) return true;
        if (b.checkIns?.some((ci) => ci.roomId === room.id)) return true;
        return false;
      });

      const isOccupied =
        room.status === 'OCCUPIED' ||
        matchingRes?.status === 'CHECKED_IN' ||
        matchingRes?.checkIns?.some((ci) => ci.status === 'ACTIVE');

      const unitStatus = isOccupied ? 'Occupied' : 'Vacant';

      // Frontdesk Status
      let frontdeskStatus = 'Not Reserved';
      if (matchingRes) {
        if (matchingRes.status === 'CHECKED_IN') frontdeskStatus = 'Checked-In';
        else if (matchingRes.status === 'CHECKED_OUT') frontdeskStatus = 'Checked-Out';
        else if (matchingRes.status === 'CONFIRMED' || matchingRes.status === 'PENDING') frontdeskStatus = 'Reserved';
      }

      // Format Arrival & Departure Dates / Times
      let arrivalTime = 'Unknown';
      let arrivalDate = '-';
      let departureDate = '-';

      if (matchingRes?.arrivalDate) {
        const arr = new Date(matchingRes.arrivalDate);
        if (!isNaN(arr.getTime())) {
          arrivalDate = `${String(arr.getDate()).padStart(2, '0')}/${String(arr.getMonth() + 1).padStart(2, '0')}/${arr.getFullYear()}`;
          const hours = arr.getHours();
          const mins = arr.getMinutes();
          if (hours > 0 || mins > 0) {
            arrivalTime = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
          } else {
            arrivalTime = '14:00'; // Standard hotel checkin time
          }
        }
      }

      if (matchingRes?.departureDate) {
        const dep = new Date(matchingRes.departureDate);
        if (!isNaN(dep.getTime())) {
          departureDate = `${String(dep.getDate()).padStart(2, '0')}/${String(dep.getMonth() + 1).padStart(2, '0')}/${dep.getFullYear()}`;
        }
      }

      const assignedTo = (assignedMap[room.id] && assignedMap[room.id] !== 'Unassigned') ? assignedMap[room.id] : 'Unassigned';
      const doNotDisturb = dndMap[room.id] ?? false;

      // Condition from room housekeepingStatus
      let condition = 'Clean';
      if (room.housekeepingStatus?.toUpperCase() === 'DIRTY') condition = 'Dirty';
      else if (room.housekeepingStatus?.toUpperCase() === 'OUT_OF_ORDER') condition = 'Out of Order';
      else if (room.housekeepingStatus?.toUpperCase() === 'INSPECTED') condition = 'Inspected';

      return {
        id: room.id,
        unitNumber: room.roomNumber,
        unitType: room.roomType?.name || 'Standard',
        roomTypeId: room.roomTypeId,
        condition,
        unitStatus,
        arrivalTime,
        arrivalDate,
        departureDate,
        frontdeskStatus,
        assignedTo,
        doNotDisturb,
        rawRoom: room,
        rawBooking: matchingRes,
      };
    });
  }, [rooms, bookings, assignedMap, dndMap, staffList]);

  // Filter items based on user criteria
  const filteredItems = useMemo(() => {
    return inspectionItems.filter((item) => {
      // Unit Type Filter
      if (selectedUnitType !== 'ALL' && item.roomTypeId !== selectedUnitType) {
        return false;
      }

      // Frontdesk Status Filter
      if (selectedFrontdeskStatus !== 'ALL' && item.frontdeskStatus !== selectedFrontdeskStatus) {
        return false;
      }

      // Unit Status Checkboxes
      if (item.unitStatus === 'Occupied' && !filterOccupied) return false;
      if (item.unitStatus === 'Vacant' && !filterVacant) return false;

      // Condition Checkboxes
      if (item.condition === 'Clean' && !filterClean) return false;
      if (item.condition === 'Dirty' && !filterDirty) return false;

      // Do Not Disturb Checkboxes
      if (item.doNotDisturb && !filterDndYes) return false;
      if (!item.doNotDisturb && !filterDndNo) return false;

      // Assigned To Filter
      if (selectedStaffFilter !== 'ALL' && item.assignedTo.toLowerCase() !== selectedStaffFilter.toLowerCase()) {
        return false;
      }

      return true;
    });
  }, [
    inspectionItems,
    selectedUnitType,
    selectedFrontdeskStatus,
    filterOccupied,
    filterVacant,
    filterClean,
    filterDirty,
    filterDndYes,
    filterDndNo,
    selectedStaffFilter,
  ]);

  // Sort items
  const sortedItems = useMemo(() => {
    const list = [...filteredItems];
    list.sort((a: any, b: any) => {
      let valA = a[sortField] ?? '';
      let valB = b[sortField] ?? '';

      if (sortField === 'unitNumber') {
        return sortAsc
          ? valA.localeCompare(valB, undefined, { numeric: true, sensitivity: 'base' })
          : valB.localeCompare(valA, undefined, { numeric: true, sensitivity: 'base' });
      }

      if (typeof valA === 'string') {
        return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortAsc ? (valA > valB ? 1 : -1) : valA < valB ? 1 : -1;
    });
    return list;
  }, [filteredItems, sortField, sortAsc]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  // Condition Change Handler (Updates room housekeepingStatus in DB)
  const handleConditionChange = async (roomId: string, newCondition: string) => {
    try {
      const dbStatus =
        newCondition === 'Clean'
          ? 'CLEAN'
          : newCondition === 'Dirty'
          ? 'DIRTY'
          : newCondition === 'Out of Order'
          ? 'OUT_OF_ORDER'
          : 'INSPECTED';

      // Optimistic update
      setRooms((prev) =>
        prev.map((r) => (r.id === roomId ? { ...r, housekeepingStatus: dbStatus } : r))
      );

      const res = await fetch('/api/hotel/rooms', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: roomId, housekeepingStatus: dbStatus }),
      });

      const data = await res.json();
      if (data.success) {
        showFeedback(`✓ Condition updated to ${newCondition}`);
      }
    } catch (err) {
      console.error('Error updating condition:', err);
      showFeedback('Error updating condition in database.');
    }
  };

  // Staff Assignment Handler
  const handleAssignChange = async (roomId: string, staffName: string) => {
    const isUnassigned = !staffName || staffName === 'Unassigned';
    setAssignedMap((prev) => ({ ...prev, [roomId]: isUnassigned ? 'Unassigned' : staffName }));

    try {
      // Persist in room maintenanceStatus as metadata (empty string to unassign)
      await fetch('/api/hotel/rooms', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: roomId, 
          maintenanceStatus: isUnassigned ? '' : `ASSIGNED:${staffName}` 
        }),
      });
      showFeedback(isUnassigned ? '✓ Unit marked as Unassigned' : `✓ Unit assigned to ${staffName}`);
    } catch (err) {
      console.error(err);
    }
  };

  // DND Toggle Handler
  const handleToggleDnd = async (roomId: string, currentVal: boolean) => {
    const nextVal = !currentVal;
    setDndMap((prev) => ({ ...prev, [roomId]: nextVal }));

    try {
      await fetch('/api/hotel/rooms', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: roomId, description: nextVal ? 'DND' : '' }),
      });
      showFeedback(`✓ Do Not Disturb set to ${nextVal ? 'Yes' : 'No'}`);
    } catch (err) {
      console.error(err);
    }
  };

  // Clear Filters
  const handleClearFilters = () => {
    setSelectedUnitType('ALL');
    setSelectedFrontdeskStatus('ALL');
    setFilterOccupied(true);
    setFilterVacant(true);
    setFilterClean(true);
    setFilterDirty(true);
    setFilterDndYes(true);
    setFilterDndNo(true);
    setSelectedStaffFilter('ALL');
    showFeedback('Filters reset to default.');
  };

  // Quick Action Bulk Operations
  const handleBulkAction = async (action: 'MARK_ALL_CLEAN' | 'MARK_ALL_DIRTY' | 'ASSIGN_ALL') => {
    setIsQuickActionOpen(false);

    if (action === 'MARK_ALL_CLEAN') {
      showFeedback('Updating all units to Clean...');
      await Promise.all(
        rooms.map((r) =>
          fetch('/api/hotel/rooms', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: r.id, housekeepingStatus: 'CLEAN' }),
          })
        )
      );
      loadData();
      showFeedback('✓ All units marked as Clean!');
    } else if (action === 'MARK_ALL_DIRTY') {
      showFeedback('Updating all units to Dirty...');
      await Promise.all(
        rooms.map((r) =>
          fetch('/api/hotel/rooms', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: r.id, housekeepingStatus: 'DIRTY' }),
          })
        )
      );
      loadData();
      showFeedback('✓ All units marked as Dirty!');
    } else if (action === 'ASSIGN_ALL') {
      const defaultStaff = staffList[0]?.name || 'Housekeeping Crew';
      const updatedMap: Record<string, string> = {};
      rooms.forEach((r) => {
        updatedMap[r.id] = defaultStaff;
      });
      setAssignedMap(updatedMap);
      showFeedback(`✓ All units assigned to ${defaultStaff}!`);
    }
  };

  // Print Inspection Sheet
  const handlePrint = () => {
    const printPayload: HousekeepingPrintItem[] = sortedItems.map((item) => ({
      unitNumber: item.unitNumber,
      unitType: item.unitType,
      condition: item.condition,
      unitStatus: item.unitStatus,
      arrivalTime: item.arrivalTime,
      arrivalDate: item.arrivalDate,
      departureDate: item.departureDate,
      frontdeskStatus: item.frontdeskStatus,
      assignedTo: item.assignedTo,
      doNotDisturb: item.doNotDisturb,
    }));
    printHousekeepingInspectionSheet(printPayload, property?.name || 'Main Hotel');
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'Unit Number',
      'Unit Type',
      'Condition',
      'Unit Status',
      'Arrival Time',
      'Arrival Date',
      'Departure Date',
      'Frontdesk Status',
      'Assigned To',
      'Do Not Disturb',
    ];

    const rows = sortedItems.map((item) => [
      `"${item.unitNumber}"`,
      `"${item.unitType}"`,
      `"${item.condition}"`,
      `"${item.unitStatus}"`,
      `"${item.arrivalTime}"`,
      `"${item.arrivalDate}"`,
      `"${item.departureDate}"`,
      `"${item.frontdeskStatus}"`,
      `"${item.assignedTo}"`,
      `"${item.doNotDisturb ? 'Yes' : 'No'}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `housekeeping_inspection_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showFeedback('✓ Inspection CSV report exported!');
  };

  return (
    <div className="min-h-screen bg-[#080d1a] text-white p-4 sm:p-6 lg:p-7 font-sans antialiased select-none pb-20">
      {/* ── Top Header Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-[28px] font-bold text-white tracking-tight">
              Housekeeping
            </h1>
            <button
              onClick={() => setIsLearnOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-[#00b894] border border-[#00b894]/40 bg-[#00b894]/10 hover:bg-[#00b894]/20 transition-colors cursor-pointer shadow-2xs"
            >
              <Play className="w-2.5 h-2.5 fill-[#00b894]" />
              <span>Learn to Use</span>
            </button>
          </div>
          <div className="flex items-center gap-2 text-[13px] text-slate-400 mt-1 font-normal">
            <Link href="/hotel" className="hover:text-white transition-colors">
              Home
            </Link>
            <span>-</span>
            <span className="text-slate-300 font-medium">Housekeeping</span>
          </div>
        </div>

        {/* Right Corner Button: Housekeepers */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsHousekeepersModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-sky-400 border border-sky-500/50 bg-sky-500/10 hover:bg-sky-500/20 active:scale-[0.98] transition-all cursor-pointer shadow-sm"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Housekeepers</span>
          </button>
        </div>
      </div>

      {/* Floating Feedback Toast */}
      {feedbackMsg && (
        <div className="fixed top-5 right-5 z-50 bg-[#0f172a] border border-emerald-500/50 text-emerald-300 px-4 py-2.5 rounded-xl shadow-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* ── Top Filter Card Panel (Matching Screenshot) ── */}
      <div className="bg-[#0f172a] rounded-2xl border border-slate-800 p-5 mt-5 shadow-xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-4">
          {/* 1. Unit Type */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Unit Type
            </label>
            <div className="relative">
              <select
                value={selectedUnitType}
                onChange={(e) => setSelectedUnitType(e.target.value)}
                className="w-full appearance-none bg-[#1e293b]/70 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#00b894] cursor-pointer"
              >
                <option value="ALL">All selected</option>
                {roomTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* 2. Frontdesk Status */}
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <label className="text-xs font-bold text-slate-300">Frontdesk Status</label>
              <span title="Filter by guest reservation status"><Info className="w-3 h-3 text-slate-400 cursor-help" /></span>
            </div>
            <div className="relative">
              <select
                value={selectedFrontdeskStatus}
                onChange={(e) => setSelectedFrontdeskStatus(e.target.value)}
                className="w-full appearance-none bg-[#1e293b]/70 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#00b894] cursor-pointer"
              >
                <option value="ALL">All selected</option>
                <option value="Checked-In">Checked-In</option>
                <option value="Checked-Out">Checked-Out</option>
                <option value="Reserved">Reserved</option>
                <option value="Not Reserved">Not Reserved</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* 3. Unit Status Checkboxes */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-2">
              Unit Status
            </label>
            <div className="flex items-center gap-5 pt-1">
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer font-medium hover:text-white">
                <input
                  type="checkbox"
                  checked={filterOccupied}
                  onChange={(e) => setFilterOccupied(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-700 bg-[#1e293b] text-indigo-600 focus:ring-0 cursor-pointer accent-[#0284c7]"
                />
                <span>Occupied</span>
              </label>
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer font-medium hover:text-white">
                <input
                  type="checkbox"
                  checked={filterVacant}
                  onChange={(e) => setFilterVacant(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-700 bg-[#1e293b] text-indigo-600 focus:ring-0 cursor-pointer accent-[#0284c7]"
                />
                <span>Vacant</span>
              </label>
            </div>
          </div>

          {/* 4. Condition Checkboxes */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-2">
              Condition
            </label>
            <div className="flex items-center gap-5 pt-1">
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer font-medium hover:text-white">
                <input
                  type="checkbox"
                  checked={filterClean}
                  onChange={(e) => setFilterClean(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-700 bg-[#1e293b] focus:ring-0 cursor-pointer accent-[#00b894]"
                />
                <span>Clean</span>
              </label>
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer font-medium hover:text-white">
                <input
                  type="checkbox"
                  checked={filterDirty}
                  onChange={(e) => setFilterDirty(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-700 bg-[#1e293b] focus:ring-0 cursor-pointer accent-[#f43f5e]"
                />
                <span>Dirty</span>
              </label>
            </div>
          </div>

          {/* 5. Do Not Disturb Checkboxes */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-2">
              Do Not Disturb
            </label>
            <div className="flex items-center gap-5 pt-1">
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer font-medium hover:text-white">
                <input
                  type="checkbox"
                  checked={filterDndYes}
                  onChange={(e) => setFilterDndYes(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-700 bg-[#1e293b] focus:ring-0 cursor-pointer accent-[#0284c7]"
                />
                <span>Yes</span>
              </label>
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer font-medium hover:text-white">
                <input
                  type="checkbox"
                  checked={filterDndNo}
                  onChange={(e) => setFilterDndNo(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-700 bg-[#1e293b] focus:ring-0 cursor-pointer accent-[#0284c7]"
                />
                <span>No</span>
              </label>
            </div>
          </div>

          {/* 6. Assigned to Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Assigned to
            </label>
            <div className="relative">
              <select
                value={selectedStaffFilter}
                onChange={(e) => setSelectedStaffFilter(e.target.value)}
                className="w-full appearance-none bg-[#1e293b]/70 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#00b894] cursor-pointer"
              >
                <option value="ALL">All housekeepers</option>
                {staffList.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name} ({s.designation || 'Staff'})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* 7. Action Filter Buttons (Bottom Right) */}
          <div className="sm:col-span-2 lg:col-span-2 flex items-end justify-end gap-2.5 pt-2">
            <button
              onClick={() => showFeedback('Filters applied')}
              className="px-6 py-2.5 bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-[0.98] cursor-pointer"
            >
              Apply
            </button>
            <button
              onClick={handleClearFilters}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold rounded-xl border border-slate-700 transition-colors cursor-pointer"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* ── Inspection Table Card (Matching Screenshot) ── */}
      <div className="bg-[#0f172a] rounded-2xl border border-slate-800 mt-6 shadow-2xl overflow-hidden">
        {/* Table Header Controls */}
        <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 bg-[#0b1120]">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-white tracking-tight">
              Inspection
            </h2>
            <span className="text-xs font-semibold bg-slate-800 text-slate-400 px-2.5 py-1 rounded-md border border-slate-700">
              {sortedItems.length} Units
            </span>
          </div>

          {/* Action Buttons: Quick Action, Print, Export */}
          <div className="flex items-center gap-2.5">
            {/* Quick Action Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsQuickActionOpen(!isQuickActionOpen)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-[#1e293b]/70 hover:bg-[#1e293b] border border-slate-700 transition-colors cursor-pointer shadow-xs"
              >
                <span>Quick Action</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {isQuickActionOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-[#1e293b] border border-slate-700 rounded-xl shadow-2xl p-1.5 z-40 text-xs font-medium animate-in fade-in">
                  <button
                    onClick={() => handleBulkAction('MARK_ALL_CLEAN')}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer"
                  >
                    Mark All as Clean
                  </button>
                  <button
                    onClick={() => handleBulkAction('MARK_ALL_DIRTY')}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-700 text-rose-400 hover:text-rose-300 font-semibold cursor-pointer"
                  >
                    Mark All as Dirty
                  </button>
                  <button
                    onClick={() => handleBulkAction('ASSIGN_ALL')}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-700 text-sky-400 hover:text-sky-300 font-semibold cursor-pointer border-t border-slate-700/60 mt-1"
                  >
                    Assign All to First Staff
                  </button>
                </div>
              )}
            </div>

            {/* Print Button */}
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-[#1e293b]/70 hover:bg-[#1e293b] border border-slate-700 transition-colors cursor-pointer shadow-xs"
              title="Print Housekeeping Inspection Sheet"
            >
              <Printer className="w-3.5 h-3.5 text-slate-400" />
              <span>Print</span>
            </button>

            {/* Export Button */}
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-[#1e293b]/70 hover:bg-[#1e293b] border border-slate-700 transition-colors cursor-pointer shadow-xs"
              title="Export Inspection Report as CSV"
            >
              <Upload className="w-3.5 h-3.5 text-slate-400" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Inspection Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs" style={{ minWidth: '1080px' }}>
            <thead>
              <tr className="border-b border-slate-800 bg-[#0f172a] text-slate-400 text-[11px] font-bold">
                {/* 1. Unit Number */}
                <th
                  onClick={() => handleSort('unitNumber')}
                  className="p-3.5 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Unit Number</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>

                {/* 2. Unit Type */}
                <th
                  onClick={() => handleSort('unitType')}
                  className="p-3.5 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Unit Type</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>

                {/* 3. Condition */}
                <th
                  onClick={() => handleSort('condition')}
                  className="p-3.5 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Condition</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>

                {/* 4. Unit Status */}
                <th
                  onClick={() => handleSort('unitStatus')}
                  className="p-3.5 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Unit Status</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>

                {/* 5. Arrival Time */}
                <th
                  onClick={() => handleSort('arrivalTime')}
                  className="p-3.5 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Arrival Time</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>

                {/* 6. Arrival Date */}
                <th
                  onClick={() => handleSort('arrivalDate')}
                  className="p-3.5 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Arrival Date</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>

                {/* 7. Departure Date */}
                <th
                  onClick={() => handleSort('departureDate')}
                  className="p-3.5 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Departure Date</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>

                {/* 8. Frontdesk Status */}
                <th
                  onClick={() => handleSort('frontdeskStatus')}
                  className="p-3.5 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Frontdesk Status</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>

                {/* 9. Assigned to */}
                <th
                  onClick={() => handleSort('assignedTo')}
                  className="p-3.5 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Assigned to</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>

                {/* 10. Do Not Disturb */}
                <th
                  onClick={() => handleSort('doNotDisturb')}
                  className="p-3.5 text-center cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <span>Do Not Disturb</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/60 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-20 text-center text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin text-[#00b894]" />
                      <span>Loading Housekeeping Inspection data...</span>
                    </div>
                  </td>
                </tr>
              ) : sortedItems.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-16 text-center text-slate-500">
                    No hotel units match the selected inspection criteria.
                  </td>
                </tr>
              ) : (
                sortedItems.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-800/30 transition-colors group/row"
                  >
                    {/* 1. Unit Number */}
                    <td className="p-3.5 font-bold text-white text-xs">
                      Room {item.unitNumber}
                    </td>

                    {/* 2. Unit Type */}
                    <td className="p-3.5 text-slate-300">
                      {item.unitType}
                    </td>

                    {/* 3. Condition (Interactive Select matching screenshot) */}
                    <td className="p-3.5">
                      <div className="relative inline-block">
                        <select
                          value={item.condition}
                          onChange={(e) => handleConditionChange(item.id, e.target.value)}
                          className={`appearance-none font-bold text-xs pl-2.5 pr-6 py-1 rounded-lg border transition-all cursor-pointer focus:outline-none ${
                            item.condition === 'Clean'
                              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25'
                              : item.condition === 'Dirty'
                              ? 'bg-rose-500/15 text-rose-400 border-rose-500/30 hover:bg-rose-500/25'
                              : 'bg-amber-500/15 text-amber-400 border-amber-500/30 hover:bg-amber-500/25'
                          }`}
                        >
                          <option value="Clean" className="bg-[#1e293b] text-emerald-400">Clean</option>
                          <option value="Dirty" className="bg-[#1e293b] text-rose-400">Dirty</option>
                          <option value="Inspected" className="bg-[#1e293b] text-teal-400">Inspected</option>
                          <option value="Out of Order" className="bg-[#1e293b] text-amber-400">Out of Order</option>
                        </select>
                        <ChevronDown className="w-3 h-3 text-slate-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </td>

                    {/* 4. Unit Status (Occupied / Vacant) */}
                    <td className="p-3.5">
                      <span
                        className={`font-semibold ${
                          item.unitStatus === 'Occupied' ? 'text-sky-400' : 'text-slate-400'
                        }`}
                      >
                        {item.unitStatus}
                      </span>
                    </td>

                    {/* 5. Arrival Time */}
                    <td className="p-3.5 font-mono text-slate-400 text-xs">
                      {item.arrivalTime}
                    </td>

                    {/* 6. Arrival Date */}
                    <td className="p-3.5 font-mono text-slate-300 text-xs">
                      {item.arrivalDate}
                    </td>

                    {/* 7. Departure Date */}
                    <td className="p-3.5 font-mono text-slate-300 text-xs">
                      {item.departureDate}
                    </td>

                    {/* 8. Frontdesk Status */}
                    <td className="p-3.5">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-md text-[11px] font-semibold border ${
                          item.frontdeskStatus === 'Checked-In'
                            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                            : item.frontdeskStatus === 'Checked-Out'
                            ? 'bg-slate-800 text-slate-300 border-slate-700'
                            : item.frontdeskStatus === 'Reserved'
                            ? 'bg-sky-500/15 text-sky-300 border-sky-500/30'
                            : 'bg-slate-900/60 text-slate-500 border-slate-800'
                        }`}
                      >
                        {item.frontdeskStatus}
                      </span>
                    </td>

                    {/* 9. Assigned to (Interactive Dropdown matching screenshot) */}
                    <td className="p-3.5">
                      <div className="relative inline-block min-w-[130px]">
                        <select
                          value={item.assignedTo}
                          onChange={(e) => handleAssignChange(item.id, e.target.value)}
                          className="w-full appearance-none bg-[#1e293b]/70 hover:bg-[#1e293b] border border-slate-700 rounded-lg pl-2.5 pr-6 py-1 text-xs text-slate-200 font-medium focus:outline-none focus:ring-1 focus:ring-[#00b894] cursor-pointer transition-colors"
                        >
                          <option value="Unassigned" className="bg-[#1e293b] text-slate-400">Unassigned</option>
                          {staffList.map((s) => (
                            <option key={s.id} value={s.name} className="bg-[#1e293b] text-white">
                              {s.name}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-3 h-3 text-slate-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </td>

                    {/* 10. Do Not Disturb (Interactive Toggle Switch matching screenshot) */}
                    <td className="p-3.5 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggleDnd(item.id, item.doNotDisturb)}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            item.doNotDisturb ? 'bg-[#0284c7]' : 'bg-slate-700'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                              item.doNotDisturb ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                        <span className={`text-[11px] font-semibold ${item.doNotDisturb ? 'text-[#0284c7]' : 'text-slate-400'}`}>
                          {item.doNotDisturb ? 'Yes' : 'No'}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modals ── */}
      <HousekeepersModal
        isOpen={isHousekeepersModalOpen}
        onClose={() => setIsHousekeepersModalOpen(false)}
        staffList={staffList}
        rooms={rooms}
        assignedMap={assignedMap}
      />

      <LearnToUseModal
        isOpen={isLearnOpen}
        onClose={() => setIsLearnOpen(false)}
      />
    </div>
  );
}
