'use client';

import React from 'react';
import { Building2 } from 'lucide-react';

interface HotelOwnerRegistrationFormProps {
  businessName: string;
  setBusinessName: (v: string) => void;
}

export function HotelOwnerRegistrationForm({
  businessName,
  setBusinessName,
}: HotelOwnerRegistrationFormProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
          Hotel / Restaurant Business Name
        </label>
        <div className="relative">
          <Building2 size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-slate-950/80 border border-white/15 rounded-2xl text-sm font-medium text-white placeholder-slate-500 focus:border-violet-500 outline-none"
            placeholder="e.g. Royal Crown Hotel & Resort"
          />
        </div>
      </div>
    </div>
  );
}
