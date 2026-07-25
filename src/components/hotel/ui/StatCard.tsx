import React from 'react';
import Link from 'next/link';
import { ChevronRight, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  color: string;
  href?: string;
  trend?: string;
  trendUp?: boolean;
}

export function StatCard({ label, value, sub, icon: Icon, color, href, trend, trendUp }: StatCardProps) {
  const inner = (
    <div className={`relative overflow-hidden rounded-2xl border p-4 transition-all duration-300 hover:scale-[1.02] group ${color}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/5">
          <Icon size={16} className="opacity-80" />
        </div>
        {trend && (
          <span className={`flex items-center gap-0.5 text-[9px] font-black uppercase ${trendUp ? 'text-emerald-400' : 'text-rose-400'}`}>
            {trendUp ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
            {trend}
          </span>
        )}
      </div>
      <p className="text-2xl font-black text-white leading-none mb-1">{value}</p>
      <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">{label}</p>
      {sub && <p className="text-[9px] text-white/30 mt-0.5">{sub}</p>}
      {href && <ChevronRight size={12} className="absolute bottom-3 right-3 text-white/20 group-hover:text-white/50 transition-colors" />}
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : <div>{inner}</div>;
}
