import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PATCH /api/spa/bookings/[bookingId] — Status update, payment update
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    const { bookingId } = await params;
    const body = await req.json();

    const booking = await prisma.spaBooking.update({
      where: { id: bookingId },
      data: {
        ...(body.status !== undefined && { status: body.status }),
        ...(body.paymentStatus !== undefined && { paymentStatus: body.paymentStatus }),
        ...(body.paymentMode !== undefined && { paymentMode: body.paymentMode }),
        ...(body.therapistId !== undefined && { therapistId: body.therapistId }),
        ...(body.notes !== undefined && { notes: body.notes }),
        ...(body.cancelReason !== undefined && { cancelReason: body.cancelReason }),
        ...(body.scheduledAt !== undefined && { scheduledAt: new Date(body.scheduledAt) }),
      },
      include: {
        service: true,
        therapist: true,
      },
    });

    return NextResponse.json({ booking });
  } catch (error) {
    console.error('[PATCH /api/spa/bookings/[bookingId]]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE /api/spa/bookings/[bookingId]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    const { bookingId } = await params;
    await prisma.spaBooking.delete({ where: { id: bookingId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE /api/spa/bookings/[bookingId]]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
