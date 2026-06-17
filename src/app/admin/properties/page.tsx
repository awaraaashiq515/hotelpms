'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { 
  Building2, 
  MapPin, 
  Users, 
  ShieldCheck, 
  Search,
  Plus,
  ArrowRight,
  Edit2,
  Trash2,
  UserCheck,
  AlertTriangle
} from 'lucide-react';

export default function GlobalPropertyManagement() {
  const [properties, setProperties] = useState<any[]>([]);
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [allowedPosCount, setAllowedPosCount] = useState<number>(3);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [allowedPropertyLimit, setAllowedPropertyLimit] = useState<number>(1);
  const [activePropertyCount, setActivePropertyCount] = useState<number>(0);
  const [packageFeatures, setPackageFeatures] = useState<string[]>([]);

  const [formData, setFormData] = useState<any>({
    name: '',
    code: '',
    type: 'RESTAURANT',
    city: '',
    state: '',
    country: 'India',
    organizationId: '',
    whatsAppEnabled: false,
    whatsAppApiKey: '',
    whatsAppInstanceId: '',
    whatsAppTemplate: '',
    restaurantPosEnabled: true,
    showRestaurantInQrMenu: true,
    barPosEnabled: false,
    showBarInQrMenu: true,
    cafePosEnabled: false,
    showCafeInQrMenu: true,
    deliveryEnabled: false,
    showDeliveryInQrMenu: true,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [propRes, adminRes, orgRes] = await Promise.all([
        fetch('/api/admin/properties?global=true'),
        fetch('/api/admin/users?global=true'), // We'll filter for ADMIN role locally or via API
        fetch('/api/super-admin/organizations')
      ]);
      
      const propData = await propRes.json();
      const adminData = await adminRes.json();
      const orgData = await orgRes.json();

      if (propData.success) setProperties(propData.data);
      if (adminData.success) {
        setAdmins(adminData.data.filter((u: any) => u.role?.name === 'RESTAURANTS_ADMIN' || u.role?.name === 'SUPER_ADMIN'));
      }
      if (orgData.success) setOrganizations(orgData.data);
    } catch (error) {
      console.error('Failed to fetch data', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (property?: any) => {
    if (property) {
      setEditingId(property.id);
      const org = property.organization;
      setAllowedPosCount(org?.package?.allowedPosCount ?? 3);
      setAllowedPropertyLimit(org?.package?.allowedPropertyCount ?? 1);
      setActivePropertyCount(org?._count?.properties ?? 0);
      setPackageFeatures(org?.package?.features?.map((f: any) => f.feature) || []);
      setFormData({
        name: property.name,
        code: property.code,
        type: property.type || 'RESTAURANT',
        city: property.city || '',
        state: property.state || '',
        country: property.country || 'India',
        organizationId: property.organizationId || '',
        whatsAppEnabled: property.whatsAppEnabled || false,
        whatsAppApiKey: property.whatsAppApiKey || '',
        whatsAppInstanceId: property.whatsAppInstanceId || '',
        whatsAppTemplate: property.whatsAppTemplate || '',
        restaurantPosEnabled: property.restaurantPosEnabled !== false,
        showRestaurantInQrMenu: property.showRestaurantInQrMenu !== false,
        barPosEnabled: !!property.barPosEnabled,
        showBarInQrMenu: property.showBarInQrMenu !== false,
        cafePosEnabled: !!property.cafePosEnabled,
        showCafeInQrMenu: property.showCafeInQrMenu !== false,
        deliveryEnabled: !!property.deliveryEnabled,
        showDeliveryInQrMenu: property.showDeliveryInQrMenu !== false,
      });
    } else {
      setEditingId(null);
      setAllowedPosCount(3);
      setAllowedPropertyLimit(1);
      setActivePropertyCount(0);
      setPackageFeatures([]);
      setFormData({ 
        name: '', 
        code: '', 
        type: 'RESTAURANT', 
        city: '', 
        state: '', 
        country: 'India', 
        organizationId: '', 
        whatsAppEnabled: false, 
        whatsAppApiKey: '', 
        whatsAppInstanceId: '', 
        whatsAppTemplate: '',
        restaurantPosEnabled: false,
        showRestaurantInQrMenu: false,
        barPosEnabled: false,
        showBarInQrMenu: false,
        cafePosEnabled: false,
        showCafeInQrMenu: false,
        deliveryEnabled: false,
        showDeliveryInQrMenu: false,
      });
    }
    setIsModalOpen(true);
  };

  const handleOrgChange = (orgId: string) => {
    const org = organizations.find(o => o.id === orgId);
    if (org) {
      setAllowedPosCount(org.package?.allowedPosCount ?? 3);
      setAllowedPropertyLimit(org.package?.allowedPropertyCount ?? 1);
      setActivePropertyCount(org._count?.properties ?? 0);
      setPackageFeatures(org.package?.features?.map((f: any) => f.feature) || []);
      
      const features = org.package?.features?.map((f: any) => f.feature) || [];
      setFormData((prev: any) => ({
        ...prev,
        organizationId: orgId,
        restaurantPosEnabled: features.includes('POS'),
        showRestaurantInQrMenu: features.includes('POS'),
        barPosEnabled: false,
        showBarInQrMenu: false,
        cafePosEnabled: false,
        showCafeInQrMenu: false,
        deliveryEnabled: false,
        showDeliveryInQrMenu: false,
      }));
    } else {
      setAllowedPosCount(3);
      setAllowedPropertyLimit(1);
      setActivePropertyCount(0);
      setPackageFeatures([]);
      setFormData((prev: any) => ({ ...prev, organizationId: orgId }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const url = '/api/admin/properties';
      const method = editingId ? 'PUT' : 'POST';
      const body = editingId ? { ...formData, id: editingId } : formData;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        setIsModalOpen(false);
        fetchData();
      } else {
        alert(data.error || 'Operation failed');
      }
    } catch (error) {
      alert('An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`GLOBAL DELETE: Are you sure you want to delete "${name}"? This will ERASE all POS data for this business permanently.`)) return;
    try {
      const res = await fetch(`/api/admin/properties?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) fetchData();
      else alert(data.error || 'Delete failed');
    } catch (error) {
      alert('Error during deletion');
    }
  };

  const filtered = properties.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.uniqueCode && p.uniqueCode.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const currentSelectedCount = (formData.restaurantPosEnabled ? 1 : 0) + (formData.barPosEnabled ? 1 : 0) + (formData.cafePosEnabled ? 1 : 0);
  const isPosSelectionFull = currentSelectedCount >= allowedPosCount;

  if (loading) return <div className="p-20 text-center animate-pulse text-slate-400 font-black uppercase tracking-widest text-xs">Global Console Loading...</div>;

  return (
    <div className="space-y-6 md:space-y-8 animate-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight transition-colors">Global Business Hub</h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm font-medium mt-1 tracking-wide flex items-center gap-2 transition-colors">
            <ShieldCheck size={14} style={{color:'#e8a0a0'}} />
            System-Wide Asset Management
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Filter businesses..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 transition-all shadow-sm text-slate-900 dark:text-white" style={{}} onFocus={e => e.currentTarget.style.boxShadow='0 0 0 2px #e8a0a040'} onBlur={e => e.currentTarget.style.boxShadow=''}/>
          </div>
          <Button onClick={() => handleOpenModal()} className="w-full sm:w-auto text-white rounded-xl py-4 px-6 font-bold text-[11px] tracking-widest shadow-lg flex items-center justify-center gap-2" style={{backgroundColor:'#e8a0a0', boxShadow:'0 4px 14px #e8a0a040'}}>
            <Plus size={16} />
            Register Enterprise
          </Button>
        </div>
      </div>


      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((property) => (
          <Card key={property.id} className="p-0 border-none shadow-sm hover:shadow-xl transition-all group overflow-hidden bg-white dark:bg-slate-900/40">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-500 dark:text-slate-400 group-hover:text-white transition-all duration-300" style={{}} onMouseEnter={e => (e.currentTarget.style.backgroundColor='#e8a0a0')} onMouseLeave={e => (e.currentTarget.style.backgroundColor='')}>
                  <Building2 size={28} />
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="flex gap-1">
                    <button onClick={() => handleOpenModal(property)} className="p-2 bg-slate-50 dark:bg-slate-800 text-slate-400 rounded-lg transition-colors" style={{}} onMouseEnter={e => (e.currentTarget.style.color='#e8a0a0')} onMouseLeave={e => (e.currentTarget.style.color='')}><Edit2 size={14} /></button>
                    <button onClick={() => handleDelete(property.id, property.name)} className="p-2 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-red-600 rounded-lg transition-colors"><Trash2 size={14} /></button>
                  </div>
                  <span className="px-2 py-1 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-[9px] font-black rounded-lg uppercase">System Checked</span>
                </div>
              </div>

              <div className="space-y-1 mb-6">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white truncate tracking-tight">{property.name}</h3>
                <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                  <div className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-slate-500 dark:text-slate-400 font-mono">{property.uniqueCode}</div>
                  <span>•</span>
                  <span>{property.type}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                  <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 tracking-wider mb-1">Total Users</p>
                  <div className="flex items-center gap-2">
                    <Users size={14} className="text-slate-500 dark:text-slate-400" />
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{property._count?.users || 0}</span>
                  </div>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-right">
                  <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 tracking-wider mb-1">Region</p>
                  <div className="flex items-center gap-2 justify-end">
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{property.city || 'Standard'}</span>
                    <MapPin size={14} className="text-slate-500 dark:text-slate-400" />
                  </div>
                </div>
              </div>

              <Button className="w-full bg-pos-primary hover:bg-pos-primary-dark text-white rounded-xl py-6 font-bold text-[12px] tracking-widest flex items-center justify-center gap-2 group-hover:translate-y-[-2px] transition-transform shadow-lg shadow-pos-primary/10">
                System Oversight
                <ArrowRight size={16} />
              </Button>
            </div>
            
            <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              <span>Sync ID: {property.id.slice(0, 8)}...</span>
              <span className="text-pos-primary">Live Global Access</span>
            </div>
          </Card>
        ))}
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingId ? "Modify Global Instance" : "Provision New Business Entity"}
      >
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          {!editingId && activePropertyCount >= allowedPropertyLimit && (
            <div className="p-3.5 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 rounded-xl text-xs font-bold flex items-center gap-2 mb-4 animate-bounce">
              <AlertTriangle size={16} />
              <span>Property limit reached ({activePropertyCount}/{allowedPropertyLimit} allowed). Please upgrade the owner's package plan.</span>
            </div>
          )}
          <Input
            label="Business Official Name"
            placeholder="e.g. Grand Plaza Hotel"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            className="rounded-xl border-slate-200"
          />
          <Input
            label="Internal Service Code"
            placeholder="e.g. GPH-001"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            required
            className="rounded-xl font-mono uppercase border-slate-200"
          />
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Entity Type</label>
              <select
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none bg-white dark:bg-slate-900 text-sm font-bold text-slate-700 dark:text-slate-200 transition-all cursor-pointer" style={{}} onFocus={e => {e.currentTarget.style.borderColor='#e8a0a0'; e.currentTarget.style.boxShadow='0 0 0 2px #e8a0a020';}} onBlur={e => {e.currentTarget.style.borderColor=''; e.currentTarget.style.boxShadow='';}}
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                required
              >
                <option value="RESTAURANT">Restaurant / Cafe</option>
                <option value="HOTEL">Hotel / Resort</option>
                <option value="RETAIL">Retail / Shop</option>
                <option value="OTHER">Other Business</option>
              </select>
            </div>
            
            <div className="space-y-1">
              <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Assign To Owner</label>
              <select
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none bg-white dark:bg-slate-900 text-sm font-bold text-slate-700 dark:text-slate-200 transition-all cursor-pointer" style={{}} onFocus={e => {e.currentTarget.style.borderColor='#e8a0a0'; e.currentTarget.style.boxShadow='0 0 0 2px #e8a0a020';}} onBlur={e => {e.currentTarget.style.borderColor=''; e.currentTarget.style.boxShadow='';}}
                value={formData.organizationId}
                onChange={(e) => handleOrgChange(e.target.value)}
                required
              >
                <option value="">-- Select Business Admin --</option>
                {admins.map(admin => (
                  <option key={admin.id} value={admin.organizationId}>
                    {admin.fullName} ({admin.email})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="City"
              placeholder="e.g. Mumbai"
              value={formData.city || ''}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              className="rounded-xl border-slate-200"
            />
            <Input
              label="State / Region"
              placeholder="e.g. Maharashtra"
              value={formData.state || ''}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              className="rounded-xl border-slate-200"
            />
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800 pt-6 mt-4">
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1 mb-4">
              POS Modules & Access Control (Plan Limit: {allowedPosCount} POS, Selected: {currentSelectedCount}/{allowedPosCount})
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                !packageFeatures.includes('POS') 
                  ? 'bg-red-50/20 border-red-150 dark:border-red-900/30 opacity-70' 
                  : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800'
              }`}>
                <div>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Restaurant POS 🍽️</span>
                  <p className="text-[9px] text-slate-400">Classic Dine In & Takeaway</p>
                  {!packageFeatures.includes('POS') && formData.organizationId && (
                    <span className="text-[8px] font-bold text-red-500 block mt-0.5 animate-pulse">Not included in Package</span>
                  )}
                </div>
                <input 
                  type="checkbox"
                  disabled={!packageFeatures.includes('POS') || (!formData.restaurantPosEnabled && isPosSelectionFull)}
                  checked={formData.restaurantPosEnabled}
                  onChange={(e) => setFormData({ ...formData, restaurantPosEnabled: e.target.checked, showRestaurantInQrMenu: e.target.checked })}
                  className="w-5 h-5 accent-pos-primary rounded border-slate-300 focus:ring-pos-primary cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              <div className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                !packageFeatures.includes('BARPOS') 
                  ? 'bg-red-50/20 border-red-150 dark:border-red-900/30 opacity-70' 
                  : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800'
              }`}>
                <div>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Bar POS 🍺</span>
                  <p className="text-[9px] text-slate-400">Premium Bar & Peg Controls</p>
                  {!packageFeatures.includes('BARPOS') && formData.organizationId && (
                    <span className="text-[8px] font-bold text-red-500 block mt-0.5 animate-pulse">Not included in Package</span>
                  )}
                </div>
                <input 
                  type="checkbox"
                  disabled={!packageFeatures.includes('BARPOS') || (!formData.barPosEnabled && isPosSelectionFull)}
                  checked={formData.barPosEnabled}
                  onChange={(e) => setFormData({ ...formData, barPosEnabled: e.target.checked, showBarInQrMenu: e.target.checked })}
                  className="w-5 h-5 accent-pos-primary rounded border-slate-300 focus:ring-pos-primary cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              <div className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                !packageFeatures.includes('CAFEPOS') 
                  ? 'bg-red-50/20 border-red-150 dark:border-red-900/30 opacity-70' 
                  : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800'
              }`}>
                <div>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Cafe POS ☕</span>
                  <p className="text-[9px] text-slate-400">Quick Bites & Coffee</p>
                  {!packageFeatures.includes('CAFEPOS') && formData.organizationId && (
                    <span className="text-[8px] font-bold text-red-500 block mt-0.5 animate-pulse">Not included in Package</span>
                  )}
                </div>
                <input 
                  type="checkbox"
                  disabled={!packageFeatures.includes('CAFEPOS') || (!formData.cafePosEnabled && isPosSelectionFull)}
                  checked={formData.cafePosEnabled}
                  onChange={(e) => setFormData({ ...formData, cafePosEnabled: e.target.checked, showCafeInQrMenu: e.target.checked })}
                  className="w-5 h-5 accent-pos-primary rounded border-slate-300 focus:ring-pos-primary cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800 pt-6 mt-4">
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1 mb-4">
              Additional Services & Integrations
            </h4>
            <div className="grid grid-cols-1 gap-4">
              <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                <div>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-202">Home Delivery 🚚</span>
                  <p className="text-[9px] text-slate-400">Logistics & Rider Portal</p>
                </div>
                <input 
                  type="checkbox"
                  checked={formData.deliveryEnabled}
                  onChange={(e) => setFormData({ ...formData, deliveryEnabled: e.target.checked, showDeliveryInQrMenu: e.target.checked })}
                  className="w-5 h-5 accent-pos-primary rounded border-slate-300 focus:ring-pos-primary cursor-pointer"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800 pt-6 mt-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">WhatsApp Integration</h4>
              <button 
                type="button"
                onClick={() => setFormData({ ...formData, whatsAppEnabled: !formData.whatsAppEnabled })}
                className={`relative w-12 h-6 rounded-full transition-all duration-300 ${formData.whatsAppEnabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}
              >
                <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-300 ${formData.whatsAppEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>

            {formData.whatsAppEnabled && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="API Key / Token"
                    placeholder="WhatsApp API Key"
                    value={formData.whatsAppApiKey}
                    onChange={(e) => setFormData({ ...formData, whatsAppApiKey: e.target.value })}
                    className="rounded-xl border-slate-200"
                  />
                  <Input
                    label="Instance / Channel ID"
                    placeholder="e.g. instance1234"
                    value={formData.whatsAppInstanceId}
                    onChange={(e) => setFormData({ ...formData, whatsAppInstanceId: e.target.value })}
                    className="rounded-xl border-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1 mb-1">Receipt Template</label>
                  <textarea
                    placeholder="Custom Receipt Template..."
                    value={formData.whatsAppTemplate}
                    onChange={(e) => setFormData({ ...formData, whatsAppTemplate: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none bg-white dark:bg-slate-900 text-sm font-medium text-slate-700 dark:text-slate-200 transition-all min-h-[100px]"
                  />
                  <p className="text-[8px] text-slate-400 font-bold uppercase tracking-tight mt-1 ml-1">
                    Variables: {'{HOTEL}, {ORDER_NO}, {AMOUNT}, {SUBTOTAL}, {TAX}, {ITEMS}'}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-800 mt-6">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)} type="button" className="rounded-xl font-black text-xs uppercase tracking-widest px-6">
              Cancel
            </Button>
            <Button 
              type="submit" 
              isLoading={submitting} 
              disabled={(!editingId && activePropertyCount >= allowedPropertyLimit) || submitting}
              className="text-white rounded-xl font-black text-xs uppercase tracking-widest px-8 shadow-lg disabled:opacity-50" 
              style={{backgroundColor:'#e8a0a0', boxShadow:'0 4px 14px #e8a0a030'}}
            >
              {editingId ? "Commit Changes" : "Provision Assets"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
