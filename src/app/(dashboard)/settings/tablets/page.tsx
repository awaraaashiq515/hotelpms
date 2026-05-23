'use client';

import React, { useState, useEffect } from 'react';
import { 
  Plus, Tablet, Edit2, Trash2, 
  Settings, Save, X, RefreshCw,
  Table as TableIcon, User, Monitor
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { useToast } from '@/components/ui/Toast';

interface TabletDevice {
  id: string;
  name: string;
  mode: 'WAITER' | 'TABLE';
  tableId?: string | null;
  waiterId?: string | null;
  propertyId: string;
  isActive: boolean;
}

interface Table {
  id: string;
  name: string;
}

interface StaffMember {
  id: string;
  name: string;
  isActive: boolean;
  designation?: string | null;
}

export default function TabletSettingsPage() {
  const [tablets, setTablets] = useState<TabletDevice[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTablet, setEditingTablet] = useState<TabletDevice | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    mode: 'WAITER' as 'WAITER' | 'TABLE',
    tableId: '',
    waiterId: '',
    propertyId: ''
  });

  const { addToast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    try {
      // First get current property
      const propRes = await fetch('/api/setup/properties/current');
      const propData = await propRes.json();
      
      if (!propData.success) {
        addToast('error', 'Please select a property first');
        return;
      }

      const currentPropertyId = propData.data.id;
      setFormData(prev => ({ ...prev, propertyId: currentPropertyId }));

      const [tabRes, tableRes, staffRes] = await Promise.all([
        fetch(`/api/tablets?propertyId=${currentPropertyId}`),
        fetch(`/api/tables?propertyId=${currentPropertyId}`),
        fetch(`/api/staff-members?propertyId=${currentPropertyId}`)
      ]);
      const tabData = await tabRes.json();
      const tableData = await tableRes.json();
      const staffData = await staffRes.json();
      
      if (tabData.success) setTablets(tabData.data);
      if (tableData.success) setTables(tableData.data);
      if (staffData.success) setStaffMembers(staffData.data);
    } catch (e) {
      addToast('error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = (tablet?: TabletDevice) => {
    if (tablet) {
      setEditingTablet(tablet);
      setFormData({
        name: tablet.name,
        mode: tablet.mode,
        tableId: tablet.tableId || '',
        waiterId: tablet.waiterId || '',
        propertyId: tablet.propertyId
      });
    } else {
      setEditingTablet(null);
      setFormData(prev => ({
        ...prev,
        name: '',
        mode: 'WAITER',
        tableId: '',
        waiterId: '',
      }));
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const url = editingTablet ? `/api/tablets/${editingTablet.id}` : '/api/tablets';
      const method = editingTablet ? 'PATCH' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await res.json();
      if (data.success) {
        addToast('success', editingTablet ? 'Tablet updated' : 'Tablet added');
        setIsModalOpen(false);
        fetchData();
      } else {
        addToast('error', data.message || 'Action failed');
      }
    } catch (e) {
      addToast('error', 'Network error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this tablet?')) return;
    try {
      const res = await fetch(`/api/tablets/${id}`, { method: 'DELETE' });
      if (res.ok) {
        addToast('success', 'Tablet deleted');
        fetchData();
      }
    } catch (e) {
      addToast('error', 'Delete failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black section-heading tracking-tight">Tablet Configuration</h1>
          <p className="text-gray-500 dark:text-slate-400 text-sm font-medium">Manage ordering devices and their operational modes</p>
        </div>
        <Button onClick={() => handleOpenModal()} className="rounded-2xl shadow-lg shadow-pos-primary/10 py-3 bg-pos-primary hover:bg-pos-primary-dark">
          <Plus className="mr-2" size={18} /> Add New Tablet
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="animate-spin text-pos-primary" size={32} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tablets.map(tablet => (
            <Card key={tablet.id} className="p-6 hover:shadow-xl transition-all border border-gray-100 dark:border-slate-700 rounded-3xl relative overflow-hidden group dark:bg-slate-900">
              <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex gap-2">
                  <button onClick={() => handleOpenModal(tablet)} className="p-2 bg-white dark:bg-slate-800 shadow-md rounded-xl text-gray-400 dark:text-slate-400 hover:text-pos-primary">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => handleDelete(tablet.id)} className="p-2 bg-white dark:bg-slate-800 shadow-md rounded-xl text-gray-400 dark:text-slate-400 hover:text-red-500">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-4 mb-6">
                <div className={`p-4 rounded-2xl ${tablet.mode === 'TABLE' ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600' : 'bg-pos-primary/10 text-pos-primary'}`}>
                  <Tablet size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white">{tablet.name}</h3>
                  <div className="flex gap-2 mt-1">
                    <Badge variant={tablet.mode === 'TABLE' ? 'success' : 'indigo'} className="text-[10px] uppercase font-black tracking-widest px-2">
                      {tablet.mode} Mode
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-gray-50 dark:border-slate-700">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400 dark:text-slate-500 font-bold uppercase text-[10px] tracking-widest">Linked To</span>
                  <span className="text-gray-900 dark:text-white font-black">
                    {tablet.mode === 'TABLE' 
                      ? `Table ${tables.find(t => t.id === tablet.tableId)?.name || 'Not Linked'}` 
                      : (staffMembers.find(s => s.id === tablet.waiterId)?.name || 'No Staff Assigned')}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400 dark:text-slate-500 font-bold uppercase text-[10px] tracking-widest">Device Status</span>
                  <Badge variant={tablet.isActive ? 'success' : 'neutral'} className="rounded-full h-2 w-2 p-0 animate-pulse">{''}</Badge>
                </div>
              </div>

              <div className="mt-8">
                <Button variant="secondary" className="w-full rounded-2xl text-[10px] uppercase font-black tracking-widest" onClick={() => window.open(`/tablet/${tablet.id}`, '_blank')}>
                  <Monitor className="mr-2" size={14} /> Open Live Display
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTablet ? 'Update Tablet' : 'Add Tablet'}
        footer={(
          <div className="flex gap-4 w-full px-2 pb-2">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)} className="flex-1 rounded-2xl h-14 font-black uppercase tracking-widest">Cancel</Button>
            <Button onClick={handleSave} loading={isSaving} className="flex-1 rounded-2xl h-14 font-black uppercase tracking-widest bg-pos-primary hover:bg-pos-primary-dark">Save Config</Button>
          </div>
        )}
      >
        <div className="space-y-6">
          <Input 
            label="Device Name (e.g., Tablet 01)"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className="rounded-2xl focus:ring-pos-primary/20"
          />

          <Select 
            label="Operational Mode"
            options={[
              { label: 'Waiter Mode (Staff Controlled)', value: 'WAITER' },
              { label: 'Table Mode (Customer Controlled)', value: 'TABLE' }
            ]}
            value={formData.mode}
            onChange={(e) => setFormData(prev => ({ ...prev, mode: e.target.value as 'WAITER' | 'TABLE' }))}
          />

          {formData.mode === 'TABLE' && (
            <Select 
              label="Assign to Physical Table"
              options={tables.map(t => ({ label: `Table ${t.name}`, value: t.id }))}
              value={formData.tableId}
              onChange={(e) => setFormData(prev => ({ ...prev, tableId: e.target.value }))}
            />
          )}

          {formData.mode === 'WAITER' && (
            <Select 
              label="Assign to Staff Member (Waiter)"
              options={[
                { label: 'Do Not Assign / Open for All', value: '' },
                ...staffMembers
                  .filter(s => s.isActive)
                  .map(s => ({ label: `${s.name} (${s.designation || 'Staff'})`, value: s.id }))
              ]}
              value={formData.waiterId}
              onChange={(e) => setFormData(prev => ({ ...prev, waiterId: e.target.value }))}
            />
          )}

          <div className="bg-amber-50 p-4 rounded-3xl border border-amber-100">
            <p className="text-[10px] font-black uppercase text-amber-600 tracking-widest mb-1 flex items-center gap-2">
              <Settings size={12} /> Mode Note
            </p>
            <p className="text-xs text-amber-700 font-medium leading-relaxed">
              {formData.mode === 'TABLE' 
                ? 'In Table Mode, the tablet will be locked to the assigned table and customers can order directly.' 
                : 'In Waiter Mode, staff can select any table from the dashboard before placing orders.'}
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
