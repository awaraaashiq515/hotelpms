'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Hotel, Phone, Lock, Eye, EyeOff, LogIn, Loader2, Sparkles, User } from 'lucide-react';
import { toast, Toaster } from 'sonner';

export default function GuestPortalLogin() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !password) {
      toast.error('Please enter your name and password.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/guest-portal/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), password: password.trim() }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(`Welcome back, ${data.guest.firstName}!`);
        localStorage.setItem('guest_token', data.token);
        router.push('/guest-portal/dashboard');
      } else {
        toast.error(data.message || 'Login failed. Check your credentials.');
      }
    } catch {
      toast.error('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Toaster richColors position="top-center" />
      <div className="min-h-screen bg-[#050a14] flex items-center justify-center p-4 relative overflow-hidden">
        {/* Ambient Glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-20%] left-[30%] w-[600px] h-[600px] bg-indigo-700/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[20%] w-[400px] h-[400px] bg-violet-700/10 rounded-full blur-[100px]" />
        </div>

        <div className="relative w-full max-w-md">
          {/* Logo / Brand */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 shadow-2xl shadow-indigo-600/30 mb-4">
              <Hotel size={32} className="text-white" />
            </div>
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <Sparkles size={12} className="text-indigo-400" />
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Guest Self-Service</span>
            </div>
            <h1 className="text-3xl font-black text-white">Guest Portal</h1>
            <p className="text-slate-400 text-sm mt-1.5">Access your booking, billing & stay details</p>
          </div>

          {/* Login Card */}
          <div className="bg-[#0f172a]/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-8 shadow-2xl">
            <form onSubmit={handleLogin} className="space-y-5">
              {/* Phone */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                  Your Name, Email or Mobile Number
                </label>
                <div className="relative">
                  <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    id="guest-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. sabu@gmail.com or 8580881625"
                    required
                    className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-slate-700 bg-slate-900/70 text-slate-100 text-sm focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-600"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    id="guest-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    className="w-full pl-11 pr-11 py-3.5 rounded-xl border border-slate-700 bg-slate-900/70 text-slate-100 text-sm focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 mt-1.5">
                  Default password is your <span className="text-indigo-400 font-bold">mobile number</span> (e.g. 9876543210)
                </p>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                id="guest-login-btn"
                className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-extrabold text-sm uppercase tracking-wider transition-all shadow-xl shadow-indigo-600/25 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
              >
                {loading ? (
                  <><Loader2 size={18} className="animate-spin" /> Signing In...</>
                ) : (
                  <><LogIn size={18} /> Sign In to My Bookings</>
                )}
              </button>
            </form>

            {/* Help Text */}
            <div className="mt-6 pt-5 border-t border-slate-800/60 text-center">
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Don't have your credentials? Please contact the hotel front desk<br />and they will resend your login details.
              </p>
            </div>
          </div>

          <p className="text-center text-[10px] text-slate-600 mt-6 tracking-wide">
            Powered by <span className="text-indigo-500 font-bold">GuestFlow HMS</span>
          </p>
        </div>
      </div>
    </>
  );
}
