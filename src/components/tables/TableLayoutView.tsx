import React, { useRef, useState, useEffect } from 'react';
import { Table, TableCard } from './TableCard';

interface TableLayoutViewProps {
  tables: Table[];
  onTableClick: (table: Table) => void;
  isEditMode?: boolean;
  onTablePositionChange?: (id: string, x: number, y: number) => void;
  onTableResize?: (id: string, width: number, height: number) => void;
  onPrintKOT?: (table: Table) => void;
  onPrintBill?: (table: Table) => void;
  onEditTable?: (table: Table) => void;
  onDeleteTable?: (id: string) => void;
  onSwitchTable?: (table: Table) => void;
  onResetTable?: (table: Table) => void;
}

// ─────────────────────────────────────────────
//  Chair SVG – a simple pill shape
// ─────────────────────────────────────────────
const ChairIcon: React.FC<{
  style?: React.CSSProperties;
  occupied: boolean;
  rotate?: boolean;
}> = ({ style, occupied, rotate }) => (
  <div
    style={{
      position: 'absolute',
      ...style,
    }}
  >
    {/* Seat */}
    <div style={{
      width: '100%',
      height: '70%',
      borderRadius: rotate ? '5px 5px 8px 8px' : '8px 8px 5px 5px',
      background: occupied
        ? 'linear-gradient(160deg, #c9a87c 0%, #8a6035 100%)'
        : 'linear-gradient(160deg, #e8ddd0 0%, #c8b89a 100%)',
      border: `2px solid ${occupied ? '#7a5030' : '#b0a088'}`,
      boxShadow: occupied
        ? '0 3px 8px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.2)'
        : '0 3px 6px rgba(0,0,0,0.14), inset 0 1px 0 rgba(255,255,255,0.4)',
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
    }} />
    {/* Backrest */}
    <div style={{
      width: '75%',
      height: '35%',
      borderRadius: rotate ? '3px 3px 6px 6px' : '6px 6px 3px 3px',
      background: occupied
        ? 'linear-gradient(160deg, #a07040 0%, #6a4020 100%)'
        : 'linear-gradient(160deg, #d8ccc0 0%, #b8a890 100%)',
      border: `2px solid ${occupied ? '#6a4020' : '#a09080'}`,
      boxShadow: '0 2px 4px rgba(0,0,0,0.12)',
      position: 'absolute',
      top: 0,
      left: '12.5%',
    }} />
  </div>
);

// ─────────────────────────────────────────────
//  Distribute chairs per side based on capacity
// ─────────────────────────────────────────────
function distributeChairs(capacity: number) {
  const n = Math.min(Math.max(capacity, 1), 12);
  if (n === 1) return { top: 1,  bottom: 0,  left: 0, right: 0 };
  if (n === 2) return { top: 1,  bottom: 1,  left: 0, right: 0 };
  if (n === 3) return { top: 1,  bottom: 1,  left: 1, right: 0 };
  if (n === 4) return { top: 1,  bottom: 1,  left: 1, right: 1 };
  if (n === 5) return { top: 2,  bottom: 2,  left: 1, right: 0 };
  if (n === 6) return { top: 2,  bottom: 2,  left: 1, right: 1 };
  if (n === 7) return { top: 2,  bottom: 2,  left: 2, right: 1 };
  if (n === 8) return { top: 2,  bottom: 2,  left: 2, right: 2 };
  if (n === 9) return { top: 3,  bottom: 3,  left: 2, right: 1 };
  if (n === 10) return { top: 3, bottom: 3,  left: 2, right: 2 };
  if (n === 11) return { top: 3, bottom: 3,  left: 3, right: 2 };
  return            { top: 3,  bottom: 3,  left: 3, right: 3 };
}

