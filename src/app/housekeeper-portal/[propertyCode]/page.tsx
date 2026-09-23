'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { toast, Toaster } from 'sonner'
import { 
  CheckSquare, 
  Square, 
  Trash2, 
  MapPin, 
  PlusCircle, 
  Radio, 
  Clock, 
  Wrench, 
  AlertTriangle, 
  Activity,
  History,
  FileText,
  Bookmark
} from 'lucide-react'
import StaffUpiSettingCard from '@/components/staff/StaffUpiSettingCard'
import ProfilePhotoUploader from '@/components/common/ProfilePhotoUploader'

/* ─── Types ─── */
interface HKUser {
  id: string
  fullName: string
  email: string
  phone?: string | null
  designation?: string | null
  avatarUrl?: string | null
  property?: { id: string; name: string; code: string } | null
  role?: { name: string } | null
}

interface HKRoom {
  id: string
  roomNumber: string
  floor?: string | null
  status: string
  housekeepingStatus: string
  maintenanceStatus?: string | null
  isVIP?: boolean
  roomType: { name: string }
  housekeepingTasks: HKTask[]
  checkIns: { guest: { firstName: string; lastName: string } }[]
}

interface HKTask {
  id: string
  taskType: string
  priority?: string | null
  status: string
  scheduledAt?: string | null
  remarks?: string | null
}

interface MaintTicket {
  id: string
  ticketNo: string
  issueType: string
  priority: string
  description?: string | null
  status: string
  openedAt: string
}

interface LostItem {
  id: string
  item: string
  description: string
  room: string
  foundAt: string
  foundBy: string
  status: 'FOUND' | 'CLAIMED'
}

type HKTab = 'rooms' | 'tasks' | 'lostfound' | 'attendance' | 'supplies' | 'laundry' | 'settings'

/* ─── Status Configs ─── */
const HK_STATUS: Record<string, { label: string; emoji: string; bg: string; color: string; border: string }> = {
  CLEAN:          { label: 'Clean',        emoji: '✅', bg: 'rgba(16,185,129,0.12)', color: '#34d399', border: 'rgba(16,185,129,0.25)' },
  DIRTY:          { label: 'Dirty',        emoji: '🧹', bg: 'rgba(239,68,68,0.12)',  color: '#f87171', border: 'rgba(239,68,68,0.25)'  },
  INSPECTING:     { label: 'Inspecting',   emoji: '🔍', bg: 'rgba(99,102,241,0.12)', color: '#818cf8', border: 'rgba(99,102,241,0.25)' },
  DO_NOT_DISTURB: { label: 'DND',          emoji: '🚫', bg: 'rgba(251,191,36,0.12)', color: '#fbbf24', border: 'rgba(251,191,36,0.25)' },
  OUT_OF_ORDER:   { label: 'Out of Order', emoji: '🔧', bg: 'rgba(107,114,128,0.12)',color: '#9ca3af', border: 'rgba(107,114,128,0.25)' },
}

const ROOM_STATUS: Record<string, { label: string; emoji: string; color: string }> = {
  AVAILABLE:   { label: 'Vacant',      emoji: '⬜', color: '#94a3b8' },
  OCCUPIED:    { label: 'Occupied',    emoji: '🔵', color: '#60a5fa' },
  RESERVED:    { label: 'Reserved',    emoji: '🟡', color: '#fbbf24' },
  MAINTENANCE: { label: 'Maintenance', emoji: '🔧', color: '#f87171' },
  CHECKOUT:    { label: 'Checkout',    emoji: '📤', color: '#a78bfa' },
}

const HK_STATUS_KEYS = ['CLEAN', 'DIRTY', 'INSPECTING', 'DO_NOT_DISTURB', 'OUT_OF_ORDER']

// Standard audit items (used for card progress bar)
const STANDARD_CHECKLIST = [
  'Change bedsheets, pillow covers, and fresh duvet covers',
  'Sanitize bathroom fixtures, toilet, and replace towels',
  'Replenish shampoo, soaps, dental kit, and moisturizers',
  'Vacuum floors, clean mirrors, and dust furniture surfaces',
  'Empty dustbins, put new liners, and spray air freshener',
  'Inspect mini-bar checklist and water bottles'
]

// Simple English cleaning steps shown to staff in checklist modal
const CLEAN_STEPS: { emoji: string; label: string; sublabel: string; color: string; items: string[] }[] = [
  {
    emoji: '🧹', label: 'Swept & Dusted Room', color: '#a78bfa',
    sublabel: 'Floors swept, all surfaces wiped clean',
    items: [
      'Swept / vacuumed entire floor',
      'Wiped all furniture surfaces & shelves',
      'Cleaned mirrors & glass panels',
      'Dusted AC vents & light fixtures',
      'Mopped floor with disinfectant',
    ],
  },
  {
    emoji: '🛏️', label: 'Changed Bed Sheet & Pillows', color: '#60a5fa',
    sublabel: 'Fresh linens & pillow covers replaced',
    items: [
      'Removed used bedsheet & fitted sheet',
      'Placed fresh fitted sheet on mattress',
      'Placed fresh top bedsheet',
      'Replaced all pillow covers with fresh ones',
      'Neatly made the bed & tucked corners',
      'Placed duvet/blanket neatly folded',
    ],
  },
  {
    emoji: '🚿', label: 'Cleaned Bathroom', color: '#34d399',
    sublabel: 'Toilet, sink & floor sanitized; fresh towels placed',
    items: [
      'Scrubbed & sanitized toilet bowl & seat',
      'Cleaned sink, faucet & counter top',
      'Scrubbed & cleaned bathtub / shower area',
      'Mopped bathroom floor with disinfectant',
      'Cleaned mirror & wipe dry',
      'Placed fresh bath towel & hand towel',
      'Replaced floor mat with fresh one',
      'Emptied bathroom trash bin & relined',
    ],
  },
  {
    emoji: '🧴', label: 'Placed Amenities Kit', color: '#fbbf24',
    sublabel: 'Full amenity kit restocked in bathroom',
    items: [
      '🧼 Soap bar (1 pc)',
      '🧴 Shampoo bottle (1 pc)',
      '🧴 Conditioner bottle (1 pc)',
      '🧴 Body wash / shower gel (1 pc)',
      '🪥 Toothbrush + Toothpaste kit (1 set)',
      '💆 Moisturizer / lotion (1 pc)',
      '🧢 Shower cap (1 pc)',
      '🪒 Shaving kit (1 set)',
      '🧻 Toilet paper rolls (2 rolls)',
      '💊 Cotton pads & Q-tips kit',
    ],
  },
  {
    emoji: '🧺', label: 'Collected Laundry Bag', color: '#f87171',
    sublabel: 'Used linen collected & sent for laundry',
    items: [
      'Collected used bedsheets from room',
      'Collected used pillow covers',
      'Collected used bath towels & hand towels',
      'Collected used bath mat / floor mat',
      'Placed all items in laundry bag',
      'Tagged bag with room number & sent to laundry',
    ],
  },
  {
    emoji: '🔍', label: 'Lost Item Check Done', color: '#94a3b8',
    sublabel: 'Full room checked for guest left-behind items',
    items: [
      'Checked under the bed & mattress edges',
      'Checked sofa cushions & gaps',
      'Checked wardrobe shelves & hangers',
      'Checked all drawers & bedside tables',
      'Checked bathroom shelf & behind toilet',
      'No lost items found OR reported to supervisor',
    ],
  },
]

