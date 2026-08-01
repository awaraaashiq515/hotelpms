import React from 'react';
import { CheckCircle2, Zap, Building2, Crown } from 'lucide-react';

interface Plan {
  id: string; name: string; price: number;
  rooms: number; users: number; features: string[];
  color: string; popular: boolean;
}

const PLANS: Plan[] = [
  {
    id: 'starter', name: 'Starter', price: 2999, rooms: 20, users: 5,
    color: 'border-slate-600 bg-slate-800/30',
    popular: false,
    features: ['Basic PMS', 'Bookings & Check-in', 'Housekeeping', 'Basic Reports', 'Email Support'],
  },
  {
    id: 'professional', name: 'Professional', price: 7999, rooms: 100, users: 25,
    color: 'border-indigo-500/50 bg-indigo-900/20',
    popular: true,
    features: ['All Starter +', 'Revenue Management', 'Channel Manager (5)', 'CRM & Loyalty', 'Analytics & BI', 'Priority Support'],
  },
  {
    id: 'enterprise', name: 'Enterprise', price: 19999, rooms: 500, users: 100,
    color: 'border-violet-500/50 bg-violet-900/20',
    popular: false,
    features: ['All Professional +', 'AI Concierge', 'Smart Hotel IoT', 'All Channels', 'Multi-Property', 'Dedicated Manager'],
  },
  {
    id: 'custom', name: 'Custom', price: 0, rooms: 9999, users: 9999,
    color: 'border-yellow-500/50 bg-yellow-900/10',
    popular: false,
    features: ['Everything Unlimited', 'White Label', 'Custom Integrations', 'On-prem Option', 'SLA Guarantee', '24/7 Support'],
  },
];

export function SubscriptionPlans() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {PLANS.map(plan => (
        <div key={plan.id} className={`rounded-2xl border p-5 relative ${plan.color}`}>
          {plan.popular && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="text-[9px] font-black text-white bg-indigo-600 px-3 py-1 rounded-full whitespace-nowrap">⭐ MOST POPULAR</span>
            </div>
          )}
          <div className="mb-4">
            <p className="text-base font-black text-white">{plan.name}</p>
            <p className="text-2xl font-black text-white mt-2">
              {plan.price === 0 ? (
                <span className="text-yellow-300">Custom</span>
              ) : (
                <>₹{plan.price.toLocaleString('en-IN')}<span className="text-sm text-slate-500 font-normal">/mo</span></>
              )}
            </p>
            <p className="text-[9px] text-slate-500 mt-1">
              {plan.rooms === 9999 ? 'Unlimited' : `Up to ${plan.rooms}`} rooms · {plan.users === 9999 ? 'Unlimited' : plan.users} users
            </p>
          </div>
          <div className="space-y-1.5 mb-4">
            {plan.features.map(f => (
              <div key={f} className="flex items-center gap-1.5">
                <CheckCircle2 size={10} className="text-emerald-400 shrink-0" />
                <span className="text-[9px] text-slate-300">{f}</span>
              </div>
            ))}
          </div>
          <button className={`w-full h-8 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors ${
            plan.popular ? 'bg-indigo-600 hover:bg-indigo-500 text-white' : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
          }`}>
            {plan.price === 0 ? 'Contact Sales' : 'Choose Plan'}
          </button>
        </div>
      ))}
    </div>
  );
}
