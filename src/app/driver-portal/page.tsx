'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Bike, Phone, ArrowRight, CheckCircle2, Clock, Lock, X,
  RefreshCw, LogOut, Navigation, CheckCircle, HelpCircle, 
  DollarSign, AlertTriangle, TrendingUp, Star, Package,
  Zap, ChevronRight, ShieldAlert, Wallet, Settings, MessageSquare,
  Volume2, VolumeX, Camera, Upload, Plus, FileText, ChevronDown, Check
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { motion, AnimatePresence } from 'framer-motion';

// Types
import { Driver, PosOrder, PortalTab, HistoryOrder } from './types';

// Components
import { AuthShell } from './components/AuthShell';
import { ActiveDeliveriesTab } from './components/ActiveDeliveriesTab';
import { AvailableOrdersTab } from './components/AvailableOrdersTab';
import { EarningsTab } from './components/EarningsTab';
import { ChatTab } from './components/ChatTab';
import { SettingsTab } from './components/SettingsTab';

// ─── Dictionary for Multi-language Translation ──────────────────────────────
const translations = {
  en: {
    title: "Rider Portal",
    welcome: "Welcome,",
    signIn: "Sign In",
    signUp: "Sign Up",
    fullName: "Full Name",
    phone: "Mobile Number",
    vehiclePlate: "Vehicle Plate Number",
    vehicleType: "Vehicle Type",
    shift: "Select Shift Slot",
    zone: "Preferred Zone",
    documents: "Required Documents",
    drivingLicense: "Driving Licence (L)",
    vehicleRc: "Vehicle RC",
    idProof: "Aadhaar / ID Card",
    online: "Online & Active",
    offline: "Offline / Off Duty",
    myDeliveries: "Active Deliveries",
    available: "Available Nearby",
    earnings: "My Earnings",
    chat: "Manager Chat",
    settings: "Settings",
    sos: "SOS HELP",
    codCollected: "Cash Collected",
    reportIssue: "Report Issue",
    contactless: "Contactless delivery",
    handover: "Handover Cash",
    language: "Language",
    fontSize: "Text Size",
    leave: "Leave Request",
    history: "Order History",
    allDone: "All Deliveries Done!",
    noPending: "No pending assignments right now.",
    claimDeliver: "Claim & Deliver",
    verifyOtp: "Verify & Complete",
    cancel: "Cancel",
    enterOtp: "Enter Delivery OTP",
    custOtp: "Customer OTP",
    status: "Status",
    items: "Items",
    address: "Delivery Address",
    gpsActive: "GPS TRACKING ACTIVE",
  },
  hi: {
    title: "राइडर पोर्टल",
    welcome: "आपका स्वागत है,",
    signIn: "लॉग इन करें",
    signUp: "रजिस्टर करें",
    fullName: "पूरा नाम",
    phone: "मोबाइल नंबर",
    vehiclePlate: "वाहन प्लेट नंबर",
    vehicleType: "वाहन का प्रकार",
    shift: "शिफ्ट का समय चुनें",
    zone: "पसंदीदा क्षेत्र",
    documents: "आवश्यक दस्तावेज",
    drivingLicense: "ड्राइविंग लाइसेंस (L)",
    vehicleRc: "वाहन RC",
    idProof: "आधार / पहचान पत्र",
    online: "ऑनलाइन और सक्रिय",
    offline: "ऑफलाइन / काम बंद",
    myDeliveries: "सक्रिय डिलीवरी",
    available: "आसपास के आर्डर",
    earnings: "मेरी कमाई",
    chat: "मैनेजर चैट",
    settings: "सेटिंग्स",
    sos: "आपातकालीन मदद (SOS)",
    codCollected: "नकद प्राप्त हुआ",
    reportIssue: "समस्या बताएं",
    contactless: "बिना संपर्क के सौंपें",
    handover: "नकद जमा करें",
    language: "भाषा",
    fontSize: "अक्षर का आकार",
    leave: "छुट्टी का आवेदन",
    history: "ऑर्डर का इतिहास",
    allDone: "सभी डिलीवरी पूरी!",
    noPending: "कोई भी ऑर्डर पेंडिंग नहीं है।",
    claimDeliver: "दावा करें और डिलीवर करें",
    verifyOtp: "सत्यापित करें",
    cancel: "रद्द करें",
    enterOtp: "ऑर्डर का OTP डालें",
    custOtp: "ग्राहक का OTP",
    status: "स्थिति",
    items: "सामान",
    address: "डिलीवरी का पता",
    gpsActive: "जीपीएस सक्रिय है",
  },
  hinglish: {
    title: "Rider Portal",
    welcome: "Welcome,",
    signIn: "Login",
    signUp: "Signup",
    fullName: "Full Name",
    phone: "Mobile Number",
    vehiclePlate: "Gadi ka Number",
    vehicleType: "Vehicle Type",
    shift: "Shift time select karo",
    zone: "Preferred Zone",
    documents: "Documents Upload",
    drivingLicense: "Driving Licence (L)",
    vehicleRc: "Vehicle RC",
    idProof: "Aadhaar / ID Card",
    online: "Duty Chalu (Online)",
    offline: "Duty Band (Offline)",
    myDeliveries: "Active Orders",
    available: "Khaali Orders",
    earnings: "Kamai (Earnings)",
    chat: "Manager Chat",
    settings: "Settings",
    sos: "Emergency Help (SOS)",
    codCollected: "Cash Collect Hua",
    reportIssue: "Problem Report Karo",
    contactless: "Contactless delivery",
    handover: "Cash Handover Request",
    language: "Language (Bhasha)",
    fontSize: "Font Size",
    leave: "Leave Apply Karo",
    history: "Purane Orders (History)",
    allDone: "Saare Deliveries Done!",
    noPending: "Koi pending order nahi hai abhi.",
    claimDeliver: "Claim & Deliver Karo",
    verifyOtp: "Verify & Settle Karo",
    cancel: "Cancel Karo",
    enterOtp: "Customer OTP likho",
    custOtp: "Customer OTP",
    status: "Status",
    items: "Items",
    address: "Delivery Address",
    gpsActive: "GPS LIVE HAI",
  }
};

