'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  User,
  Phone,
  Mail,
  Loader2,
  MessageSquare,
  HelpCircle,
  CheckCircle2,
  Calendar,
  Clock,
  ExternalLink,
  Trash2,
  ArrowRight,
  Send,
  AlertCircle,
} from 'lucide-react';

export interface QueryItem {
  id: string;
  guestName: string;
  name?: string;
  phone: string;
  email: string;
  subject: string;
  message: string;
  status: string; // 'NEW' | 'IN_PROGRESS' | 'RESPONDED' | 'RESOLVED' | 'CONVERTED'
  createdAt: string | Date;
}

interface QuickQueryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  queryToView?: QueryItem | null;
  onConvertToBooking?: (query: QueryItem) => void;
}

const QUERY_SUBJECTS = [
  'Room Availability & Tariff Enquiry',
  'Advance Booking / Bulk Group Booking',
  'Banquet & Event Hall Booking Enquiry',
  'Early Check-In / Late Check-Out Request',
  'Airport Pickup / Cab Service Request',
  'In-House Room Service / Maintenance Query',
  'Restaurant Dining & Table Reservation',
  'Corporate Tie-Up & GST Invoice Query',
  'General Hotel Information / Facilities',
];

export function QuickQueryModal({
  isOpen,
  onClose,
  onSaved,
  queryToView,
  onConvertToBooking,
}: QuickQueryModalProps) {
  // Form State
  const [guestName, setGuestName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState(QUERY_SUBJECTS[0]);
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'NEW' | 'IN_PROGRESS' | 'RESOLVED' | 'CONVERTED'>('NEW');

  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // When queryToView changes, populate fields
  useEffect(() => {
    if (queryToView) {
      setGuestName(queryToView.guestName || queryToView.name || '');
      setPhone(queryToView.phone || '');
      setEmail(queryToView.email || '');
      setSubject(queryToView.subject || QUERY_SUBJECTS[0]);
      setMessage(queryToView.message || '');
      setStatus((queryToView.status as any) || 'NEW');
    } else {
      setGuestName('');
      setPhone('');
      setEmail('');
      setSubject(QUERY_SUBJECTS[0]);
      setMessage('');
      setStatus('NEW');
    }
  }, [queryToView, isOpen]);

  if (!isOpen) return null;

  const isEditing = !!queryToView;

  // Handle Save / Update
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim()) {
      alert('Please enter guest or customer name.');
      return;
    }
    if (!phone.trim() && !email.trim()) {
      alert('Please enter at least a mobile number or email address.');
      return;
    }

    setSubmitting(true);
    try {
      if (isEditing) {
        // PATCH
        const res = await fetch('/api/hotel/queries', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: queryToView.id,
            status,
            subject,
            message,
          }),
        });
        const data = await res.json();
        if (data.success) {
          onSaved();
          onClose();
        } else {
          alert(data.message || 'Error updating query');
        }
      } else {
        // POST new query
        const res = await fetch('/api/hotel/queries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: guestName.trim(),
            phone: phone.trim(),
            email: email.trim(),
            subject,
            message: message.trim() || 'Guest enquired about room tariffs and availability.',
            status,
          }),
        });
        const data = await res.json();
        if (data.success) {
          onSaved();
          onClose();
        } else {
          alert(data.message || 'Error creating query');
        }
      }
    } catch (err) {
      console.error(err);
      alert('Network error communicating with server.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Delete
  const handleDelete = async () => {
    if (!queryToView) return;
    if (!confirm('Are you sure you want to delete this enquiry?')) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/hotel/queries?id=${queryToView.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        onSaved();
        onClose();
      } else {
        alert(data.message || 'Error deleting query');
      }
    } catch (err) {
      console.error(err);
      alert('Network error deleting query.');
    } finally {
      setDeleting(false);
    }
  };

  // Clean WhatsApp phone number
  const cleanPhone = phone.replace(/[^0-9]/g, '');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-[#0f172a] rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-800 text-white relative">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <HelpCircle className="w-5 h-5 text-slate-950 font-bold" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">
              {isEditing ? 'Guest Query Details' : 'Log New Guest Query'}
            </h3>
            <p className="text-xs text-slate-400">
              {isEditing
                ? `Enquiry Reference #${queryToView.id.slice(-6)}`
                : 'Record walk-in, phone call or website guest enquiry'}
            </p>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Guest Name & Mobile */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Guest Name <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="e.g. Vikram Malhotra"
                  className="w-full bg-[#1e293b]/70 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder:text-slate-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Mobile Number <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +91 9876543210"
                  className="w-full bg-[#1e293b]/70 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder:text-slate-500"
                />
              </div>
            </div>
          </div>

          {/* Email Address */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Email Address (Optional)
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. vikram@gmail.com"
                className="w-full bg-[#1e293b]/70 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder:text-slate-500"
              />
            </div>
          </div>

          {/* Subject / Category Dropdown */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Query Topic / Enquiry Category
            </label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full bg-[#1e293b]/70 border border-slate-700/80 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              {QUERY_SUBJECTS.map((s) => (
                <option key={s} value={s} className="bg-slate-900 text-white">
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Message / Requirement Details */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Query Details / Guest Requirement
            </label>
            <textarea
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="e.g. Guest inquired for 2 Executive Deluxe rooms for wedding guests on 15th October with breakfast and late check-out."
              className="w-full bg-[#1e293b]/70 border border-slate-700/80 rounded-xl p-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder:text-slate-500"
            ></textarea>
          </div>

          {/* Status Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Current Query Status
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'NEW', label: 'New', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' },
                { id: 'IN_PROGRESS', label: 'Follow Up', color: 'bg-amber-500/20 text-amber-400 border-amber-500/40' },
                { id: 'RESOLVED', label: 'Resolved', color: 'bg-sky-500/20 text-sky-400 border-sky-500/40' },
                { id: 'CONVERTED', label: 'Converted', color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/40' },
              ].map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setStatus(st.id as any)}
                  className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    status === st.id
                      ? `${st.color} shadow-sm ring-1 ring-white/20`
                      : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Contact & Convert Action Strip (if editing) */}
          {isEditing && (
            <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/70 flex items-center justify-between flex-wrap gap-2 text-xs">
              <div className="flex items-center gap-2">
                {phone && (
                  <a
                    href={`tel:${phone}`}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-semibold transition-colors"
                  >
                    <Phone className="w-3 h-3" />
                    <span>Call</span>
                  </a>
                )}
                {cleanPhone && (
                  <a
                    href={`https://wa.me/${cleanPhone}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-colors"
                  >
                    <span>WhatsApp</span>
                  </a>
                )}
                {email && (
                  <a
                    href={`mailto:${email}`}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 font-semibold transition-colors"
                  >
                    <Mail className="w-3 h-3" />
                    <span>Email</span>
                  </a>
                )}
              </div>

              {/* Convert to Booking Button */}
              {onConvertToBooking && queryToView && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onConvertToBooking(queryToView);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#00b894] hover:bg-[#00a884] text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
                >
                  <span>Book Room</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            {isEditing ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
              >
                {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>Delete</span>
              </button>
            ) : (
              <div></div>
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 text-xs font-bold bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-slate-950 rounded-xl flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-slate-950" />
                )}
                <span>{isEditing ? 'Update Query' : 'Save Query'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
