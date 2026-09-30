'use client';

import React, { useState, useEffect } from 'react';
import { 
  Calendar, Plus, Users, Clock, IndianRupee, Search, 
  Sparkles, CheckCircle2, AlertCircle, FileText, Printer, 
  MapPin, Edit, Trash2, ShieldCheck, Utensils, Info, Layers, Loader2, X
} from 'lucide-react';
import { toast, Toaster } from 'sonner';

interface BanquetHall {
  id: string;
  name: string;
  code: string | null;
  capacity: number;
  minCapacity: number | null;
  baseRate: number;
  hourlyRate: number | null;
  description: string | null;
  amenities: string | null;
  isActive: boolean;
}

interface BanquetBooking {
  id: string;
  hallId: string;
  eventName: string;
  eventType: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string | null;
  clientGst: string | null;
  eventDate: string;
  startTime: string;
  endTime: string;
  paxCount: number;
  slotType: string;
  seatingLayout: string | null;
  cateringPackage: string | null;
  ratePerPlate: number;
  hallRent: number;
  extraCharges: number;
  miscCharges?: string | null;
  totalAmount: number;
  advancePaid: number;
  dueAmount: number;
  status: 'CONFIRMED' | 'TENTATIVE' | 'COMPLETED' | 'CANCELLED' | string;
  paymentStatus: 'PENDING' | 'PARTIAL' | 'PAID' | string;
  specialInstructions: string | null;
  hall: BanquetHall;
}

interface MiscItem {
  id: string;
  name: string;
  amount: number | string;
}

const MISC_PRESETS = [
  { name: 'DJ & Sound System', amount: 10000 },
  { name: 'Floral / Mandap Decor', amount: 15000 },
  { name: 'LED Video Wall (8x12)', amount: 12000 },
  { name: 'Live Mocktail Counter', amount: 8000 },
  { name: 'Audio Mic & Podium', amount: 4000 },
  { name: 'Valet Parking & Security', amount: 3000 },
];

const CATERING_PACKAGES = [
  {
    name: 'Silver Buffet Package',
    price: 650,
    type: 'Standard',
    includes: '1 Welcome Drink, 2 Starters, 3 Main Course, 1 Rice, Assorted Roti, 1 Dessert, Mineral Water'
  },
  {
    name: 'Gold Festive Menu',
    price: 950,
    type: 'Premium',
    includes: '2 Welcome Drinks, 3 Starters, 4 Main Course, Paneer Special, Dal Tadka, Biryani, 2 Desserts, Ice Cream'
  },
  {
    name: 'Diamond Royal Wedding Feast',
    price: 1350,
    type: 'Luxury',
    includes: 'Live Mocktail Bar, 5 Starters, 6 Main Course, Live Chaat Counter, Royal Mughlai Biryani, 3 Desserts + Live Jalebi'
  },
  {
    name: 'Corporate Executive High-Tea & Lunch',
    price: 800,
    type: 'Corporate',
    includes: 'Morning High-Tea with Cookies, Buffet Lunch (3 Main Course), Afternoon Tea & Pastries, Mineral Water & Juices'
  }
];

