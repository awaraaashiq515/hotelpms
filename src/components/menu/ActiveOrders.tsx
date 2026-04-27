import React, { useEffect, useRef } from 'react';
import { History, Clock, CheckCircle, ChefHat, ChevronRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

interface ActiveOrdersProps {
  orders: any[];
  tableName: string;
  setActiveTab: (tab: 'menu' | 'orders') => void;
}

export const ActiveOrders: React.FC<ActiveOrdersProps> = ({ orders, tableName, setActiveTab }) => {
  const { showToast } = useToast();
  const prevStatusesRef = useRef<Record<string, string>>({});
  const audioAcceptedRef = useRef<HTMLAudioElement | null>(null);
  const audioReadyRef = useRef<HTMLAudioElement | null>(null);
  const [audioUnlocked, setAudioUnlocked] = React.useState(false);

  useEffect(() => {
    // Initialize high-quality sounds
    audioAcceptedRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
    audioReadyRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    
    // Preload
    audioAcceptedRef.current.load();
    audioReadyRef.current.load();
  }, []);

  // Unlock audio context on first click
  const unlockAudio = () => {
    if (audioUnlocked) return;
    audioAcceptedRef.current?.play().then(() => {
      audioAcceptedRef.current?.pause();
      if (audioAcceptedRef.current) audioAcceptedRef.current.currentTime = 0;
      setAudioUnlocked(true);
      showToast("Live Notifications Enabled", "success");
    }).catch(() => {
      console.log("Audio unlock failed");
    });
  };

  useEffect(() => {
    if (orders.length === 0) return;

    orders.forEach(order => {
      // Overall Order Status Change
      const orderKey = `order-${order.id}`;
      const prevOrderStatus = prevStatusesRef.current[orderKey];
      if (prevOrderStatus && prevOrderStatus !== order.status) {
        if (order.status === 'IN_KITCHEN' || order.status === 'PREPARING') {
          showToast(`Order Accepted: ${order.orderNo}`, 'success');
          audioAcceptedRef.current?.play().catch(() => {});
        } else if (order.status === 'READY') {
          showToast(`Order Ready: ${order.orderNo}`, 'success');
          audioReadyRef.current?.play().catch(() => {});
        }
      }
      prevStatusesRef.current[orderKey] = order.status;

      // Individual Item Status Changes
      order.items.forEach((item: any) => {
        const statuses = item.kotItems?.map((ki: any) => ki.status) || [];
        const currentStatus = statuses.includes('READY') ? 'READY' 
                           : statuses.includes('PREPARING') || statuses.includes('IN_KITCHEN') ? 'PREPARING' 
                           : statuses.includes('NEW') ? 'NEW' : 'NONE';
        
        const itemKey = `${order.id}-${item.id}`;
        const prevStatus = prevStatusesRef.current[itemKey];

        if (prevStatus && prevStatus !== currentStatus) {
          if (currentStatus === 'PREPARING' && prevStatus === 'NEW') {
            showToast(`Cooking: ${item.product.name}`, 'success');
            audioAcceptedRef.current?.play().catch(() => {});
          } else if (currentStatus === 'READY' && prevStatus === 'PREPARING') {
            showToast(`Ready: ${item.product.name}`, 'success');
            audioReadyRef.current?.play().catch(() => {});
          }
        }
        prevStatusesRef.current[itemKey] = currentStatus;
      });
    });
  }, [orders, showToast]);

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <History size={48} className="text-slate-200" />
        <div className="space-y-1">
          <h3 className="font-bold text-slate-800 dark:text-white">No orders yet</h3>
          <p className="text-xs text-slate-400 max-w-[200px]">Once you place an order, it will appear here.</p>
        </div>
        <Button onClick={() => setActiveTab('menu')} className="rounded-xl h-11 px-8">View Menu</Button>
      </div>
    );
  }

  return (
    <main onClick={unlockAudio} className="p-5 pt-10 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 min-h-screen">
      <div className="text-center py-6 space-y-4">
        <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Active Orders</h2>
        
        <div className="flex flex-col items-center gap-3">
          {!audioUnlocked ? (
            <button 
              onClick={unlockAudio}
              className="inline-flex items-center gap-2 px-4 py-2 bg-pos-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-pos-primary/20 animate-bounce"
            >
              Click to Enable Sound Notifications
            </button>
          ) : (
            <div className="inline-flex items-center gap-2.5 px-4 py-2 bg-emerald-500/10 dark:bg-emerald-500/5 border border-emerald-500/20 rounded-2xl shadow-[0_0_15px_rgba(16,185,129,0.1)] transition-all">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-black uppercase tracking-[0.2em]">Live Tracking Active (5s)</p>
            </div>
          )}
          
          <div className="flex items-center gap-2 px-3 py-1 bg-slate-100 dark:bg-slate-900 rounded-full border border-slate-200 dark:border-slate-800">
            <p className="text-[10px] text-slate-500 font-bold tracking-wide">Table: {tableName}</p>
          </div>
        </div>
      </div>

      {orders.map((order: any) => (
        <div key={order.id} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-800 pb-4">
            <div className="space-y-1">
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.1em]">Order Details</p>
              <p className="text-sm font-black text-slate-900 dark:text-white tabular-nums">{order.orderNo}</p>
            </div>
            
            <div className="flex flex-col items-end gap-1">
              <div className="px-3 py-1 bg-pos-primary/10 rounded-lg border border-pos-primary/20">
                <p className="text-[10px] font-black text-pos-primary uppercase tracking-widest">{order.status}</p>
              </div>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">Status</p>
            </div>
          </div>

          {(() => {
            const allStatuses = order.items.flatMap((i: any) => i.kotItems?.map((ki: any) => ki.status) || []);
            const isReady = (order.status === 'READY') || (allStatuses.every((s: string) => s === 'READY') && allStatuses.length > 0);
            const isCooking = (order.status === 'IN_KITCHEN' || order.status === 'PREPARING') || allStatuses.some((s: string) => s === 'PREPARING' || s === 'IN_KITCHEN');
            const isNew = order.status === 'OPEN' || order.status === 'PLACED' || allStatuses.some((s: string) => s === 'NEW');

            let icon = <Clock size={20} />;
            let iconBg = "bg-orange-500/10";
            let iconColor = "text-orange-500";
            let description = "Order placed";

            if (isReady) {
              icon = <CheckCircle size={20} />;
              iconBg = "bg-emerald-500/10";
              iconColor = "text-emerald-500";
              description = "Order Ready to Serve!";
            } else if (isCooking) {
              icon = <ChefHat size={20} />;
              iconBg = "bg-blue-500/10";
              iconColor = "text-blue-500";
              description = "Kitchen Accepted & Cooking";
            } else if (isNew) {
              icon = <Clock size={20} />;
              iconBg = "bg-orange-500/10";
              iconColor = "text-orange-500";
              description = "Awaiting Kitchen Acceptance";
            }

            return (
              <div className="bg-slate-50 dark:bg-slate-950/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center ${iconColor}`}>
                    {icon}
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Kitchen Status</p>
                    <p className={`text-xs font-black ${iconColor}`}>
                      {description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-bold text-slate-300">Live</span>
                  <ChevronRight size={16} className="text-slate-300" />
                </div>
              </div>
            );
          })()}

          <div className="space-y-4">
            {order.items.map((item: any) => (
              <div key={item.id} className="flex items-center gap-3">
                <div className="relative w-12 h-12 flex-shrink-0">
                  <img src={item.product.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=100'} className="w-full h-full object-cover rounded-xl" />
                  <span className="absolute -top-1.5 -right-1.5 bg-pos-primary text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold border-2 border-white dark:border-slate-900">
                    {item.quantity}
                  </span>
                </div>
                <div className="flex-grow">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">{item.product.name}</h4>
                  
                  {/* Status Tracker */}
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center gap-1">
                      {(() => {
                        const statuses = item.kotItems?.map((ki: any) => ki.status) || [];
                        const isReady = statuses.some((s: string) => s === 'READY') || order.status === 'READY';
                        const isPreparing = statuses.some((s: string) => s === 'PREPARING' || s === 'IN_KITCHEN') || order.status === 'IN_KITCHEN' || order.status === 'PREPARING';
                        const isNew = !isReady && !isPreparing && (statuses.some((s: string) => s === 'NEW') || order.status === 'OPEN' || order.status === 'PLACED');
                        
                        if (isReady) return (
                          <span className="flex items-center gap-1 text-[10px] font-black text-emerald-500 uppercase tracking-tighter">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Ready to Serve
                          </span>
                        );
                        if (isPreparing) return (
                          <span className="flex items-center gap-1 text-[10px] font-black text-pos-primary uppercase tracking-tighter animate-pulse">
                            <div className="w-1.5 h-1.5 rounded-full bg-pos-primary" />
                            Preparing in Kitchen
                          </span>
                        );
                        if (isNew) return (
                          <span className="flex items-center gap-1 text-[10px] font-black text-orange-500 uppercase tracking-tighter">
                            <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                            Sent to Kitchen
                          </span>
                        );
                        return <span className="text-[10px] font-bold text-slate-400 uppercase">Placed</span>;
                      })()}
                    </div>
                    
                    {/* Progress Dots */}
                    <div className="flex items-center gap-1.5">
                      {['NEW', 'PREPARING', 'READY'].map((step, idx) => {
                        const statuses = item.kotItems?.map((ki: any) => ki.status) || [];
                        let active = false;
                        if (step === 'NEW') active = statuses.length > 0;
                        if (step === 'PREPARING') active = statuses.some((s: string) => s === 'PREPARING' || s === 'IN_KITCHEN' || s === 'READY');
                        if (step === 'READY') active = statuses.some((s: string) => s === 'READY');
                        
                        return (
                          <div key={idx} className="flex items-center gap-1.5">
                            <div className={`h-1 rounded-full transition-all ${active ? 'w-6 bg-pos-accent' : 'w-2 bg-slate-100 dark:bg-slate-800'}`} />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">₹{item.totalAmount}</p>
              </div>
            ))}
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 flex items-center justify-between">
            <p className="text-xs font-bold text-slate-400">Grand Total</p>
            <p className="text-lg font-bold text-slate-900 dark:text-white">₹{order.grandTotal}</p>
          </div>
        </div>
      ))}

      {/* Add More Items Button */}
      <div className="pt-4 pb-12">
        <button 
          onClick={() => setActiveTab('menu')}
          className="w-full py-5 bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2rem] flex flex-col items-center justify-center gap-2 hover:border-pos-accent hover:bg-pos-accent/5 transition-all group"
        >
          <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 group-hover:bg-pos-accent group-hover:text-white transition-all">
            <Plus size={24} />
          </div>
          <div className="text-center">
            <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Add More Items</p>
            <p className="text-[10px] text-slate-400 font-bold">Hungry for more? Go back to menu</p>
          </div>
        </button>
      </div>
    </main>
  );
};
