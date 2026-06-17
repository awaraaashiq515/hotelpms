'use client';

import React, { useState, useEffect } from 'react';
import {
  Utensils, Clock, ChevronLeft, AlertCircle, Play, CheckCircle,
  Package2, History, Printer, Info, MapPin, ClipboardList, X, Plus
} from 'lucide-react';
import { kotsApi, KotTicket } from '@/lib/api/kots';
import { useToast } from '@/components/ui/Toast';
import { PrintKOT } from '@/components/kots/PrintKOT';
import { useRouter } from 'next/navigation';
import { use } from 'react';
import { PageHeader } from '@/components/shared/page-header';

const STATUS_COLORS: Record<string, string> = {
  NEW: 'bg-pos-primary/10 text-pos-primary border-pos-primary/20',
  PREPARING: 'bg-orange-50 text-orange-600 border-orange-100',
  READY: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  SERVED: 'bg-gray-50 text-gray-500 border-gray-100',
  CANCELLED: 'bg-red-50 text-red-500 border-red-100',
};

const ITEM_STATUS_COLORS: Record<string, string> = {
  NEW: 'text-pos-primary border-pos-primary/20 bg-pos-primary/5',
  PREPARING: 'text-orange-500 border-orange-100 bg-orange-50/50',
  READY: 'text-emerald-500 border-emerald-100 bg-emerald-50/50',
  SERVED: 'text-gray-500 border-gray-100 bg-gray-50/50',
  CANCELLED: 'text-red-400 border-red-100 bg-red-50/50 line-through',
};