// ─────────────────────────────────────────────
//  Chairs rendered AROUND a card of given size
// ─────────────────────────────────────────────
const ChairsAround: React.FC<{
  capacity: number;
  cardW: number;
  cardH: number;
  occupied: boolean;
}> = ({ capacity, cardW, cardH, occupied }) => {
  const dist = distributeChairs(capacity);
  const CHAIR_W = 36;  // wider seat
  const CHAIR_H = 20;  // taller with backrest
  const GAP = 8;       // gap between card edge and chair

  const chairs: React.ReactNode[] = [];

  // TOP chairs — backrest faces UP (away from table)
  for (let i = 0; i < dist.top; i++) {
    const spacing = cardW / (dist.top + 1);
    chairs.push(
      <ChairIcon
        key={`top-${i}`}
        occupied={occupied}
        style={{
          left: spacing * (i + 1) - CHAIR_W / 2,
          top: -(CHAIR_H + GAP),
          width: CHAIR_W,
          height: CHAIR_H,
        }}
      />
    );
  }

  // BOTTOM chairs — backrest faces DOWN (away from table)
  for (let i = 0; i < dist.bottom; i++) {
    const spacing = cardW / (dist.bottom + 1);
    chairs.push(
      <ChairIcon
        key={`bot-${i}`}
        occupied={occupied}
        rotate
        style={{
          left: spacing * (i + 1) - CHAIR_W / 2,
          bottom: -(CHAIR_H + GAP),
          width: CHAIR_W,
          height: CHAIR_H,
        }}
      />
    );
  }

  // LEFT chairs (tall orientation)
  for (let i = 0; i < dist.left; i++) {
    const spacing = cardH / (dist.left + 1);
    chairs.push(
      <ChairIcon
        key={`lft-${i}`}
        occupied={occupied}
        style={{
          top: spacing * (i + 1) - CHAIR_W / 2,
          left: -(CHAIR_H + GAP),
          width: CHAIR_H,
          height: CHAIR_W,
        }}
      />
    );
  }

  // RIGHT chairs (tall orientation)
  for (let i = 0; i < dist.right; i++) {
    const spacing = cardH / (dist.right + 1);
    chairs.push(
      <ChairIcon
        key={`rgt-${i}`}
        occupied={occupied}
        rotate
        style={{
          top: spacing * (i + 1) - CHAIR_W / 2,
          right: -(CHAIR_H + GAP),
          width: CHAIR_H,
          height: CHAIR_W,
        }}
      />
    );
  }

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: cardW,
        height: cardH,
        pointerEvents: 'none',
        zIndex: 0,
      }}
    >
      {chairs}
    </div>
  );
};

// ─────────────────────────────────────────────
//  Main Component
// ─────────────────────────────────────────────
const CHAIR_PADDING = 30; // extra px on each side for chairs

