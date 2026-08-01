'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Music, Mail, Lock, User, Phone, Sparkles, Loader2 } from 'lucide-react';
import { toast, Toaster } from 'sonner';

export default function SingerRegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    genre: '',
    bio: '',
    photoUrl: ''
  });

  useEffect(() => {
    if (localStorage.getItem('singer_token')) {
      router.replace('/singer-portal/dashboard');
    }
  }, [router]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      toast.error('Name, email and password are required fields.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/singer/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();

      if (data.success) {
        localStorage.setItem('singer_token', data.token);
        localStorage.setItem('singer_info', JSON.stringify(data.singer));
        toast.success('Registration successful! Redirecting to console...');
        setTimeout(() => {
          router.replace('/singer-portal/dashboard');
        }, 1500);
      } else {
        toast.error(data.message || 'Registration failed.');
      }
    } catch (err) {
      toast.error('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050a14] relative overflow-hidden flex flex-col items-center justify-center p-4 py-12">
      <Toaster richColors position="top-center" />

      {/* Glow shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] bg-indigo-700/8 rounded-full blur-[120px]" />
        <div className="absolute bottom-[10%] right-[10%] w-[400px] h-[400px] bg-violet-700/6 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-lg bg-[#090f1e]/80 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-md">
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 flex items-center justify-center shadow-lg shadow-indigo-600/30 mb-3">
            <Music className="text-white" size={24} />
          </div>
          <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Artist Space</span>
          <h1 className="text-xl font-black text-white mt-1">Create Performer Profile</h1>
          <p className="text-xs text-slate-500 mt-1">Register to start managing sessions and song requests</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[9px] font-black uppercase tracking-wider text-slate-400 mb-1">Full Name *</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={13} />
                <input 
                  type="text" required
                  placeholder="John Doe"
                  className="w-full bg-[#050a14] border border-slate-850 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 placeholder-slate-650"
                  value={form.name}
                  onChange={e => setForm({...form, name: e.target.value})}
                />
              </div>
            </div>
            <div>
              <label className="block text-[9px] font-black uppercase tracking-wider text-slate-400 mb-1">Email Address *</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={13} />
                <input 
                  type="email" required
                  placeholder="john@example.com"
                  className="w-full bg-[#050a14] border border-slate-850 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 placeholder-slate-650"
                  value={form.email}
                  onChange={e => setForm({...form, email: e.target.value})}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[9px] font-black uppercase tracking-wider text-slate-400 mb-1">Password *</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={13} />
                <input 
                  type="password" required
                  placeholder="••••••••"
                  className="w-full bg-[#050a14] border border-slate-850 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 placeholder-slate-650"
                  value={form.password}
                  onChange={e => setForm({...form, password: e.target.value})}
                />
              </div>
            </div>
            <div>
              <label className="block text-[9px] font-black uppercase tracking-wider text-slate-400 mb-1">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={13} />
                <input 
                  type="text"
                  placeholder="+91..."
                  className="w-full bg-[#050a14] border border-slate-850 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 placeholder-slate-650"
                  value={form.phone}
                  onChange={e => setForm({...form, phone: e.target.value})}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[9px] font-black uppercase tracking-wider text-slate-400 mb-1">Musical Genre</label>
              <input 
                type="text"
                placeholder="e.g. Sufi, Pop, Bollywood"
                className="w-full bg-[#050a14] border border-slate-850 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 placeholder-slate-650"
                value={form.genre}
                onChange={e => setForm({...form, genre: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-[9px] font-black uppercase tracking-wider text-slate-400 mb-1">Photo URL</label>
              <input 
                type="url"
                placeholder="https://images.unsplash.com/..."
                className="w-full bg-[#050a14] border border-slate-850 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 placeholder-slate-650"
                value={form.photoUrl}
                onChange={e => setForm({...form, photoUrl: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label className="block text-[9px] font-black uppercase tracking-wider text-slate-400 mb-1">Brief Bio</label>
            <textarea 
              rows={3}
              placeholder="Tell our guests about your style..."
              className="w-full bg-[#050a14] border border-slate-850 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 placeholder-slate-650"
              value={form.bio}
              onChange={e => setForm({...form, bio: e.target.value})}
            />
          </div>

          <button 
            type="submit" disabled={loading}
            className="w-full mt-2 bg-gradient-to-r from-indigo-600 to-violet-700 hover:from-indigo-500 hover:to-violet-600 text-xs font-black text-white py-2.5 rounded-xl shadow-lg active:scale-98 transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={14} /> Saving Performer Profile...
              </>
            ) : (
              'Register & Log In'
            )}
          </button>
        </form>

        <div className="border-t border-slate-850/80 pt-4 mt-6 text-center text-xs text-slate-500">
          Already registered?{' '}
          <Link href="/singer-portal/login" className="text-indigo-400 hover:text-indigo-300 font-bold transition-colors">
            Log In here
          </Link>
        </div>
      </div>
    </div>
  );
}
