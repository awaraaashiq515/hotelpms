'use client';

import React from 'react';

interface SupplierRegistrationFormProps {
  category: string;
  setCategory: (v: string) => void;
  gstNumber: string;
  setGstNumber: (v: string) => void;
  address: string;
  setAddress: (v: string) => void;
}

export function SupplierRegistrationForm({
  category, setCategory,
  gstNumber, setGstNumber,
  address, setAddress,
}: SupplierRegistrationFormProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
            Supply Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-4 py-3 bg-slate-950/80 border border-white/15 rounded-2xl text-sm font-medium text-white focus:border-violet-500 outline-none"
          >
            <option value="Vegetables">Fresh Vegetables & Fruits</option>
            <option value="Grocery">Grocery & Spices</option>
            <option value="Meat">Meat, Poultry & Seafood</option>
            <option value="Beverages">Beverages & Drinks</option>
            <option value="Dairy">Dairy & Bakery Products</option>
            <option value="Equipment">Kitchen & Hotel Equipment</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
            GST Number
          </label>
          <input
            type="text"
            value={gstNumber}
            onChange={(e) => setGstNumber(e.target.value)}
            className="w-full px-4 py-3 bg-slate-950/80 border border-white/15 rounded-2xl text-sm font-medium text-white placeholder-slate-500 focus:border-violet-500 outline-none"
            placeholder="22AAAAA0000A1Z5"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
          Warehouse Address
        </label>
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="w-full px-4 py-3 bg-slate-950/80 border border-white/15 rounded-2xl text-sm font-medium text-white placeholder-slate-500 focus:border-violet-500 outline-none"
          placeholder="Full street address & city"
        />
      </div>
    </div>
  );
}