export const TableLayoutView: React.FC<TableLayoutViewProps> = ({
  tables,
  onTableClick,
  isEditMode = false,
  onTablePositionChange,
  onTableResize,
  onPrintKOT,
  onPrintBill,
  onEditTable,
  onDeleteTable,
  onSwitchTable,
  onResetTable,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [draggingTable, setDraggingTable] = useState<string | null>(null);
  const [resizingTable, setResizingTable] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, w: 0, h: 0 });
  const [localPositions, setLocalPositions] = useState<Record<string, { x: number; y: number }>>({});
  const [localDimensions, setLocalDimensions] = useState<Record<string, { w: number; h: number }>>({});

  // Sync local positions map with incoming tables
  useEffect(() => {
    const pos: Record<string, { x: number; y: number }> = {};
    const dims: Record<string, { w: number; h: number }> = {};
    tables.forEach((t, idx) => {
      let x = t.x || 0;
      let y = t.y || 0;
      if (!t.x && !t.y) {
        const cols = 4;
        x = (idx % cols) * 260 + 20;
        y = Math.floor(idx / cols) * 200 + 20;
      }
      pos[t.id] = { x, y };
      dims[t.id] = { w: t.width || 256, h: t.height || 176 };
    });
    setLocalPositions(pos);
    setLocalDimensions(dims);
  }, [tables]);

  if (tables.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-4 min-h-[400px]">
        <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center">
          <svg className="w-10 h-10 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <p className="text-sm font-black uppercase tracking-widest">No tables defined for this floor</p>
      </div>
    );
  }

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>, id: string) => {
    if (!isEditMode) return;
    if ((e.target as HTMLElement).closest('button')) return;
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setDraggingTable(id);
  };

  const handleResizePointerDown = (e: React.PointerEvent<HTMLDivElement>, id: string) => {
    if (!isEditMode) return;
    e.stopPropagation();
    e.preventDefault();
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setResizingTable(id);
    const dim = localDimensions[id] || { w: 256, h: 176 };
    setResizeStart({ x: e.clientX, y: e.clientY, w: dim.w, h: dim.h });
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isEditMode) return;
    if (resizingTable && resizingTable === e.currentTarget.dataset.id) {
      const dx = e.clientX - resizeStart.x;
      const dy = e.clientY - resizeStart.y;
      const snap = 20;
      const newW = Math.max(120, Math.round((resizeStart.w + dx) / snap) * snap);
      const newH = Math.max(100, Math.round((resizeStart.h + dy) / snap) * snap);
      setLocalDimensions(prev => ({ ...prev, [resizingTable]: { w: newW, h: newH } }));
      return;
    }
    if (draggingTable && draggingTable === e.currentTarget.dataset.id && containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const newX = e.clientX - containerRect.left + containerRef.current.scrollLeft - dragOffset.x;
      const newY = e.clientY - containerRect.top + containerRef.current.scrollTop - dragOffset.y;
      setLocalPositions(prev => ({
        ...prev,
        [draggingTable]: { x: Math.max(0, newX), y: Math.max(0, newY) },
      }));
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isEditMode) return;
    if (resizingTable && resizingTable === e.currentTarget.dataset.id) {
      e.currentTarget.releasePointerCapture(e.pointerId);
      const dim = localDimensions[resizingTable];
      if (dim && onTableResize) onTableResize(resizingTable, dim.w, dim.h);
      setResizingTable(null);
      return;
    }
    if (draggingTable && draggingTable === e.currentTarget.dataset.id) {
      e.currentTarget.releasePointerCapture(e.pointerId);
      const pos = localPositions[draggingTable];
      if (pos && onTablePositionChange) {
        const snap = 20;
        const snappedX = Math.round(pos.x / snap) * snap;
        const snappedY = Math.round(pos.y / snap) * snap;
        onTablePositionChange(draggingTable, snappedX, snappedY);
        setLocalPositions(prev => ({ ...prev, [draggingTable]: { x: snappedX, y: snappedY } }));
      }
      setDraggingTable(null);
    }
  };

  // ── Background style (warm restaurant floor)  ──
  const floorBg: React.CSSProperties = {
    background:
      'repeating-linear-gradient(0deg, transparent, transparent 39px, #e2d5c3 39px, #e2d5c3 40px), repeating-linear-gradient(90deg, transparent, transparent 39px, #e2d5c3 39px, #e2d5c3 40px)',
    backgroundColor: '#ede8e0',
  };

  // ── GRID layout (no saved positions) ──
  const allAtZero = tables.every(t => !t.x && !t.y);
  const useGridLayout = allAtZero && !isEditMode;

  if (useGridLayout) {
    return (
      <div
        className="h-full overflow-auto"
        style={{
          ...floorBg,
          padding: `${CHAIR_PADDING + 28}px ${CHAIR_PADDING + 20}px`,
          display: 'flex',
          flexWrap: 'wrap',
          gap: `${CHAIR_PADDING * 3}px ${CHAIR_PADDING * 2.5}px`,
          alignContent: 'flex-start',
        }}
      >
        {tables.map(table => {
          const occupied = !!table.activeOrder && table.status !== 'VACANT' && table.status !== 'CLEANING';
          // Default card dimensions used in grid mode
          const cardW = 200;
          const cardH = 150;

          return (
            <div
              key={table.id}
              style={{
                position: 'relative',
                width: cardW,
                height: cardH,
                // Expand the hit-area so chairs don't clip
                padding: CHAIR_PADDING,
                margin: -CHAIR_PADDING,
              }}
            >
              {/* Chairs behind card */}
              <ChairsAround
                capacity={table.capacity}
                cardW={cardW}
                cardH={cardH}
                occupied={occupied}
              />
              {/* Original Card on top */}
              <div style={{ position: 'relative', zIndex: 1, width: cardW, height: cardH }}>
                <TableCard
                  table={table}
                  onClick={onTableClick}
                  onPrintKOT={onPrintKOT}
                  onPrintBill={onPrintBill}
                  onSwitchTable={onSwitchTable}
                  onResetTable={onResetTable}
                />
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // ── FREE-FORM absolute layout ──
  return (
    <div
      ref={containerRef}
      className={`relative w-full h-[800px] overflow-auto ${isEditMode ? 'cursor-crosshair' : ''}`}
      style={{ ...floorBg, touchAction: isEditMode ? 'none' : 'auto' }}
    >
      {tables.map(table => {
        const pos = localPositions[table.id] || { x: 0, y: 0 };
        const dim = localDimensions[table.id] || { w: 256, h: 176 };
        const isDragging = draggingTable === table.id;
        const isResizing = resizingTable === table.id;
        const occupied =
          !!table.activeOrder && table.status !== 'VACANT' && table.status !== 'CLEANING';

        return (
          <div
            key={table.id}
            data-id={table.id}
            onPointerDown={e => handlePointerDown(e, table.id)}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className={`absolute ${
              isEditMode
                ? 'cursor-grab active:cursor-grabbing hover:ring-4 hover:ring-indigo-400 rounded-2xl z-20 shadow-2xl'
                : 'z-10'
            } transition-transform ${
              isDragging || isResizing
                ? 'opacity-90 z-50 ring-4 ring-indigo-500 shadow-indigo-200 duration-0'
                : 'opacity-100 duration-200'
            }`}
            style={{
              width: `${dim.w}px`,
              height: `${dim.h}px`,
              transform: `translate(${pos.x}px, ${pos.y}px)`,
              pointerEvents: 'auto',
              userSelect: 'none',
            }}
          >
            {/* Chairs (rendered absolutely relative to card, outside it) */}
            <ChairsAround
              capacity={table.capacity}
              cardW={dim.w}
              cardH={dim.h}
              occupied={occupied}
            />

            <div className={`w-full h-full ${isEditMode ? 'pointer-events-none' : ''}`} style={{ position: 'relative', zIndex: 1 }}>
              <TableCard
                table={table}
                onClick={isEditMode ? () => {} : onTableClick}
                onPrintKOT={isEditMode ? undefined : onPrintKOT}
                onPrintBill={isEditMode ? undefined : onPrintBill}
                onSwitchTable={isEditMode ? undefined : onSwitchTable}
                onResetTable={isEditMode ? undefined : onResetTable}
              />

              {isEditMode && (
                <div className="absolute top-2 right-2 flex gap-1.5 z-30 pointer-events-auto">
                  <button
                    className="p-1.5 bg-white rounded-xl text-indigo-600 hover:bg-indigo-50 shadow-md border border-gray-100 transition-all active:scale-95"
                    onClick={e => { e.stopPropagation(); onEditTable?.(table); }}
                    title="Edit Table"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2v-5M16.243 3.757a3.03 3.03 0 114.286 4.286L12 16h-4v-4l8.243-8.243z" />
                    </svg>
                  </button>
                  <button
                    className="p-1.5 bg-white rounded-xl text-red-600 hover:bg-red-50 shadow-md border border-gray-100 transition-all active:scale-95"
                    onClick={e => { 
                      e.preventDefault();
                      e.stopPropagation(); 
                      onDeleteTable?.(table.id); 
                    }}
                    title="Delete Table"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6M1 7h22M4 7l1-4h14l1 4" />
                    </svg>
                  </button>
                </div>
              )}

              {/* Resize Handle */}
              {isEditMode && (
                <div
                  className="absolute right-0 bottom-0 w-8 h-8 cursor-nwse-resize z-30 flex items-end justify-end p-1 pointer-events-auto"
                  data-id={table.id}
                  onPointerDown={e => handleResizePointerDown(e, table.id)}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={handlePointerUp}
                >
                  <div className="w-3 h-3 border-r-2 border-b-2 border-indigo-600 rounded-br-sm opacity-50 bg-white/20" />
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
