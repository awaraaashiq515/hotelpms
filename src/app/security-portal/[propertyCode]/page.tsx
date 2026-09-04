'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { toast, Toaster } from 'sonner'
import {
  Shield,
  QrCode,
  Users,
  Home,
  Search,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Phone,
  Calendar,
  Bed,
  Package,
  Activity,
  LogOut,
  ChevronDown,
  ChevronUp,
  Camera,
  RefreshCw,
  MapPin,
  FileText,
  Utensils,
  Waves,
  Sparkles,
  CreditCard,
  Hash,
  Lock,
  User,
  ArrowRight,
} from 'lucide-react'

/* ─────────────── Types ─────────────── */
interface DashboardData {
  totalRooms: number
  occupiedRooms: number
  availableRooms: number
  maintenanceRooms: number
  inHouseCount: number
  todayArrivalsCount: number
  todayDeparturesCount: number
  overdueCount: number
  pendingPaymentsCount: number
  todayArrivals: Reservation[]
  todayDepartures: Reservation[]
  overdueCheckouts: Reservation[]
  inHouseGuests: CheckInRecord[]
  maintenanceAlerts: MaintenanceAlert[]
  rooms: RoomItem[]
}

interface Reservation {
  id: string
  bookingNo: string
  status: string
  arrivalDate: string
  departureDate: string
  adults: number
  children: number
  totalAmount: number
  advanceAmount: number
  dueAmount: number
  mealPlan?: string
  poolAccess?: boolean
  addOnNotes?: string
  guest: { firstName: string; lastName: string; mobile: string }
  roomType: { name: string }
  rooms: { room: { roomNumber: string } | null }[]
}

interface CheckInRecord {
  id: string
  checkedInAt: string
  expectedCheckoutAt: string
  guest: { firstName: string; lastName: string; mobile: string }
  room: { roomNumber: string; floor: string | null }
}

interface MaintenanceAlert {
  id: string
  ticketNo: string
  issueType: string
  priority: string
  status: string
  openedAt: string
  room: { roomNumber: string }
}

interface RoomItem {
  id: string
  roomNumber: string
  status: string
  housekeepingStatus: string
  floor: string | null
}

interface ScanResult {
  verificationStatus: 'VALID' | 'CONFIRMED' | 'EXPIRED' | 'CANCELLED' | 'INVALID'
  reservation?: {
    id: string
    bookingNo: string
    status: string
    arrivalDate: string
    departureDate: string
    adults: number
    children: number
    totalAmount: number
    advanceAmount: number
    dueAmount: number
    mealPlan?: string
    poolAccess?: boolean
    poolPackage?: string
    spaPackage?: string
    addOnNotes?: string
    roomNumber?: string
    floor?: string
    roomType?: string
    checkInTime?: string
    expectedCheckout?: string
  }
  guest?: {
    firstName: string
    lastName: string
    mobile: string
    email?: string
    idType?: string
    idNumber?: string
  }
  property?: {
    name: string
    brandName?: string
    phone?: string
  }
}

interface LostItem {
  id: string
  item: string
  description: string
  room: string
  foundAt: string
  foundBy: string
  status: 'FOUND' | 'CLAIMED'
  guestContact?: string
  claimedBy?: string
}

interface IncidentLog {
  id: string
  type: string
  location: string
  description: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH'
  timestamp: string
}

interface SecurityUser {
  id: string
  fullName: string
  email: string
  phone?: string | null
  designation?: string | null
  property?: { id: string; name: string; code: string } | null
}

type Tab = 'overview' | 'scan' | 'bookings' | 'inhouse' | 'lostfound' | 'incidents' | 'rooms'

/* ─────────────── Constants ─────────────── */
const INCIDENT_TYPES = [
  'Disturbance', 'Unauthorized Access', 'Medical Emergency',
  'Fire Alarm', 'Theft / Suspicious', 'Noise Complaint', 'Other',
]

/* ─────────────── Styles ─────────────── */
const S = {
  root: {
    minHeight: '100vh',
    background: '#080b12',
    color: '#e2e8f0',
    fontFamily: "'Inter', -apple-system, sans-serif",
  } as React.CSSProperties,

  header: {
    background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
    borderBottom: '1px solid rgba(99,102,241,0.2)',
    padding: '14px 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'sticky' as const,
    top: 0,
    zIndex: 50,
  } as React.CSSProperties,

  tabBar: {
    background: '#0d1117',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    display: 'flex',
    overflowX: 'auto' as const,
    scrollbarWidth: 'none' as const,
    position: 'sticky' as const,
    top: 64,
    zIndex: 40,
  } as React.CSSProperties,

  tab: (active: boolean): React.CSSProperties => ({
    padding: '12px 16px',
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: '0.02em',
    whiteSpace: 'nowrap',
    cursor: 'pointer',
    border: 'none',
    background: 'transparent',
    color: active ? '#818cf8' : '#64748b',
    borderBottom: active ? '2px solid #818cf8' : '2px solid transparent',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  }),

  content: {
    padding: '16px',
    maxWidth: 900,
    margin: '0 auto',
  } as React.CSSProperties,

  statCard: (color: string): React.CSSProperties => ({
    background: `linear-gradient(135deg, rgba(${color},0.12) 0%, rgba(${color},0.06) 100%)`,
    border: `1px solid rgba(${color},0.2)`,
    borderRadius: 14,
    padding: '16px',
    flex: '1 1 140px',
  }),

  card: {
    background: '#0d1117',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 12,
  } as React.CSSProperties,

  cardHeader: {
    padding: '14px 16px',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  } as React.CSSProperties,

  badge: (color: string): React.CSSProperties => ({
    background: `rgba(${color},0.15)`,
    color: `rgb(${color})`,
    border: `1px solid rgba(${color},0.25)`,
    borderRadius: 6,
    padding: '2px 8px',
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.05em',
  }),

  input: {
    width: '100%',
    background: '#0d1117',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 10,
    padding: '10px 14px',
    color: '#e2e8f0',
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box' as const,
  } as React.CSSProperties,

  btn: (variant: 'primary' | 'danger' | 'ghost' | 'success'): React.CSSProperties => {
    const map = {
      primary: { bg: 'rgba(99,102,241,0.85)', border: 'rgba(99,102,241,0.5)', color: '#fff' },
      danger: { bg: 'rgba(239,68,68,0.85)', border: 'rgba(239,68,68,0.5)', color: '#fff' },
      ghost: { bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.1)', color: '#94a3b8' },
      success: { bg: 'rgba(16,185,129,0.85)', border: 'rgba(16,185,129,0.5)', color: '#fff' },
    }
    const v = map[variant]
    return {
      background: v.bg,
      border: `1px solid ${v.border}`,
      borderRadius: 8,
      color: v.color,
      padding: '8px 16px',
      fontSize: 13,
      fontWeight: 600,
      cursor: 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      transition: 'opacity 0.2s',
    }
  },
}

