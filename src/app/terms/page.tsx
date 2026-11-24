import React from 'react';
import Link from 'next/link';
import { FileText, Shield, ArrowLeft, CheckCircle2 } from 'lucide-react';

export const metadata = {
  title: 'Terms of Service | GuestFlow Hotel PMS',
  description: 'Terms of Service and Software-as-a-Service conditions for GuestFlow PMS.',
};

export default function TermsOfServicePage() {
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-black uppercase tracking-widest">
            <FileText size={14} />
            Subscription &amp; Service Agreement
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Terms of Service
          </h1>
          <p className="text-sm text-slate-400">
            Last Updated: November 2026 · Standard Commercial Terms for GuestFlow PMS Cloud Services
          </p>
        </div>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-400" /> 1. SaaS Service Agreement
          </h2>
          <p className="text-sm leading-relaxed text-slate-400">
            By accessing or subscribing to GuestFlow PMS (&ldquo;Platform&rdquo;, &ldquo;Service&rdquo;), the subscribing hotel, resort, or property management entity agrees to be bound by these Terms of Service. GuestFlow delivers cloud-based front-desk operations, room inventory management, POS billing, and distribution syncing.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-400" /> 2. Statutory GST &amp; Invoicing Responsibility
          </h2>
          <p className="text-sm leading-relaxed text-slate-400">
            GuestFlow PMS incorporates automated tax calculation engines based on current Indian GST rates (5% without ITC for room tariff ₹1,001–₹7,500/night; 18% for tariff &gt;₹7,500/night). The property retains sole statutory responsibility for:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-sm text-slate-400 leading-relaxed">
            <li>Providing accurate legal GSTIN and property tax classification credentials.</li>
            <li>Reconciling monthly GSTR-1 and GSTR-3B filings with chartered accountants.</li>
            <li>Issuing gapless official tax invoices only upon settlement or checkout.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-400" /> 3. Property Security &amp; Credentials
          </h2>
          <p className="text-sm leading-relaxed text-slate-400">
            Subscribers must maintain strong role-based access policies. Front desk and receptionist accounts are strictly restricted from accessing accounting settings, administrative credentials, or raw encrypted guest identities. Sensitive third-party credentials (such as Google OAuth tokens and payment gateway keys) must be managed by property owners or General Managers.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-400" /> 4. Service Availability &amp; Support
          </h2>
          <p className="text-sm leading-relaxed text-slate-400">
            We target 99.9% application uptime for front-desk operations. Scheduled maintenance windows will be communicated in advance. Dedicated 24/7 technical support is provided to all Enterprise and Professional subscription tiers.
          </p>
        </section>
      </div>
    </div>
  );
}
