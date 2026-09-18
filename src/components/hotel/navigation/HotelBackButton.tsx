'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ArrowLeft, ChevronRight, Home } from 'lucide-react';

const SECTION_LABELS: Record<string, string> = {
  hotel: 'Hotel Dashboard',
  payroll: 'Payroll',
  settings: 'Settings',
  staff: 'Staff Management',
  attendance: 'Attendance',
  location: 'Staff Location',
  'attendance-location': 'Attendance Location',
  revenue: 'Revenue Management',
  rooms: 'Rooms & Types',
  board: 'Room Board',
  bookings: 'Bookings & Reservations',
  guests: 'Guest Management',
  housekeeping: 'Housekeeping',
  inventory: 'Inventory & Stock',
  expenses: 'Expenses',
  billing: 'Billing & Folios',
  invoices: 'Invoices',
  accounts: 'Accounts & Finance',
  'cash-book': 'Cash Book',
  'day-book': 'Day Book',
  ledger: 'General Ledger',
  reports: 'Reports & Analytics',
  analytics: 'Analytics',
  checkout: 'Checkout Desk',
  checkin: 'Check-in Desk',
  calendar: 'Room Calendar',
  maintenance: 'Maintenance',
  engineering: 'Engineering',
  'channel-manager': 'Channel Manager',
  'ai-concierge': 'AI Concierge',
  vendor: 'Vendors',
  vouchers: 'Vouchers',
  singers: 'Singers & Entertainment',
  'smart-hotel': 'Smart Hotel IoT',
  banquet: 'Banquet & Events',
  spa: 'Spa & Wellness',
  'spa-owners': 'Spa Owners',
  pool: 'Pool & Recreation',
  laundry: 'Laundry Service',
  'lost-found': 'Lost & Found',
  loyalty: 'Loyalty Program',
  'night-audit': 'Night Audit',
  notifications: 'Notifications',
  'operations-dashboard': 'Operations',
  products: 'Products & POS',
  purchasing: 'Purchasing',
  'room-portal-admin': 'Room Portal Admin',
  security: 'Security & Access',
  subscription: 'Subscription & Plan',
  'super-admin': 'Super Admin',
  tips: 'Tips & Gratuities',
  hr: 'Human Resources',
  agents: 'Travel Agents',
  'agent-bookings': 'Agent Bookings',
  'email-bookings': 'Email Bookings',
  'booking-engine': 'Direct Booking Engine',
};

function formatSegmentLabel(segment: string): string {
  if (SECTION_LABELS[segment]) return SECTION_LABELS[segment];
  // If it looks like an ID (UUID, starts with prefix + number, etc.), label as Details
  if (/^[a-zA-Z0-9_-]{12,}$/.test(segment) || /^(chk_|bk_|usr_|inv_|rm_)/i.test(segment) || /^\d+$/.test(segment)) {
    return 'Details';
  }
  // Title-case slug
  return segment
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function HotelBackButton({ className = '' }: { className?: string }) {
  const pathname = usePathname();
  const router = useRouter();

  // If on main /hotel dashboard, no back button needed
  if (!pathname || pathname === '/hotel' || pathname === '/hotel/') {
    return null;
  }

  const segments = pathname.split('/').filter(Boolean); // e.g. ['hotel', 'payroll']
  
  // Calculate parent href and label
  let parentHref = '/hotel';
  let backLabel = 'Back to Hotel Dashboard';

  if (segments.length > 2) {
    const parentSegments = segments.slice(0, -1);
    parentHref = '/' + parentSegments.join('/');
    const parentKey = parentSegments[parentSegments.length - 1];
    const parentTitle = formatSegmentLabel(parentKey);
    backLabel = `Back to ${parentTitle}`;
  }

  // Generate breadcrumb items
  const breadcrumbs: { label: string; href: string }[] = [];
  let accumulatedPath = '';
  for (let i = 1; i < segments.length; i++) {
    const seg = segments[i];
    accumulatedPath += `/${seg}`;
    breadcrumbs.push({
      label: formatSegmentLabel(seg),
      href: `/hotel${accumulatedPath === `/${seg}` ? `/${seg}` : accumulatedPath}`,
    });
  }

  const handleBackClick = (e: React.MouseEvent) => {
    if (
      typeof window !== 'undefined' &&
      window.history.length > 1 &&
      document.referrer &&
      document.referrer.includes(window.location.host)
    ) {
      e.preventDefault();
      router.back();
    }
  };

  return (
    <div className={`flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-slate-800/80 mb-5 ${className}`}>
      <div className="flex items-center gap-3 flex-wrap">
        <Link
          href={parentHref}
          onClick={handleBackClick}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 hover:border-slate-600 text-xs font-bold transition-all shadow-sm group"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform text-indigo-400" />
          <span>{backLabel}</span>
        </Link>

        {/* Breadcrumb Path */}
        <nav aria-label="Breadcrumbs" className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400">
          <Link
            href="/hotel"
            className="hover:text-slate-200 transition-colors flex items-center gap-1 font-medium"
          >
            <Home size={12} className="text-slate-500" />
            <span>Hotel</span>
          </Link>
          {breadcrumbs.map((crumb, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            return (
              <React.Fragment key={crumb.href + idx}>
                <ChevronRight size={11} className="text-slate-600" />
                {isLast ? (
                  <span className="text-slate-200 font-semibold">{crumb.label}</span>
                ) : (
                  <Link
                    href={crumb.href}
                    className="hover:text-slate-200 transition-colors font-medium"
                  >
                    {crumb.label}
                  </Link>
                )}
              </React.Fragment>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
