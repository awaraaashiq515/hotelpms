'use client';

import React from 'react';
import { Hash } from 'lucide-react';

interface StaffRegistrationFormProps {
  branchCode: string;
  setBranchCode: (v: string) => void;
}

export function StaffRegistrationForm({
  branchCode,
  setBranchCode,
}: StaffRegistrationFormProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
          Property / Branch Code
        </label>
        <div className="relative">
          <Hash size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={branchCode}
            onChange={(e) => setBranchCode(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-slate-950/80 border border-white/15 rounded-2xl text-sm font-medium text-white placeholder-slate-500 focus:border-violet-500 outline-none"
            placeholder="e.g. HOTEL-MAIN-1"
          />
        </div>
      </div>
    </div>
  );
}
