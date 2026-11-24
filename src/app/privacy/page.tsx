import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Lock, Eye, FileText, ArrowLeft, CheckCircle2 } from 'lucide-react';

export const metadata = {
  title: 'Privacy Policy | GuestFlow Hotel PMS',
  description: 'GuestFlow PMS Privacy Policy including DPDP Act 2023 compliance, Aadhaar masking, and hotel guest data security.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#03060c] text-slate-300 py-16 px-6 font-sans">
      <div className="max-w-4xl mx-auto space-y-10">
        {/* Back Link */}
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-cyan-400 transition-colors"
          >
            <ArrowLeft size={14} /> Back to Home
          </Link>
        </div>

        {/* Title */}
        <div className="space-y-3 border-b border-white/10 pb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-black uppercase tracking-widest">
            <ShieldCheck size={14} />
            Data Protection &amp; Regulatory Compliance
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            GuestFlow PMS Privacy Policy
          </h1>
          <p className="text-sm text-slate-400">
            Last Updated: November 2026 · Compliant with the Digital Personal Data Protection Act (DPDP Act 2023) and UIDAI Guidelines
          </p>
        </div>

        {/* Section 1 */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400" /> 1. Commitment to Hotel Guest &amp; Property Privacy
          </h2>
          <p className="text-sm leading-relaxed text-slate-400">
            GuestFlow PMS (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;platform&rdquo;) provides hospitality property management, front desk, and point-of-sale solutions. We are dedicated to ensuring the highest standards of data security, privacy, and confidentiality for property owners, hotel staff, and in-house hotel guests.
          </p>
        </section>

        {/* Section 2 - Aadhaar & KYC Masking */}
        <section className="space-y-4 p-6 rounded-3xl bg-slate-900/60 border border-cyan-500/30">
          <h2 className="text-xl font-bold text-cyan-300 flex items-center gap-2">
            <Lock size={18} className="text-cyan-400" /> 2. Aadhaar Masking &amp; Guest ID Document Protection
          </h2>
          <p className="text-sm leading-relaxed text-slate-300">
            In compliance with UIDAI regulations and Indian data privacy standards:
          </p>
          <ul className="space-y-2 text-sm text-slate-300">
            <li className="flex items-start gap-2">
              <CheckCircle2 size={16} className="text-cyan-400 shrink-0 mt-0.5" />
              <span><strong>Aadhaar Number Masking:</strong> Full 12-digit Aadhaar numbers are never displayed in plain text to front desk or receptionist roles. The platform strictly presents masked identifiers (format: <code className="bg-black/50 px-2 py-0.5 rounded text-cyan-300 font-mono">XXXX-XXXX-1234</code>).</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 size={16} className="text-cyan-400 shrink-0 mt-0.5" />
              <span><strong>Encryption &amp; Storage:</strong> All uploaded guest identity documents (Passports, Driving Licenses, Voter IDs, and Aadhaar cards) are encrypted at rest using AES-256 standard and transmitted securely via TLS 1.3.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 size={16} className="text-cyan-400 shrink-0 mt-0.5" />
              <span><strong>Role-Based Access:</strong> Only authorized administrative personnel (such as Hotel General Managers or Verified Compliance Officers) may decrypt or view identification documents for mandatory statutory Form C or police verification logs.</span>
            </li>
          </ul>
        </section>

        {/* Section 3 */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400" /> 3. Data We Collect &amp; Process
          </h2>
          <p className="text-sm leading-relaxed text-slate-400">
            The platform processes data exclusively on behalf of the subscriber hotel (&ldquo;Data Fiduciary&rdquo;) for operational hospitality purposes:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <h3 className="font-bold text-white text-sm">Guest Information</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Guest names, contact phone numbers, email addresses, arrival/departure dates, room allocations, meal preferences, and folio billing records.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <h3 className="font-bold text-white text-sm">Staff &amp; Operations Data</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Employee logins, audit trail logs, shift attendance timestamps, and live geofencing/GPS telemetry active strictly during on-duty clocked-in hours.
              </p>
            </div>
          </div>
        </section>

        {/* Section 4 */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400" /> 4. Data Sharing &amp; Third Parties
          </h2>
          <p className="text-sm leading-relaxed text-slate-400">
            We do not sell, rent, or trade personal data or guest lists to any third-party advertisers. Data is shared exclusively with:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-sm text-slate-400 leading-relaxed">
            <li>Authorized Channel Managers and OTAs (Booking.com, Agoda, MakeMyTrip, etc.) solely to sync reservations.</li>
            <li>Government and law enforcement authorities when mandated by local hotel guest registration regulations.</li>
            <li>Secure cloud infrastructure providers adhering to ISO/IEC 27001 and SOC 2 Type II compliance.</li>
          </ul>
        </section>

        {/* Section 5 - DPO */}
        <section className="space-y-4 pt-6 border-t border-white/10">
          <h2 className="text-xl font-bold text-white">5. Data Protection Officer (DPO) &amp; Inquiries</h2>
          <p className="text-sm text-slate-400">
            For data inquiries, rectification requests, or deletion requests under the DPDP Act, contact our compliance team:
          </p>
          <div className="p-4 rounded-2xl bg-slate-900 border border-white/10 text-xs text-slate-300 space-y-1">
            <p><strong>Compliance &amp; Privacy Officer:</strong> privacy@ordermint.in</p>
            <p><strong>Company:</strong> GuestFlow PMS (Ordermint Technologies)</p>
            <p><strong>Registered Address:</strong> Mumbai, Maharashtra, India</p>
          </div>
        </section>
      </div>
    </div>
  );
}
