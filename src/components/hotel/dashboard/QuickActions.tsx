import React from 'react';
import Link from 'next/link';
import {
  Calendar,
  ChefHat,
  BrushIcon,
  Receipt,
  Wrench,
  Users,
  MapPin,
  BarChart3,
  Package,
  Moon,
  Shirt,
  Sparkles,
} from 'lucide-react';

const ACTIONS = [
  // Row 1
  { 
    label: 'New Booking', 
    href: '/hotel/bookings', 
    icon: Calendar, 
    type: 'primary-indigo' 
  },
  { 
    label: 'Room Service', 
    href: '/hotel/room-service', 
    icon: ChefHat, 
    type: 'primary-orange' 
  },
  { 
    label: 'Housekeeping', 
    href: '/hotel/housekeeping', 
    icon: BrushIcon, 
    type: 'transparent' 
  },
  { 
    label: 'Folios', 
    href: '/hotel/billing', 
    icon: Receipt, 
    type: 'slate' 
  },
  
  // Row 2
  { 
    label: 'Maintenance', 
    href: '/hotel/maintenance', 
    icon: Wrench, 
    type: 'transparent' 
  },
  { 
    label: 'CRM', 
    href: '/hotel/crm', 
    icon: Users, 
    type: 'transparent' 
  },
  { 
    label: 'Lost & Found', 
    href: '/hotel/lost-found', 
    icon: MapPin, 
    type: 'slate' 
  },
  { 
    label: 'Analytics', 
    href: '/hotel/analytics', 
    icon: BarChart3, 
    type: 'slate' 
  },
  
  // Row 3
  { 
    label: 'Inventory', 
    href: '/hotel/inventory', 
    icon: Package, 
    type: 'slate' 
  },
  { 
    label: 'Night Audit', 
    href: '/hotel/night-audit', 
    icon: Moon, 
    type: 'slate' 
  },
  { 
    label: 'Laundry', 
    href: '/hotel/laundry', 
    icon: Shirt, 
    type: 'slate' 
  },
  { 
    label: 'Spa', 
    href: '/hotel/spa', 
    icon: Sparkles, 
    type: 'transparent' 
  },
];

export function QuickActions() {
  return (
    <div className="rounded-[24px] bg-[#0c1020]/90 border border-slate-800/80 p-6 flex flex-col gap-4 shadow-xl">
      <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest">
        Quick Actions
      </p>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {ACTIONS.map((action) => {
          let styleClass = '';
          
          if (action.type === 'primary-indigo') {
            styleClass = 'bg-[#4f46e5] hover:bg-[#4338ca] text-white shadow-lg shadow-indigo-950/20';
          } else if (action.type === 'primary-orange') {
            styleClass = 'bg-[#c2410c] hover:bg-[#ea580c] text-white shadow-lg shadow-orange-950/20';
          } else if (action.type === 'slate') {
            styleClass = 'bg-[#1e293b]/70 hover:bg-[#1e293b] border border-slate-800/40 hover:border-slate-700/60 text-white';
          } else {
            styleClass = 'bg-transparent hover:bg-slate-800/30 border border-transparent hover:border-slate-800/40 text-slate-200 hover:text-white';
          }

          return (
            <Link
              key={action.label}
              href={action.href}
              className={`flex flex-col items-center justify-center gap-3 p-5 rounded-2xl h-[105px] font-black text-[10px] uppercase tracking-wider text-center transition-all duration-200 active:scale-95 cursor-pointer ${styleClass}`}
            >
              <action.icon size={20} className="shrink-0" />
              <span>{action.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
