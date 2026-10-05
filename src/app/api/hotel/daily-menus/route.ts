import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiError, resolveAdminProperty } from '@/lib/api-utils';
import { getSession } from '@/lib/session';
import { getWTUserFromRequest } from '@/lib/walkie-talkie-auth';
import { DEFAULT_DAILY_MEAL_SPREADS, DailyMealSpread } from '@/lib/daily-menus';

export { DEFAULT_DAILY_MEAL_SPREADS };

// Helper to resolve propertyId from request
async function resolvePropertyId(request: NextRequest) {
  const url = new URL(request.url);
  const queryPropertyId = url.searchParams.get('propertyId');
  const queryPropertyCode = url.searchParams.get('propertyCode');

  if (queryPropertyId) return queryPropertyId;

  if (queryPropertyCode) {
    const p = await prisma.property.findFirst({
      where: {
        OR: [
          { code: queryPropertyCode },
          { code: queryPropertyCode.toUpperCase() },
          { code: queryPropertyCode.toLowerCase() },
        ],
      },
      select: { id: true },
    });
    if (p) return p.id;
  }

  const session = await getSession();
  const wtUser = await getWTUserFromRequest(request);

  if (session) {
    const adminProp = await resolveAdminProperty(session, prisma);
    if (adminProp) return adminProp;
    if (session.propertyId) return session.propertyId;
  }

  if (wtUser?.propertyId) return wtUser.propertyId;

  // Fallback to first property in database
  const firstProp = await prisma.property.findFirst({ select: { id: true } });
  return firstProp?.id || null;
}

// ── GET: Fetch Today's Daily Meal Menus ───────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const propertyId = await resolvePropertyId(request);
    if (!propertyId) {
      return NextResponse.json({ success: true, data: DEFAULT_DAILY_MEAL_SPREADS });
    }

    const config = await prisma.roomPortalConfig.findFirst({
      where: { propertyId },
      select: { dailyMealMenu: true, breakfastTimings: true, restaurantTimings: true },
    });

    if (config?.dailyMealMenu) {
      try {
        const parsed = JSON.parse(config.dailyMealMenu);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return NextResponse.json({ success: true, data: parsed });
        }
      } catch {}
    }

    // Return defaults if not yet configured, and seed asynchronously
    prisma.roomPortalConfig.upsert({
      where: { propertyId },
      update: { dailyMealMenu: JSON.stringify(DEFAULT_DAILY_MEAL_SPREADS) },
      create: {
        propertyId,
        dailyMealMenu: JSON.stringify(DEFAULT_DAILY_MEAL_SPREADS),
        breakfastTimings: '07:30 AM - 10:30 AM',
        restaurantTimings: '12:00 PM - 11:00 PM',
      },
    }).catch(() => {});

    return NextResponse.json({ success: true, data: DEFAULT_DAILY_MEAL_SPREADS });
  } catch (error) {
    return apiError(error);
  }
}

// ── POST / PUT: Update Today's Daily Meal Menus ──────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const propertyId = await resolvePropertyId(request);
    if (!propertyId) return apiError(new Error('Property ID is required'), 400);

    const body = await request.json();
    const spreads = body.spreads || body.menus || body.data || body;

    if (!Array.isArray(spreads)) {
      return apiError(new Error('Payload must contain an array of meal spreads'), 400);
    }

    const jsonString = JSON.stringify(spreads);

    const updated = await prisma.roomPortalConfig.upsert({
      where: { propertyId },
      update: { dailyMealMenu: jsonString },
      create: {
        propertyId,
        dailyMealMenu: jsonString,
        breakfastTimings: spreads.find((s: any) => s.mealType === 'BREAKFAST')?.timings || '07:30 AM - 10:30 AM',
        restaurantTimings: '12:00 PM - 11:00 PM',
      },
    });

    return NextResponse.json({
      success: true,
      message: "Today's meal menus updated successfully",
      data: spreads,
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function PUT(request: NextRequest) {
  return POST(request);
}
