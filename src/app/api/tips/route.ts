import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/tips — Admin: sabhi tips list
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const propertyId = searchParams.get('propertyId');
  const staffMemberId = searchParams.get('staffMemberId');
  const status = searchParams.get('status');
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  if (!propertyId) {
    return NextResponse.json({ success: false, message: 'propertyId required' }, { status: 400 });
  }

  const where: Record<string, unknown> = { propertyId };
  if (staffMemberId) where.staffMemberId = staffMemberId;
  if (status) where.status = status;
  if (from || to) {
    where.createdAt = {};
    if (from) (where.createdAt as Record<string, unknown>).gte = new Date(from);
    if (to) (where.createdAt as Record<string, unknown>).lte = new Date(to);
  }

  const tips = await prisma.tipTransaction.findMany({
    where,
    include: {
      staffMember: {
        select: {
          id: true,
          name: true,
          designation: true,
          upiId: true,
          upiName: true,
          avatarUrl: true,
          user: { select: { avatarUrl: true } },
        },
      },
      guest: { select: { id: true, firstName: true, lastName: true, mobile: true, avatarUrl: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Summary stats
  const totalAmount = tips.filter((t: { status: string; amount: number }) => t.status !== 'FAILED').reduce((s: number, t: { status: string; amount: number }) => s + t.amount, 0);
  const confirmedAmount = tips.filter((t: { status: string; amount: number }) => t.status === 'CONFIRMED').reduce((s: number, t: { status: string; amount: number }) => s + t.amount, 0);

  return NextResponse.json({ success: true, tips, totalAmount, confirmedAmount });
}

// POST /api/tips — Guest tip submit kare
export async function POST(req: NextRequest) {
  const body = await req.json();
  let { propertyId, staffMemberId, guestId, guestName, guestPhone, amount, note, orderNo } = body;

  if (!staffMemberId || !amount || amount <= 0) {
    return NextResponse.json({ success: false, message: 'staffMemberId and amount are required' }, { status: 400 });
  }

  // Auto-resolve propertyId from staffMember if missing
  if (!propertyId) {
    const staff = await prisma.staffMember.findUnique({
      where: { id: staffMemberId },
      select: { propertyId: true },
    });
    propertyId = staff?.propertyId;
  }

  if (!propertyId) {
    return NextResponse.json({ success: false, message: 'propertyId required' }, { status: 400 });
  }

  // Check if property tipping enabled
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    select: { tippingEnabled: true },
  });

  const fullNote = [orderNo ? `Order: ${orderNo}` : null, note].filter(Boolean).join(' · ');

  const tip = await prisma.tipTransaction.create({
    data: {
      propertyId,
      staffMemberId,
      guestId: guestId || null,
      guestName: guestName || null,
      guestPhone: guestPhone || null,
      amount: parseFloat(amount),
      note: fullNote || null,
      status: 'PENDING',
    },
    include: {
      staffMember: { select: { id: true, name: true, designation: true, upiId: true, upiName: true } },
    },
  });

  return NextResponse.json({ success: true, tip });
}
