'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import QRCode from 'qrcode';
import {
  Printer,
  Download,
  Copy,
  ExternalLink,
  Search,
  Hotel,
  Wifi,
  Phone,
  Check,
  RefreshCw,
  ArrowLeft,
  QrCode,
  Globe,
  Smartphone,
  UtensilsCrossed,
  KeyRound,
  DoorOpen,
  PhoneCall,
  Sparkles,
  ShieldCheck,
  SlidersHorizontal,
  Layers,
  FileDown,
} from 'lucide-react';
import { toast, Toaster } from 'sonner';

interface RoomType {
  id: string;
  name: string;
  baseRate?: number;
}

interface Room {
  id: string;
  roomNumber: string;
  floor?: string | null;
  status?: string;
  housekeepingStatus?: string;
  roomType?: RoomType;
  roomTypeId?: string;
  wifiPassword?: string;
}

interface PropertyInfo {
  id: string;
  name: string;
  code: string;
  phone?: string;
  address?: string;
  wifiSsid?: string;
  wifiPassword?: string;
}

type PortalMode = 'door-concierge' | 'room-portal' | 'guest-portal';
type PlacardStyle = 'door-placard' | 'door-hanger' | 'compact-badge';

export default function RoomQRCodesPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [property, setProperty] = useState<PropertyInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [origin, setOrigin] = useState('');

  // Destination portal mode: default to 'door-concierge' as requested ("room ke bahar lagane ke liye & call for reception / key")
  const [portalMode, setPortalMode] = useState<PortalMode>('door-concierge');

  // Placard layout style
  const [placardStyle, setPlacardStyle] = useState<PlacardStyle>('door-placard');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFloor, setSelectedFloor] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Print single room state (null = print all filtered)
  const [printSingleRoomId, setPrintSingleRoomId] = useState<string | null>(null);

  // Copied link indicator
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Fetch rooms and property info
  const loadData = async () => {
    setLoading(true);
    try {
      const [roomsRes, sessionRes, portalConfigRes] = await Promise.all([
        fetch('/api/hotel/rooms').then((r) => r.json()),
        fetch('/api/auth/session').then((r) => r.json()).catch(() => null),
        fetch('/api/room-portal/config').then((r) => r.json()).catch(() => null),
      ]);

      if (roomsRes.success && Array.isArray(roomsRes.data)) {
        setRooms(roomsRes.data);
      }

      const u = sessionRes?.authenticated ? sessionRes.user : null;
      const cfg = portalConfigRes?.config || null;

      const propName = u?.propertyName || 'Grand Luxury Hotel';
      const propCode = u?.propertyCode || 'HOTEL';
      const propPhone = cfg?.frontDeskPhone || u?.phone || '+91 98765 43210';
      const wifiSsid = cfg?.wifiName || `${propName.replace(/\s+/g, '-')}-Guest-WiFi`;
      const wifiPassword = cfg?.wifiPassword || 'Welcome@Stay';

      setProperty({
        id: u?.propertyId || '',
        name: propName,
        code: propCode,
        phone: propPhone,
        address: u?.propertyAddress || '',
        wifiSsid,
        wifiPassword,
      });
    } catch (err) {
      console.error('Error loading room QR data:', err);
      toast.error('Failed to load rooms list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
    loadData();
  }, []);

  // Compute available floors and room categories
  const floorsList = useMemo(() => {
    const floors = new Set<string>();
    rooms.forEach((r) => {
      if (r.floor) floors.add(r.floor);
    });
    return Array.from(floors).sort();
  }, [rooms]);

  const categoriesList = useMemo(() => {
    const map = new Map<string, string>();
    rooms.forEach((r) => {
      if (r.roomType?.id && r.roomType?.name) {
        map.set(r.roomType.id, r.roomType.name);
      }
    });
    return Array.from(map.entries());
  }, [rooms]);

  // Filtered rooms
  const filteredRooms = useMemo(() => {
    return rooms.filter((r) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        r.roomNumber.toLowerCase().includes(q) ||
        (r.roomType?.name || '').toLowerCase().includes(q);
      const matchFloor = selectedFloor === 'all' || r.floor === selectedFloor;
      const matchCategory =
        selectedCategory === 'all' ||
        r.roomTypeId === selectedCategory ||
        r.roomType?.id === selectedCategory;
      return matchSearch && matchFloor && matchCategory;
    });
  }, [rooms, searchQuery, selectedFloor, selectedCategory]);

  // Generate QR URL for a room
  const getRoomQRUrl = (room: Room) => {
    const base = origin || process.env.NEXT_PUBLIC_APP_URL || '';
    const propCode = (property?.code || 'HOTEL').toLowerCase();

    if (portalMode === 'door-concierge') {
      return `${base}/door/${encodeURIComponent(propCode)}/${encodeURIComponent(room.roomNumber)}`;
    }
    if (portalMode === 'room-portal') {
      return `${base}/room-portal?room=${encodeURIComponent(room.roomNumber)}&propertyCode=${encodeURIComponent(propCode)}`;
    }
    return `${base}/guest-portal?room=${encodeURIComponent(room.roomNumber)}&propertyCode=${encodeURIComponent(propCode)}`;
  };

  // Download QR Code as PNG
  const handleDownloadPNG = async (room: Room) => {
    try {
      const qrUrl = getRoomQRUrl(room);
      const dataUrl = await QRCode.toDataURL(qrUrl, {
        width: 800,
        margin: 2,
        color: {
          dark: '#0a0f1d',
          light: '#ffffff',
        },
      });
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `Room-${room.roomNumber}-DoorQR.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`Room ${room.roomNumber} Door QR downloaded!`);
    } catch {
      toast.error('Failed to download QR code image.');
    }
  };

  // Copy QR URL to clipboard
  const handleCopyLink = (room: Room) => {
    const url = getRoomQRUrl(room);
    navigator.clipboard.writeText(url);
    setCopiedId(room.id);
    toast.success(`Room ${room.roomNumber} Door Concierge link copied!`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Print Handlers
  const handlePrintAll = () => {
    setPrintSingleRoomId(null);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const handlePrintSingle = (roomId: string) => {
    setPrintSingleRoomId(roomId);
    setTimeout(() => {
      window.print();
      setPrintSingleRoomId(null);
    }, 150);
  };

  return (
    <>
      <Toaster richColors position="top-center" />

      {/* ── Print Stylesheet ── */}
      <style jsx global>{`
        @media print {
          body {
            background: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          header,
          nav,
          aside,
          .no-print {
            display: none !important;
          }
          .print-area {
            display: block !important;
            padding: 0 !important;
            background: #ffffff !important;
          }
          .placard-card {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            margin-bottom: 24px !important;
            box-shadow: none !important;
            border: 2px solid #0f172a !important;
            background: #ffffff !important;
            color: #0f172a !important;
          }
          .placard-card * {
            color: #0f172a !important;
          }
          .placard-dark-badge {
            background: #0f172a !important;
            color: #ffffff !important;
          }
        }
      `}</style>

      <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 py-6 print-area">
        {/* ── Top Header Navigation Bar (Hidden on Print) ── */}
        <div className="no-print space-y-4 border-b border-slate-800 pb-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <Link
                  href="/hotel/rooms"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-indigo-400 transition-colors"
                >
                  <ArrowLeft size={13} />
                  <span>Rooms Management</span>
                </Link>
                <span className="text-slate-600">/</span>
                <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                  <DoorOpen size={13} /> Room Door QR Codes &amp; Placards
                </span>
              </div>
              <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
                <span>Room Door QR Placards &amp; Concierge Studio</span>
                <span className="text-[10px] uppercase font-black px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  {filteredRooms.length} Rooms
                </span>
              </h1>
              <p className="text-slate-400 text-xs mt-1 max-w-3xl">
                Generate, download, and print separate QR placards to place outside each room door. When a guest arrives or gets locked out, scanning the QR opens the <strong className="text-white">Instant Door Concierge</strong>: 1-tap call to Reception, key assistance alerts, room service &amp; housekeeping.
              </p>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <Link
                href={filteredRooms[0] ? getRoomQRUrl(filteredRooms[0]) : '/door'}
                target="_blank"
                className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 text-indigo-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
              >
                <Smartphone size={13} />
                <span>Preview Mobile Scan</span>
                <ExternalLink size={11} className="text-slate-500" />
              </Link>

              <button
                type="button"
                onClick={handlePrintAll}
                disabled={filteredRooms.length === 0}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-amber-500/25 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
              >
                <Printer size={15} />
                <span>Print All Door Placards ({filteredRooms.length})</span>
              </button>
            </div>
          </div>

          {/* ── Mode & Filter Bar ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
            {/* 1. Target Portal Mode Selector */}
            <div className="p-2.5 rounded-2xl bg-[#090f1d] border border-amber-500/30 shadow-md">
              <label className="block text-[10px] font-black text-amber-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>QR Placard Purpose:</span>
                <span className="text-[9px] bg-amber-500/20 px-1.5 py-0.2 rounded text-amber-300">Outside Door</span>
              </label>
              <div className="grid grid-cols-3 gap-1 bg-black/40 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setPortalMode('door-concierge')}
                  className={`py-1.5 px-1.5 rounded-lg text-[10.5px] font-black transition-all truncate ${
                    portalMode === 'door-concierge'
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Door Concierge: Call reception, key assistance, locked out help"
                >
                  🚪 Door Placard
                </button>
                <button
                  type="button"
                  onClick={() => setPortalMode('room-portal')}
                  className={`py-1.5 px-1.5 rounded-lg text-[10.5px] font-black transition-all truncate ${
                    portalMode === 'room-portal'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Tablet Kiosk inside the room"
                >
                  📺 In-Room TV
                </button>
                <button
                  type="button"
                  onClick={() => setPortalMode('guest-portal')}
                  className={`py-1.5 px-1.5 rounded-lg text-[10.5px] font-black transition-all truncate ${
                    portalMode === 'guest-portal'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Guest Self-Service login"
                >
                  📱 Guest Login
                </button>
              </div>
            </div>

            {/* 2. Room Search Filter */}
            <div className="p-2.5 rounded-2xl bg-slate-900/80 border border-slate-800">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Search Room Number
              </label>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="e.g. 101, 204, Deluxe..."
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* 3. Floor Filter */}
            <div className="p-2.5 rounded-2xl bg-slate-900/80 border border-slate-800">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Filter by Floor
              </label>
              <select
                value={selectedFloor}
                onChange={(e) => setSelectedFloor(e.target.value)}
                className="w-full py-1.5 px-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
              >
                <option value="all">All Floors ({rooms.length} Rooms)</option>
                {floorsList.map((f) => (
                  <option key={f} value={f}>
                    Floor {f}
                  </option>
                ))}
              </select>
            </div>

            {/* 4. Placard Format & Category */}
            <div className="p-2.5 rounded-2xl bg-slate-900/80 border border-slate-800">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Placard Template Format
              </label>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setPlacardStyle('door-placard')}
                  className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 ${
                    placardStyle === 'door-placard'
                      ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                  title="Standard wall or door mount luxury card"
                >
                  <span>🏷️ Wall Card</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPlacardStyle('door-hanger')}
                  className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 ${
                    placardStyle === 'door-hanger'
                      ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                  title="Door handle hanger cutout"
                >
                  <span>🔖 Hanger</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPlacardStyle('compact-badge')}
                  className={`py-1.5 px-2.5 rounded-xl text-xs font-bold transition ${
                    placardStyle === 'compact-badge'
                      ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                  title="Compact plaque sticker"
                >
                  🔲 Sticker
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Loading Spinner ── */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-8 h-8 text-amber-400 animate-spin" />
            <p className="text-slate-400 text-xs font-semibold">Generating Door QR Placards for hotel rooms...</p>
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="py-16 text-center rounded-3xl bg-slate-900/50 border border-slate-800 p-8 space-y-3">
            <DoorOpen className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-white">No rooms match your filter</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Reset your search query or floor selection above to view room door placards.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedFloor('all');
                setSelectedCategory('all');
              }}
              className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-700 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          /* ── Placards Grid ── */
          <div
            className={
              placardStyle === 'compact-badge'
                ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3'
                : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
            }
          >
            {filteredRooms.map((room) => {
              const qrUrl = getRoomQRUrl(room);
              const roomTypeName = room.roomType?.name || 'Deluxe Room';
              const floorLabel = room.floor ? `${room.floor} Floor` : 'Guest Floor';
              const isOnlyThisOnePrinting = printSingleRoomId === room.id;

              if (printSingleRoomId && !isOnlyThisOnePrinting) {
                return null;
              }

              return (
                <div
                  key={room.id}
                  className={`placard-card relative flex flex-col justify-between rounded-3xl transition-all border ${
                    placardStyle === 'compact-badge'
                      ? 'bg-slate-900/80 border-slate-800 p-3.5 hover:border-slate-700'
                      : 'bg-gradient-to-b from-[#0e1629] via-[#090e1a] to-[#060a12] border-slate-800 shadow-2xl p-6 overflow-hidden group hover:border-amber-500/50'
                  }`}
                >
                  {placardStyle === 'compact-badge' ? (
                    /* ── 1. COMPACT STICKER VIEW ── */
                    <div className="space-y-2 text-center">
                      <div className="flex items-center justify-between">
                        <span className="font-black text-white text-xs">Room {room.roomNumber}</span>
                        <span className="text-[9px] text-amber-400 font-bold">{floorLabel}</span>
                      </div>
                      <div className="p-2.5 bg-white rounded-2xl inline-block shadow-md">
                        <QRCodeSVG value={qrUrl} size={110} level="H" />
                      </div>
                      <p className="text-[9.5px] text-slate-400 truncate font-semibold">Scan for Reception &amp; Key</p>
                      <div className="no-print pt-1 flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handlePrintSingle(room.id)}
                          className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-bold"
                        >
                          Print
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDownloadPNG(room)}
                          className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold"
                        >
                          PNG
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* ── 2. EXECUTIVE WALL PLACARD & DOOR HANGER ── */
                    <>
                      {/* Ambient Accent Light */}
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-24 bg-amber-500/10 blur-3xl pointer-events-none rounded-full" />

                      {/* Optional Door Hanger Cutout Marker */}
                      {placardStyle === 'door-hanger' && (
                        <div className="mb-3 text-center">
                          <div className="w-14 h-14 rounded-full border-2 border-dashed border-amber-500/40 mx-auto flex items-center justify-center text-[9px] text-amber-400 font-bold bg-amber-500/5">
                            DOOR HOOK
                          </div>
                          <span className="text-[8.5px] text-slate-500 uppercase tracking-widest block mt-0.5">
                            Cut out circle to hang on door handle
                          </span>
                        </div>
                      )}

                      {/* Header Crest */}
                      <div className="text-center relative z-10 space-y-1">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-300 text-[10px] font-black uppercase tracking-widest">
                          <Hotel size={11} className="text-amber-400" />
                          <span>{property?.name || 'Grand Palace Hotel'}</span>
                        </div>

                        <div className="pt-2">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
                            ROOM DOOR CONCIERGE
                          </span>
                          <h2 className="text-4xl font-black text-white tracking-tight leading-none mt-1">
                            ROOM {room.roomNumber}
                          </h2>
                          <p className="text-[11px] text-amber-300/80 font-bold mt-1">
                            {roomTypeName} • {floorLabel}
                          </p>
                        </div>
                      </div>

                      {/* High-Resolution QR Code Frame */}
                      <div className="my-4 flex flex-col items-center justify-center relative z-10">
                        <div className="p-4 bg-white rounded-2xl shadow-2xl ring-4 ring-amber-500/20 flex items-center justify-center">
                          <QRCodeSVG
                            value={qrUrl}
                            size={180}
                            level="H"
                            includeMargin={false}
                          />
                        </div>

                        <div className="mt-3 text-center space-y-1">
                          <span className="inline-flex items-center gap-1.5 text-xs font-black text-white bg-slate-900 px-3.5 py-1.2 rounded-full border border-amber-500/30 shadow-md">
                            <Smartphone size={13} className="text-amber-400" />
                            <span>Scan with Camera to Open Help Desk</span>
                          </span>
                          <p className="text-[10px] text-slate-400 block font-medium">
                            No app needed • Instant Reception Call &amp; Key Assistance
                          </p>
                        </div>
                      </div>

                      {/* Highlights Strip on Placard */}
                      <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-2xl grid grid-cols-2 gap-2 text-[10.5px] text-slate-300 relative z-10 font-bold">
                        <div className="flex items-center gap-1.5">
                          <PhoneCall size={12} className="text-emerald-400 shrink-0" />
                          <span className="truncate">Call Front Desk</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <KeyRound size={12} className="text-amber-400 shrink-0" />
                          <span className="truncate">Locked Out / Keycard</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <UtensilsCrossed size={12} className="text-orange-400 shrink-0" />
                          <span className="truncate">Room Service Menu</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Sparkles size={12} className="text-cyan-400 shrink-0" />
                          <span className="truncate">Housekeeping Call</span>
                        </div>
                      </div>

                      {/* Footer Info: WiFi & Front Desk Hotline */}
                      <div className="mt-3.5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400 relative z-10">
                        <div>
                          <span className="font-semibold block text-slate-500 uppercase tracking-wider text-[8.5px]">Wi-Fi Network</span>
                          <span className="text-slate-200 font-bold font-mono">
                            {property?.wifiSsid || 'Hotel-Guest'}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-semibold block text-slate-500 uppercase tracking-wider text-[8.5px]">Front Desk 24x7</span>
                          <span className="text-amber-400 font-bold font-mono">
                            {property?.phone || '+91 98765 43210'}
                          </span>
                        </div>
                      </div>

                      {/* ── Action Buttons (Hidden on Print) ── */}
                      <div className="no-print mt-4 pt-3 border-t border-slate-800 flex items-center justify-between gap-1.5">
                        <button
                          type="button"
                          onClick={() => handlePrintSingle(room.id)}
                          className="flex-1 py-1.5 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                          title="Print this door placard only"
                        >
                          <Printer size={12} />
                          <span>Print</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDownloadPNG(room)}
                          className="flex-1 py-1.5 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                          title="Download high-resolution PNG for printing sticker"
                        >
                          <Download size={12} />
                          <span>PNG</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleCopyLink(room)}
                          className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                          title="Copy QR destination link"
                        >
                          {copiedId === room.id ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                        </button>

                        <a
                          href={qrUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/40 text-amber-300 hover:text-white transition-colors"
                          title="Open live door page in new tab"
                        >
                          <ExternalLink size={13} />
                        </a>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
