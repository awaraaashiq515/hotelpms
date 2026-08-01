import React from 'react';
import { Building2, Phone, Mail, Star, MapPin, ExternalLink } from 'lucide-react';

export interface Vendor {
  id: string;
  name: string;
  category: string;
  contact: string;
  email?: string;
  phone?: string;
  address?: string;
  rating: number;
  totalOrders: number;
  totalValue: number;
  status: 'ACTIVE' | 'INACTIVE' | 'BLACKLISTED';
  paymentTerms?: string;
}

interface VendorCardProps {
  vendor: Vendor;
  onSelect?: (v: Vendor) => void;
}

const STATUS_COLOR: Record<string, string> = {
  ACTIVE:     'text-emerald-300 bg-emerald-500/10 border-emerald-500/20',
  INACTIVE:   'text-slate-400 bg-slate-800 border-slate-700',
  BLACKLISTED:'text-rose-300 bg-rose-500/10 border-rose-500/20',
};

export function VendorCard({ vendor, onSelect }: VendorCardProps) {
  return (
    <div onClick={() => onSelect?.(vendor)}
      className="rounded-2xl bg-slate-900/50 border border-white/5 p-4 hover:border-indigo-500/30 transition-all cursor-pointer group">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center shrink-0">
          <Building2 size={16} className="text-slate-400" />
        </div>
        <span className={`text-[8px] font-black px-2 py-0.5 rounded-full border ${STATUS_COLOR[vendor.status]}`}>
          {vendor.status}
        </span>
      </div>
      <p className="text-xs font-black text-white mb-0.5">{vendor.name}</p>
      <p className="text-[9px] text-indigo-400 font-semibold mb-3">{vendor.category}</p>

      <div className="space-y-1 mb-3">
        {vendor.phone && (
          <div className="flex items-center gap-1.5">
            <Phone size={9} className="text-slate-600" />
            <span className="text-[9px] text-slate-400">{vendor.phone}</span>
          </div>
        )}
        {vendor.email && (
          <div className="flex items-center gap-1.5">
            <Mail size={9} className="text-slate-600" />
            <span className="text-[9px] text-slate-400 truncate">{vendor.email}</span>
          </div>
        )}
        {vendor.address && (
          <div className="flex items-center gap-1.5">
            <MapPin size={9} className="text-slate-600" />
            <span className="text-[9px] text-slate-500 truncate">{vendor.address}</span>
          </div>
        )}
      </div>

      {/* Rating */}
      <div className="flex gap-0.5 mb-3">
        {[1,2,3,4,5].map(s => (
          <Star key={s} size={10}
            className={s <= vendor.rating ? 'text-yellow-400' : 'text-slate-700'}
            fill={s <= vendor.rating ? 'currentColor' : 'none'} />
        ))}
      </div>

      <div className="pt-3 border-t border-white/5 grid grid-cols-2 gap-2">
        <div>
          <p className="text-xs font-black text-white">{vendor.totalOrders}</p>
          <p className="text-[8px] text-slate-600">Orders</p>
        </div>
        <div>
          <p className="text-xs font-black text-white">₹{(vendor.totalValue/1000).toFixed(0)}K</p>
          <p className="text-[8px] text-slate-600">Value</p>
        </div>
      </div>
    </div>
  );
}
