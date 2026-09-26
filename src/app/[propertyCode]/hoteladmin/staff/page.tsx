'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Users, Search, RefreshCw, CheckCircle2, XCircle, Clock,
  ArrowLeft, Phone, ShieldCheck, UserCheck, Briefcase
} from 'lucide-react';

interface StaffMember {
  id: string;
  name: string;
  role: string;
  department: string;
  phone?: string;
  status: 'PRESENT' | 'ABSENT' | 'CLOCKED_OUT';
  clockInTime?: string;
}

export default function HotelAdminStaffPage() {
  const params = useParams();
  const propertyCode = (params?.propertyCode as string) || '';

  const [staff, setStaff] = useState<StaffMember[]>([
    {
      id: 'ST-1',
      name: 'Ramesh Kumar',
      role: 'Head Receptionist',
      department: 'Front Office',
      phone: '+91 98765 43210',
      status: 'PRESENT',
      clockInTime: '08:00 AM',
    },
    {
      id: 'ST-2',
      name: 'Pooja Sharma',
      role: 'Housekeeping Lead',
      department: 'Housekeeping',
      phone: '+91 98111 22334',
      status: 'PRESENT',
      clockInTime: '08:30 AM',
    },
    {
      id: 'ST-3',
      name: 'Suresh Yadav',
      role: 'Room Boy',
      department: 'Housekeeping',
      phone: '+91 98456 78901',
      status: 'PRESENT',
      clockInTime: '09:00 AM',
    },
    {
      id: 'ST-4',
      name: 'Vikas Singh',
      role: 'Chef / Kitchen',
      department: 'F&B',
      phone: '+91 97123 45678',
      status: 'PRESENT',
      clockInTime: '07:30 AM',
    },
    {
      id: 'ST-5',
      name: 'Deepak Verma',
      role: 'Security Guard',
      department: 'Security',
      phone: '+91 96543 21098',
      status: 'CLOCKED_OUT',
      clockInTime: 'Night Shift (Over)',
    },
    {
      id: 'ST-6',
      name: 'Manoj Tiwari',
      role: 'Maintenance Tech',
      department: 'Engineering',
      phone: '+91 95432 10987',
      status: 'ABSENT',
    },
  ]);

  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredStaff = staff.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.department.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      filterStatus === 'ALL' || s.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const presentCount = staff.filter((s) => s.status === 'PRESENT').length;
  const absentCount = staff.filter((s) => s.status === 'ABSENT').length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href={`/${propertyCode}/hoteladmin`}
              className="text-xs font-bold text-slate-500 hover:text-amber-500 flex items-center gap-1 transition-colors"
            >
              <ArrowLeft size={14} /> Back to Dashboard
            </Link>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <Users className="text-amber-500" size={26} />
            Staff & Attendance Overview
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time staff punch status, department allocation, and attendance records
          </p>
        </div>

        <button
          onClick={() => {}}
          className="flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors w-fit"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Total Hotel Staff</p>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{staff.length}</p>
          <p className="text-[10px] text-slate-400 mt-1">Across all departments</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-500/20 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-wider text-emerald-500">Present Today</p>
          <p className="text-2xl font-black text-emerald-500 mt-1">{presentCount}</p>
          <p className="text-[10px] text-slate-400 mt-1">Clocked in & on duty</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-rose-500/20 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-wider text-rose-500">Absent / Not Arrived</p>
          <p className="text-2xl font-black text-rose-500 mt-1">{absentCount}</p>
          <p className="text-[10px] text-slate-400 mt-1">Not yet logged in</p>
        </div>
      </div>

      {/* Filter & Search */}
      <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="flex items-center gap-1.5 w-full md:w-auto">
          {[
            { id: 'ALL', label: 'All Staff' },
            { id: 'PRESENT', label: '✅ Present' },
            { id: 'ABSENT', label: '❌ Absent' },
            { id: 'CLOCKED_OUT', label: '🔄 Clocked Out' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filterStatus === tab.id
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search staff, role, department..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-transparent focus:border-amber-500 outline-none transition-all dark:text-white"
          />
        </div>
      </div>

      {/* Staff Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase text-slate-500 tracking-wider">
              <tr>
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Role & Department</th>
                <th className="py-3 px-4">Contact Phone</th>
                <th className="py-3 px-4">Clock-in Time</th>
                <th className="py-3 px-4 text-right">Today's Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {filteredStaff.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span className="w-7 h-7 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center font-black text-xs">
                        {s.name.charAt(0)}
                      </span>
                      <span>{s.name}</span>
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    <span className="font-bold text-slate-800 dark:text-slate-200 block">{s.role}</span>
                    <span className="text-[10px] text-slate-400">{s.department}</span>
                  </td>

                  <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                    {s.phone || '—'}
                  </td>

                  <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                    {s.clockInTime || '—'}
                  </td>

                  <td className="py-3 px-4 text-right">
                    <span
                      className={`inline-block px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                        s.status === 'PRESENT'
                          ? 'bg-emerald-500/15 text-emerald-500'
                          : s.status === 'CLOCKED_OUT'
                          ? 'bg-amber-500/15 text-amber-500'
                          : 'bg-rose-500/15 text-rose-500'
                      }`}
                    >
                      {s.status === 'PRESENT' ? '✅ Present' : s.status === 'CLOCKED_OUT' ? '🔄 Clocked Out' : '❌ Absent'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
