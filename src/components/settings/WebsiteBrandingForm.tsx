'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Globe, MapPin, MonitorPlay, Facebook, Instagram, Twitter, RefreshCcw, Save } from 'lucide-react';

export const WebsiteBrandingForm = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<any>({
    hotelName: '',
    logoUrl: '',
    logoScrolledUrl: '',
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
      <Card className="p-5 lg:p-8 border-t-4 border-t-pos-primary shadow-2xl shadow-pos-primary/10">
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
          <div className="space-y-6 md:col-span-2">
            <div>
              <label className="block text-[10px] font-black text-gray-400 dark:text-slate-400 uppercase tracking-widest mb-3">Platform Name (e.g. GuestFlow Solutions)</label>
              <input 
                type="text" 
                value={settings.hotelName}
                onChange={(e) => setSettings({ ...settings, hotelName: e.target.value })}
                placeholder="GuestFlow Solutions"
                className="w-full px-6 py-5 rounded-2xl border border-gray-200 dark:border-slate-700 focus:outline-none focus:ring-4 focus:ring-pos-primary/10 focus:border-pos-primary bg-gray-50/50 dark:bg-slate-800/50 font-black text-sm dark:text-white uppercase tracking-tight transition-all shadow-sm"
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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

          {/* ── TWO-LOGO SECTION ── */}
          <div className="md:col-span-2 border-t border-gray-100 dark:border-slate-800 pt-8 space-y-6">
            <div>
              <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest">Website Logos</h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter mt-1">Configure both logos for transparent & scrolled light headers</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Logo 1: Main Logo (For Dark Background) */}
              <div className="flex flex-col gap-4 p-6 bg-slate-900/40 rounded-3xl border border-white/5 shadow-inner">
                <div>
                  <h4 className="text-[11px] font-black uppercase text-gray-200 tracking-wider">Primary Logo (Dark Background)</h4>
                  <p className="text-[9px] text-slate-400 font-medium leading-relaxed mt-0.5">Used at the top of the homepage on dark transparent sections.</p>
                </div>
                <div className="flex items-center gap-6">
                  {/* Preview */}
                  <div className="w-36 h-36 bg-slate-950 rounded-2xl border border-white/10 flex items-center justify-center overflow-hidden shadow-2xl flex-shrink-0 relative group">
                    {settings.logoUrl ? (
                      <img 
                        src={settings.logoUrl} 
                        alt="Primary Logo Preview"
                        className="w-full h-full object-contain p-3 transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-pos-primary rounded-2xl flex items-center justify-center">
                        <span className="text-white font-black text-xl italic">O</span>
                      </div>
                    )}
                  </div>
                  {/* Upload Controls */}
                  <div className="flex-1 space-y-2">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">transparent PNG/SVG recommended</p>
                    <div className="flex flex-wrap items-center gap-3">
                      <label className="cursor-pointer px-4 py-2 bg-pos-primary text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-slate-850 transition-all shadow-md">
                        Upload Logo
                        <input type="file" className="hidden" accept="image/*,image/svg+xml" onChange={(e) => handleFileUpload(e, 'logoUrl')} />
                      </label>
                      {settings.logoUrl && (
                        <button
                          type="button"
                          onClick={() => setSettings({ ...settings, logoUrl: '' })}
                          className="text-[9px] font-black uppercase text-red-500 hover:text-red-700 tracking-widest transition-colors"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Logo 2: Scrolled Logo (For Light Background) */}
              <div className="flex flex-col gap-4 p-6 bg-slate-50 dark:bg-slate-800/20 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-inner">
                <div>
                  <h4 className="text-[11px] font-black uppercase text-gray-800 dark:text-gray-200 tracking-wider">Scrolled Logo (Light Background)</h4>
                  <p className="text-[9px] text-gray-500 dark:text-slate-400 font-medium leading-relaxed mt-0.5">Used when scrolling down and on simple light themed pages.</p>
                </div>
                <div className="flex items-center gap-6">
                  {/* Preview */}
                  <div className="w-36 h-36 bg-white rounded-2xl border border-gray-200 dark:border-slate-700 flex items-center justify-center overflow-hidden shadow-2xl flex-shrink-0 relative group">
                    {settings.logoScrolledUrl ? (
                      <img 
                        src={settings.logoScrolledUrl} 
                        alt="Scrolled Logo Preview"
                        className="w-full h-full object-contain p-3 transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center">
                        <span className="text-white font-black text-xl italic">O</span>
                      </div>
                    )}
                  </div>
                  {/* Upload Controls */}
                  <div className="flex-1 space-y-2">
                    <p className="text-[10px] text-gray-500 dark:text-slate-400 font-bold uppercase tracking-widest">transparent PNG/SVG recommended</p>
                    <div className="flex flex-wrap items-center gap-3">
                      <label className="cursor-pointer px-4 py-2 bg-slate-900 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-pos-primary transition-all shadow-md">
                        Upload Logo
                        <input type="file" className="hidden" accept="image/*,image/svg+xml" onChange={(e) => handleFileUpload(e, 'logoScrolledUrl')} />
                      </label>
                      {settings.logoScrolledUrl && (
                        <button
                          type="button"
                          onClick={() => setSettings({ ...settings, logoScrolledUrl: '' })}
                          className="text-[9px] font-black uppercase text-red-500 hover:text-red-700 tracking-widest transition-colors"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
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