// Deterministic OTP helper matching backend
function getDeliveryOtp(orderId: string): string {
  let hash = 0;
  for (let i = 0; i < orderId.length; i++) {
    hash = orderId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const otp = Math.abs(hash % 9000 + 1000);
  return otp.toString();
}

export default function DriverPortalPage() {
  // ─── Authentication & Navigation ───────────────────────────────────────────
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [portalTab, setPortalTab] = useState<PortalTab>('MY_DELIVERIES');

  // Multi-Language and Font Sizing States
  const [lang, setLang] = useState<'en' | 'hi' | 'hinglish'>('en');
  const [fontSize, setFontSize] = useState<'sm' | 'md' | 'lg'>('md');

  // Input states (Login & Signup)
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [fullNameInput, setFullNameInput] = useState('');
  const [vehicleTypeInput, setVehicleTypeInput] = useState('BIKE');
  const [propertyIdInput, setPropertyIdInput] = useState('');
  const [shiftSlotInput, setShiftSlotInput] = useState('MORNING');
  const [preferredZoneInput, setPreferredZoneInput] = useState('CENTRAL');
  const [properties, setProperties] = useState<{ id: string; name: string; code: string }[]>([]);

  // Extra signup fields
  const [licenceNumberInput, setLicenceNumberInput] = useState('');
  const [profilePhotoInput, setProfilePhotoInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');

  // Document states
  const [uploadedDocs, setUploadedDocs] = useState<{ licence: string; rc: string; idProof: string }>({
    licence: '',
    rc: '',
    idProof: ''
  });

  // OTP Simulation States
  const [otpMode, setOtpMode] = useState<'LOGIN' | 'SIGNUP' | null>(null);
  const [otpInput, setOtpInput] = useState('');
  const [simulatedOtp, setSimulatedOtp] = useState('');
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpLoading, setOtpLoading] = useState(false);

  // Active Dispatch Queue & Order Actions
  const [assignedOrders, setAssignedOrders] = useState<PosOrder[]>([]);
  const [unassignedOrders, setUnassignedOrders] = useState<PosOrder[]>([]);
  const [fetchingOrders, setFetchingOrders] = useState(false);
  const [activeOrder, setActiveOrder] = useState<PosOrder | null>(null); // Detail Modal
  const [otpValue, setOtpValue] = useState('');
  const [submittingOtp, setSubmittingOtp] = useState(false);
  const [deliverySuccess, setDeliverySuccess] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState<{ orderId: string } | null>(null);
  const [reportedIssueType, setReportedIssueType] = useState('WRONG_ITEM');
  const [reportedComments, setReportedComments] = useState('');
  const [submittingIssue, setSubmittingIssue] = useState(false);

  // Contactless Proof
  const [isContactlessConfirmed, setIsContactlessConfirmed] = useState(false);
  const [contactlessProofUploaded, setContactlessProofUploaded] = useState(false);
  const [contactlessProofName, setContactlessProofName] = useState('');

  // Audio / Vibration Ringing Alerts
  const [activeIncomingOrder, setActiveIncomingOrder] = useState<PosOrder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const alertIntervalRef = useRef<any>(null);

  // Manager Chat & Broadcast Feeds
  const [chatMessages, setChatMessages] = useState<{ id: string; sender: 'rider' | 'manager'; text: string; time: string }[]>([]);
  const [chatInput, setChatInput] = useState('');

  // Payout, Handover & Tips Logs
  const [earnings, setEarnings] = useState<any | null>(null);
  const [codCollectedOrders, setCodCollectedOrders] = useState<Set<string>>(new Set());
  const [collectingCod, setCollectingCod] = useState<string | null>(null);
  const [upiId, setUpiId] = useState('');
  const [handoverHistory, setHandoverHistory] = useState<{ id: string; date: string; amount: number; status: string }[]>([]);

  // Order History
  const [orderHistory, setOrderHistory] = useState<HistoryOrder[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [tipsLog, setTipsLog] = useState<{ [orderNo: string]: number }>({});
  const [tipInputVal, setTipInputVal] = useState('');
  const [tipTargetOrder, setTipTargetOrder] = useState<string | null>(null);
  const [completeCodAmount, setCompleteCodAmount] = useState('');
  const [completeTipAmount, setCompleteTipAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'UPI'>('CASH');

  // Leave Requests & Telemetry
  const [leaveRequests, setLeaveRequests] = useState<{ id: string; date: string; reason: string; status: string }[]>([]);
  const [leaveDateInput, setLeaveDateInput] = useState('');
  const [leaveReasonInput, setLeaveReasonInput] = useState('SICK');

  const [sosActive, setSosActive] = useState(false);
  const [sosSending, setSosSending] = useState(false);
  const [lastGps, setLastGps] = useState<{ lat: number; lng: number; ts: number } | null>(null);
  const [stationaryMinutes, setStationaryMinutes] = useState(0);

  const [pickingUpOrder, setPickingUpOrder] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null);

  const t = translations[lang];

  // ─── Audio alert player ───────────────────────────────────────────────────
  const playBeep = useCallback(() => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.35, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch (_) {}
  }, []);

  const startAlertNotification = useCallback((order: PosOrder) => {
    setActiveIncomingOrder(order);
    playBeep();
    if (navigator.vibrate) {
      navigator.vibrate([200, 100, 200, 100, 300]);
    }
    if (alertIntervalRef.current) clearInterval(alertIntervalRef.current);
    alertIntervalRef.current = setInterval(() => {
      playBeep();
      if (navigator.vibrate) {
        navigator.vibrate([200, 100, 200]);
      }
    }, 1800);
  }, [playBeep]);

  const stopAlertNotification = useCallback(() => {
    setActiveIncomingOrder(null);
    if (alertIntervalRef.current) {
      clearInterval(alertIntervalRef.current);
      alertIntervalRef.current = null;
    }
  }, []);

  // ─── Fetch Active and Available Orders ──────────────────────────────────
  const fetchAssignedOrders = useCallback(async (driverId: string) => {
    setFetchingOrders(true);
    try {
      const res = await fetch(`/api/public/driver?action=active-orders&driverId=${driverId}`);
      const json = await res.json();
      if (json.success && json.data) {
        setAssignedOrders(json.data.assigned || []);
        setUnassignedOrders(json.data.unassigned || []);
        
        // Auto trigger incoming offer alert if driver is online, there is a new nearby unassigned order
        // and we don't have a ringing alert or already full queue
        const currentRider = JSON.parse(localStorage.getItem('active_rider') || 'null') || selectedDriver;
        const isRiderOnline = currentRider?.dutyStatus === 'online';
        if (isRiderOnline && json.data.unassigned && json.data.unassigned.length > 0 && json.data.assigned.length < 2 && !activeIncomingOrder) {
          const newest = json.data.unassigned[0];
          // Simple local check so we don't trigger alerts for rejected/dismissed orders
          const dismissedOffers = JSON.parse(localStorage.getItem(`driver_dismissed_${driverId}`) || '[]');
          if (!dismissedOffers.includes(newest.id)) {
            startAlertNotification(newest);
          }
        }
      }
    } catch (err) { 
      console.error('Failed to load orders:', err); 
    } finally { 
      setFetchingOrders(false); 
    }
  }, [activeIncomingOrder, startAlertNotification]);

  const fetchEarnings = async (driverId: string) => {
    try {
      const res = await fetch('/api/public/driver', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'earnings', driverId })
      });
      const json = await res.json();
      if (json.success && json.data) {
        setEarnings(json.data);
        if (json.data.trips) {
          const collectedSet = new Set<string>();
          json.data.trips.forEach((o: any) => {
            if (o.codCollected && !o.riderHandoverId) {
              collectedSet.add(o.id);
            }
          });
          setCodCollectedOrders(collectedSet);
        }
        if (json.data.handoverHistory) {
          setHandoverHistory(json.data.handoverHistory);
        }
      }
    } catch (_) {}
  };

  const fetchOrderHistory = async (driverId: string) => {
    setLoadingHistory(true);
    try {
      const res = await fetch(`/api/public/driver?action=order-history&driverId=${driverId}`);
      const json = await res.json();
      if (json.success) setOrderHistory(json.data || []);
    } catch (_) {}
    finally { setLoadingHistory(false); }
  };

  // ─── Initialization and Restore Session ──────────────────────────────────
  useEffect(() => {
    // List Properties for Signup dropdown
    fetch('/api/public/driver?action=list-properties')
      .then(res => res.json())
      .then(json => {
        if (json.success && json.data) {
          setProperties(json.data);
          if (json.data.length > 0) {
            setPropertyIdInput(json.data[0].id);
          }
        }
      })
      .catch(_ => {});

    // Restore Settings
    const savedLang = localStorage.getItem('driver_portal_lang');
    if (savedLang) setLang(savedLang as any);
    const savedFontSize = localStorage.getItem('driver_portal_font_size');
    if (savedFontSize) setFontSize(savedFontSize as any);

    const saved = localStorage.getItem('active_rider');
    if (saved) { 
      try { 
        const parsed = JSON.parse(saved);
        setSelectedDriver(parsed); 
      } catch (_) {} 
    }
    // Check if query parameter specifies direct signup
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('signup') === 'true') {
        setIsSigningUp(true);
      }
    }
  }, []);

  // Update states when driver logs in
  useEffect(() => {
    if (selectedDriver) {
      const driverId = selectedDriver.id;
      fetchAssignedOrders(driverId);
      fetchEarnings(driverId);
      localStorage.setItem('active_rider', JSON.stringify(selectedDriver));

      // Restore driver custom data from LocalStorage
      const savedDocs = localStorage.getItem(`driver_docs_${driverId}`);
      if (savedDocs) setUploadedDocs(JSON.parse(savedDocs));
      const savedUpi = localStorage.getItem(`driver_upi_${driverId}`);
      if (savedUpi) setUpiId(savedUpi);
      const savedTips = localStorage.getItem(`driver_tips_${driverId}`);
      if (savedTips) setTipsLog(JSON.parse(savedTips));
      const savedHandovers = localStorage.getItem(`driver_handovers_${driverId}`);
      if (savedHandovers) setHandoverHistory(JSON.parse(savedHandovers));
      const savedLeaves = localStorage.getItem(`driver_leaves_${driverId}`);
      if (savedLeaves) setLeaveRequests(JSON.parse(savedLeaves));

      // Load Chat Logs
      const savedChat = localStorage.getItem(`driver_chat_${driverId}`);
      if (savedChat) {
        setChatMessages(JSON.parse(savedChat));
      } else {
        const initialChat = [
          {
            id: '1',
            sender: 'manager' as const,
            text: `Welcome to the delivery fleet! Keep your duty status Online in settings to receive customer assignments.`,
            time: '09:00 AM'
          }
        ];
        setChatMessages(initialChat);
        localStorage.setItem(`driver_chat_${driverId}`, JSON.stringify(initialChat));
      }
    } else {
      setAssignedOrders([]);
      setUnassignedOrders([]);
      localStorage.removeItem('active_rider');
    }
  }, [selectedDriver, fetchAssignedOrders]);

  // Populate Complete Modal default values
  useEffect(() => {
    if (activeOrder) {
      setCompleteCodAmount(activeOrder.grandTotal.toString());
      setCompleteTipAmount('0');
      setPaymentMethod('CASH');
    } else {
      setCompleteCodAmount('');
      setCompleteTipAmount('');
    }
  }, [activeOrder]);

  // GPS & Telemetry Tracking — runs whenever driver is logged in (not just active orders)
  useEffect(() => {
    if (!selectedDriver) return;
    if (!navigator.geolocation) return;

    let watchId: number;
    const reportLocation = async (lat: number, lng: number) => {
      // Always update rider GPS in DB for live broadcast
      try {
        await fetch('/api/public/driver', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'update-location', driverId: selectedDriver.id, lat, lng })
        });
      } catch (_) {}

      setLastGps(prev => {
        if (prev) {
          const dist = Math.sqrt(Math.pow(lat - prev.lat, 2) + Math.pow(lng - prev.lng, 2));
          const minElapsed = (Date.now() - prev.ts) / 60000;
          if (dist < 0.0001 && minElapsed > 1) {
            const mins = Math.floor(minElapsed);
            setStationaryMinutes(mins);
            // Auto-SOS at 5+ minutes stationary during active delivery
            if (mins >= 5 && assignedOrders.length > 0 && !sosActive) {
              fetch('/api/public/driver', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'sos', driverId: selectedDriver.id, lat, lng, reason: 'AUTO_STATIONARY_5MIN' })
              }).catch(() => {});
              setSosActive(true);
            }
          } else {
            setStationaryMinutes(0);
          }
        }
        return { lat, lng, ts: Date.now() };
      });
    };

    watchId = navigator.geolocation.watchPosition(
      p => reportLocation(p.coords.latitude, p.coords.longitude),
      _ => {},
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );

    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [selectedDriver, assignedOrders, sosActive]);

  // SOS Emergency Trigger
  const handleSOS = async () => {
    if (!selectedDriver || sosSending) return;
    setSosSending(true);
    try {
      const sendAlert = async (lat?: number, lng?: number) => {
        await fetch('/api/public/driver', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'sos', driverId: selectedDriver.id, lat, lng })
        });
        setSosActive(true);
      };

      navigator.geolocation?.getCurrentPosition(
        p => sendAlert(p.coords.latitude, p.coords.longitude),
        () => sendAlert(),
        { timeout: 5000 }
      );
    } finally {
      setSosSending(false);
    }
  };

  // ─── LOGIN & SIGNUP HANDLERS ──────────────────────────────────────────────
  const handleDirectLogin = async (e: React.FormEvent, customPhone?: string, customEmail?: string) => {
    e.preventDefault();
    const activePhone = customPhone !== undefined ? customPhone : phone;
    const activeEmail = customEmail !== undefined ? customEmail : email;
    const identifier = activePhone || activeEmail;
    if (!identifier) return;

    if (!passwordInput) {
      alert("Password is required to sign in.");
      return;
    }

    setOtpLoading(true);
    setOtpError(null);
    try {
      const res = await fetch('/api/public/driver', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', phoneOrEmail: identifier, password: passwordInput })
      });
      const json = await res.json();
      if (json.success && json.data) {
        const loggedInDriver = json.data;
        // Save shift details & active status on login
        localStorage.setItem(`driver_shift_${loggedInDriver.id}`, shiftSlotInput);
        const activeDriverData = {
          ...loggedInDriver,
          dutyStatus: loggedInDriver.dutyStatus || 'online'
        };
        setSelectedDriver(activeDriverData);
        localStorage.setItem('active_rider', JSON.stringify(activeDriverData));
      } else {
        alert(json.message || 'Login failed. Rider profile not found.');
      }
    } catch (_) {
      alert('Network error. Could not authenticate.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleRequestSignupOtp = async (e: React.FormEvent, customPhone?: string, customEmail?: string) => {
    e.preventDefault();
    const activePhone = customPhone !== undefined ? customPhone : phone;
    const activeEmail = customEmail !== undefined ? customEmail : email;
    if (!fullNameInput || (!activePhone && !activeEmail) || !vehicleNumber || !vehicleTypeInput) return;

    setOtpMode('SIGNUP');
    setOtpLoading(true);
    setOtpError(null);

    // If activeEmail has an address, send real OTP email via SMTP settings
    const isEmailVerification = activeEmail && activeEmail.includes('@');
    if (isEmailVerification) {
      const generatedOtp = Math.floor(1000 + Math.random() * 9000).toString();
      try {
        const res = await fetch('/api/public/driver', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'send-otp-email',
            email: activeEmail,
            otp: generatedOtp,
            fullName: fullNameInput
          })
        });
        const json = await res.json();
        if (json.success) {
          setSimulatedOtp(generatedOtp);
        } else {
          setOtpMode(null);
          alert("Email delivery failed: " + (json.message || "Please check super-admin SMTP settings."));
        }
      } catch (_) {
        setOtpMode(null);
        alert("Failed to send verification email. Please check your network connection.");
      } finally {
        setOtpLoading(false);
      }
    } else {
      // Fallback/Simulated SMS OTP for mobile
      setTimeout(() => {
        setSimulatedOtp('5555');
        setOtpLoading(false);
      }, 800);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpInput !== simulatedOtp) {
      setOtpError('Invalid verification code. Please try again.');
      return;
    }

    setOtpLoading(true);
    setOtpError(null);

    if (otpMode === 'LOGIN') {
      try {
        const res = await fetch('/api/public/driver', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'login', phoneOrEmail: phone || email })
        });
        const json = await res.json();
        if (json.success && json.data) {
          const loggedInDriver = json.data;
          
          // Save shift details & active status on login
          localStorage.setItem(`driver_shift_${loggedInDriver.id}`, shiftSlotInput);
          const activeDriverData = {
            ...loggedInDriver,
            dutyStatus: loggedInDriver.dutyStatus || 'online'
          };
          setSelectedDriver(activeDriverData);
          localStorage.setItem('active_rider', JSON.stringify(activeDriverData));
          
          setOtpMode(null);
          setOtpInput('');
        } else {
          setOtpError(json.message || 'Login credentials mismatch.');
        }
      } catch (_) {
        setOtpError('Network error. Could not authenticate.');
      } finally {
        setOtpLoading(false);
      }
    } else if (otpMode === 'SIGNUP') {
      try {
        const res = await fetch('/api/public/driver', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'signup',
            fullName: fullNameInput,
            phone: phone || null,
            email: email || null,
            vehicleNumber,
            vehicleType: vehicleTypeInput,
            propertyId: propertyIdInput || null,
            password: passwordInput
          })
        });
        const json = await res.json();
        if (json.success && json.data) {
          const registeredDriver = json.data;
          
          // Save shift details & docs & photo & licence number in local storage linked with driver ID
          localStorage.setItem(`driver_shift_${registeredDriver.id}`, shiftSlotInput);
          localStorage.setItem(`driver_zones_${registeredDriver.id}`, preferredZoneInput);
          localStorage.setItem(`driver_docs_${registeredDriver.id}`, JSON.stringify(uploadedDocs));
          localStorage.setItem(`driver_licence_${registeredDriver.id}`, licenceNumberInput);
          localStorage.setItem(`driver_photo_${registeredDriver.id}`, profilePhotoInput);
          
          setOtpMode(null);
          setOtpInput('');
          setIsSigningUp(false); // Redirect to sign in tab
          
          alert("🎉 Registration successful!\n\nYour rider account has been created successfully but is currently pending Admin approval. You will be able to log in once approved by the administrator.");
        } else {
          setOtpError(json.message || 'Signup failed. Please try again.');
        }
      } catch (_) {
        setOtpError('Network error. Could not sign up.');
      } finally {
        setOtpLoading(false);
      }
    }
  };

  // ─── ACTIVE ORDER WORKFLOW ACTIONS ─────────────────────────────────────────
  const handleAcceptOffer = async (orderId: string) => {
    if (!selectedDriver) return;
    if (assignedOrders.length >= 2) {
      alert("Cannot carry more than 2 active orders simultaneously.");
      stopAlertNotification();
      return;
    }
    try {
      const res = await fetch('/api/public/driver', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'accept-order', orderId, driverId: selectedDriver.id })
      });
      const json = await res.json();
      if (json.success) {
        stopAlertNotification();
        fetchAssignedOrders(selectedDriver.id);
        setPortalTab('MY_DELIVERIES');
      } else {
        alert(json.message || 'Failed to accept order.');
      }
    } catch (_) {
      alert('Network error. Try again.');
    }
  };

  const handleRejectOffer = async (orderId: string) => {
    if (!selectedDriver) return;
    try {
      await fetch('/api/public/driver', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject-order', orderId, driverId: selectedDriver.id })
      });
      // Store rejected order id in local storage so it does not alerts again in current session
      const dismissedOffers = JSON.parse(localStorage.getItem(`driver_dismissed_${selectedDriver.id}`) || '[]');
      dismissedOffers.push(orderId);
      localStorage.setItem(`driver_dismissed_${selectedDriver.id}`, JSON.stringify(dismissedOffers));
      stopAlertNotification();
      fetchAssignedOrders(selectedDriver.id);
    } catch (_) {}
  };

  const handleMarkPickedUp = async (orderId: string) => {
    if (!selectedDriver) return;
    setPickingUpOrder(orderId);
    try {
      const res = await fetch('/api/public/driver', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark-picked', orderId, driverId: selectedDriver.id })
      });
      const json = await res.json();
      if (json.success) {
        fetchAssignedOrders(selectedDriver.id);
      } else {
        alert(json.message || 'Failed to mark picked up.');
      }
    } catch (_) {
      alert('Network error.');
    } finally {
      setPickingUpOrder(null);
    }
  };

  const handleCodCollected = async (order: PosOrder) => {
    if (!selectedDriver) return;
    const amountVal = prompt(`Enter COD cash amount collected (total ₹${order.grandTotal}):`, order.grandTotal.toString());
    if (amountVal === null) return;
    const tipVal = prompt("Enter tip amount received (if any, ₹):", "0");
    if (tipVal === null) return;

    setCollectingCod(order.id);
    try {
      const res = await fetch('/api/public/driver', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'cod-collected',
          orderId: order.id,
          driverId: selectedDriver.id,
          amount: parseFloat(amountVal || order.grandTotal.toString()),
          tip: parseFloat(tipVal || '0')
        })
      });
      const json = await res.json();
      if (json.success) {
        setCodCollectedOrders(prev => new Set([...prev, order.id]));
        await fetchEarnings(selectedDriver.id);
        await fetchAssignedOrders(selectedDriver.id);
      }
    } catch (_) {
    } finally {
      setCollectingCod(null);
    }
  };

  const handleDeliveryOtpVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrder || !selectedDriver) return;
    setSubmittingOtp(true);
    setOtpError(null);
    try {
      const res = await fetch('/api/public/driver', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: activeOrder.id,
          driverId: selectedDriver.id,
          otp: otpValue,
          codAmountCollected: parseFloat(completeCodAmount || activeOrder.grandTotal.toString()),
          paymentMethod: paymentMethod,
          tipAmount: parseFloat(completeTipAmount || '0')
        })
      });
      const json = await res.json();
      if (json.success) {
        setDeliverySuccess(true);
        setOtpValue('');
        // Clean contactless flags
        setIsContactlessConfirmed(false);
        setContactlessProofUploaded(false);
        setContactlessProofName('');
        
        await fetchAssignedOrders(selectedDriver.id);
        await fetchEarnings(selectedDriver.id);
        setTimeout(() => { 
          setActiveOrder(null); 
          setDeliverySuccess(false); 
        }, 2050);
      } else {
        setOtpError(json.message || 'Verification failed. Incorrect OTP.');
      }
    } catch (_) {
      setOtpError('Network error. Check connection.');
    } finally {
      setSubmittingOtp(false);
    }
  };

  const handleConfirmContactlessDropoff = async () => {
    if (!activeOrder || !selectedDriver || !contactlessProofUploaded) return;
    setSubmittingOtp(true);
    setOtpError(null);
    try {
      const res = await fetch('/api/public/driver', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'confirm-contactless',
          orderId: activeOrder.id,
          driverId: selectedDriver.id,
          codAmountCollected: parseFloat(completeCodAmount || activeOrder.grandTotal.toString()),
          paymentMethod: paymentMethod,
          tipAmount: parseFloat(completeTipAmount || '0')
        })
      });
      const json = await res.json();
      if (json.success) {
        setDeliverySuccess(true);
        setIsContactlessConfirmed(false);
        setContactlessProofUploaded(false);
        setContactlessProofName('');
        
        await fetchAssignedOrders(selectedDriver.id);
        await fetchEarnings(selectedDriver.id);
        setTimeout(() => { 
          setActiveOrder(null); 
          setDeliverySuccess(false); 
        }, 2050);
      } else {
        setOtpError(json.message || 'Verification failed.');
      }
    } catch (_) {
      setOtpError('Network error.');
    } finally {
      setSubmittingOtp(false);
    }
  };

  const handleReportOrderIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportModalOpen || !selectedDriver) return;
    setSubmittingIssue(true);
    try {
      const res = await fetch('/api/public/driver', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'report-issue',
          orderId: reportModalOpen.orderId,
          driverId: selectedDriver.id,
          issueType: reportedIssueType,
          comments: reportedComments
        })
      });
      const json = await res.json();
      if (json.success) {
        alert("Issue reported successfully to the restaurant manager.");
        setReportModalOpen(null);
        setReportedComments('');
      } else {
        alert(json.message || 'Failed to submit issue.');
      }
    } catch (_) {
      alert("Network error.");
    } finally {
      setSubmittingIssue(false);
    }
  };

  // ─── CHAT ACTIONS ──────────────────────────────────────────────────────────
  const handleSendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !selectedDriver) return;

    const newMsg = {
      id: Date.now().toString(),
      sender: 'rider' as const,
      text: chatInput.trim(),
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    };

    const updated = [...chatMessages, newMsg];
    setChatMessages(updated);
    setChatInput('');
    localStorage.setItem(`driver_chat_${selectedDriver.id}`, JSON.stringify(updated));

    // Simulated reply from manager
    setTimeout(() => {
      let replyText = "Received! Keep updating status. Drive safe.";
      const lower = chatInput.toLowerCase();
      if (lower.includes('issue') || lower.includes('problem') || lower.includes('missing')) {
        replyText = "Okay. Please click 'Report Issue' inside the active order details card so it logs in the kitchen terminal.";
      } else if (lower.includes('handover') || lower.includes('cash') || lower.includes('payout')) {
        replyText = "Drop the cash at the restaurant POS billing counter at shift-end. I will approve your handover log immediately.";
      } else if (lower.includes('leave') || lower.includes('sick')) {
        replyText = "Apply for leave under Settings tab. I will review it shortly.";
      } else if (lower.includes('sos') || lower.includes('accident') || lower.includes('help')) {
        replyText = "🚨 Trigger SOS button immediately so I get your live maps coordinates!";
      }

      const replyMsg = {
        id: (Date.now() + 1).toString(),
        sender: 'manager' as const,
        text: replyText,
        time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
      };
      
      const finalMsgs = [...updated, replyMsg];
      setChatMessages(finalMsgs);
      localStorage.setItem(`driver_chat_${selectedDriver.id}`, JSON.stringify(finalMsgs));
      playBeep();
    }, 1500);
  };

  // ─── EARNINGS, HANDOVER & TIPS ACTIONS ────────────────────────────────────
  const handleInitiateHandover = async () => {
    if (!selectedDriver || !earnings) return;
    const pendingCodAmt = earnings.outstandingCash ?? 0;

    if (pendingCodAmt <= 0) {
      alert("No pending COD collection balance to hand over.");
      return;
    }

    if (!confirm(`Are you sure you want to submit a cash handover request of ₹${pendingCodAmt} to the manager?`)) {
      return;
    }

    try {
      const res = await fetch('/api/public/driver', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'submit-handover', driverId: selectedDriver.id, amount: pendingCodAmt })
      });
      const json = await res.json();
      if (json.success) {
        alert(`Handover request for ₹${pendingCodAmt} submitted successfully.`);
        await fetchEarnings(selectedDriver.id);
      } else {
        alert(json.message || 'Failed to submit handover request.');
      }
    } catch (_) {
      alert("Network error.");
    }
  };

  const handleAddTip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tipInputVal || !tipTargetOrder || !selectedDriver) return;

    try {
      const res = await fetch('/api/public/driver', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add-tip',
          orderId: tipTargetOrder,
          driverId: selectedDriver.id,
          tipAmount: parseFloat(tipInputVal)
        })
      });
      const json = await res.json();
      if (json.success) {
        setTipInputVal('');
        setTipTargetOrder(null);
        await fetchEarnings(selectedDriver.id);
      } else {
        alert(json.message || 'Failed to add tip.');
      }
    } catch (_) {
      alert("Network error.");
    }
  };

  // ─── SETTINGS & TYPOGRAPHY CONFIGS ─────────────────────────────────────────
  const handleToggleDuty = async () => {
    if (!selectedDriver) return;
    const nextStatus = selectedDriver.dutyStatus === 'online' ? 'offline' : 'online';
    try {
      const res = await fetch('/api/public/driver', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update-duty', driverId: selectedDriver.id, status: nextStatus })
      });
      const json = await res.json();
      if (json.success) {
        setSelectedDriver({ ...selectedDriver, dutyStatus: nextStatus });
      }
    } catch (_) {}
  };

  const handleUpdateLanguage = (newLang: 'en' | 'hi' | 'hinglish') => {
    setLang(newLang);
    localStorage.setItem('driver_portal_lang', newLang);
  };

  const handleUpdateFontSize = (size: 'sm' | 'md' | 'lg') => {
    setFontSize(size);
    localStorage.setItem('driver_portal_font_size', size);
  };

  const handleUpdateDriverField = (field: keyof Driver, value: any) => {
    if (!selectedDriver) return;
    const updated = {
      ...selectedDriver,
      [field]: value
    };
    setSelectedDriver(updated);
    localStorage.setItem('active_rider', JSON.stringify(updated));
  };

  const handleSaveProfileSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDriver) return;
    setSavingProfile(true);
    setProfileSuccessMsg(null);
    try {
      const res = await fetch('/api/public/driver', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update-profile',
          driverId: selectedDriver.id,
          fullName: selectedDriver.name,
          vehicleNumber: selectedDriver.vehicleNumber,
          vehicleType: selectedDriver.vehicleType,
          deliveryRadius: selectedDriver.deliveryRadius || 5.0,
          propertyId: selectedDriver.propertyId || null
        })
      });
      const json = await res.json();
      if (json.success && json.data) {
        const updated = {
          ...selectedDriver,
          name: json.data.name,
          phone: json.data.phone,
          email: json.data.email,
          vehicleNumber: json.data.vehicleNumber,
          vehicleType: json.data.vehicleType,
          deliveryRadius: json.data.deliveryRadius,
          propertyId: json.data.propertyId,
        };
        setSelectedDriver(updated);
        localStorage.setItem('active_rider', JSON.stringify(updated));
        setProfileSuccessMsg("Profile & Outlet settings synced successfully!");
        setTimeout(() => setProfileSuccessMsg(null), 3000);
      } else {
        alert(json.message || "Failed to update profile settings.");
      }
    } catch (_) {
      alert("Network error updating profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleApplyLeave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveDateInput || !selectedDriver) return;

    const newLeave = {
      id: Date.now().toString(),
      date: leaveDateInput,
      reason: leaveReasonInput,
      status: 'PENDING'
    };

    const updated = [newLeave, ...leaveRequests];
    setLeaveRequests(updated);
    localStorage.setItem(`driver_leaves_${selectedDriver.id}`, JSON.stringify(updated));
    setLeaveDateInput('');
    alert("Leave application submitted.");
  };

  // Test Simulation Button trigger
  const triggerMockIncomingOrder = () => {
    const mockOrder: PosOrder = {
      id: 'mock-order-id-' + Math.floor(Math.random() * 10000),
      orderNo: 'T-' + Math.floor(1000 + Math.random() * 9000),
      orderType: 'DELIVERY',
      status: 'READY',
      grandTotal: 340 + Math.floor(Math.random() * 400),
      deliveryCustomerName: 'Rohan Malhotra',
      deliveryPhone: '9811122233',
      deliveryAddress: 'Block C, Flat 12B, Green Woods, Mandi',
      deliveryInstructions: 'Contactless delivery requested. Keep on shoerack.',
      deliveryLat: 31.7105,
      deliveryLng: 76.9350,
      property: {
        id: 'cmoybpclz002m6nh6rizl0gwk',
        name: 'Ashoka Dhaba',
        address: 'NH-21, Sambal, Mandi',
        city: 'Mandi',
        phone: '9876543210',
        latitude: 31.7086765,
        longitude: 76.9317431
      },
      items: [
        { id: 'item1', product: { name: 'Kadhai Paneer Special', image: null }, quantity: 1, totalAmount: 260 },
        { id: 'item2', product: { name: 'Butter Tandoori Roti', image: null }, quantity: 4, totalAmount: 80 }
      ],
      createdAt: new Date().toISOString()
    };
    startAlertNotification(mockOrder);
  };

  const totalTipsLogged = Object.values(tipsLog).reduce((sum, v) => sum + v, 0);

  return (
    <div className={`min-h-screen bg-[#07090e] text-[#f8fafc] flex flex-col transition-all duration-300 selection:bg-rose-500/20 ${
      fontSize === 'sm' ? 'text-xs' : fontSize === 'lg' ? 'text-base' : 'text-sm'
    }`}>
      {/* Background radial glow */}
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none" style={{
        backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }} />

      {/* Main Container Wrapper - Styled like a mock smartphone layout on desktop */}
      <div className="flex-1 w-full max-w-md mx-auto bg-[#090b10] border-x border-[#1e293b]/60 flex flex-col min-h-screen shadow-2xl relative pb-24">
        
        {/* HEADER */}
        <header className="relative bg-gradient-to-r from-rose-600/10 via-indigo-600/5 to-transparent border-b border-[#1e293b]/50 px-5 py-4 flex items-center justify-between sticky top-0 backdrop-blur-md z-40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-500 to-rose-600 flex items-center justify-center shadow-lg shadow-rose-500/20">
              <Bike size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-sm font-black uppercase tracking-wider text-white">{t.title}</h1>
              <p className="text-[8px] font-black text-rose-500 uppercase tracking-widest leading-none mt-0.5">Dual active dispatch</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {selectedDriver && (
              <>
                <button
                  onClick={handleToggleDuty}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest border transition-all ${
                    selectedDriver.dutyStatus === 'online'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                      : 'bg-slate-700/20 border-slate-600/30 text-slate-400 hover:bg-slate-700/30'
                  }`}
                  title="Toggle Online/Offline Duty"
                >
                  {selectedDriver.dutyStatus === 'online' ? '● ONLINE' : '○ OFFLINE'}
                </button>
                {stationaryMinutes >= 3 && (
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping shrink-0" title="Stationary warning" />
                )}
                {sosActive ? (
                  <div className="flex items-center gap-1 px-2.5 py-1.5 bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg text-[8px] font-black uppercase tracking-widest">
                    <CheckCircle size={10} /> SOS SENT
                  </div>
                ) : (
                  <button
                    onClick={handleSOS}
                    disabled={sosSending}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-red-500 hover:bg-red-650 text-white rounded-lg text-[8px] font-black uppercase tracking-widest shadow-lg shadow-red-500/25 transition-all"
                  >
                    <ShieldAlert size={10} />
                    {sosSending ? '...' : t.sos}
                  </button>
                )}
                <button
                  onClick={() => setSelectedDriver(null)}
                  className="w-7 h-7 bg-[#1e293b]/60 hover:bg-rose-500/10 hover:text-rose-400 border border-[#334155]/60 text-slate-400 rounded-lg flex items-center justify-center transition-all"
                  title="Logout"
                >
                  <LogOut size={12} />
                </button>
              </>
            )}
          </div>
        </header>

        {/* MOCK ALERT BANNER FOR STATIONARY WARNINGS */}
        {selectedDriver && stationaryMinutes >= 3 && (
          <div className={`mx-4 mt-4 border rounded-xl px-4 py-3 flex items-center gap-3 animate-pulse ${
            stationaryMinutes >= 5
              ? 'bg-red-500/15 border-red-500/35'
              : 'bg-amber-500/10 border-amber-500/30'
          }`}>
            <AlertTriangle size={15} className={stationaryMinutes >= 5 ? 'text-red-400 shrink-0' : 'text-amber-400 shrink-0'} />
            <div className="flex-1">
              <p className={`text-[9px] font-black uppercase tracking-widest ${stationaryMinutes >= 5 ? 'text-red-300' : 'text-amber-300'}`}>
                {stationaryMinutes >= 5 ? '🚨 Auto SOS Sent — Stationary 5+ Min' : 'Stationary Alert'}
              </p>
              <p className={`text-[8.5px] font-bold leading-tight ${stationaryMinutes >= 5 ? 'text-red-400/80' : 'text-amber-400/80'}`}>
                {stationaryMinutes >= 5
                  ? `No movement for ${stationaryMinutes} mins. SOS alert auto-sent to manager.`
                  : `No movement detected for ${stationaryMinutes} mins. Press SOS if you have an emergency.`}
              </p>
            </div>
          </div>
        )}

        <main className="p-4 flex-1 space-y-4">
          
          {/* ─── AUTHENTICATION SHELL (SIGN IN & SIGN UP) ────────────────────── */}
          {!selectedDriver ? (
            <AuthShell
              t={t}
              phone={phone}
              setPhone={setPhone}
              email={email}
              setEmail={setEmail}
              vehicleNumber={vehicleNumber}
              setVehicleNumber={setVehicleNumber}
              fullNameInput={fullNameInput}
              setFullNameInput={setFullNameInput}
              vehicleTypeInput={vehicleTypeInput}
              setVehicleTypeInput={setVehicleTypeInput}
              propertyIdInput={propertyIdInput}
              setPropertyIdInput={setPropertyIdInput}
              shiftSlotInput={shiftSlotInput}
              setShiftSlotInput={setShiftSlotInput}
              preferredZoneInput={preferredZoneInput}
              setPreferredZoneInput={setPreferredZoneInput}
              uploadedDocs={uploadedDocs}
              setUploadedDocs={setUploadedDocs}
              licenceNumberInput={licenceNumberInput}
              setLicenceNumberInput={setLicenceNumberInput}
              profilePhotoInput={profilePhotoInput}
              setProfilePhotoInput={setProfilePhotoInput}
              properties={properties}
              isSigningUp={isSigningUp}
              setIsSigningUp={setIsSigningUp}
              otpMode={otpMode}
              setOtpMode={setOtpMode}
              otpInput={otpInput}
              setOtpInput={setOtpInput}
              simulatedOtp={simulatedOtp}
              otpError={otpError}
              otpLoading={otpLoading}
              passwordInput={passwordInput}
              setPasswordInput={setPasswordInput}
              handleDirectLogin={handleDirectLogin}
              handleRequestSignupOtp={handleRequestSignupOtp}
              handleVerifyOtp={handleVerifyOtp}
            />
          ) : (
            
            /* ─── PORTAL SHELL (ACTIVE SESSIONS) ──────────────────────────────── */
            <div className="space-y-4">
              
              {/* Rider HUD & Location Sync Status */}
              <div className="bg-[#0f172a] border border-[#1e293b] rounded-[1.5rem] p-4 flex items-center justify-between shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-rose-500/5 rounded-full -mr-10 -mt-10 blur-xl" />
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 font-black text-sm uppercase">
                    {selectedDriver.name.slice(0, 2)}
                  </div>
                  <div>
                    <span className="text-[7.5px] font-black text-rose-500 uppercase tracking-widest leading-none block mb-0.5">{t.welcome}</span>
                    <h3 className="text-xs font-black text-white uppercase tracking-tight leading-none">{selectedDriver.name}</h3>
                    <p className="text-[8.5px] font-mono font-bold text-slate-400 mt-1 leading-none">
                      {selectedDriver.vehicleNumber} • {selectedDriver.vehicleType}
                    </p>
                    
                    {assignedOrders.length > 0 && (
                      <div className="flex items-center gap-1.5 mt-1.5 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full w-fit">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                        <span className="text-[7px] font-black text-emerald-400 uppercase tracking-widest">{t.gpsActive}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      fetchAssignedOrders(selectedDriver.id);
                      fetchEarnings(selectedDriver.id);
                    }}
                    disabled={fetchingOrders}
                    className="w-8 h-8 bg-[#1e293b]/60 border border-[#334155]/60 text-slate-350 rounded-lg flex items-center justify-center hover:bg-[#1d2433] disabled:opacity-50 transition-all"
                    title="Refresh Orders"
                  >
                    <RefreshCw size={12} className={fetchingOrders ? 'animate-spin' : ''} />
                  </button>
                </div>
              </div>

              {/* TABS SELECTOR */}
              <div className="grid grid-cols-5 bg-[#0f172a] p-1 rounded-xl border border-[#1e293b] gap-1">
                {[
                  { id: 'MY_DELIVERIES', label: 'Trips', count: assignedOrders.length, icon: <Bike size={11} /> },
                  { id: 'AVAILABLE', label: 'Nearby', count: unassignedOrders.length, icon: <Zap size={11} /> },
                  { id: 'EARNINGS', label: 'Earning', icon: <Wallet size={11} /> },
                  { id: 'CHAT', label: 'Chat', icon: <MessageSquare size={11} /> },
                  { id: 'SETTINGS', label: 'Settings', icon: <Settings size={11} /> }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setPortalTab(tab.id as any);
                      if (tab.id === 'EARNINGS') {
                        fetchEarnings(selectedDriver.id);
                        fetchOrderHistory(selectedDriver.id);
                      }
                    }}
                    className={`relative py-2 text-center text-[8.5px] font-black uppercase tracking-wider rounded-lg transition-all flex flex-col items-center justify-center gap-0.5 ${
                      portalTab === tab.id
                        ? 'bg-rose-500 text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                    {tab.count !== undefined && tab.count > 0 && (
                      <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-indigo-500 text-white text-[7px] font-bold flex items-center justify-center border border-[#090b10]">
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* ─── TAB CONTENT ROUTING ────────────────────────────────────── */}
              {portalTab === 'MY_DELIVERIES' && (
                <ActiveDeliveriesTab
                  t={t}
                  assignedOrders={assignedOrders}
                  fetchingOrders={fetchingOrders}
                  pickingUpOrder={pickingUpOrder}
                  collectingCod={collectingCod}
                  codCollectedOrders={codCollectedOrders}
                  tipsLog={tipsLog}
                  riderLat={lastGps?.lat ?? null}
                  riderLng={lastGps?.lng ?? null}
                  handleMarkPickedUp={handleMarkPickedUp}
                  handleCodCollected={handleCodCollected}
                  setReportModalOpen={setReportModalOpen}
                  setActiveOrder={setActiveOrder}
                  setOtpValue={setOtpValue}
                  setOtpError={setOtpError}
                  setIsContactlessConfirmed={setIsContactlessConfirmed}
                  setContactlessProofUploaded={setContactlessProofUploaded}
                  triggerMockIncomingOrder={triggerMockIncomingOrder}
                />
              )}

              {portalTab === 'AVAILABLE' && (
                <AvailableOrdersTab
                  t={t}
                  unassignedOrders={unassignedOrders}
                  fetchingOrders={fetchingOrders}
                  handleAcceptOffer={handleAcceptOffer}
                  dutyStatus={selectedDriver.dutyStatus || 'offline'}
                  handleToggleDuty={handleToggleDuty}
                />
              )}

              {portalTab === 'EARNINGS' && (
                <EarningsTab
                  t={t}
                  earnings={earnings}
                  codCollectedOrders={codCollectedOrders}
                  handoverHistory={handoverHistory}
                  handleInitiateHandover={handleInitiateHandover}
                  upiId={upiId}
                  setUpiId={setUpiId}
                  selectedDriver={selectedDriver}
                  tipsLog={tipsLog}
                  handleAddTip={handleAddTip}
                  tipTargetOrder={tipTargetOrder}
                  setTipTargetOrder={setTipTargetOrder}
                  tipInputVal={tipInputVal}
                  setTipInputVal={setTipInputVal}
                  totalTipsLogged={totalTipsLogged}
                  orderHistory={orderHistory}
                  loadingHistory={loadingHistory}
                />
              )}

              {portalTab === 'CHAT' && (
                <ChatTab
                  chatMessages={chatMessages}
                  chatInput={chatInput}
                  setChatInput={setChatInput}
                  handleSendChatMessage={handleSendChatMessage}
                />
              )}

              {portalTab === 'SETTINGS' && (
                <SettingsTab
                  t={t}
                  selectedDriver={selectedDriver}
                  onUpdateDriverField={handleUpdateDriverField}
                  properties={properties}
                  handleToggleDuty={handleToggleDuty}
                  preferredZoneInput={preferredZoneInput}
                  setPreferredZoneInput={setPreferredZoneInput}
                  lang={lang}
                  handleUpdateLanguage={handleUpdateLanguage}
                  fontSize={fontSize}
                  handleUpdateFontSize={handleUpdateFontSize}
                  leaveDateInput={leaveDateInput}
                  setLeaveDateInput={setLeaveDateInput}
                  leaveReasonInput={leaveReasonInput}
                  setLeaveReasonInput={setLeaveReasonInput}
                  handleApplyLeave={handleApplyLeave}
                  leaveRequests={leaveRequests}
                  profileSuccessMsg={profileSuccessMsg}
                  savingProfile={savingProfile}
                  handleSaveProfileSettings={handleSaveProfileSettings}
                />
              )}

            </div>
          )}
        </main>
      </div>

      {/* ─── MODAL 1: INCOMING ORDER ALERT BANNER ─────────────────────────── */}
      <AnimatePresence>
        {activeIncomingOrder && (
          <div className="fixed inset-0 bg-[#020408]/85 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm bg-[#0c0e14] border border-rose-500/40 rounded-[2rem] p-6 shadow-2xl space-y-4 text-center relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-rose-500/5 animate-ping pointer-events-none rounded-[2rem]" style={{ animationDuration: '3s' }} />

              <div className="w-14 h-14 bg-rose-500/15 border-2 border-rose-500/30 text-rose-500 rounded-full flex items-center justify-center mx-auto animate-pulse">
                <Bike size={26} />
              </div>

              <div>
                <span className="text-[8.5px] font-black text-rose-500 uppercase tracking-widest animate-bounce inline-block">🚨 Ringing - New Offer</span>
                <h3 className="text-base font-black text-white uppercase mt-1">Incoming Delivery Offer</h3>
                <p className="text-2xl font-black text-emerald-400 mt-1">₹{activeIncomingOrder.grandTotal}</p>
                <p className="text-[10px] text-slate-500 font-mono mt-1">Order No: {activeIncomingOrder.orderNo}</p>
              </div>

              <div className="bg-[#070b12] p-3 rounded-xl border border-[#1e293b]/70 text-left text-[11px] font-bold text-slate-300 uppercase leading-relaxed space-y-1.5">
                <p className="text-[8.5px] font-black text-slate-500 tracking-wider">DELIVERY TO</p>
                <p className="text-white text-xs">{activeIncomingOrder.deliveryCustomerName}</p>
                <p className="text-[9.5px] text-slate-400 font-mono font-medium">{activeIncomingOrder.deliveryAddress}</p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => handleRejectOffer(activeIncomingOrder.id)}
                  className="flex-1 h-11 bg-[#1e293b] hover:bg-[#28354c] text-rose-500 border border-rose-500/20 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
                >
                  Reject Offer
                </button>
                <button
                  onClick={() => handleAcceptOffer(activeIncomingOrder.id)}
                  className="flex-1 h-11 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-rose-600/20 transition-all font-sans"
                >
                  Accept Offer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── MODAL 2: COMPLETE ORDER (OTP VERIFY & CONTACTLESS SLOTS) ──── */}
      <AnimatePresence>
        {activeOrder && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => !submittingOtp && setActiveOrder(null)}
              className="fixed inset-0 bg-[#020408]/80 backdrop-blur-sm z-[9999]" 
            />
            
            <motion.div
              initial={{ y: '100%' }} 
              animate={{ y: 0 }} 
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed bottom-0 left-0 right-0 bg-[#0c0e14] border-t border-[#1e293b] rounded-t-[2rem] p-6 space-y-5 z-[9999] max-w-md mx-auto shadow-2xl text-[10px]"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lock size={14} className="text-rose-500" />
                  <h3 className="text-xs font-black text-white uppercase tracking-tight">Verify & Settle Trip</h3>
                </div>
                <button 
                  onClick={() => !submittingOtp && setActiveOrder(null)}
                  className="w-7 h-7 rounded-lg bg-[#1e293b]/60 flex items-center justify-center text-slate-400 hover:text-white"
                >
                  <X size={14} />
                </button>
              </div>

              {deliverySuccess ? (
                <div className="py-8 text-center space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                    <CheckCircle size={24} className="animate-bounce" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white uppercase tracking-tight">Delivery Completed! 🎉</h4>
                    <p className="text-[10px] text-slate-400 max-w-[240px] mx-auto leading-relaxed mt-1 uppercase">
                      The order has been settled in the database. Drive safe!
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  
                  {/* Trip brief */}
                  <div className="bg-[#090b10] p-3 rounded-xl border border-[#1e293b]/55 text-center">
                    <span className="text-[7.5px] font-black text-slate-500 uppercase tracking-widest block mb-0.5">Order Detail</span>
                    <p className="text-xs font-black text-white uppercase">{activeOrder.deliveryCustomerName}</p>
                    <p className="text-[8.5px] font-mono font-bold text-slate-500 mt-1">{activeOrder.orderNo} • ₹{activeOrder.grandTotal.toFixed(0)}</p>
                  </div>

                  {/* Cash/Tip logging prompt based on prepaid state */}
                  {activeOrder.isPrepaid ? (
                    <div className="bg-[#090b10] border border-emerald-500/20 p-3.5 rounded-xl space-y-2">
                      <p className="text-[8.5px] font-black text-emerald-400 uppercase tracking-widest leading-none">💳 Prepaid Order (Tip tracking)</p>
                      <div className="space-y-1">
                        <label className="text-[7.5px] text-slate-500 font-bold uppercase">Tip Received (₹)</label>
                        <input
                          type="number"
                          value={completeTipAmount}
                          onChange={e => setCompleteTipAmount(e.target.value)}
                          className="w-full h-8 px-2.5 rounded-lg bg-[#070b12] border border-[#1e293b] text-white text-[10px] focus:outline-none"
                          placeholder="Tip ₹"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="bg-[#090b10] border border-[#1e293b] p-3.5 rounded-xl space-y-3.5">
                      <div className="flex items-center justify-between">
                        <p className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest leading-none">💳 Payment Method</p>
                        <div className="flex bg-[#070b12] rounded-lg p-0.5 border border-[#1e293b]">
                          <button
                            type="button"
                            onClick={() => setPaymentMethod('CASH')}
                            className={`px-3 py-1 rounded-md text-[9px] font-black uppercase transition-all ${paymentMethod === 'CASH' ? 'bg-amber-500 text-black shadow-sm' : 'text-slate-450 hover:text-white'}`}
                          >
                            💵 Cash
                          </button>
                          <button
                            type="button"
                            onClick={() => setPaymentMethod('UPI')}
                            className={`px-3 py-1 rounded-md text-[9px] font-black uppercase transition-all ${paymentMethod === 'UPI' ? 'bg-indigo-500 text-white shadow-sm' : 'text-slate-450 hover:text-white'}`}
                          >
                            📱 UPI / QR
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        <div className="space-y-1">
                          <label className="text-[7.5px] text-slate-500 font-bold uppercase">
                            {paymentMethod === 'CASH' ? 'Cash Collected (₹)' : 'UPI Collected (₹)'}
                          </label>
                          <input
                            type="number"
                            value={completeCodAmount}
                            onChange={e => setCompleteCodAmount(e.target.value)}
                            className="w-full h-8 px-2 rounded-lg bg-[#070b12] border border-[#1e293b] text-white text-[10px] focus:outline-none"
                            placeholder="Amount ₹"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[7.5px] text-slate-500 font-bold uppercase">Tip Received (₹)</label>
                          <input
                            type="number"
                            value={completeTipAmount}
                            onChange={e => setCompleteTipAmount(e.target.value)}
                            className="w-full h-8 px-2 rounded-lg bg-[#070b12] border border-[#1e293b] text-white text-[10px] focus:outline-none"
                            placeholder="Tip ₹"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Contactless Checkbox Options */}
                  <div className="bg-[#090b10] border border-[#1e293b]/55 p-3 rounded-xl space-y-2.5">
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isContactlessConfirmed}
                        onChange={e => {
                          setIsContactlessConfirmed(e.target.checked);
                          setOtpError(null);
                        }}
                        className="w-3.5 h-3.5 accent-rose-600 rounded bg-[#070b12] border-[#1e293b]"
                      />
                      <div>
                        <span className="text-[9.5px] font-black text-slate-200 uppercase">Contactless Delivery</span>
                        <p className="text-[7.5px] text-slate-500 font-bold uppercase">Leave package at door & upload photo</p>
                      </div>
                    </label>

                    {isContactlessConfirmed && (
                      <div className="border-t border-[#1e293b]/60 pt-2.5 space-y-2">
                        <span className="text-[7.5px] font-black text-slate-500 uppercase tracking-widest block">📸 Proof Photo Upload</span>
                        
                        <div className="flex items-center gap-3">
                          <label className="cursor-pointer flex items-center justify-center gap-1.5 h-9 px-3 bg-[#1e293b] hover:bg-[#28354c] border border-[#334155]/60 text-slate-350 rounded-lg text-[8.5px] font-black uppercase transition-all">
                            <Camera size={11} />
                            Capture Dropoff Photo
                            <input
                              type="file"
                              className="hidden"
                              onChange={e => {
                                const file = e.target.files?.[0] || null;
                                if (file) {
                                  setContactlessProofUploaded(true);
                                  setContactlessProofName(file.name);
                                }
                              }}
                            />
                          </label>

                          {contactlessProofUploaded && (
                            <span className="text-[8px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20 truncate max-w-[150px]">
                              ✓ {contactlessProofName}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Standard OTP Inputs */}
                  {!isContactlessConfirmed ? (
                    <form onSubmit={handleDeliveryOtpVerification} className="space-y-3">
                      <div className="space-y-1.5 text-center">
                        <label className="text-[8.5px] font-black text-slate-500 uppercase tracking-widest block">
                          Ask Customer for 4-Digit Delivery OTP
                        </label>
                        <div className="flex justify-center">
                          <input 
                            type="text" 
                            inputMode="numeric" 
                            maxLength={4}
                            placeholder="••••" 
                            value={otpValue}
                            onChange={e => setOtpValue(e.target.value.replace(/\D/g, '').slice(0, 4))}
                            className="w-32 text-center text-xl font-black font-mono py-2 rounded-xl bg-[#090b10] border border-[#1e293b] focus:border-rose-500 text-white tracking-[0.25em] outline-none"
                            autoFocus 
                            disabled={submittingOtp} 
                          />
                        </div>
                        <span className="text-[7.5px] text-rose-400 font-extrabold uppercase bg-rose-500/10 py-1 px-2.5 rounded-lg inline-block mt-1">
                          [DEMO CODE HINT] Customer OTP: {getDeliveryOtp(activeOrder.id)}
                        </span>
                      </div>

                      {otpError && (
                        <p className="text-[8.5px] text-red-500 font-extrabold uppercase text-center bg-red-500/10 border border-red-500/20 py-2 px-3 rounded-xl">
                          ❌ {otpError}
                        </p>
                      )}

                      <div className="flex gap-2 pt-1">
                        <Button 
                          type="button" 
                          onClick={() => setActiveOrder(null)} 
                          disabled={submittingOtp}
                          className="flex-1 h-10 bg-[#1e293b] text-slate-350 rounded-lg text-[8.5px] font-black uppercase"
                        >
                          {t.cancel}
                        </Button>
                        <Button 
                          type="submit" 
                          loading={submittingOtp} 
                          disabled={otpValue.length !== 4}
                          className="flex-1 h-10 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-[8.5px] font-black uppercase"
                        >
                          Verify & Settle
                        </Button>
                      </div>
                    </form>
                  ) : (
                    /* Contactless submission buttons */
                    <div className="space-y-2">
                      {otpError && (
                        <p className="text-[8.5px] text-red-500 font-extrabold uppercase text-center bg-red-500/10 border border-red-500/20 py-2 px-3 rounded-xl">
                          ❌ {otpError}
                        </p>
                      )}

                      <div className="flex gap-2">
                        <Button 
                          type="button" 
                          onClick={() => setActiveOrder(null)} 
                          disabled={submittingOtp}
                          className="flex-1 h-10 bg-[#1e293b] text-slate-355 rounded-lg text-[8.5px] font-black uppercase"
                        >
                          {t.cancel}
                        </Button>
                        <Button 
                          onClick={handleConfirmContactlessDropoff}
                          loading={submittingOtp} 
                          disabled={!contactlessProofUploaded}
                          className="flex-1 h-10 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[8.5px] font-black uppercase"
                        >
                          Settle contactless
                        </Button>
                      </div>
                    </div>
                  )}

                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ─── MODAL 3: REPORT ISSUE FORM ──────────────────────────────── */}
      <AnimatePresence>
        {reportModalOpen && (
          <>
            <div 
              onClick={() => setReportModalOpen(null)}
              className="fixed inset-0 bg-[#020408]/80 backdrop-blur-sm z-[9999]" 
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="fixed inset-x-4 top-1/4 bg-[#0c0e14] border border-[#1e293b] rounded-2xl p-5 space-y-4 z-[9999] max-w-sm mx-auto shadow-2xl text-[10px]"
            >
              <div className="flex items-center justify-between border-b border-[#1e293b] pb-2">
                <h3 className="text-xs font-black text-white uppercase">Report Delivery Issue</h3>
                <button 
                  onClick={() => setReportModalOpen(null)}
                  className="w-6 h-6 rounded-md bg-[#1e293b]/60 flex items-center justify-center text-slate-400"
                >
                  <X size={12} />
                </button>
              </div>

              <form onSubmit={handleReportOrderIssue} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest block ml-1">Issue Category</label>
                  <select
                    value={reportedIssueType}
                    onChange={e => setReportedIssueType(e.target.value)}
                    className="w-full h-9 px-2 rounded-lg bg-[#070b12] border border-[#1e293b] text-white text-[10px] focus:outline-none font-bold"
                  >
                    <option value="WRONG_ITEM">🚫 Wrong Item Delivered</option>
                    <option value="MISSING_ITEM">🔍 Missing Items</option>
                    <option value="CUSTOMER_UNAVAILABLE">📴 Customer Unavailable / Out of reach</option>
                    <option value="ACCIDENT_VEHICLE_ISSUE">🛵 Vehicle Breakdown / Accident</option>
                    <option value="OTHER">❓ Other Problem</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest block ml-1">Additional details (Comments)</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Provide details about the issue..."
                    value={reportedComments}
                    onChange={e => setReportedComments(e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-[#070b12] border border-[#1e293b] text-white placeholder-slate-700 outline-none resize-none"
                  />
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setReportModalOpen(null)}
                    className="flex-1 h-9 bg-[#1e293b] text-slate-350 rounded-lg text-[8.5px] font-black uppercase"
                  >
                    {t.cancel}
                  </button>
                  <button
                    type="submit"
                    disabled={submittingIssue}
                    className="flex-1 h-9 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-[8.5px] font-black uppercase tracking-wider"
                  >
                    {submittingIssue ? 'Submitting...' : 'Submit Issue'}
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      
    </div>
  );
}
