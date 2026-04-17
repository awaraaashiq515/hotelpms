'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Image as ImageIcon, Upload, Tablet, ChevronRight, Printer, ShieldCheck, CreditCard, LayoutDashboard, Globe, MonitorPlay, MapPin, Facebook, Instagram, Twitter, Save, RefreshCcw } from 'lucide-react';
import Link from 'next/link';

// --- Shared Components ---

const BusinessProfileForm = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [property, setProperty] = useState<any>(null);
  
  const [displayName, setDisplayName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [gstNumber, setGstNumber] = useState('');

  useEffect(() => {
    fetch('/api/setup/properties/current')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          const prop = data.data;
          setProperty(prop);
          setDisplayName(prop.name || '');
          setAddress(prop.address || '');
          setPhone(prop.phone || '');
          setGstNumber(prop.taxDetails || '');
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!property) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/setup/properties/${property.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: displayName,
          address,
          phone,
          taxDetails: gstNumber,
          logoUrl: property.logoUrl // Keep existing logo
        })
      });
      if (res.ok) alert('Profile updated successfully!');
    } catch (error) {
      alert('Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-20 text-center animate-pulse text-gray-400 font-black uppercase tracking-widest">Loading Profile...</div>;

  return (
    <Card className="p-8 border-t-4 border-t-pos-primary shadow-2xl shadow-gray-100">
      <div className="flex items-center gap-4 mb-8 pb-6 border-b border-gray-100">
        <div className="w-12 h-12 bg-pos-primary/10 text-pos-primary rounded-2xl flex items-center justify-center">
          <Printer size={24} />
        </div>
        <div>
          <h2 className="text-base font-black text-gray-900 dark:text-white uppercase tracking-widest">Bill Header Details</h2>
          <p className="text-[10px] text-gray-400 dark:text-slate-400 font-bold uppercase mt-0.5 tracking-tighter">This info appears on your printed bills & invoices</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="sm:col-span-2">
          <label className="block text-[10px] font-black text-gray-400 dark:text-slate-400 uppercase tracking-widest mb-2">Restaurant / Display Name</label>
          <input 
            type="text" 
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full px-5 py-4 rounded-2xl border border-gray-200 dark:border-slate-700 focus:outline-none focus:ring-4 focus:ring-pos-primary/10 focus:border-pos-primary bg-gray-50/30 dark:bg-slate-800/50 font-black text-sm dark:text-white uppercase tracking-tight transition-all"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-[10px] font-black text-gray-400 dark:text-slate-400 uppercase tracking-widest mb-2">Physical Address</label>
          <textarea 
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            rows={3}
            className="w-full px-5 py-4 rounded-2xl border border-gray-200 dark:border-slate-700 focus:outline-none focus:ring-4 focus:ring-pos-primary/10 focus:border-pos-primary bg-gray-50/30 dark:bg-slate-800/50 font-bold text-sm dark:text-white tracking-tight transition-all"
          />
        </div>

        <div>
          <label className="block text-[10px] font-black text-gray-400 dark:text-slate-400 uppercase tracking-widest mb-2">Contact Number</label>
          <input 
            type="text" 
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-5 py-4 rounded-2xl border border-gray-200 dark:border-slate-700 focus:outline-none focus:ring-4 focus:ring-pos-primary/10 focus:border-pos-primary bg-gray-50/30 dark:bg-slate-800/50 font-bold text-sm dark:text-white transition-all"
          />
        </div>

        <div>
          <label className="block text-[10px] font-black text-gray-400 dark:text-slate-400 uppercase tracking-widest mb-2">GSTIN / TAX No</label>
          <input 
            type="text" 
            value={gstNumber}
            onChange={(e) => setGstNumber(e.target.value)}
            className="w-full px-5 py-4 rounded-2xl border border-gray-200 dark:border-slate-700 focus:outline-none focus:ring-4 focus:ring-pos-primary/10 focus:border-pos-primary bg-gray-50/30 dark:bg-slate-800/50 font-black text-sm dark:text-white transition-all"
          />
        </div>

        <div className="sm:col-span-2 pt-4">
          <Button 
            onClick={handleSave} 
            disabled={saving}
            className="w-full bg-pos-primary hover:bg-red-700 text-white font-black tracking-widest py-5 rounded-2xl shadow-xl shadow-red-100 flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
          >
            {saving ? 'UPDATING PRINT SETTINGS...' : 'SAVE PRINT CONFIGURATION'}
            <ChevronRight size={20} />
          </Button>
        </div>
      </div>
    </Card>
  );
};

const BrandingForm = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [property, setProperty] = useState<any>(null);
  const [logoUrl, setLogoUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetch('/api/setup/properties/current')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setProperty(data.data);
          setLogoUrl(data.data.logoUrl || '');
        }
        setLoading(false);
      });
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success) setLogoUrl(data.url);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!property) return;
    setSaving(true);
    try {
      await fetch(`/api/setup/properties/${property.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...property, logoUrl })
      });
      alert('Branding updated!');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return null;

  return (
    <Card className="p-8 border-t-4 border-t-pos-primary shadow-2xl shadow-pos-primary/10">
      <div className="flex items-center gap-4 mb-8 pb-6 border-b border-gray-100">
        <div className="w-12 h-12 bg-pos-primary/10 text-pos-primary rounded-2xl flex items-center justify-center">
          <ImageIcon size={24} />
        </div>
        <div>
          <h2 className="text-base font-black text-gray-900 dark:text-white uppercase tracking-widest">Logo & Identity</h2>
          <p className="text-[10px] text-gray-400 dark:text-slate-400 font-bold uppercase mt-0.5 tracking-tighter">Your logo will be printed on KOTs and Bills</p>
        </div>
      </div>

      <div className="space-y-8 text-center sm:text-left">
        <div className="flex flex-col sm:flex-row items-center gap-10">
          <div className="w-56 h-56 rounded-[3rem] bg-gray-50 dark:bg-slate-800 border-4 border-dashed border-gray-200 dark:border-slate-700 flex items-center justify-center overflow-hidden relative group shadow-inner transition-all hover:border-pos-primary/30">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="w-full h-full object-contain p-6 group-hover:scale-110 transition-transform duration-500" />
            ) : (
              <ImageIcon className="text-gray-200 dark:text-slate-600" size={80} />
            )}
            {uploading && (
              <div className="absolute inset-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm flex items-center justify-center">
                 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pos-primary"></div>
              </div>
            )}
          </div>
          <div className="flex-1 space-y-4">
            <div>
              <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" id="logo-upload-branding" />
              <label 
                htmlFor="logo-upload-branding" 
                className="inline-flex items-center px-8 py-4 bg-pos-primary text-white rounded-2xl text-xs font-black uppercase tracking-widest cursor-pointer hover:bg-pos-primary-dark transition-all shadow-xl shadow-pos-primary/10 active:scale-95"
              >
                <Upload size={16} className="mr-3" />
                Change Logo
              </label>
            </div>
            <p className="text-[10px] text-gray-400 font-bold leading-relaxed uppercase tracking-widest">
              Recommended: Square PNG <br/> with transparency (min 512x512px)
            </p>
          </div>
        </div>

        <div className="pt-4">
          <Button 
            onClick={handleSave} 
            disabled={saving || uploading}
            className="w-full bg-slate-900 hover:bg-black text-white font-black tracking-widest py-5 rounded-2xl shadow-xl flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
          >
            {saving ? 'SAVING BRANDING...' : 'UPDATE BRANDING SETTINGS'}
          </Button>
        </div>
      </div>
    </Card>
  );
};

const AiConfigForm = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [geminiApiKey, setGeminiApiKey] = useState('');

  useEffect(() => {
    fetch('/api/admin/settings/ai')
      .then(res => res.json())
      .then(data => {
        if (data.success) setGeminiApiKey(data.data.geminiApiKey || '');
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!geminiApiKey.trim()) return alert('Please enter a valid API Key');
    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ geminiApiKey: geminiApiKey.trim() })
      });
      if (res.ok) alert('AI Configuration updated!');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return null;

  return (
    <Card className="p-8 border-l-[6px] border-l-slate-900 overflow-hidden relative">
      <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
        <ShieldCheck size={120} />
      </div>
      <div className="space-y-6 relative">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-100 text-slate-900 rounded-xl flex items-center justify-center">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">Gemini AI API Key</h3>
            <p className="text-[10px] text-gray-400 dark:text-slate-400 font-bold uppercase tracking-tight">Technical sync & prompt intelligence</p>
          </div>
        </div>
        
        <div className="space-y-2">
           <input 
             type="password" 
             placeholder="AIzaSy..."
             value={geminiApiKey}
             onChange={(e) => setGeminiApiKey(e.target.value)}
             className="w-full px-5 py-4 rounded-xl border border-gray-200 dark:border-slate-700 focus:outline-none focus:ring-4 focus:ring-slate-100 dark:focus:ring-slate-800 focus:border-slate-900 bg-white dark:bg-slate-800 dark:text-white text-sm font-mono tracking-widest"
           />
           <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tight px-1"> This key is used for secure extraction of scanned menu photos.</p>
        </div>

        <Button 
          onClick={handleSave} 
          disabled={saving}
          className="w-full bg-slate-900 hover:bg-black text-white font-black tracking-widest py-4 rounded-xl shadow-lg transition-all active:scale-[0.98]"
        >
          {saving ? 'SAVING KEY...' : 'SYNC AI CONFIG'}
        </Button>
      </div>
    </Card>
  );
};

const TabletSetupCard = () => {
  return (
    <Card className="p-8 border-l-[6px] border-l-pos-primary group hover:shadow-2xl transition-all duration-500">
      <div className="flex items-start gap-6">
        <div className="bg-pos-primary/10 p-5 rounded-[1.5rem] text-pos-primary group-hover:scale-110 transition-transform">
          <Tablet size={32} />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest mb-1">Tablet Ordering System</h3>
          <p className="text-[10px] text-gray-400 dark:text-slate-400 font-bold uppercase tracking-tight leading-relaxed mb-6">
            Configure Waiter and Table modes for your Android/iOS devices. Manage device assignments and real-time tracking.
          </p>
          <Link href="/settings/tablets">
            <Button className="w-full bg-pos-primary hover:bg-pos-primary-dark text-white font-black tracking-widest py-4 rounded-xl shadow-xl shadow-pos-primary/10 flex items-center justify-center gap-2 transition-all active:scale-[0.98]">
              MANAGE DEVICES <ChevronRight size={16} />
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
};

const WebsiteBrandingForm = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<any>({
    hotelName: '',
    logoUrl: '',
    storyTitle: '',
    storyContent: '',
    storyImage1: '',
    storyImage2: '',
    galleryHeroImageUrl: '',
    address: '',
    email: '',
    phone: '',
    facebookUrl: '',
    instagramUrl: '',
    twitterUrl: ''
  });

  useEffect(() => {
    fetch('/api/website/settings')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setSettings(data.data);
        }
        setLoading(false);
      });
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success) setSettings((prev: any) => ({ ...prev, [field]: data.url }));
    } catch (err) {
      alert('Upload failed');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/website/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      if (res.ok) alert('Website settings updated successfully!');
    } catch (error) {
      alert('Failed to save website settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-20 text-center animate-pulse text-pos-primary font-extrabold uppercase tracking-widest">Loading Website Data...</div>;

  return (
    <div className="space-y-8 pb-20">
      {/* Brand Identity Section */}
      <Card className="p-8 border-t-4 border-t-pos-primary shadow-2xl shadow-pos-primary/10">
        <div className="flex items-center gap-4 mb-8 pb-6 border-b border-gray-100">
          <div className="w-12 h-12 bg-pos-primary/10 text-pos-primary rounded-2xl flex items-center justify-center shadow-inner">
            <Globe size={24} className="animate-spin-slow" />
          </div>
          <div>
            <h2 className="text-base font-black text-gray-900 dark:text-white uppercase tracking-widest">Platform Identity</h2>
            <p className="text-[10px] text-gray-400 dark:text-slate-400 font-bold uppercase mt-0.5 tracking-tighter">Your global website name and primary logo</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-6">
            <div>
              <label className="block text-[10px] font-black text-gray-400 dark:text-slate-400 uppercase tracking-widest mb-3">Platform Name (e.g. OrderMint Solutions)</label>
              <input 
                type="text" 
                value={settings.hotelName}
                onChange={(e) => setSettings({ ...settings, hotelName: e.target.value })}
                placeholder="OrderMint Solutions"
                className="w-full px-6 py-5 rounded-2xl border border-gray-200 dark:border-slate-700 focus:outline-none focus:ring-4 focus:ring-pos-primary/10 focus:border-pos-primary bg-gray-50/50 dark:bg-slate-800/50 font-black text-sm dark:text-white uppercase tracking-tight transition-all shadow-sm"
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <div>
                  <label className="block text-[10px] font-black text-gray-400 dark:text-slate-400 uppercase tracking-widest mb-2 text-pos-primary">Support Email</label>
                  <input 
                    type="email" 
                    value={settings.email || ''}
                    onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                    className="w-full px-5 py-3.5 rounded-xl border border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white shadow-sm font-bold text-xs"
                  />
               </div>
               <div>
                  <label className="block text-[10px] font-black text-gray-400 dark:text-slate-400 uppercase tracking-widest mb-2 text-pos-primary">Contact Number</label>
                  <input 
                    type="text" 
                    value={settings.phone || ''}
                    onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                    className="w-full px-5 py-3.5 rounded-xl border border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white shadow-sm font-bold text-xs"
                  />
               </div>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center p-8 bg-slate-50/50 rounded-[3rem] border-2 border-dashed border-gray-200 group relative transition-all hover:border-pos-primary/40">
             <div className="w-48 h-48 mb-6 bg-white dark:bg-slate-800 rounded-[2rem] shadow-2xl shadow-gray-200 dark:shadow-none flex items-center justify-center overflow-hidden border border-gray-100 dark:border-slate-700 relative">
                {settings.logoUrl ? (
                  <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-contain p-6 group-hover:scale-110 transition-transform duration-500" />
                ) : (
                  <ImageIcon className="text-gray-100 dark:text-slate-700" size={64} />
                )}
             </div>
             <input type="file" id="website-logo-upload" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'logoUrl')} />
             <label 
                htmlFor="website-logo-upload" 
                className="px-6 py-3 bg-pos-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer hover:bg-black transition-all shadow-lg active:scale-95"
              >
                Change Platform Logo
             </label>
             <p className="mt-3 text-[9px] text-gray-400 font-bold uppercase tracking-widest">Square PNG / SVG recommended</p>
          </div>
        </div>
      </Card>

      {/* Website Story & Hero Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Story Section */}
        <Card className="p-8 border-l-4 border-l-pos-primary shadow-xl overflow-hidden relative">
           <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-pos-primary/10 rounded-xl text-pos-primary">
                 <MapPin size={20} />
              </div>
              <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">Our Story Section</h3>
           </div>
           
           <div className="space-y-4">
              <div>
                 <label className="block text-[9px] font-black text-gray-400 dark:text-slate-400 uppercase tracking-[0.2em] mb-2">Section Heading</label>
                 <input 
                    type="text" 
                    value={settings.storyTitle || ''}
                    onChange={(e) => setSettings({ ...settings, storyTitle: e.target.value })}
                    className="w-full px-5 py-4 rounded-xl border border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-700 transition-all text-xs font-bold dark:text-white"
                 />
              </div>
              <div>
                 <label className="block text-[9px] font-black text-gray-400 dark:text-slate-400 uppercase tracking-[0.2em] mb-2">Description / Content</label>
                 <textarea 
                    rows={6}
                    value={settings.storyContent || ''}
                    onChange={(e) => setSettings({ ...settings, storyContent: e.target.value })}
                    className="w-full px-5 py-4 rounded-xl border border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-700 transition-all text-xs font-medium leading-relaxed dark:text-slate-300"
                 />
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-2">
                 <div className="space-y-3">
                    <div className="aspect-[4/3] bg-gray-100 rounded-2xl overflow-hidden border border-gray-200">
                       {settings.storyImage1 && <img src={settings.storyImage1} className="w-full h-full object-cover" />}
                    </div>
                    <input type="file" id="story1-upload" className="hidden" onChange={(e) => handleFileUpload(e, 'storyImage1')} />
                    <label htmlFor="story1-upload" className="block text-center py-2 bg-slate-900 text-white rounded-lg text-[9px] font-black uppercase cursor-pointer hover:bg-pos-primary transition-all">Story Image 1</label>
                 </div>
                 <div className="space-y-3">
                    <div className="aspect-[4/3] bg-gray-100 rounded-2xl overflow-hidden border border-gray-200">
                       {settings.storyImage2 && <img src={settings.storyImage2} className="w-full h-full object-cover" />}
                    </div>
                    <input type="file" id="story2-upload" className="hidden" onChange={(e) => handleFileUpload(e, 'storyImage2')} />
                    <label htmlFor="story2-upload" className="block text-center py-2 bg-slate-900 text-white rounded-lg text-[9px] font-black uppercase cursor-pointer hover:bg-pos-primary transition-all">Story Image 2</label>
                 </div>
              </div>
           </div>
        </Card>

        {/* Hero & Socials */}
        <div className="space-y-8">
           {/* Hero Image Section */}
           <Card className="p-8 border-l-4 border-l-orange-500 shadow-xl">
              <div className="flex items-center gap-3 mb-6">
                 <div className="p-2 bg-orange-50 dark:bg-orange-950/30 rounded-xl text-orange-600 dark:text-orange-400">
                    <MonitorPlay size={20} />
                 </div>
                 <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">Main Hero Banner</h3>
              </div>
              
              <div className="space-y-4 text-center">
                 <div className="aspect-video bg-slate-900 rounded-3xl overflow-hidden shadow-2xl relative group">
                    {settings.galleryHeroImageUrl ? (
                       <img src={settings.galleryHeroImageUrl} className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700" />
                    ) : (
                       <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 italic text-[10px]">No Hero Background Set</div>
                    )}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <input type="file" id="hero-upload" className="hidden" onChange={(e) => handleFileUpload(e, 'galleryHeroImageUrl')} />
                        <label htmlFor="hero-upload" className="bg-white text-black px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest cursor-pointer shadow-xl transform scale-90 group-hover:scale-100 transition-transform">Update Banner</label>
                    </div>
                 </div>
                 <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Dimensions: 1920x1080px (Optimal for High Res)</p>
              </div>
           </Card>

           {/* Social Media Links */}
           <Card className="p-8 border-l-4 border-l-emerald-500 shadow-xl">
              <div className="flex items-center gap-3 mb-6">
                 <div className="p-2 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl text-emerald-600 dark:text-emerald-400">
                    <Facebook size={20} />
                 </div>
                 <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">Social Footprint</h3>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                 <div>
                    <label className="flex items-center gap-2 text-[9px] font-black text-pos-primary uppercase mb-2"><Facebook size={12}/> Facebook</label>
                    <input 
                       type="text" 
                       value={settings.facebookUrl || ''}
                       onChange={(e) => setSettings({ ...settings, facebookUrl: e.target.value })}
                       className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-[10px] font-bold dark:text-white"
                       placeholder="https://facebook.com/..."
                    />
                 </div>
                 <div>
                    <label className="flex items-center gap-2 text-[9px] font-black text-pink-500 uppercase mb-2"><Instagram size={12}/> Instagram</label>
                    <input 
                       type="text" 
                       value={settings.instagramUrl || ''}
                       onChange={(e) => setSettings({ ...settings, instagramUrl: e.target.value })}
                       className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-[10px] font-bold dark:text-white"
                       placeholder="https://instagram.com/..."
                    />
                 </div>
                 <div>
                    <label className="flex items-center gap-2 text-[9px] font-black text-blue-400 uppercase mb-2"><Twitter size={12}/> Twitter (X)</label>
                    <input 
                       type="text" 
                       value={settings.twitterUrl || ''}
                       onChange={(e) => setSettings({ ...settings, twitterUrl: e.target.value })}
                       className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-[10px] font-bold dark:text-white"
                       placeholder="https://twitter.com/..."
                    />
                 </div>
              </div>
           </Card>
        </div>
      </div>

      {/* Global Save Button */}
      <div className="sticky bottom-6 z-10 animate-in slide-in-from-bottom-2 duration-500">
        <Button 
          onClick={handleSave} 
          disabled={saving}
          className="w-full bg-pos-primary hover:bg-black text-white font-black tracking-[0.3em] py-6 rounded-[2.5rem] shadow-2xl shadow-pos-primary/20 border-2 border-white flex items-center justify-center gap-4 transition-all active:scale-[0.98]"
        >
          {saving ? (
             <>
                <RefreshCcw className="animate-spin" size={24} />
                <span>UPDATING PLATFORM...</span>
             </>
          ) : (
             <>
                <Save size={24} />
                <span>SAVE WEBSITE CONFIGURATION</span>
             </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'branding' | 'admin' | 'website'>('profile');
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    fetch('/api/auth/session')
      .then(res => res.json())
      .then(data => {
        if (data.authenticated) {
          setSession(data.user);
        }
      })
      .catch(err => console.error('Failed to fetch session', err));
  }, []);

  const tabs = [
    { id: 'profile', label: 'Print Settings', icon: Printer, color: 'text-pos-primary', bg: 'bg-pos-primary/10' },
    { id: 'branding', label: 'Branding', icon: ImageIcon, color: 'text-pos-primary', bg: 'bg-pos-primary/10' },
    { id: 'admin', label: 'Admin', icon: ShieldCheck, color: 'text-slate-900', bg: 'bg-slate-100' },
    ...(session?.role === 'SUPER_ADMIN' ? [{ id: 'website', label: 'Website (OrderMint)', icon: Globe, color: 'text-pos-primary', bg: 'bg-pos-primary/10' }] : []),
  ];

  const isSuperAdmin = session?.role === 'SUPER_ADMIN';

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <PageHeader 
        title="Settings" 
        description="Configure your restaurant profile, logo, and system parameters."
      />

      {/* Modern Tab Navigation */}
      <div className="flex flex-wrap items-center gap-3 bg-gray-100/50 dark:bg-slate-800/50 p-1.5 rounded-[2rem] w-fit border border-gray-200/50 dark:border-slate-700/50 backdrop-blur-sm">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`
                flex items-center gap-3 px-6 py-3.5 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.15em] transition-all duration-300
                ${isActive 
                  ? `${tab.bg} ${tab.color} shadow-lg shadow-white/50 ring-1 ring-white/10` 
                  : 'text-gray-400 hover:text-gray-600 hover:bg-white/50'
                }
              `}
            >
              <Icon size={16} className={isActive ? 'animate-pulse' : ''} />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="max-w-4xl">
        {activeTab === 'profile' && (
          <div className="animate-in slide-in-from-bottom-4 duration-500">
            <BusinessProfileForm />
          </div>
        )}
        
        {activeTab === 'branding' && (
          <div className="animate-in slide-in-from-bottom-4 duration-500">
            <BrandingForm />
          </div>
        )}

        {activeTab === 'admin' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start animate-in slide-in-from-bottom-4 duration-500">
            {isSuperAdmin && <AiConfigForm />}
            <div className={isSuperAdmin ? "" : "md:col-span-2"}>
              <TabletSetupCard />
            </div>
          </div>
        )}

        {activeTab === 'website' && isSuperAdmin && (
           <div className="animate-in slide-in-from-bottom-4 duration-500">
             <WebsiteBrandingForm />
           </div>
        )}
      </div>
    </div>
  );
}
