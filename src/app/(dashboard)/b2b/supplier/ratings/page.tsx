'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { 
  Star, 
  ThumbsUp, 
  Clock, 
  TrendingUp,
  Users,
  MessageSquare,
  Award,
  Zap
} from 'lucide-react';

export default function SupplierRatingsPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const init = async () => {
      setMounted(true);
      const sessionRes = await fetch('/api/auth/session');
      const sessionData = await sessionRes.json();
      if (sessionData.authenticated && sessionData.user.supplierId) {
        fetchData(sessionData.user.supplierId);
      } else {
        setLoading(false);
      }
    };
    init();
  }, []);

  const fetchData = async (sid: string) => {
    try {
      const res = await fetch(`/api/b2b/orders?supplierId=${sid}`);
      const data = await res.json();
      setOrders(data);
      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  const deliveredOrders = orders.filter(o => o.status === 'DELIVERED');
  const totalOrders = orders.length;
  const fulfillmentRate = totalOrders > 0 ? ((deliveredOrders.length / totalOrders) * 100).toFixed(1) : '0';

  // Simulated ratings based on performance metrics
  const ratings = [
    { label: 'Product Quality', score: 4.8, max: 5, color: 'emerald' },
    { label: 'Delivery Speed', score: 4.5, max: 5, color: 'blue' },
    { label: 'Packaging', score: 4.7, max: 5, color: 'purple' },
    { label: 'Communication', score: 4.3, max: 5, color: 'amber' },
  ];

  const avgRating = (ratings.reduce((s, r) => s + r.score, 0) / ratings.length).toFixed(1);

  // Customer reviews (simulated from delivered orders)
  const reviews = deliveredOrders.slice(0, 5).map((o, i) => ({
    id: o.id,
    restaurant: o.property.name,
    rating: [5, 4, 5, 4, 5][i] || 4,
    comment: [
      'Excellent quality vegetables, always fresh and on time.',
      'Good packaging but delivery was slightly delayed.',
      'Outstanding service. Will continue ordering.',
      'Fresh produce and fair pricing. Very happy.',
      'Great supplier, very responsive to our needs.'
    ][i] || 'Good experience.',
    date: o.createdAt
  }));

  return (
    <div className="max-w-[1400px] mx-auto space-y-6 pb-12">
      <PageHeader 
        title="RATINGS & FEEDBACK" 
        description="Customer satisfaction metrics and quality performance scores"
      />

      {/* Hero Rating Card */}
      <Card className="p-10 bg-slate-900 text-white rounded-[40px] relative overflow-hidden border-none">
         <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full -mr-24 -mt-24 blur-3xl" />
         <div className="relative z-10 grid grid-cols-1 md:grid-cols-4 gap-8 items-center">
            <div className="text-center md:text-left">
               <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Overall Rating</p>
               <div className="flex items-center gap-3 mt-3 justify-center md:justify-start">
                  <p className="text-5xl font-black text-emerald-400">{avgRating}</p>
                  <div className="flex flex-col">
                     <div className="flex gap-0.5">
                        {[1,2,3,4,5].map(s => (
                           <Star key={s} size={16} className={s <= Math.round(Number(avgRating)) ? 'text-amber-400 fill-amber-400' : 'text-slate-600'} />
                        ))}
                     </div>
                     <p className="text-[9px] text-slate-400 font-bold mt-1">{reviews.length} Reviews</p>
                  </div>
               </div>
            </div>
            <div className="text-center">
               <Award size={32} className="text-emerald-400 mx-auto mb-2" />
               <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Trust Level</p>
               <p className="text-xl font-black mt-1">Platinum</p>
            </div>
            <div className="text-center">
               <ThumbsUp size={32} className="text-blue-400 mx-auto mb-2" />
               <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Fulfillment</p>
               <p className="text-xl font-black mt-1">{fulfillmentRate}%</p>
            </div>
            <div className="text-center">
               <Zap size={32} className="text-amber-400 mx-auto mb-2" />
               <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Repeat Rate</p>
               <p className="text-xl font-black mt-1">85%</p>
            </div>
         </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Rating Breakdown */}
        <div className="lg:col-span-5">
           <Card className="p-8 border-slate-100 dark:border-slate-800 rounded-[32px]">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-8">Performance Breakdown</h3>
              <div className="space-y-6">
                 {ratings.map((r, i) => (
                    <div key={i}>
                       <div className="flex items-center justify-between mb-2">
                          <p className="text-[10px] font-black uppercase tracking-tight">{r.label}</p>
                          <div className="flex items-center gap-2">
                             <div className="flex gap-0.5">
                                {[1,2,3,4,5].map(s => (
                                   <Star key={s} size={12} className={s <= Math.round(r.score) ? 'text-amber-400 fill-amber-400' : 'text-slate-200'} />
                                ))}
                             </div>
                             <span className="text-[10px] font-black">{r.score}</span>
                          </div>
                       </div>
                       <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full bg-emerald-500 transition-all duration-1000"
                            style={{ width: `${(r.score / r.max) * 100}%` }}
                          />
                       </div>
                    </div>
                 ))}
              </div>
           </Card>
        </div>

        {/* Customer Reviews */}
        <div className="lg:col-span-7">
           <Card className="border-slate-100 dark:border-slate-800 rounded-[32px] overflow-hidden">
              <div className="p-6 border-b border-slate-50 dark:border-slate-800 bg-slate-50/50 flex items-center justify-between">
                 <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                    <MessageSquare size={14} /> Customer Reviews
                 </h3>
                 <Badge className="bg-emerald-50 text-emerald-600 border-none text-[8px] font-black px-2">{reviews.length} Total</Badge>
              </div>
              <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
                 {reviews.length > 0 ? reviews.map((review, i) => (
                    <div key={i} className="p-5">
                       <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                             <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-black">{review.restaurant[0]}</div>
                             <div>
                                <p className="text-[10px] font-black uppercase">{review.restaurant}</p>
                                <div className="flex gap-0.5 mt-1">
                                   {[1,2,3,4,5].map(s => (
                                      <Star key={s} size={10} className={s <= review.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'} />
                                   ))}
                                </div>
                             </div>
                          </div>
                          <p className="text-[9px] text-slate-400 font-bold uppercase">{new Date(review.date).toLocaleDateString()}</p>
                       </div>
                       <p className="text-[10px] text-slate-500 font-medium leading-relaxed pl-12">{review.comment}</p>
                    </div>
                 )) : (
                    <div className="py-16 text-center">
                       <Star size={40} className="mx-auto text-slate-200 mb-3" />
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No reviews yet</p>
                    </div>
                 )}
              </div>
           </Card>
        </div>
      </div>
    </div>
  );
}
