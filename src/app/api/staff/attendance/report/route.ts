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
    const wtUser = await getWTUserFromRequest(request);
    const session = await getSession();
    const userId: string | undefined = wtUser?.id || session?.id || undefined;
    const propertyId: string | undefined = wtUser?.propertyId || session?.propertyId || undefined;

    if (!userId || !propertyId) return apiError(new Error('Unauthorized'), 401);

    const { searchParams } = new URL(request.url);
    const filterUserId = searchParams.get('userId') || null;
    const month = searchParams.get('month');
    const date = searchParams.get('date');

    // ── Build date range ──────────────────────────────────────────────
    let dateFrom: Date;
    let dateTo: Date;

    if (date) {
      const parsedDate = new Date(`${date}T00:00:00`);
      if (!isNaN(parsedDate.getTime())) {
        const { startOfDay, endOfDay } = await import('date-fns');
        dateFrom = startOfDay(parsedDate);
        dateTo = endOfDay(parsedDate);
      } else {
        dateFrom = new Date(); dateFrom.setDate(dateFrom.getDate() - 30);
        dateTo = new Date();
      }
    } else if (month) {
      const parsedDate = new Date(`${month}-01T00:00:00`);
      if (!isNaN(parsedDate.getTime())) {
        const { startOfMonth, endOfMonth } = await import('date-fns');
        dateFrom = startOfMonth(parsedDate);
        dateTo = endOfMonth(parsedDate);
      } else {
        dateFrom = new Date(); dateFrom.setDate(dateFrom.getDate() - 30);
        dateTo = new Date();
      }
    } else {
      dateTo = new Date();
      dateFrom = new Date();
      dateFrom.setDate(dateFrom.getDate() - 30);
    }

    const attendanceWhere: any = {
      propertyId,
      clockIn: { gte: dateFrom, lte: dateTo },
    };
    if (filterUserId) attendanceWhere.userId = filterUserId;

    const [attendance, staffMembers, propertyUsers, property] = await Promise.all([
      prisma.attendance.findMany({
        where: attendanceWhere,
        include: {
          user: { select: { id: true, fullName: true, email: true, role: { select: { name: true } } } },
          staffMember: { select: { id: true, name: true, designation: true } },
        },
        orderBy: { clockIn: 'desc' },
        take: 1000,
      }),
      prisma.staffMember.findMany({
        where: { propertyId, isActive: true },
        select: {
          id: true,
          name: true,
          designation: true,
          userId: true,
          user: { select: { id: true, fullName: true, role: { select: { name: true } } } },
        },
        orderBy: { name: 'asc' },
      }),
      prisma.user.findMany({
        where: { propertyId },
        select: {
          id: true,
          fullName: true,
          role: { select: { name: true } },
        },
      }),
      prisma.property.findUnique({
        where: { id: propertyId },
        select: { latitude: true, longitude: true, targetShiftHours: true },
      }),
    ]);

    // ── Location settings ─────────────────────────────────────────────
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
    const locationEnabled = baseLat !== 0 || baseLng !== 0;

    const getGroupKey = (record: any): string => {
      if (record.staffMemberId) return `sm:${record.staffMemberId}`;
      if (record.userId) return `u:${record.userId}`;
      const name = record.user?.fullName || record.staffMember?.name || 'unknown';
      return `name:${name.toLowerCase().trim()}`;
    };

    // ── Group attendance by staff ─────────────────────────────────────
    const groups = new Map<string, any[]>();
    for (const record of attendance) {
      const key = getGroupKey(record);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(record);
    }

    // ── Aggregate each group ──────────────────────────────────────────
    const aggregated: any[] = [];

    for (const [key, records] of groups) {
      const first = records[0];
      const employeeName = first.user?.fullName || first.staffMember?.name || 'Unknown';
      const employeeRole = first.user?.role?.name || first.staffMember?.designation || 'Staff';

      let totalDurationMs = 0;
      let timeInsideMs = 0;       // time when punched inside range
      let hasActiveSession = false;
      let activeClockIn: any = null;
      let firstClockIn: any = null;
      let latestClockOut: any = null;
      const sessionCount = records.length;

      // Location counters
      let punchesInsideRange = 0;    // clock-ins where staff was inside
      let punchesOutsideRange = 0;   // clock-ins where staff was outside (violations)
      let clockOutsOutside = 0;      // clock-outs outside range
      let lastLocationIn: string | null = null;
      let lastLocationOut: string | null = null;
      let lastDistanceIn: number | null = null;
      let lastDistanceOut: number | null = null;
      let lastIsOutOfRangeIn = false;
      let lastIsOutOfRangeOut = false;

      const sorted = [...records].sort(
        (a, b) => new Date(a.clockIn).getTime() - new Date(b.clockIn).getTime()
      );
      firstClockIn = sorted[0]?.clockIn;

      for (const r of records) {
        const cIn = new Date(r.clockIn);
        const cOut = r.clockOut ? new Date(r.clockOut) : null;
        const sessionMs = cOut ? cOut.getTime() - cIn.getTime() : null;

        if (!cOut) {
          hasActiveSession = true;
          activeClockIn = r.clockIn;
        } else {
          totalDurationMs += sessionMs!;
          latestClockOut = r.clockOut;
        }

        // ── Per-session location analysis ──
        let sessionInRange = true; // assume inside unless proven otherwise

        if (r.locationIn) {
          lastLocationIn = r.locationIn;
          if (locationEnabled) {
            const [latStr, lngStr] = r.locationIn.split(',');
            const lat = parseFloat(latStr), lng = parseFloat(lngStr);
            if (!isNaN(lat) && !isNaN(lng)) {
              const dist = haversineMetres(baseLat, baseLng, lat, lng);
              lastDistanceIn = Math.round(dist);
              if (dist > alertDistanceMeters) {
                punchesOutsideRange++;
                sessionInRange = false;
                lastIsOutOfRangeIn = true;
              } else {
                punchesInsideRange++;
                lastIsOutOfRangeIn = false;
              }
            } else {
              punchesInsideRange++;
            }
          } else {
            punchesInsideRange++;
          }
        }

        if (r.locationOut) {
          lastLocationOut = r.locationOut;
          if (locationEnabled) {
            const [latStr, lngStr] = r.locationOut.split(',');
            const lat = parseFloat(latStr), lng = parseFloat(lngStr);
            if (!isNaN(lat) && !isNaN(lng)) {
              const dist = haversineMetres(baseLat, baseLng, lat, lng);
              lastDistanceOut = Math.round(dist);
              if (dist > alertDistanceMeters) {
                clockOutsOutside++;
                lastIsOutOfRangeOut = true;
              } else {
                lastIsOutOfRangeOut = false;
              }
            }
          }
        }

        // Approximate time inside: if punched in inside range, count that session
        if (sessionInRange && sessionMs) {
          timeInsideMs += sessionMs;
        }
      }

      // Add active session time
      if (hasActiveSession && activeClockIn) {
        const activeMs = Date.now() - new Date(activeClockIn).getTime();
        totalDurationMs += activeMs;
        // Active session - assume inside if no location violation
        timeInsideMs += activeMs;
      }

      const totalDurationHours = totalDurationMs / (1000 * 60 * 60);
      const timeInsideHours = timeInsideMs / (1000 * 60 * 60);
      const extraMinutes = totalDurationMs > 0 ? Math.round((totalDurationHours - targetShiftHours) * 60) : null;

      aggregated.push({
        id: key,
        type: 'attendance' as const,
        staffMemberId: first.staffMemberId || null,
        linkedUserId: first.userId || null,
        employeeName,
        employeeRole,
        clockIn: firstClockIn,
        clockOut: hasActiveSession ? null : latestClockOut,
        isActive: hasActiveSession,
        sessionCount,
        totalDurationMs: totalDurationMs > 0 ? totalDurationMs : null,
        totalDurationHours: totalDurationHours > 0 ? totalDurationHours : null,
        timeInsideMs: timeInsideMs > 0 ? timeInsideMs : null,
        timeInsideHours: timeInsideHours > 0 ? timeInsideHours : null,
        targetShiftHours,
        extraMinutes,
        isComplete: !hasActiveSession && totalDurationMs > 0,
        status: hasActiveSession ? 'ACTIVE' : 'PRESENT',
        // Location
        locationIn: lastLocationIn,
        locationOut: lastLocationOut,
        distanceIn: lastDistanceIn,
        distanceOut: lastDistanceOut,
        isOutOfRangeIn: lastIsOutOfRangeIn,
        isOutOfRangeOut: lastIsOutOfRangeOut,
        locationEnabled,
        punchesInsideRange,
        punchesOutsideRange,       // ← kitni baar bahar gaye (violations)
        clockOutsOutside,
        totalPunches: punchesInsideRange + punchesOutsideRange,
        alertDistanceMeters,
      });
    }

    // Sort: active first, then by name
    aggregated.sort((a, b) => {
      if (a.isActive && !b.isActive) return -1;
      if (!a.isActive && b.isActive) return 1;
      return (a.employeeName || '').localeCompare(b.employeeName || '');
    });

    // ── Build covered staff sets ──────────────────────────────────────
    const staffWithAttendance = new Set<string>();
    const userWithAttendance = new Set<string>();
    aggregated.forEach((r) => {
      if (r.staffMemberId) staffWithAttendance.add(r.staffMemberId);
      if (r.linkedUserId) userWithAttendance.add(r.linkedUserId);
    });

    // ── Absent / No-record rows ───────────────────────────────────────
    const absentRows: any[] = [];
    if (!filterUserId) {
      for (const sm of staffMembers) {
        const covered =
          staffWithAttendance.has(sm.id) ||
          (sm.userId && userWithAttendance.has(sm.userId));
        if (!covered) {
          absentRows.push({
            id: `absent-sm-${sm.id}`,
            type: 'absent',
            staffMemberId: sm.id,
            linkedUserId: sm.userId || null,
            employeeName: sm.user?.fullName || sm.name,
            employeeRole: sm.user?.role?.name || sm.designation || 'Staff',
            clockIn: null,
            clockOut: null,
            isActive: false,
            sessionCount: 0,
            totalDurationMs: null,
            totalDurationHours: null,
            timeInsideMs: null,
            timeInsideHours: null,
            targetShiftHours,
            extraMinutes: null,
            isComplete: false,
            status: 'NO_RECORD',
            locationIn: null,
            locationOut: null,
            locationEnabled,
            punchesInsideRange: 0,
            punchesOutsideRange: 0,
            clockOutsOutside: 0,
            totalPunches: 0,
            alertDistanceMeters,
          });
        }
      }

      for (const u of propertyUsers) {
        const covered =
          userWithAttendance.has(u.id) ||
          staffMembers.some((sm) => sm.userId === u.id);
        if (!covered) {
          absentRows.push({
            id: `absent-u-${u.id}`,
            type: 'absent',
            staffMemberId: null,
            linkedUserId: u.id,
            employeeName: u.fullName || 'Unknown',
            employeeRole: u.role?.name || 'Staff',
            clockIn: null,
            clockOut: null,
            isActive: false,
            sessionCount: 0,
            totalDurationMs: null,
            totalDurationHours: null,
            timeInsideMs: null,
            timeInsideHours: null,
            targetShiftHours,
            extraMinutes: null,
            isComplete: false,
            status: 'NO_RECORD',
            locationIn: null,
            locationOut: null,
            locationEnabled,
            punchesInsideRange: 0,
            punchesOutsideRange: 0,
            clockOutsOutside: 0,
            totalPunches: 0,
            alertDistanceMeters,
          });
        }
      }
    }

    // Return present first, then absent — frontend will split into tabs
    return apiResponse({
      present: aggregated,
      absent: absentRows,
    });
  } catch (error) {
    return apiError(error);
  }
}
