'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Package,
  Building2,
  Users,
  Search,
  ChevronRight,
  ChevronDown,
  Mail,
  Phone,
  ShieldCheck,
  Calendar,
  AlertCircle,
  Tag,
  Briefcase,
  ExternalLink,
  ArrowRight,
  RefreshCw,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

type User = {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  role: { name: string };
  isActive: boolean;
};

type Organization = {
  id: string;
  name: string;
  packageStartDate: string | null;
  packageEndDate: string | null;
  users: User[];
  _count: { properties: number };
};

type PkgAssignment = {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  organizations: Organization[];
};

export default function PackageAssignmentsPage() {
  const [data, setData] = useState<PkgAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedPackages, setExpandedPackages] = useState<Record<string, boolean>>({});
  const [expandedOrgs, setExpandedOrgs] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/super-admin/package-assignments');
      const json = await res.json();
      if (json.success) {
        setData(json.data);
        // Expand all packages by default
        const initExpanded: Record<string, boolean> = {};
        json.data.forEach((p: PkgAssignment) => {
          initExpanded[p.id] = true;
        });
        setExpandedPackages(initExpanded);
      }
    } catch (error) {
      console.error('Failed to fetch package assignments', error);
    } finally {
      setLoading(false);
    }
  };

  const togglePackage = (id: string) => {
    setExpandedPackages((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleOrg = (id: string) => {
    setExpandedOrgs((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredData = useMemo(() => {
    if (!search) return data;
    const s = search.toLowerCase();
    return data.map(pkg => ({
      ...pkg,
      organizations: pkg.organizations.filter(org => 
        pkg.name.toLowerCase().includes(s) ||
        org.name.toLowerCase().includes(s) ||
        org.users.some(u => u.fullName.toLowerCase().includes(s) || u.email.toLowerCase().includes(s))
      )
    })).filter(pkg => pkg.organizations.length > 0 || pkg.name.toLowerCase().includes(s));
  }, [data, search]);

  const packageStatus = (endDate: string | null) => {
    if (!endDate) return { label: 'No Limit', color: 'bg-slate-100 text-slate-600' };
    const date = new Date(endDate);
    const now = new Date();
    if (date < now) return { label: 'Expired', color: 'bg-red-100 text-red-600' };
    const diff = date.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 3600 * 24));
    if (days < 7) return { label: `Expiring soon (${days}d)`, color: 'bg-amber-100 text-amber-600' };
    return { label: `Active (${days}d left)`, color: 'bg-emerald-100 text-emerald-600' };
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-pos-primary/30 border-t-pos-primary rounded-full animate-spin" />
        <p className="text-slate-500 font-medium animate-pulse uppercase tracking-widest text-xs">Fetching Assignment Data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-1 w-8 bg-pos-primary rounded-full" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-pos-primary">Enterprise Registry</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            Package Assignments
            <div className="p-1.5 rounded-xl bg-pos-primary/10 text-pos-primary">
              <Sparkles size={20} className="fill-current" />
            </div>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 max-w-lg">
            Track user distribution across subscription tiers and organizations.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-80 group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-pos-primary transition-colors">
            <Search size={18} />
          </div>
          <input
            type="text"
            placeholder="Search Packages, Orgs or Users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm focus:outline-none focus:ring-4 focus:ring-pos-primary/10 focus:border-pos-primary transition-all font-medium text-sm text-slate-900 dark:text-white"
          />
          {search && (
            <button 
              onClick={() => setSearch('')}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-red-500 transition-colors"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          )}
        </div>
      </div>

      {/* Package Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {data.slice(0, 4).map(pkg => (
          <div key={pkg.id} className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex items-center gap-4 group">
            <div 
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shrink-0 group-hover:scale-110 transition-transform shadow-lg"
              style={{ background: pkg.color || '#6366f1' }}
            >
              <Package size={22} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{pkg.name}</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white line-clamp-1">{pkg.organizations.length} Organizations</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main List */}
      <div className="space-y-6">
        {filteredData.length === 0 ? (
          <div className="py-20 text-center bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="text-slate-300" size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">No Assignments Found</h3>
            <p className="text-slate-400 dark:text-slate-500 text-sm mt-2">Try widening your search or check if any packages are assigned.</p>
          </div>
        ) : (
          filteredData.map((pkg) => (
            <div key={pkg.id} className="group/pkg">
              <div 
                className="flex items-center gap-4 mb-4 cursor-pointer select-none sticky top-4 z-20"
                onClick={() => togglePackage(pkg.id)}
              >
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-pos-primary/10"
                  style={{ background: pkg.color || '#6366f1' }}
                >
                  {expandedPackages[pkg.id] ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                </div>
                <div className="flex-1 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex items-center justify-between pr-6">
                  <div className="flex items-center gap-3">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white uppercase tracking-tight">{pkg.name}</h2>
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{pkg.organizations.length} Organizations Assigned</span>
                  </div>
                  {pkg.description && (
                    <p className="hidden md:block text-xs text-slate-400 dark:text-slate-500 italic">"{pkg.description}"</p>
                  )}
                </div>
              </div>

              {expandedPackages[pkg.id] && (
                <div className="ml-5 pl-7 border-l-2 border-slate-100 space-y-4 pt-2">
                  {pkg.organizations.length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-4">No organizations assigned to this package.</p>
                  ) : (
                    pkg.organizations.map((org) => {
                      const status = packageStatus(org.packageEndDate);
                      return (
                        <div key={org.id} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden overflow-x-auto">
                          {/* Org Header */}
                          <div 
                            className="p-5 flex items-center justify-between gap-6 cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-all border-b border-slate-50 dark:border-slate-800/50"
                            onClick={() => toggleOrg(org.id)}
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-11 h-11 rounded-full bg-pos-primary/10 flex items-center justify-center text-pos-primary shrink-0">
                                <Building2 size={20} />
                              </div>
                              <div>
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-tight">{org.name}</h3>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${status.color} dark:bg-opacity-20`}>
                                    {status.label}
                                  </span>
                                  <span className="text-[10px] text-slate-400 flex items-center gap-1 font-bold">
                                    <ShieldCheck size={10} /> {org._count.properties} Properties
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-6 pr-2">
                              <div className="hidden lg:flex flex-col items-end">
                                <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] mb-0.5">Subscription Since</span>
                                <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5">
                                  <Calendar size={12} className="text-slate-400" />
                                  {org.packageStartDate ? new Date(org.packageStartDate).toLocaleDateString() : 'N/A'}
                                </span>
                              </div>
                              <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                                {expandedOrgs[org.id] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                              </div>
                            </div>
                          </div>

                          {/* Users List */}
                          {(!expandedOrgs || expandedOrgs[org.id] !== false) && (
                            <div className="p-0 animate-in fade-in slide-in-from-top-2 duration-300">
                              <table className="w-full text-left">
                                <thead className="bg-slate-50/50 dark:bg-slate-800/50 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] border-b border-slate-100 dark:border-slate-800/50">
                                  <tr>
                                    <th className="px-6 py-3 pl-20">Full Name</th>
                                    <th className="px-6 py-3">Email Address</th>
                                    <th className="px-6 py-3">Role</th>
                                    <th className="px-6 py-3 text-right">Status</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                  {org.users.length === 0 ? (
                                    <tr>
                                      <td colSpan={4} className="px-6 py-8 text-center text-xs text-slate-400 italic">
                                        No users found for this organization.
                                      </td>
                                    </tr>
                                  ) : (
                                    org.users.map((user) => (
                                      <tr key={user.id} className="hover:bg-pos-primary/5 dark:hover:bg-pos-primary/10 group/user transition-colors">
                                        <td className="px-6 py-4 pl-20">
                                          <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover/user:bg-pos-primary/10 flex items-center justify-center text-xs font-bold text-slate-500 group-hover/user:text-pos-primary transition-colors">
                                              {user.fullName.charAt(0)}
                                            </div>
                                            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{user.fullName}</span>
                                          </div>
                                        </td>
                                        <td className="px-6 py-4">
                                          <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
                                            <Mail size={12} className="text-slate-300" />
                                            {user.email}
                                          </div>
                                          {user.phone && (
                                            <div className="flex items-center gap-2 text-slate-400 text-[10px] mt-0.5">
                                              <Phone size={10} /> {user.phone}
                                            </div>
                                          )}
                                        </td>
                                        <td className="px-6 py-4">
                                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-pos-primary/10 text-pos-primary text-[10px] font-black uppercase tracking-tight">
                                            <ShieldCheck size={10} /> {user.role.name}
                                          </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                          {user.isActive ? (
                                            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" title="Active" />
                                          ) : (
                                            <span className="inline-block w-2 h-2 rounded-full bg-slate-300" title="Inactive" />
                                          )}
                                        </td>
                                      </tr>
                                    ))
                                  )}
                                </tbody>
                              </table>
                              {/* Footer action */}
                              <div className="px-6 py-3 bg-slate-50/30 dark:bg-slate-800/30 flex justify-end">
                                <a 
                                  href={`/admin/users?search=${org.name}`}
                                  className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-1 hover:gap-2 transition-all"
                                >
                                  Manage All Users <ArrowRight size={10} />
                                </a>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Helper Tip */}
      <Card className="p-6 bg-indigo-900 border-none shadow-2xl overflow-hidden relative group">
        <div className="absolute top-0 right-0 p-8 text-indigo-500/20 group-hover:scale-110 transition-transform">
          <Briefcase size={80} />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2">
            <h3 className="text-xl font-black text-white flex items-center gap-2">
              <AlertCircle className="text-amber-400" size={24} />
              Quick Search Tip
            </h3>
            <p className="text-indigo-100 text-sm max-w-xl">
              Type <strong className="text-amber-400">"Packages3"</strong> in the search bar above to instantly view all users and organizations assigned to that specific tier. You can also search by user email or organization name.
            </p>
          </div>
          <button 
            onClick={() => {
              setSearch('Packages3');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="px-6 py-3 rounded-2xl bg-white text-pos-primary font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-colors shadow-lg"
          >
            Show Packages3 Now
          </button>
        </div>
      </Card>
    </div>
  );
}
