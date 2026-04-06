'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Settings, ShieldCheck, CheckSquare, Square } from 'lucide-react';

const AVAILABLE_MODULES = [
  { id: 'Dashboard', name: 'Dashboard', description: 'Main analytics dashboard' },
  { id: 'POS Home', name: 'POS Home', description: 'Operations landing page' },
  { id: 'Businesses', name: 'Businesses', description: 'Manage properties/outlets' },
  { id: 'POS Terminal', name: 'POS Terminal', description: 'Billing and order taking' },
  { id: 'Invoices', name: 'Invoices', description: 'View and manage invoices' },
  { id: 'Payments', name: 'Payments', description: 'View and manage payments' },
  { id: 'Inventory', name: 'Inventory', description: 'Product and stock management' },
  { id: 'KOTs', name: 'KOTs', description: 'Kitchen Order Tickets' },
  { id: 'Kitchen Display', name: 'Kitchen Display', description: 'Live kitchen view' },
  { id: 'Day Closing', name: 'Day Closing', description: 'Daily settlement' },
  
  // Expenses Group
  { id: 'Expenses', name: 'Expenses', description: 'Expense management section' },
  { id: 'All Expenses', name: 'All Expenses', description: 'View all expenses list' },
  { id: 'New Expense', name: 'New Expense', description: 'Create new expense entries' },
  { id: 'Categories', name: 'Categories', description: 'Manage expense categories' },

  // Accounting Group
  { id: 'Accounting', name: 'Accounting', description: 'Accounting and Vouchers' },
  { id: 'Voucher List', name: 'Voucher List', description: 'View all accounting vouchers' },
  { id: 'Cash Book', name: 'Cash Book', description: 'View cash transactions' },
  { id: 'Day Book', name: 'Day Book', description: 'View daily ledger' },
  { id: 'Ledger', name: 'Ledger', description: 'Full accounting ledger' },

  // Operations Group
  { id: 'Operations', name: 'Operations', description: 'Main operations section' },
  { id: 'Table Layout', name: 'Table Layout', description: 'Floor and table management' },
  { id: 'Orders Control', name: 'Orders Control', description: 'Manage active/pending orders' },
  { id: 'Live Occupancy', name: 'Live Occupancy', description: 'Real-time table status' },
  { id: 'Table Bookings', name: 'Table Bookings', description: 'Manage reservations' },
  { id: 'Drivers', name: 'Drivers', description: 'Manage delivery drivers' },
  { id: 'POS Staff', name: 'POS Staff', description: 'Manage operational staff' },

  // Reports Group
  { id: 'Reports', name: 'Reports', description: 'Reports & Analytics' },
  { id: 'Sales Summary', name: 'Sales Summary', description: 'General sales reports' },
  { id: 'Order Summary', name: 'Order Summary', description: 'Order level history' },
  { id: 'Executive Sales', name: 'Executive Sales', description: 'Staff performance reports' },

  // Access & Settings
  { id: 'POS Access', name: 'POS Access', description: 'Manage terminal users' },
  { id: 'Settings', name: 'Settings', description: 'System configurations' }
];

