'use client';

import React, { useState } from 'react';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import {
  User, Phone, Briefcase, IndianRupee, MapPin, AlertCircle,
  Calendar, Clock, CheckCircle2, XCircle, ChevronUp, ChevronDown, Lock,
  Building2,
} from 'lucide-react';

// ── Validation ──────────────────────────────────────────────────────────────
const staffMemberSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50),
  phone: z.string().max(15).optional().or(z.literal('')),
  designation: z.string().optional().or(z.literal('')),
  salary: z.number().min(0).optional(),
  address: z.string().optional().or(z.literal('')),
  emergencyContact: z.string().optional().or(z.literal('')),
  joiningDate: z.string().optional().or(z.literal('')),
  isActive: z.boolean().default(true),
  shiftHours: z.number().min(0.1, 'Shift must be at least 6 minutes').default(8).optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  password: z.string().min(6, 'Password must be at least 6 characters').optional().or(z.literal('')),
  propertyId: z.string().min(1, 'Property selection is required').optional().or(z.literal('')),
});

// ── Types ───────────────────────────────────────────────────────────────────
export interface StaffMember {
  id: string;
  name: string;
  phone?: string | null;
  designation?: string | null;
  salary?: number | null;
  address?: string | null;
  emergencyContact?: string | null;
  joiningDate?: string | null;
  isActive: boolean;
  shiftHours?: number | null;
  propertyId?: string | null;
  createdAt?: string;
  user?: {
    email: string;
  } | null;
}

interface StaffMemberFormProps {
  initialData?: StaffMember;
  properties?: any[];
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

// ── Designation Options ────────────────────────────────────────────────────
const DESIGNATIONS = [
  // Restaurant Roles
  { value: 'Waiter',      emoji: '🍽', color: '#6366F1' },
  { value: 'Captain',     emoji: '⭐', color: '#F59E0B' },
  { value: 'Head Waiter', emoji: '👑', color: '#EF4444' },
  { value: 'Steward',     emoji: '🧹', color: '#8B5CF6' },
  { value: 'Cashier',     emoji: '💰', color: '#10B981' },
  { value: 'Chef',        emoji: '👨‍🍳', color: '#F97316' },
  { value: 'Helper',      emoji: '🤝', color: '#14B8A6' },
  
  // Hotel PMS Roles
  { value: 'Receptionist', emoji: '🛎️', color: '#3B82F6' },
  { value: 'Housekeeper',  emoji: '🧹', color: '#A855F7' },
  { value: 'Room Service', emoji: '🚪', color: '#EC4899' },
  { value: 'Bellboy',      emoji: '🧳', color: '#10B981' },
  { value: 'Security',     emoji: '🛡️', color: '#F43F5E' },
  { value: 'Maintenance',  emoji: '🔧', color: '#F59E0B' },
  { value: 'Hotel Manager',emoji: '👑', color: '#EAB308' },
  
  // General Roles
  { value: 'Supervisor',  emoji: '🎯', color: '#06B6D4' },
  { value: 'Manager',     emoji: '📋', color: '#EC4899' },
  { value: 'Other',       emoji: '👤', color: '#64748B' },
];

// Avatar colors for staff initials
const AVATAR_COLORS = [
  { bg: '#EF4444', text: '#fff' },
  { bg: '#F97316', text: '#fff' },
  { bg: '#8B5CF6', text: '#fff' },
  { bg: '#3B82F6', text: '#fff' },
  { bg: '#10B981', text: '#fff' },
  { bg: '#EC4899', text: '#fff' },
  { bg: '#6366F1', text: '#fff' },
  { bg: '#F59E0B', text: '#fff' },
];

function getInitials(name: string) {
  return name.trim().split(/\s+/).map(n => n[0]?.toUpperCase() || '').join('').slice(0, 2) || '?';
}

function getAvatarColor(name: string) {
  const idx = name.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[isNaN(idx) ? 0 : idx];
}

// ── Component ───────────────────────────────────────────────────────────────
export const StaffMemberForm: React.FC<StaffMemberFormProps> = ({
  initialData, properties, onSubmit, onCancel, loading
}) => {
  const [formData, setFormData] = useState({
    name:             initialData?.name || '',
    phone:            initialData?.phone || '',
    designation:      initialData?.designation || 'Waiter',
    salary:           initialData?.salary || 0,
    address:          initialData?.address || '',
    emergencyContact: initialData?.emergencyContact || '',
    joiningDate:      initialData?.joiningDate
      ? new Date(initialData.joiningDate).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0],
    isActive: initialData ? initialData.isActive : true,
    email: initialData?.user?.email || '',
    password: '',
    propertyId: initialData?.propertyId || '',
  });

