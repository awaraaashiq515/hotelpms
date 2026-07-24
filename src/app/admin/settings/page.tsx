'use client';

import React, { useState, useEffect } from 'react';
import { Save, Shield } from 'lucide-react';
import { TwoFactorSection } from '@/components/settings/TwoFactorSection';

export default function WebsiteSettingsPage() {
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    hotelName: '',
    tagline: '',
    logoUrl: '',
    logoScrolledUrl: '',
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
    smtpHost: '',
    smtpPort: '',
    smtpEmail: '',
    smtpPassword: '',
    contactReceiverEmail: '',
    windowsComingSoon: false,
    macComingSoon: false,
    androidComingSoon: false,
    geminiApiKey: '',
    openAiApiKey: '',
    maintenanceMode: false,
    hotelEnabled: false,
  });

  useEffect(() => {
    fetch('/api/website/settings')
      .then(res => res.json())
      .then(json => {
        if (json.success) {
          const fetchedData = json.data;
          setSettings({
            hotelName: fetchedData.hotelName || '',
            tagline: fetchedData.tagline || '',
            logoUrl: fetchedData.logoUrl || '',
            logoScrolledUrl: fetchedData.logoScrolledUrl || '',
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
            smtpHost: fetchedData.smtpHost || '',
            smtpPort: fetchedData.smtpPort || '',
            smtpEmail: fetchedData.smtpEmail || '',
            smtpPassword: fetchedData.smtpPassword || '',
            contactReceiverEmail: fetchedData.contactReceiverEmail || '',
            windowsComingSoon: fetchedData.windowsComingSoon ?? false,
            macComingSoon: fetchedData.macComingSoon ?? false,
            androidComingSoon: fetchedData.androidComingSoon ?? false,
            geminiApiKey: fetchedData.geminiApiKey || '',
            openAiApiKey: fetchedData.openAiApiKey || '',
            maintenanceMode: fetchedData.maintenanceMode ?? false,
            hotelEnabled: fetchedData.hotelEnabled ?? false,
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
        setSettings(json.data);
        alert('Settings updated successfully!');
      } else {
        alert('Failed to update settings: ' + (json.message || 'Unknown error'));
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
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Website Settings</h1>
          <p className="text-slate-500 dark:text-slate-400">Manage your website logo, booking behavior, and email delivery settings.</p>
        </div>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="bg-pos-primary text-white px-8 py-3 rounded-full font-bold text-sm hover:bg-black transition-all flex items-center gap-2"
        >
          <Save size={18} />
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Links to SMS & Payments Settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 p-6 rounded-3xl flex flex-col justify-between transition-colors min-h-[160px]">
          <div>
            <h2 className="font-bold text-lg mb-1 text-pos-primary dark:text-pos-primary-light">SMS & WhatsApp Configurations</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Manage API Keys and templates for automated bill printing notifications.</p>
          </div>
          <div className="mt-4 flex justify-end">
            <a href="/admin/settings/notifications" className="text-white px-6 py-2.5 rounded-full font-bold text-xs transition-all shadow-md shadow-pos-primary/20 bg-pos-primary hover:bg-pos-primary-dark">
              Go to Notification Settings →
            </a>
          </div>
        </div>

        <div className="bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 p-6 rounded-3xl flex flex-col justify-between transition-colors min-h-[160px]">
          <div>
            <h2 className="font-bold text-lg mb-1 text-indigo-600 dark:text-indigo-400">Subscription Billing Settings</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Configure global target UPI IDs, merchant details, and bank transfer credentials for new client payments.</p>
          </div>
          <div className="mt-4 flex justify-end">
            <a href="/admin/settings/billing" className="text-white px-6 py-2.5 rounded-full font-bold text-xs transition-all shadow-md shadow-indigo-600/20 bg-indigo-600 hover:bg-indigo-700">
              Configure Payments Gateways →
            </a>
          </div>
        </div>

        <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/30 p-6 rounded-3xl flex flex-col justify-between transition-colors min-h-[160px]">
          <div>
            <h2 className="font-bold text-lg mb-1 text-purple-600 dark:text-purple-400">YouTube Music Setup</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Configure custom YouTube API search keys for each property/venue instance.</p>
          </div>
          <div className="mt-4 flex justify-end">
            <a href="/admin/settings/youtube" className="text-white px-6 py-2.5 rounded-full font-bold text-xs transition-all shadow-md shadow-purple-600/20 bg-purple-600 hover:bg-purple-700">
              Configure YouTube Keys →
            </a>
          </div>
        </div>

        <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 p-6 rounded-3xl flex flex-col justify-between transition-colors min-h-[160px]">
          <div>
            <h2 className="font-bold text-lg mb-1 text-emerald-600 dark:text-emerald-400">Spotify Integration</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Configure Spotify Client ID, Client Secret, and redirect URIs for the DJ Music Player.</p>
          </div>
          <div className="mt-4 flex justify-end">
            <a href="/admin/settings/spotify" className="text-white px-6 py-2.5 rounded-full font-bold text-xs transition-all shadow-md shadow-emerald-600/20 bg-emerald-600 hover:bg-emerald-700">
              Configure Spotify →
            </a>
          </div>
        </div>
      </div>

      {/* General Settings Section */}
      <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] shadow-sm border border-slate-100 dark:border-slate-800">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white border-b dark:border-slate-800 pb-4 mb-6">General Information</h2>
        
        {/* Maintenance Mode Configuration */}
        <div className="bg-orange-500/10 border border-orange-500/20 p-6 rounded-3xl flex items-center justify-between mb-6">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-orange-600 dark:text-orange-400 uppercase tracking-tight flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-orange-500 rounded-full animate-pulse" />
              Website Maintenance Mode
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Activate this to show a friendly "Under Construction" page to all visitors while you update the website.
            </p>
          </div>
          <button 
            type="button"
            onClick={() => setSettings({ ...settings, maintenanceMode: !settings.maintenanceMode })}
            className={`relative w-16 h-8 rounded-full transition-all duration-300 ${settings.maintenanceMode ? 'bg-orange-500' : 'bg-slate-300 dark:bg-slate-700'}`}
          >
            <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform duration-300 ${settings.maintenanceMode ? 'translate-x-8' : 'translate-x-0'}`} />
          </button>
        </div>

        {/* Hotel Features Configuration */}
        <div className="bg-indigo-500/10 border border-indigo-500/20 p-6 rounded-3xl flex items-center justify-between mb-8">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-tight flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${settings.hotelEnabled ? 'bg-indigo-500 animate-pulse' : 'bg-slate-400'}`} />
              Hotel & Guest House Features
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Enable hotel bookings, room calendars, front-desk modules, receptionist access, and hotel administration across the platform.
            </p>
          </div>
          <button 
            type="button"
            onClick={() => setSettings({ ...settings, hotelEnabled: !settings.hotelEnabled })}
            className={`relative w-16 h-8 rounded-full transition-all duration-300 ${settings.hotelEnabled ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'}`}
          >
            <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform duration-300 ${settings.hotelEnabled ? 'translate-x-8' : 'translate-x-0'}`} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-widest">Site Title</label>
            <input
              type="text"
              value={settings.hotelName}
              onChange={e => setSettings({ ...settings, hotelName: e.target.value })}
              placeholder="Enter Site Title"
              className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none focus:ring-2 focus:ring-pos-primary outline-none transition-all dark:text-white font-medium"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-widest">Site Tagline</label>
            <input
              type="text"
              value={settings.tagline}
              onChange={e => setSettings({ ...settings, tagline: e.target.value })}
              placeholder="Enter Site Tagline"
              className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none focus:ring-2 focus:ring-pos-primary outline-none transition-all dark:text-white font-medium"
            />
          </div>
        </div>

        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 uppercase tracking-widest text-xs">AI & API Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-widest">OpenAI API Key</label>
            <input
              type="password"
              value={settings.openAiApiKey}
              onChange={e => setSettings({ ...settings, openAiApiKey: e.target.value })}
              placeholder="sk-proj-..."
              className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none focus:ring-2 focus:ring-pos-primary outline-none transition-all dark:text-white font-medium"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-widest">Gemini API Key</label>
            <input
              type="password"
              value={settings.geminiApiKey}
              onChange={e => setSettings({ ...settings, geminiApiKey: e.target.value })}
              placeholder="AIzaSy..."
              className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none focus:ring-2 focus:ring-pos-primary outline-none transition-all dark:text-white font-medium"
            />
          </div>
        </div>

        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 uppercase tracking-widest text-xs">Website Logos</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
           {/* Logo 1: Primary Logo (Dark Background) */}
           <div className="flex items-center gap-6 p-6 bg-slate-900/40 rounded-3xl border border-white/5 shadow-inner">
             <div className="relative w-36 h-36 bg-slate-950 rounded-2xl border border-white/10 flex items-center justify-center overflow-hidden flex-shrink-0 relative group">
               {settings.logoUrl ? (
                 <img 
                   src={`${settings.logoUrl}?t=${Date.now()}`} 
                   alt="Primary Logo Preview" 
                   className="w-full h-full object-contain p-3" 
                   onError={(e) => {
                     (e.target as HTMLImageElement).src = 'https://placehold.co/400x400/f8fafc/64748b?text=Broken+Image';
                   }}
                 />
               ) : (
                 <div className="text-center p-4">
                   <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-widest leading-tight">No Logo<br/>Uploaded</p>
                 </div>
               )}
               {loading && (
                 <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                   <div className="w-6 h-6 border-4 border-pos-primary border-t-transparent rounded-full animate-spin"></div>
                 </div>
               )}
             </div>
             
             <div className="space-y-3 flex-1">
               <h4 className="text-xs font-bold text-slate-250 uppercase tracking-wider">Primary Logo (Dark Background)</h4>
               <p className="text-[11px] text-slate-400">Used at the top of the homepage on dark transparent sections.</p>
               <div className="flex items-center gap-3">
                 <input
                   type="file"
                   id="logo-upload-primary"
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
                       if (!res.ok) throw new Error(json.error || 'Upload failed');
                       if (json.success) {
                         const newSettings = { ...settings, logoUrl: json.url };
                         setSettings(newSettings);
                         const saveRes = await fetch('/api/website/settings', {
                           method: 'PUT',
                           headers: { 'Content-Type': 'application/json' },
                           body: JSON.stringify(newSettings),
                         });
                         if (saveRes.ok) alert('Logo uploaded successfully!');
                       }
                     } catch (err: any) {
                       alert(`Error: ${err.message}`);
                     } finally {
                       setLoading(false);
                       e.target.value = '';
                     }
                   }}
                 />
                 <label
                   htmlFor="logo-upload-primary"
                   className="bg-pos-primary text-white px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest cursor-pointer hover:bg-slate-850 transition-all shadow-md"
                 >
                   Upload
                 </label>
                 {settings.logoUrl && (
                   <button
                     onClick={async () => {
                       if (!confirm('Are you sure you want to remove this logo?')) return;
                       const newSettings = { ...settings, logoUrl: '' };
                       setSettings(newSettings);
                       await fetch('/api/website/settings', {
                         method: 'PUT',
                         headers: { 'Content-Type': 'application/json' },
                         body: JSON.stringify(newSettings),
                       });
                     }}
                     className="text-red-500 text-[9px] font-black uppercase tracking-widest hover:underline"
                   >
                     Remove
                   </button>
                 )}
               </div>
             </div>
           </div>

           {/* Logo 2: Scrolled Logo (Light Background) */}
           <div className="flex items-center gap-6 p-6 bg-slate-50 dark:bg-slate-800/20 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-inner">
             <div className="relative w-36 h-36 bg-white rounded-2xl border border-gray-200 dark:border-slate-700 flex items-center justify-center overflow-hidden flex-shrink-0 relative group">
               {settings.logoScrolledUrl ? (
                 <img 
                   src={`${settings.logoScrolledUrl}?t=${Date.now()}`} 
                   alt="Scrolled Logo Preview" 
                   className="w-full h-full object-contain p-3" 
                   onError={(e) => {
                     (e.target as HTMLImageElement).src = 'https://placehold.co/400x400/f8fafc/64748b?text=Broken+Image';
                   }}
                 />
               ) : (
                 <div className="text-center p-4">
                   <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-widest leading-tight">No Logo<br/>Uploaded</p>
                 </div>
               )}
               {loading && (
                 <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                   <div className="w-6 h-6 border-4 border-pos-primary border-t-transparent rounded-full animate-spin"></div>
                 </div>
               )}
             </div>
             
             <div className="space-y-3 flex-1">
               <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Scrolled Logo (Light Background)</h4>
               <p className="text-[11px] text-gray-500 dark:text-slate-400">Used when scrolling down and on simple light themed pages.</p>
               <div className="flex items-center gap-3">
                 <input
                   type="file"
                   id="logo-upload-scrolled"
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
                       if (!res.ok) throw new Error(json.error || 'Upload failed');
                       if (json.success) {
                         const newSettings = { ...settings, logoScrolledUrl: json.url };
                         setSettings(newSettings);
                         const saveRes = await fetch('/api/website/settings', {
                           method: 'PUT',
                           headers: { 'Content-Type': 'application/json' },
                           body: JSON.stringify(newSettings),
                         });
                         if (saveRes.ok) alert('Scrolled logo uploaded successfully!');
                       }
                     } catch (err: any) {
                       alert(`Error: ${err.message}`);
                     } finally {
                       setLoading(false);
                       e.target.value = '';
                     }
                   }}
                 />
                 <label
                   htmlFor="logo-upload-scrolled"
                   className="bg-slate-900 text-white px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest cursor-pointer hover:bg-pos-primary transition-all shadow-md"
                 >
                   Upload
                 </label>
                 {settings.logoScrolledUrl && (
                   <button
                     onClick={async () => {
                       if (!confirm('Are you sure you want to remove this logo?')) return;
                       const newSettings = { ...settings, logoScrolledUrl: '' };
                       setSettings(newSettings);
                       await fetch('/api/website/settings', {
                         method: 'PUT',
                         headers: { 'Content-Type': 'application/json' },
                         body: JSON.stringify(newSettings),
                       });
                     }}
                     className="text-red-500 text-[9px] font-black uppercase tracking-widest hover:underline"
                   >
                     Remove
                   </button>
                 )}
               </div>
             </div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">


        {/* Download Availability Setting */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] shadow-sm border border-slate-100 dark:border-slate-800 lg:col-span-2">
          <div className="space-y-1 mb-8">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Download Availability</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Manually mark download options as "Coming Soon".</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 p-6 rounded-[30px]">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-tight">Android App</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                  {settings.androidComingSoon ? 'Coming Soon Mode' : 'Available for Download'}
                </p>
              </div>
              <button 
                type="button"
                onClick={() => setSettings({ ...settings, androidComingSoon: !settings.androidComingSoon })}
                className={`relative w-14 h-7 rounded-full transition-all duration-300 ${settings.androidComingSoon ? 'bg-orange-500' : 'bg-slate-300 dark:bg-slate-700'}`}
              >
                <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform duration-300 ${settings.androidComingSoon ? 'translate-x-7' : 'translate-x-0'}`} />
              </button>
            </div>

            <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 p-6 rounded-[30px]">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-tight">Windows App</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                  {settings.windowsComingSoon ? 'Coming Soon Mode' : 'Available for Download'}
                </p>
              </div>
              <button 
                type="button"
                onClick={() => setSettings({ ...settings, windowsComingSoon: !settings.windowsComingSoon })}
                className={`relative w-14 h-7 rounded-full transition-all duration-300 ${settings.windowsComingSoon ? 'bg-orange-500' : 'bg-slate-300 dark:bg-slate-700'}`}
              >
                <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform duration-300 ${settings.windowsComingSoon ? 'translate-x-7' : 'translate-x-0'}`} />
              </button>
            </div>

            <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 p-6 rounded-[30px]">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-tight">macOS App</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                  {settings.macComingSoon ? 'Coming Soon Mode' : 'Available for Download'}
                </p>
              </div>
              <button 
                type="button"
                onClick={() => setSettings({ ...settings, macComingSoon: !settings.macComingSoon })}
                className={`relative w-14 h-7 rounded-full transition-all duration-300 ${settings.macComingSoon ? 'bg-orange-500' : 'bg-slate-300 dark:bg-slate-700'}`}
              >
                <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform duration-300 ${settings.macComingSoon ? 'translate-x-7' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Booking Redirect Setting */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] shadow-sm border border-slate-100 dark:border-slate-800 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Booking Behavior</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Configure where the "Book Now" button takes your guests.</p>
            </div>
            <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800 p-4 rounded-3xl">
              <div className="flex flex-col items-end mr-4">
                <span className={`text-[10px] font-bold tracking-widest ${settings.bookingRedirectToContact ? 'text-pos-primary' : 'text-slate-400 dark:text-slate-500'}`}>
                  {settings.bookingRedirectToContact ? 'Redirect to Contact' : 'Booking System'}
                </span>
                <span className="text-[8px] text-slate-400 dark:text-slate-500 font-medium">Current Setting</span>
              </div>
              <button 
                onClick={() => setSettings({ ...settings, bookingRedirectToContact: !settings.bookingRedirectToContact })}
                className={`relative w-16 h-8 rounded-full transition-all duration-300 ${settings.bookingRedirectToContact ? 'bg-pos-primary' : 'bg-slate-300 dark:bg-slate-700'}`}
              >
                <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform duration-300 ${settings.bookingRedirectToContact ? 'translate-x-8' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className={`p-6 rounded-[30px] border-2 transition-all ${settings.bookingRedirectToContact ? 'border-pos-primary bg-pos-primary/5' : 'border-slate-50 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 opacity-40'}`}>
              <h4 className="text-xs font-bold tracking-widest mb-2 dark:text-slate-300">Option A: Simple Redirect (ON)</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">Guests will be taken to your Contact Page to make inquiries. Best for personalized service.</p>
            </div>
            <div className={`p-6 rounded-[30px] border-2 transition-all ${!settings.bookingRedirectToContact ? 'border-pos-primary bg-pos-primary/5' : 'border-slate-50 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 opacity-40'}`}>
              <h4 className="text-xs font-bold tracking-widest mb-2 dark:text-slate-300">Option B: Booking System (OFF)</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">Directs guests to the internal booking engine. Best for automated reservations.</p>
            </div>
          </div>
        </div>

        {/* Email / SMTP Configuration */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] shadow-sm border border-slate-100 dark:border-slate-800 lg:col-span-2">
          <div className="flex items-center justify-between border-b dark:border-slate-800 pb-4 mb-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Email Delivery (SMTP) Settings</h2>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Configure your Hostinger or custom email settings here so the contact form can send emails directly to your inbox.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">SMTP Host</label>
              <input
                type="text"
                value={settings.smtpHost}
                onChange={e => setSettings({ ...settings, smtpHost: e.target.value })}
                placeholder="e.g. smtp.hostinger.com"
                className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none focus:ring-2 focus:ring-pos-primary outline-none transition-all dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">SMTP Port</label>
              <input
                type="text"
                value={settings.smtpPort}
                onChange={e => setSettings({ ...settings, smtpPort: e.target.value })}
                placeholder="e.g. 465"
                className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none focus:ring-2 focus:ring-pos-primary outline-none transition-all dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">SMTP Email (Username)</label>
              <input
                type="email"
                value={settings.smtpEmail}
                onChange={e => setSettings({ ...settings, smtpEmail: e.target.value })}
                placeholder="info@yourdomain.com"
                className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none focus:ring-2 focus:ring-pos-primary outline-none transition-all dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">SMTP Password</label>
              <input
                type="password"
                value={settings.smtpPassword}
                onChange={e => setSettings({ ...settings, smtpPassword: e.target.value })}
                placeholder="••••••••••••"
                className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none focus:ring-2 focus:ring-pos-primary outline-none transition-all dark:text-white"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">Receiver Email (Where you want messages sent)</label>
              <input
                type="email"
                value={settings.contactReceiverEmail}
                onChange={e => setSettings({ ...settings, contactReceiverEmail: e.target.value })}
                placeholder="Optional. Leaves blank to send to SMTP Email."
                className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none focus:ring-2 focus:ring-pos-primary outline-none transition-all dark:text-white"
              />
            </div>
          </div>
        </div>
        {/* Security / 2FA Settings */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
              <Shield size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Account Security</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Protect your super admin account with an extra layer of safety.</p>
            </div>
          </div>
          <TwoFactorSection />
        </div>
      </div>
    </div>
  );
}
