'use client';

import React from 'react';
import { KotTicket } from '@/lib/api/kots';

interface PrintKotProps {
  kot: KotTicket;
  seqNum?: number | null;
}

export const PrintKOT: React.FC<PrintKotProps> = ({ kot, seqNum }) => {
  const floorName = kot.table?.floor?.name;
  const floorMenuType = kot.table?.floor?.menuType;
  
  const isBar = floorName?.toUpperCase().includes('BAR') || floorMenuType === 'BAR';
  const isCafe = floorName?.toUpperCase().includes('CAFE') || floorMenuType === 'CAFE';
  const ticketTitle = isBar ? '🍽 Bar Ticket' : isCafe ? '🍽 Cafe Ticket' : '🍽 Kitchen Ticket';

  return (
    <div className="p-8 bg-white max-w-[400px] mx-auto font-mono text-black">
      {/* Header */}
      <div className="text-center border-b-2 border-dashed border-gray-400 pb-6 mb-6">
        <div className="text-2xl font-black uppercase tracking-tight mb-1">{ticketTitle}</div>
        <div className="text-xs text-gray-500 uppercase tracking-widest">POS System</div>
      </div>

      {/* KOT Meta */}
      <div className="mb-6 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="font-bold uppercase text-gray-500">KOT No</span>
          <span className="font-black text-xl">{seqNum || kot.kotNo.replace(/\D/g, '').slice(-4)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="font-bold uppercase text-gray-500">Order No</span>
          <span className="font-bold">{kot.order?.orderNo || '—'}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="font-bold uppercase text-gray-500">Source</span>
          <span className="font-bold">
            {kot.tableNo
              ? `Table: ${kot.tableNo}`
              : kot.roomId
              ? `Room: ${kot.roomId}`
              : 'Takeaway'}
          </span>
        </div>
        {floorName && (
          <div className="flex justify-between text-sm">
            <span className="font-bold uppercase text-gray-500">Section</span>
            <span className="font-bold">{floorName}</span>
          </div>
        )}
        <div className="flex justify-between text-sm">
          <span className="font-bold uppercase text-gray-500">Type</span>
          <span className="font-bold">{kot.order?.orderType || '—'}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="font-bold uppercase text-gray-500">Time</span>
          <span className="font-bold">
            {new Date(kot.createdAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="font-bold uppercase text-gray-500">Date</span>
          <span className="font-bold">
            {(() => {
              const d = new Date(kot.createdAt);
              return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
            })()}
          </span>
        </div>
      </div>

      {/* Items */}
      <div className="border-t-2 border-dashed border-gray-400 pt-6 mb-6">
        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4 px-1">
          <span>Qty &nbsp; Item</span>
          <span>Notes</span>
        </div>
        <div className="space-y-5">
          {kot.items.map((item) => (
            <div key={item.id}>
              <div className="flex items-start gap-3">
                <span className="text-2xl font-black w-10 shrink-0">{item.quantity}×</span>
                <div className="flex-1">
                  <div className="text-base font-black uppercase leading-tight">
                    {item.product?.name || item.itemName}
                  </div>
                  {item.notes && (
                    <div className="mt-1 text-xs font-bold text-gray-600 italic">
                      ⚠ {item.notes}
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-2 border-b border-dotted border-gray-200" />
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t-2 border-dashed border-gray-400 pt-4 text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">
          — End of Kitchen Ticket —
        </p>
        <p className="text-[9px] text-gray-300 mt-1">{new Date(kot.createdAt).toLocaleString()}</p>
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-kot-area, .print-kot-area * { visibility: visible; }
          .print-kot-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 80mm;
            padding: 4mm;
            font-family: monospace;
          }
        }
      `}</style>
    </div>
  );
};
