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
const SIMPLE_STATUS_CFG: Record<string, {
  bg: string;
  border: string;
  text: string;
  label: string;
}> = {
  VACANT: {
    bg: '#ecfdf5', // emerald-50
    border: '#10b981', // emerald-500
    text: '#047857', // emerald-700
    label: 'Vacant',
  },
  OCCUPIED: {
    bg: '#fef2f2', // red-50
    border: '#ef4444', // red-500
    text: '#b91c1c', // red-700
    label: 'Occupied',
  },
  KOT_RUNNING: {
    bg: '#fffbeb', // amber-50
    border: '#f59e0b', // amber-500
    text: '#b45309', // amber-700
    label: 'KOT Running',
  },
  READY: {
    bg: '#f0fdfa', // teal-50
    border: '#14b8a6', // teal-500
    text: '#0f766e', // teal-700
    label: 'Ready',
  },
  SERVED: {
    bg: '#f8fafc', // slate-50
    border: '#64748b', // slate-500
    text: '#334155', // slate-700
    label: 'Served',
  },
  BILL_PRINTED: {
    bg: '#eff6ff', // blue-50
    border: '#3b82f6', // blue-500
    text: '#1d4ed8', // blue-700
    label: 'Bill Printed',
  },
  BILLING_PENDING: {
    bg: '#f5f3ff', // violet-50
    border: '#8b5cf6', // violet-500
    text: '#6d28d9', // violet-700
    label: 'Pending',
  },
  CLEANING: {
    bg: '#f1f5f9', // slate-100
    border: '#94a3b8', // slate-400
    text: '#475569', // slate-600
    label: 'Cleaning',
  },
};

// ─── Simple Flat Table Card ─────────────────────────────────────────
const TableVisualSimple: React.FC<{
  table: Table;
  w: number;
  h: number;
  isSelected: boolean;
  isEditMode: boolean;
}> = ({ table, w, h, isSelected, isEditMode }) => {
  const effectiveStatus = (table.activeOrder?.status === 'READY' || table.activeOrder?.status === 'SERVED')
    ? table.activeOrder.status
    : table.status;
  
  const cfg = SIMPLE_STATUS_CFG[effectiveStatus] || SIMPLE_STATUS_CFG.VACANT;
  const occupied = !!table.activeOrder && effectiveStatus !== 'VACANT' && effectiveStatus !== 'CLEANING';

  return (
    <div style={{ position: 'relative', width: w, height: h }}>
      {/* Main Table Body */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: cfg.bg,
        borderRadius: '12px',
        border: `2px solid ${isSelected ? '#4f46e5' : cfg.border}`,
        boxShadow: isSelected ? '0 0 0 4px rgba(79, 70, 229, 0.2)' : '0 2px 4px rgba(0,0,0,0.05)',
        transition: 'all 0.2s ease',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: cfg.text,
        overflow: 'hidden',
      }}>
        
        {/* Status Badge */}
        <div style={{
          position: 'absolute',
          top: '6px', left: '8px',
          background: 'rgba(255,255,255,0.8)',
          borderRadius: '12px',
          padding: '2px 6px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          fontSize: '10px',
          fontWeight: 600,
          color: cfg.text,
          border: `1px solid ${cfg.border}`,
        }}>
          <div style={{ 
            width: '6px', height: '6px', borderRadius: '50%', background: cfg.text 
          }} />
          {cfg.label}
        </div>

        {/* Seats Info (Top Right) */}
        <div style={{
          position: 'absolute',
          top: '6px', right: '8px',
          fontSize: '10px',
          fontWeight: 600,
          color: cfg.text,
          opacity: 0.8
        }}>
          {table.capacity} <span style={{ fontSize: '8px', opacity: 0.6 }}>SEATS</span>
        </div>

        {/* Table Name */}
        <h3 style={{
          fontSize: occupied ? Math.max(14, Math.min(20, w * 0.12)) : Math.max(16, Math.min(24, w * 0.15)),
          fontWeight: 700,
          margin: 0,
          marginTop: occupied ? '-8px' : '8px',
          color: cfg.text,
        }}>
          {table.name}
        </h3>

        {/* Active Order Info */}
        {occupied && table.activeOrder && (
          <div style={{
            position: 'absolute',
            bottom: '8px',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '2px'
          }}>
            <div style={{
              fontSize: Math.max(14, Math.min(18, w * 0.12)),
              fontWeight: 800,
              color: cfg.text,
            }}>
              ₹{table.activeOrder.amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </div>
            <div style={{
              fontSize: '10px',
              fontWeight: 600,
              color: cfg.text,
              opacity: 0.9,
              background: 'rgba(255,255,255,0.5)',
              padding: '2px 8px',
              borderRadius: '8px',
            }}>
              {table.activeOrder.itemCount} items · {table.activeOrder.elapsedTime}m
            </div>
          </div>
        )}

        {/* Edit mode hint */}
        {isEditMode && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(79,70,229,0.05)', border: '2px dashed rgba(79,70,229,0.5)', pointerEvents: 'none' }} />
        )}
      </div>
    </div>
  );
};

// ─── Main TableLayoutView ─────────────────────────────────────
const MIN_W = 120;
const MIN_H = 90;
const DEFAULT_W = 240;
const DEFAULT_H = 150;
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
          // SQLite/Prisma defaults newly created tables to x: 0, y: 0.
          // Treat these (or any nullish values) as unpositioned and lay them out in a 4-column grid.
          const isUnpositioned = t.x === null || t.x === undefined || t.y === null || t.y === undefined || (t.x === 0 && t.y === 0);
          next[t.id] = {
            x: isUnpositioned ? (idx % cols) * 280 + 60 : (t.x ?? 0),
            y: isUnpositioned ? Math.floor(idx / cols) * 190 + 60 : (t.y ?? 0),
          };
        }
      });
      return next;
    });
    setSizes(prev => {
      const next = { ...prev };
      tables.forEach(t => {
        if (!next[t.id]) {
          // If width and height match the database defaults (256 and 176) or are nullish,
          // treat them as unedited and enforce our uniform DEFAULT_W and DEFAULT_H.
          // Otherwise, respect the user's manual resizing choices.
          const hasCustomSize = t.width !== null && t.width !== undefined && t.height !== null && t.height !== undefined && (t.width !== 256 || t.height !== 176);
          next[t.id] = { 
            w: hasCustomSize ? (t.width ?? DEFAULT_W) : DEFAULT_W, 
            h: hasCustomSize ? (t.height ?? DEFAULT_H) : DEFAULT_H 
          };
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

          const padX = 0;
          const padY = 0;

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
                <TableVisualSimple
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
