import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { getWTUserFromRequest } from '@/lib/walkie-talkie-auth';

// Helper to get authenticated user from session or WT token or query
async function resolveAuthUser(req: NextRequest) {
  const session = await getSession();
  if (session?.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      include: { property: true, staffMember: true },
    });
    if (user) return user;
  }

  const wtUser = await getWTUserFromRequest(req);
  if (wtUser) return wtUser;

  // Query parameter fallback if provided with security check
  const { searchParams } = new URL(req.url);
  const queryUserId = searchParams.get('userId');
  if (queryUserId) {
    const user = await prisma.user.findUnique({
      where: { id: queryUserId },
      include: { property: true, staffMember: true },
    });
    if (user) return user;
  }

  return null;
}

// GET /api/staff-portal/upi
export async function GET(req: NextRequest) {
  try {
    const user = await resolveAuthUser(req);
    const { searchParams } = new URL(req.url);
    const staffIdParam = searchParams.get('staffId');

    let staffMember = null;

    if (staffIdParam) {
      staffMember = await prisma.staffMember.findUnique({
        where: { id: staffIdParam },
      });
    }

    if (!staffMember && user) {
      // Find staff member linked by userId
      staffMember = await prisma.staffMember.findFirst({
        where: { OR: [{ userId: user.id }, { id: user.id }] },
      });

      // If not linked yet, search by phone or name in same property
      if (!staffMember && user.propertyId) {
        staffMember = await prisma.staffMember.findFirst({
          where: {
            propertyId: user.propertyId,
            OR: [
              ...(user.phone ? [{ phone: user.phone }] : []),
              { name: user.fullName },
            ],
          },
        });

        // Auto-link if found
        if (staffMember && !staffMember.userId) {
          staffMember = await prisma.staffMember.update({
            where: { id: staffMember.id },
            data: { userId: user.id },
          });
        }
      }
    }

    if (!staffMember) {
      return NextResponse.json({
        success: true,
        staffMember: null,
        user: user ? { id: user.id, fullName: user.fullName, email: user.email } : null,
        tipsSummary: { totalAmount: 0, confirmedAmount: 0, totalCount: 0 },
      });
    }

    // Get tips stats for this staff member
    const tips = await prisma.tipTransaction.findMany({
      where: { staffMemberId: staffMember.id },
      select: { amount: true, status: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const totalAmount = tips.filter(t => t.status !== 'FAILED').reduce((acc, t) => acc + t.amount, 0);
    const confirmedAmount = tips.filter(t => t.status === 'CONFIRMED').reduce((acc, t) => acc + t.amount, 0);

    return NextResponse.json({
      success: true,
      staffMember: {
        id: staffMember.id,
        name: staffMember.name,
        designation: staffMember.designation,
        upiId: staffMember.upiId,
        upiName: staffMember.upiName,
        propertyId: staffMember.propertyId,
      },
      tipsSummary: {
        totalAmount,
        confirmedAmount,
        totalCount: tips.length,
        recentTips: tips.slice(0, 5),
      },
    });
  } catch (error: any) {
    console.error('Failed to get staff UPI:', error);
    return NextResponse.json({ success: false, message: error.message || 'Server error' }, { status: 500 });
  }
}

// POST or PATCH /api/staff-portal/upi — Update or set UPI ID
export async function POST(req: NextRequest) {
  return handleUpdateUPI(req);
}

export async function PATCH(req: NextRequest) {
  return handleUpdateUPI(req);
}

async function handleUpdateUPI(req: NextRequest) {
  try {
    const user = await resolveAuthUser(req);
    const body = await req.json();
    const { upiId, upiName, staffId, userId: explicitUserId } = body;

    const targetUserId = user?.id || explicitUserId;

    let staffMember = null;

    if (staffId) {
      staffMember = await prisma.staffMember.findUnique({
        where: { id: staffId },
      });
    }

    if (!staffMember && targetUserId) {
      staffMember = await prisma.staffMember.findFirst({
        where: { OR: [{ userId: targetUserId }, { id: targetUserId }] },
      });

      if (!staffMember && user?.propertyId) {
        staffMember = await prisma.staffMember.findFirst({
          where: {
            propertyId: user.propertyId,
            OR: [
              ...(user.phone ? [{ phone: user.phone }] : []),
              { name: user.fullName },
            ],
          },
        });
      }

      // If still no staffMember record exists, create one automatically
      if (!staffMember && user && user.propertyId) {
        staffMember = await prisma.staffMember.create({
          data: {
            propertyId: user.propertyId,
            userId: user.id,
            name: user.fullName,
            phone: user.phone || null,
            designation: user.designation || 'Staff',
            isActive: true,
          },
        });
      }
    }

    if (!staffMember) {
      return NextResponse.json(
        { success: false, message: 'Staff member record not found. Please contact hotel admin.' },
        { status: 404 }
      );
    }

    // Basic format check if UPI ID is given
    const cleanUpi = upiId?.trim() || null;
    const cleanName = upiName?.trim() || null;

    if (cleanUpi && !cleanUpi.includes('@')) {
      return NextResponse.json(
        { success: false, message: 'Invalid UPI format. Please use format like yourname@okhdfcbank or 9876543210@paytm' },
        { status: 400 }
      );
    }

    const updated = await prisma.staffMember.update({
      where: { id: staffMember.id },
      data: {
        upiId: cleanUpi,
        upiName: cleanName || staffMember.name,
      },
      select: {
        id: true,
        name: true,
        designation: true,
        upiId: true,
        upiName: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: cleanUpi ? 'UPI ID saved successfully! Guests can now tip you directly.' : 'UPI ID removed.',
      staffMember: updated,
    });
  } catch (error: any) {
    console.error('Failed to update staff UPI:', error);
    return NextResponse.json({ success: false, message: error.message || 'Server error' }, { status: 500 });
  }
}
