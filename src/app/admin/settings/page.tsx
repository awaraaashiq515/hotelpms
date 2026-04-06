'use client';

import React, { useState, useEffect } from 'react';
import { Save } from 'lucide-react';

export default function WebsiteSettingsPage() {
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    hotelName: '',
    logoUrl: '',
    address: '',
    email: '',
    phone: '',
    storyTitle: '',
    storyContent: '',
    storyImage1: '',
    storyImage2: '',
    mapIframe: '',
    facebookUrl: '',
    instagramUrl: '',
    twitterUrl: '',
    bookingRedirectToContact: true,
  });

  useEffect(() => {
    fetch('/api/website/settings')
      .then(res => res.json())
      .then(json => {
        if (json.success) {
          const fetchedData = json.data;
          setSettings({
            hotelName: fetchedData.hotelName || '',
            logoUrl: fetchedData.logoUrl || '',
            address: fetchedData.address || '',
            email: fetchedData.email || '',
            phone: fetchedData.phone || '',
            storyTitle: fetchedData.storyTitle || '',
            storyContent: fetchedData.storyContent || '',
            storyImage1: fetchedData.storyImage1 || '',
            storyImage2: fetchedData.storyImage2 || '',
            mapIframe: fetchedData.mapIframe || '',
            facebookUrl: fetchedData.facebookUrl || '',
            instagramUrl: fetchedData.instagramUrl || '',
            twitterUrl: fetchedData.twitterUrl || '',
            bookingRedirectToContact: fetchedData.bookingRedirectToContact ?? true,
          });
        }
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/website/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const json = await res.json();
      if (json.success) {
        alert('Settings updated successfully!');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-24">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Website Settings</h1>
          <p className="text-slate-500">Manage general hotel information and story content.</p>
        </div>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="bg-pos-primary text-white px-8 py-3 rounded-full font-bold uppercase tracking-widest hover:bg-black transition-all flex items-center gap-2"
        >
          <Save size={18} />
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Added Link to SMS Notifications Settings */}
      <div className="bg-rose-50 border border-rose-100 p-6 rounded-3xl flex items-center justify-between">
        <div>
          <h2 className="font-bold text-lg mb-1" style={{color:'#c97878'}}>SMS & WhatsApp Configurations</h2>
          <p className="text-sm" style={{color:'#e8a0a0'}}>Manage API Keys and templates for automated bill printing notifications.</p>
        </div>
        <a href="/admin/settings/notifications" className="text-white px-6 py-2 rounded-full font-bold uppercase tracking-widest text-xs transition-all shadow-sm" style={{backgroundColor:'#e8a0a0'}}>
          Go to Notification Settings →
        </a>
      </div>

      {/* Logo Upload Section */}
      <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
        <h2 className="text-xl font-bold text-slate-900 border-b pb-4 mb-6">Website Logo</h2>
        <div className="flex items-center gap-8">
          <div className="relative w-40 h-40 bg-slate-50 rounded-[32px] border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0">
            {settings.logoUrl ? (
              <img src={settings.logoUrl} alt="Logo Preview" className="w-full h-full object-contain p-4" />
            ) : (
              <div className="text-center p-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-tight">No Logo<br/>Uploaded</p>
              </div>
            )}
            {loading && (
              <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                <div className="w-6 h-6 border-4 border-pos-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>
          <div className="space-y-4">
            <p className="text-sm text-slate-500 max-w-md">
              Upload a high-quality logo for your website. Recommended format is transparent PNG/SVG.
            </p>
            <div className="flex items-center gap-4">
              <input
                type="file"
                id="logo-upload"
                className="hidden"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;

                  const formData = new FormData();
                  formData.append('file', file);

                  setLoading(true);
                  try {
                    const res = await fetch('/api/upload', {
                      method: 'POST',
                      body: formData,
                    });
                    const json = await res.json();
                    if (json.success) {
                      const newSettings = { ...settings, logoUrl: json.url };
                      setSettings(newSettings);
                      
                      // Auto-save the logo to the database
                      await fetch('/api/website/settings', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(newSettings),
                      });

                      alert('Logo uploaded and saved successfully!');
                    }
                  } catch (err) {
                    console.error('Upload failed:', err);
                    alert('Upload failed');
                  } finally {
                    setLoading(false);
                  }
                }}
              />
              <label
                htmlFor="logo-upload"
                className="bg-slate-900 text-white px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest cursor-pointer hover:bg-pos-primary transition-all"
              >
                Upload New Logo
              </label>
              {settings.logoUrl && (
                <button
                  onClick={async () => {
                    const newSettings = { ...settings, logoUrl: '' };
                    setSettings(newSettings);
                    
                    await fetch('/api/website/settings', {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(newSettings),
                    });
                    
                    alert('Logo removed and saved successfully!');
                  }}
                  className="text-red-500 text-xs font-bold uppercase tracking-widest hover:underline"
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* General Info */}
        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 space-y-6">
          <h2 className="text-xl font-bold text-slate-900 border-b pb-4">General Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Hotel Name</label>
              <input
                type="text"
                value={settings.hotelName}
                onChange={e => setSettings({ ...settings, hotelName: e.target.value })}
                className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-pos-primary outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Address</label>
              <textarea
                value={settings.address}
                onChange={e => setSettings({ ...settings, address: e.target.value })}
                className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-pos-primary outline-none transition-all h-24"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Email</label>
                <input
                  type="email"
                  value={settings.email}
                  onChange={e => setSettings({ ...settings, email: e.target.value })}
                  className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-pos-primary outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Phone</label>
                <input
                  type="text"
                  value={settings.phone}
                  onChange={e => setSettings({ ...settings, phone: e.target.value })}
                  className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-pos-primary outline-none transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Story Section */}
        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 space-y-6">
          <h2 className="text-xl font-bold text-slate-900 border-b pb-4">Our Story Section</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Story Title</label>
              <input
                type="text"
                value={settings.storyTitle}
                onChange={e => setSettings({ ...settings, storyTitle: e.target.value })}
                className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-pos-primary outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Story Content</label>
              <textarea
                value={settings.storyContent}
                onChange={e => setSettings({ ...settings, storyContent: e.target.value })}
                className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-pos-primary outline-none transition-all h-48"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Story Image 1 (Large)</label>
                <div className="relative w-full aspect-[4/5] bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden mb-3">
                  {settings.storyImage1 ? (
                    <img src={settings.storyImage1} alt="Story Image 1" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center p-4">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No Image</p>
                    </div>
                  )}
                  {loading && (
                    <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                      <div className="w-6 h-6 border-4 border-pos-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    type="file"
                    id="story-image-1"
                    className="hidden"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const formData = new FormData();
                      formData.append('file', file);
                      setLoading(true);
                      try {
                        const res = await fetch('/api/upload', { method: 'POST', body: formData });
                        const json = await res.json();
                        if (json.success) {
                          const newSettings = { ...settings, storyImage1: json.url };
                          setSettings(newSettings);
                          await fetch('/api/website/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newSettings) });
                        }
                      } catch (err) { console.error(err); } finally { setLoading(false); }
                    }}
                  />
                  <label htmlFor="story-image-1" className="flex-1 text-center bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest cursor-pointer hover:bg-pos-primary transition-all">Upload</label>
                  {settings.storyImage1 && (
                    <button
                      onClick={async () => {
                        const newSettings = { ...settings, storyImage1: '' };
                        setSettings(newSettings);
                        await fetch('/api/website/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newSettings) });
                      }}
                      className="text-red-500 px-4 text-[10px] font-bold uppercase tracking-widest hover:underline"
                    >Remove</button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Story Image 2 (Small)</label>
                <div className="relative w-full aspect-square bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden mb-3">
                  {settings.storyImage2 ? (
                    <img src={settings.storyImage2} alt="Story Image 2" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center p-4">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No Image</p>
                    </div>
                  )}
                  {loading && (
                    <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                      <div className="w-6 h-6 border-4 border-pos-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    type="file"
                    id="story-image-2"
                    className="hidden"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const formData = new FormData();
                      formData.append('file', file);
                      setLoading(true);
                      try {
                        const res = await fetch('/api/upload', { method: 'POST', body: formData });
                        const json = await res.json();
                        if (json.success) {
                          const newSettings = { ...settings, storyImage2: json.url };
                          setSettings(newSettings);
                          await fetch('/api/website/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newSettings) });
                        }
                      } catch (err) { console.error(err); } finally { setLoading(false); }
                    }}
                  />
                  <label htmlFor="story-image-2" className="flex-1 text-center bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest cursor-pointer hover:bg-pos-primary transition-all">Upload</label>
                  {settings.storyImage2 && (
                    <button
                      onClick={async () => {
                        const newSettings = { ...settings, storyImage2: '' };
                        setSettings(newSettings);
                        await fetch('/api/website/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newSettings) });
                      }}
                      className="text-red-500 px-4 text-[10px] font-bold uppercase tracking-widest hover:underline"
                    >Remove</button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Map & Social */}
        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 space-y-6 lg:col-span-2">
          <h2 className="text-xl font-bold text-slate-900 border-b pb-4">Map & Social Media</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Google Map Iframe URL</label>
              <textarea
                value={settings.mapIframe}
                onChange={e => setSettings({ ...settings, mapIframe: e.target.value })}
                className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-pos-primary outline-none transition-all h-20"
                placeholder="https://www.google.com/maps/embed?..."
              />
            </div>
            <div className="space-y-4">
               <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Instagram URL</label>
                <input
                  type="text"
                  value={settings.instagramUrl || ''}
                  onChange={e => setSettings({ ...settings, instagramUrl: e.target.value })}
                  className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-pos-primary outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Facebook URL</label>
                <input
                  type="text"
                  value={settings.facebookUrl || ''}
                  onChange={e => setSettings({ ...settings, facebookUrl: e.target.value })}
                  className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-pos-primary outline-none transition-all"
                />
              </div>
            </div>
          </div>

      </div>


        {/* Booking Redirect Setting */}
        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-slate-900">Booking Behavior</h2>
              <p className="text-sm text-slate-500 font-medium">Configure where the "Book Now" button takes your guests.</p>
            </div>
            <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-3xl">
              <div className="flex flex-col items-end mr-4">
                <span className={`text-[10px] font-bold uppercase tracking-widest ${settings.bookingRedirectToContact ? 'text-pos-primary' : 'text-slate-400'}`}>
                  {settings.bookingRedirectToContact ? 'Redirect to Contact' : 'Booking System'}
                </span>
                <span className="text-[8px] text-slate-400 uppercase font-medium">Current Setting</span>
              </div>
              <button 
                onClick={() => setSettings({ ...settings, bookingRedirectToContact: !settings.bookingRedirectToContact })}
                className={`relative w-16 h-8 rounded-full transition-all duration-300 ${settings.bookingRedirectToContact ? 'bg-pos-primary' : 'bg-slate-300'}`}
              >
                <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform duration-300 ${settings.bookingRedirectToContact ? 'translate-x-8' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className={`p-6 rounded-[30px] border-2 transition-all ${settings.bookingRedirectToContact ? 'border-pos-primary bg-pos-primary/5' : 'border-slate-50 bg-slate-50 opacity-40'}`}>
              <h4 className="text-xs font-bold uppercase tracking-widest mb-2">Option A: Simple Redirect (ON)</h4>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">Guests will be taken to your Contact Page to make inquiries. Best for personalized service.</p>
            </div>
            <div className={`p-6 rounded-[30px] border-2 transition-all ${!settings.bookingRedirectToContact ? 'border-pos-primary bg-pos-primary/5' : 'border-slate-50 bg-slate-50 opacity-40'}`}>
              <h4 className="text-xs font-bold uppercase tracking-widest mb-2">Option B: Booking System (OFF)</h4>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">Directs guests to the internal booking engine. Best for automated reservations.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