export default function KotDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const { showToast } = useToast();
  const [kot, setKot] = useState<KotTicket | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [seqNum, setSeqNum] = useState<number | null>(null);
  const [showAddItem, setShowAddItem] = useState(false);
  const [addProductId, setAddProductId] = useState('');
  const [addQty, setAddQty] = useState(1);
  const [addNotes, setAddNotes] = useState('');
  const [addingItem, setAddingItem] = useState(false);

  const fetchKotDetails = async () => {
    setLoading(true);
    try {
      const data = await kotsApi.get(id);
      setKot(data);
    } catch {
      showToast('Failed to load KOT details', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKotDetails();
  }, [id]);

  useEffect(() => {
    if (!kot) return;
    const dateStr = new Date(kot.createdAt).toISOString().split('T')[0];
    fetch(`/api/kots?date=${dateStr}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.data)) {
          const sortedKots = [...data.data].sort((a: any, b: any) => 
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
          const index = sortedKots.findIndex((k: any) => k.kotNo === kot.kotNo);
          if (index !== -1) {
            setSeqNum(index + 1);
          }
        }
      })
      .catch(err => console.error('Failed to fetch KOT sequence number:', err));
  }, [kot]);

  const handleStatusUpdate = async (newStatus: string) => {
    setUpdating(true);
    try {
      await kotsApi.updateStatus(id, newStatus);
      showToast(`KOT updated to ${newStatus}`, 'success');
      fetchKotDetails();
    } catch {
      showToast('Failed to update status', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const handleItemStatusUpdate = async (itemId: string, newStatus: string) => {
    setUpdating(true);
    try {
      await kotsApi.updateItemStatus(id, itemId, newStatus);
      showToast(`Item updated to ${newStatus}`, 'success');
      fetchKotDetails();
    } catch {
      showToast('Failed to update item status', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const handleCancelItem = async (itemId: string) => {
    if (!confirm('Cancel this item?')) return;
    try {
      await kotsApi.cancelItem(id, itemId, 'Cancelled by staff');
      showToast('Item cancelled', 'success');
      fetchKotDetails();
    } catch {
      showToast('Failed to cancel item', 'error');
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addProductId) return;
    setAddingItem(true);
    try {
      await kotsApi.addItem(id, { productId: addProductId, quantity: addQty, notes: addNotes });
      showToast('Item added to KOT', 'success');
      setShowAddItem(false);
      setAddProductId('');
      setAddQty(1);
      setAddNotes('');
      fetchKotDetails();
    } catch {
      showToast('Failed to add item', 'error');
    } finally {
      setAddingItem(false);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=450,height=700');
    if (!printWindow) return;

    const floorName = kot?.table?.floor?.name;
    const floorMenuType = kot?.table?.floor?.menuType;
    const isBar = floorName?.toUpperCase().includes('BAR') || floorMenuType === 'BAR';
    const isCafe = floorName?.toUpperCase().includes('CAFE') || floorMenuType === 'CAFE';
    const mainTitle = isBar ? 'BAR ORDER' : isCafe ? 'CAFE ORDER' : 'KITCHEN ORDER';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>KOT - ${kot?.kotNo}</title>
          <style>
            @page { size: 80mm auto; margin: 0; }
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              width: 80mm; 
              padding: 10mm 4mm; 
              font-family: 'Courier New', Courier, monospace; 
              font-size: 13px; 
              color: #000; 
              line-height: 1.1; 
              background: #fff;
            }
            .text-center { text-align: center; }
            .font-black { font-weight: 900; }
            .uppercase { text-transform: uppercase; }
            .dashed-line { border-top: 2px dashed #000; margin: 4mm 0; width: 100%; }
            .double-line { border-top: 3px solid #000; margin: 5mm 0; }
            table { width: 100%; border-collapse: collapse; margin: 4mm 0; }
            th { text-align: left; border-bottom: 2px solid #000; padding: 2mm 0; font-weight: 900; font-size: 14px; }
            td { vertical-align: top; padding: 3mm 0; font-weight: 900; }
            .qty { font-size: 24px; font-weight: 900; padding-right: 4mm; }
            .item-name { font-size: 16px; font-weight: 900; text-transform: uppercase; }
            .notes { font-size: 12px; font-style: italic; color: #000; background: #eee; padding: 1mm 2mm; margin-top: 1mm; display: inline-block; }
            .header-info { display: flex; justify-content: space-between; margin-bottom: 1.5mm; font-weight: 900; font-size: 13px; }
          </style>
        </head>
        <body onload="window.print(); setTimeout(() => window.close(), 1000);">
          <div class="text-center font-black">
            <h1 style="font-size: 28px; margin-bottom: 1mm;">${mainTitle}</h1>
            <p style="font-size: 10px; letter-spacing: 2px;">KOT TICKET</p>
          </div>

          <div class="double-line"></div>

          <div class="header-info"><span>DATE:</span> <span>${(() => {
            const d = new Date(kot?.createdAt || Date.now());
            return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
          })()}</span></div>
          <div class="header-info"><span>KOT NO:</span> <span style="font-size: 20px;">${seqNum || kot?.kotNo?.replace(/\D/g, '').slice(-4)}</span></div>
          <div class="header-info"><span>TIME:</span> <span>${new Date(kot?.createdAt || Date.now()).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span></div>
          <div class="header-info"><span>TABLE:</span> <span style="font-size: 18px;">${kot?.tableNo || kot?.order?.tableNo || 'WALK-IN'}</span></div>
          ${floorName ? `
          <div class="header-info"><span>SECTION:</span> <span style="font-size: 16px;">${floorName}</span></div>
          ` : ''}
          <div class="header-info"><span>ORDER:</span> <span>#${kot?.order?.orderNo || '—'}</span></div>

          <div class="double-line" style="margin-top: 6mm;"></div>

          <table>
            <thead>
              <tr>
                <th style="width: 25%;">QTY</th>
                <th style="width: 75%;">ITEM DESCRIPTION</th>
              </tr>
            </thead>
            <tbody>
              ${kot?.items.map((item: any) => `
                <tr>
                  <td class="qty">${item.quantity}</td>
                  <td class="item-name">
                    ${item.product?.name || item.itemName}
                    ${item.notes ? `<br/><span class="notes">⚠ ${item.notes}</span>` : ''}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="double-line" style="margin-top: 10mm;"></div>
          <div class="text-center font-black" style="font-size: 10px; margin-top: 4mm; opacity: 0.5;">
            *** END OF TICKET ***
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (loading)
    return (
      <div className="p-16 text-center font-bold text-gray-400 animate-pulse uppercase tracking-widest">
        Loading KOT Details...
      </div>
    );
  if (!kot)
    return (
      <div className="p-16 text-center font-bold text-red-500 uppercase tracking-widest">
        KOT Not Found
      </div>
    );

  const statusActions = [
    { label: 'Start Preparing', status: 'PREPARING', icon: Play, color: 'bg-orange-600', active: kot.status === 'NEW' },
    { label: 'Mark as Ready', status: 'READY', icon: CheckCircle, color: 'bg-emerald-600', active: kot.status === 'PREPARING' },
    { label: 'Mark as Served', status: 'SERVED', icon: Package2, color: 'bg-pos-primary shadow-pos-primary/20', active: kot.status === 'READY' },
  ];

  const activeItems = kot.items.filter((i) => i.status !== 'CANCELLED');
  const totalUnits = activeItems.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <div className="space-y-8 pb-32">
      {/* Page Header */}
      <PageHeader
        title={`KOT No. ${seqNum || kot.kotNo.replace(/\D/g, '').slice(-4)}`}
        subtitle={`Order: ${kot.order?.orderNo} · ${kot.order?.orderType} · ${totalUnits} Units`}
        showBack
        backUrl="/kots"
        actions={
          <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm ${STATUS_COLORS[kot.status] || 'bg-gray-50 text-gray-500 border-gray-100'}`}>
            {kot.status}
          </span>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Items + Order Info */}
        <div className="lg:col-span-2 space-y-8">

          {/* Order Info Card */}
          <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 rounded-xl bg-pos-primary/10 flex items-center justify-center text-pos-primary">
                <Info size={16} />
              </div>
              <h2 className="text-sm font-black text-gray-900 uppercase tracking-tight">Order Information</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[
                {
                  label: 'Source',
                  value: kot.tableNo
                    ? `Table: ${kot.tableNo}`
                    : kot.roomId
                    ? `Room: ${kot.roomId}`
                    : 'Takeaway',
                  icon: MapPin,
                  color: 'text-indigo-500 bg-indigo-50',
                },
                ...(kot.table?.floor?.name ? [{
                  label: 'Section / Floor',
                  value: kot.table.floor.name,
                  icon: MapPin,
                  color: 'text-purple-500 bg-purple-50',
                }] : []),
                {
                  label: 'Order Type',
                  value: kot.order?.orderType || '—',
                  icon: ClipboardList,
                  color: 'text-orange-500 bg-orange-50',
                },
                {
                  label: 'Kitchen Station',
                  value: kot.kitchenStation || 'Main Kitchen',
                  icon: Utensils,
                  color: 'text-emerald-500 bg-emerald-50',
                },
                {
                  label: 'Created At',
                  value: new Date(kot.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  icon: Clock,
                  color: 'text-blue-500 bg-blue-50',
                },
                {
                  label: 'Date',
                  value: new Date(kot.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
                  icon: Clock,
                  color: 'text-gray-500 bg-gray-50',
                },
                {
                  label: 'Items Count',
                  value: `${activeItems.length} items · ${totalUnits} units`,
                  icon: ClipboardList,
                  color: 'text-rose-500 bg-rose-50',
                },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="flex items-start gap-3 p-4 rounded-2xl bg-gray-50/50 border border-gray-100">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
                    <Icon size={14} />
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">{label}</p>
                    <p className="text-sm font-black text-gray-900 mt-0.5">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Items Table */}
          <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl overflow-hidden">
            <div className="p-8 border-b border-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-pos-primary/10 flex items-center justify-center text-pos-primary">
                  <Utensils size={16} />
                </div>
                <h2 className="text-sm font-black text-gray-900 uppercase tracking-tight">Order Items</h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-gray-100 transition-all border border-gray-100"
                >
                  <Printer size={14} />
                  Print
                </button>
                {kot.status !== 'SERVED' && kot.status !== 'CANCELLED' && (
                  <button
                    onClick={() => setShowAddItem((v) => !v)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20"
                  >
                    <Plus size={14} />
                    Add Item
                  </button>
                )}
              </div>
            </div>

            {/* Add Item Form */}
            {showAddItem && (
              <div className="mx-8 mt-6 p-6 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-4">Add New Item</p>
                <form onSubmit={handleAddItem} className="flex flex-col sm:flex-row gap-3">
                  <input
                    placeholder="Product ID"
                    value={addProductId}
                    onChange={(e) => setAddProductId(e.target.value)}
                    required
                    className="flex-1 px-4 py-2.5 rounded-xl border border-indigo-100 text-sm font-bold bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                  <input
                    type="number"
                    min={1}
                    value={addQty}
                    onChange={(e) => setAddQty(Number(e.target.value))}
                    className="w-20 px-4 py-2.5 rounded-xl border border-indigo-100 text-sm font-bold bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                  <input
                    placeholder="Notes (optional)"
                    value={addNotes}
                    onChange={(e) => setAddNotes(e.target.value)}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-indigo-100 text-sm font-bold bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                  <button
                    type="submit"
                    disabled={addingItem}
                    className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all disabled:opacity-50"
                  >
                    {addingItem ? 'Adding...' : 'Add'}
                  </button>
                </form>
              </div>
            )}

            <table className="w-full text-left mt-2">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Item</th>
                  <th className="px-4 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Qty</th>
                  <th className="px-4 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Status & Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {kot.items.map((item) => (
                  <tr key={item.id} className={`hover:bg-gray-50/30 transition-colors ${item.status === 'CANCELLED' ? 'opacity-40' : ''}`}>
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <span className={`text-sm font-black text-gray-900 ${item.status === 'CANCELLED' ? 'line-through' : ''}`}>
                          {item.product?.name || item.itemName}
                        </span>
                        {item.notes && (
                          <span className="text-[10px] text-orange-500 font-bold mt-1 italic">
                            ⚠ {item.notes}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-5">
                      <span className="text-sm font-black text-white bg-gray-900 w-8 h-8 rounded-lg flex items-center justify-center">
                        {item.quantity}
                      </span>
                    </td>
                    <td className="px-4 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span className={`px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest inline-block ${ITEM_STATUS_COLORS[item.status] || 'text-gray-500 border-gray-100 bg-gray-50'}`}>
                          {item.status}
                        </span>
                        {item.status !== 'READY' && item.status !== 'SERVED' && item.status !== 'CANCELLED' && (
                          <div className="flex gap-1 ml-1">
                            {item.status === 'NEW' && (
                              <button
                                onClick={() => handleItemStatusUpdate(item.id, 'PREPARING')}
                                className="p-1.5 hover:bg-orange-50 text-orange-600 rounded-lg transition-colors border border-transparent hover:border-orange-100"
                                title="Start Preparing"
                              >
                                <Play size={13} />
                              </button>
                            )}
                            <button
                              onClick={() => handleItemStatusUpdate(item.id, 'READY')}
                              className="p-1.5 hover:bg-emerald-50 text-emerald-600 rounded-lg transition-colors border border-transparent hover:border-emerald-100"
                              title="Mark Ready"
                            >
                              <AlertCircle size={13} />
                            </button>
                            <button
                              onClick={() => handleCancelItem(item.id)}
                              className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg transition-colors border border-transparent hover:border-red-100"
                              title="Cancel Item"
                            >
                              <X size={13} />
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Sidebar: KOT Control + Timeline */}
        <div className="space-y-8">
          {/* KOT Control */}
          <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl p-8 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
                <Clock size={16} />
              </div>
              <h2 className="text-sm font-black text-gray-900 uppercase tracking-tight">KOT Control</h2>
            </div>

            <div className="flex flex-col gap-3">
              {statusActions.map((action) => (
                <button
                  key={action.status}
                  disabled={!action.active || updating}
                  onClick={() => handleStatusUpdate(action.status)}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all font-black uppercase tracking-widest text-[11px] border-2 shadow-sm ${
                    action.active
                      ? `${action.color} text-white border-transparent hover:opacity-90 active:scale-95`
                      : 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed opacity-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <action.icon size={17} />
                    <span>{action.label}</span>
                  </div>
                </button>
              ))}
            </div>

            {kot.status !== 'CANCELLED' && kot.status !== 'SERVED' && (
              <div className="pt-4 border-t border-gray-50 flex justify-center">
                <button
                  disabled={updating}
                  onClick={() => {
                    if (confirm('Cancel this entire KOT?')) handleStatusUpdate('CANCELLED');
                  }}
                  className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500 hover:text-red-700 transition-colors disabled:opacity-50"
                >
                  Cancel Entire KOT
                </button>
              </div>
            )}
          </div>

          {/* Status Timeline */}
          <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl p-8 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
                <History size={16} />
              </div>
              <h2 className="text-sm font-black text-gray-900 uppercase tracking-tight">Timeline</h2>
            </div>

            <div className="space-y-6">
              {/* Created event */}
              <div className="relative flex gap-4">
                <div className="absolute left-2.5 top-6 bottom-[-24px] w-[2px] bg-gray-50" />
                <div className="relative z-10 w-5 h-5 rounded-full border-2 border-white shadow-sm flex-shrink-0 mt-0.5 bg-blue-400" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-gray-900 uppercase tracking-widest">KOT Created</span>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                    {new Date(kot.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · By {kot.createdBy || 'System'}
                  </span>
                </div>
              </div>

              {((kot as any).statusLogs || []).map((log: any, index: number, arr: any[]) => (
                <div key={log.id} className="relative flex gap-4">
                  {index !== arr.length - 1 && (
                    <div className="absolute left-2.5 top-6 bottom-[-24px] w-[2px] bg-gray-50" />
                  )}
                  <div className="relative z-10 w-5 h-5 rounded-full border-2 border-white shadow-sm flex-shrink-0 mt-0.5 bg-indigo-500" />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-gray-900 uppercase tracking-widest">
                      {log.oldStatus} → {log.newStatus}
                    </span>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                      {new Date(log.changedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · By {log.changedBy}
                    </span>
                    {log.remarks && (
                      <p className="text-[10px] text-gray-500 font-medium bg-gray-50 p-2 rounded-lg mt-1.5 italic">
                        "{log.remarks}"
                      </p>
                    )}
                  </div>
                </div>
              ))}

              {(!kot as any || !(kot as any).statusLogs?.length) && (
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">No status changes yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Hidden print area */}
      <div id="printable-kot" className="hidden">
        <PrintKOT kot={kot} seqNum={seqNum} />
      </div>
    </div>
  );
}
