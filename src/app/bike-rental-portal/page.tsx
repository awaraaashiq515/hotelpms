'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Toaster, toast } from 'sonner';
import { Bike, MessageSquareQuote, Key, Plus, Sparkles, Home } from 'lucide-react';

import { BikeItem, BookingItem, EnquiryItem, VendorProfile } from './components/types';
import { PortalHeader } from './components/PortalHeader';
import { KpiMetricsCards } from './components/KpiMetricsCards';
import { FleetTab } from './components/FleetTab';
import { EnquiriesTab } from './components/EnquiriesTab';
import { ActiveRentalsTab } from './components/ActiveRentalsTab';
import { AddBikeModal } from './components/AddBikeModal';
import { NewRentalModal } from './components/NewRentalModal';
import { ReturnInspectionModal } from './components/ReturnInspectionModal';
import { VendorAuthScreen } from './components/VendorAuthScreen';
import { setupAudioUnlock, playNotificationSound } from '@/lib/notification-sound';

export default function BikeRentalPortalPage() {
  const [vendor, setVendor] = useState<VendorProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'fleet' | 'enquiries' | 'rentals'>('fleet');

  // Core Data
  const [bikes, setBikes] = useState<BikeItem[]>([]);
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [enquiries, setEnquiries] = useState<EnquiryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Sound Notification Refs
  const isInitialLoadRef = useRef(true);
  const prevEnquiriesCountRef = useRef(0);
  const prevBookingsCountRef = useRef(0);

  // Modals
  const [showAddBikeModal, setShowAddBikeModal] = useState(false);
  const [showNewRentalModal, setShowNewRentalModal] = useState(false);
  const [preselectedBike, setPreselectedBike] = useState<BikeItem | null>(null);
  const [bookingForReturn, setBookingForReturn] = useState<BookingItem | null>(null);

  // Load saved session on mount + unlock audio on mobile
  useEffect(() => {
    setupAudioUnlock();
    try {
      const saved = localStorage.getItem('bike_vendor');
      if (saved) {
        const v = JSON.parse(saved);
        if (v && v.id) {
          setVendor(v);
          loadPortalData(v.id, false);
        }
      }
    } catch (_) {}
  }, []);

  const loadPortalData = useCallback(async (vendorId: string, isSilent = false) => {
    if (!vendorId || vendorId === 'undefined' || vendorId === 'null') return;
    if (!isSilent) setLoading(true);
    setIsRefreshing(true);
    try {
      const safeFetch = async (url: string) => {
        try {
          const res = await fetch(url);
          if (!res.ok) return { success: false, data: [] };
          return await res.json();
        } catch {
          return { success: false, data: [] };
        }
      };

      const [bikesJson, bookingsJson, enquiriesJson] = await Promise.all([
        safeFetch(`/api/bike-rentals/bikes?vendorId=${encodeURIComponent(vendorId)}`),
        safeFetch(`/api/bike-rentals/bookings?vendorId=${encodeURIComponent(vendorId)}`),
        safeFetch(`/api/bike-rentals/enquiries?vendorId=${encodeURIComponent(vendorId)}`),
      ]);

      if (bikesJson && bikesJson.success) {
        setBikes(bikesJson.data || []);
      }

      if (enquiriesJson && enquiriesJson.success) {
        const newEnqs: EnquiryItem[] = enquiriesJson.data || [];
        setEnquiries(newEnqs);

        // Play loud pleasant chime sound when new enquiries arrive
        if (!isInitialLoadRef.current && newEnqs.length > prevEnquiriesCountRef.current) {
          const latest = newEnqs[0];
          playNotificationSound('lead');
          toast.info(`🔔 New Rental Enquiry Received!`, {
            description: `${latest?.customerName || 'A tourist'} requested ${latest?.quantity || 1}x ${latest?.categoryRequested || 'Vehicle'}`,
            duration: 7000,
          });
        }
        prevEnquiriesCountRef.current = newEnqs.length;
      }

      if (bookingsJson && bookingsJson.success) {
        const newBks: BookingItem[] = bookingsJson.data || [];
        setBookings(newBks);

        // Play sound when booking confirmed
        if (!isInitialLoadRef.current && newBks.length > prevBookingsCountRef.current) {
          playNotificationSound('booking');
          toast.success(`🔔 New Rental Booking Activated!`, {
            description: `${newBks.length} active bookings in fleet`,
            duration: 6000,
          });
        }
        prevBookingsCountRef.current = newBks.length;
      }

      // Only show error on explicit manual refresh when all endpoints fail
      if (!isSilent && !bikesJson?.success && !bookingsJson?.success && !enquiriesJson?.success) {
        toast.error('Failed to fetch latest fleet and bookings. Please verify your connection.');
      }

      isInitialLoadRef.current = false;
    } catch (e) {
      console.error('Failed to load portal data', e);
      if (!isSilent) {
        toast.error('Failed to fetch latest fleet and bookings');
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Real-time background auto-polling every 15 seconds so notifications trigger live with sound
  useEffect(() => {
    if (!vendor?.id) return;
    const timer = setInterval(() => {
      loadPortalData(vendor.id, true);
    }, 15000);
    return () => clearInterval(timer);
  }, [vendor?.id, loadPortalData]);

  const handleLogout = () => {
    localStorage.removeItem('bike_vendor');
    setVendor(null);
    setBikes([]);
    setBookings([]);
    setEnquiries([]);
    toast.success('Logged out from Bike Rental Portal');
  };

  // Fleet Actions
  const handleUpdateBikeStatus = async (bikeId: string, status: 'AVAILABLE' | 'ON_RENT' | 'MAINTENANCE') => {
    if (!vendor) return;
    try {
      const res = await fetch('/api/bike-rentals/bikes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: bikeId, status }),
      });
      const j = await res.json();
      if (j.success) {
        toast.success(`Vehicle marked as ${status}`);
        loadPortalData(vendor.id, true);
      } else {
        toast.error(j.message || 'Status update failed');
      }
    } catch {
      toast.error('Failed to update vehicle status');
    }
  };

  const handleDeleteBike = async (bikeId: string) => {
    if (!vendor) return;
    if (!confirm('Are you sure you want to remove this bike from your fleet?')) return;
    try {
      const res = await fetch(`/api/bike-rentals/bikes?id=${bikeId}`, { method: 'DELETE' });
      const j = await res.json();
      if (j.success) {
        toast.success('Bike removed from fleet');
        loadPortalData(vendor.id, true);
      } else {
        toast.error(j.message || 'Failed to remove bike');
      }
    } catch {
      toast.error('Error deleting bike');
    }
  };

  const handleRentOutClick = (bike: BikeItem) => {
    setPreselectedBike(bike);
    setShowNewRentalModal(true);
  };

  // Enquiry Actions
  const handleAcceptEnquiry = async (enquiryId: string, bikeId: string, quotePrice?: number) => {
    if (!vendor) return;
    try {
      const res = await fetch('/api/bike-rentals/enquiries', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: enquiryId, action: 'ACCEPT', assignedBikeId: bikeId, quotedPrice: quotePrice }),
      });
      const j = await res.json();
      if (j.success) {
        playNotificationSound('success');
        toast.success(j.message || 'Enquiry accepted & bike reserved!');
        loadPortalData(vendor.id, true);
        setActiveTab('rentals');
      } else {
        toast.error(j.message || 'Failed to accept enquiry');
      }
    } catch {
      toast.error('Error processing enquiry acceptance');
    }
  };

  const handleQuoteEnquiry = async (enquiryId: string, quotePrice: number) => {
    if (!vendor) return;
    try {
      const res = await fetch('/api/bike-rentals/enquiries', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: enquiryId, action: 'QUOTE', quotedPrice: quotePrice }),
      });
      const j = await res.json();
      if (j.success) {
        playNotificationSound('success');
        toast.success(j.message || 'Quote price submitted to customer/agent');
        loadPortalData(vendor.id, true);
      } else {
        toast.error(j.message || 'Failed to submit quote');
      }
    } catch {
      toast.error('Error submitting quote');
    }
  };

  const handleRejectEnquiry = async (enquiryId: string, reason?: string) => {
    if (!vendor) return;
    try {
      const res = await fetch('/api/bike-rentals/enquiries', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: enquiryId, action: 'REJECT', reason }),
      });
      const j = await res.json();
      if (j.success) {
        toast.success('Enquiry declined');
        loadPortalData(vendor.id, true);
      }
    } catch {
      toast.error('Error declining enquiry');
    }
  };

  // If vendor is not logged in, render authentication screen
  if (!vendor) {
    return (
      <VendorAuthScreen
        onAuthSuccess={(v) => {
          setVendor(v);
          loadPortalData(v.id);
        }}
      />
    );
  }

  const availableBikes = bikes.filter((b) => b.status === 'AVAILABLE');
  const activeBookingsCount = bookings.filter((b) => b.status === 'CONFIRMED' || b.status === 'ACTIVE').length;
  const pendingEnquiriesCount = enquiries.filter((e) => e.status === 'NEW' || e.status === 'PENDING').length;

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 pb-28 md:pb-20 selection:bg-rose-500 selection:text-white">
      <Toaster position="top-right" richColors />

      {/* ── Top Header with Mobile Drawer Menu ── */}
      <PortalHeader
        vendor={vendor}
        onAddBike={() => setShowAddBikeModal(true)}
        onNewRental={() => {
          setPreselectedBike(null);
          setShowNewRentalModal(true);
        }}
        onRefresh={() => loadPortalData(vendor.id)}
        onLogout={handleLogout}
        isRefreshing={isRefreshing}
        activeTab={activeTab}
        onTabChange={(t) => setActiveTab(t)}
        fleetCount={bikes.length}
        pendingEnquiriesCount={pendingEnquiriesCount}
        activeBookingsCount={activeBookingsCount}
      />

      {/* ── Main Dashboard Body ── */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 py-4 md:py-6 space-y-5 md:space-y-6">
        {/* KPI Summary Cards */}
        <KpiMetricsCards
          bikes={bikes}
          bookings={bookings}
          enquiries={enquiries}
        />

        {/* Tab Navigation (Desktop / Tablet view) */}
        <div className="flex bg-[#0b1120] border border-slate-800 rounded-2xl p-1.5 max-w-lg shadow-sm">
          <button
            onClick={() => setActiveTab('fleet')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'fleet'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/25'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Bike size={14} />
            <span>My Fleet ({bikes.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('enquiries')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer relative ${
              activeTab === 'enquiries'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/25'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <MessageSquareQuote size={14} />
            <span>Requests & Leads</span>
            {pendingEnquiriesCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-sky-500 text-white text-[10px] font-black flex items-center justify-center">
                {pendingEnquiriesCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('rentals')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'rentals'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/25'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Key size={14} />
            <span>Rentals ({activeBookingsCount})</span>
          </button>
        </div>

        {/* ── Tab Views ── */}
        {activeTab === 'fleet' && (
          <FleetTab
            bikes={bikes}
            loading={loading}
            onAddBike={() => setShowAddBikeModal(true)}
            onRentOut={handleRentOutClick}
            onUpdateStatus={handleUpdateBikeStatus}
            onDeleteBike={handleDeleteBike}
            onRefresh={() => loadPortalData(vendor.id, true)}
          />
        )}

        {activeTab === 'enquiries' && (
          <EnquiriesTab
            enquiries={enquiries}
            availableBikes={availableBikes}
            loading={loading}
            onAcceptEnquiry={handleAcceptEnquiry}
            onQuoteEnquiry={handleQuoteEnquiry}
            onRejectEnquiry={handleRejectEnquiry}
          />
        )}

        {activeTab === 'rentals' && (
          <ActiveRentalsTab
            bookings={bookings}
            loading={loading}
            onStartReturn={(booking) => setBookingForReturn(booking)}
          />
        )}
      </main>

      {/* ── MOBILE BOTTOM NAVIGATION BAR (Thumb Friendly) ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#070b14]/95 backdrop-blur-xl border-t border-slate-800/90 px-3 py-2 shadow-2xl">
        <div className="flex items-center justify-around gap-1 max-w-md mx-auto">
          {/* Fleet Tab */}
          <button
            onClick={() => setActiveTab('fleet')}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
              activeTab === 'fleet' ? 'text-rose-400 font-black' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bike size={18} />
            <span className="text-[10px] mt-0.5">Fleet ({bikes.length})</span>
          </button>

          {/* Leads Tab */}
          <button
            onClick={() => setActiveTab('enquiries')}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer relative ${
              activeTab === 'enquiries' ? 'text-rose-400 font-black' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="relative">
              <MessageSquareQuote size={18} />
              {pendingEnquiriesCount > 0 && (
                <span className="absolute -top-1 -right-2.5 w-4 h-4 bg-sky-500 text-white rounded-full text-[9px] font-black flex items-center justify-center">
                  {pendingEnquiriesCount}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-0.5">Leads</span>
          </button>

          {/* Quick Rent Button (Hero Action in center) */}
          <button
            onClick={() => {
              setPreselectedBike(null);
              setShowNewRentalModal(true);
            }}
            className="flex flex-col items-center justify-center p-2 rounded-2xl bg-gradient-to-r from-rose-600 to-rose-500 text-white shadow-lg shadow-rose-600/30 -mt-5 active:scale-90 transition-all cursor-pointer border border-rose-400/30"
            title="Rent Out Bike"
          >
            <Sparkles size={20} />
            <span className="text-[9px] font-black uppercase tracking-wider mt-0.5 px-1">Rent Out</span>
          </button>

          {/* Rentals Tab */}
          <button
            onClick={() => setActiveTab('rentals')}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer relative ${
              activeTab === 'rentals' ? 'text-rose-400 font-black' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Key size={18} />
            <span className="text-[10px] mt-0.5">Rentals ({activeBookingsCount})</span>
          </button>

          {/* Add Vehicle Button */}
          <button
            onClick={() => setShowAddBikeModal(true)}
            className="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-slate-400 hover:text-rose-400 transition-all cursor-pointer"
            title="Add Bike"
          >
            <Plus size={18} />
            <span className="text-[10px] mt-0.5">+ Vehicle</span>
          </button>
        </div>
      </nav>

      {/* ── Modals ── */}
      <AddBikeModal
        vendorId={vendor.id}
        isOpen={showAddBikeModal}
        onClose={() => setShowAddBikeModal(false)}
        onSuccess={() => loadPortalData(vendor.id, true)}
      />

      <NewRentalModal
        vendorId={vendor.id}
        isOpen={showNewRentalModal}
        onClose={() => {
          setShowNewRentalModal(false);
          setPreselectedBike(null);
        }}
        availableBikes={availableBikes}
        preselectedBike={preselectedBike}
        onSuccess={() => {
          loadPortalData(vendor.id, true);
          setActiveTab('rentals');
        }}
      />

      <ReturnInspectionModal
        booking={bookingForReturn}
        isOpen={!!bookingForReturn}
        onClose={() => setBookingForReturn(null)}
        onSuccess={() => loadPortalData(vendor.id, true)}
      />
    </div>
  );
}