export default function BanquetPage() {
  const [activeTab, setActiveTab] = useState<'events' | 'halls' | 'catering' | 'prospectus'>('events');
  const [halls, setHalls] = useState<BanquetHall[]>([]);
  const [bookings, setBookings] = useState<BanquetBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modals state
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [miscItems, setMiscItems] = useState<MiscItem[]>([]);

  const handleAddMiscItem = () => {
    setMiscItems(prev => [
      ...prev,
      { id: `misc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`, name: '', amount: '' }
    ]);
  };

  const handleAddPresetMisc = (preset: { name: string; amount: number }) => {
    setMiscItems(prev => [
      ...prev,
      { id: `misc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`, name: preset.name, amount: preset.amount }
    ]);
  };

  const handleUpdateMiscItem = (id: string, field: 'name' | 'amount', val: any) => {
    setMiscItems(prev => prev.map(m => m.id === id ? { ...m, [field]: val } : m));
  };

  const handleRemoveMiscItem = (id: string) => {
    setMiscItems(prev => prev.filter(m => m.id !== id));
  };

  const totalMiscCharges = miscItems.reduce((acc, curr) => acc + (parseFloat(curr.amount?.toString()) || 0), 0);

  const [bookingForm, setBookingForm] = useState({
    hallId: '',
    eventName: '',
    eventType: 'Wedding',
    clientName: '',
    clientPhone: '',
    clientEmail: '',
    clientGst: '',
    eventDate: new Date().toISOString().split('T')[0],
    startTime: '18:00',
    endTime: '23:00',
    paxCount: '',
    slotType: 'EVENING',
    seatingLayout: 'CLUSTER',
    cateringPackage: '',
    ratePerPlate: '',
    hallRent: '',
    extraCharges: '0',
    advancePaid: '',
    specialInstructions: ''
  });

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentBooking, setPaymentBooking] = useState<BanquetBooking | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');

  const [showFPModal, setShowFPModal] = useState(false);
  const [selectedFPBooking, setSelectedFPBooking] = useState<BanquetBooking | null>(null);

  const [showHallModal, setShowHallModal] = useState(false);
  const [hallForm, setHallForm] = useState({
    name: '',
    code: '',
    capacity: '',
    minCapacity: '',
    baseRate: '',
    hourlyRate: '',
    description: '',
    amenities: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [hallsRes, bookingsRes] = await Promise.all([
        fetch('/api/admin/banquet/halls'),
        fetch('/api/admin/banquet/bookings')
      ]);

      const hallsData = await hallsRes.json();
      if (hallsData.success) {
        setHalls(hallsData.data || []);
      }

      const bookingsData = await bookingsRes.json();
      if (bookingsData.success) {
        setBookings(bookingsData.data || []);
      }
    } catch (error) {
      toast.error('Failed to load banquet data.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingForm.hallId || !bookingForm.eventName || !bookingForm.clientName || !bookingForm.clientPhone) {
      toast.error('Please fill in all required fields.');
      return;
    }

    try {
      const payload = {
        ...bookingForm,
        extraCharges: totalMiscCharges,
        miscCharges: JSON.stringify(miscItems.filter(m => m.name || (parseFloat(m.amount?.toString()) || 0) > 0)),
      };

      const res = await fetch('/api/admin/banquet/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Event booked successfully!');
        setShowBookingModal(false);
        fetchData();
      } else {
        toast.error(data.message || 'Failed to create booking.');
      }
    } catch (err) {
      toast.error('Network error. Failed to book event.');
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentBooking || !paymentAmount) return;

    try {
      const res = await fetch('/api/admin/banquet/bookings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: paymentBooking.id,
          addPayment: parseFloat(paymentAmount)
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Payment recorded successfully!');
        setShowPaymentModal(false);
        setPaymentBooking(null);
        setPaymentAmount('');
        fetchData();
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error('Failed to record payment.');
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch('/api/admin/banquet/bookings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Event status updated to ${status}!`);
        fetchData();
      }
    } catch (err) {
      toast.error('Failed to update status.');
    }
  };

  const handleCreateHall = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hallForm.name) return;

    try {
      const res = await fetch('/api/admin/banquet/halls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(hallForm)
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Banquet hall created successfully!');
        if (data.data) {
          setHalls(prev => [...prev, data.data]);
          setBookingForm(prev => ({
            ...prev,
            hallId: data.data.id,
            hallRent: data.data.baseRate ? data.data.baseRate.toString() : prev.hallRent
          }));
        }
        setShowHallModal(false);
        setHallForm({
          name: '',
          code: '',
          capacity: '100',
          minCapacity: '20',
          baseRate: '25000',
          hourlyRate: '5000',
          description: '',
          amenities: 'Air Conditioned, Stage, Sound System, LED Lights'
        });
        fetchData();
      } else {
        toast.error(data.message || 'Failed to create hall.');
      }
    } catch (err) {
      toast.error('Failed to create hall.');
    }
  };

  const handleDeleteHall = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete venue "${name}"?`)) return;
    try {
      const res = await fetch(`/api/admin/banquet/halls?id=${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Hall "${name}" deleted.`);
        fetchData();
      } else {
        toast.error(data.message || 'Failed to delete hall.');
      }
    } catch (err) {
      toast.error('Error deleting hall.');
    }
  };

  // Filtered Events
  const filteredBookings = bookings.filter(b => {
    const matchesSearch = !search || 
      b.eventName.toLowerCase().includes(search.toLowerCase()) || 
      b.clientName.toLowerCase().includes(search.toLowerCase()) ||
      b.hall.name.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === 'ALL' || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPipelineRevenue = bookings.reduce((sum, b) => sum + b.totalAmount, 0);
  const totalAdvanceCollected = bookings.reduce((sum, b) => sum + b.advancePaid, 0);
  const totalPaxGuests = bookings.reduce((sum, b) => sum + b.paxCount, 0);
  const confirmedCount = bookings.filter(b => b.status === 'CONFIRMED').length;

  return (
    <div className="min-h-screen bg-[#020617] text-white p-6 space-y-6">
      <Toaster richColors position="top-right" />

      {/* Page Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-5 flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Calendar size={14} className="text-orange-400" />
            <span className="text-[9px] font-black text-orange-400 uppercase tracking-widest">Convention & Banquet Console</span>
          </div>
          <h1 className="text-2xl font-black bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            Banquet & Events Management
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Hall availability tracking, event bookings, catering packages, Function Prospectus & invoices.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowHallModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-xs font-black text-slate-200 hover:text-white shadow-md active:scale-95 transition-all"
          >
            <Plus size={14} className="text-orange-400" /> + Add Banquet Hall
          </button>
          <button 
            onClick={() => {
              if (halls.length > 0) {
                setBookingForm(prev => ({
                  ...prev,
                  hallId: halls[0].id,
                  hallRent: halls[0].baseRate.toString()
                }));
              } else {
                setBookingForm(prev => ({
                  ...prev,
                  hallId: '',
                  hallRent: ''
                }));
              }
              setMiscItems([]);
              setShowBookingModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 text-xs font-black text-white hover:from-orange-500 hover:to-amber-500 shadow-lg shadow-orange-600/20 active:scale-95 transition-all"
          >
            <Calendar size={14} /> New Event Booking
          </button>
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Upcoming Events', value: bookings.length, sub: `${confirmedCount} Confirmed`, color: 'border-orange-500/20 bg-orange-950/20 text-orange-400' },
          { label: 'Total Guests (Pax)', value: totalPaxGuests.toLocaleString('en-IN'), sub: 'Scheduled Attendees', color: 'border-sky-500/20 bg-sky-950/20 text-sky-400' },
          { label: 'Pipeline Revenue', value: `₹${(totalPipelineRevenue / 100000).toFixed(2)}L`, sub: 'Total Estimated Value', color: 'border-emerald-500/20 bg-emerald-950/20 text-emerald-400' },
          { label: 'Advance Deposits', value: `₹${(totalAdvanceCollected / 100000).toFixed(2)}L`, sub: `₹${((totalPipelineRevenue - totalAdvanceCollected)/100000).toFixed(2)}L Balance Due`, color: 'border-indigo-500/20 bg-indigo-950/20 text-indigo-400' },
        ].map((m) => (
          <div key={m.label} className={`rounded-2xl border p-4 backdrop-blur-sm ${m.color}`}>
            <p className="text-2xl font-black text-white">{m.value}</p>
            <p className="text-[10px] font-black uppercase tracking-widest mt-1 opacity-90">{m.label}</p>
            <p className="text-[10px] text-slate-400 mt-0.5 font-semibold">{m.sub}</p>
          </div>
        ))}
      </div>

      {/* Venue Live Availability Banner */}
      <div className="rounded-2xl bg-[#090f1e]/90 border border-slate-800 p-4 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <Sparkles size={12} className="text-orange-400" /> Venue Halls Availability Status — Today
          </p>
          <button onClick={() => setShowHallModal(true)} className="text-[10px] font-black text-orange-400 hover:underline uppercase tracking-wider">
            + Add New Hall
          </button>
        </div>
        <div className="flex flex-wrap gap-3">
          {halls.length === 0 ? (
            <div className="py-3 px-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 flex items-center justify-between w-full">
              <span>No banquet venues configured yet. Click <strong>+ Add New Hall</strong> to add your property halls or lawns.</span>
              <button onClick={() => setShowHallModal(true)} className="text-orange-400 hover:text-orange-300 font-bold ml-2 shrink-0">
                + Add Hall
              </button>
            </div>
          ) : (
            halls.map((h) => {
              const isBooked = bookings.some(b => b.hallId === h.id && new Date(b.eventDate).toDateString() === new Date().toDateString());
              return (
                <div 
                  key={h.id} 
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold transition-all ${
                    isBooked ? 'bg-rose-500/10 border-rose-500/30 text-rose-300' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${isBooked ? 'bg-rose-400 animate-ping' : 'bg-emerald-400'}`} />
                  <span>{h.name}</span>
                  <span className="text-[10px] opacity-60">({h.capacity} Pax)</span>
                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase ${isBooked ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                    {isBooked ? 'Booked' : 'Available'}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800/80 w-fit">
        <button 
          onClick={() => setActiveTab('events')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black transition-all ${activeTab === 'events' ? 'bg-orange-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
        >
          <Calendar size={14} /> Event Bookings ({bookings.length})
        </button>
        <button 
          onClick={() => setActiveTab('halls')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black transition-all ${activeTab === 'halls' ? 'bg-orange-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
        >
          <Layers size={14} /> Banquet Halls ({halls.length})
        </button>
        <button 
          onClick={() => setActiveTab('catering')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black transition-all ${activeTab === 'catering' ? 'bg-orange-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
        >
          <Utensils size={14} /> Catering Menu Tiers ({CATERING_PACKAGES.length})
        </button>
        <button 
          onClick={() => setActiveTab('prospectus')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black transition-all ${activeTab === 'prospectus' ? 'bg-orange-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
        >
          <FileText size={14} /> Function Prospectus (FP Sheet)
        </button>
      </div>

      {/* Tab Content */}
      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center gap-2">
          <Loader2 className="animate-spin text-orange-500" size={32} />
          <p className="text-xs text-slate-500 font-bold">Loading banquet events & hall data...</p>
        </div>
      ) : activeTab === 'events' ? (
        <div className="space-y-4">
          {/* Search & Filters */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-[#090f1e]/80 border border-slate-800 rounded-2xl p-4">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
              <input 
                type="text"
                placeholder="Search by event name, client, hall..."
                className="w-full bg-[#050a14] border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white focus:outline-none focus:border-orange-500 placeholder-slate-600"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              {['ALL', 'CONFIRMED', 'TENTATIVE', 'COMPLETED', 'CANCELLED'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                    statusFilter === st ? 'bg-orange-600 text-white shadow-md' : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Bookings List */}
          <div className="grid grid-cols-1 gap-4">
            {filteredBookings.length === 0 ? (
              <div className="py-20 text-center border-2 border-dashed border-slate-800 rounded-3xl text-slate-500">
                <Calendar size={40} className="mx-auto mb-2 text-slate-700" />
                <p className="font-bold text-sm">No Event Bookings Found</p>
                <p className="text-xs text-slate-600 mt-1">Click "New Event Booking" to schedule a banquet booking.</p>
              </div>
            ) : (
              filteredBookings.map((b) => (
                <div 
                  key={b.id}
                  className="bg-[#090f1e]/90 border border-slate-800 rounded-3xl p-5 hover:border-orange-500/40 hover:shadow-xl transition-all space-y-4"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-orange-600/10 border border-orange-500/20 flex flex-col items-center justify-center shrink-0">
                        <span className="text-[9px] font-black text-orange-400 uppercase tracking-wider">
                          {new Date(b.eventDate).toLocaleDateString('en-IN', { month: 'short' })}
                        </span>
                        <span className="text-lg font-black text-white leading-tight">
                          {new Date(b.eventDate).getDate()}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-black text-white">{b.eventName}</h3>
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                            b.status === 'CONFIRMED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                            b.status === 'TENTATIVE' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                            b.status === 'COMPLETED' ? 'bg-sky-500/10 text-sky-400 border-sky-500/20' :
                            'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          }`}>
                            {b.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1 font-semibold">
                          Client: <span className="text-white font-bold">{b.clientName}</span> ({b.clientPhone})
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-right">
                      <div>
                        <p className="text-xs text-slate-400">Total Estimate</p>
                        <p className="text-lg font-black text-white">₹{b.totalAmount.toLocaleString('en-IN')}</p>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                          b.paymentStatus === 'PAID' ? 'bg-emerald-500/20 text-emerald-400' :
                          b.paymentStatus === 'PARTIAL' ? 'bg-amber-500/20 text-amber-400' : 'bg-rose-500/20 text-rose-400'
                        }`}>
                          {b.paymentStatus === 'PAID' ? 'Fully Paid' : `Advance: ₹${b.advancePaid.toLocaleString('en-IN')}`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Details grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs bg-slate-950/60 p-4 rounded-2xl border border-slate-850">
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Venue Hall</span>
                      <span className="text-white font-bold flex items-center gap-1 mt-0.5">
                        <MapPin size={11} className="text-orange-400" /> {b.hall.name}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Guest Count</span>
                      <span className="text-white font-bold flex items-center gap-1 mt-0.5">
                        <Users size={11} className="text-sky-400" /> {b.paxCount} Pax
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Catering Package</span>
                      <span className="text-white font-bold flex items-center gap-1 mt-0.5">
                        <Utensils size={11} className="text-amber-400" /> {b.cateringPackage || 'Custom Menu'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Timing</span>
                      <span className="text-white font-bold flex items-center gap-1 mt-0.5">
                        <Clock size={11} className="text-emerald-400" /> 
                        {new Date(b.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(b.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  {b.specialInstructions && (
                    <p className="text-xs text-slate-400 italic bg-orange-950/20 border border-orange-500/10 p-3 rounded-xl">
                      <span className="font-black text-orange-400 not-italic">Notes: </span>"{b.specialInstructions}"
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <div className="flex gap-2">
                      <button 
                        onClick={() => { setSelectedFPBooking(b); setShowFPModal(true); }}
                        className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-black text-orange-400 hover:text-white hover:border-orange-500/40 transition-all flex items-center gap-1.5"
                      >
                        <FileText size={12} /> Function Prospectus (FP)
                      </button>
                      <button 
                        onClick={() => { setPaymentBooking(b); setShowPaymentModal(true); }}
                        className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-black text-emerald-400 hover:text-white hover:border-emerald-500/40 transition-all flex items-center gap-1.5"
                      >
                        <IndianRupee size={12} /> Record Payment
                      </button>
                    </div>

                    <div className="flex gap-2">
                      {b.status === 'TENTATIVE' && (
                        <button 
                          onClick={() => handleUpdateStatus(b.id, 'CONFIRMED')}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black uppercase tracking-wider transition-all"
                        >
                          Confirm Event
                        </button>
                      )}
                      {b.status === 'CONFIRMED' && (
                        <button 
                          onClick={() => handleUpdateStatus(b.id, 'COMPLETED')}
                          className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-[10px] font-black uppercase tracking-wider transition-all"
                        >
                          Mark Completed
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : activeTab === 'halls' ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-[#090f1e]/80 border border-slate-800 p-4 rounded-2xl">
            <div>
              <h2 className="text-sm font-black text-white flex items-center gap-2">
                <Sparkles size={14} className="text-orange-400" /> Banquet & Conference Venues ({halls.length})
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Manage venue capacities, base rents, amenities, and create new halls.</p>
            </div>
            <button
              onClick={() => setShowHallModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-black shadow-md transition-all active:scale-95"
            >
              <Plus size={14} /> + Add New Venue Hall
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {halls.length === 0 ? (
              <div className="col-span-full py-16 text-center border-2 border-dashed border-slate-800 rounded-3xl text-slate-500">
                <Layers size={40} className="mx-auto mb-2 text-slate-700" />
                <p className="font-bold text-sm text-slate-300">No Banquet Halls Configured</p>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Add your hotel's banquet halls, ballrooms, boardrooms, or lawn venues to start booking events.
                </p>
                <button
                  onClick={() => setShowHallModal(true)}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-black shadow-md transition-all active:scale-95"
                >
                  <Plus size={14} /> + Add Your First Venue Hall
                </button>
              </div>
            ) : (
              halls.map((h) => (
                <div key={h.id} className="bg-[#090f1e]/80 border border-slate-800 rounded-3xl p-6 space-y-4 hover:border-orange-500/30 transition-all flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-black text-white">{h.name}</h3>
                        <p className="text-[10px] font-black uppercase text-orange-400 tracking-wider">{h.code || 'HALL'}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase ${h.isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                          {h.isActive ? 'Active Venue' : 'Inactive'}
                        </span>
                        <button
                          onClick={() => handleDeleteHall(h.id, h.name)}
                          className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title="Delete Hall"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed">{h.description || 'No description added for this hall.'}</p>

                    <div className="space-y-2 border-t border-b border-slate-800/80 py-3 text-xs">
                      <div className="flex justify-between text-slate-300">
                        <span className="text-slate-500">Max Capacity:</span>
                        <span className="font-bold text-white">{h.capacity} Pax</span>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span className="text-slate-500">Base Hall Rent:</span>
                        <span className="font-bold text-emerald-400">₹{h.baseRate.toLocaleString('en-IN')} / Day</span>
                      </div>
                      {h.hourlyRate && (
                        <div className="flex justify-between text-slate-300">
                          <span className="text-slate-500">Hourly Rate:</span>
                          <span className="font-bold text-sky-400">₹{h.hourlyRate.toLocaleString('en-IN')} / Hr</span>
                        </div>
                      )}
                    </div>

                    {h.amenities && (
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1.5">Amenities Included</span>
                        <div className="flex flex-wrap gap-1.5">
                          {h.amenities.split(',').map((am, i) => (
                            <span key={i} className="px-2 py-0.5 bg-slate-900 border border-slate-800 rounded-lg text-[10px] font-bold text-slate-300">
                              ✓ {am.trim()}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 font-bold">Venue ID: {h.code || h.id.slice(-6)}</span>
                    <button
                      onClick={() => {
                        setBookingForm(prev => ({
                          ...prev,
                          hallId: h.id,
                          hallRent: h.baseRate.toString()
                        }));
                        setMiscItems([]);
                        setShowBookingModal(true);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-orange-600/10 text-orange-400 hover:bg-orange-600/20 border border-orange-500/20 text-xs font-black transition-all"
                    >
                      Book Event Here →
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : activeTab === 'catering' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {CATERING_PACKAGES.map((pkg) => (
            <div key={pkg.name} className="bg-[#090f1e]/80 border border-slate-800 rounded-3xl p-6 space-y-4 hover:border-amber-500/30 transition-all flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-black text-white">{pkg.name}</h3>
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      {pkg.type} Tier
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-emerald-400">₹{pkg.price}</p>
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">per plate</p>
                  </div>
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <Utensils size={12} className="text-amber-400" /> Includes:
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed font-medium">{pkg.includes}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Function Prospectus Sheet list view */
        <div className="space-y-4">
          <div className="bg-orange-950/20 border border-orange-500/20 rounded-2xl p-4 flex items-center gap-3">
            <Info size={20} className="text-orange-400 shrink-0" />
            <p className="text-xs text-slate-300 leading-relaxed">
              <span className="font-bold text-white">Function Prospectus (FP Sheet):</span> The official operational instruction document printed for hotel kitchen, housekeeping, audio-visual, and banquet service staff for smooth event execution.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bookings.length === 0 ? (
              <div className="col-span-full py-16 text-center border-2 border-dashed border-slate-800 rounded-3xl text-slate-500">
                <FileText size={40} className="mx-auto mb-2 text-slate-700" />
                <p className="font-bold text-sm text-slate-300">No Function Prospectus Available</p>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  Once an event is booked, its operational FP Sheet will automatically appear here with kitchen and event instructions.
                </p>
              </div>
            ) : (
              bookings.map((b) => (
                <div key={b.id} className="bg-[#090f1e]/80 border border-slate-800 rounded-3xl p-5 space-y-3 flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-black text-sm text-white">{b.eventName}</h4>
                      <span className="text-[9px] font-black text-orange-400 uppercase tracking-wider px-2 py-0.5 rounded bg-orange-500/10 border border-orange-500/20">
                        {b.eventType}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Venue: <span className="text-white font-bold">{b.hall.name}</span> · {b.paxCount} Pax · {new Date(b.eventDate).toLocaleDateString('en-IN')}
                    </p>
                  </div>

                  <button 
                    onClick={() => { setSelectedFPBooking(b); setShowFPModal(true); }}
                    className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white text-xs font-black rounded-xl transition-all shadow-md shrink-0 flex items-center gap-1.5"
                  >
                    <FileText size={13} /> View FP Sheet
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* MODAL 1: Create New Booking */}
      {showBookingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-5 overflow-hidden">
          <div className="bg-[#090f1e] border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* 1. Modal Sticky Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#090f1e] shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
                  <Calendar size={18} />
                </div>
                <div>
                  <h2 className="text-base font-black text-white">New Event Booking & Estimate</h2>
                  <p className="text-[11px] text-slate-400 font-medium">Reserve banquet hall, calculate catering package, and add misc services.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowBookingModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* 2. Modal Scrollable Form Body */}
            <form id="banquetBookingForm" onSubmit={handleCreateBooking} className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
              {/* SECTION A: Venue & Client Details */}
              <div className="bg-[#050a14] border border-slate-800/80 rounded-2xl p-4 space-y-3.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block border-b border-slate-800/60 pb-1.5">
                  1. Venue & Event Info
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[10px] font-black uppercase text-slate-400">Select Banquet Hall *</label>
                      <button
                        type="button"
                        onClick={() => setShowHallModal(true)}
                        className="flex items-center gap-1 text-[10px] font-bold text-orange-400 hover:text-orange-300 bg-orange-500/10 hover:bg-orange-500/20 px-2 py-0.5 rounded-lg border border-orange-500/30 transition-all"
                      >
                        <Plus size={10} /> Add New Hall
                      </button>
                    </div>
                    <select
                      required
                      className="w-full bg-[#090f1e] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500 font-medium"
                      value={bookingForm.hallId}
                      onChange={e => {
                        if (e.target.value === '__ADD_NEW__') {
                          setShowHallModal(true);
                          return;
                        }
                        const selHall = halls.find(h => h.id === e.target.value);
                        setBookingForm({
                          ...bookingForm,
                          hallId: e.target.value,
                          hallRent: selHall ? selHall.baseRate.toString() : bookingForm.hallRent
                        });
                      }}
                    >
                      {halls.length === 0 ? (
                        <option value="" disabled className="bg-[#090f1e] text-slate-400">No banquet halls found. Click "+ Add New Hall" above.</option>
                      ) : (
                        <>
                          {!bookingForm.hallId && <option value="" disabled className="bg-[#090f1e] text-slate-400">Select a Banquet Hall...</option>}
                          {halls.map(h => (
                            <option key={h.id} value={h.id} className="bg-[#090f1e] text-white">
                              {h.name} (Max {h.capacity} Pax - ₹{h.baseRate.toLocaleString('en-IN')})
                            </option>
                          ))}
                          <option value="__ADD_NEW__" className="bg-[#090f1e] text-orange-400 font-black">
                            + Add New Banquet Hall...
                          </option>
                        </>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Event Title / Name *</label>
                    <input
                      type="text" required placeholder="e.g. Sharma Wedding Reception"
                      className="w-full bg-[#090f1e] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500 font-medium"
                      value={bookingForm.eventName}
                      onChange={e => setBookingForm({...bookingForm, eventName: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Client Full Name *</label>
                    <input
                      type="text" required placeholder="e.g. Raj Sharma"
                      className="w-full bg-[#090f1e] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500 font-medium"
                      value={bookingForm.clientName}
                      onChange={e => setBookingForm({...bookingForm, clientName: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Mobile Number *</label>
                    <input
                      type="text" required placeholder="+91 98765..."
                      className="w-full bg-[#090f1e] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500 font-medium"
                      value={bookingForm.clientPhone}
                      onChange={e => setBookingForm({...bookingForm, clientPhone: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Event Type</label>
                    <select
                      className="w-full bg-[#090f1e] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500 font-medium"
                      value={bookingForm.eventType}
                      onChange={e => setBookingForm({...bookingForm, eventType: e.target.value})}
                    >
                      <option value="Wedding" className="bg-[#090f1e] text-white">Wedding / Reception</option>
                      <option value="Corporate" className="bg-[#090f1e] text-white">Corporate Seminar / Meeting</option>
                      <option value="Birthday" className="bg-[#090f1e] text-white">Birthday Party</option>
                      <option value="Anniversary" className="bg-[#090f1e] text-white">Anniversary Celebration</option>
                      <option value="Seminar" className="bg-[#090f1e] text-white">Seminar / Conference</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Event Date *</label>
                    <input
                      type="date" required
                      className="w-full bg-[#090f1e] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500 font-medium"
                      value={bookingForm.eventDate}
                      onChange={e => setBookingForm({...bookingForm, eventDate: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Guest Count (Pax) *</label>
                    <input
                      type="number" required min="1"
                      className="w-full bg-[#090f1e] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500 font-medium"
                      value={bookingForm.paxCount}
                      onChange={e => setBookingForm({...bookingForm, paxCount: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Seating Arrangement</label>
                    <select
                      className="w-full bg-[#090f1e] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500 font-medium"
                      value={bookingForm.seatingLayout}
                      onChange={e => setBookingForm({...bookingForm, seatingLayout: e.target.value})}
                    >
                      <option value="CLUSTER" className="bg-[#090f1e] text-white">Cluster / Round Tables</option>
                      <option value="THEATER" className="bg-[#090f1e] text-white">Theater Style</option>
                      <option value="U_SHAPE" className="bg-[#090f1e] text-white">U-Shape Boardroom</option>
                      <option value="CLASSROOM" className="bg-[#090f1e] text-white">Classroom Style</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION B: Catering & Base Tariff */}
              <div className="bg-[#050a14] border border-slate-800/80 rounded-2xl p-4 space-y-3.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block border-b border-slate-800/60 pb-1.5">
                  2. Catering Package & Base Rent
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Catering Package</label>
                    <select
                      className="w-full bg-[#090f1e] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500 font-medium"
                      value={bookingForm.cateringPackage}
                      onChange={e => {
                        const pkg = CATERING_PACKAGES.find(p => p.name === e.target.value);
                        setBookingForm({
                          ...bookingForm,
                          cateringPackage: e.target.value,
                          ratePerPlate: pkg ? pkg.price.toString() : bookingForm.ratePerPlate
                        });
                      }}
                    >
                      {CATERING_PACKAGES.map(p => (
                        <option key={p.name} value={p.name} className="bg-[#090f1e] text-white">{p.name} (₹{p.price}/pax)</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Rate Per Plate (₹)</label>
                    <input
                      type="number"
                      className="w-full bg-[#090f1e] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500 font-bold"
                      value={bookingForm.ratePerPlate}
                      onChange={e => setBookingForm({...bookingForm, ratePerPlate: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Base Hall Rent (₹)</label>
                    <input
                      type="number"
                      className="w-full bg-[#090f1e] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500 font-bold"
                      value={bookingForm.hallRent}
                      onChange={e => setBookingForm({...bookingForm, hallRent: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              {/* SECTION C: Extra & Miscellaneous Charges Manager */}
              <div className="bg-[#050a14] border border-slate-800/80 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles size={14} className="text-orange-400" />
                    <span className="text-[11px] font-black uppercase tracking-wider text-white">
                      3. Extra & Miscellaneous Charges (Decor, Audio, DJ, etc.)
                    </span>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20">
                      Total: ₹{totalMiscCharges.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddMiscItem}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-black uppercase tracking-wider transition-all shadow-md active:scale-95"
                  >
                    <Plus size={12} /> Add Misc
                  </button>
                </div>

                {/* Quick Add Presets Chips */}
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  <span className="text-[9px] font-black uppercase text-slate-500 mr-1">Quick Add:</span>
                  {MISC_PRESETS.map((p) => (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => handleAddPresetMisc(p)}
                      className="px-2.5 py-1 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-[10px] font-bold text-slate-300 hover:text-orange-400 hover:border-orange-500/30 transition-all flex items-center gap-1"
                    >
                      <Plus size={10} className="text-orange-400" />
                      <span>{p.name}</span>
                      <span className="text-slate-500 text-[9px]">₹{p.amount.toLocaleString('en-IN')}</span>
                    </button>
                  ))}
                </div>

                {/* Dynamic Itemized Rows */}
                <div className="space-y-2 pt-1 max-h-48 overflow-y-auto pr-1">
                  {miscItems.length === 0 ? (
                    <div className="text-center py-3 border border-dashed border-slate-800 rounded-xl">
                      <p className="text-xs text-slate-500 font-medium">No misc or extra charges added yet.</p>
                      <button
                        type="button"
                        onClick={handleAddMiscItem}
                        className="mt-1.5 text-xs font-black text-orange-400 hover:underline"
                      >
                        + Add Custom Misc Charge
                      </button>
                    </div>
                  ) : (
                    miscItems.map((item, index) => (
                      <div key={item.id} className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-slate-600 w-5 text-center">#{index + 1}</span>
                        <input
                          type="text"
                          placeholder="e.g. Stage Floral Decor, DJ Setup, LED Wall, Valet"
                          className="flex-1 bg-[#090f1e] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                          value={item.name}
                          onChange={(e) => handleUpdateMiscItem(item.id, 'name', e.target.value)}
                        />
                        <div className="relative w-36">
                          <span className="absolute left-3 top-2 text-slate-500 text-xs font-bold">₹</span>
                          <input
                            type="number"
                            placeholder="Amount"
                            className="w-full bg-[#090f1e] border border-slate-800 rounded-xl pl-7 pr-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500 font-bold"
                            value={item.amount}
                            onChange={(e) => handleUpdateMiscItem(item.id, 'amount', e.target.value)}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveMiscItem(item.id)}
                          className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all"
                          title="Remove item"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* SECTION D: Advance Deposit & Financial Estimation */}
              <div className="bg-[#050a14] border border-slate-800/80 rounded-2xl p-4 space-y-3.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block border-b border-slate-800/60 pb-1.5">
                  4. Billing Summary & Advance Deposit
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                      Advance Deposit Received (₹)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-2.5 text-slate-500 text-xs font-bold">₹</span>
                      <input
                        type="number"
                        className="w-full bg-[#090f1e] border border-slate-800 rounded-xl pl-8 pr-3 py-2.5 text-xs text-white font-bold focus:outline-none focus:border-emerald-500"
                        placeholder="Enter advance deposit amount"
                        value={bookingForm.advancePaid}
                        onChange={e => setBookingForm({...bookingForm, advancePaid: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800/80">
                    <div>
                      <p className="text-[9px] text-slate-500 uppercase font-black tracking-wider">Estimated Total</p>
                      <p className="text-lg font-black text-emerald-400">
                        ₹{(
                          (parseFloat(bookingForm.hallRent) || 0) + 
                          ((parseInt(bookingForm.paxCount) || 0) * (parseFloat(bookingForm.ratePerPlate) || 0)) + 
                          totalMiscCharges
                        ).toLocaleString('en-IN')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] text-slate-500 uppercase font-black tracking-wider">Balance Due</p>
                      <p className="text-lg font-black text-amber-400">
                        ₹{Math.max(0, (
                          ((parseFloat(bookingForm.hallRent) || 0) + 
                          ((parseInt(bookingForm.paxCount) || 0) * (parseFloat(bookingForm.ratePerPlate) || 0)) + 
                          totalMiscCharges) - (parseFloat(bookingForm.advancePaid) || 0)
                        )).toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Special Setup / Instructions & Notes</label>
                  <textarea
                    rows={2} placeholder="Stage requirements, floral decoration, DJ timings, setup notes..."
                    className="w-full bg-[#090f1e] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                    value={bookingForm.specialInstructions}
                    onChange={e => setBookingForm({...bookingForm, specialInstructions: e.target.value})}
                  />
                </div>
              </div>
            </form>

            {/* 3. Modal Sticky Footer */}
            <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-800 bg-[#070c18] shrink-0">
              <div className="flex items-center gap-3 text-xs">
                <div>
                  <span className="text-[9px] text-slate-500 font-bold uppercase block">Total Cost</span>
                  <span className="font-black text-emerald-400 text-sm">
                    ₹{(
                      (parseFloat(bookingForm.hallRent) || 0) + 
                      ((parseInt(bookingForm.paxCount) || 0) * (parseFloat(bookingForm.ratePerPlate) || 0)) + 
                      totalMiscCharges
                    ).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="h-6 w-px bg-slate-800" />
                <div>
                  <span className="text-[9px] text-slate-500 font-bold uppercase block">Balance Due</span>
                  <span className="font-black text-amber-400 text-sm">
                    ₹{Math.max(0, (
                      ((parseFloat(bookingForm.hallRent) || 0) + 
                      ((parseInt(bookingForm.paxCount) || 0) * (parseFloat(bookingForm.ratePerPlate) || 0)) + 
                      totalMiscCharges) - (parseFloat(bookingForm.advancePaid) || 0)
                    )).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowBookingModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-800 text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-850 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="banquetBookingForm"
                  className="px-6 py-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-xs font-black text-white shadow-lg shadow-orange-600/20 active:scale-95 transition-all"
                >
                  Confirm Event Booking
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Record Payment */}
      {showPaymentModal && paymentBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
          <div className="bg-[#090f1e] border border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl relative space-y-4">
            <h2 className="text-base font-black text-white border-b border-slate-800 pb-3 flex items-center gap-2">
              <IndianRupee size={16} className="text-emerald-400" /> Record Advance / Payment
            </h2>
            <div className="space-y-1 text-xs">
              <p className="text-slate-300 font-bold">{paymentBooking.eventName}</p>
              <p className="text-slate-500">Client: {paymentBooking.clientName}</p>
              <div className="flex justify-between pt-2 border-t border-slate-800">
                <span className="text-slate-400">Total Estimate:</span>
                <span className="font-bold text-white">₹{paymentBooking.totalAmount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Already Paid:</span>
                <span className="font-bold text-emerald-400">₹{paymentBooking.advancePaid.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-amber-400 font-bold pt-1">
                <span>Remaining Due:</span>
                <span>₹{paymentBooking.dueAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-4 pt-2">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">New Payment Received (₹)</label>
                <input
                  type="number" required min="1" max={paymentBooking.dueAmount}
                  placeholder={`Max ₹${paymentBooking.dueAmount}`}
                  className="w-full bg-[#050a14] border border-slate-850 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  value={paymentAmount}
                  onChange={e => setPaymentAmount(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button" onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-800 text-xs font-black text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-black text-white shadow-md active:scale-95 transition-all"
                >
                  Save Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Printable Function Prospectus (FP Sheet) */}
      {showFPModal && selectedFPBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 overflow-y-auto">
          <div className="bg-white text-slate-900 border border-slate-300 rounded-3xl p-8 w-full max-w-3xl shadow-2xl relative space-y-6 my-8">
            <button 
              onClick={() => setShowFPModal(false)}
              className="absolute top-6 right-6 p-2 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200"
            >
              ✕
            </button>

            {/* FP Header */}
            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-orange-600">Hotel Banquet Operations</span>
                <h2 className="text-2xl font-black text-slate-900">FUNCTION PROSPECTUS (FP SHEET)</h2>
                <p className="text-xs text-slate-500">Ref ID: FP-{selectedFPBooking.id.slice(-6).toUpperCase()}</p>
              </div>
              <button onClick={() => window.print()} className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800">
                <Printer size={14} /> Print FP Sheet
              </button>
            </div>

            {/* Event Overview */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-100 p-4 rounded-2xl border border-slate-200 text-xs">
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Event Name</span>
                <span className="font-black text-slate-900">{selectedFPBooking.eventName}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Host / Client</span>
                <span className="font-black text-slate-900">{selectedFPBooking.clientName}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Event Date</span>
                <span className="font-black text-slate-900">{new Date(selectedFPBooking.eventDate).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Guest Count (Pax)</span>
                <span className="font-black text-slate-900">{selectedFPBooking.paxCount} Guests</span>
              </div>
            </div>

            {/* Venue & Operations Instructions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
              <div className="space-y-3 border p-4 rounded-2xl border-slate-200">
                <h4 className="font-black text-slate-900 uppercase text-[11px] border-b pb-2">Venue & Seating Setup</h4>
                <div className="space-y-1.5">
                  <p><span className="text-slate-500">Hall Stage:</span> <strong>{selectedFPBooking.hall.name}</strong></p>
                  <p><span className="text-slate-500">Seating Layout:</span> <strong>{selectedFPBooking.seatingLayout || 'Cluster Setup'}</strong></p>
                  <p><span className="text-slate-500">Timing Slot:</span> <strong>{new Date(selectedFPBooking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(selectedFPBooking.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong></p>
                </div>
              </div>

              <div className="space-y-3 border p-4 rounded-2xl border-slate-200">
                <h4 className="font-black text-slate-900 uppercase text-[11px] border-b pb-2">Kitchen & Catering Instructions</h4>
                <div className="space-y-1.5">
                  <p><span className="text-slate-500">Menu Tier:</span> <strong>{selectedFPBooking.cateringPackage || 'Custom Menu'}</strong></p>
                  <p><span className="text-slate-500">Food Readiness:</span> <strong>30 Mins prior to event start</strong></p>
                  <p><span className="text-slate-500">Guaranteed Pax:</span> <strong>{selectedFPBooking.paxCount} Plates</strong></p>
                </div>
              </div>
            </div>

            {selectedFPBooking.miscCharges && (() => {
              try {
                const parsed = JSON.parse(selectedFPBooking.miscCharges);
                if (Array.isArray(parsed) && parsed.length > 0) {
                  return (
                    <div className="space-y-2 border p-4 rounded-2xl border-slate-200">
                      <h4 className="font-black text-slate-900 uppercase text-[11px] border-b pb-2 flex items-center justify-between">
                        <span>Extra & Miscellaneous Setup Services</span>
                        <span className="text-orange-600 font-black">Total: ₹{selectedFPBooking.extraCharges.toLocaleString('en-IN')}</span>
                      </h4>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {parsed.map((m: any, idx: number) => (
                          <div key={idx} className="flex justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                            <span className="text-slate-700 font-medium">{m.name || 'Extra Item'}</span>
                            <span className="font-black text-slate-900">₹{Number(m.amount || 0).toLocaleString('en-IN')}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }
              } catch (e) {
                return null;
              }
              return null;
            })()}

            {selectedFPBooking.specialInstructions && (
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl text-xs space-y-1">
                <p className="font-black text-amber-900 uppercase text-[10px]">Special Instructions & Decor Notes:</p>
                <p className="text-amber-800 italic">"{selectedFPBooking.specialInstructions}"</p>
              </div>
            )}

            <div className="flex justify-end pt-4 border-t border-slate-200">
              <button onClick={() => setShowFPModal(false)} className="px-5 py-2 bg-slate-900 text-white text-xs font-black rounded-xl">
                Close Prospectus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Create Banquet Hall */}
      {showHallModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
          <div className="bg-[#090f1e] border border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl relative space-y-4">
            <h2 className="text-base font-black text-white border-b border-slate-800 pb-3 flex items-center gap-2">
              <Layers size={16} className="text-orange-400" /> Add New Banquet Hall / Venue
            </h2>

            <form onSubmit={handleCreateHall} className="space-y-3">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Hall Name *</label>
                <input
                  type="text" required placeholder="e.g. Royal Emerald Lounge"
                  className="w-full bg-[#050a14] border border-slate-850 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                  value={hallForm.name}
                  onChange={e => setHallForm({...hallForm, name: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Max Capacity (Pax) *</label>
                  <input
                    type="number" required
                    className="w-full bg-[#050a14] border border-slate-850 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                    value={hallForm.capacity}
                    onChange={e => setHallForm({...hallForm, capacity: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Base Daily Rent (₹)</label>
                  <input
                    type="number" required
                    className="w-full bg-[#050a14] border border-slate-850 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                    value={hallForm.baseRate}
                    onChange={e => setHallForm({...hallForm, baseRate: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Amenities (Comma separated)</label>
                <input
                  type="text"
                  placeholder="AC, Stage, Projector, Sound System"
                  className="w-full bg-[#050a14] border border-slate-850 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                  value={hallForm.amenities}
                  onChange={e => setHallForm({...hallForm, amenities: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Hall Description</label>
                <textarea
                  rows={2}
                  className="w-full bg-[#050a14] border border-slate-850 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                  value={hallForm.description}
                  onChange={e => setHallForm({...hallForm, description: e.target.value})}
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button" onClick={() => setShowHallModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-800 text-xs font-black text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-xs font-black text-white shadow-md transition-all"
                >
                  Create Venue Hall
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
