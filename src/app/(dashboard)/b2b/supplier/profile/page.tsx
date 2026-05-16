'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { 
  Mail, 
  Phone, 
  MapPin, 
  ShieldCheck, 
  Store,
  Globe,
  Loader2,
  Save,
  Building,
  Briefcase,
  CheckCircle2,
  Camera,
  Upload
} from 'lucide-react';
import { toast } from 'sonner';

export default function SupplierProfilePage() {
  const [supplier, setSupplier] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    category: '',
    image: ''
  });

  useEffect(() => {
    setMounted(true);
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const sessionRes = await fetch('/api/auth/session');
      const sessionData = await sessionRes.json();
      
      if (sessionData.authenticated && sessionData.user.supplierId) {
        const res = await fetch(`/api/b2b/suppliers`);
        const data = await res.json();
        const current = data.find((s: any) => s.id === sessionData.user.supplierId);
        if (current) {
          setSupplier(current);
          setFormData({
            name: current.name || '',
            email: current.email || '',
            phone: current.phone || '',
            address: current.address || '',
            category: current.category || '',
            image: current.image || ''
          });
        }
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching profile:', error);
      setLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, image: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplier?.id) return;
    setSaving(true);

    try {
      const res = await fetch('/api/b2b/suppliers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: supplier.id,
          ...formData
        })
      });

      if (res.ok) {
        toast.success('Profile updated successfully');
        fetchProfile();
      } else {
        toast.error('Failed to update profile');
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setSaving(false);
    }
  };

  if (!mounted) return null;
  if (loading) return <div className="h-96 flex items-center justify-center animate-pulse text-slate-300"><Loader2 className="animate-spin" size={48} /></div>;

  return (
    <div className="max-w-[1200px] mx-auto space-y-4 pb-12">
      <PageHeader 
        title="Store Profile" 
        description="Manage your business identity and contact details"
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Quick Stats & Identity (With Photo Upload) */}
        <div className="lg:col-span-4 space-y-4">
          <Card className="p-5 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-[32px] overflow-hidden relative group">
             <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
             <div className="relative z-10 flex flex-col items-center text-center py-4">
                {/* Profile Photo Upload */}
                <div className="relative group/avatar cursor-pointer">
                   <div className="w-24 h-24 bg-emerald-50 dark:bg-emerald-950/30 rounded-[32px] flex items-center justify-center text-emerald-600 mb-4 border border-emerald-100 dark:border-emerald-900 overflow-hidden shadow-xl">
                      {formData.image ? (
                        <img src={formData.image} className="w-full h-full object-cover" />
                      ) : (
                        <Store size={40} />
                      )}
                   </div>
                   <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/avatar:opacity-100 transition-opacity rounded-[32px] flex items-center justify-center mb-4">
                      <Camera size={24} className="text-white" />
                   </div>
                   <input 
                     type="file" accept="image/*" 
                     onChange={handleImageUpload}
                     className="absolute inset-0 opacity-0 cursor-pointer"
                   />
                </div>

                <h2 className="text-lg font-black uppercase tracking-tight">{supplier?.name}</h2>
                <Badge className="mt-2 bg-emerald-50 text-emerald-600 border-none text-[8px] font-black tracking-widest uppercase h-4">
                   Verified Partner
                </Badge>
                
                <div className="mt-6 w-full grid grid-cols-2 gap-2">
                   <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Active Since</p>
                      <p className="text-xs font-black mt-0.5">2026</p>
                   </div>
                   <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Trust Score</p>
                      <p className="text-xs font-black text-emerald-600 mt-0.5">99%</p>
                   </div>
                </div>
                
                <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest mt-4">Click logo to upload new photo</p>
             </div>
          </Card>

          <Card className="p-4 border-slate-100 dark:border-slate-800">
             <h3 className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-4">Verification Status</h3>
             <div className="space-y-3">
                {[
                  { label: 'Business License', status: 'Approved' },
                  { label: 'GST Verification', status: 'Approved' },
                  { label: 'Bank Details', status: 'Pending' }
                ].map(v => (
                  <div key={v.label} className="flex items-center justify-between">
                     <p className="text-[10px] font-bold text-slate-600">{v.label}</p>
                     <Badge className={v.status === 'Approved' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}>
                        {v.status}
                     </Badge>
                  </div>
                ))}
             </div>
          </Card>
        </div>

        {/* Right Column: Dynamic Form */}
        <div className="lg:col-span-8">
          <Card className="p-6 border-slate-100 dark:border-slate-800 rounded-[32px]">
             <form onSubmit={handleUpdate} className="space-y-6">
                <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-800 pb-4">
                   <h3 className="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2">
                      <Building size={16} className="text-emerald-500" /> Business Information
                   </h3>
                   <Button type="submit" disabled={saving} size="sm" className="bg-slate-900 hover:bg-emerald-600 gap-2 h-9 px-4 rounded-xl text-[9px] font-black uppercase tracking-widest">
                      {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} 
                      Save Changes
                   </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                   <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Store Legal Name</label>
                      <div className="relative group">
                         <Building size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                         <input 
                           className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/10 text-xs font-bold"
                           value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}
                         />
                      </div>
                   </div>

                   <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Business Category</label>
                      <div className="relative group">
                         <Briefcase size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
                         <select 
                           className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/10 text-xs font-bold appearance-none"
                           value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})}
                         >
                            <option>Vegetables</option>
                            <option>Dairy</option>
                            <option>Meat</option>
                            <option>Grocery</option>
                            <option>Poultry</option>
                         </select>
                      </div>
                   </div>

                   <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Support Email</label>
                      <div className="relative group">
                         <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
                         <input 
                           type="email"
                           className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/10 text-xs font-bold"
                           value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})}
                         />
                      </div>
                   </div>

                   <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Contact Phone</label>
                      <div className="relative group">
                         <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
                         <input 
                           className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/10 text-xs font-bold"
                           value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})}
                         />
                      </div>
                   </div>

                   <div className="md:col-span-2 space-y-2">
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Warehouse Address</label>
                      <div className="relative group">
                         <MapPin size={14} className="absolute left-3 top-4 text-slate-300" />
                         <textarea 
                           rows={3}
                           className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/10 text-xs font-bold resize-none"
                           value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})}
                         />
                      </div>
                   </div>
                </div>

                <div className="pt-4 flex items-center gap-2 p-3 bg-emerald-50/50 rounded-2xl border border-emerald-100 dark:border-emerald-900/30">
                   <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                   <p className="text-[9px] text-emerald-800 font-bold uppercase tracking-widest leading-relaxed">
                      Your business profile is publicly visible to restaurants in the marketplace. Keep your contact details updated to receive faster orders.
                   </p>
                </div>
             </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
