import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { apiError, apiResponse } from '@/lib/api-utils';

function haversineMetres(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000; // Earth radius in metres
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
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const month = searchParams.get('month'); // YYYY-MM format
    const date = searchParams.get('date'); // YYYY-MM-DD format

    const whereClause: any = {
      propertyId: session.propertyId as string
    };

    if (userId) {
      whereClause.userId = userId;
    }

    if (date) {
      const parsedDate = new Date(`${date}T00:00:00`);
      if (!isNaN(parsedDate.getTime())) {
        const { startOfDay, endOfDay } = await import('date-fns');
        whereClause.clockIn = {
          gte: startOfDay(parsedDate),
          lte: endOfDay(parsedDate)
        };
      }
    } else if (month) {
      const parsedDate = new Date(`${month}-01T00:00:00`);
      if (!isNaN(parsedDate.getTime())) {
        const { startOfMonth, endOfMonth } = await import('date-fns');
        whereClause.clockIn = {
          gte: startOfMonth(parsedDate),
          lte: endOfMonth(parsedDate)
        };
      }
    }

    const [attendance, settings, property] = await Promise.all([
      prisma.attendance.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              fullName: true,
              email: true,
              role: { select: { name: true } }
            }
          },
          staffMember: {
            select: {
              name: true,
              designation: true
            }
          }
        },
        orderBy: { clockIn: 'desc' },
        take: 200
      }),
      (prisma as any).staffLocationSettings.findUnique({
        where: { propertyId: session.propertyId as string }
      }),
      prisma.property.findUnique({
        where: { id: session.propertyId as string },
        select: { latitude: true, longitude: true }
      })
    ]);

    const baseLat = settings?.baseLat || property?.latitude || 0;
    const baseLng = settings?.baseLng || property?.longitude || 0;

    // Unify names and calculate distance from base
    const processed = attendance.map((record: any) => {
      let distanceIn: number | null = null;
      let distanceOut: number | null = null;
      let isOutOfRangeIn = false;
      let isOutOfRangeOut = false;

      if (baseLat !== 0 || baseLng !== 0) {
        const threshold = settings?.alertDistanceMeters ?? 500;
        if (record.locationIn) {
          const [latStr, lngStr] = record.locationIn.split(',');
          const lat = parseFloat(latStr);
          const lng = parseFloat(lngStr);
          if (!isNaN(lat) && !isNaN(lng)) {
            distanceIn = haversineMetres(baseLat, baseLng, lat, lng);
            isOutOfRangeIn = distanceIn > threshold;
          }
        }
        if (record.locationOut) {
          const [latStr, lngStr] = record.locationOut.split(',');
          const lat = parseFloat(latStr);
          const lng = parseFloat(lngStr);
          if (!isNaN(lat) && !isNaN(lng)) {
            distanceOut = haversineMetres(baseLat, baseLng, lat, lng);
            isOutOfRangeOut = distanceOut > threshold;
          }
        }
      }

      return {
        ...record,
        employeeName: record.user?.fullName || record.staffMember?.name || 'Unknown',
        employeeRole: record.user?.role?.name || record.staffMember?.designation || 'Staff',
        distanceIn,
        distanceOut,
        isOutOfRangeIn,
        isOutOfRangeOut,
        alertDistanceMeters: settings?.alertDistanceMeters ?? 500
      };
    });

    return apiResponse(processed);
  } catch (error) {
    return apiError(error);
  }
}
