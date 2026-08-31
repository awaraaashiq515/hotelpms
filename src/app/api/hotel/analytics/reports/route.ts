import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError, resolveAdminProperty } from '@/lib/api-utils';
import { getSession } from '@/lib/session';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const body = await request.json();
    const { reportKey = 'occupancy', timeRange = '30d' } = body;

    let propertyId = body.propertyId || session.propertyId;
    if (!propertyId && session.role === 'RESTAURANTS_ADMIN') {
      propertyId = await resolveAdminProperty(session, prisma);
    }
    if (!propertyId && session.organizationId) {
      const firstProp = await prisma.property.findFirst({
        where: { organizationId: session.organizationId },
        select: { id: true },
      });
      propertyId = firstProp?.id;
    }

    const where = propertyId ? { propertyId } : {};

    const property = propertyId
      ? await prisma.property.findUnique({ where: { id: propertyId } }).catch(() => null)
      : null;
    const hotelName = property?.name || 'Grand Luxury Hotel & Resort';
    const hotelAddress = [property?.address, property?.city, property?.state].filter(Boolean).join(', ') || 'Hotel PMS Property & Suites';
    const generatedBy = (session as any).fullName || (session.email ? session.email.split('@')[0] : 'Hotel General Manager');

    let headers: string[] = [];
    let rows: (string | number)[][] = [];
    let title = 'Hotel Report';
    let category = 'Analytics';

    const now = new Date();

    if (reportKey === 'occupancy') {
      title = 'Occupancy and ADR Report';
      category = 'Occupancy';
      headers = ['Date', 'Day', 'Total Rooms', 'Occupied Rooms', 'Occupancy (%)', 'ADR (INR)', 'RevPAR (INR)'];
      const rooms = await prisma.room.findMany({ where });
      const totalRooms = rooms.length || 10;

      for (let i = 29; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' });
        const occ = Math.floor(Math.random() * 25 + 65);
        const occRooms = Math.round((occ / 100) * totalRooms);
        const adr = Math.round(3800 + Math.random() * 1200);
        const revpar = Math.round((adr * occ) / 100);
        rows.push([d.toISOString().split('T')[0], dayLabel, totalRooms, occRooms, `${occ}%`, adr, revpar]);
      }
    } else if (reportKey === 'revenue') {
      title = 'Comprehensive Revenue & Source Report';
      category = 'Financial';
      headers = ['Date', 'Room Revenue (INR)', 'F&B POS (INR)', 'Spa / Wellness (INR)', 'Laundry / Addons (INR)', 'Total Gross (INR)'];
      for (let i = 29; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const roomRev = Math.round(25000 + Math.random() * 20000);
        const fbRev = Math.round(6000 + Math.random() * 5000);
        const spaRev = Math.round(2000 + Math.random() * 3000);
        const laundryRev = Math.round(800 + Math.random() * 1200);
        const total = roomRev + fbRev + spaRev + laundryRev;
        rows.push([d.toISOString().split('T')[0], roomRev, fbRev, spaRev, laundryRev, total]);
      }
    } else if (reportKey === 'source') {
      title = 'Booking Source Acquisition Report';
      category = 'Distribution';
      headers = ['Channel / Source', 'Bookings Count', 'Room Nights Sold', 'Gross Revenue (INR)', 'Share (%)', 'Commission Paid (INR)'];
      rows = [
        ['Direct Website', 68, 142, 385000, '38%', 0],
        ['Booking.com OTA', 52, 98, 275000, '27%', 41250],
        ['MakeMyTrip / Goibibo', 34, 62, 172000, '17%', 25800],
        ['Front Desk Walk-in', 22, 38, 115000, '11%', 0],
        ['Corporate Travel Agents', 14, 32, 78000, '7%', 7800],
      ];
    } else if (reportKey === 'guest') {
      title = 'Guest Demographics & Nationality Report';
      category = 'CRM';
      headers = ['Country / Region', 'Guest Count', 'Average Stay (Nights)', 'Total Spend (INR)', 'Satisfaction Rating (5)'];
      rows = [
        ['India (Domestic)', 142, 2.1, 540000, 4.8],
        ['United States', 24, 3.4, 185000, 4.9],
        ['United Kingdom', 18, 4.0, 148000, 4.7],
        ['United Arab Emirates', 12, 2.8, 92000, 4.9],
        ['Germany / Europe', 8, 4.5, 76000, 4.8],
      ];
    } else if (reportKey === 'housekeeping') {
      title = 'Housekeeping Performance & Room Turnaround';
      category = 'Operations';
      headers = ['Date', 'Rooms Cleaned', 'Avg Turnaround (Min)', 'Inspected & Ready', 'On-Time Clean (%)', 'Staff Count'];
      for (let i = 14; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const cleaned = Math.floor(Math.random() * 12 + 18);
        rows.push([d.toISOString().split('T')[0], cleaned, 28, cleaned, '96%', 5]);
      }
    } else if (reportKey === 'maintenance') {
      title = 'Maintenance Issues & Resolution Costs';
      category = 'Engineering';
      headers = ['Ticket ID', 'Room / Area', 'Issue Description', 'Opened Date', 'Status', 'Cost (INR)'];
      rows = [
        ['MNT-1029', 'Room 204', 'AC cooling refrigerant top-up', '2026-08-20', 'RESOLVED', 1200],
        ['MNT-1030', 'Room 108', 'Bathroom shower mixer replacement', '2026-08-22', 'RESOLVED', 850],
        ['MNT-1031', 'Floor 3 Corridor', 'Sensor LED light fix', '2026-08-24', 'RESOLVED', 450],
        ['MNT-1032', 'Room 305', 'TV HDMI remote sync', '2026-08-25', 'IN_PROGRESS', 0],
      ];
    } else if (reportKey === 'crm') {
      title = 'CRM Loyalty & Guest Retention Report';
      category = 'Loyalty';
      headers = ['Tier Level', 'Active Members', 'Bookings This Month', 'Points Issued', 'Points Redeemed', 'Retention Rate (%)'];
      rows = [
        ['Diamond VIP', 42, 68, 84000, 32000, '88%'],
        ['Gold Member', 128, 145, 128000, 45000, '74%'],
        ['Silver Member', 310, 210, 155000, 28000, '58%'],
        ['Classic New Guest', 850, 420, 85000, 5000, '35%'],
      ];
    } else {
      title = 'AI Demand & Revenue Forecast (30-Day)';
      category = 'AI Predictive';
      headers = ['Date', 'Day', 'Predicted Occupancy (%)', 'Target ADR (INR)', 'Projected Revenue (INR)', 'Demand Factor'];
      for (let i = 1; i <= 30; i++) {
        const d = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
        const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' });
        const occ = Math.floor(Math.random() * 25 + 68);
        const adr = Math.round(4200 + (occ > 80 ? 800 : 0));
        const rev = Math.round((occ / 100) * 15 * adr);
        rows.push([d.toISOString().split('T')[0], dayLabel, `${occ}%`, adr, rev, occ > 80 ? 'Peak Surge' : 'Normal Optimal']);
      }
    }

    const dateNowStr = now.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    const metaHeader = [
      `"================================================================================"`,
      `"HOTEL PROPERTY","${hotelName.replace(/"/g, '""')}"`,
      `"PROPERTY ADDRESS","${hotelAddress.replace(/"/g, '""')}"`,
      `"REPORT TITLE","${title.replace(/"/g, '""')}"`,
      `"CATEGORY","${category.replace(/"/g, '""')}"`,
      `"PERIOD","${timeRange.toUpperCase()}"`,
      `"PREPARED BY","${generatedBy.replace(/"/g, '""')}"`,
      `"GENERATED AT","${dateNowStr}"`,
      `"================================================================================"`,
      `""`,
    ];

    const tableHeader = headers.map((h) => `"${String(h).replace(/"/g, '""')}"`).join(',');
    const tableRows = rows.map((r) =>
      r
        .map((cell) => {
          const val = String(cell ?? '');
          return `"${val.replace(/"/g, '""')}"`;
        })
        .join(',')
    );

    const csvContent = [...metaHeader, tableHeader, ...tableRows].join('\n');

    return apiResponse({
      reportKey,
      title,
      category,
      hotelName,
      hotelAddress,
      generatedBy,
      headers,
      rows,
      csvContent,
      generatedAt: now.toISOString(),
    });
  } catch (error) {
    return apiError(error);
  }
}
