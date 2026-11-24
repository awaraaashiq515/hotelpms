import React from 'react';
import Link from 'next/link';
import { Trash2, ShieldCheck, Mail, ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'User Data Deletion Instructions | OrderMint PMS',
  description: 'Instructions on how users can request deletion of their data in accordance with Meta Platform terms.',
};

export default function DataDeletionPage() {
  return (
    <div className="min-h-screen bg-[#03060c] text-slate-300 py-16 px-6 font-sans">
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-cyan-400 transition-colors"
          >
            <ArrowLeft size={14} /> Back to Home
          </Link>
        </div>

        <div className="space-y-3 border-b border-white/10 pb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-black uppercase tracking-widest">
            <Trash2 size={14} />
            Data Deletion Policy
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            User Data Deletion Instructions
          </h1>
          <p className="text-sm text-slate-400">
            OrderMint PMS values your privacy and provides full control over your personal data.
          </p>
        </div>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ShieldCheck size={18} className="text-cyan-400" /> How to Request Data Deletion
          </h2>
          <p className="text-sm leading-relaxed text-slate-300">
            If you wish to remove your account data, chat histories, or WhatsApp booking records from OrderMint PMS, please follow the steps below:
          </p>
          <ol className="list-decimal list-inside space-y-3 text-sm text-slate-300">
            <li>
              Send an email to our Data Protection Officer at{' '}
              <a href="mailto:rishia6@gmail.com" className="text-cyan-400 font-semibold underline">
                rishia6@gmail.com
              </a>{' '}
              with the subject line: <code className="bg-white/10 px-2 py-0.5 rounded text-white font-mono">Data Deletion Request</code>.
            </li>
            <li>
              Include your registered phone number (used on WhatsApp) or registered hotel guest account email address.
            </li>
            <li>
              Our compliance team will review and permanently delete your user profile, session data, and associated non-statutory records within 48 business hours.
            </li>
            <li>
              You will receive an official confirmation email once your data has been successfully removed from our servers.
            </li>
          </ol>
        </section>

        <section className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2">
          <div className="flex items-center gap-2 text-white font-semibold text-sm">
            <Mail size={16} className="text-cyan-400" /> Need Immediate Assistance?
          </div>
          <p className="text-xs text-slate-400">
            You can also contact our support desk directly via email at <span className="text-white font-medium">rishia6@gmail.com</span>.
          </p>
        </section>
      </div>
    </div>
  );
}
