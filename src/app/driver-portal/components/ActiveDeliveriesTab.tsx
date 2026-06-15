'use client';

import React from 'react';
import { Bike, Phone, Package, Lock, Volume2, ListOrdered, Route } from 'lucide-react';
import { PosOrder } from '../types';
import { CustomerLocationMap } from './CustomerLocationMap';

interface ActiveDeliveriesTabProps {
  t: any;
  assignedOrders: PosOrder[];
  fetchingOrders: boolean;
  pickingUpOrder: string | null;
  collectingCod: string | null;
  codCollectedOrders: Set<string>;
  tipsLog: { [orderNo: string]: number };
  riderLat?: number | null;
  riderLng?: number | null;
  handleMarkPickedUp: (id: string) => void;
  handleCodCollected: (order: PosOrder) => void;
  setReportModalOpen: (val: { orderId: string } | null) => void;
  setActiveOrder: (order: PosOrder | null) => void;
  setOtpValue: (val: string) => void;
  setOtpError: (val: string | null) => void;
  setIsContactlessConfirmed: (val: boolean) => void;
  setContactlessProofUploaded: (val: boolean) => void;
  triggerMockIncomingOrder: () => void;
}

export function ActiveDeliveriesTab({
  t,
  assignedOrders,
  fetchingOrders,
  pickingUpOrder,
  collectingCod,
  codCollectedOrders,
  tipsLog,
  riderLat,
  riderLng,
  handleMarkPickedUp,
  handleCodCollected,
  setReportModalOpen,
  setActiveOrder,
  setOtpValue,
  setOtpError,
  setIsContactlessConfirmed,
  setContactlessProofUploaded,
  triggerMockIncomingOrder
}: ActiveDeliveriesTabProps) {

  // Route Optimisation: when 2 orders, sort by proximity to rider
  const calcDist = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  };

  let optimizedOrders = [...assignedOrders];
  let routeOptNote = '';
  if (assignedOrders.length === 2 && riderLat && riderLng) {
    const withDist = assignedOrders.map(o => ({
      order: o,
      km: (o.deliveryLat && o.deliveryLng)
        ? calcDist(riderLat!, riderLng!, Number(o.deliveryLat), Number(o.deliveryLng))
        : Infinity
    }));
    withDist.sort((a, b) => a.km - b.km);
    optimizedOrders = withDist.map(d => d.order);
    const nearest = withDist[0];
    if (nearest.km < Infinity) {
      routeOptNote = `Deliver ${nearest.order.orderNo} first — ${nearest.km.toFixed(1)}km closer to you`;
    }
  }
  return (
    <div className="space-y-3">
      {/* SIMULATOR TEST BANNER */}
      <div className="bg-[#0f172a] border border-[#1e293b] p-3 rounded-xl flex items-center justify-between">
        <div>
          <p className="text-[8.5px] font-black text-rose-500 uppercase tracking-widest">Simulation Center</p>
          <p className="text-[8.0px] text-slate-500 font-bold uppercase mt-0.5">Test ringing notification banner</p>
        </div>
        <button
          onClick={triggerMockIncomingOrder}
          className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[8px] font-black uppercase tracking-widest flex items-center gap-1 transition-all"
        >
          <Volume2 size={10} /> Test Offer Alert
        </button>
      </div>

      {fetchingOrders && assignedOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 space-y-3">
          <div className="w-6 h-6 border-2 border-rose-500/20 rounded-full animate-spin border-t-rose-500" />
          <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">Loading active trips...</p>
        </div>
      ) : assignedOrders.length === 0 ? (
        <div className="text-center py-12 bg-[#0f172a] rounded-2xl border border-[#1e293b] p-5 space-y-3">
          <div className="w-10 h-10 bg-rose-500/10 rounded-xl flex items-center justify-center text-rose-500 mx-auto border border-rose-500/20">
            <Bike size={20} />
          </div>
          <div>
            <h4 className="font-bold text-white text-xs uppercase tracking-tight">{t.allDone}</h4>
            <p className="text-[10px] text-slate-500 max-w-[200px] mx-auto leading-relaxed">{t.noPending}</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Queue capacity warning */}
          {assignedOrders.length >= 2 && (
            <div className="bg-amber-500/15 border border-amber-500/35 text-amber-300 text-[8.5px] font-black uppercase tracking-wider px-3.5 py-2 rounded-xl text-center">
              ⚠️ Max Carrying Capacity Reached (2/2 active trips)
            </div>
          )}

          {/* Route optimisation recommendation */}
          {routeOptNote && (
            <div className="bg-emerald-500/10 border border-emerald-500/25 rounded-xl px-3.5 py-2.5 flex items-center gap-2.5">
              <div className="w-7 h-7 bg-emerald-500/20 rounded-lg flex items-center justify-center shrink-0">
                <Route size={13} className="text-emerald-400" />
              </div>
              <div>
                <p className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">🗺 Route Optimised</p>
                <p className="text-[9px] font-bold text-slate-300 mt-0.5">{routeOptNote}</p>
              </div>
            </div>
          )}

          {/* Queue overview strip when 2 orders */}
          {assignedOrders.length > 1 && (
            <div className="bg-[#0c0f1a] border border-indigo-500/20 rounded-xl px-3.5 py-2.5 flex items-center gap-2.5">
              <div className="w-6 h-6 bg-indigo-500/15 rounded-lg flex items-center justify-center shrink-0">
                <ListOrdered size={12} className="text-indigo-400" />
              </div>
              <div className="flex-1">
                <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">Active Queue</p>
                <div className="flex gap-2 mt-1">
                  {assignedOrders.map((o, i) => (
                    <span key={o.id} className="text-[7.5px] font-black bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-md text-indigo-300">
                      {i + 1}. {o.orderNo}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {optimizedOrders.map((order, queueIndex) => {
            const isFoodReady = order.status === 'READY';
            const isOutForDelivery = order.status === 'OUT_FOR_DELIVERY';
            const isCodCollected = codCollectedOrders.has(order.id);
            const orderTip = order.tipAmount || 0;
            const queuePosition = queueIndex + 1;

            return (
              <div
                key={order.id}
                className={`bg-[#0f172a] border rounded-2xl p-4 shadow-md space-y-3 relative overflow-hidden transition-all duration-200 ${
                  isOutForDelivery
                    ? 'border-purple-500/30'
                    : isFoodReady
                      ? 'border-rose-500/30'
                      : 'border-[#1e293b]'
                }`}
              >
                {/* Queue Position Indicator */}
                {assignedOrders.length > 1 && (
                  <div className={`absolute top-0 left-0 right-0 h-0.5 ${
                    queuePosition === 1 ? 'bg-gradient-to-r from-rose-500 to-rose-600' : 'bg-gradient-to-r from-indigo-500 to-indigo-600'
                  }`} />
                )}

                {/* Tags + Queue badge */}
                <div className="flex justify-between items-center pb-2 border-b border-[#1e293b]/70">
                  <div className="flex items-center gap-2">
                    {assignedOrders.length > 1 && (
                      <span className={`text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md ${
                        queuePosition === 1
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/25'
                          : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/25'
                      }`}>
                        {queuePosition}/{assignedOrders.length}
                      </span>
                    )}
                    <div>
                      <span className="text-[7.5px] font-black text-slate-500 uppercase tracking-widest block">ORDER NO</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-xs font-black text-white font-mono">{order.orderNo}</span>
                        {order.isPrepaid ? (
                          <span className="bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[6.5px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded">
                            Already Paid
                          </span>
                        ) : (
                          <span className="bg-amber-500/10 border border-amber-500/25 text-amber-400 text-[6.5px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded">
                            Pay on Delivery
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-1.5">
                    {isFoodReady && (
                      <span className="bg-rose-500 text-white text-[7.5px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md animate-pulse">
                        Ready
                      </span>
                    )}
                    {isOutForDelivery && (
                      <span className="bg-purple-500 text-white text-[7.5px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md">
                        Out For Delivery
                      </span>
                    )}
                    {order.status === 'ACCEPTED' && (
                      <span className="bg-indigo-500 text-white text-[7.5px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md">
                        Preparing
                      </span>
                    )}
                  </div>
                </div>

                {/* Customer information */}
                <div className="flex items-center justify-between bg-[#070b12] p-2.5 rounded-xl border border-[#1e293b]/50">
                  <div>
                    <p className="text-[9.5px] font-bold text-slate-200 uppercase truncate max-w-[200px]">
                      {order.deliveryCustomerName || 'Guest Customer'}
                    </p>
                    <p className="text-[8px] font-mono text-slate-500 mt-0.5">
                      {order.deliveryPhone || 'No contact number'}
                    </p>
                  </div>
                  {order.deliveryPhone && (
                    <a
                      href={`tel:${order.deliveryPhone}`}
                      className="w-8 h-8 rounded-lg bg-emerald-500/10 hover:bg-emerald-500 hover:text-white text-emerald-400 flex items-center justify-center transition-all border border-emerald-500/20"
                    >
                      <Phone size={12} />
                    </a>
                  )}
                </div>

                {/* ── Items List (Full Detail) ──────────────────────── */}
                {order.items && order.items.length > 0 && (
                  <div className="bg-[#070b12] rounded-xl border border-[#1e293b]/50 overflow-hidden">
                    <div className="px-2.5 py-1.5 border-b border-[#1e293b]/50 flex items-center gap-1.5">
                      <Package size={10} className="text-slate-500" />
                      <span className="text-[7.5px] font-black text-slate-500 uppercase tracking-widest">
                        {t.items} ({order.items.length})
                      </span>
                    </div>
                    <div className="divide-y divide-[#1e293b]/40">
                      {order.items.map(item => (
                        <div key={item.id} className="flex items-center justify-between px-2.5 py-1.5">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-5 h-5 rounded-md bg-rose-500/10 border border-rose-500/15 text-rose-400 text-[8px] font-black flex items-center justify-center shrink-0">
                              {item.quantity}
                            </span>
                            <span className="text-[9px] font-bold text-slate-300 truncate">
                              {item.product.name}
                            </span>
                          </div>
                          <span className="text-[8.5px] font-black text-slate-400 shrink-0 ml-2">
                            ₹{Math.round(item.totalAmount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Interactive maps display */}
                <div className="bg-[#070b12] p-2 rounded-xl border border-[#1e293b]/60">
                  <span className="text-[7.5px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">{t.address}</span>
                  <CustomerLocationMap
                    order={order}
                    riderLat={riderLat}
                    riderLng={riderLng}
                    queueIndex={queueIndex}
                    restaurantLat={order.property?.latitude}
                    restaurantLng={order.property?.longitude}
                  />
                  {order.deliveryInstructions && (
                    <p className="text-[8.5px] text-amber-500 font-extrabold uppercase mt-1.5">
                      ⚠️ Notes: {order.deliveryInstructions}
                    </p>
                  )}
                </div>

                {/* Actions section */}
                <div className="space-y-2 pt-1">
                  {/* Pick up status action */}
                  {isFoodReady && (
                    <button
                      onClick={() => handleMarkPickedUp(order.id)}
                      disabled={pickingUpOrder === order.id}
                      className="w-full h-10 rounded-xl text-[9px] font-black uppercase tracking-widest bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white flex items-center justify-center gap-1 transition-all"
                    >
                      {pickingUpOrder === order.id ? '...' : <><Package size={11} /> Mark Picked Up</>}
                    </button>
                  )}

                  {/* Cash Collected on Delivery step */}
                  {isOutForDelivery && (
                    order.isPrepaid ? (
                      <div className="p-2.5 rounded-xl border bg-emerald-500/10 border-emerald-500/25 text-emerald-400 flex items-center justify-between">
                        <div>
                          <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none">PRE-PAID ORDER</p>
                          <p className="text-xs font-black text-white mt-1">₹{order.grandTotal.toFixed(0)}</p>
                        </div>
                        <span className="text-[8px] font-black uppercase bg-emerald-500/20 px-2 py-1 rounded-lg">Already Paid</span>
                      </div>
                    ) : (
                      <div className={`p-2.5 rounded-xl border flex items-center justify-between ${
                        isCodCollected ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400' : 'bg-[#070b12] border-[#1e293b]/60'
                      }`}>
                        <div>
                          <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none">CASH ON DELIVERY</p>
                          <p className="text-xs font-black text-white mt-1">₹{order.grandTotal.toFixed(0)}</p>
                        </div>

                        {isCodCollected ? (
                          <span className="text-[8px] font-black uppercase bg-emerald-500/20 px-2 py-1 rounded-lg">Collected</span>
                        ) : (
                          <button
                            onClick={() => handleCodCollected(order)}
                            disabled={collectingCod === order.id}
                            className="px-2.5 py-1 bg-amber-500 text-white rounded-lg text-[8px] font-black uppercase tracking-widest"
                          >
                            {collectingCod === order.id ? '...' : 'Log Collection'}
                          </button>
                        )}
                      </div>
                    )
                  )}

                  {/* Tip details display */}
                  {orderTip > 0 && (
                    <div className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[8.5px] font-bold px-3 py-1.5 rounded-lg flex justify-between">
                      <span>Customer Tip:</span>
                      <span className="font-extrabold text-white">₹{orderTip}</span>
                    </div>
                  )}

                  {/* Complete Trip Verification panel */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setReportModalOpen({ orderId: order.id });
                      }}
                      className="flex-1 h-9 bg-slate-800/80 hover:bg-slate-800 text-slate-300 rounded-lg text-[8.5px] font-black uppercase border border-slate-700/60"
                    >
                      {t.reportIssue}
                    </button>
                    <button
                      onClick={() => {
                        setActiveOrder(order);
                        setOtpValue('');
                        setOtpError(null);
                        setIsContactlessConfirmed(false);
                        setContactlessProofUploaded(false);
                      }}
                      className="flex-1 h-9 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-[8.5px] font-black uppercase tracking-widest flex items-center justify-center gap-1 shadow-md shadow-rose-600/10"
                    >
                      <Lock size={10} /> Complete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
