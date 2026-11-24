import React from 'react';
import Link from 'next/link';
import { Cookie, ArrowLeft, CheckCircle2 } from 'lucide-react';

export const metadata = {
  title: 'Cookie Policy | GuestFlow Hotel PMS',
  description: 'GuestFlow PMS Cookie & Local Storage Policy.',
};

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-[#03060c] text-slate-300 py-16 px-6 font-sans">
      <div className="max-w-4xl mx-auto space-y-10">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-cyan-400 transition-colors"
          >
            <ArrowLeft size={14} /> Back to Home
          </Link>
        </div>

        <div className="space-y-3 border-b border-white/10 pb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-black uppercase tracking-widest">
            <Cookie size={14} />
            Essential Cookies &amp; Storage
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Cookie Policy
          </h1>
          <p className="text-sm text-slate-400">
            Last Updated: November 2026 · Strictly Essential &amp; Security Cookies Only
          </p>
        </div>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400" /> 1. No Third-Party Ad Trackers
          </h2>
          <p className="text-sm leading-relaxed text-slate-400">
            GuestFlow PMS does not utilize third-party advertising cookies, behavioural cross-site tracking scripts, or ad-retargeting pixels across any hotel operations screens.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400" /> 2. Essential Security &amp; Session Cookies
          </h2>
          <p className="text-sm leading-relaxed text-slate-400">
            We use strictly essential first-party cookies and local storage tokens necessary to keep your hotel staff session secure and active:
          </p>
          <ul className="space-y-2 text-sm text-slate-300">
            <li className="flex items-start gap-2">
              <CheckCircle2 size={16} className="text-amber-400 shrink-0 mt-0.5" />
              <span><strong>Session Authentication (<code className="bg-black/50 px-1.5 py-0.5 rounded text-amber-300">auth_token</code>):</strong> Maintains authenticated login state for Reception, GM, and Kitchen staff.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 size={16} className="text-amber-400 shrink-0 mt-0.5" />
              <span><strong>Active Property Context:</strong> Stores selected branch ID for multi-property hospitality operators.</span>
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
