'use client';

import React, { useState, useEffect } from 'react';
import {
  User, Mail, Phone, MapPin, Building, FileText, Lock, Eye, EyeOff,
  Save, CheckCircle2, ShieldCheck, Sparkles, AlertCircle, Loader2,
  Calendar, Globe, Crown, CreditCard, Check
} from 'lucide-react';
import { toast } from 'sonner';
import { GuestData } from './types';
import ProfilePhotoUploader from '@/components/common/ProfilePhotoUploader';

interface ProfileTabProps {
  guest: GuestData;
  token: string;
  onUpdate: () => void;
}

const ID_TYPES = [
  'Aadhaar Card',
  'Passport',
  'Driving License',
  'Voter ID',
  'PAN Card',
  'Other Govt ID',
];

const GENDERS = [
  { value: 'MALE', label: 'Male 👨' },
  { value: 'FEMALE', label: 'Female 👩' },
  { value: 'OTHER', label: 'Other 🧑' },
  { value: 'PREFER_NOT_TO_SAY', label: 'Prefer not to say' },
];

export default function ProfileTab({ guest, token, onUpdate }: ProfileTabProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form State
  const [firstName, setFirstName] = useState(guest.firstName || '');
  const [lastName, setLastName] = useState(guest.lastName || '');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(guest.avatarUrl || null);
  const [email, setEmail] = useState(guest.email || '');
  const [mobile, setMobile] = useState(guest.mobile || '');
  const [gender, setGender] = useState(guest.gender || 'MALE');
  const [nationality, setNationality] = useState(guest.nationality || 'Indian');
  const [birthDate, setBirthDate] = useState(guest.birthDate || '');
  const [idType, setIdType] = useState(guest.idType || 'Aadhaar Card');
  const [idNumber, setIdNumber] = useState(guest.idNumber || '');
  const [address, setAddress] = useState(guest.address || '');
  const [companyName, setCompanyName] = useState(guest.companyName || '');
  const [gstNumber, setGstNumber] = useState(guest.gstNumber || '');
  const [billingAddress, setBillingAddress] = useState(guest.billingAddress || '');

  // Password change state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Extended details from profile API
  const [stats, setStats] = useState<{ totalBookings: number; totalOrders: number } | null>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [hasCustomPassword, setHasCustomPassword] = useState(false);

  useEffect(() => {
    async function loadFullProfile() {
      if (!token) return;
      setLoading(true);
      try {
        const res = await fetch('/api/guest-portal/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const d = await res.json();
        if (d.success && d.data) {
          const p = d.data;
          setFirstName(p.firstName || '');
          setLastName(p.lastName || '');
          setAvatarUrl(p.avatarUrl || null);
          setEmail(p.email || '');
          setMobile(p.mobile || '');
          setGender(p.gender || 'MALE');
          setNationality(p.nationality || 'Indian');
          setBirthDate(p.birthDate || '');
          setIdType(p.idType || 'Aadhaar Card');
          setIdNumber(p.idNumber || '');
          setAddress(p.address || '');
          setCompanyName(p.companyName || '');
          setGstNumber(p.gstNumber || '');
          setBillingAddress(p.billingAddress || '');
          setStats(p.stats || null);
          setDocuments(p.documents || []);
          setHasCustomPassword(p.hasCustomPassword || false);
        }
      } catch (err) {
        console.error('Failed to load full profile:', err);
      } finally {
        setLoading(false);
      }
    }
    loadFullProfile();
  }, [token]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!firstName.trim()) {
      toast.error('First name is required.');
      return;
    }

    if (newPassword) {
      if (newPassword.length < 4) {
        toast.error('Password must be at least 4 characters.');
        return;
      }
      if (newPassword !== confirmPassword) {
        toast.error('New password and confirm password do not match.');
        return;
      }
    }

    setSaving(true);
    try {
      const payload: any = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        mobile: mobile.trim(),
        gender,
        nationality: nationality.trim(),
        birthDate: birthDate || null,
        idType,
        idNumber: idNumber.trim(),
        address: address.trim(),
        companyName: companyName.trim(),
        gstNumber: gstNumber.trim().toUpperCase(),
        billingAddress: billingAddress.trim(),
      };

      if (newPassword) {
        payload.newPassword = newPassword.trim();
      }

      const res = await fetch('/api/guest-portal/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const d = await res.json();
      if (d.success) {
        toast.success(d.message || 'Profile saved successfully!');
        setNewPassword('');
        setConfirmPassword('');
        onUpdate();
      } else {
        toast.error(d.message || 'Failed to save profile.');
      }
    } catch {
      toast.error('Network connection error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const initials = `${firstName[0] || 'G'}${lastName[0] || ''}`.toUpperCase();

  return (
    <div className="space-y-6 pb-24">
      {/* Profile Banner / Overview Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950/70 via-slate-900/90 to-[#0c1222] border border-indigo-500/20 p-6 shadow-2xl backdrop-blur-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-5">
          {/* Interactive Profile Photo Uploader */}
          <ProfilePhotoUploader
            currentPhotoUrl={avatarUrl}
            name={`${firstName} ${lastName}`}
            userType="guest"
            userId={guest.id}
            token={token}
            size="lg"
            onPhotoUploaded={newUrl => {
              setAvatarUrl(newUrl);
              onUpdate();
            }}
          />

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <ShieldCheck size={11} /> Verified Guest
              </span>
              {guest.segment && (
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                  <Crown size={11} /> {guest.segment}
                </span>
              )}
              {guest.loyaltyPoints !== undefined && guest.loyaltyPoints > 0 && (
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  ★ {guest.loyaltyPoints} Points
                </span>
              )}
            </div>

            <h2 className="text-2xl font-black text-white truncate">
              {firstName} {lastName}
            </h2>

            <div className="flex flex-wrap gap-4 text-xs text-slate-400 mt-2">
              {mobile && (
                <span className="flex items-center gap-1.5 text-slate-300 font-semibold">
                  <Phone size={12} className="text-indigo-400" /> {mobile}
                </span>
              )}
              {email && (
                <span className="flex items-center gap-1.5 text-slate-300 font-semibold">
                  <Mail size={12} className="text-violet-400" /> {email}
                </span>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          {stats && (
            <div className="flex sm:flex-col gap-2 w-full sm:w-auto mt-2 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-800">
              <div className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
                <span className="text-xs font-bold text-slate-400">Total Stays</span>
                <p className="text-lg font-black text-white">{stats.totalBookings}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center">
          <Loader2 size={32} className="animate-spin text-indigo-500 mx-auto mb-3" />
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Loading profile details...</p>
        </div>
      ) : (
        <form onSubmit={handleSaveProfile} className="space-y-6">
          {/* SECTION 1: Personal Information */}
          <div className="rounded-3xl bg-[#0f172a]/80 border border-slate-800/80 p-6 shadow-xl backdrop-blur-xl space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-800/80">
              <User size={16} className="text-indigo-400" />
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-200">
                Personal Information
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  First Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  placeholder="e.g. Sabu"
                  className="w-full px-4 py-3 rounded-xl bg-slate-900/70 border border-slate-700 text-slate-100 text-sm font-semibold focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Last Name
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  placeholder="e.g. Kumar"
                  className="w-full px-4 py-3 rounded-xl bg-slate-900/70 border border-slate-700 text-slate-100 text-sm font-semibold focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Mobile Number (Login ID)
                </label>
                <div className="relative">
                  <Phone size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="tel"
                    value={mobile}
                    onChange={e => setMobile(e.target.value)}
                    placeholder="9876543210"
                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-900/70 border border-slate-700 text-slate-100 text-sm font-semibold focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="guest@example.com"
                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-900/70 border border-slate-700 text-slate-100 text-sm font-semibold focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Gender
                </label>
                <select
                  value={gender}
                  onChange={e => setGender(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-900/70 border border-slate-700 text-slate-100 text-sm font-semibold focus:outline-none focus:border-indigo-500 transition-colors"
                >
                  {GENDERS.map(g => (
                    <option key={g.value} value={g.value} className="bg-slate-900">
                      {g.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Nationality
                </label>
                <div className="relative">
                  <Globe size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={nationality}
                    onChange={e => setNationality(e.target.value)}
                    placeholder="e.g. Indian"
                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-900/70 border border-slate-700 text-slate-100 text-sm font-semibold focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Date of Birth
                </label>
                <div className="relative">
                  <Calendar size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="date"
                    value={birthDate}
                    onChange={e => setBirthDate(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-900/70 border border-slate-700 text-slate-100 text-sm font-semibold focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: Identity Proof & Address */}
          <div className="rounded-3xl bg-[#0f172a]/80 border border-slate-800/80 p-6 shadow-xl backdrop-blur-xl space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-800/80">
              <CreditCard size={16} className="text-emerald-400" />
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-200">
                Identity & KYC Proof
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Govt. ID Type
                </label>
                <select
                  value={idType}
                  onChange={e => setIdType(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-900/70 border border-slate-700 text-slate-100 text-sm font-semibold focus:outline-none focus:border-emerald-500 transition-colors"
                >
                  {ID_TYPES.map(t => (
                    <option key={t} value={t} className="bg-slate-900">
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Document / ID Number
                </label>
                <input
                  type="text"
                  value={idNumber}
                  onChange={e => setIdNumber(e.target.value)}
                  placeholder="e.g. 1234 5678 9012"
                  className="w-full px-4 py-3 rounded-xl bg-slate-900/70 border border-slate-700 text-slate-100 text-sm font-semibold focus:outline-none focus:border-emerald-500 transition-colors placeholder:text-slate-600 uppercase"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Residential Address
                </label>
                <div className="relative">
                  <MapPin size={14} className="absolute left-4 top-3 text-slate-500" />
                  <textarea
                    rows={2}
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    placeholder="Enter your permanent or communication address"
                    className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-slate-900/70 border border-slate-700 text-slate-100 text-sm font-semibold focus:outline-none focus:border-emerald-500 transition-colors placeholder:text-slate-600 resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Existing verified documents if any */}
            {documents && documents.length > 0 && (
              <div className="pt-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Uploaded Documents</p>
                <div className="flex flex-wrap gap-2">
                  {documents.map((doc: any) => (
                    <span key={doc.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
                      <CheckCircle2 size={13} /> {doc.documentType} ({doc.verified ? 'Verified' : 'Pending'})
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* SECTION 3: Corporate Billing & GST (Optional) */}
          <div className="rounded-3xl bg-[#0f172a]/80 border border-slate-800/80 p-6 shadow-xl backdrop-blur-xl space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-800/80">
              <Building size={16} className="text-amber-400" />
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-200">
                  Business & GST Billing
                </h3>
                <p className="text-[10px] text-slate-500">Provide if you need GST tax invoices for business reimbursement</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Company / Organization Name
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  placeholder="e.g. Acme Technologies Pvt Ltd"
                  className="w-full px-4 py-3 rounded-xl bg-slate-900/70 border border-slate-700 text-slate-100 text-sm font-semibold focus:outline-none focus:border-amber-500 transition-colors placeholder:text-slate-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  GSTIN (GST Number)
                </label>
                <input
                  type="text"
                  maxLength={15}
                  value={gstNumber}
                  onChange={e => setGstNumber(e.target.value.toUpperCase())}
                  placeholder="e.g. 07AAAAA0000A1Z5"
                  className="w-full px-4 py-3 rounded-xl bg-slate-900/70 border border-slate-700 text-slate-100 text-sm font-mono font-bold focus:outline-none focus:border-amber-500 transition-colors placeholder:text-slate-600 uppercase"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Corporate Billing Address
                </label>
                <textarea
                  rows={2}
                  value={billingAddress}
                  onChange={e => setBillingAddress(e.target.value)}
                  placeholder="Address printed on official hotel tax invoices"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900/70 border border-slate-700 text-slate-100 text-sm font-semibold focus:outline-none focus:border-amber-500 transition-colors placeholder:text-slate-600 resize-none"
                />
              </div>
            </div>
          </div>

          {/* SECTION 4: Security & Portal Login Password */}
          <div className="rounded-3xl bg-[#0f172a]/80 border border-slate-800/80 p-6 shadow-xl backdrop-blur-xl space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-800/80">
              <Lock size={16} className="text-violet-400" />
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-200">
                  Portal Login & Security
                </h3>
                <p className="text-[10px] text-slate-500">
                  {hasCustomPassword
                    ? 'You have a custom password set. You can change it anytime.'
                    : 'Your default password is your 10-digit mobile number. Set a custom password below.'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  New Portal Password (Optional)
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Leave blank to keep unchanged"
                    className="w-full pl-4 pr-11 py-3 rounded-xl bg-slate-900/70 border border-slate-700 text-slate-100 text-sm font-semibold focus:outline-none focus:border-violet-500 transition-colors placeholder:text-slate-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Re-type new password"
                    className="w-full pl-4 pr-11 py-3 rounded-xl bg-slate-900/70 border border-slate-700 text-slate-100 text-sm font-semibold focus:outline-none focus:border-violet-500 transition-colors placeholder:text-slate-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 hover:from-indigo-500 hover:to-violet-500 text-white font-black text-sm uppercase tracking-wider transition-all shadow-xl shadow-indigo-600/30 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-98"
            >
              {saving ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Saving Changes...
                </>
              ) : (
                <>
                  <Save size={18} /> Save Profile Settings
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
