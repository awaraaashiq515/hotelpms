'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Table } from './TableCard';

interface TableLayoutViewProps {
  tables: Table[];
  onTableClick: (table: Table) => void;
  onTableDoubleClick?: (table: Table) => void;
  isEditMode?: boolean;
  onTablePositionChange?: (id: string, x: number, y: number) => void;
  onTableResize?: (id: string, width: number, height: number) => void;
  onPrintKOT?: (table: Table) => void;
  onPrintBill?: (table: Table) => void;
  onEditTable?: (table: Table) => void;
  onDeleteTable?: (id: string) => void;
  onSwitchTable?: (table: Table) => void;
  onResetTable?: (table: Table) => void;
  selectedTableId?: string | null;
}

// ─── Status config ────────────────────────────────────────────
const STATUS_CFG: Record<string, {
  surface: string;
  rim: string;
  glow: string;
  label: string;
  accent: string;
  gradient: string;
  shadow: string;
}> = {
  VACANT: {
    surface: 'rgba(16, 40, 26, 0.75)',
    rim: 'rgba(34, 197, 94, 0.5)',
    glow: 'rgba(34, 197, 94, 0.4)',
    label: 'Free',
    accent: '#34d399',
    gradient: 'linear-gradient(145deg, rgba(34,197,94,0.15) 0%, rgba(6,30,16,0.8) 100%)',
    shadow: '0 20px 40px -10px rgba(34,197,94,0.15), 0 0 20px rgba(34,197,94,0.1)'
  },
  OCCUPIED: {
    surface: 'rgba(60, 16, 20, 0.75)',
    rim: 'rgba(239, 68, 68, 0.5)',
    glow: 'rgba(239, 68, 68, 0.4)',
    label: 'Busy',
    accent: '#f87171',
    gradient: 'linear-gradient(145deg, rgba(239,68,68,0.15) 0%, rgba(40,10,10,0.8) 100%)',
    shadow: '0 20px 40px -10px rgba(239,68,68,0.2), 0 0 20px rgba(239,68,68,0.15)'
  },
  KOT_RUNNING: {
    surface: 'rgba(60, 35, 10, 0.75)',
    rim: 'rgba(245, 158, 11, 0.5)',
    glow: 'rgba(245, 158, 11, 0.4)',
    label: 'Cooking',
    accent: '#fbbf24',
    gradient: 'linear-gradient(145deg, rgba(245,158,11,0.15) 0%, rgba(40,20,5,0.8) 100%)',
    shadow: '0 20px 40px -10px rgba(245,158,11,0.2), 0 0 20px rgba(245,158,11,0.15)'
  },
  BILL_PRINTED: {
    surface: 'rgba(15, 25, 55, 0.75)',
    rim: 'rgba(59, 130, 246, 0.5)',
    glow: 'rgba(59, 130, 246, 0.4)',
    label: 'Billed',
    accent: '#60a5fa',
    gradient: 'linear-gradient(145deg, rgba(59,130,246,0.15) 0%, rgba(10,15,40,0.8) 100%)',
    shadow: '0 20px 40px -10px rgba(59,130,246,0.2), 0 0 20px rgba(59,130,246,0.15)'
  },
  BILLING_PENDING: {
    surface: 'rgba(35, 15, 55, 0.75)',
    rim: 'rgba(139, 92, 246, 0.5)',
    glow: 'rgba(139, 92, 246, 0.4)',
    label: 'Pending',
    accent: '#a78bfa',
    gradient: 'linear-gradient(145deg, rgba(139,92,246,0.15) 0%, rgba(20,10,40,0.8) 100%)',
    shadow: '0 20px 40px -10px rgba(139,92,246,0.2), 0 0 20px rgba(139,92,246,0.15)'
  },
  CLEANING: {
    surface: 'rgba(30, 35, 45, 0.75)',
    rim: 'rgba(148, 163, 184, 0.4)',
    glow: 'rgba(148, 163, 184, 0.2)',
    label: 'Cleaning',
    accent: '#94a3b8',
    gradient: 'linear-gradient(145deg, rgba(148,163,184,0.1) 0%, rgba(15,20,30,0.8) 100%)',
    shadow: '0 20px 40px -10px rgba(0,0,0,0.5), 0 0 20px rgba(0,0,0,0.2)'
  },
};

