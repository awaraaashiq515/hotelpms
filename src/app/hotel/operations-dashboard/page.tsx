'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  RotateCcw,
  Printer,
  Plus,
  Play,
  Calendar,
  Loader2,
  Building2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { KpiCardsRow, KpiStats } from '@/components/hotel/operations/KpiCardsRow';
import { ReservationWidget, ReservationItem } from '@/components/hotel/operations/ReservationWidget';
import { TodayActivityWidget } from '@/components/hotel/operations/TodayActivityWidget';
import { FourteenDayOutlook } from '@/components/hotel/operations/FourteenDayOutlook';
import { QuickNotesModal } from '@/components/hotel/operations/QuickNotesModal';
import { QuickReservationModal } from '@/components/hotel/operations/QuickReservationModal';
import { LearnToUseModal } from '@/components/hotel/operations/LearnToUseModal';
import { GuestRegistrationCardModal } from '@/components/hotel/operations/GuestRegistrationCardModal';
import { ReservationDetailDrawer } from '@/components/hotel/calendar/ReservationDetailDrawer';
import { printDailyOperationsManifest } from '@/lib/hotel-print-utils';

export default function HotelOperationsDashboard() {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const [selectedBookingForDrawer, setSelectedBookingForDrawer] = useState<any | null>(null);
  const [activeReservationForNotes, setActiveReservationForNotes] = useState<ReservationItem | null>(null);
  const [activeReservationForPrint, setActiveReservationForPrint] = useState<ReservationItem | null>(null);
  const [isNewResModalOpen, setIsNewResModalOpen] = useState(false);
  const [isLearnModalOpen, setIsLearnModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Fetch real data from dedicated API
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/hotel/operations-dashboard');
      const json = await res.json();
      if (json.success) {
        setDashboardData(json.data);
      } else {
        setError(json.message || 'Unable to load hotel operations data.');
      }
    } catch (err: any) {
      console.error('Operations dashboard load error:', err);
      setError('Connection error while fetching live operations data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Handler to open booking details drawer
  const handleOpenBookingDetails = (item: any) => {
    if (!item) return;
    const bookingObj = item.booking || item;
    setSelectedBookingForDrawer(bookingObj);
  };

  // Real Check-In Handler
  const handleCheckIn = async (resItem: any) => {
    try {
      const gName = resItem.guestName || (resItem.guest ? `${resItem.guest.firstName || ''} ${resItem.guest.lastName || ''}`.trim() : 'Guest');
      showToast(`Processing check-in for ${gName}...`);
      const payload = {
        reservationId: resItem.id,
        guestId: resItem.guestId || resItem.guest?.id,
        roomId: resItem.assignedRoomId || resItem.rooms?.[0]?.roomId,
        expectedCheckoutAt: resItem.departureDate || new Date(Date.now() + 86400000).toISOString(),
      };

      const res = await fetch('/api/hotel/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        showToast(`✓ Check-in successful for ${gName}!`);
        fetchDashboardData();
        setSelectedBookingForDrawer(null);
      } else {
        // Fallback: update status to CHECKED_IN directly on reservation
        const patchRes = await fetch('/api/hotel/bookings', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: resItem.id, status: 'CHECKED_IN' }),
        });
        const patchData = await patchRes.json();
        if (patchData.success) {
          showToast(`✓ Checked in: ${gName}`);
          fetchDashboardData();
          setSelectedBookingForDrawer(null);
        } else {
          showToast(`Check-in notice: ${data.message || patchData.message}`);
        }
      }
    } catch (err) {
      console.error(err);
      showToast('Error executing check-in.');
    }
  };

  // Real Check-Out Handler
  const handleCheckOut = async (b: any) => {
    try {
      const gName = b.guestName || (b.guest ? `${b.guest.firstName || ''} ${b.guest.lastName || ''}`.trim() : 'Guest');
      showToast(`Processing checkout for ${gName}...`);
      const res = await fetch('/api/hotel/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reservationId: b.id }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`✓ Check-out successful for ${gName}!`);
        fetchDashboardData();
        setSelectedBookingForDrawer(null);
      } else {
        // Fallback: update status to CHECKED_OUT directly on reservation
        const patchRes = await fetch('/api/hotel/bookings', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: b.id, status: 'CHECKED_OUT' }),
        });
        const patchData = await patchRes.json();
        if (patchData.success) {
          showToast(`✓ Checked out: ${gName}`);
          fetchDashboardData();
          setSelectedBookingForDrawer(null);
        } else {
          showToast(`Checkout notice: ${data.message || patchData.message}`);
        }
      }
    } catch (err) {
      console.error(err);
      showToast('Error processing checkout.');
    }
  };

  // Real Print Handler for Individual Guest (GRC / Folio Voucher)
  const handlePrint = (resItem: any) => {
    const formatted: ReservationItem = {
      id: resItem.id,
      guestId: resItem.guestId || resItem.guest?.id,
      guestName: resItem.guest
        ? `${((resItem.guest as any).name || (resItem.guest.firstName || '') + ' ' + (resItem.guest.lastName || '')).trim()}` || resItem.guestName || 'Guest'
        : resItem.guestName || 'Guest',
      guestFirstName: resItem.guest?.firstName || resItem.guestFirstName || '',
      guestLastName: resItem.guest?.lastName || resItem.guestLastName || '',
      guestMobile: resItem.guest?.mobile || resItem.guestMobile || '',
      guestEmail: resItem.guest?.email || resItem.guestEmail || '',
      guestAddress: resItem.guest?.address || resItem.guestAddress || '',
      guestIdType: resItem.guest?.idType || resItem.guestIdType || 'Aadhaar Card',
      guestIdNumber: resItem.guest?.idNumber || resItem.guestIdNumber || 'Verified ID',
      guestNationality: resItem.guest?.nationality || resItem.guestNationality || 'Indian',
      companyName: resItem.companyName || resItem.source || 'Direct Front Desk',
      gstNumber: resItem.gstNumber || '',
      reservationNumber: resItem.bookingNo || resItem.reservationNumber || 'N/A',
      unitNumber: resItem.rooms?.[0]?.room?.roomNumber || resItem.unitNumber || 'Unassigned',
      assignedRoomId: resItem.assignedRoomId || resItem.rooms?.[0]?.roomId,
      roomTypeName: resItem.roomType?.name || resItem.roomTypeName || 'Standard Room',
      status: resItem.status || 'CONFIRMED',
      arrivalDate: resItem.arrivalDate,
      departureDate: resItem.departureDate,
      nights: resItem.nights,
      ratePerNight: resItem.ratePerNight,
      adults: resItem.adults || 1,
      children: resItem.children || 0,
      mealPlan: resItem.mealPlan || 'RO',
      totalAmount: resItem.totalAmount || 0,
      advanceAmount: resItem.advanceAmount || 0,
      dueAmount: resItem.dueAmount || 0,
      notes: resItem.addOnNotes || resItem.notes || '',
      source: resItem.companyName || resItem.source || 'Direct',
    };
    setActiveReservationForPrint(formatted);
  };

  // Real Print Handler for Front Desk Daily Operations Manifest
  const handlePrintManifest = (customItems?: ReservationItem[]) => {
    const listToPrint = customItems && customItems.length > 0 
      ? customItems 
      : [
          ...(dashboardData?.reservations?.inHouse || []),
          ...(dashboardData?.reservations?.arrivals || []),
          ...(dashboardData?.reservations?.departures || []),
        ];
    printDailyOperationsManifest(
      listToPrint,
      dashboardData?.property?.name || 'Hotel Operations Desk',
      dashboardData?.property?.currency || '₹'
    );
  };

  // Format today's date dynamically
  const todayFormatted = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date());

  const defaultStats: KpiStats = {
    arrivals: dashboardData?.stats?.arrivals ?? 0,
    departures: dashboardData?.stats?.departures ?? 0,
    unitsBooked: dashboardData?.stats?.unitsBooked ?? 0,
    occupancyPercent: dashboardData?.stats?.occupancyPercent ?? 0,
    averageDailyRate: dashboardData?.stats?.averageDailyRate ?? 0,
    currency: dashboardData?.stats?.currency ?? '₹',
  };

  return (
    <div className="min-h-screen bg-[#080d1a] text-white p-4 sm:p-6 lg:p-8 font-sans antialiased">
      {/* ── Toast Alert ── */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-[#0f172a] text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 border border-slate-700 animate-in slide-in-from-top-2">
          <span className="w-2 h-2 rounded-full bg-[#00b894] animate-pulse"></span>
          {toastMessage}
        </div>
      )}

      {/* ── Top Header Bar ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
        {/* Left: Title + Learn to Use + Breadcrumb */}
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-[28px] font-bold text-white tracking-tight">
              Dashboard
            </h1>
            <button
              onClick={() => setIsLearnModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-[#00b894] border border-[#00b894]/40 bg-[#00b894]/10 hover:bg-[#00b894]/20 transition-colors shadow-2xs cursor-pointer"
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
            <span className="text-slate-300 font-medium">Dashboard</span>
            {dashboardData?.property?.name && (
              <>
                <span>•</span>
                <span className="text-indigo-400 font-medium flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5" />
                  {dashboardData.property.name}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Right: Actions (Refresh, Print, Create New Reservation) */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Refresh Button */}
          <button
            onClick={() => fetchDashboardData()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-sky-400 border border-sky-500/30 bg-sky-500/10 hover:bg-sky-500/20 transition-colors shadow-2xs cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-sky-400" />
            <span>Refresh</span>
          </button>

          {/* Print Button */}
          <button
            onClick={() => handlePrintManifest()}
            title="Print Daily Operations Manifest"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-sky-400 border border-sky-500/30 bg-sky-500/10 hover:bg-sky-500/20 transition-colors shadow-2xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-sky-400" />
            <span>Print Manifest</span>
          </button>

          {/* Create New Reservation Button */}
          <button
            onClick={() => setIsNewResModalOpen(true)}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#00b894] hover:bg-[#00a884] active:scale-[0.98] transition-all shadow-lg shadow-[#00b894]/20 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create New Reservation</span>
          </button>
        </div>
      </div>

      {/* ── Date Heading Bar ── */}
      <div className="py-4 flex items-center justify-between">
        <div className="inline-flex items-center gap-2 text-base sm:text-lg font-bold text-white tracking-tight">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span>{todayFormatted}</span>
        </div>
        {loading && (
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#00b894]" />
            <span>Syncing database...</span>
          </div>
        )}
      </div>

      {error ? (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2 mb-6">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
          <button
            onClick={fetchDashboardData}
            className="ml-auto underline font-semibold text-white"
          >
            Retry
          </button>
        </div>
      ) : null}

      {/* ── KPI Stat Cards (4 Cards Grid) ── */}
      <div className="pb-6">
        <KpiCardsRow stats={defaultStats} />
      </div>

      {/* ── Two-Column Operational Widgets (Reservation & Today's Activity) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-6">
        {/* Left Column: Reservation Console */}
        <ReservationWidget
          reservations={dashboardData?.reservations || { arrivals: [], departures: [], stayovers: [], inHouse: [], balanceDue: [] }}
          onRefresh={fetchDashboardData}
          onAddNote={(res) => setActiveReservationForNotes(res)}
          onCheckIn={handleCheckIn}
          onPrint={handlePrint}
          onPrintList={(items) => handlePrintManifest(items)}
          onSelectReservation={(res) => handleOpenBookingDetails(res)}
        />

        {/* Right Column: Today's Activity */}
        <TodayActivityWidget
          activityData={dashboardData?.activity || { sales: [], cancellations: [], bookedTodayCount: 0, unitNights: 0, todayRevenue: 0 }}
          currency={dashboardData?.property?.currency || '₹'}
          onRefresh={fetchDashboardData}
          onRowClick={(act) => handleOpenBookingDetails(act)}
        />
      </div>

      {/* ── Bottom Section: 14 Days Outlook ── */}
      <div className="pb-10">
        <FourteenDayOutlook
          forecastData={dashboardData?.outlook || []}
          currency={dashboardData?.property?.currency || '₹'}
        />
      </div>

      {/* ── Modals & Drawers ── */}
      <ReservationDetailDrawer
        booking={selectedBookingForDrawer}
        roomsList={dashboardData?.roomsList || []}
        currency={dashboardData?.property?.currency || '₹'}
        onClose={() => setSelectedBookingForDrawer(null)}
        onCheckIn={handleCheckIn}
        onCheckOut={handleCheckOut}
        onPrint={handlePrint}
        onUpdated={() => {
          fetchDashboardData();
        }}
      />

      <QuickNotesModal
        reservation={activeReservationForNotes}
        onClose={() => setActiveReservationForNotes(null)}
        onSaved={() => {
          showToast('Guest notes updated successfully in database!');
          fetchDashboardData();
        }}
      />

      <QuickReservationModal
        isOpen={isNewResModalOpen}
        roomsList={dashboardData?.roomsList || []}
        onClose={() => setIsNewResModalOpen(false)}
        onCreated={() => {
          showToast('✓ Real booking created successfully!');
          fetchDashboardData();
        }}
      />

      <LearnToUseModal
        isOpen={isLearnModalOpen}
        onClose={() => setIsLearnModalOpen(false)}
      />

      <GuestRegistrationCardModal
        isOpen={!!activeReservationForPrint}
        reservation={activeReservationForPrint}
        property={dashboardData?.property || null}
        onClose={() => setActiveReservationForPrint(null)}
      />
    </div>
  );
}