  const initialShift = initialData?.shiftHours || 8;
  const [shiftHrsInput,  setShiftHrsInput]  = useState(Math.floor(initialShift));
  const [shiftMinsInput, setShiftMinsInput] = useState(Math.round((initialShift - Math.floor(initialShift)) * 60));
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    try {
      const computedShiftHours = Number(shiftHrsInput) + (Number(shiftMinsInput) / 60);
      const validated = staffMemberSchema.parse({
        ...formData,
        salary: Number(formData.salary) || 0,
        shiftHours: computedShiftHours,
      });
      await onSubmit({
        name:             validated.name,
        phone:            validated.phone || undefined,
        designation:      validated.designation || 'Waiter',
        salary:           validated.salary || 0,
        address:          validated.address || undefined,
        emergencyContact: validated.emergencyContact || undefined,
        joiningDate:      validated.joiningDate || undefined,
        isActive:         validated.isActive,
        shiftHours:       validated.shiftHours || 8,
        email:            validated.email || undefined,
        password:         validated.password || undefined,
        propertyId:       validated.propertyId || undefined,
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        err.issues.forEach(issue => { if (issue.path[0]) fieldErrors[issue.path[0] as string] = issue.message; });
        setErrors(fieldErrors);
      }
    }
  };

  const avatarColor = getAvatarColor(formData.name);
  const initials    = getInitials(formData.name || '?');
  const selectedDesignations = formData.designation ? formData.designation.split(',').map(s => s.trim()) : [];
  const selectedList = DESIGNATIONS.filter(d => selectedDesignations.includes(d.value));
  const totalShiftMins = shiftHrsInput * 60 + shiftMinsInput;
  const shiftLabel = shiftHrsInput > 0
    ? (shiftMinsInput > 0 ? `${shiftHrsInput}h ${shiftMinsInput}m` : `${shiftHrsInput}h`)
    : `${shiftMinsInput}m`;

