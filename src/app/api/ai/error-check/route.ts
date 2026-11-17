import { NextRequest } from 'next/server';
import { runErrorCheck, checkClaudeHealth, getAnthropicApiKey } from '@/lib/claude';
import { apiResponse, apiError } from '@/lib/api-utils';
import { prisma } from '@/lib/prisma';

// POST /api/ai/error-check
// Body: { checkType: 'billing' | 'rooms' | 'inventory' | 'staff' | 'health' }
export async function POST(req: NextRequest) {
  try {
    const { checkType } = await req.json();

    const apiKey = await getAnthropicApiKey();
    if (!apiKey) {
      return apiError('Claude API key not configured. Add it in Super Admin Settings > Notifications or ANTHROPIC_API_KEY in .env', 400);
    }

    // Health check (API connectivity test)
    if (checkType === 'health') {
      const health = await checkClaudeHealth();
      return apiResponse(health);
    }

    // Gather data from DB based on check type
    const { data, context } = await gatherCheckData(checkType);

    // Run Claude error check
    const result = await runErrorCheck(checkType, data, context);

    return apiResponse({
      checkType,
      ...result,
      checkedAt: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error('[AI Error Check]', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return apiError(message, 500);
  }
}

// GET /api/ai/error-check?type=billing
// Quick shorthand via query param
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const checkType = searchParams.get('type') || 'health';

  // Delegate to POST logic
  const fakeReq = new NextRequest(req.url, {
    method: 'POST',
    body: JSON.stringify({ checkType }),
  });
  return POST(fakeReq);
}

// ─── Data Gatherers ─────────────────────────────────────────────────────────

async function gatherCheckData(checkType: string): Promise<{ data: unknown; context: string }> {
  switch (checkType) {
    case 'billing': {
      const orders = await (prisma as any).posOrder?.findMany({
        where: { paymentStatus: 'PENDING' },
        take: 50,
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          status: true,
          total: true,
          createdAt: true,
          paymentStatus: true,
        },
      }).catch(() => []);

      return {
        data: { pendingOrders: orders, count: orders.length },
        context: 'Check for orders that have been pending too long, missing payments, or unusual amounts.',
      };
    }

    case 'rooms': {
      const rooms = await (prisma as any).room?.findMany({
        take: 100,
        select: {
          id: true,
          roomNumber: true,
          status: true,
          housekeepingStatus: true,
        },
      }).catch(() => []);

      return {
        data: { rooms, count: rooms.length },
        context: 'Check for rooms stuck in wrong status, dirty rooms not assigned for cleaning, etc.',
      };
    }

    case 'inventory': {
      // Try inventory model — adjust field names to match your schema
      const items = await (prisma as any).inventoryItem?.findMany({
        take: 100,
        select: { id: true, name: true, quantity: true, minStock: true, unit: true },
      }).catch(() => []) ?? [];

      return {
        data: { items, count: items.length },
        context: 'Find items below minimum stock level, negative quantities, or items about to expire.',
      };
    }

    case 'staff': {
      const staff = await (prisma as any).staffMember?.findMany({
        take: 50,
        select: { id: true, name: true, role: true, status: true },
      }).catch(() => []) ?? [];

      return {
        data: { staff, count: staff.length },
        context: 'Check for staff attendance issues, missing attendance records, or role mismatches.',
      };
    }

    case 'reservations': {
      const reservations = await (prisma as any).reservation?.findMany({
        where: {
          checkIn: { lte: new Date() },
          status: { notIn: ['CHECKED_IN', 'CANCELLED', 'CHECKED_OUT'] },
        },
        take: 50,
      }).catch(() => []) ?? [];

      return {
        data: { reservations, count: reservations.length },
        context: 'Find reservations that should have checked in but are still pending.',
      };
    }

    default:
      return {
        data: { message: `Unknown check type: ${checkType}` },
        context: 'General system health check.',
      };
  }
}

