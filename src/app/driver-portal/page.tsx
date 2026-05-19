'use client';

import React, { useState, useEffect } from 'react';
import { 
  Bike, 
  MapPin, 
  Phone, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  Lock, 
  X, 
  Smartphone, 
  Sparkles, 
  RefreshCw, 
  LogOut,
  Navigation,
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { motion, AnimatePresence } from 'framer-motion';

interface Driver {
  id: string;
  name: string;
  phone: string | null;
  vehicleNumber: string | null;
  isActive: boolean;
}

interface OrderItem {
  id: string;
  product: {
    name: string;
    image: string | null;
  };
  quantity: number;
  totalAmount: number;
}

interface PosOrder {
  id: string;
  orderNo: string;
  orderType: string;
  status: string;
  grandTotal: number;
  deliveryCustomerName: string | null;
  deliveryPhone: string | null;
  deliveryAddress: string | null;
  deliveryInstructions: string | null;
  items: OrderItem[];
  createdAt: string;
}

export default function DriverPortalPage() {
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [assignedOrders, setAssignedOrders] = useState<PosOrder[]>([]);
  const [unassignedOrders, setUnassignedOrders] = useState<PosOrder[]>([]);
  const [portalTab, setPortalTab] = useState<'MY_DELIVERIES' | 'AVAILABLE'>('MY_DELIVERIES');
  const [fetchingOrders, setFetchingOrders] = useState(false);
  
  // Login Form States
  const [phone, setPhone] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);
 
  // OTP Modal states
  const [activeOrder, setActiveOrder] = useState<PosOrder | null>(null);
  const [otpValue, setOtpValue] = useState('');
  const [submittingOtp, setSubmittingOtp] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [deliverySuccess, setDeliverySuccess] = useState(false);
 
  // 1. Fetch assigned & unassigned orders
  const fetchAssignedOrders = async (driverId: string) => {
    setFetchingOrders(true);
    try {
      const res = await fetch(`/api/public/driver?action=active-orders&driverId=${driverId}`);
      const json = await res.json();
      if (json.success && json.data) {
        setAssignedOrders(json.data.assigned || []);
        setUnassignedOrders(json.data.unassigned || []);
      }
    } catch (err) {
      console.error('Failed to load assigned orders:', err);
    } finally {
      setFetchingOrders(false);
    }
  };

  // 1b. Claim an available unassigned order
  const handleClaimOrder = async (orderId: string) => {
    if (!selectedDriver) return;
    setFetchingOrders(true);
    try {
      const res = await fetch('/api/public/driver', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'claim',
          orderId,
          driverId: selectedDriver.id
        })
      });
      const json = await res.json();
      if (json.success) {
        await fetchAssignedOrders(selectedDriver.id);
        setPortalTab('MY_DELIVERIES');
      } else {
        alert(json.message || 'Failed to claim delivery');
      }
    } catch (err) {
      console.error('Claim order error:', err);
    } finally {
      setFetchingOrders(false);
    }
  };

  // 2. Handle Login Submission
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !vehicleNumber) return;

    setLoggingIn(true);
    setLoginError(null);
    try {
      const res = await fetch('/api/public/driver', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'login',
          phone,
          vehicleNumber
        })
      });
      const json = await res.json();
      if (json.success && json.data) {
        setSelectedDriver(json.data);
      } else {
        setLoginError(json.message || 'Login failed. Please verify details.');
      }
    } catch (err) {
      setLoginError('A network error occurred. Please try again.');
    } finally {
      setLoggingIn(false);
    }
  };

  useEffect(() => {
    if (selectedDriver) {
      fetchAssignedOrders(selectedDriver.id);
      // Save rider session
      localStorage.setItem('active_rider', JSON.stringify(selectedDriver));
    } else {
      setAssignedOrders([]);
      setUnassignedOrders([]);
      localStorage.removeItem('active_rider');
    }
  }, [selectedDriver]);

  // Restore rider session on mount
  useEffect(() => {
    const saved = localStorage.getItem('active_rider');
    if (saved) {
      try {
        setSelectedDriver(JSON.parse(saved));
      } catch (e) {
        // silent fail
      }
    }
  }, []);

  // 3. Handle OTP Submission
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrder || !selectedDriver || otpValue.length !== 4) return;

    setSubmittingOtp(true);
    setOtpError(null);
    try {
      const res = await fetch('/api/public/driver', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: activeOrder.id,
          driverId: selectedDriver.id,
          otp: otpValue
        })
      });
      const json = await res.json();
      if (json.success) {
        setDeliverySuccess(true);
        setOtpValue('');
        // Refresh orders list
        await fetchAssignedOrders(selectedDriver.id);
        setTimeout(() => {
          setActiveOrder(null);
          setDeliverySuccess(false);
        }, 2000);
      } else {
        setOtpError(json.message || 'Verification failed. Invalid OTP code.');
      }
    } catch (err) {
      setOtpError('A network error occurred. Please try again.');
    } finally {
      setSubmittingOtp(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090b10] text-[#f8fafc] font-sans selection:bg-rose-500 selection:text-white pb-12">
      {/* Dynamic Grid Background overlay */}
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none" style={{
        backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px), linear-gradient(to right, #ffffff11 1px, transparent 1px), linear-gradient(to bottom, #ffffff11 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }} />

      {/* Header Banner */}
      <header className="relative bg-gradient-to-r from-rose-600/10 via-indigo-600/5 to-transparent border-b border-[#1e293b]/50 px-5 py-6 flex items-center justify-between sticky top-0 backdrop-blur-md z-40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-500 to-rose-600 flex items-center justify-center shadow-lg shadow-rose-500/20">
            <Bike size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-md font-black uppercase tracking-wider text-white">Rider Portal</h1>
            <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest leading-none mt-0.5">Delivery System</p>
          </div>
        </div>

        {selectedDriver && (
          <button 
            onClick={() => setSelectedDriver(null)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1e293b]/60 hover:bg-rose-500/10 hover:text-rose-400 border border-[#334155]/60 text-slate-400 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all"
          >
            <LogOut size={11} /> Exit
          </button>
        )}
      </header>

      {/* Main Body */}
      <main className="p-5 max-w-md mx-auto space-y-6">
        
        {/* STEP 1: Secure Rider Login */}
        {!selectedDriver ? (
          <div className="space-y-6 pt-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-black text-white tracking-tight uppercase">Rider Sign In</h2>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest max-w-[280px] mx-auto leading-relaxed">
                Enter your registered mobile number and vehicle plate details to securely access your home delivery portal.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5 bg-[#0f172a] border border-[#1e293b] rounded-[2.2rem] p-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -mr-16 -mt-16 blur-xl" />

              {/* Mobile Phone Number */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">
                  Mobile Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4.5 flex items-center pointer-events-none text-slate-500">
                    <Phone size={14} />
                  </div>
                  <input
                    type="tel"
                    required
                    placeholder="Enter registered mobile number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    className="w-full h-12 pl-12 pr-4 rounded-2xl bg-[#070b12] border border-[#1e293b] text-white placeholder-slate-600 focus:border-rose-500 outline-none transition-all text-xs font-bold font-mono tracking-wider"
                  />
                </div>
              </div>

              {/* Vehicle License Plate / PIN */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">
                  Vehicle Plate Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4.5 flex items-center pointer-events-none text-slate-500">
                    <Lock size={14} />
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="e.g. DL-3C-1234 or plate ID"
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value)}
                    className="w-full h-12 pl-12 pr-4 rounded-2xl bg-[#070b12] border border-[#1e293b] text-white placeholder-slate-600 focus:border-rose-500 outline-none transition-all text-xs font-bold uppercase tracking-wider"
                  />
                </div>
                <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider block ml-1">
                  * Note: Use the exact vehicle number registered by the admin.
                </span>
              </div>

              {loginError && (
                <div className="text-[9px] text-red-500 font-extrabold uppercase tracking-wide leading-relaxed bg-red-500/10 border border-red-500/20 py-2.5 px-3.5 rounded-xl">
                  ❌ {loginError}
                </div>
              )}

              <Button
                type="submit"
                loading={loggingIn}
                className="w-full h-13 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-500/25 flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
              >
                Sign In & Launch Portal <ArrowRight size={12} />
              </Button>
            </form>
          </div>
        ) : (
          /* STEP 2: Assigned Active Deliveries */
          <div className="space-y-6">
            
            {/* Active Driver Badge HUD */}
            <div className="bg-[#0f172a] border border-[#1e293b] rounded-[1.75rem] p-4.5 flex items-center justify-between shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full -mr-12 -mt-12 blur-xl" />
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 font-black text-sm uppercase">
                  {selectedDriver.name.slice(0, 2)}
                </div>
                <div>
                  <span className="text-[8px] font-black text-rose-500 uppercase tracking-widest leading-none block mb-1">Signed in Rider</span>
                  <h3 className="text-sm font-black text-white uppercase tracking-tight leading-none">{selectedDriver.name}</h3>
                  <p className="text-[9px] font-mono font-bold text-slate-400 uppercase mt-1 leading-none">{selectedDriver.vehicleNumber}</p>
                </div>
              </div>

              <button
                onClick={() => fetchAssignedOrders(selectedDriver.id)}
                disabled={fetchingOrders}
                className="w-10 h-10 bg-[#1e293b]/60 border border-[#334155]/60 text-slate-300 rounded-xl flex items-center justify-center transition-all hover:bg-[#1d2433] disabled:opacity-50"
                title="Refresh Assigned Deliveries"
              >
                <RefreshCw size={14} className={fetchingOrders ? 'animate-spin' : ''} />
              </button>
            </div>

            {/* Elegant slider tabs */}
            <div className="flex bg-[#0f172a] p-1 rounded-2xl border border-[#1e293b] gap-1">
              <button
                type="button"
                onClick={() => setPortalTab('MY_DELIVERIES')}
                className={`flex-1 py-3 text-center text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${
                  portalTab === 'MY_DELIVERIES'
                    ? 'bg-rose-500 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                My Deliveries ({assignedOrders.length})
              </button>
              <button
                type="button"
                onClick={() => setPortalTab('AVAILABLE')}
                className={`flex-1 py-3 text-center text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${
                  portalTab === 'AVAILABLE'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Available Nearby ({unassignedOrders.length})
              </button>
            </div>

            <div className="space-y-2.5">
              {portalTab === 'MY_DELIVERIES' ? (
                <div className="space-y-4">
                  {fetchingOrders && assignedOrders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 space-y-4">
                      <div className="w-8 h-8 border-3 border-rose-500/20 rounded-full animate-spin border-t-rose-500"></div>
                      <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Checking assignments...</p>
                    </div>
                  ) : assignedOrders.length === 0 ? (
                    <div className="text-center py-20 bg-[#0f172a] rounded-[2.2rem] border border-[#1e293b] p-6 space-y-4">
                      <div className="w-12 h-12 bg-rose-500/10 rounded-2xl flex items-center justify-center text-rose-500 mx-auto border border-rose-500/20">
                        <CheckCircle2 size={24} className="animate-pulse" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-bold text-white text-sm uppercase tracking-tight">All Deliveries Done!</h4>
                        <p className="text-xs text-slate-500 max-w-[200px] mx-auto leading-relaxed">
                          You don't have any pending delivery assignments right now. Relax!
                        </p>
                      </div>
                    </div>
                  ) : (
                    assignedOrders.map(order => {
                      const isFoodReady = order.status === 'READY';
                      return (
                        <div 
                          key={order.id}
                          className={`bg-[#0f172a] border ${isFoodReady ? 'border-rose-500/25 shadow-rose-500/5' : 'border-[#1e293b]'} rounded-[2.2rem] p-5 shadow-lg space-y-5 relative overflow-hidden transition-all duration-300 hover:border-[#334155]`}
                        >
                          {/* Compact Ready HUD Indicator */}
                          {isFoodReady && (
                            <div className="absolute top-0 right-5 bg-rose-500 text-white text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-b-xl shadow-md flex items-center gap-1.5 animate-pulse">
                              <Sparkles size={8} /> Ready for Pickup
                            </div>
                          )}

                          {/* Order Header */}
                          <div className="flex items-start justify-between border-b border-[#1e293b] pb-3.5">
                            <div className="space-y-0.5">
                              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Order Number</span>
                              <h4 className="text-sm font-black text-white leading-none font-mono tracking-tight">{order.orderNo}</h4>
                            </div>
                            <div className="text-right">
                              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none block mb-0.5">Grand Total</span>
                              <span className="text-md font-black text-rose-500 leading-none">₹{order.grandTotal.toFixed(0)}</span>
                            </div>
                          </div>

                          {/* Customer Information Section */}
                          <div className="space-y-3.5">
                            <div className="flex items-center justify-between bg-[#070b12] px-4 py-3 rounded-2xl border border-[#1e293b]/60">
                              <div className="min-w-0 pr-3">
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-0.5 leading-none">Customer</span>
                                <h4 className="text-xs font-black text-slate-100 uppercase tracking-tight truncate">{order.deliveryCustomerName || 'Guest'}</h4>
                                <p className="text-[10px] font-mono font-bold text-slate-400 mt-1 block leading-none">{order.deliveryPhone || 'No Phone'}</p>
                              </div>
                              {order.deliveryPhone && (
                                <a
                                  href={`tel:${order.deliveryPhone}`}
                                  className="w-9 h-9 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center flex-shrink-0 hover:bg-emerald-500 hover:text-white transition-all shadow-md active:scale-95"
                                >
                                  <Phone size={14} />
                                </a>
                              )}
                            </div>

                            {/* Delivery Address & Directions Link */}
                            <div className="flex items-start gap-3 bg-[#070b12] px-4 py-3.5 rounded-2xl border border-[#1e293b]/60">
                              <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 flex-shrink-0 mt-0.5">
                                <MapPin size={13} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1 leading-none">Delivery Address</span>
                                <p className="text-[11px] font-bold text-slate-200 leading-relaxed uppercase">
                                  {order.deliveryAddress || 'No Address Provided'}
                                </p>
                                {order.deliveryInstructions && (
                                  <p className="text-[9px] text-amber-500 font-extrabold uppercase mt-1">
                                    ⚠️ Notes: {order.deliveryInstructions}
                                  </p>
                                )}
                                {order.deliveryAddress && (
                                  <a
                                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.deliveryAddress)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-[8px] font-black text-indigo-400 uppercase tracking-widest mt-2 hover:text-indigo-300 transition-colors"
                                  >
                                    <Navigation size={9} /> Open Directions map
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Order Items Summary Drawer */}
                          <div className="space-y-1.5">
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block ml-1">Items Summary</span>
                            <div className="bg-[#070b12]/30 rounded-2xl p-3 border border-[#1e293b]/40 divide-y divide-[#1e293b]/60">
                              {order.items.map(item => (
                                <div key={item.id} className="flex justify-between items-center py-1.5 first:pt-0 last:pb-0 text-[11px] font-bold text-slate-350">
                                  <span>{item.product.name}</span>
                                  <span className="text-slate-400">Qty {item.quantity}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Delivery Verification Action Button */}
                          <div className="pt-2">
                            <button
                              onClick={() => {
                                setActiveOrder(order);
                                setOtpValue('');
                                setOtpError(null);
                              }}
                              className={`w-full h-13 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
                                isFoodReady 
                                  ? 'bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white shadow-rose-500/20' 
                                  : 'bg-[#1e293b] hover:bg-[#28354c] text-slate-300 border border-[#334155]/60'
                              }`}
                            >
                              <Lock size={12} /> Confirm Delivery (Enter OTP)
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {fetchingOrders && unassignedOrders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 space-y-4">
                      <div className="w-8 h-8 border-3 border-indigo-500/20 rounded-full animate-spin border-t-indigo-500"></div>
                      <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Checking available deliveries...</p>
                    </div>
                  ) : unassignedOrders.length === 0 ? (
                    <div className="text-center py-20 bg-[#0f172a] rounded-[2.2rem] border border-[#1e293b] p-6 space-y-4">
                      <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400 mx-auto border border-indigo-500/20">
                        <HelpCircle size={24} className="animate-pulse" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-bold text-white text-sm uppercase tracking-tight">No Nearby Orders</h4>
                        <p className="text-xs text-slate-500 max-w-[200px] mx-auto leading-relaxed">
                          There are no open delivery orders matching your branch location or geofence coverage area right now.
                        </p>
                      </div>
                    </div>
                  ) : (
                    unassignedOrders.map(order => (
                      <div 
                        key={order.id}
                        className="bg-[#0f172a] border border-[#1e293b] rounded-[2.2rem] p-5 shadow-lg space-y-5 relative overflow-hidden transition-all duration-300 hover:border-[#334155]"
                      >
                        {/* Order Header */}
                        <div className="flex items-start justify-between border-b border-[#1e293b] pb-3.5">
                          <div className="space-y-0.5">
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Order Number</span>
                            <h4 className="text-sm font-black text-white leading-none font-mono tracking-tight">{order.orderNo}</h4>
                          </div>
                          <div className="text-right">
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none block mb-0.5">Grand Total</span>
                            <span className="text-md font-black text-indigo-400 leading-none">₹{order.grandTotal.toFixed(0)}</span>
                          </div>
                        </div>

                        {/* Customer & Destination Destination */}
                        <div className="space-y-3.5">
                          <div className="flex items-start gap-3 bg-[#070b12] px-4 py-3.5 rounded-2xl border border-[#1e293b]/60">
                            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 flex-shrink-0 mt-0.5">
                              <MapPin size={13} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1 leading-none">Delivery Destination</span>
                              <p className="text-[11px] font-bold text-slate-200 leading-relaxed uppercase">
                                {order.deliveryAddress || 'No Address Provided'}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Claim Button */}
                        <div className="pt-2">
                          <button
                            onClick={() => handleClaimOrder(order.id)}
                            className="w-full h-13 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-500/10 bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                          >
                            <Bike size={12} /> Claim & Deliver Order
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* OTP verification Modal Drawer */}
      <AnimatePresence>
        {activeOrder && (
          <>
            {/* Dark overlay backdrop */}
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => !submittingOtp && setActiveOrder(null)} 
              className="fixed inset-0 bg-[#020408]/80 backdrop-blur-md z-50" 
            />
            
            {/* Modal Bottom Drawer Card */}
            <motion.div 
              initial={{ y: '100%' }} 
              animate={{ y: 0 }} 
              exit={{ y: '100%' }} 
              transition={{ type: 'spring', damping: 25, stiffness: 220 }} 
              className="fixed bottom-0 left-0 right-0 bg-[#0c0e14] border-t border-[#1e293b] rounded-t-[2.5rem] p-8 space-y-6 z-50 max-w-md mx-auto shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lock size={16} className="text-rose-500" />
                  <h3 className="text-lg font-black text-white uppercase tracking-tight">Complete Delivery</h3>
                </div>
                <button 
                  onClick={() => !submittingOtp && setActiveOrder(null)}
                  className="w-9 h-9 rounded-xl bg-[#1e293b]/60 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {deliverySuccess ? (
                /* Success animationHUD */
                <div className="py-8 text-center space-y-4 animate-in zoom-in duration-300">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
                    <CheckCircle size={32} className="animate-bounce" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-base font-black text-white uppercase tracking-tight">Delivery Completed!</h4>
                    <p className="text-xs text-slate-450 max-w-[240px] mx-auto leading-relaxed">
                      OTP has been verified successfully. Order #{activeOrder.orderNo} is now marked as Completed. Good job!
                    </p>
                  </div>
                </div>
              ) : (
                /* OTP Verification form */
                <form onSubmit={handleVerifyOtp} className="space-y-5">
                  <div className="text-center space-y-1 bg-[#090b10] p-4.5 rounded-2.5xl border border-[#1e293b]/55 shadow-inner">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block leading-none mb-1">Verify Delivery for</span>
                    <p className="text-sm font-black text-white uppercase tracking-tight">{activeOrder.deliveryCustomerName}</p>
                    <p className="text-[10px] font-mono font-bold text-slate-500 mt-1 leading-none">{activeOrder.orderNo}</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest block ml-1 text-center">
                      Ask Customer for the 4-Digit OTP *
                    </label>
                    
                    <div className="flex justify-center">
                      <input 
                        type="text" 
                        inputMode="numeric" 
                        maxLength={4}
                        placeholder="••••"
                        value={otpValue}
                        onChange={e => {
                          const val = e.target.value.replace(/\D/g, '');
                          setOtpValue(val.slice(0, 4));
                        }}
                        className="w-48 text-center text-3xl font-black font-mono py-2.5 rounded-2xl bg-[#090b10] border-2 border-[#1e293b] focus:border-rose-500 text-white tracking-[0.35em] placeholder:opacity-20 outline-none transition-all shadow-inner"
                        autoFocus
                        disabled={submittingOtp}
                      />
                    </div>
                  </div>

                  {otpError && (
                    <p className="text-[9px] text-red-500 font-extrabold uppercase text-center tracking-wide leading-relaxed bg-red-550/10 border border-red-500/20 py-2 px-3 rounded-xl">
                      ❌ {otpError}
                    </p>
                  )}

                  <div className="pt-2 flex gap-3">
                    <Button
                      type="button"
                      onClick={() => setActiveOrder(null)}
                      disabled={submittingOtp}
                      className="flex-1 h-12 bg-[#1e293b] hover:bg-[#28354c] text-slate-300 rounded-xl text-[10px] font-black uppercase tracking-widest border border-[#334155]/60"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      loading={submittingOtp}
                      disabled={otpValue.length !== 4}
                      className="flex-1 h-12 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-500/25"
                    >
                      Verify & Settle
                    </Button>
                  </div>
                </form>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
