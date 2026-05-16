'use client';

import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { CarFront, Edit2, Trash2, QrCode, Power } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ParkingSlot {
  id: string;
  name: string;
  status: string;
  qrToken?: string | null;
  width?: number;
  height?: number;
  x?: number;
  y?: number;
  activeOrder?: {
    customerName: string;
    vehicleNumber: string;
    amount: number;
    elapsedTime?: number;
  };
}

interface ParkingLayoutViewProps {
  slots: ParkingSlot[];
  isEditMode?: boolean;
  onNewSlot: () => void;
  onEditSlot: (slot: ParkingSlot) => void;
  onDeleteSlot: (id: string) => void;
  onResetSlot: (id: string) => void;
  onShowQR: (slot: ParkingSlot) => void;
  onBillingNavigate: (slotId: string, slotName: string) => void;
  onSlotPositionChange?: (id: string, x: number, y: number) => void;
  onSlotResize?: (id: string, width: number, height: number) => void;
  selectedSlotId?: string | null;
  onSelectSlot: (slot: ParkingSlot | null) => void;
}

const SNAP = 1; // Ultra-smooth movement
const MIN_W = 100;
const MIN_H = 100;
const DEFAULT_W = 180;
const DEFAULT_H = 240;

export const ParkingLayoutView: React.FC<ParkingLayoutViewProps> = ({
  slots,
  isEditMode = false,
  onNewSlot,
  onEditSlot,
  onDeleteSlot,
  onResetSlot,
  onShowQR,
  onBillingNavigate,
  onSlotPositionChange,
  onSlotResize,
  selectedSlotId,
  onSelectSlot
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({});
  const [sizes, setSizes] = useState<Record<string, { w: number; h: number }>>({});

  // Interaction state
  const dragRef = useRef<{ id: string; startX: number; startY: number; origX: number; origY: number } | null>(null);
  const resizeRef = useRef<{ id: string; startX: number; startY: number; origW: number; origH: number } | null>(null);
  
  // Track active interaction for performance
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isInteracting, setIsInteracting] = useState(false);

  useEffect(() => {
    // Only update from props if we are NOT interacting
    if (isInteracting) return;

    setPositions(prev => {
      const next = { ...prev };
      slots.forEach((s) => {
        next[s.id] = { x: s.x ?? 0, y: s.y ?? 0 };
      });
      return next;
    });
    setSizes(prev => {
      const next = { ...prev };
      slots.forEach(s => {
        next[s.id] = { w: s.width ?? DEFAULT_W, h: s.height ?? DEFAULT_H };
      });
      return next;
    });
  }, [slots, isInteracting]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (dragRef.current) {
      const { id, startX, startY, origX, origY } = dragRef.current;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      const newX = Math.max(0, Math.round((origX + dx) / SNAP) * SNAP);
      const newY = Math.max(0, Math.round((origY + dy) / SNAP) * SNAP);
      setPositions(prev => ({ ...prev, [id]: { x: newX, y: newY } }));
    }
    if (resizeRef.current) {
      const { id, startX, startY, origW, origH } = resizeRef.current;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      const newW = Math.max(MIN_W, Math.round((origW + dx) / SNAP) * SNAP);
      const newH = Math.max(MIN_H, Math.round((origH + dy) / SNAP) * SNAP);
      setSizes(prev => ({ ...prev, [id]: { w: newW, h: newH } }));
    }
  }, []);

  const onPointerUp = useCallback(() => {
    if (dragRef.current) {
      const { id } = dragRef.current;
      const pos = positions[id];
      if (pos) onSlotPositionChange?.(id, pos.x, pos.y);
      dragRef.current = null;
    }
    if (resizeRef.current) {
      const { id } = resizeRef.current;
      const sz = sizes[id];
      if (sz) onSlotResize?.(id, sz.w, sz.h);
      resizeRef.current = null;
    }
    setActiveId(null);
    setIsInteracting(false);
  }, [positions, sizes, onSlotPositionChange, onSlotResize]);

  const startDrag = (e: React.PointerEvent, id: string) => {
    if (!isEditMode) return;
    e.stopPropagation();
    const pos = positions[id] ?? { x: 0, y: 0 };
    dragRef.current = { id, startX: e.clientX, startY: e.clientY, origX: pos.x, origY: pos.y };
    setActiveId(id);
    setIsInteracting(true);
  };

  const startResize = (e: React.PointerEvent, id: string) => {
    if (!isEditMode) return;
    e.stopPropagation();
    const sz = sizes[id] ?? { w: DEFAULT_W, h: DEFAULT_H };
    resizeRef.current = { id, startX: e.clientX, startY: e.clientY, origW: sz.w, origH: sz.h };
    setActiveId(id);
    setIsInteracting(true);
  };

  // Memoize max bounds for grid container
  const bounds = useMemo(() => {
    const maxX = Math.max(1200, ...slots.map(s => (positions[s.id]?.x || 0) + (sizes[s.id]?.w || 0) + 600));
    const maxY = Math.max(800, ...slots.map(s => (positions[s.id]?.y || 0) + (sizes[s.id]?.h || 0) + 600));
    return { x: maxX, y: maxY };
  }, [slots, positions, sizes]);

  // Click handlers
  const clickTimeout = useRef<NodeJS.Timeout | null>(null);

  const handleSlotClick = (slot: ParkingSlot) => {
    if (isEditMode) return;
    if (clickTimeout.current) {
      clearTimeout(clickTimeout.current);
      clickTimeout.current = null;
      // Double click
      onBillingNavigate(slot.id, slot.name);
    } else {
      clickTimeout.current = setTimeout(() => {
        // Single click
        onSelectSlot(selectedSlotId === slot.id ? null : slot);
        clickTimeout.current = null;
      }, 250);
    }
  };

  return (
    <div 
      ref={containerRef}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
      onClick={() => onSelectSlot(null)}
      className="relative w-full h-full overflow-auto no-scrollbar select-none"
      style={{
        cursor: isEditMode ? 'crosshair' : 'default',
        touchAction: 'none',
        background: '#050505',
        backgroundImage: isEditMode 
          ? 'radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)' 
          : 'none',
        backgroundSize: '40px 40px'
      }}
    >
      <div style={{ position: 'relative', width: bounds.x, height: bounds.y }}>
        {slots.map((slot) => {
          const pos = positions[slot.id] || { x: 0, y: 0 };
          const sz = sizes[slot.id] || { w: DEFAULT_W, h: DEFAULT_H };
          const isOccupied = slot.status !== 'VACANT';
          const order = slot.activeOrder;
          const isActive = activeId === slot.id;
          const isSelected = selectedSlotId === slot.id;

          // DYNAMIC TEXT SCALING (Refined)
          const scaleFactor = Math.min(sz.w / DEFAULT_W, sz.h / DEFAULT_H);
          const titleSize = Math.max(10, 24 * scaleFactor);
          const iconSize = Math.max(16, 40 * scaleFactor);
          const badgeSize = Math.max(6, 10 * scaleFactor);
          const orderTextSize = Math.max(7, 11 * scaleFactor);

          return (
            <div
              key={slot.id}
              onPointerDown={e => startDrag(e, slot.id)}
              onClick={(e) => { e.stopPropagation(); handleSlotClick(slot); }}
              style={{
                position: 'absolute',
                transform: `translate3d(${pos.x}px, ${pos.y}px, 0)`,
                width: sz.w,
                height: sz.h,
                zIndex: isActive || isSelected ? 50 : 10,
                transition: isActive ? 'none' : 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), width 0.5s cubic-bezier(0.16, 1, 0.3, 1), height 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
                willChange: 'transform, width, height'
              }}
              className={`group flex flex-col gap-3 p-4 rounded-[2rem] border-2 shadow-2xl transition-all cursor-pointer overflow-hidden ${
                isOccupied
                  ? 'bg-red-500/10 border-red-500/30 shadow-red-500/10'
                  : 'bg-white/5 border-white/10 hover:border-amber-500/40 hover:bg-amber-500/5'
              } ${isEditMode && isActive ? 'ring-2 ring-indigo-500/50 scale-[1.01]' : ''} ${
                isSelected ? 'ring-4 ring-amber-500 border-amber-500 bg-amber-500/5 shadow-amber-500/20' : ''
              }`}
            >
              {/* Status Glow */}
              <div className={`absolute -top-24 -left-24 w-48 h-48 blur-[80px] opacity-20 rounded-full transition-all duration-500 ${isOccupied ? 'bg-red-500' : 'bg-emerald-500'}`} />

              {/* Status Label / Edit Actions */}
              <div className="flex items-center justify-between relative z-10 shrink-0 pointer-events-none">
                <div 
                  style={{ fontSize: `${badgeSize * 0.9}px` }}
                  className={`px-2 py-0.5 rounded-lg font-black uppercase tracking-[0.2em] border shadow-sm ${
                    isOccupied 
                      ? 'bg-red-500/10 text-red-400 border-red-500/20' 
                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  }`}
                >
                  {isOccupied ? 'In Use' : 'Ready'}
                </div>
                <div className="flex items-center gap-1 pointer-events-auto">
                   <button
                      onClick={(e) => { e.stopPropagation(); onEditSlot(slot); }}
                      className="p-1.5 text-white/40 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                    >
                      <Edit2 size={Math.max(12, 14 * scaleFactor)} />
                    </button>
                    {isEditMode && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onDeleteSlot(slot.id); }}
                        className="p-1.5 text-white/40 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all"
                      >
                        <Trash2 size={Math.max(12, 14 * scaleFactor)} />
                      </button>
                    )}
                </div>
              </div>

              <div className="flex-grow flex flex-col items-center justify-center py-1 relative z-10 min-h-0 pointer-events-none">
                <div 
                  style={{ width: iconSize * 1.6, height: iconSize * 1.6, borderRadius: iconSize * 0.6 }}
                  className={`flex items-center justify-center shadow-2xl transition-all duration-700 group-hover:scale-105 group-hover:rotate-2 shrink-0 ${
                    isOccupied 
                      ? 'bg-gradient-to-br from-red-500/20 to-red-600/40 text-red-400 border border-red-500/30' 
                      : 'bg-gradient-to-br from-white/5 to-white/10 text-white/40 border border-white/10'
                  }`}
                >
                  <CarFront size={iconSize * 0.8} />
                </div>
                <p 
                  style={{ fontSize: `${titleSize * 0.85}px` }}
                  className="mt-3 font-black text-white tracking-tight group-hover:text-amber-400 transition-all duration-300 truncate w-full text-center uppercase"
                >
                  {slot.name}
                </p>
              </div>

              {order ? (
                <div 
                  style={{ padding: `${8 * scaleFactor}px` }}
                  className="shrink-0 space-y-1 relative z-10 bg-black/40 backdrop-blur-md rounded-2xl border border-white/5 shadow-inner pointer-events-none"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p style={{ fontSize: `${orderTextSize * 0.8}px` }} className="font-black text-white/80 uppercase tracking-tight truncate flex-1">{order.customerName}</p>
                    <span style={{ fontSize: `${orderTextSize * 1.1}px` }} className="font-black text-amber-400 tabular-nums">₹{Math.round(order.amount || 0)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p style={{ fontSize: `${orderTextSize * 0.7}px` }} className="font-bold text-white/30 uppercase tracking-widest">{order.vehicleNumber}</p>
                    <div className="flex items-center gap-1.5">
                      <div className="w-1 h-1 rounded-full bg-amber-500 animate-pulse" />
                      <span style={{ fontSize: `${orderTextSize * 0.65}px` }} className="font-bold text-white/30 uppercase tracking-widest">{order.elapsedTime || 0}m</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="shrink-0 mb-1 text-center relative z-10 flex flex-col items-center justify-center pointer-events-none">
                  <p style={{ fontSize: `${orderTextSize * 0.8}px` }} className="font-black text-white/10 uppercase tracking-[0.3em] group-hover:text-white/20 transition-colors">Ready</p>
                </div>
              )}

              {/* Action buttons - Hidden in new toolbar version but kept for safety if height is large */}
              {!isEditMode && sz.h > 350 && (
                <div className="shrink-0 pt-1 flex items-center gap-2 relative z-20 pointer-events-auto">
                  <Button
                    variant="primary"
                    size="sm"
                    className={`flex-1 rounded-xl h-10 text-[9px] font-black uppercase tracking-widest transition-all duration-300 ${
                      isOccupied 
                        ? 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/20' 
                        : 'bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-500/20'
                    }`}
                    onClick={(e) => { e.stopPropagation(); onBillingNavigate(slot.id, slot.name); }}
                  >
                    {isOccupied ? 'Bill' : 'New'}
                  </Button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onShowQR(slot); }}
                    className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/80 hover:text-white transition-all duration-300 border border-white/10"
                  >
                    <QrCode size={14} />
                  </button>
                </div>
              )}

              {/* Resize Handle */}
              {isEditMode && (
                <div
                  onPointerDown={e => startResize(e, slot.id)}
                  className="absolute bottom-1 right-1 w-8 h-8 cursor-nwse-resize flex items-center justify-center z-30"
                >
                  <div className="w-2 h-2 bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {isEditMode && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 px-8 py-4 bg-indigo-600/90 backdrop-blur-xl rounded-full border border-indigo-400/50 shadow-2xl z-[100] flex items-center gap-4 text-white animate-in slide-in-from-bottom-4">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
          <p className="text-xs font-black uppercase tracking-widest whitespace-nowrap">
            Layout Editor Active • Fast Mode Enabled
          </p>
        </div>
      )}
    </div>
  );
};
