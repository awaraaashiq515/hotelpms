import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError, getMultiTenantWhere, resolveAdminProperty } from '@/lib/api-utils';
import { getSession } from '@/lib/session';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const body = await request.json();
    const { roomTypeId, date: targetDateStr, customBaseRate } = body;

    let propertyId = body.propertyId || session.propertyId;
    if (!propertyId && session.role === 'RESTAURANTS_ADMIN') {
      propertyId = await resolveAdminProperty(session, prisma);
    }

    const targetDate = targetDateStr ? new Date(targetDateStr) : new Date();
    const targetDayStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0);
    const targetDayEnd = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59);

    // Fetch room type & property
    let roomType = null;
    if (roomTypeId && roomTypeId !== 'all') {
      roomType = await prisma.roomType.findUnique({
        where: { id: roomTypeId },
        include: { rooms: true },
      });
      if (roomType && !propertyId) propertyId = roomType.propertyId;
    }

    if (!roomType) {
      roomType = await prisma.roomType.findFirst({
        where: propertyId ? { propertyId } : {},
        include: { rooms: true },
      });
    }

    const baseRate = customBaseRate ? Number(customBaseRate) : (roomType?.baseRate || 3500);

    // Get total rooms and occupancy for that target date
    const allRooms = await prisma.room.findMany({
      where: propertyId ? { propertyId } : {},
    });
    const totalRooms = allRooms.length || 10;

    // Check reservations active on that date
    const reservationsOnDate = await prisma.reservation.findMany({
      where: {
        ...(propertyId ? { propertyId } : {}),
        status: { in: ['CONFIRMED', 'CHECKED_IN'] },
        arrivalDate: { lte: targetDayEnd },
        departureDate: { gte: targetDayStart },
      },
    });

    const bookedRooms = reservationsOnDate.length;
    const occupancyAtDate = totalRooms > 0 ? Math.min(100, Math.round((bookedRooms / totalRooms) * 100)) : 0;

    // Fetch active rules
    const activeRules = await prisma.dynamicPricingRule.findMany({
      where: {
        ...(propertyId ? { propertyId } : {}),
        isActive: true,
      },
      orderBy: { priority: 'asc' },
    });

    const dayOfWeek = targetDate.getDay(); // 0 = Sun, 1 = Mon, ... 5 = Fri, 6 = Sat
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6;

    // Calculate lead time in hours
    const now = new Date();
    const diffHours = Math.max(0, (targetDayStart.getTime() - now.getTime()) / (1000 * 60 * 60));

    let currentRate = baseRate;
    let totalAdjustmentPct = 0;
    const appliedRules: any[] = [];

    for (const rule of activeRules) {
      // Check if rule applies to this room type
      if (rule.roomTypeId && rule.roomTypeId !== roomType?.id) {
        continue;
      }

      let matches = false;
      let reason = '';

      if (rule.ruleType === 'DAY_OF_WEEK') {
        if (isWeekend) {
          matches = true;
          reason = 'Weekend pricing adjustment';
        }
      } else if (rule.ruleType === 'OCCUPANCY') {
        if (rule.condition.includes('>')) {
          const threshold = parseInt(rule.condition.replace(/[^0-9]/g, '')) || 80;
          if (occupancyAtDate >= threshold) {
            matches = true;
            reason = `High occupancy (${occupancyAtDate}% >= ${threshold}%)`;
          }
        } else if (rule.condition.includes('<')) {
          const threshold = parseInt(rule.condition.replace(/[^0-9]/g, '')) || 40;
          if (occupancyAtDate < threshold) {
            matches = true;
            reason = `Low occupancy fill (${occupancyAtDate}% < ${threshold}%)`;
          }
        }
      } else if (rule.ruleType === 'LEAD_TIME') {
        if (diffHours < 24) {
          matches = true;
          reason = `Last-minute booking (< 24 hrs)`;
        }
      } else if (rule.ruleType === 'EVENT' || rule.ruleType === 'DATE_RANGE' || rule.ruleType === 'SEASON') {
        if (rule.startDate && rule.endDate) {
          const start = new Date(rule.startDate);
          const end = new Date(rule.endDate);
          if (targetDayStart >= start && targetDayStart <= end) {
            matches = true;
            reason = `Special Event / Season period`;
          }
        }
      }

      if (matches) {
        let adjValue = 0;
        if (rule.adjustmentType === 'PERCENTAGE') {
          adjValue = (baseRate * rule.adjustment) / 100;
          totalAdjustmentPct += rule.adjustment;
        } else {
          adjValue = rule.adjustment;
          totalAdjustmentPct += (rule.adjustment / baseRate) * 100;
        }

        currentRate += adjValue;
        appliedRules.push({
          ruleName: rule.name,
          type: rule.ruleType,
          adjustment: rule.adjustmentType === 'PERCENTAGE'
            ? `${rule.adjustment > 0 ? '+' : ''}${rule.adjustment}%`
            : `${rule.adjustment > 0 ? '+' : ''}₹${Math.abs(rule.adjustment)}`,
          reason,
        });
      }
    }

    // Apply min/max boundaries if any
    const finalRate = Math.max(500, Math.round(currentRate));
    const adjustmentAmount = finalRate - baseRate;

    let demandLevel: 'LOW' | 'NORMAL' | 'HIGH' | 'PEAK' = 'NORMAL';
    if (occupancyAtDate >= 85 || totalAdjustmentPct >= 25) demandLevel = 'PEAK';
    else if (occupancyAtDate >= 65 || totalAdjustmentPct > 10) demandLevel = 'HIGH';
    else if (occupancyAtDate < 35 || totalAdjustmentPct < 0) demandLevel = 'LOW';

    return apiResponse({
      roomTypeId: roomType?.id || '',
      roomTypeName: roomType?.name || 'Standard Room',
      baseRate,
      finalRate,
      adjustmentAmount,
      adjustmentPct: Math.round(totalAdjustmentPct),
      appliedRules,
      occupancyAtDate,
      demandLevel,
      targetDate: targetDate.toISOString().split('T')[0],
    });
  } catch (error) {
    return apiError(error);
  }
}
