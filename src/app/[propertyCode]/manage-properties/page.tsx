'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Home, Plus, Edit2, Trash2, AlertCircle, ArrowRightCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/shared/page-header';

export default function PropertiesPage() {
  const router = useRouter();
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [allowedPosCount, setAllowedPosCount] = useState<number>(3);
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
    restaurantPosEnabled: true,
    showRestaurantInQrMenu: true,
    barPosEnabled: false,
    showBarInQrMenu: true,
    cafePosEnabled: false,
    showCafeInQrMenu: true,
    deliveryEnabled: false,
    showDeliveryInQrMenu: true,
    bookingEmail: '',
    gmailAppPassword: '',
  });

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/properties');
      const data = await res.json();
      if (data.success) {
        setProperties(data.data);
        if (data.package) {
          setAllowedPosCount(data.package.allowedPosCount ?? 3);
          setAllowedPropertyLimit(data.package.allowedPropertyCount ?? 1);
          setPackageFeatures(data.package.features || []);
        }
        setActivePropertyCount(data.activePropertyCount ?? 0);
      }
    } catch (error) {
      console.error('Failed to fetch properties', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (property?: any) => {
    if (property) {
      setEditingId(property.id);
      setFormData({
        name: property.name,
        code: property.code,
        type: property.type || 'RESTAURANT',
        city: property.city || '',
        state: property.state || '',
        country: property.country || 'India',
        restaurantPosEnabled: property.restaurantPosEnabled !== false,
        showRestaurantInQrMenu: property.showRestaurantInQrMenu !== false,
        barPosEnabled: !!property.barPosEnabled,
        showBarInQrMenu: property.showBarInQrMenu !== false,
        cafePosEnabled: !!property.cafePosEnabled,
        showCafeInQrMenu: property.showCafeInQrMenu !== false,
        deliveryEnabled: !!property.deliveryEnabled,
        showDeliveryInQrMenu: property.showDeliveryInQrMenu !== false,
        bookingEmail: property.bookingEmail || '',
        gmailAppPassword: property.gmailAppPassword || '',
      });
    } else {
      setEditingId(null);
      const hasPos = packageFeatures.includes('POS');
      setFormData({
        name: '',
        code: '',
        type: 'RESTAURANT',
        city: '',
        state: '',
        country: 'India',
        restaurantPosEnabled: hasPos,
        showRestaurantInQrMenu: hasPos,
        barPosEnabled: false,
        showBarInQrMenu: false,
        cafePosEnabled: false,
        showCafeInQrMenu: false,
        deliveryEnabled: false,
        showDeliveryInQrMenu: false,
        bookingEmail: '',
        gmailAppPassword: '',
      });
    }
    setIsModalOpen(true);
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
        fetchProperties();
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
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone and will delete all associated POS data.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/properties?id=${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        fetchProperties();
      } else {
        alert(data.error || 'Failed to delete property');
      }
    } catch (error) {
      alert('An error occurred during deletion');
    }
  };

  const handleSwitchProperty = async (id: string, name: string) => {
    try {
      const prop = properties.find((p: any) => p.id === id);
      const isHotel = prop?.type === 'HOTEL';

      const res = await fetch('/api/setup/properties/select', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId: id }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`Switched to "${name}" successfully!`);
        if (isHotel) {
          router.push('/hotel');
        } else {
          router.push('/dashboard');
        }
        router.refresh();
      } else {
        alert(data.error || 'Failed to switch property');
      }
    } catch (error) {
      alert('An error occurred');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Property Management"
        subtitle="Manage branches and POS locations."
        showBack
        backUrl="/operations"
        actions={
          <Button onClick={() => handleOpenModal()} className="rounded-xl shadow-lg shadow-pos-primary/20">
            <Plus size={16} className="mr-2" />
            Add New Branch
          </Button>
        }
      />

      <Card className="overflow-hidden border-2 border-slate-200/60 dark:border-slate-800 shadow-xl dark:shadow-none rounded-2xl bg-white dark:bg-slate-900/40">
        {loading ? (
          <div className="p-20 text-center flex flex-col items-center gap-4">
             <div className="w-8 h-8 border-4 border-pos-primary border-t-transparent rounded-full animate-spin"></div>
             <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading branches...</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 dark:bg-slate-900/50 border-b-2 border-slate-100 dark:border-slate-800">
                    <th className="px-6 py-5 text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 tracking-widest">Branch Name</th>
                    <th className="px-6 py-5 text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 tracking-widest">Code</th>
                    <th className="px-6 py-5 text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 tracking-widest">Type</th>
                    <th className="px-6 py-5 text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 tracking-widest">Location</th>
                    <th className="px-6 py-5 text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 tracking-widest">Users</th>
                    <th className="px-6 py-5 text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {properties.length > 0 ? properties.map((prop) => (
                    <tr key={prop.id} className="hover:bg-pos-primary/5 dark:hover:bg-slate-800/50 transition-all group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 group-hover:bg-pos-primary group-hover:text-white transition-colors">
                            <Home size={14} />
                          </div>
                          <span className="font-bold text-slate-900 dark:text-white uppercase text-xs">{prop.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-[10px] font-bold text-pos-primary dark:text-pos-primary/80 bg-pos-primary/10 dark:bg-pos-primary/20 px-2 py-1 rounded-md border border-pos-primary/20 dark:border-pos-primary/30 tracking-wider">
                          {prop.code}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 tracking-widest bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                          {prop.type || 'RESTAURANT'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                        {[prop.city, prop.state].filter(Boolean).join(', ') || 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                          <span className="text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase">{prop._count?.users || 0} Users</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => handleSwitchProperty(prop.id, prop.name)} className="px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-[10px] font-bold tracking-widest hover:bg-emerald-600 transition-all shadow-md">Enter</button>
                          <button onClick={() => handleOpenModal(prop)} className="p-2 text-slate-400 hover:text-pos-primary transition-colors"><Edit2 size={16} /></button>
                          <button onClick={() => handleDelete(prop.id, prop.name)} className="p-2 text-slate-400 hover:text-red-600 transition-colors"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={6} className="p-10 text-center opacity-30 uppercase font-black text-xs">No properties found</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="lg:hidden divide-y divide-slate-100 dark:divide-slate-800">
              {properties.map((prop) => (
                <div key={prop.id} className="p-5 space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                        <Home size={18} />
                      </div>
                      <div>
                        <p className="font-black text-slate-900 dark:text-white uppercase text-xs">{prop.name}</p>
                        <p className="text-[10px] font-black text-pos-primary uppercase tracking-widest">{prop.code}</p>
                      </div>
                    </div>
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                      {prop.type || 'RESTAURANT'}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl">
                    <div>
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Location</p>
                      <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300 truncate">{[prop.city, prop.state].filter(Boolean).join(', ') || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Access</p>
                      <div className="flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                        <p className="text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase">{prop._count?.users || 0} Users</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <button onClick={() => handleSwitchProperty(prop.id, prop.name)} className="flex-1 py-2.5 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/10">Enter Property</button>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleOpenModal(prop)} className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-500"><Edit2 size={16} /></button>
                      <button onClick={() => handleDelete(prop.id, prop.name)} className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-500"><Trash2 size={16} /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingId ? "Update Branch Details" : "Create New Branch"}
      >
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          {!editingId && activePropertyCount >= allowedPropertyLimit && (
            <div className="p-3.5 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 rounded-xl text-xs font-bold flex items-center gap-2 mb-4 animate-bounce">
              <AlertCircle size={16} />
              <span>Property limit reached ({activePropertyCount}/{allowedPropertyLimit} allowed). Please contact support to upgrade your package.</span>
            </div>
          )}

          <Input
            label="Branch / Property Name"
            placeholder="e.g. Seaside Premium Resort"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            className="rounded-xl"
          />
          <Input
            label="Branch Code (Unique)"
            placeholder="e.g. MNR01"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            required
            className="rounded-xl font-mono uppercase"
          />
          
          <div className="space-y-1">
            <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Business Type</label>
            <select
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary bg-white dark:bg-slate-900 text-sm font-bold text-slate-700 dark:text-slate-200 transition-all cursor-pointer"
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

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="City"
              placeholder="e.g. New York"
              value={formData.city || ''}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              className="rounded-xl"
            />
            <Input
              label="State"
              placeholder="e.g. Himachal Pradesh"
              value={formData.state || ''}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              className="rounded-xl"
            />
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800 pt-6 mt-4">
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1 mb-4">
              POS Modules & Access Control (Plan Limit: {allowedPosCount} POS, Selected: {(formData.restaurantPosEnabled ? 1 : 0) + (formData.barPosEnabled ? 1 : 0) + (formData.cafePosEnabled ? 1 : 0)}/{allowedPosCount})
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Restaurant POS */}
              <div className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                !packageFeatures.includes('POS') 
                  ? 'bg-red-50/20 border-red-150 dark:border-red-900/30 opacity-70' 
                  : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800'
              }`}>
                <div>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Restaurant POS 🍽️</span>
                  <p className="text-[9px] text-slate-400">Classic Dine In & Takeaway</p>
                  {!packageFeatures.includes('POS') && (
                    <span className="text-[8px] font-bold text-red-500 block mt-0.5 animate-pulse">Not included in Package</span>
                  )}
                </div>
                <input 
                  type="checkbox"
                  disabled={!packageFeatures.includes('POS') || (!formData.restaurantPosEnabled && ((formData.restaurantPosEnabled ? 1 : 0) + (formData.barPosEnabled ? 1 : 0) + (formData.cafePosEnabled ? 1 : 0)) >= allowedPosCount)}
                  checked={formData.restaurantPosEnabled}
                  onChange={(e) => setFormData({ ...formData, restaurantPosEnabled: e.target.checked, showRestaurantInQrMenu: e.target.checked })}
                  className="w-5 h-5 accent-pos-primary rounded border-slate-300 focus:ring-pos-primary cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              {/* Bar POS */}
              <div className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                !packageFeatures.includes('BARPOS') 
                  ? 'bg-red-50/20 border-red-150 dark:border-red-900/30 opacity-70' 
                  : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800'
              }`}>
                <div>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Bar POS 🍺</span>
                  <p className="text-[9px] text-slate-400">Premium Bar & Peg Controls</p>
                  {!packageFeatures.includes('BARPOS') && (
                    <span className="text-[8px] font-bold text-red-500 block mt-0.5 animate-pulse">Not included in Package</span>
                  )}
                </div>
                <input 
                  type="checkbox"
                  disabled={!packageFeatures.includes('BARPOS') || (!formData.barPosEnabled && ((formData.restaurantPosEnabled ? 1 : 0) + (formData.barPosEnabled ? 1 : 0) + (formData.cafePosEnabled ? 1 : 0)) >= allowedPosCount)}
                  checked={formData.barPosEnabled}
                  onChange={(e) => setFormData({ ...formData, barPosEnabled: e.target.checked, showBarInQrMenu: e.target.checked })}
                  className="w-5 h-5 accent-pos-primary rounded border-slate-300 focus:ring-pos-primary cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              {/* Cafe POS */}
              <div className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                !packageFeatures.includes('CAFEPOS') 
                  ? 'bg-red-50/20 border-red-150 dark:border-red-900/30 opacity-70' 
                  : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800'
              }`}>
                <div>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Cafe POS ☕</span>
                  <p className="text-[9px] text-slate-400">Quick Bites & Coffee</p>
                  {!packageFeatures.includes('CAFEPOS') && (
                    <span className="text-[8px] font-bold text-red-500 block mt-0.5 animate-pulse">Not included in Package</span>
                  )}
                </div>
                <input 
                  type="checkbox"
                  disabled={!packageFeatures.includes('CAFEPOS') || (!formData.cafePosEnabled && ((formData.restaurantPosEnabled ? 1 : 0) + (formData.barPosEnabled ? 1 : 0) + (formData.cafePosEnabled ? 1 : 0)) >= allowedPosCount)}
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
              {/* Home Delivery */}
              <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
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

          {/* Email Booking Integration */}
          {formData.type === 'HOTEL' && (
            <div className="border-t border-slate-100 dark:border-slate-800 pt-6 mt-4">
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1 mb-4">
                Email Booking Integration (Gmail)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Hotel Booking Email (Gmail)"
                  placeholder="e.g. royalhotel@gmail.com"
                  value={formData.bookingEmail || ''}
                  onChange={(e) => setFormData({ ...formData, bookingEmail: e.target.value })}
                  className="rounded-xl border-slate-200"
                />
                <Input
                  label="Gmail App Password (16-digit)"
                  type="password"
                  placeholder="xxxx xxxx xxxx xxxx"
                  value={formData.gmailAppPassword || ''}
                  onChange={(e) => setFormData({ ...formData, gmailAppPassword: e.target.value })}
                  className="rounded-xl border-slate-200"
                />
              </div>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wide mt-2 ml-1">
                ⚙️ Go to hotel Gmail → Settings → Security → App Passwords → Generate 16-digit key
              </p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-800 mt-6">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)} type="button" className="rounded-xl font-black text-xs uppercase tracking-widest">
              Cancel
            </Button>
            <Button 
              type="submit" 
              isLoading={submitting} 
              disabled={(!editingId && activePropertyCount >= allowedPropertyLimit) || submitting}
              className="rounded-xl font-black text-xs uppercase tracking-widest px-8"
            >
              {editingId ? "Save Changes" : "Create Branch"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
