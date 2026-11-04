'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import QRCode from 'qrcode';
import {
  Printer,
  Download,
  Copy,
  ExternalLink,
  Search,
  Filter,
  Layers,
  Sparkles,
  Hotel,
  Wifi,
  Phone,
  Bed,
  Check,
  Eye,
  RefreshCw,
  ArrowLeft,
  QrCode,
  Globe,
  SlidersHorizontal,
  ChevronRight,
  FileDown,
  Smartphone,
  UtensilsCrossed,
  Receipt,
  Sparkle,
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

export default function RoomQRCodesPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [property, setProperty] = useState<PropertyInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [origin, setOrigin] = useState('');

  // Destination portal mode: 'guest-portal' or 'room-portal'
  const [portalMode, setPortalMode] = useState<'guest-portal' | 'room-portal'>('guest-portal');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFloor, setSelectedFloor] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewStyle, setViewStyle] = useState<'standee' | 'compact'>('standee');

  // Print single room state (null = print all filtered)
  const [printSingleRoomId, setPrintSingleRoomId] = useState<string | null>(null);

  // Copied link indicator
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Fetch rooms and property info
  const loadData = async () => {
    setLoading(true);
    try {
      const [roomsRes, sessionRes] = await Promise.all([
        fetch('/api/hotel/rooms').then((r) => r.json()),
        fetch('/api/auth/session').then((r) => r.json()).catch(() => null),
      ]);

      if (roomsRes.success && Array.isArray(roomsRes.data)) {
        setRooms(roomsRes.data);
      }

      if (sessionRes?.authenticated && sessionRes.user) {
        const u = sessionRes.user;
        setProperty({
          id: u.propertyId || '',
          name: u.propertyName || 'Hotel & Luxury Suites',
          code: u.propertyCode || 'HOTEL',
          phone: u.phone || '+91 98765 43210',
          wifiSsid: `${u.propertyName || 'Hotel'}-Guest-WiFi`,
          wifiPassword: 'ConnectInRoom',
        });
      }
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
      const matchSearch = !q || r.roomNumber.toLowerCase().includes(q) || (r.roomType?.name || '').toLowerCase().includes(q);
      const matchFloor = selectedFloor === 'all' || r.floor === selectedFloor;
      const matchCategory = selectedCategory === 'all' || r.roomTypeId === selectedCategory || r.roomType?.id === selectedCategory;
      return matchSearch && matchFloor && matchCategory;
    });
  }, [rooms, searchQuery, selectedFloor, selectedCategory]);

  // Generate QR URL for a room
  const getRoomQRUrl = (room: Room) => {
    const base = origin || 'http://localhost:3000';
    const propCode = property?.code || 'HOTEL';
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
        width: 600,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      });
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `Room-${room.roomNumber}-GuestPortal-QR.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`Room ${room.roomNumber} QR Code downloaded!`);
    } catch (err) {
      toast.error('Failed to download QR code image.');
    }
  };

  // Copy QR URL to clipboard
  const handleCopyLink = (room: Room) => {
    const url = getRoomQRUrl(room);
    navigator.clipboard.writeText(url);
    setCopiedId(room.id);
    toast.success(`Room ${room.roomNumber} portal link copied!`);
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

      {/* ── Print Specific Stylesheet ── */}
      <style jsx global>{`
        @media print {
          body {
            background: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          /* Hide app layout header, sidebar, filters and buttons */
          header,
          nav,
          aside,
          .no-print {
            display: none !important;
          }

          /* Show only the print container */
          .print-area {
            display: block !important;
            padding: 0 !important;
            background: #ffffff !important;
          }

          /* Force page-break between standee cards */
          .standee-print-card {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            margin-bottom: 24px !important;
            box-shadow: none !important;
            border: 2px solid #cbd5e1 !important;
            background: #ffffff !important;
            color: #0f172a !important;
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
                <span className="text-xs font-bold text-indigo-400 flex items-center gap-1">
                  <QrCode size={13} /> Room QR Standees
                </span>
              </div>
              <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
                <span>Room QR Standees &amp; Guest Portal</span>
                <span className="text-[10px] uppercase font-black px-2.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                  {filteredRooms.length} Rooms
                </span>
              </h1>
              <p className="text-slate-400 text-xs mt-1">
                Generate and print luxury acrylic table-tent QR standees for each hotel room. When guests scan with their phone camera, their in-room portal opens instantly.
              </p>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <Link
                href="/guest-portal"
                target="_blank"
                className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
              >
                <Globe size={13} className="text-indigo-400" />
                <span>Test Guest Portal</span>
                <ExternalLink size={11} className="text-slate-500" />
              </Link>

              <button
                type="button"
                onClick={handlePrintAll}
                disabled={filteredRooms.length === 0}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/25 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
              >
                <Printer size={15} />
                <span>Print All Standees ({filteredRooms.length})</span>
              </button>
            </div>
          </div>

          {/* ── Mode & Filter Bar ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
            {/* 1. Target Portal Selector */}
            <div className="p-2.5 rounded-2xl bg-slate-900/80 border border-slate-800">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                QR Target Destination
              </label>
              <div className="grid grid-cols-2 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setPortalMode('guest-portal')}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all ${portalMode === 'guest-portal'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                    }`}
                >
                  Guest Portal
                </button>
                <button
                  type="button"
                  onClick={() => setPortalMode('room-portal')}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all ${portalMode === 'room-portal'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                    }`}
                >
                  In-Room Portal
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
                  placeholder="e.g. 101, 202, Deluxe..."
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
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
                className="w-full py-1.5 px-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="all">All Floors ({rooms.length} Rooms)</option>
                {floorsList.map((f) => (
                  <option key={f} value={f}>
                    Floor {f}
                  </option>
                ))}
              </select>
            </div>

            {/* 4. Category & Style Filter */}
            <div className="p-2.5 rounded-2xl bg-slate-900/80 border border-slate-800">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Room Category &amp; View
              </label>
              <div className="flex items-center gap-1.5">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="flex-1 py-1.5 px-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 truncate"
                >
                  <option value="all">All Room Types</option>
                  {categoriesList.map(([id, name]) => (
                    <option key={id} value={id}>
                      {name}
                    </option>
                  ))}
                </select>

                <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-0.5">
                  <button
                    type="button"
                    onClick={() => setViewStyle('standee')}
                    className={`px-2 py-1 rounded-lg text-xs font-bold ${viewStyle === 'standee' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    title="Standee Tent Card View"
                  >
                    🪧 Card
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewStyle('compact')}
                    className={`px-2 py-1 rounded-lg text-xs font-bold ${viewStyle === 'compact' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    title="Compact Gallery View"
                  >
                    📑 Grid
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Loading Spinner ── */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
            <p className="text-slate-400 text-xs font-semibold">Generating QR Codes for hotel rooms...</p>
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="py-16 text-center rounded-3xl bg-slate-900/50 border border-slate-800 p-8 space-y-3">
            <QrCode className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-white">No rooms matched your filter</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Try resetting your search query or floor selection above to view room QR codes.
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
          /* ── Room Cards / Standees Grid ── */
          <div
            className={
              viewStyle === 'standee'
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                : 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3'
            }
          >
            {filteredRooms.map((room) => {
              const qrUrl = getRoomQRUrl(room);
              const roomTypeName = room.roomType?.name || 'Standard Room';
              const floorLabel = room.floor ? `Floor ${room.floor}` : 'Ground Floor';
              const isOnlyThisOnePrinting = printSingleRoomId === room.id;

              if (printSingleRoomId && !isOnlyThisOnePrinting) {
                return null;
              }

              return (
                <div
                  key={room.id}
                  className={`standee-print-card relative flex flex-col justify-between rounded-3xl transition-all border ${viewStyle === 'standee'
                      ? 'bg-gradient-to-b from-[#0e1629] via-[#090e1a] to-[#060a12] border-slate-800 shadow-2xl p-6 overflow-hidden group hover:border-indigo-500/50'
                      : 'bg-slate-900/80 border-slate-800 p-3.5 hover:border-slate-700'
                    }`}
                >
                  {viewStyle === 'standee' ? (
                    <>
                      {/* Ambient Accent Light */}
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-24 bg-indigo-500/10 blur-3xl pointer-events-none rounded-full" />

                      {/* Top Header Strip */}
                      <div className="text-center relative z-10 space-y-1">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[10px] font-black uppercase tracking-widest">
                          <Hotel size={11} className="text-indigo-400" />
                          <span>{property?.name || 'Grand Palace Hotel'}</span>
                        </div>
                        <div className="pt-2">
                          <span className="text-[11px] font-black uppercase tracking-widest text-slate-400 block">
                            WELCOME TO
                          </span>
                          <h2 className="text-3xl font-black text-white tracking-tight leading-none mt-0.5">
                            ROOM {room.roomNumber}
                          </h2>
                          <p className="text-[11px] text-indigo-300/80 font-medium mt-1">
                            {roomTypeName} · {floorLabel}
                          </p>
                        </div>
                      </div>

                      {/* High-Resolution QR Code Frame */}
                      <div className="my-5 flex flex-col items-center justify-center relative z-10">
                        <div className="p-4 bg-white rounded-2xl shadow-xl ring-4 ring-white/10 flex items-center justify-center">
                          <QRCodeSVG
                            value={qrUrl}
                            size={180}
                            level="H"
                            includeMargin={false}
                          />
                        </div>

                        <div className="mt-3 text-center space-y-1">
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-white bg-slate-800/90 px-3 py-1 rounded-full border border-slate-700/80 shadow-xs">
                            <Smartphone size={12} className="text-indigo-400" />
                            <span>Scan with Camera to Open</span>
                          </span>
                          <p className="text-[10px] text-slate-400 block">
                            Point your mobile camera to scan — no app download required.
                          </p>
                        </div>
                      </div>

                      {/* Guest Perks Available on Portal Strip */}
                      <div className="p-3 bg-slate-900/60 border border-slate-800/80 rounded-2xl grid grid-cols-2 gap-2 text-[11px] text-slate-300 relative z-10">
                        <div className="flex items-center gap-1.5">
                          <UtensilsCrossed size={12} className="text-amber-400 shrink-0" />
                          <span className="truncate">24/7 Room Service</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Wifi size={12} className="text-emerald-400 shrink-0" />
                          <span className="truncate">Free Wi-Fi Login</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Receipt size={12} className="text-sky-400 shrink-0" />
                          <span className="truncate">Live Bill &amp; Folio</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Sparkles size={12} className="text-violet-400 shrink-0" />
                          <span className="truncate">Housekeeping Call</span>
                        </div>
                      </div>

                      {/* Footer Info: WiFi & Front Desk */}
                      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400 relative z-10">
                        <div>
                          <span className="font-semibold block text-slate-500 uppercase tracking-wider text-[9px]">Wi-Fi Network</span>
                          <span className="text-slate-300 font-bold font-mono">
                            {property?.wifiSsid || 'Hotel-Guest'}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-semibold block text-slate-500 uppercase tracking-wider text-[9px]">Front Desk Ext.</span>
                          <span className="text-indigo-400 font-bold font-mono">Dial 9</span>
                        </div>
                      </div>

                      {/* ── Standee Card Interactive Action Buttons (Hidden on Print) ── */}
                      <div className="no-print mt-4 pt-3 border-t border-slate-800 flex items-center justify-between gap-1.5">
                        <button
                          type="button"
                          onClick={() => handlePrintSingle(room.id)}
                          className="flex-1 py-1.5 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                          title="Print this card only"
                        >
                          <Printer size={12} />
                          <span>Print</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDownloadPNG(room)}
                          className="flex-1 py-1.5 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                          title="Download QR as high-res PNG"
                        >
                          <Download size={12} />
                          <span>PNG</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleCopyLink(room)}
                          className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                          title="Copy QR Destination URL"
                        >
                          {copiedId === room.id ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                        </button>

                        <a
                          href={qrUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 hover:text-white transition-colors"
                          title="Test open scan page in new tab"
                        >
                          <ExternalLink size={13} />
                        </a>
                      </div>
                    </>
                  ) : (
                    /* ── Compact Grid View ── */
                    <div className="space-y-2 text-center">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-xs">Rm {room.roomNumber}</span>
                        <span className="text-[9px] text-indigo-400 font-bold">{floorLabel}</span>
                      </div>
                      <div className="p-2 bg-white rounded-xl inline-block shadow-sm">
                        <QRCodeSVG value={qrUrl} size={110} level="M" />
                      </div>
                      <p className="text-[10px] text-slate-400 truncate">{roomTypeName}</p>
                      <div className="no-print flex items-center justify-center gap-1 pt-1">
                        <button
                          type="button"
                          onClick={() => handlePrintSingle(room.id)}
                          className="p-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
                          title="Print"
                        >
                          <Printer size={11} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDownloadPNG(room)}
                          className="p-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
                          title="Download PNG"
                        >
                          <Download size={11} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopyLink(room)}
                          className="p-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
                          title="Copy Link"
                        >
                          <Copy size={11} />
                        </button>
                        <a
                          href={qrUrl}
                          target="_blank"
                          className="p-1 rounded-lg bg-indigo-600/20 text-indigo-300 hover:text-white"
                          title="Open"
                        >
                          <ExternalLink size={11} />
                        </a>
                      </div>
                    </div>
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