/* ─────────────── Status Config ─────────────── */
const VERIFY_STATUS: Record<string, { label: string; color: string; rgb: string; icon: React.ReactNode; desc: string }> = {
  VALID:      { label: 'VALID — Checked In',        color: '#34d399', rgb: '16,185,129',  icon: <CheckCircle size={32} />, desc: 'Guest is actively checked in. Entry permitted.' },
  CONFIRMED:  { label: 'CONFIRMED — Not Checked In', color: '#fbbf24', rgb: '251,191,36',  icon: <Clock size={32} />,        desc: 'Booking confirmed but check-in has not happened yet.' },
  EXPIRED:    { label: 'EXPIRED — Checked Out',      color: '#f87171', rgb: '239,68,68',   icon: <XCircle size={32} />,      desc: 'Guest has already checked out.' },
  CANCELLED:  { label: 'CANCELLED',                  color: '#94a3b8', rgb: '148,163,184', icon: <XCircle size={32} />,      desc: 'This booking was cancelled.' },
  INVALID:    { label: 'INVALID QR',                 color: '#f87171', rgb: '239,68,68',   icon: <XCircle size={32} />,      desc: 'QR code not recognized in the system.' },
}

const ROOM_STATUS_COLOR: Record<string, string> = {
  OCCUPIED:     '#f87171',
  AVAILABLE:    '#34d399',
  MAINTENANCE:  '#fbbf24',
  OUT_OF_ORDER: '#6b7280',
  CLEANING:     '#818cf8',
}

const BOOKING_STATUS_COLOR: Record<string, { rgb: string; label: string }> = {
  CONFIRMED:   { rgb: '99,102,241', label: 'Confirmed' },
  CHECKED_IN:  { rgb: '16,185,129', label: 'Checked In' },
  CHECKED_OUT: { rgb: '148,163,184', label: 'Checked Out' },
  CANCELLED:   { rgb: '239,68,68', label: 'Cancelled' },
  PENDING:     { rgb: '251,191,36', label: 'Pending' },
}

/* ─────────────── Helper Functions ─────────────── */
function fmtDate(d: string | Date) {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}
function fmtTime(d: string | Date) {
  return new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
}
function fmtDateTime(d: string | Date) {
  return `${fmtDate(d)} ${fmtTime(d)}`
}
function guestName(g: { firstName: string; lastName?: string | null }) {
  return `${g.firstName}${g.lastName ? ' ' + g.lastName : ''}`
}
function roomNo(r: Reservation) {
  return r.rooms?.[0]?.room?.roomNumber || '—'
}
function nights(arrivalDate: string, departureDate: string) {
  return Math.max(1, Math.round(
    (new Date(departureDate).getTime() - new Date(arrivalDate).getTime()) / (1000 * 60 * 60 * 24)
  ))
}

