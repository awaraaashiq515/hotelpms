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
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            locationStr = `GPS (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}) - Geofenced`
          },
          () => {},
          { timeout: 3000 }
        )
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
    { key: 'lostfound', label: 'Lost/Found', emoji: '💼' },
    { key: 'attendance', label: 'Attend.', emoji: '📅' },
    { key: 'supplies', label: 'Supplies', emoji: '📦' },
    { key: 'settings', label: 'Settings', emoji: '⚙️' },
  ]

  return (
    <div style={{ height: '100dvh', maxWidth: 500, margin: '0 auto', background: '#06070c', fontFamily: '"Outfit","Inter",-apple-system,sans-serif', color: '#f1f5f9', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Toaster richColors position="top-center" theme="dark" />

      {/* ─── HEADER (Glassmorphic Premium) ─── */}
      <header style={{ flexShrink: 0, padding: '11px 16px', background: 'linear-gradient(135deg, rgba(124,58,237,0.08) 0%, rgba(6,7,12,0.95) 100%)', borderBottom: '1px solid rgba(124,58,237,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backdropFilter: 'blur(24px)', boxShadow: '0 4px 24px rgba(0,0,0,0.4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.fullName}
              style={{ width: 38, height: 38, borderRadius: 12, objectFit: 'cover', border: '2px solid rgba(124,58,237,0.5)', flexShrink: 0, boxShadow: '0 0 12px rgba(124,58,237,0.25)' }} />
          ) : (
            <div style={{ width: 38, height: 38, borderRadius: 12, background: 'linear-gradient(135deg,#7c3aed,#db2777)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, boxShadow: '0 0 20px rgba(124,58,237,0.4)', flexShrink: 0 }}>🧹</div>
          )}
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.1, color: '#f8fafc' }}>{propName}</div>
            <div style={{ fontSize: 9, color: '#a78bfa', fontWeight: 700, marginTop: 3, letterSpacing: '0.04em' }}>
              {user.fullName} · Housekeeper
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: isOnline ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${isOnline ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`, borderRadius: 20, padding: '4px 10px', fontSize: 9, fontWeight: 800, color: isOnline ? '#34d399' : '#f87171' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: isOnline ? '#34d399' : '#f87171', boxShadow: isOnline ? '0 0 6px #34d399' : '0 0 6px #f87171', animation: 'pulse 2s infinite' }} />
            {isOnline ? 'LIVE' : 'OFFLINE'}
          </div>
          <button onClick={handleLogout} style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '7px 12px', cursor: 'pointer', color: '#f87171', fontSize: 10, fontWeight: 800, fontFamily: 'inherit' }}>
            ⏻
          </button>
        </div>
      </header>

      {/* ─── LIVE RUNNING TIMER FLOATING BANNER ─── */}
      {activeTimerRoomId && (
        <div style={{ flexShrink: 0, background: 'linear-gradient(90deg,#047857,#065f46)', padding: '6px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(52,211,153,0.25)', animation: 'pulse 2.2s infinite' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="animate-pulse" style={{ fontSize: 10 }}>🟢</span>
            <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Active Cleaning: Room #{rooms.find(r=>r.id===activeTimerRoomId)?.roomNumber}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 11, fontFamily: 'monospace', fontWeight: 900, background: 'rgba(0,0,0,0.2)', padding: '2px 8px', borderRadius: 5 }}>{formatElapsedTime(elapsedSeconds)}</span>
            <button onClick={stopStopwatch} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 4, padding: '2px 6px', color: '#fff', fontSize: 9, fontWeight: 900, cursor: 'pointer' }}>STOP</button>
          </div>
        </div>
      )}

      {/* ─── VIEWPORT MAIN CONTENT ─── */}
      <div style={{ flex: 1, overflowY: 'auto' }}>

        {/* ══ ROOMS GRID TAB ══ */}
        {activeTab === 'rooms' && (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Sticky Filters Block */}
            <div style={{ padding: '12px 14px 0', background: 'rgba(6,7,12,0.98)', position: 'sticky', top: 0, zIndex: 10, backdropFilter: 'blur(20px)' }}>
              {/* Premium Stats Bar */}
              <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                {[
                  { label: 'Clean', val: stats.clean, color: '#34d399', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.2)', icon: '✅' },
                  { label: 'Dirty', val: stats.dirty, color: '#f87171', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.2)', icon: '🧹' },
                  { label: 'Inspect', val: stats.inspecting, color: '#818cf8', bg: 'rgba(99,102,241,0.1)', border: 'rgba(99,102,241,0.2)', icon: '🔍' },
                  { label: 'Tasks', val: stats.tasks, color: '#fbbf24', bg: 'rgba(251,191,36,0.1)', border: 'rgba(251,191,36,0.2)', icon: '📋' },
                ].map(s => (
                  <div key={s.label} style={{ flex: 1, background: s.bg, border: `1px solid ${s.border}`, borderRadius: 12, padding: '8px 4px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ fontSize: 9, marginBottom: 2 }}>{s.icon}</div>
                    <div style={{ fontSize: 20, fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.val}</div>
                    <div style={{ fontSize: 7.5, color: s.color, opacity: 0.7, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: 2 }}>{s.label}</div>
                    {s.val > 0 && s.label === 'Dirty' && <div style={{ position: 'absolute', top: 4, right: 4, width: 5, height: 5, borderRadius: '50%', background: s.color, animation: 'pulse 1.5s infinite' }} />}
                  </div>
                ))}
              </div>

              {/* Advanced Search bar */}
              <div style={{ position: 'relative', marginBottom: 10 }}>
                <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                  placeholder="🔍  Search room number or floor level…"
                  style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, color: '#f1f5f9', fontSize: 12, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
              </div>

              {/* Floor Segment Filter Bar */}
              {floors.length > 2 && (
                <div style={{ display: 'flex', gap: 5, overflowX: 'auto', marginBottom: 10, scrollbarWidth: 'none', paddingBottom: 2 }}>
                  {floors.map(fl => {
                    const isFActive = selectedFloor === fl
                    return (
                      <button key={fl} onClick={() => setSelectedFloor(fl ?? 'ALL')}
                        style={{ flexShrink: 0, padding: '4px 10px', borderRadius: 8, fontSize: 9, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', border: isFActive ? '1px solid rgba(124,58,237,0.4)' : '1px solid rgba(255,255,255,0.05)', background: isFActive ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.02)', color: isFActive ? '#c084fc' : '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        🏢 {fl === 'ALL' ? 'All Floors' : `Floor ${fl}`}
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Horizontal filter scroll chips */}
              <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 10, scrollbarWidth: 'none' }}>
                {['ALL', ...HK_STATUS_KEYS].map(s => {
                  const cfg = HK_STATUS[s]
                  const isActive = filterStatus === s
                  return (
                    <button key={s} onClick={() => setFilterStatus(s)}
                      style={{ flexShrink: 0, padding: '5px 12px', borderRadius: 999, fontSize: 10, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', border: isActive ? `1.5px solid ${cfg?.color || '#6366f1'}` : '1.5px solid rgba(255,255,255,0.06)', background: isActive ? (cfg ? cfg.bg : 'rgba(124,58,237,0.15)') : 'rgba(255,255,255,0.02)', color: isActive ? (cfg?.color || '#a78bfa') : '#64748b', transition: 'all 0.15s' }}>
                      {cfg?.emoji} {cfg?.label || 'All Rooms'}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Room lists cards */}
            {roomsLoading ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, color: '#64748b', fontSize: 12 }}>
                <div style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid #a78bfa', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
                Loading hotel rooms…
              </div>
            ) : (
              <div style={{ padding: '0 14px 90px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
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
                        borderRadius: 18, padding: '0', cursor: 'pointer', position: 'relative',
                        opacity: updatingId === room.id ? 0.5 : 1,
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        boxShadow: room.housekeepingStatus === 'DIRTY'
                          ? `0 0 16px ${hkCfg.border}, 0 4px 16px rgba(0,0,0,0.5)`
                          : room.isVIP ? '0 0 16px rgba(251,191,36,0.15), 0 4px 16px rgba(0,0,0,0.5)'
                          : '0 4px 16px rgba(0,0,0,0.4)',
                        overflow: 'hidden',
                      }}>

                      {/* Dirty rooms get animated border glow */}
                      {room.housekeepingStatus === 'DIRTY' && (
                        <div style={{ position: 'absolute', inset: 0, borderRadius: 18, border: `1.5px solid ${hkCfg.color}`, animation: 'dirtyPulse 2s ease-in-out infinite', pointerEvents: 'none', zIndex: 0 }} />
                      )}

                      {/* Card Top: Room number + floor + status */}
                      <div style={{ padding: '12px 13px 8px', position: 'relative', zIndex: 1 }} onClick={() => {
                        if (room.housekeepingStatus === 'DIRTY') {
                          setChecklistRoom(room); setChecklistTicks(Array(CLEAN_STEPS.length).fill(false)); setItemStatuses({}); setChecklistStep(0)
                        } else {
                          setSelectedRoom(room); setActiveMaintTickets([])
                        }
                      }}>

                        {/* Room Number Row */}
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 5 }}>
                          <div>
                            <div style={{ fontSize: 22, fontWeight: 900, color: '#f8fafc', letterSpacing: '-0.03em', lineHeight: 1 }}>{room.roomNumber}</div>
                            <div style={{ fontSize: 8, color: '#64748b', fontWeight: 700, marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                              {room.floor ? `Floor ${room.floor} · ` : ''}{room.roomType.name}
                            </div>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                            {room.isVIP && <span style={{ background: 'linear-gradient(135deg,#fbbf24,#f59e0b)', color: '#000', fontSize: 8, fontWeight: 900, padding: '2px 7px', borderRadius: 6, letterSpacing: '0.05em' }}>⭐ VIP</span>}
                            {hasTasks && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fbbf24', boxShadow: '0 0 8px #fbbf24', animation: 'pulse 1.5s infinite' }} />}
                          </div>
                        </div>

                        {/* Status Chip */}
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 9, fontWeight: 900, padding: '3px 9px', borderRadius: 999, background: hkCfg.bg, color: hkCfg.color, border: `1px solid ${hkCfg.border}`, marginBottom: 6, letterSpacing: '0.04em' }}>
                          {hkCfg.emoji} {hkCfg.label}
                        </span>

                        {/* Guest chip - visible */}
                        {guest && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.2)', borderRadius: 8, padding: '3px 8px', marginBottom: 4 }}>
                            <span style={{ fontSize: 9 }}>👤</span>
                            <span style={{ fontSize: 9, color: '#93c5fd', fontWeight: 700 }}>{guest.firstName} {guest.lastName}</span>
                          </div>
                        )}

                        {/* Assigned to You badge */}
                        {room.maintenanceStatus?.startsWith('ASSIGNED:') && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.25)', borderRadius: 8, padding: '3px 8px', marginBottom: 4 }}>
                            <span style={{ fontSize: 9 }}>📌</span>
                            <span style={{ fontSize: 9, color: '#a78bfa', fontWeight: 800 }}>Assigned to You</span>
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
                          <div style={{ fontSize: 8, color: '#34d399', marginTop: 5, fontWeight: 900, letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#34d399', animation: 'pulse 1s infinite' }} />
                            LIVE {formatElapsedTime(elapsedSeconds)}
                          </div>
                        )}
                      </div>

                      {/* Quick Action Buttons — full width bottom strip */}
                      <div style={{ display: 'flex', borderTop: `1px solid ${hkCfg.border}`, background: 'rgba(0,0,0,0.25)' }} onClick={e => e.stopPropagation()}>
                        <button onClick={() => updateHKStatus(room.id, 'DIRTY')}
                          style={{ flex: 1, padding: '9px 0', borderRight: '1px solid rgba(255,255,255,0.05)', fontSize: 9, fontWeight: 900, background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '0.02em' }}>
                          🧹 Dirty
                        </button>
                        <button onClick={() => { setChecklistRoom(room); setChecklistTicks(Array(CLEAN_STEPS.length).fill(false)); setItemStatuses({}); setChecklistStep(0) }}
                          style={{ flex: 1.6, padding: '9px 0', fontSize: 9, fontWeight: 900, background: room.housekeepingStatus === 'DIRTY' ? 'linear-gradient(90deg,rgba(16,185,129,0.25),rgba(5,150,105,0.25))' : 'none', border: 'none', color: '#34d399', cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '0.02em' }}>
                          ✅ Clean & Log
                        </button>
                        <button onClick={() => { setSelectedRoom(room); setActiveMaintTickets([]) }}
                          style={{ flex: 1, padding: '9px 0', fontSize: 9, fontWeight: 900, background: 'none', border: 'none', borderLeft: '1px solid rgba(255,255,255,0.05)', color: '#94a3b8', cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '0.02em' }}>
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
          <div style={{ padding: '14px 14px 90px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: 9, fontWeight: 900, color: '#7c3aed', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                📋 Tasks Assignees ({allTasks.length})
              </div>
            </div>
            
            {allTasks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', background: 'rgba(255,255,255,0.01)', border: '1px dashed rgba(255,255,255,0.05)', borderRadius: 20 }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>✅</div>
                <div style={{ color: '#34d399', fontSize: 13, fontWeight: 900 }}>Perfect Schedule!</div>
                <div style={{ color: '#475569', fontSize: 10, marginTop: 4, fontWeight: 600 }}>All housekeeping tasks are checked off.</div>
              </div>
            ) : allTasks.map(task => (
              <div key={task.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 14, padding: '12px 14px', marginBottom: 9 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 900, color: '#f1f5f9', marginBottom: 3 }}>
                      Room #{(task as any).roomNumber} · {task.taskType.replace(/_/g, ' ')}
                    </div>
                    {task.priority && (
                      <span style={{ fontSize: 8, fontWeight: 900, padding: '2px 7px', borderRadius: 999, background: task.priority === 'HIGH' ? 'rgba(239,68,68,0.12)' : 'rgba(251,191,36,0.12)', color: task.priority === 'HIGH' ? '#f87171' : '#fbbf24', display: 'inline-block', marginBottom: 3 }}>
                        PRIORITY: {task.priority}
                      </span>
                    )}
                    <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700 }}>
                      Status: {task.status}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginLeft: 10 }}>
                    {task.status !== 'IN_PROGRESS' && (
                      <button onClick={() => updateTask(task.id, (task as any).roomId, 'IN_PROGRESS')}
                        style={{ padding: '5px 10px', borderRadius: 8, fontSize: 9, fontWeight: 800, cursor: 'pointer', border: '1px solid rgba(124,58,237,0.4)', background: 'rgba(124,58,237,0.15)', color: '#c084fc', fontFamily: 'inherit' }}>
                        Start
                      </button>
                    )}
                    <button onClick={() => updateTask(task.id, (task as any).roomId, 'COMPLETED')}
                      style={{ padding: '5px 10px', borderRadius: 8, fontSize: 9, fontWeight: 800, cursor: 'pointer', border: '1px solid rgba(16,185,129,0.4)', background: 'rgba(16,185,129,0.15)', color: '#34d399', fontFamily: 'inherit' }}>
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
          <div style={{ padding: '14px 14px 90px' }}>
            <div style={{ fontSize: 9, fontWeight: 900, color: '#7c3aed', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 12 }}>
              💼 Lost & Found Logger
            </div>

            {/* Quick logging form */}
            <form onSubmit={handleLogLostItem} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 16, padding: '16px', marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#a78bfa', marginBottom: 10 }}>LOG FOUND ITEM</div>
              
              <div style={{ marginBottom: 10 }}>
                <input value={lostItemName} onChange={e => setLostItemName(e.target.value)}
                  placeholder="Item Name (e.g. Black Watch, Leather Wallet)"
                  style={{ width: '100%', padding: '9px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: '#f1f5f9', fontSize: 11, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
              </div>

              <div style={{ marginBottom: 10, display: 'flex', gap: 8 }}>
                <input value={lostItemRoom} onChange={e => setLostItemRoom(e.target.value)}
                  placeholder="Room (e.g. 102)"
                  style={{ flex: 1, padding: '9px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: '#f1f5f9', fontSize: 11, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
                
                <button type="submit" style={{ padding: '9px 16px', borderRadius: 10, background: 'linear-gradient(135deg,#7c3aed,#db2777)', border: 'none', color: '#fff', fontSize: 10, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>
                  SUBMIT LOG
                </button>
              </div>

              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input value={lostItemDesc} onChange={e => setLostItemDesc(e.target.value)}
                  placeholder="Brief Description (marks, brand, case color…)"
                  style={{ width: '100%', padding: '9px 40px 9px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: '#f1f5f9', fontSize: 11, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
                <button type="button" onClick={() => startVoiceRecognition(setLostItemDesc)}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, padding: 2 }}>
                  {isVoiceListening ? '🔴' : '🎙️'}
                </button>
              </div>
            </form>

            {/* Registry List */}
            <div style={{ fontSize: 9, fontWeight: 900, color: '#475569', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>Recent Logged items</div>
            {lostItems.length === 0 ? (
              <div style={{ textTransform: 'uppercase', textAlign: 'center', padding: '30px 0', fontSize: 9, color: '#334155', fontWeight: 700 }}>No items currently registered</div>
            ) : lostItems.map(item => (
              <div key={item.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12, padding: '12px 14px', marginBottom: 8, position: 'relative' }}>
                <button onClick={() => deleteLostItem(item.id)} style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', color: '#f87171', cursor: 'pointer' }}>
                  <Trash2 size={13} />
                </button>
                <div style={{ fontSize: 12, fontWeight: 900, color: '#fbbf24', marginBottom: 2 }}>{item.item}</div>
                <div style={{ fontSize: 10, color: '#a78bfa', fontWeight: 800 }}>Room #{item.room} · Found: {item.foundAt}</div>
                {item.description && <div style={{ fontSize: 10, color: '#64748b', marginTop: 4 }}>Desc: {item.description}</div>}
              </div>
            ))}
          </div>
        )}

        {/* ══ ATTENDANCE ROSTER TAB ══ */}
        {activeTab === 'attendance' && (
          <div style={{ padding: '14px 14px 90px' }}>
            <div style={{ fontSize: 9, fontWeight: 900, color: '#7c3aed', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 12 }}>
              📅 Attendance
            </div>
            
            {/* Action Card */}
            <div style={{ background: clockedIn ? 'rgba(16,185,129,0.07)' : 'rgba(255,255,255,0.02)', border: `1.5px solid ${clockedIn ? 'rgba(16,185,129,0.25)' : 'rgba(255,255,255,0.05)'}`, borderRadius: 16, padding: '22px 16px', marginBottom: 16, textAlign: 'center' }}>
              <div style={{ fontSize: 34, marginBottom: 8 }}>{clockedIn ? '🟢' : '⭕'}</div>
              <div style={{ fontSize: 14, fontWeight: 900, color: clockedIn ? '#34d399' : '#64748b', marginBottom: 4 }}>
                {clockedIn ? 'ON DUTY' : 'NOT CLOCKED IN'}
              </div>
              <div style={{ fontSize: 10, color: '#475569', marginBottom: 16 }}>
                {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
              </div>
              <button
                onClick={async () => {
                  try {
                    const endpoint = clockedIn ? '/api/staff-attendance/clock-out' : '/api/staff-attendance/clock-in'
                    const res = await fetch(endpoint, {
                      method: 'POST',
                      headers: { Authorization: `Bearer ${wtToken}` },
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
                style={{ padding: '11px 32px', borderRadius: 12, background: clockedIn ? 'rgba(239,68,68,0.15)' : 'linear-gradient(135deg,#7c3aed,#db2777)', border: clockedIn ? '1px solid rgba(239,68,68,0.3)' : 'none', color: clockedIn ? '#f87171' : '#fff', fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>
                {clockedIn ? '⏸ CLOCK OUT' : '▶ CLOCK IN'}
              </button>
            </div>

            {/* Attendance list log */}
            <div style={{ fontSize: 9, fontWeight: 900, color: '#475569', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>Attendance History</div>
            {attLoading ? (
              <div style={{ textAlign: 'center', padding: '20px', color: '#475569', fontSize: 11 }}>Loading attendance records…</div>
            ) : attendance.slice(0, 10).map(r => (
              <div key={r.id} style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12, padding: '12px 14px', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: '#f1f5f9' }}>{new Date(r.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</div>
                  <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>
                    In: {r.clockIn ? new Date(r.clockIn).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}
                    {r.clockOut ? ` · Out: ${new Date(r.clockOut).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}` : ''}
                  </div>
                </div>
                <span style={{ fontSize: 9, fontWeight: 900, padding: '4px 10px', borderRadius: 999, background: r.status === 'PRESENT' ? 'rgba(16,185,129,0.1)' : r.status === 'LEAVE' ? 'rgba(251,191,36,0.1)' : 'rgba(239,68,68,0.1)', color: r.status === 'PRESENT' ? '#34d399' : r.status === 'LEAVE' ? '#fbbf24' : '#f87171' }}>
                  {r.status}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* ══ SUPPLY RESTOCK REQUEST TAB ══ */}
        {activeTab === 'supplies' && (
          <div style={{ padding: '14px 14px 90px' }}>
            <div style={{ fontSize: 9, fontWeight: 900, color: '#7c3aed', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 4 }}>
              📦 Supply Restock Request
            </div>
            <div style={{ fontSize: 10, color: '#475569', fontWeight: 600, marginBottom: 16 }}>
              Tap + or − to set quantities needed, then submit to the supply room.
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {Object.entries(suppliesRequest).map(([item, qty]) => (
                <div key={item} style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${qty > 0 ? 'rgba(124,58,237,0.25)' : 'rgba(255,255,255,0.05)'}`, borderRadius: 14, padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'border-color 0.2s' }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: qty > 0 ? '#c084fc' : '#94a3b8' }}>{item}</div>
                    {qty > 0 && <div style={{ fontSize: 9, color: '#7c3aed', fontWeight: 700, marginTop: 2 }}>Requesting {qty} unit{qty > 1 ? 's' : ''}</div>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button onClick={() => setSuppliesRequest(prev => ({ ...prev, [item]: Math.max(0, (prev[item] || 0) - 1) }))}
                      style={{ width: 28, height: 28, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#94a3b8', fontSize: 14, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                    <span style={{ fontSize: 14, fontWeight: 900, color: qty > 0 ? '#f1f5f9' : '#475569', minWidth: 20, textAlign: 'center' }}>{qty}</span>
                    <button onClick={() => setSuppliesRequest(prev => ({ ...prev, [item]: (prev[item] || 0) + 1 }))}
                      style={{ width: 28, height: 28, borderRadius: 8, border: '1px solid rgba(124,58,237,0.3)', background: 'rgba(124,58,237,0.12)', color: '#c084fc', fontSize: 14, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary + Send */}
            {Object.values(suppliesRequest).some(v => v > 0) && (
              <div style={{ marginTop: 16, background: 'rgba(124,58,237,0.07)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 14, padding: '14px' }}>
                <div style={{ fontSize: 10, fontWeight: 900, color: '#c084fc', marginBottom: 10, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Order Summary</div>
                {Object.entries(suppliesRequest).filter(([, qty]) => qty > 0).map(([item, qty]) => (
                  <div key={item} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#94a3b8', fontWeight: 700, marginBottom: 5 }}>
                    <span>{item}</span>
                    <span style={{ color: '#f1f5f9' }}>× {qty}</span>
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
                  style={{ width: '100%', marginTop: 12, padding: '11px', borderRadius: 11, background: 'linear-gradient(135deg,#7c3aed,#db2777)', border: 'none', color: '#fff', fontSize: 11, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  📦 Send Supply Request to Stock Room
                </button>
              </div>
            )}

            {!Object.values(suppliesRequest).some(v => v > 0) && (
              <div style={{ textAlign: 'center', padding: '30px 0', color: '#334155', fontSize: 10, fontWeight: 700 }}>
                Use the + buttons above to request supplies
              </div>
            )}
          </div>
        )}

        {/* ══ LAUNDRY PICKUP TAB ══ */}
        {activeTab === 'laundry' && (
          <div style={{ padding: '14px 14px 90px' }}>
            <div style={{ fontSize: 9, fontWeight: 900, color: '#06b6d4', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 4 }}>
              🧺 Laundry Pickup Log
            </div>
            <div style={{ fontSize: 10, color: '#475569', fontWeight: 600, marginBottom: 16 }}>
              Log laundry collected from rooms. Auto-deducts from inventory stock.
            </div>

            {/* Room selector */}
            <div style={{ background: 'rgba(6,182,212,0.05)', border: '1px solid rgba(6,182,212,0.15)', borderRadius: 14, padding: '12px 14px', marginBottom: 14 }}>
              <div style={{ fontSize: 9, fontWeight: 900, color: '#22d3ee', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
                Select Room
              </div>
              <select value={laundryRoom} onChange={e => setLaundryRoom(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(6,182,212,0.2)', borderRadius: 10, color: laundryRoom ? '#f1f5f9' : '#475569', fontSize: 11, fontFamily: 'inherit', outline: 'none' }}>
                <option value="">— Pick a Room —</option>
                {rooms.map(r => (
                  <option key={r.id} value={r.id}>Room {r.roomNumber}{r.floor ? ` (Floor ${r.floor})` : ''}</option>
                ))}
              </select>
            </div>

            {/* Items picker */}
            <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 14, padding: '12px 14px', marginBottom: 14 }}>
              <div style={{ fontSize: 9, fontWeight: 900, color: '#94a3b8', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10, display: 'flex', justifyContent: 'space-between' }}>
                <span>Items Collected</span>
                <span style={{ color: '#475569', fontWeight: 600 }}>Picked from inventory stock</span>
              </div>

              {stockItemsLoading ? (
                <div style={{ textAlign: 'center', padding: '16px 0', color: '#475569', fontSize: 10 }}>Loading items…</div>
              ) : stockItems.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '16px 0', color: '#64748b', fontSize: 10 }}>
                  <div style={{ marginBottom: 8 }}>No stock items found in inventory.</div>
                  <button onClick={seedStockItems} disabled={stockItemsLoading}
                    style={{ padding: '8px 14px', borderRadius: 8, background: 'linear-gradient(135deg, #06b6d4, #0891b2)', border: 'none', color: '#fff', fontSize: 10, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>
                    ✨ Add Default Housekeeping Stock Items
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {stockItems.map(item => {
                    const qty = laundryCounters[item.id] || 0
                    return (
                      <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: qty > 0 ? 'rgba(6,182,212,0.08)' : 'rgba(255,255,255,0.02)', border: `1px solid ${qty > 0 ? 'rgba(6,182,212,0.2)' : 'rgba(255,255,255,0.05)'}`, borderRadius: 10, padding: '9px 12px', transition: 'all 0.15s' }}>
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 800, color: qty > 0 ? '#22d3ee' : '#94a3b8' }}>{item.name}</div>
                          <div style={{ fontSize: 9, color: '#475569', fontWeight: 600 }}>{item.unit || 'pcs'} · Stock: {item.currentStock}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
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
                style={{ width: '100%', marginBottom: 16, padding: '13px', borderRadius: 12, background: 'linear-gradient(135deg,#0891b2,#06b6d4)', border: 'none', color: '#fff', fontSize: 11, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '0.04em', textTransform: 'uppercase', opacity: submittingLaundry ? 0.6 : 1 }}>
                {submittingLaundry ? 'Logging…' : `🧺 Log ${Object.values(laundryCounters).reduce((a, b) => a + b, 0)} Laundry Item(s)`}
              </button>
            )}

            {/* Today's Laundry Log */}
            <div>
              <div style={{ fontSize: 9, fontWeight: 900, color: '#475569', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>📋 Today&apos;s Pickups</span>
                <button onClick={fetchLaundryLogs} style={{ background: 'none', border: 'none', color: '#22d3ee', fontSize: 9, fontWeight: 800, cursor: 'pointer' }}>↻ Refresh</button>
              </div>

              {laundryLogsLoading ? (
                <div style={{ textAlign: 'center', padding: '16px 0', color: '#475569', fontSize: 10 }}>Loading logs…</div>
              ) : laundryLogs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px 0', color: '#334155', fontSize: 10, fontWeight: 700 }}>
                  No laundry pickups logged today
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {laundryLogs.map((log: any) => (
                    <div key={log.id} style={{ background: 'rgba(6,182,212,0.04)', border: '1px solid rgba(6,182,212,0.12)', borderRadius: 12, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 800, color: '#f1f5f9' }}>{log.stockItem?.name || 'Item'}</div>
                        <div style={{ fontSize: 9, color: '#475569', fontWeight: 600, marginTop: 2 }}>
                          Room: {log.referenceId?.slice(-8) || '—'} · {new Date(log.movementDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 900, color: '#22d3ee' }}>×{log.qtyOut}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══ WALKIE-TALIE TTS / CONFIG SETTINGS TAB ══ */}
        {activeTab === 'settings' && (
          <div style={{ padding: '14px 14px 90px' }}>
            
            {/* Quick Broadcast Console */}
            <div style={{ fontSize: 9, fontWeight: 900, color: '#7c3aed', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 12 }}>
              📢 Walkie Talkie - Quick Broadcast
            </div>
            
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 16, padding: '16px', marginBottom: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <Radio size={14} className="text-pink-500 animate-pulse" />
                <span style={{ fontSize: 10, fontWeight: 900, color: '#94a3b8' }}>PRE-SET VOICE BROADCASTS</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {[
                  { text: 'Floor 2 Housekeeping completed', label: '🧹 Floor 2 Completed' },
                  { text: 'Ready for room inspection on Floor 3', label: '🔍 Ready for Inspection' },
                  { text: 'Extra water bottles and towels required', label: '🧴 Need Restock supplies' },
                  { text: 'Reporting high priority maintenance issue', label: '🔧 Report Maintenance' },
                  { text: 'Manager assistance requested immediately', label: '🚨 Request Manager' }
                ].map(b => (
                  <button key={b.text} onClick={() => triggerTTSAlert(b.text)}
                    style={{ textTransform: 'uppercase', padding: '9px 12px', background: 'rgba(255,255,255,0.03)', border: '1.5px solid rgba(255,255,255,0.05)', borderRadius: 10, color: '#a78bfa', fontSize: 10, fontWeight: 800, textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit', display: 'block', transition: 'all 0.15s' }}>
                    {b.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ fontSize: 9, fontWeight: 900, color: '#475569', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10 }}>My Profile Photo</div>

            {/* Profile Photo Uploader Card */}
            <div style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.12), rgba(219,39,119,0.06))', border: '1px solid rgba(124,58,237,0.25)', borderRadius: 16, padding: '16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
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
                <div style={{ fontSize: 13, fontWeight: 900, color: '#fff', letterSpacing: '-0.01em' }}>{user.fullName}</div>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#c084fc', marginTop: 2 }}>{user.designation || 'Executive Housekeeper'}</div>
                <div style={{ fontSize: 9, color: '#94a3b8', marginTop: 3 }}>Tap photo to upload from camera or phone</div>
              </div>
            </div>

            <div style={{ fontSize: 9, fontWeight: 900, color: '#475569', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10 }}>Account Credentials</div>
            
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 14, overflow: 'hidden' }}>
              {[
                ['👤 Full Name', user.fullName],
                ['🧹 Role Assigned', user.designation || 'Executive Housekeeper'],
                ['🏨 Hotel Property', propName],
                ['📧 Email Node', user.email],
              ].map(([l, v]) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <span style={{ fontSize: 10, color: '#64748b', fontWeight: 800 }}>{l}</span>
                  <span style={{ fontSize: 11, color: '#f1f5f9', fontWeight: 800, maxWidth: '60%', textAlign: 'right' }}>{v}</span>
                </div>
              ))}
            </div>

            {/* ── UPI for Tips Section ── */}
            <StaffUpiSettingCard user={user} wtToken={wtToken} />

            <button onClick={handleLogout}
              style={{ width: '100%', marginTop: 20, padding: '13px', borderRadius: 13, background: 'rgba(239,68,68,0.08)', border: '1.5px solid rgba(239,68,68,0.2)', color: '#f87171', fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              ⏻ Sign Out & Clear Local Session
            </button>
          </div>
        )}
      </div>

      {/* ─── BOTTOM NAVIGATION TABS ─── */}
      <nav style={{ flexShrink: 0, padding: '8px 10px calc(8px + env(safe-area-inset-bottom))', background: 'rgba(255,255,255,0.015)', borderTop: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)', display: 'flex', gap: 4 }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '7px 4px', borderRadius: 10, border: 'none', cursor: 'pointer', background: activeTab === t.key ? 'rgba(124,58,237,0.12)' : 'transparent', color: activeTab === t.key ? '#c084fc' : '#475569', fontFamily: 'inherit', transition: 'all 0.15s' }}>
            <span style={{ fontSize: 16 }}>{t.emoji}</span>
            <span style={{ fontSize: 8, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{t.label}</span>
            {activeTab === t.key && <div style={{ width: 14, height: 2, background: '#7c3aed', borderRadius: 1, marginTop: 2 }} />}
          </button>
        ))}
      </nav>

      {/* ─── ROOM SHEET BOTTOM MODAL (Advanced Actions) ─── */}
      {/* ══ SIMPLE ROOM INFO BOTTOM SHEET ══ */}
      {selectedRoom && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          <div onClick={() => setSelectedRoom(null)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }} />

          <div style={{ position: 'relative', background: '#0d1117', borderRadius: '24px 24px 0 0', border: '1px solid rgba(255,255,255,0.08)', borderBottom: 'none', padding: '20px 20px calc(32px + env(safe-area-inset-bottom))' }}>
            {/* Drag handle */}
            <div style={{ width: 40, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.12)', margin: '0 auto 18px' }} />

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
              <div>
                <div style={{ fontSize: 22, fontWeight: 900, color: '#f1f5f9' }}>Room {selectedRoom.roomNumber}</div>
                <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700, marginTop: 2 }}>
                  {selectedRoom.floor ? `Floor ${selectedRoom.floor} · ` : ''}{selectedRoom.roomType.name}
                  {selectedRoom.checkIns[0]?.guest && ` · ${selectedRoom.checkIns[0].guest.firstName} ${selectedRoom.checkIns[0].guest.lastName}`}
                </div>
              </div>
              <button onClick={() => setSelectedRoom(null)}
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '7px 12px', color: '#94a3b8', cursor: 'pointer', fontSize: 11, fontWeight: 800, fontFamily: 'inherit' }}>
                ✕ Close
              </button>
            </div>

            {/* Current status badge */}
            <div style={{ marginBottom: 20 }}>
              {(() => {
                const cfg = HK_STATUS[selectedRoom.housekeepingStatus] || HK_STATUS.DIRTY
                return (
                  <span style={{ fontSize: 11, fontWeight: 900, padding: '5px 12px', borderRadius: 999, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                    {cfg.emoji} {cfg.label}
                  </span>
                )
              })()}
            </div>

            {/* Quick action buttons */}
            <div style={{ fontSize: 9, fontWeight: 900, color: '#475569', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>
              Change Status
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
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
                      display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
                      borderRadius: 14, cursor: isCurrent ? 'default' : 'pointer', fontFamily: 'inherit',
                      background: isCurrent ? btn.bg : 'rgba(255,255,255,0.03)',
                      border: `1.5px solid ${isCurrent ? btn.border : 'rgba(255,255,255,0.07)'}`,
                      opacity: isCurrent ? 1 : 0.85,
                      transition: 'all 0.15s',
                      textAlign: 'left',
                    }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: isCurrent ? btn.color : '#f1f5f9' }}>{btn.label}</div>
                      <div style={{ fontSize: 10, color: '#64748b', marginTop: 2, fontWeight: 600 }}>{btn.desc}</div>
                    </div>
                    {isCurrent && <span style={{ fontSize: 10, fontWeight: 900, color: btn.color }}>CURRENT</span>}
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
          
          <div style={{ position: 'relative', background: '#090a0f', borderRadius: '26px 26px 0 0', borderTop: '1.5px solid rgba(6,182,212,0.3)', padding: '20px 18px calc(30px + env(safe-area-inset-bottom))', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ width: 44, height: 4, borderRadius: 2, background: 'rgba(6,182,212,0.3)', margin: '0 auto 16px' }} />

            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 20, fontWeight: 900, color: '#f1f5f9' }}>🧺 Room {laundryModalRoom.roomNumber} Laundry</span>
                  <span style={{ background: 'rgba(6,182,212,0.15)', color: '#22d3ee', border: '1px solid rgba(6,182,212,0.3)', fontSize: 9, fontWeight: 900, padding: '2px 8px', borderRadius: 999 }}>LAUNDRY PICKUP</span>
                </div>
                <div style={{ fontSize: 10, color: '#64748b', marginTop: 4, fontWeight: 600 }}>
                  Tap + / − to set items collected from Room {laundryModalRoom.roomNumber}
                </div>
              </div>
              <button onClick={() => setLaundryModalRoom(null)} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 9, padding: '7px 11px', color: '#94a3b8', cursor: 'pointer', fontSize: 12, fontWeight: 800 }}>✕ Close</button>
            </div>

            {/* Items list with + / - buttons */}
            <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 16, padding: '12px 14px', marginBottom: 16 }}>
              {stockItemsLoading ? (
                <div style={{ textAlign: 'center', padding: '20px 0', color: '#475569', fontSize: 11 }}>Loading stock items…</div>
              ) : stockItems.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px 0', color: '#64748b', fontSize: 11 }}>
                  <div style={{ marginBottom: 10 }}>No stock items found in inventory.</div>
                  <button onClick={seedStockItems} disabled={stockItemsLoading}
                    style={{ padding: '8px 14px', borderRadius: 8, background: 'linear-gradient(135deg, #06b6d4, #0891b2)', border: 'none', color: '#fff', fontSize: 10, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>
                    ✨ Add Default Housekeeping Stock Items
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 320, overflowY: 'auto' }}>
                  {stockItems.map(item => {
                    const qty = laundryCounters[item.id] || 0
                    return (
                      <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: qty > 0 ? 'rgba(6,182,212,0.1)' : 'rgba(255,255,255,0.02)', border: `1px solid ${qty > 0 ? 'rgba(6,182,212,0.3)' : 'rgba(255,255,255,0.05)'}`, borderRadius: 12, padding: '10px 14px', transition: 'all 0.15s' }}>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 800, color: qty > 0 ? '#22d3ee' : '#f1f5f9' }}>{item.name}</div>
                          <div style={{ fontSize: 9, color: '#64748b', fontWeight: 600, marginTop: 2 }}>{item.unit || 'pcs'} · In Stock: {item.currentStock}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                          <button onClick={() => setLaundryCounters(prev => ({ ...prev, [item.id]: Math.max(0, (prev[item.id] || 0) - 1) }))}
                            style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#94a3b8', fontSize: 16, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                          <span style={{ fontSize: 15, fontWeight: 900, color: qty > 0 ? '#22d3ee' : '#475569', minWidth: 22, textAlign: 'center' }}>{qty}</span>
                          <button onClick={() => setLaundryCounters(prev => ({ ...prev, [item.id]: (prev[item.id] || 0) + 1 }))}
                            style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid rgba(6,182,212,0.4)', background: 'rgba(6,182,212,0.15)', color: '#22d3ee', fontSize: 16, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Action button */}
            <button onClick={() => submitLaundry(laundryModalRoom)} disabled={submittingLaundry}
              style={{ width: '100%', padding: '14px', borderRadius: 14, background: Object.values(laundryCounters).some(v => v > 0) ? 'linear-gradient(135deg,#0891b2,#06b6d4)' : 'rgba(255,255,255,0.05)', border: 'none', color: Object.values(laundryCounters).some(v => v > 0) ? '#fff' : '#475569', fontSize: 12, fontWeight: 900, cursor: Object.values(laundryCounters).some(v => v > 0) ? 'pointer' : 'default', fontFamily: 'inherit', letterSpacing: '0.04em', textTransform: 'uppercase', opacity: submittingLaundry ? 0.6 : 1, transition: 'all 0.2s' }}>
              {submittingLaundry ? 'Logging Laundry…' : Object.values(laundryCounters).some(v => v > 0) ? `🧺 Save Laundry (${Object.values(laundryCounters).reduce((a, b) => a + b, 0)} Items) — Room ${laundryModalRoom.roomNumber}` : 'Select Laundry Items Above'}
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

            {/* ── Top Bar ── */}
            <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0, background: 'rgba(255,255,255,0.015)', backdropFilter: 'blur(20px)' }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 900, color: '#64748b', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Room Cleaning</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: '#f1f5f9', marginTop: 1, letterSpacing: '-0.02em' }}>Room {checklistRoom.roomNumber}</div>
              </div>
              <button onClick={() => setChecklistRoom(null)}
                style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: '8px 16px', color: '#94a3b8', cursor: 'pointer', fontSize: 11, fontWeight: 800, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}>
                ✕ Cancel
              </button>
            </div>

            {/* ── Step Progress Bar ── */}
            <div style={{ padding: '12px 18px 0', display: 'flex', gap: 5, alignItems: 'center', flexShrink: 0 }}>
              {CLEAN_STEPS.map((step, i) => (
                <div key={i} style={{
                  height: 4, flex: 1, borderRadius: 2,
                  background: i < checklistStep
                    ? '#10b981'
                    : i === checklistStep && !isReview
                      ? step.color || '#f1f5f9'
                      : 'rgba(255,255,255,0.08)',
                  transition: 'background 0.3s',
                  boxShadow: i === checklistStep && !isReview ? `0 0 8px ${step.color}60` : 'none'
                }} />
              ))}
              <div style={{ height: 4, flex: 1, borderRadius: 2, background: isReview ? '#f1f5f9' : 'rgba(255,255,255,0.08)', transition: 'background 0.3s' }} />
            </div>
            <div style={{ padding: '5px 18px 0', fontSize: 9, fontWeight: 800, color: '#475569', letterSpacing: '0.1em', textTransform: 'uppercase', flexShrink: 0 }}>
              {isReview ? '✨ Final Review' : `Step ${checklistStep + 1} of ${TOTAL_STEPS}`}
            </div>

            {/* ── Scrollable Step Content ── */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>

              {!isReview && currentStep ? (
                /* ── INDIVIDUAL CLEANING STEP ── */
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 20px 20px' }}>

                  {/* Step Card - Premium */}
                  <div style={{ width: '100%', maxWidth: 420 }}>

                    {/* Emoji + Step Title */}
                    <div style={{ textAlign: 'center', marginBottom: 28 }}>
                      <div style={{
                        width: 100, height: 100, borderRadius: 28, margin: '0 auto 18px',
                        background: `linear-gradient(135deg, ${currentStep.color}20, ${currentStep.color}08)`,
                        border: `2px solid ${currentStep.color}30`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 52,
                        boxShadow: `0 0 40px ${currentStep.color}20`,
                      }}>
                        {currentStep.emoji}
                      </div>
                      <div style={{ fontSize: 22, fontWeight: 900, color: '#f1f5f9', marginBottom: 6, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                        {currentStep.label}
                      </div>
                      <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600, lineHeight: 1.5 }}>
                        {currentStep.sublabel}
                      </div>
                    </div>

                    {/* ── Tappable Checklist Items ── */}
                    <div style={{ background: `linear-gradient(135deg, ${currentStep.color}06, rgba(255,255,255,0.01))`, border: `1px solid ${currentStep.color}18`, borderRadius: 18, padding: '14px', marginBottom: checklistStep === 4 ? 14 : 22 }}>
                      <div style={{ fontSize: 9, fontWeight: 900, color: currentStep.color, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span>📋 Tap each item to confirm</span>
                        <span style={{ fontSize: 8, color: '#475569', fontWeight: 700, textTransform: 'none' }}>
                          {currentStep.items.filter((_, i) => getItemStatus(checklistStep, i) !== null).length}/{currentStep.items.length} done
                        </span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                        {currentStep.items.map((item, idx) => {
                          const status = getItemStatus(checklistStep, idx)
                          const isChanged = status === 'CHANGED'
                          const isOk = status === 'ALREADY_OK'
                          return (
                            <button key={idx} onClick={() => toggleItemStatus(checklistStep, idx)}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                                borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', width: '100%',
                                background: isChanged ? `rgba(16,185,129,0.12)` : isOk ? `rgba(96,165,250,0.1)` : 'rgba(255,255,255,0.02)',
                                border: isChanged ? '1px solid rgba(16,185,129,0.3)' : isOk ? '1px solid rgba(96,165,250,0.25)' : `1px solid rgba(255,255,255,0.06)`,
                                transition: 'all 0.2s',
                              }}>
                              {/* Status icon */}
                              <div style={{
                                width: 24, height: 24, borderRadius: 8, flexShrink: 0,
                                background: isChanged ? 'rgba(16,185,129,0.2)' : isOk ? 'rgba(96,165,250,0.15)' : `${currentStep.color}12`,
                                border: isChanged ? '1.5px solid #34d399' : isOk ? '1.5px solid #60a5fa' : `1px solid ${currentStep.color}30`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12,
                              }}>
                                {isChanged ? '✓' : isOk ? '↺' : <span style={{ fontSize: 9, fontWeight: 900, color: currentStep.color }}>{idx + 1}</span>}
                              </div>
                              {/* Item text */}
                              <span style={{
                                fontSize: 12, fontWeight: 600, lineHeight: 1.4, flex: 1,
                                color: isChanged ? '#34d399' : isOk ? '#93c5fd' : '#cbd5e1',
                                textDecoration: isChanged ? 'line-through' : isOk ? 'line-through' : 'none',
                                opacity: (isChanged || isOk) ? 0.85 : 1,
                              }}>{item}</span>
                              {/* Status label */}
                              {isChanged && <span style={{ fontSize: 8, fontWeight: 900, color: '#34d399', flexShrink: 0 }}>CHANGED</span>}
                              {isOk && <span style={{ fontSize: 8, fontWeight: 900, color: '#60a5fa', flexShrink: 0 }}>WAS OK</span>}
                            </button>
                          )
                        })}
                      </div>
                      {/* Helper text */}
                      <div style={{ marginTop: 10, fontSize: 9, color: '#334155', fontWeight: 600, textAlign: 'center' }}>
                        Tap once = ✓ Changed · Tap again = ↺ Was Already OK · Tap 3rd = Reset
                      </div>
                    </div>

                    {/* ── LAUNDRY STEP: Interactive Item Picker ── */}
                    {checklistStep === 4 && (
                      <div style={{ background: 'rgba(239,68,68,0.05)', border: '1.5px solid rgba(239,68,68,0.18)', borderRadius: 18, padding: '16px', marginBottom: 22 }}>
                        <div style={{ fontSize: 9, fontWeight: 900, color: '#f87171', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                          🧺 Items Collected from Room {checklistRoom.roomNumber}
                        </div>
                        <div style={{ fontSize: 10, color: '#475569', fontWeight: 600, marginBottom: 14 }}>
                          Tap + to log each item collected for laundry
                        </div>

                        {stockItemsLoading ? (
                          <div style={{ textAlign: 'center', padding: '12px 0', color: '#475569', fontSize: 10 }}>Loading items…</div>
                        ) : stockItems.length === 0 ? (
                          <div style={{ textAlign: 'center', padding: '10px 0' }}>
                            <div style={{ fontSize: 10, color: '#475569', marginBottom: 10 }}>No stock items in inventory.</div>
                            <button onClick={seedStockItems} disabled={stockItemsLoading}
                              style={{ padding: '8px 14px', borderRadius: 8, background: 'linear-gradient(135deg,#f87171,#dc2626)', border: 'none', color: '#fff', fontSize: 10, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>
                              ✨ Add Default Items
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {stockItems.map(item => {
                              const qty = laundryCounters[item.id] || 0
                              return (
                                <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: qty > 0 ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.02)', border: `1px solid ${qty > 0 ? 'rgba(239,68,68,0.25)' : 'rgba(255,255,255,0.06)'}`, borderRadius: 12, padding: '10px 13px', transition: 'all 0.15s' }}>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: 12, fontWeight: 800, color: qty > 0 ? '#fca5a5' : '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</div>
                                    <div style={{ fontSize: 9, color: '#475569', fontWeight: 600, marginTop: 1 }}>{item.unit || 'pcs'} · Stock: {item.currentStock}</div>
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                                    <button onClick={() => setLaundryCounters(prev => ({ ...prev, [item.id]: Math.max(0, (prev[item.id] || 0) - 1) }))}
                                      style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#94a3b8', fontSize: 16, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit' }}>−</button>
                                    <span style={{ fontSize: 15, fontWeight: 900, color: qty > 0 ? '#f87171' : '#334155', minWidth: 20, textAlign: 'center' }}>{qty}</span>
                                    <button onClick={() => setLaundryCounters(prev => ({ ...prev, [item.id]: (prev[item.id] || 0) + 1 }))}
                                      style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid rgba(239,68,68,0.4)', background: 'rgba(239,68,68,0.15)', color: '#f87171', fontSize: 16, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit' }}>+</button>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}

                        {/* Total selected summary */}
                        {Object.values(laundryCounters).some(v => v > 0) && (
                          <div style={{ marginTop: 12, padding: '8px 12px', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 10, color: '#fca5a5', fontWeight: 800 }}>🧺 Total Collected</span>
                            <span style={{ fontSize: 14, fontWeight: 900, color: '#f87171' }}>{Object.values(laundryCounters).reduce((a, b) => a + b, 0)} items</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* ── Done / Skip Buttons ── */}
                    <div style={{ display: 'flex', gap: 12 }}>
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
                          flex: 2, padding: '18px', borderRadius: 18, fontSize: 16, fontWeight: 900,
                          background: checklistStep === 4 && Object.values(laundryCounters).some(v => v > 0)
                            ? 'linear-gradient(135deg, #dc2626, #f87171)'
                            : 'linear-gradient(135deg, #10b981, #059669)',
                          border: 'none', color: '#fff', cursor: 'pointer', fontFamily: 'inherit',
                          boxShadow: checklistStep === 4 && Object.values(laundryCounters).some(v => v > 0)
                            ? '0 4px 24px rgba(239,68,68,0.4)'
                            : '0 4px 24px rgba(16,185,129,0.4)',
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
                          flex: 1, padding: '18px', borderRadius: 18, fontSize: 13, fontWeight: 800,
                          background: 'rgba(255,255,255,0.04)',
                          border: '1.5px solid rgba(255,255,255,0.1)', color: '#64748b', cursor: 'pointer', fontFamily: 'inherit',
                        }}>
                        Skip
                      </button>
                    </div>

                    {checklistStep > 0 && (
                      <div style={{ textAlign: 'center', marginTop: 14 }}>
                        <button onClick={() => setChecklistStep(s => s - 1)}
                          style={{ background: 'none', border: 'none', color: '#475569', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                          ← Back to previous step
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* ── REVIEW STEP ── */
                <div style={{ padding: '20px 18px 32px' }}>

                  {/* Review Hero */}
                  <div style={{ textAlign: 'center', marginBottom: 24, padding: '20px', background: doneTicks === TOTAL_STEPS ? 'rgba(16,185,129,0.07)' : 'rgba(251,191,36,0.06)', borderRadius: 20, border: `1px solid ${doneTicks === TOTAL_STEPS ? 'rgba(16,185,129,0.2)' : 'rgba(251,191,36,0.15)'}` }}>
                    <div style={{ fontSize: 52, marginBottom: 10 }}>{doneTicks === TOTAL_STEPS ? '🌟' : '📋'}</div>
                    <div style={{ fontSize: 20, fontWeight: 900, color: '#f1f5f9', letterSpacing: '-0.01em' }}>
                      {doneTicks === TOTAL_STEPS ? 'All Steps Complete!' : `${doneTicks} of ${TOTAL_STEPS} done`}
                    </div>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 6, fontWeight: 600 }}>Room {checklistRoom.roomNumber} · Review before marking clean</div>
                    {checklistRoom.checkIns[0]?.guest && (
                      <div style={{ marginTop: 8, fontSize: 10, color: '#a78bfa', fontWeight: 700 }}>
                        Guest: {checklistRoom.checkIns[0].guest.firstName} {checklistRoom.checkIns[0].guest.lastName}
                      </div>
                    )}
                  </div>

                  {/* ── Completed Steps Summary ── */}
                  {doneSteps.length > 0 && (
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 9, fontWeight: 900, color: '#34d399', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                        ✅ Completed Tasks ({doneSteps.length})
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {CLEAN_STEPS.map((step, i) => checklistTicks[i] ? (
                          <div key={i} style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(16,185,129,0.18)', background: 'rgba(16,185,129,0.05)' }}>
                            {/* Step header */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderBottom: '1px solid rgba(16,185,129,0.1)' }}>
                              <span style={{ fontSize: 18 }}>{step.emoji}</span>
                              <span style={{ flex: 1, fontSize: 12, fontWeight: 800, color: '#34d399' }}>{step.label}</span>
                              <span style={{ fontSize: 14 }}>✅</span>
                            </div>
                            {/* Step items - what was done */}
                            <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 5 }}>
                              {step.items.map((item, idx) => (
                                <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                                  <span style={{ color: '#34d399', fontSize: 10, flexShrink: 0, marginTop: 1 }}>✓</span>
                                  <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600, lineHeight: 1.35 }}>{item}</span>
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
                    <div style={{ marginBottom: 20 }}>
                      <div style={{ fontSize: 9, fontWeight: 900, color: '#f87171', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                        ❌ Skipped / Not Done ({skippedSteps.length})
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                        {CLEAN_STEPS.map((step, i) => !checklistTicks[i] ? (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderRadius: 14, background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)' }}>
                            <span style={{ fontSize: 18 }}>{step.emoji}</span>
                            <span style={{ flex: 1, fontSize: 12, fontWeight: 700, color: '#f87171' }}>{step.label}</span>
                            <button
                              onClick={() => {
                                setChecklistTicks(prev => { const n = [...prev]; n[i] = true; return n })
                              }}
                              style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 8, padding: '4px 10px', fontSize: 9, fontWeight: 900, color: '#34d399', cursor: 'pointer', fontFamily: 'inherit' }}>
                              Mark Done
                            </button>
                          </div>
                        ) : null)}
                      </div>
                    </div>
                  )}

                  {/* ── Laundry Items Summary (if any collected) ── */}
                  {Object.values(laundryCounters).some(v => v > 0) && (
                    <div style={{ marginBottom: 16, background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 18, overflow: 'hidden' }}>
                      <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 18 }}>🧺</span>
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 900, color: '#f87171' }}>Laundry Collected</div>
                          <div style={{ fontSize: 9, color: '#64748b', fontWeight: 600, marginTop: 1 }}>Items picked up from Room {checklistRoom.roomNumber}</div>
                        </div>
                        <span style={{ marginLeft: 'auto', fontSize: 9, fontWeight: 900, padding: '3px 9px', borderRadius: 999, background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }}>
                          {Object.values(laundryCounters).reduce((a, b) => a + b, 0)} ITEMS
                        </span>
                      </div>
                      <div style={{ padding: '10px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {stockItems.filter(item => (laundryCounters[item.id] || 0) > 0).map(item => (
                          <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>{item.name}</span>
                            <span style={{ fontSize: 12, fontWeight: 900, color: '#f87171' }}>× {laundryCounters[item.id]}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ── Kit Items Summary (always shown) ── */}
                  <div style={{ marginBottom: 20, background: 'rgba(251,191,36,0.05)', border: '1px solid rgba(251,191,36,0.15)', borderRadius: 18, overflow: 'hidden' }}>
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(251,191,36,0.12)', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 18 }}>🧴</span>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 900, color: '#fbbf24' }}>Amenities Kit Placed</div>
                        <div style={{ fontSize: 9, color: '#64748b', fontWeight: 600, marginTop: 1 }}>Items stocked in bathroom</div>
                      </div>
                      <span style={{ marginLeft: 'auto', fontSize: 9, fontWeight: 900, padding: '3px 9px', borderRadius: 999, background: checklistTicks[3] ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.12)', color: checklistTicks[3] ? '#34d399' : '#f87171', border: `1px solid ${checklistTicks[3] ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.2)'}` }}>
                        {checklistTicks[3] ? 'STOCKED' : 'SKIPPED'}
                      </span>
                    </div>
                    <div style={{ padding: '10px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 10px' }}>
                      {kitStep.items.map((item, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 10, color: checklistTicks[3] ? '#fbbf24' : '#475569', flexShrink: 0 }}>{checklistTicks[3] ? '✓' : '○'}</span>
                          <span style={{ fontSize: 10, color: '#64748b', fontWeight: 600, lineHeight: 1.3 }}>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ── Final action buttons ── */}
                  <div style={{ display: 'flex', gap: 10, position: 'sticky', bottom: 16 }}>
                    <button onClick={() => setChecklistStep(TOTAL_STEPS - 1)}
                      style={{ flex: 1, padding: '14px', borderRadius: 16, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
                      ← Go Back
                    </button>
                    <button
                      onClick={() => {
                        updateHKStatus(checklistRoom.id, 'CLEAN')
                        setRoomChecklist(prev => ({ ...prev, [checklistRoom.id]: [...checklistTicks] }))
                        setChecklistRoom(null)
                      }}
                      disabled={updatingId === checklistRoom.id}
                      style={{
                        flex: 2.5, padding: '14px', borderRadius: 16, fontSize: 13, fontWeight: 900,
                        background: 'linear-gradient(135deg,#10b981,#059669)',
                        border: 'none', color: '#fff', cursor: 'pointer', fontFamily: 'inherit',
                        boxShadow: '0 4px 24px rgba(16,185,129,0.4)',
                        opacity: updatingId === checklistRoom.id ? 0.6 : 1,
                        letterSpacing: '0.03em',
                      }}>
                      {updatingId === checklistRoom.id ? 'Updating…' : '✅ Mark Room Clean'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom safe area */}
            <div style={{ height: 'env(safe-area-inset-bottom)', flexShrink: 0 }} />
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
        * { box-sizing: border-box }
        input::placeholder { color: rgba(148,163,184,0.3) }
        ::-webkit-scrollbar { display: none }
        button:active { transform: scale(0.97); }
      `}</style>
    </div>
  )
}
