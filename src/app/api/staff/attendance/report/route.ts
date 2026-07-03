import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { getWTUserFromRequest } from '@/lib/walkie-talkie-auth';
import { apiError, apiResponse } from '@/lib/api-utils';

function haversineMetres(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function GET(request: NextRequest) {
  try {
    // Support both WT Bearer token (mobile) and session cookie (web)
    const wtUser = await getWTUserFromRequest(request);
    const session = await getSession();
    const userId: string | undefined = wtUser?.id || session?.id || undefined;
    const propertyId: string | undefined = wtUser?.propertyId || session?.propertyId || undefined;

    if (!userId || !propertyId) return apiError(new Error('Unauthorized'), 401);

    const { searchParams } = new URL(request.url);
    const filterUserId = searchParams.get('userId') || userId; // default to self
    const month = searchParams.get('month'); // YYYY-MM
    const date = searchParams.get('date');   // YYYY-MM-DD

    const whereClause: any = { propertyId };
    if (filterUserId) whereClause.userId = filterUserId;

    if (date) {
      const parsedDate = new Date(`${date}T00:00:00`);
      if (!isNaN(parsedDate.getTime())) {
        const { startOfDay, endOfDay } = await import('date-fns');
        whereClause.clockIn = { gte: startOfDay(parsedDate), lte: endOfDay(parsedDate) };
      }
    } else if (month) {
      const parsedDate = new Date(`${month}-01T00:00:00`);
      if (!isNaN(parsedDate.getTime())) {
        const { startOfMonth, endOfMonth } = await import('date-fns');
        whereClause.clockIn = { gte: startOfMonth(parsedDate), lte: endOfMonth(parsedDate) };
      }
    } else {
      // Default: last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      whereClause.clockIn = { gte: thirtyDaysAgo };
    }

    // Fetch attendance + property (targetShiftHours + location)
    const [attendance, property] = await Promise.all([
      prisma.attendance.findMany({
        where: whereClause,
        include: {
          user: { select: { fullName: true, email: true, role: { select: { name: true } } } },
          staffMember: { select: { name: true, designation: true } }
        },
        orderBy: { clockIn: 'desc' },
        take: 60,
      }),
      prisma.property.findUnique({
        where: { id: propertyId },
        select: { latitude: true, longitude: true, targetShiftHours: true },
      }),
    ]);

    // Try StaffLocationSettings (optional)
    let alertDistanceMeters = 500;
    let baseLat = property?.latitude || 0;
    let baseLng = property?.longitude || 0;
    try {
      const settings = await (prisma as any).staffLocationSettings?.findUnique?.({ where: { propertyId } });
      if (settings?.baseLat) baseLat = settings.baseLat;
      if (settings?.baseLng) baseLng = settings.baseLng;
      if (settings?.alertDistanceMeters) alertDistanceMeters = settings.alertDistanceMeters;
    } catch (_) {}

    const targetShiftHours = property?.targetShiftHours ?? 8;

    const processed = attendance.map((record: any) => {
      // Calculate shift duration
      const clockIn = new Date(record.clockIn);
      const clockOut = record.clockOut ? new Date(record.clockOut) : null;
      const durationMs = clockOut ? clockOut.getTime() - clockIn.getTime() : null;
      const durationHours = durationMs ? durationMs / (1000 * 60 * 60) : null;
      const extraMinutes = durationHours !== null ? Math.round((durationHours - targetShiftHours) * 60) : null;

      let distanceIn: number | null = null;
      let distanceOut: number | null = null;

      if (baseLat !== 0 || baseLng !== 0) {
        if (record.locationIn) {
          const [latStr, lngStr] = record.locationIn.split(',');
          const lat = parseFloat(latStr); const lng = parseFloat(lngStr);
          if (!isNaN(lat) && !isNaN(lng)) distanceIn = haversineMetres(baseLat, baseLng, lat, lng);
        }
        if (record.locationOut) {
          const [latStr, lngStr] = record.locationOut.split(',');
          const lat = parseFloat(latStr); const lng = parseFloat(lngStr);
          if (!isNaN(lat) && !isNaN(lng)) distanceOut = haversineMetres(baseLat, baseLng, lat, lng);
        }
      }

      return {
        id: record.id,
        date: clockIn.toISOString().split('T')[0],
        clockIn: record.clockIn,
        clockOut: record.clockOut,
        durationHours,
        durationMs,
        targetShiftHours,
        extraMinutes,        // positive = overtime, negative = short
        isComplete: !!clockOut,
        employeeName: record.user?.fullName || record.staffMember?.name || 'Unknown',
        employeeRole: record.user?.role?.name || record.staffMember?.designation || 'Staff',
        distanceIn,
        distanceOut,
        alertDistanceMeters,
      };
    });

    return apiResponse(processed);
  } catch (error) {
    return apiError(error);
  }
}