/* ─────────────── Main Component ─────────────── */
export default function SecurityPortalPage({ params }: { params: Promise<{ propertyCode: string }> }) {
  const [propertyCode, setPropertyCode] = useState<string>('')
  const [tab, setTab] = useState<Tab>('overview')
  const [loading, setLoading] = useState(true)
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  
  // Auth state
  const [user, setUser] = useState<SecurityUser | null>(null)
  const [wtToken, setWtToken] = useState<string>('')
  const [sessionChecking, setSessionChecking] = useState(true)
  const [authEmail, setAuthEmail] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [authError, setAuthError] = useState('')

  // Booking list
  const [bookings, setBookings] = useState<Reservation[]>([])
  const [bookingsLoading, setBookingsLoading] = useState(false)
  const [bookingSearch, setBookingSearch] = useState('')
  const [bookingFilter, setBookingFilter] = useState<'all' | 'arrivals' | 'inhouse' | 'departures' | 'upcoming'>('all')
  const [expandedBooking, setExpandedBooking] = useState<string | null>(null)

  // QR Scanner
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [scanning, setScanning] = useState(false)
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)
  const [scanLoading, setScanLoading] = useState(false)
  const [manualCode, setManualCode] = useState('')
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [scanLog, setScanLog] = useState<{ time: string; name: string; room: string; result: string }[]>([])

  // Lost & Found
  const [lostItems, setLostItems] = useState<LostItem[]>([])
  const [lostLoading, setLostLoading] = useState(false)
  const [showLostForm, setShowLostForm] = useState(false)
  const [lostForm, setLostForm] = useState({ item: '', description: '', room: '', foundBy: '', notes: '' })
  const [lostFilter, setLostFilter] = useState<'ALL' | 'FOUND' | 'CLAIMED'>('ALL')

  // Incidents
  const [incidents, setIncidents] = useState<IncidentLog[]>([])
  const [showIncidentForm, setShowIncidentForm] = useState(false)
  const [incidentForm, setIncidentForm] = useState({ type: INCIDENT_TYPES[0], location: '', description: '', severity: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH' })

  /* ── Init & Auth check ── */
  useEffect(() => {
    params.then((p) => {
      setPropertyCode(p.propertyCode)
    })
    // Load incidents from localStorage
    try {
      const saved = localStorage.getItem('security_incidents')
      if (saved) setIncidents(JSON.parse(saved))
    } catch { /* ignore */ }
    // Load scan log
    try {
      const saved = localStorage.getItem('security_scan_log')
      if (saved) setScanLog(JSON.parse(saved))
    } catch { /* ignore */ }
  }, [params])

  // Session verification & auto-login from main login session
  useEffect(() => {
    if (!propertyCode) return
    const initSession = async () => {
      setSessionChecking(true)
      // 1. Try saved local session
      const saved = localStorage.getItem('security_portal_session')
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          if (parsed.user) {
            setUser(parsed.user)
            if (parsed.wtToken) setWtToken(parsed.wtToken)
            setSessionChecking(false)
            return
          }
        } catch {
          localStorage.removeItem('security_portal_session')
        }
      }

      // 2. Try auto-login from main session cookie
      try {
        const sessionRes = await fetch('/api/auth/session')
        if (sessionRes.ok) {
          const sessionData = await sessionRes.json()
          if (sessionData.authenticated && sessionData.user?.id) {
            const wtRes = await fetch('/api/walkie-talkie/staff-login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: sessionData.user.id,
                propertyCode,
                fromMainSession: true,
              }),
            })
            if (wtRes.ok) {
              const wtData = await wtRes.json()
              if (wtData.user) {
                setUser(wtData.user)
                if (wtData.wtToken) setWtToken(wtData.wtToken)
                localStorage.setItem('security_portal_session', JSON.stringify({ user: wtData.user, wtToken: wtData.wtToken }))
                setSessionChecking(false)
                return
              }
            }
          }
        }
      } catch (err) {
        console.error('[Security Session Init Error]', err)
      }

      setSessionChecking(false)
    }

    initSession()
  }, [propertyCode])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!authEmail.trim() || !authPassword) {
      setAuthError('Email and password are required.')
      return
    }
    setAuthLoading(true)
    setAuthError('')
    try {
      const res = await fetch('/api/walkie-talkie/staff-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: authEmail.trim(),
          password: authPassword,
          propertyCode,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setAuthError(data.message || 'Login failed. Please check credentials.')
        return
      }

      setUser(data.user)
      if (data.wtToken) setWtToken(data.wtToken)
      localStorage.setItem('security_portal_session', JSON.stringify({ user: data.user, wtToken: data.wtToken }))
      toast.success(`Welcome, ${data.user.fullName}! 🛡️`)
    } catch {
      setAuthError('Network error. Please try again.')
    } finally {
      setAuthLoading(false)
    }
  }

  const handleLogout = async () => {
    setUser(null)
    setWtToken('')
    setDashboard(null)
    localStorage.removeItem('security_portal_session')
    await Promise.allSettled([
      fetch('/api/auth/staff-logout', { method: 'POST' }),
      fetch('/api/auth/logout', { method: 'POST' }),
    ])
    toast.info('Logged out')
  }

  const fetchDashboard = useCallback(async () => {
    if (!propertyCode || !user) return
    try {
      setLoading(true)
      const headers: any = {}
      if (wtToken) headers.Authorization = `Bearer ${wtToken}`
      const res = await fetch(`/api/security/dashboard?propertyCode=${propertyCode.toUpperCase()}`, { headers })
      if (res.ok) {
        const data = await res.json()
        setDashboard(data.data)
      } else {
        toast.error('Failed to load dashboard data')
      }
    } catch {
      toast.error('Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }, [propertyCode, user, wtToken])

  const fetchBookings = useCallback(async () => {
    try {
      setBookingsLoading(true)
      const headers: any = {}
      if (wtToken) headers.Authorization = `Bearer ${wtToken}`
      const res = await fetch('/api/hotel/bookings', { headers })
      if (res.ok) {
        const data = await res.json()
        setBookings(data.data || [])
      }
    } catch { toast.error('Failed to load bookings') }
    finally { setBookingsLoading(false) }
  }, [wtToken])

  const fetchLostItems = useCallback(async () => {
    try {
      setLostLoading(true)
      const headers: any = {}
      if (wtToken) headers.Authorization = `Bearer ${wtToken}`
      const res = await fetch(`/api/hotel/lost-found?propertyCode=${propertyCode.toUpperCase()}`, { headers })
      if (res.ok) {
        const data = await res.json()
        setLostItems(data.data || [])
      }
    } catch { toast.error('Failed to load lost items') }
    finally { setLostLoading(false) }
  }, [propertyCode, wtToken])

  useEffect(() => {
    if (user && propertyCode) {
      fetchDashboard()
    }
  }, [user, propertyCode, fetchDashboard])

  useEffect(() => {
    if (!user) return
    if (tab === 'bookings') fetchBookings()
    if (tab === 'lostfound') fetchLostItems()
  }, [tab, user, fetchBookings, fetchLostItems])

  /* ── Auto-refresh dashboard every 60s ── */
  useEffect(() => {
    if (!user) return
    const iv = setInterval(() => { if (tab === 'overview') fetchDashboard() }, 60000)
    return () => clearInterval(iv)
  }, [tab, user, fetchDashboard])

  /* ── QR Scanner ── */
  const startScanner = async () => {
    setScanResult(null)
    setScanning(true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
      // Dynamically import jsQR
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const jsQRModule = await import('jsqr' as any) as any
      const jsQR = jsQRModule.default || jsQRModule
      scanIntervalRef.current = setInterval(() => {
        if (!videoRef.current || !canvasRef.current) return
        const video = videoRef.current
        const canvas = canvasRef.current
        if (video.readyState !== video.HAVE_ENOUGH_DATA) return
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const code = jsQR(imageData.data, imageData.width, imageData.height)
        if (code?.data) {
          stopScanner()
          processQR(code.data)
        }
      }, 250)
    } catch {
      toast.error('Camera access denied. Use manual search below.')
      setScanning(false)
    }
  }

  const stopScanner = () => {
    if (scanIntervalRef.current) clearInterval(scanIntervalRef.current)
    if (streamRef.current) { streamRef.current.getTracks().forEach((t) => t.stop()) }
    streamRef.current = null
    setScanning(false)
  }

  const processQR = async (qrData: string) => {
    setScanLoading(true)
    setScanResult(null)
    try {
      // Extract reservationId from URL or raw value
      let reservationId = qrData
      try {
        const url = new URL(qrData)
        const parts = url.pathname.split('/')
        const verifyIdx = parts.indexOf('verify')
        if (verifyIdx !== -1 && parts[verifyIdx + 1]) {
          reservationId = parts[verifyIdx + 1]
        }
      } catch { /* raw id */ }

      const res = await fetch(`/api/security/verify/${reservationId}`)
      const data = await res.json()

      if (!res.ok || !data.success) {
        const result: ScanResult = { verificationStatus: 'INVALID' }
        setScanResult(result)
        addToScanLog('Unknown', '—', 'INVALID')
        return
      }

      setScanResult(data.data)
      const gName = data.data.guest ? `${data.data.guest.firstName} ${data.data.guest.lastName || ''}`.trim() : 'Unknown'
      const gRoom = data.data.reservation?.roomNumber || '—'
      addToScanLog(gName, gRoom, data.data.verificationStatus)
    } catch {
      setScanResult({ verificationStatus: 'INVALID' })
      addToScanLog('Unknown', '—', 'INVALID')
    } finally {
      setScanLoading(false)
    }
  }

  const addToScanLog = (name: string, room: string, result: string) => {
    const entry = { time: new Date().toISOString(), name, room, result }
    setScanLog((prev) => {
      const updated = [entry, ...prev].slice(0, 20)
      try { localStorage.setItem('security_scan_log', JSON.stringify(updated)) } catch { /* ignore */ }
      return updated
    })
  }

  const handleManualSearch = async () => {
    if (!manualCode.trim()) return
    let rid = manualCode.trim()
    if (rid.startsWith('RES-') || rid.startsWith('WALK-')) {
      const res = await fetch('/api/hotel/bookings')
      if (res.ok) {
        const data = await res.json()
        const found = (data.data || []).find((b: Reservation) => b.bookingNo === rid)
        if (found) rid = found.id
      }
    }
    processQR(rid)
  }

  useEffect(() => {
    return () => { stopScanner() }
  }, [])

  /* ── Lost & Found ── */
  const submitLostItem = async () => {
    if (!lostForm.item.trim()) { toast.error('Item name is required'); return }
    try {
      const res = await fetch('/api/hotel/lost-found', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(wtToken ? { Authorization: `Bearer ${wtToken}` } : {}) },
        body: JSON.stringify({ ...lostForm, propertyCode: propertyCode.toUpperCase() }),
      })
      if (res.ok) {
        toast.success('Lost item reported!')
        setShowLostForm(false)
        setLostForm({ item: '', description: '', room: '', foundBy: '', notes: '' })
        fetchLostItems()
      } else {
        toast.error('Failed to report item')
      }
    } catch { toast.error('Error submitting') }
  }

  const claimLostItem = async (id: string, claimedBy: string) => {
    try {
      const res = await fetch('/api/hotel/lost-found', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...(wtToken ? { Authorization: `Bearer ${wtToken}` } : {}) },
        body: JSON.stringify({ id, status: 'CLAIMED', claimedBy }),
      })
      if (res.ok) { toast.success('Item marked as claimed'); fetchLostItems() }
      else toast.error('Failed to update')
    } catch { toast.error('Error updating') }
  }

  /* ── Incidents ── */
  const addIncident = () => {
    if (!incidentForm.location.trim() || !incidentForm.description.trim()) {
      toast.error('Location and description are required')
      return
    }
    const entry: IncidentLog = {
      id: Date.now().toString(),
      ...incidentForm,
      timestamp: new Date().toISOString(),
    }
    const updated = [entry, ...incidents]
    setIncidents(updated)
    try { localStorage.setItem('security_incidents', JSON.stringify(updated)) } catch { /* ignore */ }
    setShowIncidentForm(false)
    setIncidentForm({ type: INCIDENT_TYPES[0], location: '', description: '', severity: 'MEDIUM' })
    toast.success('Incident logged')
  }

  const removeIncident = (id: string) => {
    const updated = incidents.filter((i) => i.id !== id)
    setIncidents(updated)
    try { localStorage.setItem('security_incidents', JSON.stringify(updated)) } catch { /* ignore */ }
  }

  /* ── Filtered Bookings ── */
  const today = new Date().toISOString().split('T')[0]
  const filteredBookings = bookings.filter((b) => {
    const term = bookingSearch.toLowerCase()
    if (term) {
      const match = guestName(b.guest).toLowerCase().includes(term) ||
        b.guest.mobile?.includes(term) ||
        b.bookingNo.toLowerCase().includes(term) ||
        roomNo(b).toLowerCase().includes(term)
      if (!match) return false
    }
    if (bookingFilter === 'arrivals') return new Date(b.arrivalDate).toISOString().split('T')[0] === today
    if (bookingFilter === 'inhouse') return b.status === 'CHECKED_IN'
    if (bookingFilter === 'departures') return new Date(b.departureDate).toISOString().split('T')[0] === today && b.status === 'CHECKED_IN'
    if (bookingFilter === 'upcoming') {
      const arr = new Date(b.arrivalDate).toISOString().split('T')[0]
      return arr > today && (b.status === 'CONFIRMED' || b.status === 'PENDING')
    }
    return true
  })

  const filteredLostItems = lostItems.filter((i) => lostFilter === 'ALL' || i.status === lostFilter)

  /* ═══════════ AUTH CHECKING SCREEN ═══════════ */
  if (sessionChecking) {
    return (
      <div style={{
        minHeight: '100vh', background: '#080b12', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        fontFamily: "'Inter', sans-serif", color: '#94a3b8',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Shield size={24} color="#fff" />
          </div>
          <p style={{ fontSize: 13, fontWeight: 600 }}>Checking security credentials…</p>
        </div>
      </div>
    )
  }

  /* ═══════════ LOGIN SCREEN (WHEN NOT LOGGED IN) ═══════════ */
  if (!user) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#060810',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        fontFamily: "'Inter', -apple-system, sans-serif",
      }}>
        <Toaster position="top-center" richColors />
        <div style={{
          width: '100%',
          maxWidth: 420,
          background: '#0d111a',
          border: '1px solid rgba(99,102,241,0.2)',
          borderRadius: 24,
          padding: '32px 28px',
          boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
        }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              boxShadow: '0 8px 24px rgba(99,102,241,0.35)',
            }}>
              <Shield size={28} color="#fff" />
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 900, color: '#f1f5f9', margin: '0 0 6px' }}>
              Security Guard Login
            </h1>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 8, padding: '3px 10px' }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#818cf8', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                PROPERTY: {propertyCode.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: 6, letterSpacing: '0.04em' }}>
                STAFF EMAIL / USERNAME
              </label>
              <div style={{ position: 'relative' }}>
                <User size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                <input
                  style={{ ...S.input, paddingLeft: 38 }}
                  placeholder="e.g. security@hotel.com"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: 6, letterSpacing: '0.04em' }}>
                STAFF PASSWORD
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                <input
                  style={{ ...S.input, paddingLeft: 38 }}
                  type="password"
                  placeholder="••••••••"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
              </div>
            </div>

            {authError && (
              <div style={{
                background: 'rgba(239,68,68,0.12)',
                border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: 10,
                padding: '10px 14px',
                color: '#f87171',
                fontSize: 12,
                fontWeight: 600,
                marginBottom: 16,
              }}>
                {authError}
              </div>
            )}

            <button
              type="submit"
              disabled={authLoading}
              style={{
                width: '100%',
                padding: '13px',
                borderRadius: 12,
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                border: 'none',
                color: '#fff',
                fontSize: 14,
                fontWeight: 800,
                cursor: authLoading ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                boxShadow: '0 4px 16px rgba(99,102,241,0.3)',
              }}
            >
              {authLoading ? 'Signing in…' : <>Sign In as Security <ArrowRight size={16} /></>}
            </button>
          </form>

          {/* Footer assistance */}
          <div style={{ marginTop: 24, paddingTop: 18, borderTop: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
            <p style={{ fontSize: 11, color: '#64748b', margin: '0 0 8px', lineHeight: 1.5 }}>
              Security staff credentials can be created or managed from the hotel admin panel.
            </p>
            <a
              href="/hotel/staff"
              target="_blank"
              style={{ fontSize: 11, color: '#818cf8', fontWeight: 700, textDecoration: 'none' }}
            >
              Go to Hotel Staff Management ↗
            </a>
          </div>
        </div>
      </div>
    )
  }

  /* ─────────── RENDER (LOGGED IN) ─────────── */
  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <Activity size={14} /> },
    { id: 'scan', label: 'Scan QR', icon: <QrCode size={14} /> },
    { id: 'bookings', label: 'Bookings', icon: <FileText size={14} /> },
    { id: 'inhouse', label: 'In-House', icon: <Users size={14} /> },
    { id: 'lostfound', label: 'Lost & Found', icon: <Package size={14} /> },
    { id: 'incidents', label: 'Incidents', icon: <AlertTriangle size={14} /> },
    { id: 'rooms', label: 'Rooms', icon: <Home size={14} /> },
  ]

  return (
    <div style={S.root}>
      <Toaster position="top-center" richColors />

      {/* ── Header ── */}
      <div style={S.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Shield size={18} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#f1f5f9', lineHeight: 1.2 }}>Security Portal</div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
              <span style={{ color: '#818cf8', fontWeight: 700 }}>{user.fullName}</span>
              <span style={{ color: '#64748b' }}> · {user.designation || 'Security Guard'} · {propertyCode.toUpperCase()}</span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={fetchDashboard} style={S.btn('ghost')} title="Refresh">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={handleLogout} style={S.btn('danger')} title="Logout">
            <LogOut size={13} /> Exit
          </button>
        </div>
      </div>

      {/* ── Tab Bar ── */}
      <div style={S.tabBar}>
        {tabs.map((t) => (
          <button key={t.id} style={S.tab(tab === t.id)} onClick={() => setTab(t.id)}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ── Content ── */}
      <div style={S.content}>

        {/* ═══════════════ OVERVIEW ═══════════════ */}
        {tab === 'overview' && (
          <div>
            {loading ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#475569' }}>Loading…</div>
            ) : dashboard ? (
              <>
                {/* Stat Cards */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
                  {[
                    { label: 'In-House', value: dashboard.inHouseCount, color: '16,185,129', icon: <Users size={18} /> },
                    { label: "Today's Arrivals", value: dashboard.todayArrivalsCount, color: '99,102,241', icon: <Calendar size={18} /> },
                    { label: "Today's Departures", value: dashboard.todayDeparturesCount, color: '251,191,36', icon: <LogOut size={18} /> },
                    { label: 'Overdue Checkouts', value: dashboard.overdueCount, color: '239,68,68', icon: <AlertTriangle size={18} /> },
                    { label: 'Pending Payments', value: dashboard.pendingPaymentsCount, color: '239,68,68', icon: <CreditCard size={18} /> },
                    { label: 'Total Rooms', value: dashboard.totalRooms, color: '148,163,184', icon: <Home size={18} /> },
                  ].map((s) => (
                    <div key={s.label} style={S.statCard(s.color)}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, color: `rgb(${s.color})` }}>
                        {s.icon}
                        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', color: '#64748b' }}>
                          {s.label.toUpperCase()}
                        </span>
                      </div>
                      <div style={{ fontSize: 30, fontWeight: 900, color: '#f1f5f9', lineHeight: 1 }}>{s.value}</div>
                    </div>
                  ))}
                </div>

                {/* Quick Scan Button */}
                <button
                  onClick={() => { setTab('scan'); setTimeout(startScanner, 200) }}
                  style={{
                    width: '100%', padding: '14px', marginBottom: 16, borderRadius: 12,
                    background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                    border: 'none', color: '#fff', fontSize: 15, fontWeight: 700,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  }}
                >
                  <Camera size={18} /> Quick Scan QR
                </button>

                {/* Today's Arrivals */}
                {dashboard.todayArrivals.length > 0 && (
                  <div style={S.card}>
                    <div style={S.cardHeader}>
                      <span style={{ fontWeight: 700, fontSize: 13, color: '#818cf8' }}>📥 Today's Expected Arrivals</span>
                      <span style={S.badge('99,102,241')}>{dashboard.todayArrivals.length}</span>
                    </div>
                    {dashboard.todayArrivals.map((r) => (
                      <BookingRow key={r.id} r={r} />
                    ))}
                  </div>
                )}

                {/* Overdue Checkouts */}
                {dashboard.overdueCheckouts.length > 0 && (
                  <div style={{ ...S.card, border: '1px solid rgba(239,68,68,0.3)' }}>
                    <div style={S.cardHeader}>
                      <span style={{ fontWeight: 700, fontSize: 13, color: '#f87171' }}>⚠️ Overdue Checkouts</span>
                      <span style={S.badge('239,68,68')}>{dashboard.overdueCheckouts.length}</span>
                    </div>
                    {dashboard.overdueCheckouts.map((r) => (
                      <BookingRow key={r.id} r={r} highlight="danger" />
                    ))}
                  </div>
                )}

                {/* Today's Departures */}
                {dashboard.todayDepartures.length > 0 && (
                  <div style={S.card}>
                    <div style={S.cardHeader}>
                      <span style={{ fontWeight: 700, fontSize: 13, color: '#fbbf24' }}>📤 Today's Departures</span>
                      <span style={S.badge('251,191,36')}>{dashboard.todayDepartures.length}</span>
                    </div>
                    {dashboard.todayDepartures.map((r) => (
                      <BookingRow key={r.id} r={r} />
                    ))}
                  </div>
                )}

                {/* Maintenance Alerts */}
                {dashboard.maintenanceAlerts.length > 0 && (
                  <div style={S.card}>
                    <div style={S.cardHeader}>
                      <span style={{ fontWeight: 700, fontSize: 13, color: '#fbbf24' }}>🔧 Open Maintenance Tickets</span>
                      <span style={S.badge('251,191,36')}>{dashboard.maintenanceAlerts.length}</span>
                    </div>
                    {dashboard.maintenanceAlerts.map((t) => (
                      <div key={t.id} style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <span style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0' }}>Room {t.room.roomNumber}</span>
                          <span style={{ fontSize: 11, color: '#64748b', marginLeft: 8 }}>{t.issueType}</span>
                        </div>
                        <span style={S.badge(t.priority === 'HIGH' ? '239,68,68' : t.priority === 'MEDIUM' ? '251,191,36' : '148,163,184')}>
                          {t.priority}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Scan Log */}
                {scanLog.length > 0 && (
                  <div style={S.card}>
                    <div style={S.cardHeader}>
                      <span style={{ fontWeight: 700, fontSize: 13, color: '#94a3b8' }}>📋 Recent Scan Log</span>
                    </div>
                    {scanLog.slice(0, 10).map((s, i) => (
                      <div key={i} style={{ padding: '8px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <span style={{ fontSize: 12, fontWeight: 600, color: '#e2e8f0' }}>{s.name}</span>
                          <span style={{ fontSize: 11, color: '#64748b', marginLeft: 6 }}>Room {s.room}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={S.badge(s.result === 'VALID' ? '16,185,129' : '239,68,68')}>{s.result}</span>
                          <span style={{ fontSize: 10, color: '#475569' }}>{fmtTime(s.time)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: 40, color: '#475569' }}>No data available.</div>
            )}
          </div>
        )}

        {/* ═══════════════ QR SCAN ═══════════════ */}
        {tab === 'scan' && (
          <div>
            {!scanning && !scanResult && (
              <div style={{ textAlign: 'center', paddingTop: 20 }}>
                <div style={{ width: 80, height: 80, borderRadius: 20, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <QrCode size={36} color="#fff" />
                </div>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: '#f1f5f9', margin: '0 0 8px' }}>Scan Guest QR Code</h2>
                <p style={{ fontSize: 13, color: '#64748b', marginBottom: 24 }}>Point camera at the QR code on guest's phone or printout</p>
                <button onClick={startScanner} style={{ ...S.btn('primary'), fontSize: 15, padding: '12px 32px', borderRadius: 10 }}>
                  <Camera size={18} /> Open Camera
                </button>
              </div>
            )}

            {/* Camera View */}
            {scanning && (
              <div style={{ position: 'relative', marginBottom: 16 }}>
                <video ref={videoRef} style={{ width: '100%', borderRadius: 14, background: '#000', maxHeight: 340, objectFit: 'cover' }} playsInline muted />
                <canvas ref={canvasRef} style={{ display: 'none' }} />
                {/* Scan overlay */}
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                  <div style={{ width: 200, height: 200, border: '2px solid #6366f1', borderRadius: 16, boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)' }} />
                </div>
                <button
                  onClick={stopScanner}
                  style={{ position: 'absolute', top: 12, right: 12, ...S.btn('danger'), padding: '6px 12px', fontSize: 12 }}
                >
                  Stop
                </button>
                <div style={{ textAlign: 'center', marginTop: 10, fontSize: 12, color: '#818cf8', fontWeight: 600 }}>
                  🔍 Scanning…
                </div>
              </div>
            )}

            {scanLoading && (
              <div style={{ textAlign: 'center', padding: 30, color: '#818cf8' }}>
                <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite' }} />
                <p style={{ marginTop: 8 }}>Verifying booking…</p>
              </div>
            )}

            {/* Scan Result */}
            {scanResult && !scanLoading && (
              <ScanResultCard result={scanResult} onRescan={() => { setScanResult(null); startScanner() }} />
            )}

            {/* Manual Search */}
            <div style={{ ...S.card, marginTop: 20 }}>
              <div style={S.cardHeader}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#94a3b8' }}>Manual Search</span>
              </div>
              <div style={{ padding: 16 }}>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    style={S.input}
                    placeholder="Enter Booking No (e.g. RES-123456-789) or Reservation ID"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleManualSearch()}
                  />
                  <button onClick={handleManualSearch} style={S.btn('primary')}>
                    <Search size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════ BOOKINGS ═══════════════ */}
        {tab === 'bookings' && (
          <div>
            <div style={{ marginBottom: 12, position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
              <input
                style={{ ...S.input, paddingLeft: 34 }}
                placeholder="Search by name, phone, booking no, room…"
                value={bookingSearch}
                onChange={(e) => setBookingSearch(e.target.value)}
              />
            </div>

            {/* Filter Tabs */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 14, overflowX: 'auto', paddingBottom: 4 }}>
              {([['all', 'All'], ['arrivals', "Today's Arrivals"], ['inhouse', 'In-House'], ['departures', "Today's Departures"], ['upcoming', 'Upcoming']] as const).map(([k, l]) => (
                <button
                  key={k}
                  onClick={() => setBookingFilter(k)}
                  style={{
                    padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                    background: bookingFilter === k ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.04)',
                    border: bookingFilter === k ? '1px solid rgba(99,102,241,0.4)' : '1px solid rgba(255,255,255,0.07)',
                    color: bookingFilter === k ? '#818cf8' : '#64748b',
                    cursor: 'pointer', whiteSpace: 'nowrap',
                  }}
                >
                  {l}
                </button>
              ))}
            </div>

            {bookingsLoading ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#475569' }}>Loading…</div>
            ) : filteredBookings.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#475569' }}>No bookings found.</div>
            ) : (
              filteredBookings.map((b) => (
                <div key={b.id} style={S.card}>
                  <div
                    style={{ padding: '12px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                    onClick={() => setExpandedBooking(expandedBooking === b.id ? null : b.id)}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: '#f1f5f9', marginBottom: 2 }}>
                        {guestName(b.guest)}
                      </div>
                      <div style={{ fontSize: 11, color: '#64748b' }}>
                        Room {roomNo(b)} · {b.roomType?.name} · {fmtDate(b.arrivalDate)} → {fmtDate(b.departureDate)}
                      </div>
                      <div style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>
                        {b.bookingNo} · {b.adults}A {b.children > 0 ? `${b.children}C` : ''}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                      <span style={S.badge(BOOKING_STATUS_COLOR[b.status]?.rgb || '148,163,184')}>
                        {BOOKING_STATUS_COLOR[b.status]?.label || b.status}
                      </span>
                      {(b.dueAmount ?? 0) > 0 && (
                        <span style={S.badge('239,68,68')}>Due ₹{b.dueAmount.toLocaleString('en-IN')}</span>
                      )}
                      {expandedBooking === b.id ? <ChevronUp size={14} color="#475569" /> : <ChevronDown size={14} color="#475569" />}
                    </div>
                  </div>
                  {expandedBooking === b.id && (
                    <div style={{ padding: '0 16px 14px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 12 }}>
                        {[
                          ['Phone', b.guest.mobile || '—', <Phone size={11} />],
                          ['Nights', `${nights(b.arrivalDate, b.departureDate)}`, <Clock size={11} />],
                          ['Meal Plan', b.mealPlan || 'RO', <Utensils size={11} />],
                          ['Pool Access', b.poolAccess ? 'Yes' : 'No', <Waves size={11} />],
                          ['Total', `₹${b.totalAmount?.toLocaleString('en-IN')}`, <CreditCard size={11} />],
                          ['Advance', `₹${b.advanceAmount?.toLocaleString('en-IN')}`, <CreditCard size={11} />],
                        ].map(([l, v, icon]) => (
                          <div key={String(l)} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '8px 10px' }}>
                            <div style={{ fontSize: 10, color: '#475569', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                              {icon as any} {String(l).toUpperCase()}
                            </div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>{String(v)}</div>
                          </div>
                        ))}
                      </div>
                      {b.addOnNotes && (
                        <div style={{ marginTop: 8, background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '8px 10px' }}>
                          <div style={{ fontSize: 10, color: '#475569', marginBottom: 2 }}>ADD-ON NOTES</div>
                          <div style={{ fontSize: 12, color: '#94a3b8' }}>{b.addOnNotes}</div>
                        </div>
                      )}
                      <button
                        onClick={() => processQR(b.id)}
                        style={{ ...S.btn('primary'), marginTop: 10, width: '100%', justifyContent: 'center' }}
                      >
                        <QrCode size={14} /> Verify This Booking
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* ═══════════════ IN-HOUSE ═══════════════ */}
        {tab === 'inhouse' && (
          <div>
            <div style={{ marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: '#f1f5f9', margin: 0 }}>
                Currently In-House — {dashboard?.inHouseCount ?? 0} Guests
              </h2>
              <button onClick={fetchDashboard} style={S.btn('ghost')}><RefreshCw size={14} className={loading ? 'animate-spin' : ''} /></button>
            </div>
            {loading ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#475569' }}>Loading…</div>
            ) : (dashboard?.inHouseGuests || []).length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#475569' }}>No guests currently checked in.</div>
            ) : (
              (dashboard?.inHouseGuests || []).map((c) => {
                const overdue = new Date(c.expectedCheckoutAt) < new Date()
                const nightCount = Math.max(1, Math.round((new Date(c.expectedCheckoutAt).getTime() - new Date(c.checkedInAt).getTime()) / (1000 * 60 * 60 * 24)))
                return (
                  <div key={c.id} style={{ ...S.card, border: overdue ? '1px solid rgba(239,68,68,0.35)' : S.card.border }}>
                    <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14, color: '#f1f5f9', marginBottom: 2 }}>{guestName(c.guest)}</div>
                        <div style={{ fontSize: 11, color: '#64748b' }}>
                          Room {c.room.roomNumber}{c.room.floor ? ` · Floor ${c.room.floor}` : ''} · {nightCount} Night{nightCount > 1 ? 's' : ''}
                        </div>
                        <div style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>
                          In: {fmtDateTime(c.checkedInAt)} · Out: {fmtDate(c.expectedCheckoutAt)}
                        </div>
                        {c.guest.mobile && (
                          <div style={{ fontSize: 11, color: '#475569' }}><Phone size={10} style={{ display: 'inline', marginRight: 4 }} />{c.guest.mobile}</div>
                        )}
                      </div>
                      {overdue && <span style={S.badge('239,68,68')}>OVERDUE</span>}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}

        {/* ═══════════════ LOST & FOUND ═══════════════ */}
        {tab === 'lostfound' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: '#f1f5f9', margin: 0 }}>Lost & Found</h2>
              <button onClick={() => setShowLostForm(!showLostForm)} style={S.btn('primary')}>
                + Report Item
              </button>
            </div>

            {/* Report Form */}
            {showLostForm && (
              <div style={{ ...S.card, padding: 16, marginBottom: 14 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#818cf8', marginBottom: 12 }}>Report Found Item</div>
                {[
                  ['item', 'Item Name *', 'text'],
                  ['description', 'Description', 'text'],
                  ['room', 'Found in Room / Area', 'text'],
                  ['foundBy', 'Found By', 'text'],
                  ['notes', 'Notes', 'text'],
                ].map(([k, l, t]) => (
                  <div key={k} style={{ marginBottom: 10 }}>
                    <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 4 }}>{l}</label>
                    <input
                      style={S.input}
                      type={t}
                      placeholder={String(l)}
                      value={(lostForm as any)[k]}
                      onChange={(e) => setLostForm({ ...lostForm, [k]: e.target.value })}
                    />
                  </div>
                ))}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={submitLostItem} style={S.btn('success')}>✓ Submit</button>
                  <button onClick={() => setShowLostForm(false)} style={S.btn('ghost')}>Cancel</button>
                </div>
              </div>
            )}

            {/* Filter */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
              {(['ALL', 'FOUND', 'CLAIMED'] as const).map((f) => (
                <button key={f} onClick={() => setLostFilter(f)} style={{
                  padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                  background: lostFilter === f ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.04)',
                  border: lostFilter === f ? '1px solid rgba(99,102,241,0.4)' : '1px solid rgba(255,255,255,0.07)',
                  color: lostFilter === f ? '#818cf8' : '#64748b', cursor: 'pointer',
                }}>{f}</button>
              ))}
            </div>

            {lostLoading ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#475569' }}>Loading…</div>
            ) : filteredLostItems.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#475569' }}>No items found.</div>
            ) : (
              filteredLostItems.map((item) => (
                <div key={item.id} style={S.card}>
                  <div style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: '#f1f5f9' }}>{item.item}</div>
                      <span style={S.badge(item.status === 'FOUND' ? '251,191,36' : '16,185,129')}>{item.status}</span>
                    </div>
                    <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>{item.description}</div>
                    <div style={{ fontSize: 11, color: '#475569' }}>
                      Room: {item.room} · Found by: {item.foundBy} · {fmtDateTime(item.foundAt)}
                    </div>
                    {item.status === 'FOUND' && (
                      <button
                        onClick={() => {
                          const by = prompt('Claimed by (name):')
                          if (by) claimLostItem(item.id, by)
                        }}
                        style={{ ...S.btn('success'), marginTop: 8, fontSize: 11 }}
                      >
                        Mark as Claimed
                      </button>
                    )}
                    {item.status === 'CLAIMED' && item.claimedBy && (
                      <div style={{ fontSize: 11, color: '#34d399', marginTop: 4 }}>Claimed by: {item.claimedBy}</div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ═══════════════ INCIDENTS ═══════════════ */}
        {tab === 'incidents' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: '#f1f5f9', margin: 0 }}>Incident Log</h2>
              <button onClick={() => setShowIncidentForm(!showIncidentForm)} style={S.btn('danger')}>
                + Log Incident
              </button>
            </div>

            {showIncidentForm && (
              <div style={{ ...S.card, padding: 16, marginBottom: 14 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#f87171', marginBottom: 12 }}>🚨 New Incident Report</div>
                <div style={{ marginBottom: 10 }}>
                  <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 4 }}>INCIDENT TYPE</label>
                  <select style={{ ...S.input }} value={incidentForm.type} onChange={(e) => setIncidentForm({ ...incidentForm, type: e.target.value })}>
                    {INCIDENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div style={{ marginBottom: 10 }}>
                  <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 4 }}>LOCATION / ROOM *</label>
                  <input style={S.input} placeholder="e.g. Room 204, Lobby, Parking" value={incidentForm.location} onChange={(e) => setIncidentForm({ ...incidentForm, location: e.target.value })} />
                </div>
                <div style={{ marginBottom: 10 }}>
                  <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 4 }}>DESCRIPTION *</label>
                  <textarea style={{ ...S.input, minHeight: 80, resize: 'vertical' } as React.CSSProperties} placeholder="Describe the incident…" value={incidentForm.description} onChange={(e) => setIncidentForm({ ...incidentForm, description: e.target.value })} />
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 4 }}>SEVERITY</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {(['LOW', 'MEDIUM', 'HIGH'] as const).map((s) => (
                      <button key={s} onClick={() => setIncidentForm({ ...incidentForm, severity: s })} style={{
                        flex: 1, padding: '8px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                        background: incidentForm.severity === s ? (s === 'LOW' ? 'rgba(16,185,129,0.2)' : s === 'MEDIUM' ? 'rgba(251,191,36,0.2)' : 'rgba(239,68,68,0.2)') : 'rgba(255,255,255,0.04)',
                        border: incidentForm.severity === s ? `1px solid ${s === 'LOW' ? '#34d399' : s === 'MEDIUM' ? '#fbbf24' : '#f87171'}` : '1px solid rgba(255,255,255,0.07)',
                        color: incidentForm.severity === s ? (s === 'LOW' ? '#34d399' : s === 'MEDIUM' ? '#fbbf24' : '#f87171') : '#64748b',
                        cursor: 'pointer',
                      }}>{s}</button>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={addIncident} style={S.btn('danger')}>🚨 Log Incident</button>
                  <button onClick={() => setShowIncidentForm(false)} style={S.btn('ghost')}>Cancel</button>
                </div>
              </div>
            )}

            {incidents.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#475569' }}>No incidents logged today.</div>
            ) : (
              incidents.map((inc) => (
                <div key={inc.id} style={{ ...S.card, border: `1px solid rgba(${inc.severity === 'HIGH' ? '239,68,68' : inc.severity === 'MEDIUM' ? '251,191,36' : '16,185,129'},0.25)` }}>
                  <div style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14, color: '#f1f5f9' }}>{inc.type}</div>
                        <div style={{ fontSize: 11, color: '#64748b' }}><MapPin size={10} style={{ display: 'inline', marginRight: 3 }} />{inc.location} · {fmtDateTime(inc.timestamp)}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <span style={S.badge(inc.severity === 'HIGH' ? '239,68,68' : inc.severity === 'MEDIUM' ? '251,191,36' : '16,185,129')}>{inc.severity}</span>
                        <button onClick={() => removeIncident(inc.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', padding: 2 }}>✕</button>
                      </div>
                    </div>
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>{inc.description}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ═══════════════ ROOMS ═══════════════ */}
        {tab === 'rooms' && (
          <div>
            <div style={{ marginBottom: 14 }}>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: '#f1f5f9', margin: '0 0 12px' }}>Room Status Grid</h2>
              {/* Legend */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                {Object.entries(ROOM_STATUS_COLOR).map(([status, color]) => (
                  <div key={status} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 3, background: color }} />
                    <span style={{ fontSize: 11, color: '#64748b' }}>{status.replace('_', ' ')}</span>
                  </div>
                ))}
              </div>
            </div>
            {loading ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#475569' }}>Loading…</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(72px, 1fr))', gap: 8 }}>
                {(dashboard?.rooms || []).map((room) => {
                  const color = ROOM_STATUS_COLOR[room.status] || '#6b7280'
                  return (
                    <div
                      key={room.id}
                      style={{
                        background: `rgba(${hexToRgb(color)},0.12)`,
                        border: `1px solid rgba(${hexToRgb(color)},0.3)`,
                        borderRadius: 10,
                        padding: '10px 8px',
                        textAlign: 'center',
                        cursor: 'default',
                      }}
                      title={`Room ${room.roomNumber} — ${room.status}`}
                    >
                      <div style={{ fontSize: 15, fontWeight: 800, color, lineHeight: 1 }}>{room.roomNumber}</div>
                      {room.floor && <div style={{ fontSize: 9, color: '#475569', marginTop: 2 }}>F{room.floor}</div>}
                      <div style={{ fontSize: 8, color, marginTop: 3, fontWeight: 700, letterSpacing: '0.02em' }}>
                        {room.status === 'OUT_OF_ORDER' ? 'OOO' : room.status.slice(0, 4)}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { display: none; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  )
}

/* ─────────────── Sub-components ─────────────── */
function BookingRow({ r, highlight }: { r: Reservation; highlight?: string }) {
  return (
    <div style={{
      padding: '10px 16px',
      borderBottom: '1px solid rgba(255,255,255,0.04)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      background: highlight === 'danger' ? 'rgba(239,68,68,0.05)' : 'transparent',
    }}>
      <div>
        <div style={{ fontWeight: 700, fontSize: 13, color: '#e2e8f0' }}>{guestName(r.guest)}</div>
        <div style={{ fontSize: 11, color: '#64748b' }}>Room {roomNo(r)} · {r.guest.mobile}</div>
        <div style={{ fontSize: 10, color: '#475569' }}>{r.bookingNo}</div>
      </div>
      <div style={{ display: 'flex', gap: 6, flexDirection: 'column', alignItems: 'flex-end' }}>
        <span style={{
          background: `rgba(${BOOKING_STATUS_COLOR[r.status]?.rgb || '148,163,184'},0.15)`,
          color: `rgb(${BOOKING_STATUS_COLOR[r.status]?.rgb || '148,163,184'})`,
          border: `1px solid rgba(${BOOKING_STATUS_COLOR[r.status]?.rgb || '148,163,184'},0.25)`,
          borderRadius: 6, padding: '2px 8px', fontSize: 10, fontWeight: 700,
        }}>
          {BOOKING_STATUS_COLOR[r.status]?.label || r.status}
        </span>
        {(r.dueAmount ?? 0) > 0 && (
          <span style={{ fontSize: 10, color: '#f87171', fontWeight: 700 }}>
            Due ₹{r.dueAmount.toLocaleString('en-IN')}
          </span>
        )}
      </div>
    </div>
  )
}

function ScanResultCard({ result, onRescan }: { result: ScanResult; onRescan: () => void }) {
  const cfg = VERIFY_STATUS[result.verificationStatus] || VERIFY_STATUS.INVALID
  const r = result.reservation
  const g = result.guest

  return (
    <div style={{
      background: `rgba(${cfg.rgb},0.1)`,
      border: `2px solid rgba(${cfg.rgb},0.35)`,
      borderRadius: 16,
      padding: 20,
      marginBottom: 16,
      animation: 'fadeIn 0.3s ease',
    }}>
      {/* Status Banner */}
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div style={{ color: cfg.color, marginBottom: 8 }}>{cfg.icon}</div>
        <div style={{ fontSize: 18, fontWeight: 900, color: cfg.color, letterSpacing: '0.04em' }}>{cfg.label}</div>
        <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{cfg.desc}</div>
      </div>

      {g && (
        <>
          {/* Guest Info */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 10, color: '#64748b', letterSpacing: '0.08em', marginBottom: 6 }}>GUEST INFORMATION</div>
            <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#f1f5f9', marginBottom: 4 }}>
                {g.firstName} {g.lastName || ''}
              </div>
              {g.mobile && <div style={{ fontSize: 12, color: '#94a3b8' }}><Phone size={11} style={{ display: 'inline', marginRight: 4 }} />{g.mobile}</div>}
              {g.idType && <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{g.idType}: {g.idNumber}</div>}
            </div>
          </div>

          {/* Booking Info */}
          {r && (
            <div>
              <div style={{ fontSize: 10, color: '#64748b', letterSpacing: '0.08em', marginBottom: 6 }}>BOOKING DETAILS</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[
                  ['Booking No', r.bookingNo, <Hash size={11} />],
                  ['Room', r.roomNumber ? `${r.roomNumber}${r.floor ? ` (F${r.floor})` : ''}` : '—', <Bed size={11} />],
                  ['Room Type', r.roomType || '—', <Sparkles size={11} />],
                  ['Check-In', r.checkInTime ? fmtDate(r.checkInTime) : fmtDate(r.arrivalDate), <Calendar size={11} />],
                  ['Check-Out', fmtDate(r.departureDate), <Calendar size={11} />],
                  ['Guests', `${r.adults} Adult${r.adults > 1 ? 's' : ''}${r.children > 0 ? ` + ${r.children} Child` : ''}`, <Users size={11} />],
                  ['Meal Plan', r.mealPlan || 'RO', <Utensils size={11} />],
                  ['Pool', r.poolAccess ? '✓ Yes' : '—', <Waves size={11} />],
                  ['Total', `₹${r.totalAmount?.toLocaleString('en-IN')}`, <CreditCard size={11} />],
                  ['Due', `₹${r.dueAmount?.toLocaleString('en-IN')}`, <CreditCard size={11} />],
                ].map(([l, v, icon]) => (
                  <div key={String(l)} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '8px 10px' }}>
                    <div style={{ fontSize: 9, color: '#475569', display: 'flex', alignItems: 'center', gap: 3, marginBottom: 2 }}>
                      {icon as any} {String(l).toUpperCase()}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0' }}>{String(v)}</div>
                  </div>
                ))}
              </div>
              {r.addOnNotes && (
                <div style={{ marginTop: 8, background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '8px 10px' }}>
                  <div style={{ fontSize: 9, color: '#475569', marginBottom: 2 }}>ADD-ON NOTES</div>
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>{r.addOnNotes}</div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      <button onClick={onRescan} style={{ ...S.btn('ghost'), width: '100%', justifyContent: 'center', marginTop: 16 }}>
        <Camera size={14} /> Scan Another
      </button>
    </div>
  )
}

function hexToRgb(hex: string): string {
  const colorMap: Record<string, string> = {
    '#f87171': '248,113,113',
    '#34d399': '52,211,153',
    '#fbbf24': '251,191,36',
    '#6b7280': '107,114,128',
    '#818cf8': '129,140,248',
  }
  return colorMap[hex] || '148,163,184'
}
