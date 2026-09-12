'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  LogIn,
  LogOut,
  Printer,
  FileText,
  Check,
  Loader2,
  User,
  Calendar,
  Bed,
  CreditCard,
  Shield,
  Phone,
  Mail,
  Users,
  ExternalLink,
  CalendarPlus,
  Sparkles,
  ArrowRight,
  Clock,
  AlertCircle,
  ChevronRight,
  Building2,
  UtensilsCrossed,
  Receipt,
  ShoppingBag,
} from 'lucide-react';
import Link from 'next/link';

interface ReservationDetailDrawerProps {
  booking: any | null;
  currency?: string;
  roomsList?: any[];
  onClose: () => void;
  onCheckIn?: (b: any) => void;
  onCheckOut?: (b: any) => void;
  onPrint?: (b: any) => void;
  onUpdated?: () => void;
}

export function ReservationDetailDrawer({
  booking,
  currency = '₹',
  roomsList,
  onClose,
  onCheckIn,
  onCheckOut,
  onPrint,
  onUpdated,
}: ReservationDetailDrawerProps) {
  const [notes, setNotes] = useState(booking?.addOnNotes || booking?.notes || '');
  const [savingNotes, setSavingNotes] = useState(false);

  // Banner message state
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Extend Stay Panel State
  const [showExtendPanel, setShowExtendPanel] = useState(false);
  const [extendMode, setExtendMode] = useState<'checkout' | 'checkin'>('checkout');
  const [newDepDate, setNewDepDate] = useState('');
  const [newArrDate, setNewArrDate] = useState('');
  const [extraCharge, setExtraCharge] = useState<number | string>(0);
  const [extending, setExtending] = useState(false);

  // Room Upgrade Panel State
  const [showUpgradePanel, setShowUpgradePanel] = useState(false);
  const [availableRooms, setAvailableRooms] = useState<any[]>(roomsList || []);
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [upgradeCost, setUpgradeCost] = useState<number | string>(0);
  const [upgrading, setUpgrading] = useState(false);

  // Restaurant & Food Bills State
  const [showRestaurantModal, setShowRestaurantModal] = useState(false);
  const [foodData, setFoodData] = useState<{
    orders: any[];
    transactions: any[];
    summary: {
      totalRestaurantBill: number;
      totalRoomCharges: number;
      totalOrdersCount: number;
      grandTotalWithFood: number;
    };
  } | null>(null);
  const [loadingFoodData, setLoadingFoodData] = useState(false);

  // Fetch restaurant & folio bills for this booking
  const fetchFoodData = async () => {
    if (!booking?.id) return;
    try {
      setLoadingFoodData(true);
      const res = await fetch(`/api/hotel/folios?reservationId=${booking.id}`);
      const json = await res.json();
      if (json.success && json.data) {
        setFoodData({
          orders: json.data.orders || [],
          transactions: json.data.transactions || [],
          summary: json.data.summary || {
            totalRestaurantBill: 0,
            totalRoomCharges: 0,
            totalOrdersCount: 0,
            grandTotalWithFood: Number(booking.totalAmount) || 0,
          },
        });
      }
    } catch (err) {
      console.error('Error fetching food bills:', err);
    } finally {
      setLoadingFoodData(false);
    }
  };

  // Helper to add days to ISO date string
  const addDays = (dateStr: string, days: number) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  };

  const curDepStr = booking?.departureDate
    ? new Date(booking.departureDate).toISOString().split('T')[0]
    : '';
  const curArrStr = booking?.arrivalDate
    ? new Date(booking.arrivalDate).toISOString().split('T')[0]
    : '';

  useEffect(() => {
    if (booking) {
      setNotes(booking?.addOnNotes || booking?.notes || '');
      const depIso = booking.departureDate ? new Date(booking.departureDate).toISOString().split('T')[0] : '';
      const arrIso = booking.arrivalDate ? new Date(booking.arrivalDate).toISOString().split('T')[0] : '';
      setNewDepDate(addDays(depIso, 1));
      setNewArrDate(arrIso);
      setSelectedRoomId('');
      setUpgradeCost(0);
      setShowExtendPanel(false);
      setShowUpgradePanel(false);
      setShowRestaurantModal(false);
      setBanner(null);
      fetchFoodData();
    }
  }, [booking]);

  // Fetch rooms list if not provided
  useEffect(() => {
    if (roomsList && roomsList.length > 0) {
      setAvailableRooms(roomsList);
    } else {
      fetch('/api/hotel/rooms')
        .then((res) => res.json())
        .then((data) => {
          if (data.success && Array.isArray(data.data)) {
            setAvailableRooms(
              data.data.map((r: any) => ({
                id: r.id,
                roomNumber: r.roomNumber,
                status: r.status,
                roomTypeName: r.roomType?.name || 'Standard Room',
                roomTypeId: r.roomTypeId,
                baseRate: r.roomType?.baseRate || 3000,
              }))
            );
          }
        })
        .catch(() => null);
    }
  }, [roomsList]);

  // Close drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showRestaurantModal) {
          setShowRestaurantModal(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, showRestaurantModal]);

  if (!booking) return null;

  const guestName = booking.guest
    ? `${((booking.guest as any).name || (booking.guest.firstName || '') + ' ' + (booking.guest.lastName || '')).trim()}` || booking.guestName || 'Guest'
    : booking.guestName || 'Guest';

  const guestMobile = booking.guest?.mobile || booking.guestMobile || null;
  const guestEmail = booking.guest?.email || booking.guestEmail || null;

  const currentRoomId = booking.rooms?.[0]?.roomId || booking.assignedRoomId;
  const roomNo = booking.rooms?.[0]?.room?.roomNumber || booking.unitNumber || booking.assignedRoomId || 'Unassigned';
  const roomTypeName = booking.roomType?.name || booking.roomTypeName || 'Standard Room';

  const arrDateStr = booking.arrivalDate
    ? new Date(booking.arrivalDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : 'N/A';
  const depDateStr = booking.departureDate
    ? new Date(booking.departureDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : 'N/A';

  const nights = booking.nights || (booking.arrivalDate && booking.departureDate
    ? Math.max(1, Math.round((new Date(booking.departureDate).getTime() - new Date(booking.arrivalDate).getTime()) / (1000 * 60 * 60 * 24)))
    : 1);

  const ratePerNight = Number(booking.ratePerNight) || (
    booking.totalAmount && nights > 0
      ? Math.round(Number(booking.totalAmount) / nights)
      : 3000
  );

  const adults = booking.adults ?? 1;
  const children = booking.children ?? 0;
  const bookingNo = booking.bookingNo || booking.reservationNumber || booking.id?.slice(0, 8) || 'N/A';

  // Calculate extra nights for stay extension
  const extraNights = newDepDate && curDepStr
    ? Math.max(0, Math.round((new Date(newDepDate).getTime() - new Date(curDepStr).getTime()) / 86400000))
    : 0;

  const handleQuickAddDays = (days: number) => {
    const nextDate = addDays(curDepStr, days);
    setNewDepDate(nextDate);
    setExtraCharge(days * ratePerNight);
  };

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    try {
      const res = await fetch('/api/hotel/bookings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: booking.id,
          addOnNotes: notes,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setBanner({ type: 'success', text: 'Notes updated successfully!' });
        setTimeout(() => setBanner(null), 3000);
        onUpdated?.();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingNotes(false);
    }
  };

  // Submit Stay Extension / Date Change
  const handleExtendStaySubmit = async () => {
    if (extendMode === 'checkout' && (!newDepDate || extraNights <= 0)) {
      setBanner({ type: 'error', text: 'Please choose a future checkout date to extend.' });
      return;
    }
    if (extendMode === 'checkin' && !newArrDate) {
      setBanner({ type: 'error', text: 'Please choose a valid check-in date.' });
      return;
    }

    setExtending(true);
    try {
      const payload: any = { id: booking.id };
      if (extendMode === 'checkout') {
        payload.departureDate = new Date(newDepDate + 'T11:00:00.000Z').toISOString();
        payload.extraCharge = Number(extraCharge) || 0;
      } else {
        payload.arrivalDate = new Date(newArrDate + 'T12:00:00.000Z').toISOString();
      }

      const res = await fetch('/api/hotel/bookings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setBanner({
          type: 'success',
          text: extendMode === 'checkout'
            ? `✓ Booking extended by ${extraNights} night(s)!`
            : '✓ Check-in date rescheduled successfully!',
        });
        setShowExtendPanel(false);
        setTimeout(() => setBanner(null), 3500);
        onUpdated?.();
      } else {
        setBanner({ type: 'error', text: data.message || 'Failed to update dates.' });
      }
    } catch (err) {
      console.error(err);
      setBanner({ type: 'error', text: 'Network connection error.' });
    } finally {
      setExtending(false);
    }
  };

  // Submit Room Upgrade / Change
  const handleRoomUpgradeSubmit = async () => {
    if (!selectedRoomId) {
      setBanner({ type: 'error', text: 'Please select a room to upgrade/transfer to.' });
      return;
    }

    setUpgrading(true);
    try {
      const res = await fetch('/api/hotel/bookings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: booking.id,
          assignedRoomId: selectedRoomId,
          upgradeCharge: Number(upgradeCost) || 0,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setBanner({ type: 'success', text: '✓ Room upgraded / assigned successfully!' });
        setShowUpgradePanel(false);
        setTimeout(() => setBanner(null), 3500);
        onUpdated?.();
      } else {
        setBanner({ type: 'error', text: data.message || 'Failed to upgrade room.' });
      }
    } catch (err) {
      console.error(err);
      setBanner({ type: 'error', text: 'Network connection error.' });
    } finally {
      setUpgrading(false);
    }
  };

  // Direct Print Function for Food & Beverage Statement
  const handlePrintRestaurantBill = () => {
    const printWin = window.open('', '_blank', 'width=800,height=900');
    if (!printWin) {
      alert('Please allow popups to print restaurant bills.');
      return;
    }

    const hotelName = booking.property?.name || 'Grand Luxury Hotel';
    const ordersList = foodData?.orders || [];
    const totalFood = foodData?.summary?.totalRestaurantBill || 0;

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Restaurant Bill - ${bookingNo}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 28px; color: #0f172a; }
          .header { text-align: center; border-bottom: 2px dashed #94a3b8; padding-bottom: 16px; margin-bottom: 16px; }
          .title { font-size: 20px; font-weight: 800; text-transform: uppercase; margin: 0; }
          .sub { font-size: 12px; color: #64748b; margin-top: 4px; }
          .meta { display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 16px; border-bottom: 1px solid #e2e8f0; padding-bottom: 12px; }
          .order-box { border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px; margin-bottom: 12px; }
          .order-header { display: flex; justify-content: space-between; font-size: 13px; font-weight: bold; border-bottom: 1px solid #f1f5f9; padding-bottom: 6px; margin-bottom: 6px; }
          table { width: 100%; font-size: 12px; border-collapse: collapse; }
          th { text-align: left; color: #64748b; padding: 5px 0; font-size: 11px; }
          td { padding: 5px 0; }
          .total-box { margin-top: 20px; border-top: 2px solid #0f172a; padding-top: 12px; font-size: 14px; font-weight: bold; display: flex; justify-content: space-between; }
          @media print { button { display: none; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 class="title">${hotelName}</h1>
          <div class="sub">Food & Beverage Statement / Restaurant Bill</div>
        </div>
        <div class="meta">
          <div>
            <strong>Guest:</strong> ${guestName}<br/>
            <strong>Assigned Room:</strong> Room ${roomNo}<br/>
            <strong>Contact:</strong> ${guestMobile || 'N/A'}
          </div>
          <div style="text-align: right;">
            <strong>Booking Ref:</strong> ${bookingNo}<br/>
            <strong>Date:</strong> ${new Date().toLocaleDateString('en-GB')}<br/>
            <strong>Printed At:</strong> ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>

        ${ordersList.length === 0 ? '<p style="text-align:center; color:#94a3b8; padding:30px;">No restaurant or room service orders recorded for this booking.</p>' : ordersList.map((o: any) => `
          <div class="order-box">
            <div class="order-header">
              <span>Order #${o.orderNo} • ${o.outlet?.name || o.orderType?.replace('_', ' ') || 'Restaurant'}</span>
              <span>₹ ${(o.grandTotal || 0).toLocaleString('en-IN')}</span>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Item Name</th>
                  <th style="text-align: center;">Qty</th>
                  <th style="text-align: right;">Rate</th>
                  <th style="text-align: right;">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${(o.items || []).map((it: any) => `
                  <tr>
                    <td>${it.product?.name || 'Dish Item'}</td>
                    <td style="text-align: center;">${it.quantity}</td>
                    <td style="text-align: right;">₹ ${(it.unitPrice || 0).toLocaleString('en-IN')}</td>
                    <td style="text-align: right;">₹ ${(it.totalAmount || (it.unitPrice * it.quantity)).toLocaleString('en-IN')}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <div style="text-align: right; font-size: 11px; color: #64748b; margin-top: 6px; border-top: 1px dashed #e2e8f0; padding-top: 4px;">
              Subtotal: ₹ ${o.subtotal || o.grandTotal} | Taxes/GST: ₹ ${o.taxAmount || 0}
            </div>
          </div>
        `).join('')}

        <div class="total-box">
          <span>TOTAL FOOD & BEVERAGE CHARGES:</span>
          <span>₹ ${totalFood.toLocaleString('en-IN')}</span>
        </div>
        <div style="text-align: center; margin-top: 30px; font-size: 11px; color: #94a3b8;">
          Thank you for dining with us!
        </div>
      </body>
      </html>
    `);
    printWin.document.close();
    setTimeout(() => {
      printWin.focus();
      printWin.print();
    }, 400);
  };

  const totalFoodBill = foodData?.summary?.totalRestaurantBill || 0;
  const foodOrdersCount = foodData?.summary?.totalOrdersCount || 0;
  const grandCombinedTotal = (Number(booking.totalAmount) || 0) + totalFoodBill;
  const netDueBalance = (Number(booking.dueAmount) || 0) + totalFoodBill;

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'CHECKED_IN':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'CONFIRMED':
        return 'bg-sky-500/15 text-sky-400 border-sky-500/30';
      case 'PENDING':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case 'CHECKED_OUT':
        return 'bg-slate-700/50 text-slate-300 border-slate-600';
      case 'CANCELLED':
        return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center sm:justify-end bg-black/75 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-[#0f172a] sm:h-full max-w-md w-full p-5 sm:p-6 shadow-2xl border-l border-slate-800 text-white relative flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-250"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Content */}
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-md border ${getStatusColor(booking.status)}`}>
                {booking.status || 'CONFIRMED'}
              </span>
              <span className="text-xs font-mono font-bold text-slate-400">
                {bookingNo}
              </span>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              title="Close (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Banner alert notification */}
          {banner && (
            <div
              className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 border animate-in slide-in-from-top-1 ${
                banner.type === 'success'
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                  : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
              }`}
            >
              {banner.type === 'success' ? <Check className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
              <span>{banner.text}</span>
            </div>
          )}

          {/* Guest Card */}
          <div className="p-4 rounded-xl bg-[#1e293b]/50 border border-slate-800 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-base shrink-0">
                {guestName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-bold text-white truncate">{guestName}</h3>
                <div className="flex flex-col gap-0.5 mt-0.5 text-xs text-slate-400">
                  {guestMobile && (
                    <div className="flex items-center gap-1.5 truncate">
                      <Phone className="w-3 h-3 text-slate-500 shrink-0" />
                      <span className="truncate">{guestMobile}</span>
                    </div>
                  )}
                  {guestEmail && (
                    <div className="flex items-center gap-1.5 truncate">
                      <Mail className="w-3 h-3 text-slate-500 shrink-0" />
                      <span className="truncate">{guestEmail}</span>
                    </div>
                  )}
                  {!guestMobile && !guestEmail && (
                    <span className="text-slate-500 text-[11px]">No contact info provided</span>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2.5 border-t border-slate-800 text-xs">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 block font-semibold text-[10px] uppercase">Assigned Room</span>
                  {/* Room Upgrade Button Trigger */}
                  <button
                    onClick={() => {
                      setShowUpgradePanel(!showUpgradePanel);
                      setShowExtendPanel(false);
                    }}
                    className="text-[10px] font-bold text-[#00b894] hover:text-[#00a884] flex items-center gap-0.5 bg-[#00b894]/10 hover:bg-[#00b894]/20 px-1.5 py-0.5 rounded border border-[#00b894]/30 transition-all cursor-pointer"
                    title="Upgrade or change assigned room"
                  >
                    <Sparkles className="w-2.5 h-2.5 text-[#00b894]" />
                    <span>Upgrade</span>
                  </button>
                </div>
                <span className="font-bold text-white text-sm">Room {roomNo}</span>
                <span className="text-[10px] text-slate-400 block truncate">{roomTypeName}</span>
              </div>
              <div>
                <span className="text-slate-500 block font-semibold text-[10px] uppercase">Booking Source</span>
                <span className="font-bold text-slate-200 truncate block">{booking.companyName || booking.source || 'Direct Front Desk'}</span>
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Users className="w-2.5 h-2.5" />
                  {adults} Adult{adults !== 1 ? 's' : ''}{children > 0 ? `, ${children} Ch.` : ''}
                </span>
              </div>
            </div>

            {/* ── Inline Room Upgrade Panel ── */}
            {showUpgradePanel && (
              <div className="mt-3 p-3 rounded-xl bg-slate-900 border border-slate-700/80 space-y-3 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                    <Sparkles className="w-3.5 h-3.5 text-[#00b894]" />
                    <span>Upgrade / Change Room</span>
                  </div>
                  <button
                    onClick={() => setShowUpgradePanel(false)}
                    className="text-slate-500 hover:text-slate-300 p-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-400 uppercase">
                    Select New Room
                  </label>
                  <select
                    value={selectedRoomId}
                    onChange={(e) => {
                      const rId = e.target.value;
                      setSelectedRoomId(rId);
                      const targetRoom = availableRooms.find((r) => r.id === rId);
                      if (targetRoom) {
                        const curBase = ratePerNight;
                        const diff = Math.max(0, ((targetRoom.baseRate || curBase) - curBase) * nights);
                        setUpgradeCost(diff);
                      }
                    }}
                    className="w-full bg-[#1e293b] border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#00b894]"
                  >
                    <option value="">-- Select Available Room --</option>
                    {availableRooms.map((r) => {
                      const isCurrent = r.id === currentRoomId || r.roomNumber === roomNo;
                      return (
                        <option key={r.id} value={r.id} disabled={isCurrent}>
                          Room {r.roomNumber} • {r.roomTypeName} ({currency}{r.baseRate || 3000}/nt) {r.status === 'AVAILABLE' ? '• Available' : `• [${r.status}]`} {isCurrent ? '(Current)' : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-400 uppercase flex items-center justify-between">
                    <span>Upgrade Surcharge Amount ({currency})</span>
                    <span className="text-slate-500 lowercase">0 for complimentary</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={upgradeCost}
                    onChange={(e) => setUpgradeCost(Math.max(0, Number(e.target.value)))}
                    className="w-full bg-[#1e293b] border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#00b894]"
                    placeholder="0"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={handleRoomUpgradeSubmit}
                    disabled={upgrading || !selectedRoomId}
                    className="flex-1 py-1.5 bg-[#00b894] hover:bg-[#00a884] disabled:opacity-50 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  >
                    {upgrading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                    <span>{upgrading ? 'Upgrading...' : 'Confirm Room Upgrade'}</span>
                  </button>
                  <button
                    onClick={() => setShowUpgradePanel(false)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Stay Timeline & Financial Details */}
          <div className="p-4 rounded-xl bg-[#1e293b]/40 border border-slate-800 space-y-2.5 text-xs">
            <div className="flex items-center justify-between pb-1 border-b border-slate-800/80">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Stay Timeline
              </span>
              {/* Extend Stay Button Trigger */}
              <button
                onClick={() => {
                  setShowExtendPanel(!showExtendPanel);
                  setShowUpgradePanel(false);
                }}
                className="text-[10px] font-bold text-sky-400 hover:text-sky-300 flex items-center gap-1 bg-sky-500/10 hover:bg-sky-500/20 px-2 py-0.5 rounded border border-sky-500/30 transition-all cursor-pointer"
                title="Extend stay or reschedule dates"
              >
                <CalendarPlus className="w-2.5 h-2.5 text-sky-400" />
                <span>Extend / Change Dates</span>
              </button>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">Check-In:</span>
              <strong className="text-white">{arrDateStr}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Check-Out:</span>
              <strong className="text-white">{depDateStr}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Duration:</span>
              <strong className="text-slate-300">{nights} Night{nights !== 1 ? 's' : ''}</strong>
            </div>

            {/* ── Inline Extend Stay & Date Change Panel ── */}
            {showExtendPanel && (
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-700/80 space-y-3 animate-in fade-in slide-in-from-top-2 my-2">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                    <CalendarPlus className="w-3.5 h-3.5 text-sky-400" />
                    <span>Extend Stay / Change Dates</span>
                  </div>
                  <button
                    onClick={() => setShowExtendPanel(false)}
                    className="text-slate-500 hover:text-slate-300 p-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Sub-tabs: Extend Checkout vs Reschedule Check-In */}
                <div className="grid grid-cols-2 gap-1 p-0.5 bg-slate-800/80 rounded-lg text-[11px] font-semibold">
                  <button
                    onClick={() => setExtendMode('checkout')}
                    className={`py-1 rounded-md transition-colors ${
                      extendMode === 'checkout' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Extend Check-Out (+Nights)
                  </button>
                  <button
                    onClick={() => setExtendMode('checkin')}
                    className={`py-1 rounded-md transition-colors ${
                      extendMode === 'checkin' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Reschedule Check-In
                  </button>
                </div>

                {extendMode === 'checkout' ? (
                  <>
                    {/* Quick +1, +2, +3, +7 Nights Pills */}
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 block mb-1.5 uppercase">
                        Quick Add Nights:
                      </span>
                      <div className="grid grid-cols-4 gap-1.5">
                        {[1, 2, 3, 7].map((num) => (
                          <button
                            key={num}
                            onClick={() => handleQuickAddDays(num)}
                            className="py-1 px-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-sky-400 font-bold text-xs transition-colors cursor-pointer"
                          >
                            +{num} {num === 1 ? 'Night' : 'Nights'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* New Checkout Date Input */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-slate-400 uppercase flex items-center justify-between">
                        <span>New Check-Out Date</span>
                        {extraNights > 0 && (
                          <span className="text-emerald-400 font-bold">
                            +{extraNights} Night(s) • Total: {nights + extraNights} Nights
                          </span>
                        )}
                      </label>
                      <input
                        type="date"
                        min={curDepStr || undefined}
                        value={newDepDate}
                        onChange={(e) => {
                          const val = e.target.value;
                          setNewDepDate(val);
                          if (curDepStr && val) {
                            const diff = Math.max(0, Math.round((new Date(val).getTime() - new Date(curDepStr).getTime()) / 86400000));
                            setExtraCharge(diff * ratePerNight);
                          }
                        }}
                        className="w-full bg-[#1e293b] border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                      />
                    </div>

                    {/* Additional Charge Input */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-slate-400 uppercase flex items-center justify-between">
                        <span>Additional Surcharge ({currency})</span>
                        <span className="text-slate-500 lowercase">editable (0 for free extension)</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={extraCharge}
                        onChange={(e) => setExtraCharge(Math.max(0, Number(e.target.value)))}
                        className="w-full bg-[#1e293b] border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                        placeholder="0"
                      />
                    </div>

                    {/* Summary badge */}
                    <div className="p-2 rounded-lg bg-slate-800/50 border border-slate-700/60 text-[11px] flex items-center justify-between">
                      <span className="text-slate-400">New Total Charges:</span>
                      <strong className="text-white font-bold">
                        {currency} {((Number(booking.totalAmount) || 0) + (Number(extraCharge) || 0)).toLocaleString('en-IN')}
                      </strong>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Reschedule Check-In Date */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-slate-400 uppercase">
                        New Check-In Date
                      </label>
                      <input
                        type="date"
                        value={newArrDate}
                        onChange={(e) => setNewArrDate(e.target.value)}
                        className="w-full bg-[#1e293b] border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                      />
                    </div>
                  </>
                )}

                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={handleExtendStaySubmit}
                    disabled={extending}
                    className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  >
                    {extending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                    <span>{extending ? 'Updating...' : extendMode === 'checkout' ? 'Confirm Stay Extension' : 'Update Check-In Date'}</span>
                  </button>
                  <button
                    onClick={() => setShowExtendPanel(false)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-1.5 border-t border-slate-800/80">
              <span className="text-slate-400">Room Stay Charges:</span>
              <strong className="text-white font-medium">{currency} {(Number(booking.totalAmount) || 0).toLocaleString('en-IN')}</strong>
            </div>

            {/* Restaurant & Food Bill Row */}
            <div className="flex items-center justify-between py-1 px-2 -mx-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <div className="flex items-center gap-1.5 text-amber-300 font-medium text-xs">
                <UtensilsCrossed className="w-3.5 h-3.5 text-amber-400" />
                <span>Restaurant / Food Bill:</span>
              </div>
              <div className="flex items-center gap-2">
                {loadingFoodData ? (
                  <Loader2 className="w-3 h-3 animate-spin text-amber-400" />
                ) : (
                  <>
                    <strong className="text-amber-400 font-bold">
                      {currency} {totalFoodBill.toLocaleString('en-IN')}
                    </strong>
                    <button
                      onClick={() => setShowRestaurantModal(true)}
                      className="text-[10px] font-bold text-amber-400 hover:text-amber-300 underline bg-amber-500/20 hover:bg-amber-500/30 px-1.5 py-0.5 rounded cursor-pointer transition-colors"
                      title="View itemized food bill"
                    >
                      {foodOrdersCount > 0 ? `${foodOrdersCount} Order${foodOrdersCount > 1 ? 's' : ''}` : 'View Bill'}
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">Combined Total:</span>
              <strong className="text-white font-bold">{currency} {grandCombinedTotal.toLocaleString('en-IN')}</strong>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">Advance Paid:</span>
              <strong className="text-emerald-400 font-medium">{currency} {(Number(booking.advanceAmount) || 0).toLocaleString('en-IN')}</strong>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-slate-800">
              <span className="text-slate-300 font-semibold">Net Balance Due:</span>
              <strong className={`${netDueBalance > 0 ? 'text-rose-400' : 'text-emerald-400'} font-bold text-sm`}>
                {currency} {netDueBalance.toLocaleString('en-IN')}
              </strong>
            </div>
          </div>

          {/* Notes Section */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-semibold text-slate-300">
              Guest Notes & Special Requests
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add special notes, late checkout, dietary preferences..."
              className="w-full bg-[#1e293b]/60 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#00b894] placeholder:text-slate-500"
            ></textarea>
            <button
              onClick={handleSaveNotes}
              disabled={savingNotes}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {savingNotes ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3 text-[#00b894]" />}
              <span>{savingNotes ? 'Saving...' : 'Update Note'}</span>
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-slate-800 space-y-2 mt-4">
          {/* Quick Action Grid: Extend Stay & Upgrade Room buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                setShowExtendPanel(!showExtendPanel);
                setShowUpgradePanel(false);
              }}
              className="py-2 px-2.5 rounded-xl border border-sky-500/30 bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <CalendarPlus className="w-3.5 h-3.5 text-sky-400" />
              <span>Extend Stay</span>
            </button>
            <button
              onClick={() => {
                setShowUpgradePanel(!showUpgradePanel);
                setShowExtendPanel(false);
              }}
              className="py-2 px-2.5 rounded-xl border border-[#00b894]/30 bg-[#00b894]/10 hover:bg-[#00b894]/20 text-emerald-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#00b894]" />
              <span>Upgrade Room</span>
            </button>
          </div>

          {/* Restaurant & Food Bill Action Button */}
          <button
            onClick={() => setShowRestaurantModal(true)}
            className="w-full py-2 px-3 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-bold flex items-center justify-between transition-all cursor-pointer shadow-xs"
          >
            <div className="flex items-center gap-2">
              <UtensilsCrossed className="w-4 h-4 text-amber-400" />
              <span>Restaurant & Food Bill</span>
              {foodOrdersCount > 0 && (
                <span className="px-1.5 py-0.2 bg-amber-500/30 text-amber-200 text-[10px] font-bold rounded-full">
                  {foodOrdersCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <span className="font-bold text-amber-400">{currency} {totalFoodBill.toLocaleString('en-IN')}</span>
              <ChevronRight className="w-3.5 h-3.5 text-amber-400/70" />
            </div>
          </button>

          {booking.status !== 'CHECKED_IN' && booking.status !== 'CHECKED_OUT' && booking.status !== 'CANCELLED' && (
            <button
              onClick={() => onCheckIn?.(booking)}
              className="w-full py-2.5 bg-[#00b894] hover:bg-[#00a884] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-md shadow-[#00b894]/20 transition-all cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              Check In Guest
            </button>
          )}

          {booking.status === 'CHECKED_IN' && (
            <button
              onClick={() => onCheckOut?.(booking)}
              className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-md shadow-rose-600/20 transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              Check Out Guest
            </button>
          )}

          <button
            onClick={() => onPrint?.(booking)}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer border border-slate-700"
          >
            <Printer className="w-4 h-4 text-sky-400" />
            Print Registration Card (GRC)
          </button>

          {bookingNo !== 'N/A' && (
            <Link
              href={`/hotel/bookings?search=${encodeURIComponent(bookingNo)}`}
              className="w-full py-2 text-center text-slate-400 hover:text-white text-[11px] font-medium flex items-center justify-center gap-1 transition-colors"
            >
              <span>View in Bookings Management</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          )}
        </div>
      </div>

      {/* ── RESTAURANT & FOOD BILL MODAL ── */}
      {showRestaurantModal && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => setShowRestaurantModal(false)}
        >
          <div
            className="bg-[#0f172a] border border-slate-700/80 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 text-white"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                  <UtensilsCrossed className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>Restaurant & Food Bill</span>
                    <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                      Room {roomNo}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Guest: <span className="text-slate-200 font-medium">{guestName}</span> • Booking #{bookingNo}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrintRestaurantBill}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-sky-400 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors border border-slate-700 cursor-pointer"
                  title="Print Food Statement"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Print Bill</span>
                </button>
                <button
                  onClick={() => setShowRestaurantModal(false)}
                  className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Metrics Summary Row */}
            <div className="grid grid-cols-3 gap-2.5 p-4 bg-slate-900/30 border-b border-slate-800/80">
              <div className="p-3 rounded-xl bg-[#1e293b]/70 border border-slate-800">
                <span className="text-[10px] font-semibold text-slate-400 uppercase block">Total Food Bill</span>
                <strong className="text-amber-400 text-base font-bold">
                  {currency} {totalFoodBill.toLocaleString('en-IN')}
                </strong>
                <span className="text-[10px] text-slate-500 block mt-0.5">{foodOrdersCount} Orders Placed</span>
              </div>
              <div className="p-3 rounded-xl bg-[#1e293b]/70 border border-slate-800">
                <span className="text-[10px] font-semibold text-slate-400 uppercase block">Room Stay Bill</span>
                <strong className="text-white text-base font-bold">
                  {currency} {(Number(booking.totalAmount) || 0).toLocaleString('en-IN')}
                </strong>
                <span className="text-[10px] text-slate-500 block mt-0.5">{nights} Night(s) Stay</span>
              </div>
              <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30">
                <span className="text-[10px] font-semibold text-indigo-300 uppercase block">Total Combined</span>
                <strong className="text-indigo-400 text-base font-bold">
                  {currency} {grandCombinedTotal.toLocaleString('en-IN')}
                </strong>
                <span className="text-[10px] text-indigo-300/80 block mt-0.5">Stay + Food Charges</span>
              </div>
            </div>

            {/* Modal Body: Itemized Food Orders */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
              {loadingFoodData ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400 space-y-2">
                  <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
                  <span className="text-xs">Loading restaurant orders & folio bills...</span>
                </div>
              ) : !foodData?.orders || foodData.orders.length === 0 ? (
                <div className="text-center py-12 px-4 rounded-xl border border-dashed border-slate-800 bg-slate-900/30 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-500">
                    <ShoppingBag className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-300">No Food Orders Recorded</h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      No restaurant dining or room service orders have been billed to Room {roomNo} or this booking yet.
                    </p>
                  </div>
                </div>
              ) : (
                foodData.orders.map((order: any, idx: number) => (
                  <div
                    key={order.id || idx}
                    className="rounded-xl border border-slate-800 bg-[#1e293b]/50 overflow-hidden shadow-xs hover:border-slate-700 transition-colors"
                  >
                    {/* Order Header */}
                    <div className="p-3 bg-slate-900/70 border-b border-slate-800/80 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-white">
                          Order #{order.orderNo || `POS-${order.id?.slice(0, 6)}`}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-md font-medium bg-amber-500/15 text-amber-300 border border-amber-500/30">
                          {order.outlet?.name || order.orderType?.replace('_', ' ') || 'Restaurant / In-Room Dining'}
                        </span>
                        {order.table && (
                          <span className="text-[10px] text-slate-400">
                            Table {order.table.number || order.table.name}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400">
                          {order.createdAt ? new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                        <span className="text-xs font-bold text-amber-400">
                          {currency} {(order.grandTotal || 0).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>

                    {/* Order Items Table */}
                    <div className="p-3">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-slate-400 text-[10px] uppercase border-b border-slate-800">
                            <th className="text-left pb-1.5 font-semibold">Dish / Item</th>
                            <th className="text-center pb-1.5 font-semibold">Qty</th>
                            <th className="text-right pb-1.5 font-semibold">Price</th>
                            <th className="text-right pb-1.5 font-semibold">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                          {(order.items || []).map((it: any, itIdx: number) => (
                            <tr key={it.id || itIdx} className="hover:bg-slate-800/30 transition-colors">
                              <td className="py-2 text-slate-200">
                                <div className="flex items-center gap-1.5">
                                  {it.product?.isVeg !== undefined && (
                                    <span
                                      className={`w-2 h-2 rounded-full shrink-0 ${
                                        it.product.isVeg ? 'bg-emerald-500' : 'bg-rose-500'
                                      }`}
                                      title={it.product.isVeg ? 'Vegetarian' : 'Non-Vegetarian'}
                                    />
                                  )}
                                  <span className="font-medium">{it.product?.name || 'Dish Item'}</span>
                                </div>
                                {it.notes && (
                                  <span className="text-[10px] text-slate-400 block pl-3.5 italic">
                                    "{it.notes}"
                                  </span>
                                )}
                              </td>
                              <td className="py-2 text-center text-slate-300 font-medium">
                                x{it.quantity}
                              </td>
                              <td className="py-2 text-right text-slate-400">
                                {currency} {(it.unitPrice || 0).toLocaleString('en-IN')}
                              </td>
                              <td className="py-2 text-right text-slate-200 font-semibold">
                                {currency} {(it.totalAmount || (it.unitPrice * it.quantity)).toLocaleString('en-IN')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {/* Order Subtotal & Taxes */}
                      <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                        <div className="flex items-center gap-3">
                          <span>Subtotal: {currency} {(order.subtotal || order.grandTotal || 0).toLocaleString('en-IN')}</span>
                          {(order.taxAmount > 0) && (
                            <span>GST / Tax: {currency} {order.taxAmount.toLocaleString('en-IN')}</span>
                          )}
                          {(order.discountAmount > 0) && (
                            <span className="text-emerald-400">Disc: -{currency} {order.discountAmount.toLocaleString('en-IN')}</span>
                          )}
                        </div>
                        <div className="font-bold text-white">
                          Net: {currency} {(order.grandTotal || 0).toLocaleString('en-IN')}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}

              {/* Any Folio Transactions tagged as F&B that are not in POS orders */}
              {foodData?.transactions && foodData.transactions.length > 0 && (
                <div className="rounded-xl border border-slate-800 bg-[#1e293b]/30 p-3 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Additional Folio Food Charges
                  </span>
                  <div className="space-y-1">
                    {foodData.transactions.map((tx: any, idx: number) => (
                      <div key={tx.id || idx} className="flex items-center justify-between text-xs py-1 border-b border-slate-800/60 last:border-0">
                        <span className="text-slate-300">{tx.description || 'Food & Beverage Room Service'}</span>
                        <span className="text-amber-400 font-bold">{currency} {(tx.amount || 0).toLocaleString('en-IN')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 block">Total Restaurant & Food Bill</span>
                <span className="text-lg font-bold text-amber-400">
                  {currency} {totalFoodBill.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrintRestaurantBill}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-sky-300 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors border border-slate-700 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Receipt</span>
                </button>
                <button
                  onClick={() => setShowRestaurantModal(false)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
