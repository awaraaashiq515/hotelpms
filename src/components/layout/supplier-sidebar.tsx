'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Package, 
  Truck, 
  LogOut, 
  Store,
  ChevronRight,
  User,
  ShoppingBag,
  FileText,
  Bell,
  BarChart3,
  Star,
  QrCode
} from 'lucide-react';

export function SupplierSidebar() {
  const pathname = usePathname();

  const menuItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/b2b/supplier' },
    { label: 'My Products', icon: ShoppingBag, path: '/b2b/supplier/products' },
    { label: 'Active Orders', icon: Truck, path: '/b2b/supplier/orders' },
    { label: 'Notifications', icon: Bell, path: '/b2b/supplier/notifications' },
    { label: 'Reports & GST', icon: BarChart3, path: '/b2b/supplier/reports' },
    { label: 'Invoices', icon: FileText, path: '/b2b/supplier/invoices' },
    { label: 'Settlements', icon: Package, path: '/b2b/supplier/payments' },
    { label: 'Ratings', icon: Star, path: '/b2b/supplier/ratings' },
    { label: 'QR Ordering', icon: QrCode, path: '/b2b/supplier/qr' },
    { label: 'Profile', icon: User, path: '/b2b/supplier/profile' },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col h-full border-r border-slate-800">
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
          <Store size={22} className="text-white" />
        </div>
        <div>
          <h1 className="font-black text-sm tracking-tight leading-none">SUPPLIER</h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Portal Hub</p>
        </div>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto no-scrollbar">
        {menuItems.map((item) => (
          <Link
            key={item.label}
            href={item.path}
            className={`flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition-all group ${
              pathname === item.path 
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <item.icon size={18} className={pathname === item.path ? 'text-white' : 'text-slate-500 group-hover:text-emerald-400'} />
              {item.label}
            </div>
            <ChevronRight size={14} className={`opacity-0 group-hover:opacity-100 transition-opacity ${pathname === item.path ? 'opacity-100' : ''}`} />
          </Link>
        ))}
      </nav>

      <div className="p-4 mt-auto">
        <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50 mb-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-bold">JD</div>
            <div>
              <p className="text-[10px] font-bold">John Supplier</p>
              <p className="text-[9px] text-slate-500">Verified Partner</p>
            </div>
          </div>
          <button 
            onClick={() => window.location.href = '/login'}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-slate-700 hover:bg-rose-500/20 hover:text-rose-400 text-slate-400 text-[10px] font-bold transition-all"
          >
            <LogOut size={14} /> Logout
          </button>
        </div>
      </div>
    </aside>
  );
}