// ─── Distribute chairs ────────────────────────────────────────
function distributeChairs(cap: number) {
  const n = Math.min(Math.max(cap, 1), 12);
  if (n === 1) return { top: 1, bottom: 0, left: 0, right: 0 };
  if (n === 2) return { top: 1, bottom: 1, left: 0, right: 0 };
  if (n === 3) return { top: 1, bottom: 1, left: 1, right: 0 };
  if (n === 4) return { top: 1, bottom: 1, left: 1, right: 1 };
  if (n === 5) return { top: 2, bottom: 2, left: 1, right: 0 };
  if (n === 6) return { top: 2, bottom: 2, left: 1, right: 1 };
  if (n === 7) return { top: 3, bottom: 2, left: 1, right: 1 };
  if (n === 8) return { top: 3, bottom: 3, left: 1, right: 1 };
  if (n === 9) return { top: 3, bottom: 3, left: 2, right: 1 };
  if (n === 10) return { top: 3, bottom: 3, left: 2, right: 2 };
  if (n === 11) return { top: 4, bottom: 3, left: 2, right: 2 };
  return { top: 4, bottom: 4, left: 2, right: 2 };
}

// ─── 2.5D Premium Table Card ─────────────────────────────────────────
const TableVisualPremium: React.FC<{
  table: Table;
  w: number;
  h: number;
  isSelected: boolean;
  isEditMode: boolean;
}> = ({ table, w, h, isSelected, isEditMode }) => {
  const cfg = STATUS_CFG[table.status] || STATUS_CFG.VACANT;
  const occupied = !!table.activeOrder && table.status !== 'VACANT' && table.status !== 'CLEANING';
  const dist = distributeChairs(table.capacity);

  // Dynamic Chair Sizes
  const CW = Math.max(24, Math.min(32, w * 0.2));
  const CH = Math.max(12, Math.min(16, h * 0.15));
  const GAP = 12;

  const padX = CW + GAP;
  const padY = CH + GAP;

  const chairBase = isSelected ? '#4f46e5' : '#1e202e';
  const chairTop = isSelected ? '#6366f1' : '#2a2d3d';

  const chairs: React.ReactNode[] = [];
  let k = 0;

  const renderChair = (x: number, y: number, w: number, h: number, pos: 'top'|'bottom'|'left'|'right') => {
    const seatColor = isSelected ? '#3730a3' : '#1a1d27';
    const backrestColor = isSelected ? '#4f46e5' : '#2d3142';
    const highlightColor = isSelected ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)';
    
    // The thick border represents the wooden/metal backrest wrapping around the seat.
    // The background represents the plush cushion.
    const backThickness = '4px';

    let style: React.CSSProperties = {
      position: 'absolute',
      left: x, top: y, width: w, height: h,
      background: seatColor,
      transition: 'all 0.3s ease',
      boxShadow: `inset 0 0 8px rgba(0,0,0,0.6), 0 8px 16px rgba(0,0,0,0.5)`,
      border: `solid ${backrestColor}`,
    };

    if (pos === 'top') {
      style.borderWidth = `${backThickness} ${backThickness} 0 ${backThickness}`;
      style.borderRadius = '12px 12px 4px 4px';
      style.borderTopColor = highlightColor; // light catching the top rim
    } else if (pos === 'bottom') {
      style.borderWidth = `0 ${backThickness} ${backThickness} ${backThickness}`;
      style.borderRadius = '4px 4px 12px 12px';
      style.borderBottomColor = highlightColor;
    } else if (pos === 'left') {
      style.borderWidth = `${backThickness} 0 ${backThickness} ${backThickness}`;
      style.borderRadius = '12px 4px 4px 12px';
      style.borderLeftColor = highlightColor;
    } else if (pos === 'right') {
      style.borderWidth = `${backThickness} ${backThickness} ${backThickness} 0`;
      style.borderRadius = '4px 12px 12px 4px';
      style.borderRightColor = highlightColor;
    }

    return (
      <div key={k++} style={style} />
    );
  };

  // TOP
  for (let i = 0; i < dist.top; i++) {
    const sp = w / (dist.top + 1);
    chairs.push(renderChair(padX + sp * (i + 1) - CW / 2, padY - GAP - CH, CW, CH, 'top'));
  }
  // BOTTOM
  for (let i = 0; i < dist.bottom; i++) {
    const sp = w / (dist.bottom + 1);
    chairs.push(renderChair(padX + sp * (i + 1) - CW / 2, padY + h + GAP, CW, CH, 'bottom'));
  }
  // LEFT
  for (let i = 0; i < dist.left; i++) {
    const sp = h / (dist.left + 1);
    chairs.push(renderChair(padX - GAP - CH, padY + sp * (i + 1) - CW / 2, CH, CW, 'left'));
  }
  // RIGHT
  for (let i = 0; i < dist.right; i++) {
    const sp = h / (dist.right + 1);
    chairs.push(renderChair(padX + w + GAP, padY + sp * (i + 1) - CW / 2, CH, CW, 'right'));
  }

  return (
    <div style={{ position: 'relative', width: w + padX * 2, height: h + padY * 2 }}>
      
      {/* Chairs */}
      {chairs}

      {/* Main Table Body (Extruded 3D Base) */}
      <div style={{
        position: 'absolute',
        left: padX, top: padY, width: w, height: h,
        background: '#0a0c10', // Dark base color for the extrusion
        borderRadius: '16px',
        boxShadow: cfg.shadow, // Massive floor shadow
        transition: 'all 0.3s ease'
      }}>
        {/* Table Top Surface */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: cfg.surface,
          backgroundImage: cfg.gradient,
          borderRadius: '16px',
          border: `1.5px solid ${cfg.rim}`,
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          transform: isEditMode ? 'translateY(0)' : 'translateY(-6px)', // Lifts up when not editing
          transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          overflow: 'hidden',
          boxShadow: isSelected 
            ? `0 0 0 3px ${cfg.accent}, inset 0 0 30px ${cfg.glow}` 
            : `inset 0 1px 1px rgba(255,255,255,0.15)`
        }}>
          
          {/* Subtle Top Inner Glow */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: '40%',
            background: 'linear-gradient(to bottom, rgba(255,255,255,0.08), transparent)',
            pointerEvents: 'none'
          }} />

          {/* Status Badge */}
          <div style={{
            position: 'absolute',
            top: '8px', left: '10px',
            background: 'rgba(0,0,0,0.4)',
            border: `1px solid ${cfg.rim}`,
            borderRadius: '20px',
            padding: '3px 8px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '9px',
            fontWeight: 800,
            letterSpacing: '0.05em',
            color: cfg.accent,
            textTransform: 'uppercase',
            boxShadow: `0 2px 10px rgba(0,0,0,0.5)`
          }}>
            <div style={{ 
              width: '6px', height: '6px', borderRadius: '50%', background: cfg.accent, 
              boxShadow: `0 0 8px ${cfg.accent}` 
            }} />
            {cfg.label}
          </div>

          {/* Table Name */}
          <h3 style={{
            fontSize: occupied ? Math.max(14, Math.min(18, w * 0.1)) : Math.max(16, Math.min(22, w * 0.12)),
            fontWeight: 800,
            margin: 0,
            marginTop: occupied ? '-12px' : '0',
            textShadow: '0 2px 8px rgba(0,0,0,0.8)',
            color: 'rgba(255,255,255,0.95)',
            letterSpacing: '0.5px'
          }}>
            {table.name}
          </h3>

          {/* Seats */}
          <div style={{
            fontSize: '10px',
            fontWeight: 800,
            color: 'rgba(255,255,255,0.4)',
            letterSpacing: '1.5px',
            marginTop: '4px'
          }}>
            {table.capacity} SEATS
          </div>

          {/* Active Order Info */}
          {occupied && table.activeOrder && (
            <div style={{
              position: 'absolute',
              bottom: '10px',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '2px'
            }}>
              <div style={{
                fontSize: Math.max(13, Math.min(16, w * 0.1)),
                fontWeight: 900,
                color: 'white',
                textShadow: '0 2px 4px rgba(0,0,0,0.5)'
              }}>
                ₹{table.activeOrder.amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </div>
              <div style={{
                fontSize: '8px',
                fontWeight: 700,
                color: 'rgba(255,255,255,0.8)',
                background: 'rgba(0,0,0,0.4)',
                padding: '2px 6px',
                borderRadius: '6px',
                border: '1px solid rgba(255,255,255,0.1)'
              }}>
                {table.activeOrder.itemCount} items · {table.activeOrder.elapsedTime}m
              </div>
            </div>
          )}

          {/* Edit mode hint */}
          {isEditMode && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(99,102,241,0.05)', border: '2px dashed rgba(99,102,241,0.6)', pointerEvents: 'none' }} />
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Main TableLayoutView ─────────────────────────────────────
const MIN_W = 120;
const MIN_H = 90;
const DEFAULT_W = 160;
const DEFAULT_H = 110;
const SNAP = 10;

export const TableLayoutView: React.FC<TableLayoutViewProps> = ({
  tables,
  onTableClick,
  onTableDoubleClick,
  isEditMode = false,
  onTablePositionChange,
  onTableResize,
  onEditTable,
  onDeleteTable,
  selectedTableId,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Local state: positions & sizes
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({});
  const [sizes, setSizes] = useState<Record<string, { w: number; h: number }>>({});

  // Interaction state
  const dragRef = useRef<{
    id: string;
    startX: number; startY: number;
    origX: number; origY: number;
  } | null>(null);
  const resizeRef = useRef<{
    id: string;
    startX: number; startY: number;
    origW: number; origH: number;
  } | null>(null);

  // Init positions from DB or auto-grid
  useEffect(() => {
    setPositions(prev => {
      const next = { ...prev };
      tables.forEach((t, idx) => {
        if (!next[t.id]) {
          const cols = 4;
          next[t.id] = {
            x: t.x ?? (idx % cols) * 250 + 80,
            y: t.y ?? Math.floor(idx / cols) * 220 + 80,
          };
        }
      });
      return next;
    });
    setSizes(prev => {
      const next = { ...prev };
      tables.forEach(t => {
        if (!next[t.id]) {
          next[t.id] = { w: t.width ?? DEFAULT_W, h: t.height ?? DEFAULT_H };
        }
      });
      return next;
    });
  }, [tables]);

  // ── Pointer handlers attached to the container ─────────────
  const onContainerPointerMove = useCallback((e: React.PointerEvent) => {
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

  const onContainerPointerUp = useCallback((e: React.PointerEvent) => {
    if (dragRef.current) {
      const { id } = dragRef.current;
      const pos = positions[id];
      if (pos) onTablePositionChange?.(id, pos.x, pos.y);
      dragRef.current = null;
    }
    if (resizeRef.current) {
      const { id } = resizeRef.current;
      const sz = sizes[id];
      if (sz) onTableResize?.(id, sz.w, sz.h);
      resizeRef.current = null;
    }
  }, [positions, sizes, onTablePositionChange, onTableResize]);

  const startDrag = useCallback((e: React.PointerEvent, id: string) => {
    if (!isEditMode) return;
    e.stopPropagation();
    e.preventDefault();
    const pos = positions[id] ?? { x: 0, y: 0 };
    dragRef.current = { id, startX: e.clientX, startY: e.clientY, origX: pos.x, origY: pos.y };
  }, [isEditMode, positions]);

  const startResize = useCallback((e: React.PointerEvent, id: string) => {
    if (!isEditMode) return;
    e.stopPropagation();
    e.preventDefault();
    const sz = sizes[id] ?? { w: DEFAULT_W, h: DEFAULT_H };
    resizeRef.current = { id, startX: e.clientX, startY: e.clientY, origW: sz.w, origH: sz.h };
  }, [isEditMode, sizes]);

  if (tables.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4 min-h-[500px]">
        <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10">
          <svg className="w-8 h-8 opacity-20 text-white" fill="none" stroke="white" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 6h16M4 12h16M4 18h7" />
          </svg>
        </div>
        <p className="text-sm font-black uppercase tracking-widest text-white/20">No tables on this floor</p>
        <p className="text-xs text-white/10 uppercase tracking-wider">Click "New Table" to add one</p>
      </div>
    );
  }

  // Find max bounds so we can pad the container
  const maxRight = Math.max(...tables.map(t => (positions[t.id]?.x || 0) + (sizes[t.id]?.w || 0))) + 200;
  const maxBottom = Math.max(...tables.map(t => (positions[t.id]?.y || 0) + (sizes[t.id]?.h || 0))) + 200;

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-auto no-scrollbar"
      style={{
        background: 'transparent',
        cursor: isEditMode ? 'crosshair' : 'default',
        touchAction: 'none',
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        backgroundPosition: '0 0',
        perspective: 'none'
      }}
      onPointerMove={onContainerPointerMove}
      onPointerUp={onContainerPointerUp}
      onPointerLeave={onContainerPointerUp}
    >
      <div 
        key="fresh-canvas-v2"
        style={{
          position: 'relative',
          width: Math.max(1200, maxRight),
          height: Math.max(800, maxBottom),
          transform: 'none', // Explicitly override any lingering transform
          perspective: 'none'
        }}
      >
        {tables.map(table => {
          const pos = positions[table.id] ?? { x: 60, y: 60 };
          const sz = sizes[table.id] ?? { w: DEFAULT_W, h: DEFAULT_H };
          const isSelected = table.id === selectedTableId;
          const isDragging = dragRef.current?.id === table.id;
          const isResizing = resizeRef.current?.id === table.id;

          const CW = Math.max(24, Math.min(32, sz.w * 0.2));
          const CH = Math.max(12, Math.min(16, sz.h * 0.15));
          const padX = CW + 12;
          const padY = CH + 12;

          return (
            <div
              key={table.id}
              style={{
                position: 'absolute',
                left: pos.x - padX,
                top: pos.y - padY,
                width: sz.w + padX * 2,
                height: sz.h + padY * 2,
                zIndex: isSelected || isDragging || isResizing ? 50 : 10,
                transition: isDragging || isResizing ? 'none' : 'all 0.2s ease',
              }}
            >
              {/* Drag handle */}
              <div
                onPointerDown={e => startDrag(e, table.id)}
                onClick={() => { if (!isEditMode) onTableClick(table); }}
                onDoubleClick={() => { if (!isEditMode) onTableDoubleClick?.(table); }}
                style={{
                  position: 'absolute',
                  inset: 0,
                  cursor: isEditMode ? 'grab' : 'pointer',
                  userSelect: 'none',
                }}
              >
                <TableVisualPremium
                  table={table}
                  w={sz.w}
                  h={sz.h}
                  isSelected={isSelected}
                  isEditMode={isEditMode}
                />
              </div>

              {/* ── Resize handle ── */}
              {isEditMode && (
                <div
                  onPointerDown={e => startResize(e, table.id)}
                  style={{
                    position: 'absolute',
                    right: padX - 8,
                    bottom: padY - 8,
                    width: 24,
                    height: 24,
                    cursor: 'nwse-resize',
                    zIndex: 60,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <div style={{
                    width: 14,
                    height: 14,
                    background: 'rgba(99,102,241,1)',
                    borderRadius: '50%',
                    border: '2px solid white',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.5)'
                  }} />
                </div>
              )}

              {/* ── Edit/Delete buttons ── */}
              {isEditMode && (
                <div
                  style={{
                    position: 'absolute',
                    top: padY - 14,
                    right: padX - 10,
                    display: 'flex',
                    gap: 6,
                    zIndex: 60,
                    pointerEvents: 'auto',
                  }}
                >
                  <button
                    onPointerDown={e => e.stopPropagation()}
                    onClick={e => { e.stopPropagation(); onEditTable?.(table); }}
                    style={{
                      width: 28, height: 28,
                      background: '#4f46e5', borderRadius: 8,
                      border: 'none', color: 'white',
                      fontSize: 14, fontWeight: 900,
                      cursor: 'pointer', display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 4px 12px rgba(99,102,241,0.4)',
                    }}
                    title="Edit Table"
                  >
                    ✎
                  </button>
                  <button
                    onPointerDown={e => e.stopPropagation()}
                    onClick={e => { e.stopPropagation(); onDeleteTable?.(table.id); }}
                    style={{
                      width: 28, height: 28,
                      background: '#dc2626', borderRadius: 8,
                      border: 'none', color: 'white',
                      fontSize: 12, fontWeight: 900,
                      cursor: 'pointer', display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 4px 12px rgba(220,38,38,0.4)',
                    }}
                    title="Delete Table"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Edit mode helper tip */}
      {isEditMode && (
        <div style={{
          position: 'fixed',
          bottom: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(99,102,241,0.9)',
          backdropFilter: 'blur(12px)',
          color: 'white',
          padding: '10px 24px',
          borderRadius: 30,
          fontSize: 12,
          fontWeight: 800,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          zIndex: 100,
          boxShadow: '0 8px 32px rgba(99,102,241,0.4)',
          pointerEvents: 'none',
        }}>
          🖱 Drag to move · ↘ Corner handle to resize
        </div>
      )}
    </div>
  );
};
