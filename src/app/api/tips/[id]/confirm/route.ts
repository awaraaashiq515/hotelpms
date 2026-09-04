import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PATCH /api/tips/[id]/confirm — Admin tip confirm/reject kare
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { status, upiRef } = body; // status: CONFIRMED | FAILED

  if (!['CONFIRMED', 'FAILED'].includes(status)) {
    return NextResponse.json({ success: false, message: 'Invalid status' }, { status: 400 });
  }

  const tip = await prisma.tipTransaction.update({
    where: { id },
    data: {
      status,
      ...(upiRef ? { upiRef } : {}),
    },
    include: {
      staffMember: { select: { name: true, designation: true } },
    },
  });

  return NextResponse.json({ success: true, tip });
}