export default function HousekeeperPortalPage({ params }: { params: Promise<{ propertyCode: string }> }) {
  const [propertyCode, setPropertyCode] = useState('')
  useEffect(() => { params.then(p => setPropertyCode(p.propertyCode)) }, [params])

  /* Auth states */
  const [user, setUser] = useState<HKUser | null>(null)
  const [wtToken, setWtToken] = useState('')
  const [sessionChecking, setSessionChecking] = useState(true)

  /* Core Data States */
  const [activeTab, setActiveTab] = useState<HKTab>('rooms')
  const [rooms, setRooms] = useState<HKRoom[]>([])
  const [roomsLoading, setRoomsLoading] = useState(false)
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [selectedFloor, setSelectedFloor] = useState('ALL')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRoom, setSelectedRoom] = useState<HKRoom | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  /* Attendance states */
  const [attendance, setAttendance] = useState<any[]>([])
  const [attLoading, setAttLoading] = useState(false)
  const [clockedIn, setClockedIn] = useState(false)

  /* Room checklist audits state */
  const [roomChecklist, setRoomChecklist] = useState<Record<string, boolean[]>>({})

  /* Quick cleaning checklist modal */
  const [checklistRoom, setChecklistRoom] = useState<HKRoom | null>(null)
  const [checklistTicks, setChecklistTicks] = useState<boolean[]>(Array(CLEAN_STEPS.length).fill(false))
  const [checklistStep, setChecklistStep] = useState(0)
  // Per-item status inside each wizard step: stepIdx -> itemIdx -> 'CHANGED'|'ALREADY_OK'|null
  const [itemStatuses, setItemStatuses] = useState<Record<number, Record<number, 'CHANGED' | 'ALREADY_OK' | null>>>({})

  const getItemStatus = (stepIdx: number, itemIdx: number): 'CHANGED' | 'ALREADY_OK' | null =>
    itemStatuses[stepIdx]?.[itemIdx] ?? null

  const toggleItemStatus = (stepIdx: number, itemIdx: number) => {
    const cur = getItemStatus(stepIdx, itemIdx)
    const next = cur === null ? 'CHANGED' : cur === 'CHANGED' ? 'ALREADY_OK' : null
    setItemStatuses(prev => ({
      ...prev,
      [stepIdx]: { ...(prev[stepIdx] || {}), [itemIdx]: next },
    }))
  }

  /* Cleaning stopwatch / clean timer */
  const [activeTimerRoomId, setActiveTimerRoomId] = useState<string | null>(null)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  /* Maintenance ticket reporter */
  const [submittingMaint, setSubmittingMaint] = useState(false)
  const [maintIssueType, setMaintIssueType] = useState('ELECTRICAL')
  const [maintPriority, setMaintPriority] = useState('MEDIUM')
  const [maintDesc, setMaintDesc] = useState('')
  const [activeMaintTickets, setActiveMaintTickets] = useState<MaintTicket[]>([])

  /* Lost and Found State */
  const [lostItems, setLostItems] = useState<LostItem[]>([])
  const [lostItemName, setLostItemName] = useState('')
  const [lostItemDesc, setLostItemDesc] = useState('')
  const [lostItemRoom, setLostItemRoom] = useState('')

  /* Supply Restock Request State */
  const SUPPLY_ITEMS = [
    'Bed Sheets (Single)', 'Bed Sheets (Double)', 'Pillow Covers', 'Bath Towels',
    'Hand Towels', 'Floor Mats', 'Shampoo Bottles', 'Conditioner Bottles',
    'Body Wash', 'Soap Bars', 'Toilet Paper Rolls', 'Tissue Boxes',
    'Toothbrush Kits', 'Shower Caps', 'Slippers (Pairs)', 'Room Freshener',
    'Laundry Bags', 'Do Not Disturb Signs', 'Trash Bags (Small)', 'Trash Bags (Large)',
  ]
  const [suppliesRequest, setSuppliesRequest] = useState<Record<string, number>>(
    Object.fromEntries(SUPPLY_ITEMS.map(item => [item, 0]))
  )

  /* Network and voice recognition state */
  const [isOnline, setIsOnline] = useState(true)
  const [isVoiceListening, setIsVoiceListening] = useState(false)

  /* ── Inventory / Room Items state ── */
  interface StockItemRecord {
    id: string
    name: string
    unit?: string | null
    currentStock: number
    itemType: string
  }
  const [stockItems, setStockItems] = useState<StockItemRecord[]>([])
  const [stockItemsLoading, setStockItemsLoading] = useState(false)
  const [roomItemCounters, setRoomItemCounters] = useState<Record<string, number>>({})
  const [submittingRoomItems, setSubmittingRoomItems] = useState(false)
  const [cleanReplenishRoom, setCleanReplenishRoom] = useState<HKRoom | null>(null)
  const [completionTab, setCompletionTab] = useState<'items' | 'laundry'>('items')

  /* ── Laundry state ── */
  const [laundryCounters, setLaundryCounters] = useState<Record<string, number>>({})
  const [laundryLogs, setLaundryLogs] = useState<any[]>([])
  const [laundryLogsLoading, setLaundryLogsLoading] = useState(false)
  const [submittingLaundry, setSubmittingLaundry] = useState(false)
  const [laundryRoom, setLaundryRoom] = useState('')
  const [laundryModalRoom, setLaundryModalRoom] = useState<HKRoom | null>(null)

  // Play a satisfying synthesized chime on successful operations
  const playSuccessChime = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
      const osc1 = audioCtx.createOscillator()
      const osc2 = audioCtx.createOscillator()
      const gainNode = audioCtx.createGain()

      osc1.connect(gainNode)
      osc2.connect(gainNode)
      gainNode.connect(audioCtx.destination)

      osc1.type = 'sine'
      osc1.frequency.setValueAtTime(523.25, audioCtx.currentTime) // C5
      osc1.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.1) // E5

      osc2.type = 'sine'
      osc2.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.1) // G5
      osc2.frequency.setValueAtTime(1046.50, audioCtx.currentTime + 0.2) // C6

      gainNode.gain.setValueAtTime(0, audioCtx.currentTime)
      gainNode.gain.linearRampToValueAtTime(0.12, audioCtx.currentTime + 0.05)
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5)

      osc1.start()
      osc2.start()
      osc1.stop(audioCtx.currentTime + 0.5)
      osc2.stop(audioCtx.currentTime + 0.5)
    } catch { }
  }

  // Web Speech API Voice Recognition Helper
  const startVoiceRecognition = (onTranscript: (text: string) => void) => {
    if (typeof window === 'undefined') return
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      toast.error('Voice input is not supported in this browser. Please use Chrome/Safari.')
      return
    }
    const recognition = new SpeechRecognition()
    recognition.lang = 'en-IN'
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    recognition.onstart = () => {
      setIsVoiceListening(true)
      toast.info('Listening... Speak now 🎙️')
    }
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      onTranscript(transcript)
      toast.success(`Voice Recognized: "${transcript}"`)
    }
    recognition.onerror = () => {
      toast.error('Voice recognition failed. Try again.')
    }
    recognition.onend = () => {
      setIsVoiceListening(false)
    }
    recognition.start()
  }

  /* Session restore & auto-login from main session */
  useEffect(() => {
    const initSession = async () => {
      // 1. Try local hk_portal_session first
      const savedSession = localStorage.getItem('hk_portal_session')
      if (savedSession) {
        try {
          const { user: u, wtToken: t } = JSON.parse(savedSession)
          if (u && t) {
            setUser(u)
            setWtToken(t)
            setSessionChecking(false)
            return
          }
        } catch {
          localStorage.removeItem('hk_portal_session')
        }
      }

      // 2. Auto-login using main auth session cookie if user just came from /login
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
              if (wtData.user && wtData.wtToken) {
                setUser(wtData.user)
                setWtToken(wtData.wtToken)
                localStorage.setItem('hk_portal_session', JSON.stringify({ user: wtData.user, wtToken: wtData.wtToken }))
                setSessionChecking(false)
                return
              }
            }
          }
        }
      } catch (err) {
        console.error('[HK Portal Session Init Error]', err)
      }

      setSessionChecking(false)
    }

    initSession()

    // Restore lost items
    const savedLost = localStorage.getItem('hk_lost_items')
    if (savedLost) {
      try { setLostItems(JSON.parse(savedLost)) } catch { }
    }

    // Network status listeners
    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine)
      const handleOnline = () => {
        setIsOnline(true)
        toast.success('Internet connection restored! Syncing data... 📶')
      }
      const handleOffline = () => {
        setIsOnline(false)
        toast.warning('Network disconnected. Auto-saving offline... ⚠️')
      }
      window.addEventListener('online', handleOnline)
      window.addEventListener('offline', handleOffline)
      return () => {
        window.removeEventListener('online', handleOnline)
        window.removeEventListener('offline', handleOffline)
      }
    }
  }, [propertyCode])

  /* Handle Logout */
  const handleLogout = async () => {
    setUser(null); setWtToken(''); setRooms([])
    localStorage.removeItem('hk_portal_session')
    await Promise.allSettled([
      fetch('/api/auth/staff-logout', { method: 'POST' }),
      fetch('/api/auth/logout', { method: 'POST' }),
    ])
    window.location.href = '/login'
  }

  /* Fetch rooms */
  const fetchRooms = useCallback(async () => {
    if (!wtToken) return
    setRoomsLoading(true)
    try {
      const res = await fetch('/api/housekeeping-rooms', {
        headers: { Authorization: `Bearer ${wtToken}` },
      })
      const data = await res.json()
      if (data.success) {
        setRooms(data.data)
      }
    } catch { toast.error('Failed to load rooms') }
    finally { setRoomsLoading(true); setRoomsLoading(false) }
  }, [wtToken])

  useEffect(() => {
    if (user && wtToken && activeTab === 'rooms') {
      fetchRooms()
      const iv = setInterval(fetchRooms, 30000)
      return () => clearInterval(iv)
    }
  }, [user, wtToken, activeTab, fetchRooms])

  /* Fetch attendance */
  const fetchAttendance = useCallback(async () => {
    if (!wtToken) return
    setAttLoading(true)
    try {
      const res = await fetch('/api/staff-attendance', {
        headers: { Authorization: `Bearer ${wtToken}` },
      })
      const data = await res.json()
      if (data.success) {
        setAttendance(data.data || [])
        const today = new Date().toISOString().split('T')[0]
        const todayRec = (data.data || []).find((r: any) => r.date?.startsWith(today) || r.clockIn?.startsWith(today))
        setClockedIn(!!(todayRec?.clockIn && !todayRec?.clockOut))
      }
    } catch { }
    finally { setAttLoading(false) }
  }, [wtToken])

  /* ── Auto Clock-In on Location / Portal Access ── */
  const autoClockIn = useCallback(async () => {
    if (!wtToken || !user) return
    try {
      let locationStr = 'Hotel Location (Geofenced)'
      if (typeof window !== 'undefined' && 'geolocation' in navigator) {
        try {
          locationStr = await new Promise<string>((resolve) => {
            navigator.geolocation.getCurrentPosition(
              (pos) => resolve(`${pos.coords.latitude.toFixed(6)},${pos.coords.longitude.toFixed(6)}`),
              () => resolve('Hotel Location (Geofenced)'),
              { timeout: 2500 }
            );
          });
        } catch {}
      }

      const res = await fetch('/api/staff-attendance/clock-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${wtToken}` },
        body: JSON.stringify({ auto: true, location: locationStr }),
      })

      const data = await res.json()
      if (res.ok && data.success) {
        if (data.data?.alreadyClockedIn === false) {
          toast.success('🟢 Auto Clocked-In for Duty (Hotel Geofenced)')
          playSuccessChime()
        }
        setClockedIn(true)
        fetchAttendance()
      }
    } catch {}
  }, [wtToken, user, fetchAttendance])

  useEffect(() => {
    if (user && wtToken) {
      fetchAttendance()
      autoClockIn()
    }
  }, [user, wtToken, fetchAttendance, autoClockIn])

  /* Room status update */
  const updateHKStatus = async (roomId: string, housekeepingStatus: string) => {
    setUpdatingId(roomId)
    try {
      await fetch('/api/housekeeping-rooms', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${wtToken}` },
        body: JSON.stringify({ roomId, housekeepingStatus }),
      })
      const targetRoom = rooms.find(r => r.id === roomId)
      setRooms(prev => prev.map(r => r.id === roomId ? { ...r, housekeepingStatus } : r))
      if (selectedRoom?.id === roomId) {
        setSelectedRoom(prev => prev ? { ...prev, housekeepingStatus } : null)
      }
      toast.success(`Room status marked as ${housekeepingStatus}`)
      playSuccessChime()
      
      // Stop stopwatch if marked clean
      if (housekeepingStatus === 'CLEAN' && activeTimerRoomId === roomId) {
        stopStopwatch()
      }
      // (Replenishment modal removed — handled via step wizard)
    } catch { toast.error('Update failed') }
    finally { setUpdatingId(null) }
  }

  /* Task Status */
  const updateTask = async (taskId: string, roomId: string, taskStatus: string) => {
    try {
      await fetch('/api/housekeeping-rooms', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${wtToken}` },
        body: JSON.stringify({ taskId, taskStatus }),
      })
      const filterFn = (t: HKTask) => taskStatus === 'COMPLETED' ? t.id !== taskId : true
      const updateFn = (t: HKTask) => t.id === taskId ? { ...t, status: taskStatus } : t
      setRooms(prev => prev.map(r => r.id !== roomId ? r : {
        ...r, housekeepingTasks: r.housekeepingTasks.map(updateFn).filter(filterFn)
      }))
      if (selectedRoom?.id === roomId) {
        setSelectedRoom(prev => prev ? {
          ...prev, housekeepingTasks: prev.housekeepingTasks.map(updateFn).filter(filterFn)
        } : null)
      }

      if (taskStatus === 'IN_PROGRESS') {
        startStopwatch(roomId)
        toast.info('Cleaning stopwatch started!')
      } else if (taskStatus === 'COMPLETED') {
        toast.success('Task completed!')
        playSuccessChime()
      }
    } catch { toast.error('Failed to update task') }
  }

  /* Stopwatch Controls */
  const startStopwatch = (roomId: string) => {
    if (timerRef.current) clearInterval(timerRef.current)
    setActiveTimerRoomId(roomId)
    setElapsedSeconds(0)
    timerRef.current = setInterval(() => {
      setElapsedSeconds(prev => prev + 1)
    }, 1000)
  }

  const stopStopwatch = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = null
    setActiveTimerRoomId(null)
    setElapsedSeconds(0)
  }

  const formatElapsedTime = (sec: number) => {
    const m = Math.floor(sec / 60)
    const s = sec % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  /* Checkbox toggler for room checklist audit */
  const toggleChecklistItem = (roomId: string, index: number) => {
    const list = roomChecklist[roomId] || new Array(STANDARD_CHECKLIST.length).fill(false)
    const updated = [...list]
    updated[index] = !updated[index]
    setRoomChecklist({ ...roomChecklist, [roomId]: updated })
  }

  /* Raising a maintenance ticket to the DB */
  const submitMaintenanceTicket = async (roomId: string) => {
    if (!maintIssueType || !maintPriority) {
      toast.error('Please enter details.')
      return
    }
    setSubmittingMaint(true)
    try {
      const res = await fetch('/api/hotel/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${wtToken}` },
        body: JSON.stringify({ roomId, issueType: maintIssueType, priority: maintPriority, description: maintDesc }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(`Maintenance ticket raised: ${data.data?.ticketNo || 'Submitted'}`)
        playSuccessChime()
        setMaintDesc('')
        // Append locally to display tickets
        const newTick: MaintTicket = {
          id: data.data?.id || Math.random().toString(),
          ticketNo: data.data?.ticketNo || 'MNT-NEW',
          issueType: maintIssueType,
          priority: maintPriority,
          description: maintDesc,
          status: 'OPEN',
          openedAt: new Date().toISOString()
        }
        setActiveMaintTickets([newTick, ...activeMaintTickets])
      } else {
        toast.error(data.message || 'Submission failed')
      }
    } catch { toast.error('Failed to submit ticket') }
    finally { setSubmittingMaint(false) }
  }

  /* Fetch lost items from backend API */
  const fetchLostItems = useCallback(async () => {
    try {
      const url = propertyCode ? `/api/hotel/lost-found?propertyCode=${propertyCode}` : '/api/hotel/lost-found'
      const headers: any = {}
      if (wtToken) headers.Authorization = `Bearer ${wtToken}`
      const res = await fetch(url, { headers })
      const data = await res.json()
      if (data.success && Array.isArray(data.data)) {
        const formatted: LostItem[] = data.data.map((i: any) => ({
          id: i.id,
          item: i.item,
          description: i.description || '',
          room: i.room || 'N/A',
          foundAt: i.foundAt ? new Date(i.foundAt).toLocaleString('en-IN') : '',
          foundBy: i.foundBy || 'Housekeeper',
          status: (i.status === 'CLAIMED' ? 'CLAIMED' : 'FOUND') as 'FOUND' | 'CLAIMED'
        }))
        setLostItems(formatted)
        localStorage.setItem('hk_lost_items', JSON.stringify(formatted))
      }
    } catch {
      const savedLost = localStorage.getItem('hk_lost_items')
      if (savedLost) {
        try { setLostItems(JSON.parse(savedLost)) } catch { }
      }
    }
  }, [propertyCode, wtToken])

  useEffect(() => {
    if (activeTab === 'lostfound') {
      fetchLostItems()
    }
  }, [activeTab, fetchLostItems])

  /* Lost and Found logger */
  const handleLogLostItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!lostItemName || !lostItemRoom) {
      toast.error('Item name and room number are required')
      return
    }
    
    const newItem: LostItem = {
      id: Math.random().toString(),
      item: lostItemName,
      description: lostItemDesc,
      room: lostItemRoom,
      foundAt: new Date().toLocaleString('en-IN'),
      foundBy: user?.fullName || 'Housekeeper',
      status: 'FOUND'
    }

    try {
      const headers: any = { 'Content-Type': 'application/json' }
      if (wtToken) headers.Authorization = `Bearer ${wtToken}`
      
      const res = await fetch('/api/hotel/lost-found', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          propertyCode,
          propertyId: user?.property?.id,
          item: lostItemName,
          description: lostItemDesc,
          room: lostItemRoom,
          foundBy: user?.fullName || 'Housekeeper',
        })
      })
      const data = await res.json()
      if (res.ok && data.success) {
        toast.success('Found item registered in system!')
        playSuccessChime()
        setLostItemName(''); setLostItemDesc(''); setLostItemRoom('')
        fetchLostItems()
      } else {
        const updated = [newItem, ...lostItems]
        setLostItems(updated)
        localStorage.setItem('hk_lost_items', JSON.stringify(updated))
        setLostItemName(''); setLostItemDesc(''); setLostItemRoom('')
        toast.success('Saved to local lost & found!')
      }
    } catch {
      const updated = [newItem, ...lostItems]
      setLostItems(updated)
      localStorage.setItem('hk_lost_items', JSON.stringify(updated))
      setLostItemName(''); setLostItemDesc(''); setLostItemRoom('')
      toast.warning('Network offline: Saved locally!')
    }
  }

  const deleteLostItem = async (id: string) => {
    try {
      const headers: any = {}
      if (wtToken) headers.Authorization = `Bearer ${wtToken}`
      await fetch(`/api/hotel/lost-found?id=${id}`, { method: 'DELETE', headers })
      toast.success('Item deleted')
      fetchLostItems()
    } catch {
      const updated = lostItems.filter(i => i.id !== id)
      setLostItems(updated)
      localStorage.setItem('hk_lost_items', JSON.stringify(updated))
    }
  }

  /* ── Inventory: Fetch stock items from server ── */
  const fetchStockItems = useCallback(async () => {
    if (!user?.property?.id) return
    setStockItemsLoading(true)
    try {
      const res = await fetch(`/api/inventory/stock-items?propertyId=${user.property.id}`, {
        headers: { Authorization: `Bearer ${wtToken}` },
      })
      if (res.ok) {
        const data = await res.json()
        setStockItems(data.data || data || [])
        // Reset counters when items load
        setRoomItemCounters({})
        setLaundryCounters({})
      }
    } catch { /* silent */ }
    finally { setStockItemsLoading(false) }
  }, [user, wtToken])

  /* ── Inventory: Seed default stock items ── */
  const seedStockItems = async () => {
    if (!user?.property?.id) return
    setStockItemsLoading(true)
    try {
      const res = await fetch('/api/inventory/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${wtToken}` },
        body: JSON.stringify({ propertyId: user.property.id })
      })
      if (res.ok) {
        toast.success('✨ Default housekeeping inventory items added!')
        playSuccessChime()
        fetchStockItems()
      } else {
        toast.error('Failed to seed inventory')
      }
    } catch { toast.error('Error seeding inventory') }
    finally { setStockItemsLoading(false) }
  }

  /* ── Inventory: Submit items placed in a room ── */
  const submitRoomItems = async (room: HKRoom) => {
    const itemsToSubmit = Object.entries(roomItemCounters)
      .filter(([, qty]) => qty > 0)
      .map(([stockItemId, qty]) => ({ stockItemId, qty }))

    if (itemsToSubmit.length === 0) {
      toast.error('Add at least one item to log')
      return
    }

    setSubmittingRoomItems(true)
    try {
      const res = await fetch('/api/housekeeper/room-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${wtToken}` },
        body: JSON.stringify({
          propertyId: user?.property?.id,
          roomId: room.id,
          roomNumber: room.roomNumber,
          items: itemsToSubmit,
          staffName: user?.fullName,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        const count = data.data?.length || itemsToSubmit.length
        toast.success(`✅ ${count} item(s) placed in Room ${room.roomNumber} — inventory updated!`)
        playSuccessChime()
        setRoomItemCounters({})
        setCleanReplenishRoom(null) // Close replenishment modal if open
        fetchStockItems() // Refresh balances
      } else {
        const err = await res.json()
        toast.error(err.message || 'Failed to log room items')
      }
    } catch { toast.error('Network error logging room items') }
    finally { setSubmittingRoomItems(false) }
  }

  /* ── Combined Room Completion: Submit room items & laundry together ── */
  const submitRoomCompletion = async (room: HKRoom) => {
    const roomItemsToSubmit = Object.entries(roomItemCounters)
      .filter(([, qty]) => qty > 0)
      .map(([stockItemId, qty]) => ({ stockItemId, qty }))

    const laundryItemsToSubmit = Object.entries(laundryCounters)
      .filter(([, qty]) => qty > 0)
      .map(([stockItemId, qty]) => ({ stockItemId, qty }))

    if (roomItemsToSubmit.length === 0 && laundryItemsToSubmit.length === 0) {
      toast.error('Please select items placed or laundry collected')
      return
    }

    setSubmittingRoomItems(true)
    try {
      const loggedStr = []

      if (roomItemsToSubmit.length > 0) {
        await fetch('/api/housekeeper/room-items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${wtToken}` },
          body: JSON.stringify({
            propertyId: user?.property?.id,
            roomId: room.id,
            roomNumber: room.roomNumber,
            items: roomItemsToSubmit,
            staffName: user?.fullName,
          }),
        })
        loggedStr.push(`${roomItemsToSubmit.length} room item(s)`)
      }

      if (laundryItemsToSubmit.length > 0) {
        await fetch('/api/housekeeper/laundry', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${wtToken}` },
          body: JSON.stringify({
            propertyId: user?.property?.id,
            roomId: room.id,
            roomNumber: room.roomNumber,
            items: laundryItemsToSubmit,
            staffName: user?.fullName,
          }),
        })
        const totalQty = laundryItemsToSubmit.reduce((sum, i) => sum + i.qty, 0)
        const guestName = room.checkIns?.[0]?.guest ? `${room.checkIns[0].guest.firstName} ${room.checkIns[0].guest.lastName}` : 'In-House Guest'
        await fetch('/api/hotel/laundry', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${wtToken}` },
          body: JSON.stringify({
            propertyCode,
            propertyId: user?.property?.id,
            roomNumber: room.roomNumber,
            guestName,
            itemsCount: totalQty,
            amount: totalQty * 150,
            status: 'COLLECTED',
            collectedBy: user?.fullName || 'Housekeeper',
          }),
        }).catch(() => {})
        loggedStr.push(`${laundryItemsToSubmit.length} laundry item(s)`)
      }

      toast.success(`✅ Room ${room.roomNumber} logged: ${loggedStr.join(' & ')}!`)
      playSuccessChime()
      setRoomItemCounters({})
      setLaundryCounters({})
      setCleanReplenishRoom(null)
      fetchStockItems()
    } catch { toast.error('Error saving room log') }
    finally { setSubmittingRoomItems(false) }
  }

  /* ── Laundry: Fetch today's laundry logs ── */
  const fetchLaundryLogs = useCallback(async () => {
    if (!user?.property?.id) return
    setLaundryLogsLoading(true)
    try {
      const res = await fetch(`/api/housekeeper/laundry?propertyId=${user.property.id}`, {
        headers: { Authorization: `Bearer ${wtToken}` },
      })
      if (res.ok) {
        const data = await res.json()
        setLaundryLogs(data.data || data || [])
      }
    } catch { /* silent */ }
    finally { setLaundryLogsLoading(false) }
  }, [user, wtToken])

  /* ── Laundry: Submit laundry pickup ── */
  const submitLaundry = async (targetRoom?: HKRoom) => {
    const room = targetRoom || rooms.find(r => r.id === laundryRoom)
    if (!room) {
      toast.error('Please select a room for laundry pickup')
      return
    }
    const itemsToSubmit = Object.entries(laundryCounters)
      .filter(([, qty]) => qty > 0)
      .map(([stockItemId, qty]) => ({ stockItemId, qty }))

    if (itemsToSubmit.length === 0) {
      toast.error('Add at least one laundry item')
      return
    }

    setSubmittingLaundry(true)
    try {
      const res = await fetch('/api/housekeeper/laundry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${wtToken}` },
        body: JSON.stringify({
          propertyId: user?.property?.id,
          roomId: room.id,
          roomNumber: room.roomNumber,
          items: itemsToSubmit,
          staffName: user?.fullName,
        }),
      })

      const totalQty = itemsToSubmit.reduce((sum, i) => sum + i.qty, 0)
      const guestName = room.checkIns?.[0]?.guest ? `${room.checkIns[0].guest.firstName} ${room.checkIns[0].guest.lastName}` : 'In-House Guest'
      await fetch('/api/hotel/laundry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${wtToken}` },
        body: JSON.stringify({
          propertyCode,
          propertyId: user?.property?.id,
          roomNumber: room.roomNumber,
          guestName,
          itemsCount: totalQty,
          amount: totalQty * 150,
          status: 'COLLECTED',
          collectedBy: user?.fullName || 'Housekeeper',
        }),
      }).catch(() => {})

      if (res.ok) {
        toast.success(`🧺 Laundry pickup logged for Room ${room.roomNumber}!`)
        playSuccessChime()
        setLaundryCounters({})
        setLaundryRoom('')
        setLaundryModalRoom(null) // Close room laundry modal if open
        fetchLaundryLogs()
        fetchStockItems()
      } else {
        const err = await res.json()
        toast.error(err.message || 'Failed to log laundry')
      }
    } catch { toast.error('Network error logging laundry') }
    finally { setSubmittingLaundry(false) }
  }

  // Load stock items when opening rooms/supplies tab
  useEffect(() => {
    if (user && wtToken && (activeTab === 'supplies' || activeTab === 'rooms')) fetchStockItems()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, wtToken, activeTab])

  // Load stock + laundry logs when opening laundry tab
  useEffect(() => {
    if (user && wtToken && activeTab === 'laundry') {
      fetchStockItems()
      fetchLaundryLogs()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, wtToken, activeTab])

  /* Pre-configured TTS speech alerts for quick Walkie Talkie announcement */
  const triggerTTSAlert = (messageText: string) => {
    if (typeof window === 'undefined') return
    // Trigger walkie talkie sound beep
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const osc = audioCtx.createOscillator()
    const gain = audioCtx.createGain()
    osc.connect(gain)
    gain.connect(audioCtx.destination)
    osc.type = 'sine'
    osc.frequency.setValueAtTime(800, audioCtx.currentTime)
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime)
    osc.start()
    osc.stop(audioCtx.currentTime + 0.15)

    // Trigger text-to-speech
    setTimeout(() => {
      const utterance = new SpeechSynthesisUtterance(messageText)
      utterance.rate = 1.0
      utterance.pitch = 1.1
      window.speechSynthesis.speak(utterance)
      toast.info(`Broadcasted: "${messageText}"`)
    }, 180)
  }

  /* Filtering */
  const floors = ['ALL', ...Array.from(new Set(rooms.map(r => r.floor).filter(Boolean))).sort()]

  const filteredRooms = rooms.filter(r => {
    const matchS = filterStatus === 'ALL' || r.housekeepingStatus === filterStatus
    const matchF = selectedFloor === 'ALL' || (r.floor || '') === selectedFloor
    const matchQ = !searchTerm || r.roomNumber.includes(searchTerm) || (r.floor || '').toLowerCase().includes(searchTerm.toLowerCase())
    return matchS && matchF && matchQ
  })

  const allTasks = rooms.flatMap(r => r.housekeepingTasks.map(t => ({ ...t, roomNumber: r.roomNumber, roomId: r.id })))
  const stats = {
    clean: rooms.filter(r => r.housekeepingStatus === 'CLEAN').length,
    dirty: rooms.filter(r => r.housekeepingStatus === 'DIRTY').length,
    inspecting: rooms.filter(r => r.housekeepingStatus === 'INSPECTING').length,
    tasks: allTasks.length,
  }

  const propName = user?.property?.name || propertyCode?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Hotel'

  /* ══════════ SESSION LOADING ══════════ */
  if (sessionChecking) {
    return (
      <div style={{ minHeight: '100dvh', background: '#060810', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '"Inter",-apple-system,sans-serif', color: '#64748b', fontSize: 13 }}>
        <div style={{ width: 22, height: 22, borderRadius: '50%', border: '2.5px solid #6366f1', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite', marginRight: 10 }} />
        Checking session status…
      </div>
    )
  }

  /* ══════════ REDIRECT IF NOT LOGGED IN ══════════ */
  if (!user) {
    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
    return (
      <div style={{ minHeight: '100dvh', background: '#060810', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '"Inter",-apple-system,sans-serif', color: '#64748b', fontSize: 13 }}>
        Redirecting to login screen…
      </div>
    )
  }

  const tabs: { key: HKTab; label: string; emoji: string }[] = [
    { key: 'rooms', label: 'Rooms', emoji: '🏨' },
    { key: 'tasks', label: 'Tasks', emoji: '📋' },
    { key: 'lostfound', label: 'Lost', emoji: '💼' },
    { key: 'attendance', label: 'Attend', emoji: '📅' },
    { key: 'supplies', label: 'Stock', emoji: '📦' },
    { key: 'laundry', label: 'Laundry', emoji: '🧺' },
    { key: 'settings', label: 'Settings', emoji: '⚙️' },
  ]

  return (
    <div style={{ height: '100dvh', minHeight: '-webkit-fill-available', maxWidth: 540, margin: '0 auto', background: '#06070c', fontFamily: '"Outfit","Inter",-apple-system,sans-serif', color: '#f1f5f9', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
      <Toaster richColors position="top-center" theme="dark" />

      {/* ─── HEADER (Glassmorphic Premium & Notch Safe) ─── */}
      <header style={{ flexShrink: 0, padding: 'calc(10px + env(safe-area-inset-top, 0px)) 12px 10px', background: 'linear-gradient(135deg, rgba(124,58,237,0.08) 0%, rgba(6,7,12,0.95) 100%)', borderBottom: '1px solid rgba(124,58,237,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, backdropFilter: 'blur(24px)', boxShadow: '0 4px 24px rgba(0,0,0,0.4)', zIndex: 30 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0, flex: 1 }}>
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.fullName}
              style={{ width: 36, height: 36, borderRadius: 12, objectFit: 'cover', border: '2px solid rgba(124,58,237,0.5)', flexShrink: 0, boxShadow: '0 0 12px rgba(124,58,237,0.25)' }} />
          ) : (
            <div style={{ width: 36, height: 36, borderRadius: 12, background: 'linear-gradient(135deg,#7c3aed,#db2777)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, boxShadow: '0 0 20px rgba(124,58,237,0.4)', flexShrink: 0 }}>🧹</div>
          )}
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.2, color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{propName}</div>
            <div style={{ fontSize: 9.5, color: '#a78bfa', fontWeight: 700, marginTop: 2, letterSpacing: '0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user.fullName} · Housekeeper
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: isOnline ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${isOnline ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`, borderRadius: 20, padding: '3px 8px', fontSize: 8.5, fontWeight: 800, color: isOnline ? '#34d399' : '#f87171' }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: isOnline ? '#34d399' : '#f87171', boxShadow: isOnline ? '0 0 6px #34d399' : '0 0 6px #f87171' }} />
            {isOnline ? 'LIVE' : 'OFF'}
          </div>
          <button onClick={handleLogout} title="Sign Out" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '6px 10px', cursor: 'pointer', color: '#f87171', fontSize: 11, fontWeight: 800, fontFamily: 'inherit' }}>
            ⏻
          </button>
        </div>
      </header>

      {/* ─── LIVE RUNNING TIMER FLOATING BANNER ─── */}
      {activeTimerRoomId && (
        <div style={{ flexShrink: 0, background: 'linear-gradient(90deg,#047857,#065f46)', padding: '6px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, borderBottom: '1px solid rgba(52,211,153,0.25)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, flex: 1 }}>
            <span className="animate-pulse" style={{ fontSize: 10, flexShrink: 0 }}>🟢</span>
            <span style={{ fontSize: 9.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Active: Room #{rooms.find(r=>r.id===activeTimerRoomId)?.roomNumber}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <span style={{ fontSize: 11, fontFamily: 'monospace', fontWeight: 900, background: 'rgba(0,0,0,0.25)', padding: '2px 6px', borderRadius: 5 }}>{formatElapsedTime(elapsedSeconds)}</span>
            <button onClick={stopStopwatch} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 4, padding: '2px 6px', color: '#fff', fontSize: 9, fontWeight: 900, cursor: 'pointer' }}>STOP</button>
          </div>
        </div>
      )}

      {/* ─── VIEWPORT MAIN CONTENT ─── */}
      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', overscrollBehaviorY: 'contain' }}>

        {/* ══ ROOMS GRID TAB ══ */}
        {activeTab === 'rooms' && (
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
            {/* Sticky Filters Block */}
            <div style={{ padding: '10px 10px 0', background: 'rgba(6,7,12,0.98)', position: 'sticky', top: 0, zIndex: 10, backdropFilter: 'blur(20px)' }}>
              {/* Premium Stats Bar */}
              <div style={{ display: 'flex', gap: 5, marginBottom: 8 }}>
                {[
                  { label: 'Clean', val: stats.clean, color: '#34d399', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.2)', icon: '✅' },
                  { label: 'Dirty', val: stats.dirty, color: '#f87171', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.2)', icon: '🧹' },
                  { label: 'Inspect', val: stats.inspecting, color: '#818cf8', bg: 'rgba(99,102,241,0.1)', border: 'rgba(99,102,241,0.2)', icon: '🔍' },
                  { label: 'Tasks', val: stats.tasks, color: '#fbbf24', bg: 'rgba(251,191,36,0.1)', border: 'rgba(251,191,36,0.2)', icon: '📋' },
                ].map(s => (
                  <div key={s.label} style={{ flex: 1, minWidth: 0, background: s.bg, border: `1px solid ${s.border}`, borderRadius: 10, padding: '6px 2px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ fontSize: 9, marginBottom: 1 }}>{s.icon}</div>
                    <div style={{ fontSize: 17, fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.val}</div>
                    <div style={{ fontSize: 7, color: s.color, opacity: 0.8, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.02em', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.label}</div>
                    {s.val > 0 && s.label === 'Dirty' && <div style={{ position: 'absolute', top: 3, right: 3, width: 5, height: 5, borderRadius: '50%', background: s.color, animation: 'pulse 1.5s infinite' }} />}
                  </div>
                ))}
              </div>

              {/* Advanced Search bar */}
              <div style={{ position: 'relative', marginBottom: 8 }}>
                <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                  placeholder="🔍  Search room number or floor…"
                  style={{ width: '100%', padding: '8px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, color: '#f1f5f9', fontSize: 11.5, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
              </div>

              {/* Floor Segment Filter Bar */}
              {floors.length > 2 && (
                <div style={{ display: 'flex', gap: 5, overflowX: 'auto', marginBottom: 8, scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch', paddingBottom: 2 }}>
                  {floors.map(fl => {
                    const isFActive = selectedFloor === fl
                    return (
                      <button key={fl} onClick={() => setSelectedFloor(fl ?? 'ALL')}
                        style={{ flexShrink: 0, padding: '4px 9px', borderRadius: 8, fontSize: 8.5, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', border: isFActive ? '1px solid rgba(124,58,237,0.4)' : '1px solid rgba(255,255,255,0.05)', background: isFActive ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.02)', color: isFActive ? '#c084fc' : '#64748b', textTransform: 'uppercase', letterSpacing: '0.02em', whiteSpace: 'nowrap' }}>
                        🏢 {fl === 'ALL' ? 'All Floors' : `Floor ${fl}`}
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Horizontal filter scroll chips */}
              <div style={{ display: 'flex', gap: 5, overflowX: 'auto', paddingBottom: 8, scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
                {['ALL', ...HK_STATUS_KEYS].map(s => {
                  const cfg = HK_STATUS[s]
                  const isActive = filterStatus === s
                  return (
                    <button key={s} onClick={() => setFilterStatus(s)}
                      style={{ flexShrink: 0, padding: '4px 10px', borderRadius: 999, fontSize: 9.5, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', border: isActive ? `1.5px solid ${cfg?.color || '#6366f1'}` : '1.5px solid rgba(255,255,255,0.06)', background: isActive ? (cfg ? cfg.bg : 'rgba(124,58,237,0.15)') : 'rgba(255,255,255,0.02)', color: isActive ? (cfg?.color || '#a78bfa') : '#64748b', transition: 'all 0.15s', whiteSpace: 'nowrap' }}>
                      {cfg?.emoji} {cfg?.label || 'All Rooms'}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Room lists cards */}
            {roomsLoading ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, color: '#64748b', fontSize: 12, padding: '40px 0' }}>
                <div style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid #a78bfa', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
                Loading hotel rooms…
              </div>
            ) : (
              <div style={{ padding: '0 10px calc(80px + env(safe-area-inset-bottom, 0px))', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(148px, 1fr))', gap: 8 }}>
                {filteredRooms.length === 0 ? (
                  <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '50px 0', color: '#475569', fontSize: 12 }}>No hotel rooms match the criteria.</div>
                ) : filteredRooms.map(room => {
                  const hkCfg = HK_STATUS[room.housekeepingStatus] || HK_STATUS.DIRTY
                  const rCfg = ROOM_STATUS[room.status] || { label: room.status, emoji: '○', color: '#64748b' }
                  const guest = room.checkIns[0]?.guest
                  const hasTasks = room.housekeepingTasks.length > 0
                  
                  // Compute checklist audit completed %
                  const checklist = roomChecklist[room.id] || []
                  const checklistDone = checklist.filter(Boolean).length
                  const checklistTotal = STANDARD_CHECKLIST.length

                  return (
                    <div key={room.id}
                      style={{
                        background: `linear-gradient(160deg, ${hkCfg.bg} 0%, rgba(6,7,12,0.9) 60%)`,
                        border: room.isVIP ? '1.5px solid #fbbf24' : `1.5px solid ${hkCfg.border}`,
                        borderRadius: 16, padding: '0', cursor: 'pointer', position: 'relative',
                        opacity: updatingId === room.id ? 0.5 : 1,
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        boxShadow: room.housekeepingStatus === 'DIRTY'
                          ? `0 0 16px ${hkCfg.border}, 0 4px 16px rgba(0,0,0,0.5)`
                          : room.isVIP ? '0 0 16px rgba(251,191,36,0.15), 0 4px 16px rgba(0,0,0,0.5)'
                          : '0 4px 16px rgba(0,0,0,0.4)',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                      }}>

                      {/* Dirty rooms get animated border glow */}
                      {room.housekeepingStatus === 'DIRTY' && (
                        <div style={{ position: 'absolute', inset: 0, borderRadius: 16, border: `1.5px solid ${hkCfg.color}`, animation: 'dirtyPulse 2s ease-in-out infinite', pointerEvents: 'none', zIndex: 0 }} />
                      )}

                      {/* Card Top: Room number + floor + status */}
                      <div style={{ padding: '10px 10px 6px', position: 'relative', zIndex: 1, flex: 1 }} onClick={() => {
                        if (room.housekeepingStatus === 'DIRTY') {
                          setChecklistRoom(room); setChecklistTicks(Array(CLEAN_STEPS.length).fill(false)); setItemStatuses({}); setChecklistStep(0)
                        } else {
                          setSelectedRoom(room); setActiveMaintTickets([])
                        }
                      }}>

                        {/* Room Number Row */}
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 }}>
                          <div style={{ minWidth: 0, flex: 1, marginRight: 4 }}>
                            <div style={{ fontSize: 20, fontWeight: 900, color: '#f8fafc', letterSpacing: '-0.03em', lineHeight: 1 }}>{room.roomNumber}</div>
                            <div style={{ fontSize: 8, color: '#64748b', fontWeight: 700, marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {room.floor ? `Floor ${room.floor} · ` : ''}{room.roomType.name}
                            </div>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3, flexShrink: 0 }}>
                            {room.isVIP && <span style={{ background: 'linear-gradient(135deg,#fbbf24,#f59e0b)', color: '#000', fontSize: 7.5, fontWeight: 900, padding: '2px 5px', borderRadius: 5, letterSpacing: '0.03em' }}>⭐ VIP</span>}
                            {hasTasks && <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#fbbf24', boxShadow: '0 0 8px #fbbf24', animation: 'pulse 1.5s infinite' }} />}
                          </div>
                        </div>

                        {/* Status Chip */}
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 8.5, fontWeight: 900, padding: '2px 8px', borderRadius: 999, background: hkCfg.bg, color: hkCfg.color, border: `1px solid ${hkCfg.border}`, marginBottom: 5, letterSpacing: '0.02em', whiteSpace: 'nowrap' }}>
                          {hkCfg.emoji} {hkCfg.label}
                        </span>

                        {/* Guest chip - visible */}
                        {guest && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.2)', borderRadius: 7, padding: '2px 6px', marginBottom: 4, minWidth: 0 }}>
                            <span style={{ fontSize: 8, flexShrink: 0 }}>👤</span>
                            <span style={{ fontSize: 8.5, color: '#93c5fd', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{guest.firstName} {guest.lastName}</span>
                          </div>
                        )}

                        {/* Assigned to You badge */}
                        {room.maintenanceStatus?.startsWith('ASSIGNED:') && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.25)', borderRadius: 7, padding: '2px 6px', marginBottom: 4, minWidth: 0 }}>
                            <span style={{ fontSize: 8, flexShrink: 0 }}>📌</span>
                            <span style={{ fontSize: 8.5, color: '#a78bfa', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Assigned to You</span>
                          </div>
                        )}

                        {/* Checklist progress */}
                        {checklistDone > 0 && (
                          <div style={{ marginTop: 4 }}>
                            <div style={{ width: '100%', height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                              <div style={{ width: `${(checklistDone/checklistTotal)*100}%`, height: '100%', background: checklistDone === checklistTotal ? '#34d399' : 'linear-gradient(90deg,#7c3aed,#db2777)', transition: 'width 0.3s' }} />
                            </div>
                          </div>
                        )}

                        {activeTimerRoomId === room.id && (
                          <div style={{ fontSize: 8, color: '#34d399', marginTop: 4, fontWeight: 900, letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#34d399', animation: 'pulse 1s infinite' }} />
                            LIVE {formatElapsedTime(elapsedSeconds)}
                          </div>
                        )}
                      </div>

                      {/* Quick Action Buttons — full width bottom strip */}
                      <div style={{ display: 'flex', borderTop: `1px solid ${hkCfg.border}`, background: 'rgba(0,0,0,0.3)', width: '100%' }} onClick={e => e.stopPropagation()}>
                        <button onClick={() => updateHKStatus(room.id, 'DIRTY')}
                          style={{ flex: 1, minWidth: 0, padding: '8px 0', borderRight: '1px solid rgba(255,255,255,0.06)', fontSize: 8.5, fontWeight: 900, background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '0.01em', whiteSpace: 'nowrap' }}>
                          🧹 Dirty
                        </button>
                        <button onClick={() => { setChecklistRoom(room); setChecklistTicks(Array(CLEAN_STEPS.length).fill(false)); setItemStatuses({}); setChecklistStep(0) }}
                          style={{ flex: 1.4, minWidth: 0, padding: '8px 0', fontSize: 8.5, fontWeight: 900, background: room.housekeepingStatus === 'DIRTY' ? 'linear-gradient(90deg,rgba(16,185,129,0.25),rgba(5,150,105,0.25))' : 'none', border: 'none', color: '#34d399', cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '0.01em', whiteSpace: 'nowrap' }}>
                          ✅ Clean
                        </button>
                        <button onClick={() => { setSelectedRoom(room); setActiveMaintTickets([]) }}
                          style={{ flex: 1, minWidth: 0, padding: '8px 0', fontSize: 8.5, fontWeight: 900, background: 'none', border: 'none', borderLeft: '1px solid rgba(255,255,255,0.06)', color: '#94a3b8', cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '0.01em', whiteSpace: 'nowrap' }}>
                          ⋯ More
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}


        {/* ══ TASKS CHECKLIST TAB ══ */}
        {activeTab === 'tasks' && (
          <div style={{ padding: '12px 10px calc(80px + env(safe-area-inset-bottom, 0px))' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ fontSize: 9, fontWeight: 900, color: '#7c3aed', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                📋 Tasks Assignees ({allTasks.length})
              </div>
            </div>
            
            {allTasks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '50px 16px', background: 'rgba(255,255,255,0.01)', border: '1px dashed rgba(255,255,255,0.06)', borderRadius: 16 }}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>✅</div>
                <div style={{ color: '#34d399', fontSize: 13, fontWeight: 900 }}>Perfect Schedule!</div>
                <div style={{ color: '#475569', fontSize: 10, marginTop: 3, fontWeight: 600 }}>All housekeeping tasks are checked off.</div>
              </div>
            ) : allTasks.map(task => (
              <div key={task.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 14, padding: '11px 12px', marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 900, color: '#f1f5f9', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      Room #{(task as any).roomNumber} · {task.taskType.replace(/_/g, ' ')}
                    </div>
                    {task.priority && (
                      <span style={{ fontSize: 7.5, fontWeight: 900, padding: '2px 6px', borderRadius: 999, background: task.priority === 'HIGH' ? 'rgba(239,68,68,0.12)' : 'rgba(251,191,36,0.12)', color: task.priority === 'HIGH' ? '#f87171' : '#fbbf24', display: 'inline-block', marginBottom: 2 }}>
                        PRIORITY: {task.priority}
                      </span>
                    )}
                    <div style={{ fontSize: 9.5, color: '#64748b', fontWeight: 700 }}>
                      Status: {task.status}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5, flexShrink: 0 }}>
                    {task.status !== 'IN_PROGRESS' && (
                      <button onClick={() => updateTask(task.id, (task as any).roomId, 'IN_PROGRESS')}
                        style={{ padding: '5px 12px', borderRadius: 8, fontSize: 9, fontWeight: 800, cursor: 'pointer', border: '1px solid rgba(124,58,237,0.4)', background: 'rgba(124,58,237,0.15)', color: '#c084fc', fontFamily: 'inherit' }}>
                        Start
                      </button>
                    )}
                    <button onClick={() => updateTask(task.id, (task as any).roomId, 'COMPLETED')}
                      style={{ padding: '5px 12px', borderRadius: 8, fontSize: 9, fontWeight: 800, cursor: 'pointer', border: '1px solid rgba(16,185,129,0.4)', background: 'rgba(16,185,129,0.15)', color: '#34d399', fontFamily: 'inherit' }}>
                      Done
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ══ LOST & FOUND TAB ══ */}
        {activeTab === 'lostfound' && (
          <div style={{ padding: '12px 10px calc(80px + env(safe-area-inset-bottom, 0px))' }}>
            <div style={{ fontSize: 9, fontWeight: 900, color: '#7c3aed', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 10 }}>
              💼 Lost & Found Logger
            </div>

            {/* Quick logging form */}
            <form onSubmit={handleLogLostItem} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 14, padding: '14px', marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#a78bfa', marginBottom: 8 }}>LOG FOUND ITEM</div>
              
              <div style={{ marginBottom: 8 }}>
                <input value={lostItemName} onChange={e => setLostItemName(e.target.value)}
                  placeholder="Item Name (e.g. Black Watch, Leather Wallet)"
                  style={{ width: '100%', padding: '9px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: '#f1f5f9', fontSize: 11, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
              </div>

              <div style={{ marginBottom: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <input value={lostItemRoom} onChange={e => setLostItemRoom(e.target.value)}
                  placeholder="Room # (e.g. 102)"
                  style={{ flex: 1, minWidth: 90, padding: '9px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: '#f1f5f9', fontSize: 11, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
                
                <button type="submit" style={{ flexShrink: 0, padding: '9px 14px', borderRadius: 10, background: 'linear-gradient(135deg,#7c3aed,#db2777)', border: 'none', color: '#fff', fontSize: 10, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                  SUBMIT LOG
                </button>
              </div>

              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input value={lostItemDesc} onChange={e => setLostItemDesc(e.target.value)}
                  placeholder="Brief Description (marks, brand, color…)"
                  style={{ width: '100%', padding: '9px 36px 9px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: '#f1f5f9', fontSize: 11, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
                <button type="button" onClick={() => startVoiceRecognition(setLostItemDesc)}
                  style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, padding: 2 }}>
                  {isVoiceListening ? '🔴' : '🎙️'}
                </button>
              </div>
            </form>

            {/* Registry List */}
            <div style={{ fontSize: 9, fontWeight: 900, color: '#475569', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>Recent Logged items</div>
            {lostItems.length === 0 ? (
              <div style={{ textTransform: 'uppercase', textAlign: 'center', padding: '24px 0', fontSize: 9, color: '#334155', fontWeight: 700 }}>No items currently registered</div>
            ) : lostItems.map(item => (
              <div key={item.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12, padding: '11px 12px', marginBottom: 8, position: 'relative' }}>
                <button onClick={() => deleteLostItem(item.id)} style={{ position: 'absolute', top: 10, right: 10, background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: 4 }}>
                  <Trash2 size={13} />
                </button>
                <div style={{ fontSize: 12, fontWeight: 900, color: '#fbbf24', marginBottom: 2, paddingRight: 24, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.item}</div>
                <div style={{ fontSize: 9.5, color: '#a78bfa', fontWeight: 800 }}>Room #{item.room} · Found: {item.foundAt}</div>
                {item.description && <div style={{ fontSize: 9.5, color: '#64748b', marginTop: 3 }}>Desc: {item.description}</div>}
              </div>
            ))}
          </div>
        )}

        {/* ══ ATTENDANCE ROSTER TAB ══ */}
        {activeTab === 'attendance' && (
          <div style={{ padding: '12px 10px calc(80px + env(safe-area-inset-bottom, 0px))' }}>
            <div style={{ fontSize: 9, fontWeight: 900, color: '#7c3aed', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 10 }}>
              📅 Attendance
            </div>
            
            {/* Action Card */}
            <div style={{ background: clockedIn ? 'rgba(16,185,129,0.07)' : 'rgba(255,255,255,0.02)', border: `1.5px solid ${clockedIn ? 'rgba(16,185,129,0.25)' : 'rgba(255,255,255,0.05)'}`, borderRadius: 16, padding: '20px 14px', marginBottom: 14, textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 6 }}>{clockedIn ? '🟢' : '⭕'}</div>
              <div style={{ fontSize: 13, fontWeight: 900, color: clockedIn ? '#34d399' : '#64748b', marginBottom: 3 }}>
                {clockedIn ? 'ON DUTY' : 'NOT CLOCKED IN'}
              </div>
              <div style={{ fontSize: 9.5, color: '#475569', marginBottom: 14 }}>
                {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
              </div>
              <button
                onClick={async () => {
                  try {
                    let locationCoord: string | undefined = undefined;
                    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
                      try {
                        locationCoord = await new Promise<string | undefined>((resolve) => {
                          navigator.geolocation.getCurrentPosition(
                            (pos) => resolve(`${pos.coords.latitude.toFixed(6)},${pos.coords.longitude.toFixed(6)}`),
                            () => resolve(undefined),
                            { timeout: 3000, enableHighAccuracy: true }
                          );
                        });
                      } catch {}
                    }

                    const endpoint = clockedIn ? '/api/staff-attendance/clock-out' : '/api/staff-attendance/clock-in'
                    const res = await fetch(endpoint, {
                      method: 'POST',
                      headers: { 
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${wtToken}` 
                      },
                      body: JSON.stringify(locationCoord ? { location: locationCoord } : {}),
                    })
                    if (res.ok) {
                      setClockedIn(!clockedIn)
                      toast.success(clockedIn ? 'Clocked out successfully' : 'Clocked in successfully')
                      fetchAttendance()
                    } else {
                      toast.error('Failed to update attendance')
                    }
                  } catch { toast.error('Network error') }
                }}
                style={{ padding: '11px 28px', borderRadius: 12, background: clockedIn ? 'rgba(239,68,68,0.15)' : 'linear-gradient(135deg,#7c3aed,#db2777)', border: clockedIn ? '1px solid rgba(239,68,68,0.3)' : 'none', color: clockedIn ? '#f87171' : '#fff', fontSize: 11, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>
                {clockedIn ? '⏸ CLOCK OUT' : '▶ CLOCK IN'}
              </button>
            </div>

            {/* Attendance list log */}
            <div style={{ fontSize: 9, fontWeight: 900, color: '#475569', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>Attendance History</div>
            {attLoading ? (
              <div style={{ textAlign: 'center', padding: '20px', color: '#475569', fontSize: 11 }}>Loading attendance records…</div>
            ) : attendance.slice(0, 10).map(r => (
              <div key={r.id} style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12, padding: '10px 12px', marginBottom: 7, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#f1f5f9' }}>{new Date(r.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</div>
                  <div style={{ fontSize: 9.5, color: '#64748b', marginTop: 2 }}>
                    In: {r.clockIn ? new Date(r.clockIn).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}
                    {r.clockOut ? ` · Out: ${new Date(r.clockOut).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}` : ''}
                  </div>
                </div>
                <span style={{ fontSize: 8.5, fontWeight: 900, padding: '3px 8px', borderRadius: 999, background: r.status === 'PRESENT' ? 'rgba(16,185,129,0.1)' : r.status === 'LEAVE' ? 'rgba(251,191,36,0.1)' : 'rgba(239,68,68,0.1)', color: r.status === 'PRESENT' ? '#34d399' : r.status === 'LEAVE' ? '#fbbf24' : '#f87171', flexShrink: 0 }}>
                  {r.status}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* ══ SUPPLY RESTOCK REQUEST TAB ══ */}
        {activeTab === 'supplies' && (
          <div style={{ padding: '12px 10px calc(80px + env(safe-area-inset-bottom, 0px))' }}>
            <div style={{ fontSize: 9, fontWeight: 900, color: '#7c3aed', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 4 }}>
              📦 Supply Restock Request
            </div>
            <div style={{ fontSize: 9.5, color: '#475569', fontWeight: 600, marginBottom: 12 }}>
              Tap + or − to set quantities needed, then submit to the supply room.
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {Object.entries(suppliesRequest).map(([item, qty]) => (
                <div key={item} style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${qty > 0 ? 'rgba(124,58,237,0.25)' : 'rgba(255,255,255,0.05)'}`, borderRadius: 12, padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, transition: 'border-color 0.2s' }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 11.5, fontWeight: 800, color: qty > 0 ? '#c084fc' : '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item}</div>
                    {qty > 0 && <div style={{ fontSize: 8.5, color: '#7c3aed', fontWeight: 700, marginTop: 2 }}>Requesting {qty} unit{qty > 1 ? 's' : ''}</div>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    <button onClick={() => setSuppliesRequest(prev => ({ ...prev, [item]: Math.max(0, (prev[item] || 0) - 1) }))}
                      style={{ width: 26, height: 26, borderRadius: 7, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#94a3b8', fontSize: 14, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                    <span style={{ fontSize: 13, fontWeight: 900, color: qty > 0 ? '#f1f5f9' : '#475569', minWidth: 18, textAlign: 'center' }}>{qty}</span>
                    <button onClick={() => setSuppliesRequest(prev => ({ ...prev, [item]: (prev[item] || 0) + 1 }))}
                      style={{ width: 26, height: 26, borderRadius: 7, border: '1px solid rgba(124,58,237,0.3)', background: 'rgba(124,58,237,0.12)', color: '#c084fc', fontSize: 14, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary + Send */}
            {Object.values(suppliesRequest).some(v => v > 0) && (
              <div style={{ marginTop: 14, background: 'rgba(124,58,237,0.07)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 14, padding: '12px' }}>
                <div style={{ fontSize: 9.5, fontWeight: 900, color: '#c084fc', marginBottom: 8, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Order Summary</div>
                {Object.entries(suppliesRequest).filter(([, qty]) => qty > 0).map(([item, qty]) => (
                  <div key={item} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9.5, color: '#94a3b8', fontWeight: 700, marginBottom: 4 }}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 8 }}>{item}</span>
                    <span style={{ color: '#f1f5f9', flexShrink: 0 }}>× {qty}</span>
                  </div>
                ))}
                <button onClick={() => {
                  const requested = Object.entries(suppliesRequest).filter(([, v]) => v > 0)
                  const summary = requested.map(([item, qty]) => `${item}: ×${qty}`).join(', ')
                  triggerTTSAlert(`Supply request submitted: ${summary}`)
                  toast.success('Supply request sent to supply room! 📦')
                  playSuccessChime()
                  setSuppliesRequest(prev => Object.fromEntries(Object.keys(prev).map(k => [k, 0])))
                }}
                  style={{ width: '100%', marginTop: 10, padding: '11px', borderRadius: 11, background: 'linear-gradient(135deg,#7c3aed,#db2777)', border: 'none', color: '#fff', fontSize: 10.5, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '0.03em', textTransform: 'uppercase' }}>
                  📦 Send Request to Stock Room
                </button>
              </div>
            )}

            {!Object.values(suppliesRequest).some(v => v > 0) && (
              <div style={{ textAlign: 'center', padding: '24px 0', color: '#334155', fontSize: 9.5, fontWeight: 700 }}>
                Use the + buttons above to request supplies
              </div>
            )}
          </div>
        )}

        {/* ══ LAUNDRY PICKUP TAB ══ */}
        {activeTab === 'laundry' && (
          <div style={{ padding: '12px 10px calc(80px + env(safe-area-inset-bottom, 0px))' }}>
            <div style={{ fontSize: 9, fontWeight: 900, color: '#06b6d4', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 4 }}>
              🧺 Laundry Pickup Log
            </div>
            <div style={{ fontSize: 9.5, color: '#475569', fontWeight: 600, marginBottom: 12 }}>
              Log laundry collected from rooms. Auto-deducts from inventory stock.
            </div>

            {/* Room selector */}
            <div style={{ background: 'rgba(6,182,212,0.05)', border: '1px solid rgba(6,182,212,0.15)', borderRadius: 12, padding: '10px 12px', marginBottom: 12 }}>
              <div style={{ fontSize: 8.5, fontWeight: 900, color: '#22d3ee', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>
                Select Room
              </div>
              <select value={laundryRoom} onChange={e => setLaundryRoom(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(6,182,212,0.2)', borderRadius: 8, color: laundryRoom ? '#f1f5f9' : '#475569', fontSize: 11, fontFamily: 'inherit', outline: 'none' }}>
                <option value="">— Pick a Room —</option>
                {rooms.map(r => (
                  <option key={r.id} value={r.id}>Room {r.roomNumber}{r.floor ? ` (Floor ${r.floor})` : ''}</option>
                ))}
              </select>
            </div>

            {/* Items picker */}
            <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12, padding: '10px 12px', marginBottom: 12 }}>
              <div style={{ fontSize: 8.5, fontWeight: 900, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
                <span>Items Collected</span>
                <span style={{ color: '#475569', fontWeight: 600 }}>From inventory stock</span>
              </div>

              {stockItemsLoading ? (
                <div style={{ textAlign: 'center', padding: '14px 0', color: '#475569', fontSize: 10 }}>Loading items…</div>
              ) : stockItems.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '14px 0', color: '#64748b', fontSize: 10 }}>
                  <div style={{ marginBottom: 8 }}>No stock items found in inventory.</div>
                  <button onClick={seedStockItems} disabled={stockItemsLoading}
                    style={{ padding: '7px 12px', borderRadius: 8, background: 'linear-gradient(135deg, #06b6d4, #0891b2)', border: 'none', color: '#fff', fontSize: 9.5, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>
                    ✨ Add Default Housekeeping Stock Items
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {stockItems.map(item => {
                    const qty = laundryCounters[item.id] || 0
                    return (
                      <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, background: qty > 0 ? 'rgba(6,182,212,0.08)' : 'rgba(255,255,255,0.02)', border: `1px solid ${qty > 0 ? 'rgba(6,182,212,0.2)' : 'rgba(255,255,255,0.05)'}`, borderRadius: 10, padding: '8px 10px', transition: 'all 0.15s' }}>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontSize: 11, fontWeight: 800, color: qty > 0 ? '#22d3ee' : '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</div>
                          <div style={{ fontSize: 8.5, color: '#475569', fontWeight: 600 }}>{item.unit || 'pcs'} · Stock: {item.currentStock}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                          <button onClick={() => setLaundryCounters(prev => ({ ...prev, [item.id]: Math.max(0, (prev[item.id] || 0) - 1) }))}
                            style={{ width: 26, height: 26, borderRadius: 7, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#94a3b8', fontSize: 14, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                          <span style={{ fontSize: 13, fontWeight: 900, color: qty > 0 ? '#f1f5f9' : '#475569', minWidth: 18, textAlign: 'center' }}>{qty}</span>
                          <button onClick={() => setLaundryCounters(prev => ({ ...prev, [item.id]: (prev[item.id] || 0) + 1 }))}
                            style={{ width: 26, height: 26, borderRadius: 7, border: '1px solid rgba(6,182,212,0.3)', background: 'rgba(6,182,212,0.12)', color: '#22d3ee', fontSize: 14, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Submit button */}
            {Object.values(laundryCounters).some(v => v > 0) && (
              <button onClick={() => submitLaundry()} disabled={submittingLaundry}
                style={{ width: '100%', marginBottom: 14, padding: '12px', borderRadius: 11, background: 'linear-gradient(135deg,#0891b2,#06b6d4)', border: 'none', color: '#fff', fontSize: 10.5, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '0.03em', textTransform: 'uppercase', opacity: submittingLaundry ? 0.6 : 1 }}>
                {submittingLaundry ? 'Logging…' : `🧺 Log ${Object.values(laundryCounters).reduce((a, b) => a + b, 0)} Laundry Item(s)`}
              </button>
            )}

            {/* Today's Laundry Log */}
            <div>
              <div style={{ fontSize: 8.5, fontWeight: 900, color: '#475569', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>📋 Today&apos;s Pickups</span>
                <button onClick={fetchLaundryLogs} style={{ background: 'none', border: 'none', color: '#22d3ee', fontSize: 8.5, fontWeight: 800, cursor: 'pointer' }}>↻ Refresh</button>
              </div>

              {laundryLogsLoading ? (
                <div style={{ textAlign: 'center', padding: '14px 0', color: '#475569', fontSize: 10 }}>Loading logs…</div>
              ) : laundryLogs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '16px 0', color: '#334155', fontSize: 9.5, fontWeight: 700 }}>
                  No laundry pickups logged today
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {laundryLogs.map((log: any) => (
                    <div key={log.id} style={{ background: 'rgba(6,182,212,0.04)', border: '1px solid rgba(6,182,212,0.12)', borderRadius: 10, padding: '9px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: 11, fontWeight: 800, color: '#f1f5f9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{log.stockItem?.name || 'Item'}</div>
                        <div style={{ fontSize: 8.5, color: '#475569', fontWeight: 600, marginTop: 2 }}>
                          Room: {log.referenceId?.slice(-8) || '—'} · {new Date(log.movementDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 900, color: '#22d3ee', flexShrink: 0 }}>×{log.qtyOut}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══ WALKIE-TALIE TTS / CONFIG SETTINGS TAB ══ */}
        {activeTab === 'settings' && (
          <div style={{ padding: '12px 10px calc(80px + env(safe-area-inset-bottom, 0px))' }}>
            
            {/* Quick Broadcast Console */}
            <div style={{ fontSize: 9, fontWeight: 900, color: '#7c3aed', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 10 }}>
              📢 Walkie Talkie - Quick Broadcast
            </div>
            
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 14, padding: '14px', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Radio size={14} className="text-pink-500 animate-pulse" />
                <span style={{ fontSize: 9.5, fontWeight: 900, color: '#94a3b8' }}>PRE-SET VOICE BROADCASTS</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[
                  { text: 'Floor 2 Housekeeping completed', label: '🧹 Floor 2 Completed' },
                  { text: 'Ready for room inspection on Floor 3', label: '🔍 Ready for Inspection' },
                  { text: 'Extra water bottles and towels required', label: '🧴 Need Restock supplies' },
                  { text: 'Reporting high priority maintenance issue', label: '🔧 Report Maintenance' },
                  { text: 'Manager assistance requested immediately', label: '🚨 Request Manager' }
                ].map(b => (
                  <button key={b.text} onClick={() => triggerTTSAlert(b.text)}
                    style={{ textTransform: 'uppercase', padding: '8px 10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 8, color: '#a78bfa', fontSize: 9.5, fontWeight: 800, textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit', display: 'block', transition: 'all 0.15s' }}>
                    {b.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ fontSize: 9, fontWeight: 900, color: '#475569', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>My Profile Photo</div>

            {/* Profile Photo Uploader Card */}
            <div style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.12), rgba(219,39,119,0.06))', border: '1px solid rgba(124,58,237,0.25)', borderRadius: 14, padding: '14px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
              <ProfilePhotoUploader
                currentPhotoUrl={user.avatarUrl}
                name={user.fullName}
                userType="housekeeper"
                userId={user.id}
                token={wtToken}
                size="md"
                onPhotoUploaded={newUrl => {
                  const updated = { ...user, avatarUrl: newUrl };
                  setUser(updated);
                  localStorage.setItem('hk_portal_session', JSON.stringify({ user: updated, wtToken }));
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 900, color: '#fff', letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.fullName}</div>
                <div style={{ fontSize: 9.5, fontWeight: 700, color: '#c084fc', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.designation || 'Executive Housekeeper'}</div>
                <div style={{ fontSize: 8.5, color: '#94a3b8', marginTop: 3 }}>Tap photo to upload camera / gallery</div>
              </div>
            </div>

            <div style={{ fontSize: 9, fontWeight: 900, color: '#475569', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>Account Credentials</div>
            
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 14, overflow: 'hidden', marginBottom: 14 }}>
              {[
                ['👤 Full Name', user.fullName],
                ['🧹 Role Assigned', user.designation || 'Executive Housekeeper'],
                ['🏨 Hotel Property', propName],
                ['📧 Email Node', user.email],
              ].map(([l, v]) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.04)', gap: 8 }}>
                  <span style={{ fontSize: 9.5, color: '#64748b', fontWeight: 800, flexShrink: 0 }}>{l}</span>
                  <span style={{ fontSize: 10.5, color: '#f1f5f9', fontWeight: 800, textAlign: 'right', wordBreak: 'break-all' }}>{v}</span>
                </div>
              ))}
            </div>

            {/* ── UPI for Tips Section ── */}
            <StaffUpiSettingCard user={user} wtToken={wtToken} />

            <button onClick={handleLogout}
              style={{ width: '100%', marginTop: 16, padding: '12px', borderRadius: 12, background: 'rgba(239,68,68,0.08)', border: '1.5px solid rgba(239,68,68,0.2)', color: '#f87171', fontSize: 11, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              ⏻ Sign Out & Clear Local Session
            </button>
          </div>
        )}
      </div>

      {/* ─── BOTTOM NAVIGATION TABS (Mobile Friendly & Safe Area Aware) ─── */}
      <nav style={{
        flexShrink: 0,
        padding: '5px 4px calc(5px + env(safe-area-inset-bottom, 0px))',
        background: 'rgba(10,12,20,0.96)',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(20px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        zIndex: 40,
      }}>
        {tabs.map(t => {
          const isActive = activeTab === t.key
          return (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              style={{
                flex: 1,
                minWidth: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1,
                padding: '5px 1px',
                borderRadius: 9,
                border: 'none',
                cursor: 'pointer',
                background: isActive ? 'rgba(124,58,237,0.15)' : 'transparent',
                color: isActive ? '#c084fc' : '#64748b',
                fontFamily: 'inherit',
                transition: 'all 0.15s',
              }}>
              <span style={{ fontSize: 15, lineHeight: 1 }}>{t.emoji}</span>
              <span style={{
                fontSize: 7.5,
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.01em',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '100%',
                lineHeight: 1.1,
              }}>
                {t.label}
              </span>
              {isActive && <div style={{ width: 12, height: 2, background: '#a855f7', borderRadius: 1, marginTop: 1 }} />}
            </button>
          )
        })}
      </nav>

      {/* ─── ROOM SHEET BOTTOM MODAL (Advanced Actions) ─── */}
      {/* ══ SIMPLE ROOM INFO BOTTOM SHEET ══ */}
      {selectedRoom && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          <div onClick={() => setSelectedRoom(null)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }} />

          <div style={{ position: 'relative', background: '#0d1117', borderRadius: '24px 24px 0 0', border: '1px solid rgba(255,255,255,0.08)', borderBottom: 'none', padding: '16px 16px calc(24px + env(safe-area-inset-bottom, 0px))', maxHeight: '90vh', overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
            {/* Drag handle */}
            <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.15)', margin: '0 auto 14px' }} />

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6, gap: 8 }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: '#f1f5f9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Room {selectedRoom.roomNumber}</div>
                <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {selectedRoom.floor ? `Floor ${selectedRoom.floor} · ` : ''}{selectedRoom.roomType.name}
                  {selectedRoom.checkIns[0]?.guest && ` · ${selectedRoom.checkIns[0].guest.firstName} ${selectedRoom.checkIns[0].guest.lastName}`}
                </div>
              </div>
              <button onClick={() => setSelectedRoom(null)}
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '6px 10px', color: '#94a3b8', cursor: 'pointer', fontSize: 11, fontWeight: 800, fontFamily: 'inherit', flexShrink: 0 }}>
                ✕ Close
              </button>
            </div>

            {/* Current status badge */}
            <div style={{ marginBottom: 16 }}>
              {(() => {
                const cfg = HK_STATUS[selectedRoom.housekeepingStatus] || HK_STATUS.DIRTY
                return (
                  <span style={{ fontSize: 10.5, fontWeight: 900, padding: '4px 10px', borderRadius: 999, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                    {cfg.emoji} {cfg.label}
                  </span>
                )
              })()}
            </div>

            {/* Quick action buttons */}
            <div style={{ fontSize: 9, fontWeight: 900, color: '#475569', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
              Change Status
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { key: 'CLEAN',          label: '✅  Mark Clean',        desc: 'Room fully cleaned & ready',      bg: 'rgba(16,185,129,0.12)',  color: '#34d399', border: 'rgba(16,185,129,0.3)' },
                { key: 'DIRTY',          label: '🧹  Mark Dirty',         desc: 'Room needs cleaning',              bg: 'rgba(239,68,68,0.08)',   color: '#f87171', border: 'rgba(239,68,68,0.25)' },
                { key: 'INSPECTING',     label: '🔍  Mark Inspecting',    desc: 'Currently being checked',          bg: 'rgba(99,102,241,0.10)',  color: '#818cf8', border: 'rgba(99,102,241,0.25)' },
                { key: 'DO_NOT_DISTURB', label: '🚫  Do Not Disturb',     desc: 'Guest requested no entry',         bg: 'rgba(251,191,36,0.10)',  color: '#fbbf24', border: 'rgba(251,191,36,0.25)' },
              ].map(btn => {
                const isCurrent = selectedRoom.housekeepingStatus === btn.key
                return (
                  <button
                    key={btn.key}
                    disabled={isCurrent || updatingId === selectedRoom.id}
                    onClick={() => {
                      updateHKStatus(selectedRoom.id, btn.key)
                      setSelectedRoom(null)
                    }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                      borderRadius: 12, cursor: isCurrent ? 'default' : 'pointer', fontFamily: 'inherit',
                      background: isCurrent ? btn.bg : 'rgba(255,255,255,0.03)',
                      border: `1.5px solid ${isCurrent ? btn.border : 'rgba(255,255,255,0.07)'}`,
                      opacity: isCurrent ? 1 : 0.85,
                      transition: 'all 0.15s',
                      textAlign: 'left',
                    }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 800, color: isCurrent ? btn.color : '#f1f5f9' }}>{btn.label}</div>
                      <div style={{ fontSize: 9.5, color: '#64748b', marginTop: 2, fontWeight: 600 }}>{btn.desc}</div>
                    </div>
                    {isCurrent && <span style={{ fontSize: 9, fontWeight: 900, color: btn.color, flexShrink: 0 }}>CURRENT</span>}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ══ ROOM LAUNDRY PICKUP MODAL ══ */}
      {laundryModalRoom && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 220, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          <div onClick={() => setLaundryModalRoom(null)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(8px)' }} />
          
          <div style={{ position: 'relative', background: '#090a0f', borderRadius: '24px 24px 0 0', borderTop: '1.5px solid rgba(6,182,212,0.3)', padding: '16px 14px calc(24px + env(safe-area-inset-bottom, 0px))', maxHeight: '88vh', overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(6,182,212,0.3)', margin: '0 auto 14px' }} />

            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14, gap: 8 }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 18, fontWeight: 900, color: '#f1f5f9' }}>🧺 Room {laundryModalRoom.roomNumber}</span>
                  <span style={{ background: 'rgba(6,182,212,0.15)', color: '#22d3ee', border: '1px solid rgba(6,182,212,0.3)', fontSize: 8.5, fontWeight: 900, padding: '2px 7px', borderRadius: 999 }}>LAUNDRY PICKUP</span>
                </div>
                <div style={{ fontSize: 9.5, color: '#64748b', marginTop: 3, fontWeight: 600 }}>
                  Set items collected from Room {laundryModalRoom.roomNumber}
                </div>
              </div>
              <button onClick={() => setLaundryModalRoom(null)} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 9, padding: '6px 10px', color: '#94a3b8', cursor: 'pointer', fontSize: 11, fontWeight: 800, flexShrink: 0 }}>✕ Close</button>
            </div>

            {/* Items list with + / - buttons */}
            <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 14, padding: '10px 12px', marginBottom: 14 }}>
              {stockItemsLoading ? (
                <div style={{ textAlign: 'center', padding: '16px 0', color: '#475569', fontSize: 11 }}>Loading stock items…</div>
              ) : stockItems.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '16px 0', color: '#64748b', fontSize: 11 }}>
                  <div style={{ marginBottom: 8 }}>No stock items found in inventory.</div>
                  <button onClick={seedStockItems} disabled={stockItemsLoading}
                    style={{ padding: '7px 12px', borderRadius: 8, background: 'linear-gradient(135deg, #06b6d4, #0891b2)', border: 'none', color: '#fff', fontSize: 9.5, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>
                    ✨ Add Default Housekeeping Stock Items
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7, maxHeight: 300, overflowY: 'auto' }}>
                  {stockItems.map(item => {
                    const qty = laundryCounters[item.id] || 0
                    return (
                      <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, background: qty > 0 ? 'rgba(6,182,212,0.1)' : 'rgba(255,255,255,0.02)', border: `1px solid ${qty > 0 ? 'rgba(6,182,212,0.3)' : 'rgba(255,255,255,0.05)'}`, borderRadius: 10, padding: '8px 11px', transition: 'all 0.15s' }}>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontSize: 11.5, fontWeight: 800, color: qty > 0 ? '#22d3ee' : '#f1f5f9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</div>
                          <div style={{ fontSize: 8.5, color: '#64748b', fontWeight: 600, marginTop: 1 }}>{item.unit || 'pcs'} · In Stock: {item.currentStock}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0 }}>
                          <button onClick={() => setLaundryCounters(prev => ({ ...prev, [item.id]: Math.max(0, (prev[item.id] || 0) - 1) }))}
                            style={{ width: 28, height: 28, borderRadius: 7, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#94a3b8', fontSize: 15, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                          <span style={{ fontSize: 14, fontWeight: 900, color: qty > 0 ? '#22d3ee' : '#475569', minWidth: 20, textAlign: 'center' }}>{qty}</span>
                          <button onClick={() => setLaundryCounters(prev => ({ ...prev, [item.id]: (prev[item.id] || 0) + 1 }))}
                            style={{ width: 28, height: 28, borderRadius: 7, border: '1px solid rgba(6,182,212,0.4)', background: 'rgba(6,182,212,0.15)', color: '#22d3ee', fontSize: 15, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Action button */}
            <button onClick={() => submitLaundry(laundryModalRoom)} disabled={submittingLaundry}
              style={{ width: '100%', padding: '12px', borderRadius: 12, background: Object.values(laundryCounters).some(v => v > 0) ? 'linear-gradient(135deg,#0891b2,#06b6d4)' : 'rgba(255,255,255,0.05)', border: 'none', color: Object.values(laundryCounters).some(v => v > 0) ? '#fff' : '#475569', fontSize: 11, fontWeight: 900, cursor: Object.values(laundryCounters).some(v => v > 0) ? 'pointer' : 'default', fontFamily: 'inherit', letterSpacing: '0.03em', textTransform: 'uppercase', opacity: submittingLaundry ? 0.6 : 1, transition: 'all 0.2s' }}>
              {submittingLaundry ? 'Logging Laundry…' : Object.values(laundryCounters).some(v => v > 0) ? `🧺 Save Laundry (${Object.values(laundryCounters).reduce((a, b) => a + b, 0)} Items)` : 'Select Laundry Items Above'}
            </button>
          </div>
        </div>
      )}

      {/* ══ STEP-BY-STEP CLEANING WIZARD ══ */}
      {checklistRoom && (() => {
        const TOTAL_STEPS = CLEAN_STEPS.length
        const isReview = checklistStep >= TOTAL_STEPS
        const currentStep = CLEAN_STEPS[checklistStep]
        const doneTicks = checklistTicks.filter(Boolean).length
        const doneSteps = CLEAN_STEPS.filter((_, i) => checklistTicks[i])
        const skippedSteps = CLEAN_STEPS.filter((_, i) => !checklistTicks[i])
        // Amenities kit items (step index 3)
        const kitStep = CLEAN_STEPS[3]

        return (
          <div style={{ position: 'fixed', inset: 0, zIndex: 240, background: '#070a10', fontFamily: '"Inter",-apple-system,sans-serif', display: 'flex', flexDirection: 'column' }}>

            {/* ── Top Bar (Notch Safe) ── */}
            <div style={{ padding: 'calc(10px + env(safe-area-inset-top, 0px)) 14px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0, background: 'rgba(255,255,255,0.015)', backdropFilter: 'blur(20px)' }}>
              <div>
                <div style={{ fontSize: 9, fontWeight: 900, color: '#64748b', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Room Cleaning</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: '#f1f5f9', marginTop: 1, letterSpacing: '-0.02em' }}>Room {checklistRoom.roomNumber}</div>
              </div>
              <button onClick={() => setChecklistRoom(null)}
                style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '6px 12px', color: '#94a3b8', cursor: 'pointer', fontSize: 11, fontWeight: 800, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 5 }}>
                ✕ Cancel
              </button>
            </div>

            {/* ── Step Progress Bar ── */}
            <div style={{ padding: '10px 14px 0', display: 'flex', gap: 4, alignItems: 'center', flexShrink: 0 }}>
              {CLEAN_STEPS.map((step, i) => (
                <div key={i} style={{
                  height: 3.5, flex: 1, borderRadius: 2,
                  background: i < checklistStep
                    ? '#10b981'
                    : i === checklistStep && !isReview
                      ? step.color || '#f1f5f9'
                      : 'rgba(255,255,255,0.08)',
                  transition: 'background 0.3s',
                  boxShadow: i === checklistStep && !isReview ? `0 0 8px ${step.color}60` : 'none'
                }} />
              ))}
              <div style={{ height: 3.5, flex: 1, borderRadius: 2, background: isReview ? '#f1f5f9' : 'rgba(255,255,255,0.08)', transition: 'background 0.3s' }} />
            </div>
            <div style={{ padding: '4px 14px 0', fontSize: 8.5, fontWeight: 800, color: '#475569', letterSpacing: '0.08em', textTransform: 'uppercase', flexShrink: 0 }}>
              {isReview ? '✨ Final Review' : `Step ${checklistStep + 1} of ${TOTAL_STEPS}`}
            </div>

            {/* ── Scrollable Step Content ── */}
            <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', display: 'flex', flexDirection: 'column' }}>

              {!isReview && currentStep ? (
                /* ── INDIVIDUAL CLEANING STEP ── */
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px 14px 20px' }}>

                  {/* Step Card - Responsive */}
                  <div style={{ width: '100%', maxWidth: 440 }}>

                    {/* Emoji + Step Title */}
                    <div style={{ textAlign: 'center', marginBottom: 18 }}>
                      <div style={{
                        width: 72, height: 72, borderRadius: 20, margin: '0 auto 12px',
                        background: `linear-gradient(135deg, ${currentStep.color}20, ${currentStep.color}08)`,
                        border: `2px solid ${currentStep.color}30`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 38,
                        boxShadow: `0 0 30px ${currentStep.color}20`,
                      }}>
                        {currentStep.emoji}
                      </div>
                      <div style={{ fontSize: 19, fontWeight: 900, color: '#f1f5f9', marginBottom: 4, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                        {currentStep.label}
                      </div>
                      <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, lineHeight: 1.4 }}>
                        {currentStep.sublabel}
                      </div>
                    </div>

                    {/* ── Tappable Checklist Items ── */}
                    <div style={{ background: `linear-gradient(135deg, ${currentStep.color}06, rgba(255,255,255,0.01))`, border: `1px solid ${currentStep.color}18`, borderRadius: 16, padding: '12px', marginBottom: checklistStep === 4 ? 12 : 16 }}>
                      <div style={{ fontSize: 8.5, fontWeight: 900, color: currentStep.color, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span>📋 Tap each item to confirm</span>
                        <span style={{ fontSize: 8, color: '#475569', fontWeight: 700, textTransform: 'none' }}>
                          {currentStep.items.filter((_, i) => getItemStatus(checklistStep, i) !== null).length}/{currentStep.items.length} done
                        </span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {currentStep.items.map((item, idx) => {
                          const status = getItemStatus(checklistStep, idx)
                          const isChanged = status === 'CHANGED'
                          const isOk = status === 'ALREADY_OK'
                          return (
                            <button key={idx} onClick={() => toggleItemStatus(checklistStep, idx)}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 9, padding: '9px 10px',
                                borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', width: '100%',
                                background: isChanged ? `rgba(16,185,129,0.12)` : isOk ? `rgba(96,165,250,0.1)` : 'rgba(255,255,255,0.02)',
                                border: isChanged ? '1px solid rgba(16,185,129,0.3)' : isOk ? '1px solid rgba(96,165,250,0.25)' : `1px solid rgba(255,255,255,0.06)`,
                                transition: 'all 0.2s',
                              }}>
                              {/* Status icon */}
                              <div style={{
                                width: 22, height: 22, borderRadius: 7, flexShrink: 0,
                                background: isChanged ? 'rgba(16,185,129,0.2)' : isOk ? 'rgba(96,165,250,0.15)' : `${currentStep.color}12`,
                                border: isChanged ? '1.5px solid #34d399' : isOk ? '1.5px solid #60a5fa' : `1px solid ${currentStep.color}30`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11,
                              }}>
                                {isChanged ? '✓' : isOk ? '↺' : <span style={{ fontSize: 8.5, fontWeight: 900, color: currentStep.color }}>{idx + 1}</span>}
                              </div>
                              {/* Item text */}
                              <span style={{
                                fontSize: 11, fontWeight: 600, lineHeight: 1.35, flex: 1, minWidth: 0,
                                color: isChanged ? '#34d399' : isOk ? '#93c5fd' : '#cbd5e1',
                                textDecoration: isChanged ? 'line-through' : isOk ? 'line-through' : 'none',
                                opacity: (isChanged || isOk) ? 0.85 : 1,
                              }}>{item}</span>
                              {/* Status label */}
                              {isChanged && <span style={{ fontSize: 7.5, fontWeight: 900, color: '#34d399', flexShrink: 0 }}>CHANGED</span>}
                              {isOk && <span style={{ fontSize: 7.5, fontWeight: 900, color: '#60a5fa', flexShrink: 0 }}>WAS OK</span>}
                            </button>
                          )
                        })}
                      </div>
                      {/* Helper text */}
                      <div style={{ marginTop: 8, fontSize: 8.5, color: '#334155', fontWeight: 600, textAlign: 'center' }}>
                        Tap once = ✓ Changed · Tap again = ↺ Was Already OK · Tap 3rd = Reset
                      </div>
                    </div>

                    {/* ── LAUNDRY STEP: Interactive Item Picker ── */}
                    {checklistStep === 4 && (
                      <div style={{ background: 'rgba(239,68,68,0.05)', border: '1.5px solid rgba(239,68,68,0.18)', borderRadius: 16, padding: '14px', marginBottom: 16 }}>
                        <div style={{ fontSize: 8.5, fontWeight: 900, color: '#f87171', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 3, display: 'flex', alignItems: 'center', gap: 6 }}>
                          🧺 Items Collected from Room {checklistRoom.roomNumber}
                        </div>
                        <div style={{ fontSize: 9.5, color: '#475569', fontWeight: 600, marginBottom: 12 }}>
                          Tap + to log each item collected for laundry
                        </div>

                        {stockItemsLoading ? (
                          <div style={{ textAlign: 'center', padding: '12px 0', color: '#475569', fontSize: 10 }}>Loading items…</div>
                        ) : stockItems.length === 0 ? (
                          <div style={{ textAlign: 'center', padding: '10px 0' }}>
                            <div style={{ fontSize: 9.5, color: '#475569', marginBottom: 8 }}>No stock items in inventory.</div>
                            <button onClick={seedStockItems} disabled={stockItemsLoading}
                              style={{ padding: '7px 12px', borderRadius: 8, background: 'linear-gradient(135deg,#f87171,#dc2626)', border: 'none', color: '#fff', fontSize: 9.5, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>
                              ✨ Add Default Items
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {stockItems.map(item => {
                              const qty = laundryCounters[item.id] || 0
                              return (
                                <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, background: qty > 0 ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.02)', border: `1px solid ${qty > 0 ? 'rgba(239,68,68,0.25)' : 'rgba(255,255,255,0.06)'}`, borderRadius: 10, padding: '8px 10px', transition: 'all 0.15s' }}>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: 11.5, fontWeight: 800, color: qty > 0 ? '#fca5a5' : '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</div>
                                    <div style={{ fontSize: 8.5, color: '#475569', fontWeight: 600, marginTop: 1 }}>{item.unit || 'pcs'} · Stock: {item.currentStock}</div>
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                                    <button onClick={() => setLaundryCounters(prev => ({ ...prev, [item.id]: Math.max(0, (prev[item.id] || 0) - 1) }))}
                                      style={{ width: 28, height: 28, borderRadius: 7, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#94a3b8', fontSize: 15, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit' }}>−</button>
                                    <span style={{ fontSize: 14, fontWeight: 900, color: qty > 0 ? '#f87171' : '#334155', minWidth: 18, textAlign: 'center' }}>{qty}</span>
                                    <button onClick={() => setLaundryCounters(prev => ({ ...prev, [item.id]: (prev[item.id] || 0) + 1 }))}
                                      style={{ width: 28, height: 28, borderRadius: 7, border: '1px solid rgba(239,68,68,0.4)', background: 'rgba(239,68,68,0.15)', color: '#f87171', fontSize: 15, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit' }}>+</button>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}

                        {/* Total selected summary */}
                        {Object.values(laundryCounters).some(v => v > 0) && (
                          <div style={{ marginTop: 10, padding: '7px 10px', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 9.5, color: '#fca5a5', fontWeight: 800 }}>🧺 Total Collected</span>
                            <span style={{ fontSize: 13, fontWeight: 900, color: '#f87171' }}>{Object.values(laundryCounters).reduce((a, b) => a + b, 0)} items</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* ── Done / Skip Buttons ── */}
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button
                        onClick={() => {
                          setChecklistTicks(prev => { const n = [...prev]; n[checklistStep] = true; return n })
                          // If laundry step and items selected, auto-submit laundry log
                          if (checklistStep === 4 && checklistRoom && Object.values(laundryCounters).some(v => v > 0)) {
                            submitLaundry(checklistRoom)
                          }
                          setChecklistStep(s => s + 1)
                        }}
                        style={{
                          flex: 2, padding: '14px', borderRadius: 14, fontSize: 14, fontWeight: 900,
                          background: checklistStep === 4 && Object.values(laundryCounters).some(v => v > 0)
                            ? 'linear-gradient(135deg, #dc2626, #f87171)'
                            : 'linear-gradient(135deg, #10b981, #059669)',
                          border: 'none', color: '#fff', cursor: 'pointer', fontFamily: 'inherit',
                          boxShadow: checklistStep === 4 && Object.values(laundryCounters).some(v => v > 0)
                            ? '0 4px 20px rgba(239,68,68,0.35)'
                            : '0 4px 20px rgba(16,185,129,0.35)',
                          letterSpacing: '0.02em',
                        }}>
                        {checklistStep === 4 && Object.values(laundryCounters).some(v => v > 0)
                          ? `🧺 Log & Done (${Object.values(laundryCounters).reduce((a,b)=>a+b,0)} items)`
                          : '✅  Done'}
                      </button>
                      <button
                        onClick={() => {
                          setChecklistTicks(prev => { const n = [...prev]; n[checklistStep] = false; return n })
                          setChecklistStep(s => s + 1)
                        }}
                        style={{
                          flex: 1, padding: '14px', borderRadius: 14, fontSize: 12, fontWeight: 800,
                          background: 'rgba(255,255,255,0.04)',
                          border: '1.5px solid rgba(255,255,255,0.1)', color: '#64748b', cursor: 'pointer', fontFamily: 'inherit',
                        }}>
                        Skip
                      </button>
                    </div>

                    {checklistStep > 0 && (
                      <div style={{ textAlign: 'center', marginTop: 12 }}>
                        <button onClick={() => setChecklistStep(s => s - 1)}
                          style={{ background: 'none', border: 'none', color: '#475569', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                          ← Back to previous step
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* ── REVIEW STEP ── */
                <div style={{ padding: '16px 14px 24px' }}>

                  {/* Review Hero */}
                  <div style={{ textAlign: 'center', marginBottom: 18, padding: '16px', background: doneTicks === TOTAL_STEPS ? 'rgba(16,185,129,0.07)' : 'rgba(251,191,36,0.06)', borderRadius: 16, border: `1px solid ${doneTicks === TOTAL_STEPS ? 'rgba(16,185,129,0.2)' : 'rgba(251,191,36,0.15)'}` }}>
                    <div style={{ fontSize: 44, marginBottom: 8 }}>{doneTicks === TOTAL_STEPS ? '🌟' : '📋'}</div>
                    <div style={{ fontSize: 18, fontWeight: 900, color: '#f1f5f9', letterSpacing: '-0.01em' }}>
                      {doneTicks === TOTAL_STEPS ? 'All Steps Complete!' : `${doneTicks} of ${TOTAL_STEPS} done`}
                    </div>
                    <div style={{ fontSize: 10.5, color: '#64748b', marginTop: 4, fontWeight: 600 }}>Room {checklistRoom.roomNumber} · Review before marking clean</div>
                    {checklistRoom.checkIns[0]?.guest && (
                      <div style={{ marginTop: 6, fontSize: 9.5, color: '#a78bfa', fontWeight: 700 }}>
                        Guest: {checklistRoom.checkIns[0].guest.firstName} {checklistRoom.checkIns[0].guest.lastName}
                      </div>
                    )}
                  </div>

                  {/* ── Completed Steps Summary ── */}
                  {doneSteps.length > 0 && (
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ fontSize: 8.5, fontWeight: 900, color: '#34d399', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                        ✅ Completed Tasks ({doneSteps.length})
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                        {CLEAN_STEPS.map((step, i) => checklistTicks[i] ? (
                          <div key={i} style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(16,185,129,0.18)', background: 'rgba(16,185,129,0.05)' }}>
                            {/* Step header */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', borderBottom: '1px solid rgba(16,185,129,0.1)' }}>
                              <span style={{ fontSize: 16 }}>{step.emoji}</span>
                              <span style={{ flex: 1, fontSize: 11.5, fontWeight: 800, color: '#34d399' }}>{step.label}</span>
                              <span style={{ fontSize: 13 }}>✅</span>
                            </div>
                            {/* Step items - what was done */}
                            <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                              {step.items.map((item, idx) => (
                                <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                                  <span style={{ color: '#34d399', fontSize: 9, flexShrink: 0, marginTop: 1 }}>✓</span>
                                  <span style={{ fontSize: 10, color: '#64748b', fontWeight: 600, lineHeight: 1.3 }}>{item}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : null)}
                      </div>
                    </div>
                  )}

                  {/* ── Skipped Steps ── */}
                  {skippedSteps.length > 0 && (
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 8.5, fontWeight: 900, color: '#f87171', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                        ❌ Skipped / Not Done ({skippedSteps.length})
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {CLEAN_STEPS.map((step, i) => !checklistTicks[i] ? (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', borderRadius: 12, background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)' }}>
                            <span style={{ fontSize: 16 }}>{step.emoji}</span>
                            <span style={{ flex: 1, fontSize: 11.5, fontWeight: 700, color: '#f87171' }}>{step.label}</span>
                            <button
                              onClick={() => {
                                setChecklistTicks(prev => { const n = [...prev]; n[i] = true; return n })
                              }}
                              style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 7, padding: '3px 8px', fontSize: 8.5, fontWeight: 900, color: '#34d399', cursor: 'pointer', fontFamily: 'inherit' }}>
                              Mark Done
                            </button>
                          </div>
                        ) : null)}
                      </div>
                    </div>
                  )}

                  {/* ── Laundry Items Summary (if any collected) ── */}
                  {Object.values(laundryCounters).some(v => v > 0) && (
                    <div style={{ marginBottom: 14, background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 14, overflow: 'hidden' }}>
                      <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', gap: 7 }}>
                        <span style={{ fontSize: 16 }}>🧺</span>
                        <div>
                          <div style={{ fontSize: 10.5, fontWeight: 900, color: '#f87171' }}>Laundry Collected</div>
                          <div style={{ fontSize: 8.5, color: '#64748b', fontWeight: 600, marginTop: 1 }}>From Room {checklistRoom.roomNumber}</div>
                        </div>
                        <span style={{ marginLeft: 'auto', fontSize: 8.5, fontWeight: 900, padding: '2px 7px', borderRadius: 999, background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }}>
                          {Object.values(laundryCounters).reduce((a, b) => a + b, 0)} ITEMS
                        </span>
                      </div>
                      <div style={{ padding: '8px 14px', display: 'flex', flexDirection: 'column', gap: 5 }}>
                        {stockItems.filter(item => (laundryCounters[item.id] || 0) > 0).map(item => (
                          <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 10.5, color: '#94a3b8', fontWeight: 600 }}>{item.name}</span>
                            <span style={{ fontSize: 11, fontWeight: 900, color: '#f87171' }}>× {laundryCounters[item.id]}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ── Kit Items Summary (always shown) ── */}
                  <div style={{ marginBottom: 16, background: 'rgba(251,191,36,0.05)', border: '1px solid rgba(251,191,36,0.15)', borderRadius: 14, overflow: 'hidden' }}>
                    <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(251,191,36,0.12)', display: 'flex', alignItems: 'center', gap: 7 }}>
                      <span style={{ fontSize: 16 }}>🧴</span>
                      <div>
                        <div style={{ fontSize: 10.5, fontWeight: 900, color: '#fbbf24' }}>Amenities Kit Placed</div>
                        <div style={{ fontSize: 8.5, color: '#64748b', fontWeight: 600, marginTop: 1 }}>Items stocked in bathroom</div>
                      </div>
                      <span style={{ marginLeft: 'auto', fontSize: 8.5, fontWeight: 900, padding: '2px 7px', borderRadius: 999, background: checklistTicks[3] ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.12)', color: checklistTicks[3] ? '#34d399' : '#f87171', border: `1px solid ${checklistTicks[3] ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.2)'}` }}>
                        {checklistTicks[3] ? 'STOCKED' : 'SKIPPED'}
                      </span>
                    </div>
                    <div style={{ padding: '8px 12px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '5px 8px' }}>
                      {kitStep.items.map((item, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <span style={{ fontSize: 9.5, color: checklistTicks[3] ? '#fbbf24' : '#475569', flexShrink: 0 }}>{checklistTicks[3] ? '✓' : '○'}</span>
                          <span style={{ fontSize: 9.5, color: '#64748b', fontWeight: 600, lineHeight: 1.25, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ── Final action buttons (Sticky Safe Area) ── */}
                  <div style={{ display: 'flex', gap: 8, position: 'sticky', bottom: 0, padding: '10px 0 calc(10px + env(safe-area-inset-bottom, 0px))', background: 'rgba(7,10,16,0.95)', backdropFilter: 'blur(16px)' }}>
                    <button onClick={() => setChecklistStep(TOTAL_STEPS - 1)}
                      style={{ flex: 1, padding: '12px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', fontSize: 11, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
                      ← Back
                    </button>
                    <button
                      onClick={() => {
                        updateHKStatus(checklistRoom.id, 'CLEAN')
                        setRoomChecklist(prev => ({ ...prev, [checklistRoom.id]: [...checklistTicks] }))
                        setChecklistRoom(null)
                      }}
                      disabled={updatingId === checklistRoom.id}
                      style={{
                        flex: 2.5, padding: '12px', borderRadius: 12, fontSize: 12, fontWeight: 900,
                        background: 'linear-gradient(135deg,#10b981,#059669)',
                        border: 'none', color: '#fff', cursor: 'pointer', fontFamily: 'inherit',
                        boxShadow: '0 4px 20px rgba(16,185,129,0.35)',
                        opacity: updatingId === checklistRoom.id ? 0.6 : 1,
                        letterSpacing: '0.02em',
                      }}>
                      {updatingId === checklistRoom.id ? 'Updating…' : '✅ Mark Room Clean'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom safe area */}
            <div style={{ height: 'env(safe-area-inset-bottom, 0px)', flexShrink: 0 }} />
          </div>
        )
      })()}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&display=swap');
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(0.92); }
        }
        @keyframes dirtyPulse {
          0%, 100% { opacity: 0.6; box-shadow: 0 0 8px rgba(248,113,113,0.3); }
          50% { opacity: 1; box-shadow: 0 0 18px rgba(248,113,113,0.6); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        input::placeholder { color: rgba(148,163,184,0.3) }
        ::-webkit-scrollbar { display: none }
        button { touch-action: manipulation; }
        button:active { transform: scale(0.97); }
        body { overscroll-behavior-y: none; }
      `}</style>
    </div>
  )
}