export default function RolesPage() {
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Array of module IDs currently granted
  const [grantedModules, setGrantedModules] = useState<string[]>([]);
  const [fetchingPermissions, setFetchingPermissions] = useState(false);

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/roles').then(r => r.json());
      if (res.success) {
        // Filter out SUPER_ADMIN as it should not be manageable via this UI
        const filteredRoles = res.data.filter((r: any) => r.name !== 'SUPER_ADMIN');
        setRoles(filteredRoles);
      }
    } catch (error) {
      console.error('Failed to fetch roles', error);
    } finally {
      setLoading(false);
    }
  };

  const openPermissionsModal = async (role: any) => {
    setSelectedRole(role);
    setIsModalOpen(true);
    setFetchingPermissions(true);
    setGrantedModules([]);

    try {
      const res = await fetch(`/api/admin/roles/${role.id}/permissions`).then(r => r.json());
      if (res.success) {
        setGrantedModules(res.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch permissions', error);
    } finally {
      setFetchingPermissions(false);
    }
  };

  const toggleModule = (moduleId: string) => {
    setGrantedModules(prev => 
      prev.includes(moduleId)
        ? prev.filter(m => m !== moduleId)
        : [...prev, moduleId]
    );
  };

  const savePermissions = async () => {
    if (!selectedRole) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/roles/${selectedRole.id}/permissions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modules: grantedModules }),
      });
      const data = await res.json();
      if (data.success) {
        setIsModalOpen(false);
      } else {
        alert(data.error || 'Failed to update permissions');
      }
    } catch (error) {
      alert('An error occurred');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white uppercase">Role Permissions</h1>
          <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1 flex items-center gap-2">
            <ShieldCheck size={14} className="text-pos-primary" />
            Manage page-level access for system roles
          </p>
        </div>
      </div>

      <Card className="p-0 overflow-hidden border-2 border-slate-100 dark:border-slate-800 shadow-xl dark:shadow-none rounded-2xl bg-white dark:bg-slate-900/40">
        {loading ? (
          <div className="p-20 text-center flex flex-col items-center gap-4">
             <div className="w-8 h-8 border-4 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
             <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading Roles...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-900/50 border-b-2 border-slate-100 dark:border-slate-800">
                  <th className="px-6 py-5 text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-[0.2em]">Role Name</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-[0.2em]">Description</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-[0.2em]">Type</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-[0.2em] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {roles.map((role) => (
                  <tr key={role.id} className="hover:bg-pos-primary/5 dark:hover:bg-slate-800/50 transition-all group">
                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-white uppercase text-xs">
                      {role.name === 'POSSYSTEM' ? 'OPERATOR (POSSYSTEM)' : role.name}
                    </td>
                    <td className="px-6 py-4 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      {role.description || 'System standard role'}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="indigo" className="font-black text-[9px] uppercase tracking-tighter">
                        Standard
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button 
                        variant="secondary" 
                        onClick={() => openPermissionsModal(role)}
                        className="px-4 py-2 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ml-auto"
                      >
                        <Settings size={14} />
                        Permissions
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`Permissions for ${selectedRole?.name}`}>
        <div className="pt-4 space-y-6">
           <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 mb-6">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Select the pages and modules this role should have access to. 
                Users will need to log out and log back in for changes to take effect.
              </p>
           </div>

           {fetchingPermissions ? (
              <div className="py-12 flex justify-center">
                <div className="w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
           ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                {AVAILABLE_MODULES.map(module => {
                  const isGranted = grantedModules.includes(module.id);
                  return (
                    <div 
                      key={module.id}
                      onClick={() => toggleModule(module.id)}
                      className={`
                        p-4 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-3
                        ${isGranted ? 'border-pos-primary bg-pos-primary/10 dark:bg-pos-primary/20' : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-200 dark:hover:border-slate-700'}
                      `}
                    >
                      <div className={`mt-0.5 ${isGranted ? 'text-pos-primary' : 'text-slate-300 dark:text-slate-600'}`}>
                        {isGranted ? <CheckSquare size={18} /> : <Square size={18} />}
                      </div>
                      <div>
                        <div className={`text-sm font-bold ${isGranted ? 'text-pos-primary/90 dark:text-pos-primary/80' : 'text-slate-700 dark:text-slate-300'}`}>
                          {module.name}
                        </div>
                        <div className={`text-[10px] uppercase tracking-widest mt-1 font-bold ${isGranted ? 'text-pos-primary/70' : 'text-slate-400 dark:text-slate-500'}`}>
                          {module.description}
                        </div>
                      </div>
                    </div>
                  );
                })}
             </div>
           )}

           <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
             <Button variant="secondary" onClick={() => setIsModalOpen(false)} className="rounded-xl font-black text-[10px] uppercase tracking-widest px-6">
               Cancel
             </Button>
             <Button 
               onClick={savePermissions} 
               disabled={fetchingPermissions || saving}
               isLoading={saving}
               className="bg-slate-900 hover:bg-black text-white rounded-xl font-black text-[10px] uppercase tracking-widest px-8 shadow-lg shadow-slate-900/10"
             >
               Save Permissions
             </Button>
           </div>
        </div>
      </Modal>
    </div>
  );
}
