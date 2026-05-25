'use client';

import React from 'react';
import { Bell, QrCode } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Modal } from '@/components/ui/Modal';
import { KotSlipModal, KotSlipData } from '@/components/kots/KotSlipModal';
import { SwitchTableModal } from '@/components/tables/SwitchTableModal';

interface TabletModalsProps {
  // Notifications
  isNotificationOpen: boolean;
  setIsNotificationOpen: (val: boolean) => void;
  notificationHistory: Array<{ id: string; message: string; timestamp: Date; type: 'success' | 'info' }>;
  
  // KOT Slip
  kotSlip: KotSlipData | null;
  setKotSlip: (val: KotSlipData | null) => void;
  
  // QR/Payment Modal
  isQRModalOpen: boolean;
  setIsQRModalOpen: (val: boolean) => void;
  qrModalOrder: any | null;
  setQrModalOrder: (val: any | null) => void;
  activeOrder: any | null;
  cartSubtotal: number;
  cartTax: number;
  localDiscountAmount: number;
  setLocalDiscountAmount: (val: number) => void;
  tablet: any;
  
  // Switch Table
  isSwitchModalOpen: boolean;
  setIsSwitchModalOpen: (val: boolean) => void;
  sourceTableForSwitch: any | null;
  setSourceTableForSwitch: (val: any | null) => void;
  tables: any[];
  handleConfirmSwitchTable: (targetTableId: string) => Promise<void>;
  switchLoading: boolean;
}

export default function TabletModals({
  isNotificationOpen, setIsNotificationOpen, notificationHistory,
  kotSlip, setKotSlip,
  isQRModalOpen, setIsQRModalOpen, qrModalOrder, setQrModalOrder, activeOrder, cartSubtotal, cartTax, localDiscountAmount, setLocalDiscountAmount, tablet,
  isSwitchModalOpen, setIsSwitchModalOpen, sourceTableForSwitch, setSourceTableForSwitch, tables, handleConfirmSwitchTable, switchLoading
}: TabletModalsProps) {
  return (
    <>
      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <Modal
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
        title="Notification Center"
      >
        <div className="p-6 space-y-4 max-h-[400px] overflow-y-auto no-scrollbar">
          {notificationHistory.length === 0 ? (
            <div className="text-center py-10 opacity-30">
              <Bell size={48} className="mx-auto mb-4" />
              <p className="text-xs font-black uppercase tracking-widest">No notifications yet</p>
            </div>
          ) : (
            notificationHistory.map(notif => (
              <div key={notif.id} className={`p-4 rounded-2xl border ${notif.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-slate-800 border-white/5 text-slate-300'} flex items-start gap-4`}>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${notif.type === 'success' ? 'bg-emerald-500/20' : 'bg-white/5'}`}>
                  <Bell size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold leading-normal">{notif.message}</p>
                  <p className="text-[8px] opacity-40 font-black uppercase mt-1">
                    {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </Modal>

      {kotSlip && (
        <KotSlipModal
          kot={kotSlip}
          onClose={() => setKotSlip(null)}
        />
      )}

      <Modal
        isOpen={isQRModalOpen}
        onClose={() => { setIsQRModalOpen(false); setLocalDiscountAmount(0); setQrModalOrder(null); }}
        title="Pay Bill"
      >
        <div className="p-8 flex flex-col items-center justify-center space-y-6">
          <div className="w-full space-y-4">
            <div className="flex justify-between items-center text-sm font-bold text-slate-400">
              <span>Subtotal & Tax</span>
              <span>₹{(((qrModalOrder || activeOrder)?.subtotal || cartSubtotal) + ((qrModalOrder || activeOrder)?.taxAmount || cartTax)).toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-slate-300">Discount (₹)</span>
              <input
                type="number"
                min="0"
                value={localDiscountAmount || ''}
                onChange={(e) => setLocalDiscountAmount(Number(e.target.value))}
                className="w-24 px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-right text-sm font-bold text-white focus:outline-none focus:border-indigo-500"
                placeholder="0"
              />
            </div>
            <div className="pt-4 border-t border-white/10 flex justify-between items-center text-lg font-black text-white">
              <span>Final Amount</span>
              <span className="text-indigo-400">₹{Math.max(0, (((qrModalOrder || activeOrder)?.subtotal || cartSubtotal) + ((qrModalOrder || activeOrder)?.taxAmount || cartTax)) - localDiscountAmount).toFixed(2)}</span>
            </div>
          </div>
          {tablet?.property?.upiId ? (
            <>
              <div className="bg-white p-4 rounded-2xl shadow-xl">
                <QRCodeSVG
                  value={`upi://pay?pa=${tablet.property.upiId}&pn=${encodeURIComponent(tablet.property.upiName || tablet.property.name)}&am=${Math.max(0, (((qrModalOrder || activeOrder)?.subtotal || cartSubtotal) + ((qrModalOrder || activeOrder)?.taxAmount || cartTax)) - localDiscountAmount).toFixed(2)}&cu=INR&tn=Order-${(qrModalOrder || activeOrder)?.orderNo || 'POS'}`}
                  size={240}
                  level="H"
                  includeMargin={true}
                />
              </div>
              <div className="text-center space-y-2">
                <p className="text-sm font-bold text-slate-300">Scan to pay <span className="text-white font-black">₹{Math.max(0, (((qrModalOrder || activeOrder)?.subtotal || cartSubtotal) + ((qrModalOrder || activeOrder)?.taxAmount || cartTax)) - localDiscountAmount).toFixed(2)}</span></p>
                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400">
                  {tablet.property.upiId}
                </p>
              </div>
            </>
          ) : (
            <div className="text-center py-10 opacity-50">
              <QrCode size={48} className="mx-auto mb-4" />
              <p className="text-xs font-black uppercase tracking-widest text-rose-400">UPI Not Configured</p>
              <p className="text-[10px] font-bold mt-2">Please configure UPI in Settings.</p>
            </div>
          )}
          <button
            onClick={() => { setIsQRModalOpen(false); setLocalDiscountAmount(0); setQrModalOrder(null); }}
            className="w-full py-4 bg-slate-800 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-700 transition-all"
          >
            Close
          </button>
        </div>
      </Modal>

      <SwitchTableModal
        isOpen={isSwitchModalOpen}
        onClose={() => {
          setIsSwitchModalOpen(false);
          setSourceTableForSwitch(null);
        }}
        sourceTable={sourceTableForSwitch}
        vacantTables={tables.filter(t => t.status === 'VACANT')}
        onConfirm={handleConfirmSwitchTable}
        loading={switchLoading}
      />
    </>
  );
}
