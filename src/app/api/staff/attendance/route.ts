import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { apiError, apiResponse } from '@/lib/api-utils';
import { createNotification } from '@/lib/notificationService';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const body = await request.json();
    const { action, note, location, userId: targetId } = body; 

    if (!targetId) return apiError(new Error('Staff ID is required'), 400);

    // 1. Determine if targetId is a User or a StaffMember
    const isStaffMember = await prisma.staffMember.findUnique({ where: { id: targetId } });
    const isUser = !isStaffMember ? await prisma.user.findUnique({ where: { id: targetId } }) : null;

    if (!isStaffMember && !isUser) {
      return apiError(new Error('Employee not found'), 404);
    }

    const whereClause = isStaffMember 
      ? { staffMemberId: targetId, clockOut: null }
      : { userId: targetId, clockOut: null };

    const actualUserId = isUser ? targetId : (isStaffMember?.userId || null);

    if (action === 'clock-in') {
      const existing = await prisma.attendance.findFirst({ where: whereClause });
      if (existing) return apiError(new Error('Already clocked in'), 400);

      const attendance = await prisma.attendance.create({
        data: {
          propertyId: session.propertyId as string,
          userId: isUser ? targetId : null,
          staffMemberId: isStaffMember ? targetId : null,
          clockIn: new Date(),
          status: 'PRESENT',
          note,
          locationIn: location
        }
      });

      // Auto-register location ping to live map tracking
      if (actualUserId && location) {
        await recordLocationPing(actualUserId, session.propertyId as string, location);
      }

      // Notify management about clock-in
      try {
        await createNotification({
          propertyId: session.propertyId as string,
          title: 'Staff Clock-In',
          message: `${isStaffMember?.name || isUser?.fullName || 'Staff'} has clocked in.`,
          type: 'STAFF',
          priority: 'LOW',
          metadata: {
            userId: targetId,
            attendanceId: attendance.id,
            link: '/reports/attendance'
          }
        });
      } catch (e) {}

      return apiResponse(attendance, 'Clocked in successfully');
    } else if (action === 'clock-out') {
      const active = await prisma.attendance.findFirst({
        where: whereClause,
        orderBy: { clockIn: 'desc' }
      });

      if (!active) return apiError(new Error('No active session found'), 400);

      const attendance = await prisma.attendance.update({
        where: { id: active.id },
        data: {
          clockOut: new Date(),
          locationOut: location
        }
      });

      // Auto-register location ping to live map tracking
      if (actualUserId && location) {
        await recordLocationPing(actualUserId, session.propertyId as string, location);
      }

      // Notify management about clock-out
      try {
        await createNotification({
          propertyId: session.propertyId as string,
          title: 'Staff Clock-Out',
          message: `${isStaffMember?.name || isUser?.fullName || 'Staff'} has clocked out.`,
          type: 'STAFF',
          priority: 'LOW',
          metadata: {
            userId: targetId,
            attendanceId: attendance.id,
            link: '/reports/attendance'
          }
        });
      } catch (e) {}

      return apiResponse(attendance, 'Clocked out successfully');
    }

    return apiError(new Error('Invalid action'), 400);
  } catch (error) {
    return apiError(error);
  }
}

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

async function recordLocationPing(userId: string, propertyId: string, locationStr: string) {
  const [latStr, lngStr] = locationStr.split(',');
  const lat = parseFloat(latStr);
  const lng = parseFloat(lngStr);
  if (isNaN(lat) || isNaN(lng)) return;

  try {
    const settings = await (prisma as any).staffLocationSettings.findUnique({
      where: { propertyId }
    });
    
    let distanceFromBase = 0;
    let isOutOfRange = false;

    if (settings && (settings.baseLat !== 0 || settings.baseLng !== 0)) {
      distanceFromBase = haversineMetres(settings.baseLat, settings.baseLng, lat, lng);
      isOutOfRange = distanceFromBase > settings.alertDistanceMeters;
    }

    await (prisma as any).staffLocation.create({
      data: {
        userId,
        propertyId,
        lat,
        lng,
        distanceFromBase,
        isOutOfRange
      }
    });
  } catch (err) {
    console.error('Failed to auto-create StaffLocation ping:', err);
  }
}