  return (
    <form onSubmit={handleSubmit}>
      <style>{`
        .sf-field { display: flex; flex-direction: column; gap: 6px; }
        .sf-label {
          display: flex; align-items: center; gap: 6px;
          font-size: 10px; font-weight: 800; letter-spacing: 0.12em;
          text-transform: uppercase; color: #94A3B8;
        }
        .sf-label svg { opacity: 0.7; }
        .sf-input {
          width: 100%; padding: 10px 14px;
          background: rgba(255,255,255,0.04);
          border: 1.5px solid rgba(255,255,255,0.08);
          border-radius: 12px;
          font-size: 13px; font-weight: 600;
          color: #F1F5F9;
          outline: none; transition: all 0.18s;
          font-family: inherit;
        }
        .sf-input::placeholder { color: rgba(148,163,184,0.45); font-weight: 400; }
        .sf-input:focus { border-color: rgba(99,102,241,0.5); background: rgba(99,102,241,0.06); box-shadow: 0 0 0 3px rgba(99,102,241,0.08); }
        .sf-input.error { border-color: rgba(239,68,68,0.5); }
        .sf-error { font-size: 10px; color: #F87171; font-weight: 600; margin-left: 2px; }
        .sf-section-label {
          font-size: 9px; font-weight: 900; letter-spacing: 0.22em;
          text-transform: uppercase; color: #6366F1;
          display: flex; align-items: center; gap: 8px; margin-bottom: 2px;
        }
        .sf-section-label::after {
          content: ''; flex: 1; height: 1px;
          background: linear-gradient(to right, rgba(99,102,241,0.3), transparent);
        }
        .sf-counter-btn {
          width: 28px; height: 28px; border-radius: 8px; border: 1.5px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.05); color: #94A3B8;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: all 0.15s; flex-shrink: 0;
        }
        .sf-counter-btn:hover { background: rgba(99,102,241,0.15); border-color: rgba(99,102,241,0.4); color: #818CF8; }
      `}</style>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* ── AVATAR PREVIEW CARD ─────────────────────────────── */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '16px',
          padding: '16px 20px',
          background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(99,102,241,0.03))',
          border: '1px solid rgba(99,102,241,0.15)',
          borderRadius: '16px',
        }}>
          {/* Avatar */}
          <div style={{
            width: '64px', height: '64px', borderRadius: '20px',
            background: avatarColor.bg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '22px', fontWeight: 900, color: avatarColor.text,
            letterSpacing: '-0.03em', flexShrink: 0,
            boxShadow: `0 8px 24px ${avatarColor.bg}55`,
            transition: 'all 0.2s',
          }}>
            {initials}
          </div>

          {/* Info */}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#F1F5F9', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              {formData.name || <span style={{ color: 'rgba(148,163,184,0.4)', fontWeight: 400, fontSize: '14px' }}>Staff Name Preview</span>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
              {selectedList.map(desig => (
                <span key={desig.value} style={{
                  display: 'inline-flex', alignItems: 'center', gap: '5px',
                  fontSize: '11px', fontWeight: 700,
                  color: desig.color,
                  background: `${desig.color}18`,
                  border: `1px solid ${desig.color}40`,
                  padding: '3px 10px', borderRadius: '999px',
                }}>
                  {desig.emoji} {desig.value}
                </span>
              ))}
              {selectedList.length === 0 && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: '5px',
                  fontSize: '11px', fontWeight: 700,
                  color: '#64748B',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  padding: '3px 10px', borderRadius: '999px',
                }}>
                  👤 Staff Member
                </span>
              )}
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '4px',
                fontSize: '10px', fontWeight: 700,
                color: formData.isActive ? '#10B981' : '#EF4444',
                background: formData.isActive ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                border: `1px solid ${formData.isActive ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
                padding: '3px 10px', borderRadius: '999px',
              }}>
                {formData.isActive ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
                {formData.isActive ? 'Active' : 'Inactive'}
              </span>
              {formData.salary > 0 && (
                <span style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 600 }}>
                  ₹{Number(formData.salary).toLocaleString('en-IN')}/mo
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── SECTION: PERSONAL INFO ──────────────────────────── */}
        <div>
          <div className="sf-section-label">Personal Information</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
            {/* Property Selection */}
            {properties && properties.length > 0 && (
              <div className="sf-field" style={{ gridColumn: '1 / -1' }}>
                <label className="sf-label"><Building2 size={11} /> Assign to Property / Outlet <span style={{ color: '#EF4444' }}>*</span></label>
                <select
                  className={`sf-input${errors.propertyId ? ' error' : ''}`}
                  value={formData.propertyId}
                  onChange={e => setFormData({ ...formData, propertyId: e.target.value })}
                >
                  <option value="" className="bg-[#0f172a] text-slate-500">Select Property</option>
                  {properties.map(p => (
                    <option key={p.id} value={p.id} className="bg-[#0f172a] text-white">
                      {p.type === 'HOTEL' ? '🏨' : '🍽️'} {p.name}
                    </option>
                  ))}
                </select>
                {errors.propertyId && <p className="sf-error">⚠ {errors.propertyId}</p>}
              </div>
            )}

            {/* Full Name */}
            <div className="sf-field" style={{ gridColumn: '1 / -1' }}>
              <label className="sf-label"><User size={11} /> Full Name <span style={{ color: '#EF4444' }}>*</span></label>
              <input
                type="text"
                className={`sf-input${errors.name ? ' error' : ''}`}
                placeholder="e.g. Raj Kumar"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                autoFocus
              />
              {errors.name && <p className="sf-error">⚠ {errors.name}</p>}
            </div>

            {/* Phone */}
            <div className="sf-field">
              <label className="sf-label"><Phone size={11} /> Phone Number</label>
              <input
                type="tel"
                className="sf-input"
                placeholder="9876543210"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            {/* Salary */}
            <div className="sf-field">
              <label className="sf-label"><IndianRupee size={11} /> Monthly Salary (₹)</label>
              <input
                type="number"
                className="sf-input"
                placeholder="15000"
                value={formData.salary || ''}
                onChange={e => setFormData({ ...formData, salary: Number(e.target.value) || 0 })}
              />
            </div>
          </div>
        </div>

        {/* ── DESIGNATION CHIPS ─────────────────────────────────── */}
        <div>
          <label className="sf-label" style={{ marginBottom: '10px' }}>
            <Briefcase size={11} /> Designation / Role (Select one or more)
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {DESIGNATIONS.map(d => {
              const isSelected = selectedDesignations.includes(d.value);
              const handleToggleDesignation = () => {
                let next;
                if (selectedDesignations.includes(d.value)) {
                  next = selectedDesignations.filter(x => x !== d.value);
                } else {
                  next = [...selectedDesignations, d.value];
                }
                setFormData({ ...formData, designation: next.join(', ') });
              };
              return (
                <button
                  key={d.value}
                  type="button"
                  onClick={handleToggleDesignation}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    padding: '7px 14px', borderRadius: '999px', cursor: 'pointer',
                    fontSize: '12px', fontWeight: 700,
                    border: isSelected ? `1.5px solid ${d.color}` : '1.5px solid rgba(255,255,255,0.08)',
                    background: isSelected ? `${d.color}20` : 'rgba(255,255,255,0.03)',
                    color: isSelected ? d.color : '#64748B',
                    boxShadow: isSelected ? `0 4px 16px ${d.color}25` : 'none',
                    transition: 'all 0.18s',
                    transform: isSelected ? 'scale(1.04)' : 'scale(1)',
                  }}
                >
                  <span style={{ fontSize: '14px' }}>{d.emoji}</span>
                  {d.value}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── SECTION: LOGIN CREDENTIALS ─────────────────────── */}
        <div>
          <div className="sf-section-label">Staff Portal Login Credentials</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
            {/* Email */}
            <div className="sf-field">
              <label className="sf-label"><User size={11} /> Email Address</label>
              <input
                type="email"
                className={`sf-input${errors.email ? ' error' : ''}`}
                placeholder="staff@example.com"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
              />
              {errors.email && <p className="sf-error">⚠ {errors.email}</p>}
            </div>

            {/* Password */}
            <div className="sf-field">
              <label className="sf-label"><Lock size={11} /> Password</label>
              <input
                type="password"
                className={`sf-input${errors.password ? ' error' : ''}`}
                placeholder={initialData ? "•••••••• (Leave blank to keep same)" : "Minimum 6 chars"}
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
              />
              {errors.password && <p className="sf-error">⚠ {errors.password}</p>}
            </div>
          </div>
          <p style={{ fontSize: '9px', color: '#64748B', marginTop: '6px', fontWeight: 600 }}>
            * Set credentials to allow this staff member to log in to the Walkie-Talkie portal.
          </p>
        </div>

        {/* ── SECTION: SHIFT TARGET ────────────────────────────── */}
        <div>
          <div className="sf-section-label">Shift Target</div>
          <div style={{
            marginTop: '12px',
            padding: '16px 18px',
            background: 'rgba(99,102,241,0.05)',
            border: '1px solid rgba(99,102,241,0.12)',
            borderRadius: '14px',
            display: 'flex', flexDirection: 'column', gap: '14px',
          }}>
            {/* Visual shift display */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '52px', height: '52px', borderRadius: '14px',
                background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Clock size={22} color="#818CF8" />
              </div>
              <div>
                <div style={{ fontSize: '28px', fontWeight: 900, color: '#818CF8', letterSpacing: '-0.04em', lineHeight: 1 }}>
                  {shiftLabel}
                </div>
                <div style={{ fontSize: '10px', color: '#64748B', fontWeight: 600, marginTop: '3px' }}>
                  Daily target · {totalShiftMins} minutes total
                </div>
              </div>
              {/* Progress bar */}
              <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '999px', overflow: 'hidden', marginLeft: '4px' }}>
                <div style={{ height: '100%', borderRadius: '999px', background: 'linear-gradient(90deg, #6366F1, #818CF8)', width: `${Math.min(100, (totalShiftMins / (12 * 60)) * 100)}%`, transition: 'width 0.2s' }} />
              </div>
            </div>

            {/* Hours + Minutes counters */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {/* Hours */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label className="sf-label"><Clock size={10} /> Hours</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button type="button" className="sf-counter-btn" onClick={() => setShiftHrsInput(h => Math.max(0, h - 1))}>
                    <ChevronDown size={14} />
                  </button>
                  <input
                    type="number" min={0} max={24}
                    value={shiftHrsInput}
                    onChange={e => setShiftHrsInput(Math.min(24, Math.max(0, Number(e.target.value) || 0)))}
                    className="sf-input"
                    style={{ textAlign: 'center', fontWeight: 900, fontSize: '18px', padding: '8px 10px' }}
                  />
                  <button type="button" className="sf-counter-btn" onClick={() => setShiftHrsInput(h => Math.min(24, h + 1))}>
                    <ChevronUp size={14} />
                  </button>
                </div>
              </div>

              {/* Minutes */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label className="sf-label"><Clock size={10} /> Minutes</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button type="button" className="sf-counter-btn" onClick={() => setShiftMinsInput(m => m <= 0 ? 45 : m - 15)}>
                    <ChevronDown size={14} />
                  </button>
                  <input
                    type="number" min={0} max={59}
                    value={shiftMinsInput}
                    onChange={e => setShiftMinsInput(Math.min(59, Math.max(0, Number(e.target.value) || 0)))}
                    className="sf-input"
                    style={{ textAlign: 'center', fontWeight: 900, fontSize: '18px', padding: '8px 10px' }}
                  />
                  <button type="button" className="sf-counter-btn" onClick={() => setShiftMinsInput(m => m >= 45 ? 0 : m + 15)}>
                    <ChevronUp size={14} />
                  </button>
                </div>
              </div>
            </div>

            {/* Quick presets */}
            <div style={{ display: 'flex', gap: '7px', flexWrap: 'wrap' }}>
              {[{h:6,m:0},{h:8,m:0},{h:9,m:0},{h:10,m:30},{h:12,m:0}].map(preset => {
                const isActive = shiftHrsInput === preset.h && shiftMinsInput === preset.m;
                return (
                  <button
                    key={`${preset.h}:${preset.m}`}
                    type="button"
                    onClick={() => { setShiftHrsInput(preset.h); setShiftMinsInput(preset.m); }}
                    style={{
                      padding: '4px 12px', borderRadius: '999px', cursor: 'pointer',
                      fontSize: '11px', fontWeight: 700,
                      border: isActive ? '1.5px solid #6366F1' : '1.5px solid rgba(255,255,255,0.07)',
                      background: isActive ? 'rgba(99,102,241,0.18)' : 'rgba(255,255,255,0.03)',
                      color: isActive ? '#818CF8' : '#64748B',
                      transition: 'all 0.15s',
                    }}
                  >
                    {preset.h}h{preset.m > 0 ? ` ${preset.m}m` : ''}
                  </button>
                );
              })}
            </div>

            {errors.shiftHours && <p className="sf-error">⚠ {errors.shiftHours}</p>}
          </div>
        </div>

        {/* ── SECTION: ADDITIONAL ─────────────────────────────── */}
        <div>
          <div className="sf-section-label">Additional Details</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
            {/* Joining Date */}
            <div className="sf-field">
              <label className="sf-label"><Calendar size={11} /> Joining Date</label>
              <input
                type="date"
                className="sf-input"
                value={formData.joiningDate}
                onChange={e => setFormData({ ...formData, joiningDate: e.target.value })}
                style={{ colorScheme: 'dark' }}
              />
            </div>

            {/* Emergency Contact */}
            <div className="sf-field">
              <label className="sf-label"><AlertCircle size={11} /> Emergency Contact</label>
              <input
                type="tel"
                className="sf-input"
                placeholder="Emergency number"
                value={formData.emergencyContact}
                onChange={e => setFormData({ ...formData, emergencyContact: e.target.value })}
              />
            </div>

            {/* Address */}
            <div className="sf-field" style={{ gridColumn: '1 / -1' }}>
              <label className="sf-label"><MapPin size={11} /> Home Address</label>
              <textarea
                className="sf-input"
                placeholder="Full address..."
                value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
                rows={2}
                style={{ resize: 'none' }}
              />
            </div>
          </div>
        </div>

        {/* ── ACTIVE STATUS TOGGLE ─────────────────────────────── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 18px',
          background: formData.isActive ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.06)',
          border: `1px solid ${formData.isActive ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
          borderRadius: '14px',
          transition: 'all 0.25s',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '38px', height: '38px', borderRadius: '11px', flexShrink: 0,
              background: formData.isActive ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {formData.isActive
                ? <CheckCircle2 size={20} color="#10B981" />
                : <XCircle size={20} color="#EF4444" />
              }
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#F1F5F9' }}>
                {formData.isActive ? 'Active Staff Member' : 'Inactive / Off Duty'}
              </div>
              <div style={{ fontSize: '10px', color: '#64748B', fontWeight: 500, marginTop: '2px' }}>
                {formData.isActive
                  ? 'Will appear in POS order assignment'
                  : 'Hidden from POS order assignment'}
              </div>
            </div>
          </div>

          {/* Premium pill toggle */}
          <button
            type="button"
            onClick={() => setFormData(p => ({ ...p, isActive: !p.isActive }))}
            style={{
              width: '52px', height: '28px', borderRadius: '999px', border: 'none',
              cursor: 'pointer', transition: 'all 0.25s', flexShrink: 0,
              background: formData.isActive
                ? 'linear-gradient(135deg, #10B981, #34D399)'
                : 'rgba(255,255,255,0.08)',
              boxShadow: formData.isActive ? '0 4px 14px rgba(16,185,129,0.35)' : 'none',
              position: 'relative',
            }}
          >
            <div style={{
              width: '22px', height: '22px', borderRadius: '50%', background: '#fff',
              position: 'absolute', top: '3px',
              left: formData.isActive ? '27px' : '3px',
              transition: 'left 0.25s cubic-bezier(0.34,1.56,0.64,1)',
              boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
            }} />
          </button>
        </div>

        {/* ── ACTION BUTTONS ───────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px', paddingTop: '4px' }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: '13px', borderRadius: '12px', cursor: 'pointer',
              border: '1.5px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.03)',
              color: '#64748B', fontSize: '12px', fontWeight: 700,
              letterSpacing: '0.05em', textTransform: 'uppercase',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.07)'; (e.currentTarget as HTMLElement).style.color = '#94A3B8'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)'; (e.currentTarget as HTMLElement).style.color = '#64748B'; }}
          >
            Cancel
          </button>
          <Button
            type="submit"
            loading={loading}
            style={{
              padding: '13px', borderRadius: '12px', border: 'none',
              background: 'linear-gradient(135deg, #6366F1, #818CF8)',
              color: '#fff', fontSize: '13px', fontWeight: 800,
              letterSpacing: '0.04em', textTransform: 'uppercase',
              boxShadow: '0 8px 24px rgba(99,102,241,0.35)',
              cursor: 'pointer', transition: 'all 0.15s',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            } as any}
          >
            {initialData ? '✓ Update Staff Member' : '+ Add Staff Member'}
          </Button>
        </div>

      </div>
    </form>
  );
};
