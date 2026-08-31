'use client';

import React, { useState } from 'react';
import { Phone, Mail, MapPin, Clock, Send, CheckCircle2, Loader2 } from 'lucide-react';

const BG      = '#080d18';
const CARD_BG = '#0f172a';
const ROSE    = '#e8a0a0';
const INDIGO  = '#6366f1';

const INFO_CARDS = [
  {
    icon: MapPin,
    title: 'Our Location',
    lines: ['123 Hotel Avenue, City Centre', 'Mumbai, Maharashtra 400001'],
    color: 'text-sky-400',
    bg: 'bg-sky-500/10',
  },
  {
    icon: Phone,
    title: 'Call Us',
    lines: ['+91 98765 43210', '+91 22 1234 5678'],
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
  },
  {
    icon: Mail,
    title: 'Email Us',
    lines: ['reservations@guestflow.com', 'support@guestflow.com'],
    color: 'text-rose-400',
    bg: 'bg-rose-500/10',
  },
  {
    icon: Clock,
    title: 'Front Desk Hours',
    lines: ['Check-in: 2:00 PM', 'Check-out: 11:00 AM', 'Reception: 24/7'],
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
  },
];

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      setError('Please fill in all required fields.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/website/enquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(true);
        setForm({ name: '', email: '', phone: '', subject: '', message: '' });
      } else {
        setError(data.message || 'Something went wrong. Please try again.');
      }
    } catch {
      setError('Network error. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ background: BG, color: '#fff', minHeight: '100vh' }}>

      {/* ══ HERO ══════════════════════════════════════════════════ */}
      <section className="relative pt-32 pb-16 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] rounded-full blur-[120px]"
            style={{ background: 'rgba(232,160,160,0.08)' }} />
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.5) 1px,transparent 1px)',
            backgroundSize: '80px 80px',
          }} />
        </div>
        <div className="container mx-auto px-6 max-w-3xl text-center relative z-10">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-[0.2em] mb-6 border"
            style={{ background: 'rgba(232,160,160,0.1)', borderColor: `${ROSE}30`, color: ROSE }}>
            Get in Touch
          </span>
          <h1 className="text-5xl md:text-6xl font-black tracking-tight leading-tight mb-5">
            We&apos;d Love to{' '}
            <span style={{ background: `linear-gradient(135deg,${ROSE},#f0c8c8)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Hear From You
            </span>
          </h1>
          <p className="text-lg" style={{ color: 'rgba(255,255,255,0.45)' }}>
            Whether you&apos;re planning a stay, hosting an event or just have a question — our team is here to help.
          </p>
        </div>
      </section>

      {/* ══ INFO CARDS ════════════════════════════════════════════ */}
      <section className="pb-16">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {INFO_CARDS.map((card, i) => (
              <div key={i} className="p-5 rounded-2xl border border-slate-800 transition-all hover:border-slate-700"
                style={{ background: CARD_BG }}>
                <div className={`w-10 h-10 rounded-xl ${card.bg} ${card.color} flex items-center justify-center mb-4`}>
                  <card.icon className="w-4.5 h-4.5" strokeWidth={1.8} />
                </div>
                <h3 className="text-sm font-bold text-white mb-2">{card.title}</h3>
                {card.lines.map((line, j) => (
                  <p key={j} className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>{line}</p>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CONTACT FORM ══════════════════════════════════════════ */}
      <section className="pb-28">
        <div className="container mx-auto px-6 max-w-3xl">
          <div className="p-8 md:p-12 rounded-3xl border border-slate-800 relative overflow-hidden"
            style={{ background: CARD_BG }}>
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-[100px] pointer-events-none"
              style={{ background: 'rgba(99,102,241,0.08)' }} />

            {success ? (
              <div className="relative z-10 text-center py-12">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 flex items-center justify-center mx-auto mb-5">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                </div>
                <h3 className="text-2xl font-black text-white mb-3">Message Sent!</h3>
                <p className="text-base mb-8" style={{ color: 'rgba(255,255,255,0.45)' }}>
                  Thank you for reaching out. Our team will get back to you within 24 hours.
                </p>
                <button
                  onClick={() => setSuccess(false)}
                  className="px-6 py-3 rounded-xl text-sm font-bold border border-slate-700 text-slate-300 hover:bg-white/5 transition-all">
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="relative z-10 space-y-5">
                <div>
                  <h2 className="text-2xl font-black text-white mb-1">Send us a Message</h2>
                  <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>Fill in the form below and we&apos;ll respond within 24 hours.</p>
                </div>

                {error && (
                  <div className="px-4 py-3 rounded-xl text-sm text-red-400 border border-red-500/20" style={{ background: 'rgba(239,68,68,0.08)' }}>
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">Full Name *</label>
                    <input
                      name="name" value={form.name} onChange={handleChange} required
                      placeholder="Your name"
                      className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 transition-all"
                      style={{ background: '#080d18', border: '1px solid rgba(255,255,255,0.08)' }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">Email Address *</label>
                    <input
                      name="email" value={form.email} onChange={handleChange} required type="email"
                      placeholder="you@example.com"
                      className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 transition-all"
                      style={{ background: '#080d18', border: '1px solid rgba(255,255,255,0.08)' }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">Phone Number</label>
                    <input
                      name="phone" value={form.phone} onChange={handleChange} type="tel"
                      placeholder="+91 98765 43210"
                      className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 transition-all"
                      style={{ background: '#080d18', border: '1px solid rgba(255,255,255,0.08)' }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">Subject</label>
                    <select
                      name="subject" value={form.subject} onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-all"
                      style={{ background: '#080d18', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <option value="">Select a subject</option>
                      <option value="Room Booking">Room Booking</option>
                      <option value="Event Enquiry">Event Enquiry</option>
                      <option value="Dining Reservation">Dining Reservation</option>
                      <option value="Spa Booking">Spa Booking</option>
                      <option value="General Inquiry">General Inquiry</option>
                      <option value="Feedback">Feedback</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Message *</label>
                  <textarea
                    name="message" value={form.message} onChange={handleChange} required rows={5}
                    placeholder="Tell us more about your enquiry..."
                    className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 transition-all resize-none"
                    style={{ background: '#080d18', border: '1px solid rgba(255,255,255,0.08)' }}
                  />
                </div>

                <button
                  type="submit" disabled={loading}
                  className="w-full py-4 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed"
                  style={{ background: `linear-gradient(135deg,${INDIGO},#818cf8)`, boxShadow: '0 0 24px rgba(99,102,241,0.3)' }}>
                  {loading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</>
                  ) : (
                    <><Send className="w-4 h-4" /> Send Message</>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

    </main>
  );
}
