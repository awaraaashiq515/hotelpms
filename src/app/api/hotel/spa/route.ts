import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError, getMultiTenantWhere, resolveAdminProperty } from '@/lib/api-utils';
import { getSession } from '@/lib/session';

// ── Helper: resolve propertyId (same pattern as laundry/room-service) ─────────
async function getEffectivePropertyId(req: NextRequest, session: any, bodyPropertyId?: string): Promise<string | null> {
  const { searchParams } = new URL(req.url);
  const paramPropId = searchParams.get('propertyId') || bodyPropertyId;

  // 1. Explicit propertyId param
  if (paramPropId && paramPropId.length > 5 && paramPropId !== 'null' && paramPropId !== 'undefined') {
    return paramPropId;
  }

  // 2. Session-based resolution
  if (session) {
    const adminProp = await resolveAdminProperty(session, prisma);
    if (adminProp) return adminProp;
  }

  // 3. Fallback to hotel123 / first HOTEL property
  const hotelProp = await (prisma as any).property.findFirst({
    where: { type: 'HOTEL' },
    select: { id: true },
  }).catch(() => null);
  if (hotelProp) return hotelProp.id;

  // 4. Absolute last resort — first property
  const firstProp = await (prisma as any).property.findFirst({ select: { id: true } }).catch(() => null);
  return firstProp?.id || null;
}

// ── GET ───────────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'appointments';
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

    const propertyId = await getEffectivePropertyId(req, session);
    if (!propertyId) return apiError(new Error('No property context'), 400);

    if (type === 'services') {
      const services = await prisma.spaService.findMany({
        where: { propertyId, isActive: true },
        orderBy: { category: 'asc' },
      });
      return apiResponse(services);
    }

    if (type === 'therapists') {
      const therapists = await prisma.spaTherapist.findMany({
        where: { propertyId, isActive: true },
        orderBy: { name: 'asc' },
      });
      return apiResponse(therapists);
    }

    // Default: appointments
    const appointments = await prisma.spaAppointment.findMany({
      where: {
        propertyId,
        ...(date !== 'all' ? { bookingDate: date } : {}),
      },
      include: { service: true, therapist: true },
      orderBy: { bookingTime: 'asc' },
    });
    return apiResponse(appointments);
  } catch (error: any) {
    console.error('Spa GET error:', error);
    return apiError(error);
  }
}

// ── POST ──────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    const body = await req.json();
    const { type, ...data } = body;

    const propertyId = await getEffectivePropertyId(req, session, data.propertyId);
    if (!propertyId) return apiError(new Error('No property context'), 400);

    if (type === 'service') {
      const service = await prisma.spaService.create({
        data: {
          propertyId,
          name: data.name,
          category: data.category || 'Massage',
          duration: Number(data.duration) || 60,
          price: Number(data.price) || 0,
          description: data.description || '',
          isActive: true,
        },
      });
      return apiResponse(service);
    }

    if (type === 'therapist') {
      const therapist = await prisma.spaTherapist.create({
        data: {
          propertyId,
          name: data.name,
          gender: data.gender || 'Female',
          specialty: data.specialty || '',
          phone: data.phone || '',
          rating: Number(data.rating) || 4.9,
          isActive: true,
        },
      });
      return apiResponse(therapist);
    }


    // Default: appointment
    const appointment = await prisma.spaAppointment.create({
      data: {
        propertyId,
        serviceId: data.serviceId || null,
        therapistId: data.therapistId || null,
        guestName: data.guestName,
        guestRoom: data.guestRoom,
        guestPhone: data.guestPhone || '',
        serviceName: data.serviceName,
        therapistName: data.therapistName || '',
        bookingDate: data.bookingDate,
        bookingTime: data.bookingTime,
        duration: Number(data.duration) || 60,
        amount: Number(data.amount) || 0,
        paymentType: data.paymentType || 'ROOM_CHARGE',
        status: 'CONFIRMED',
        notes: data.notes || '',
      },
      include: { service: true, therapist: true },
    });

    // Auto post to room folio if ROOM_CHARGE
    if (data.paymentType === 'ROOM_CHARGE' && data.guestRoom) {
      try {
        const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
        await fetch(`${baseUrl}/api/hotel/post-to-room`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomNumber: data.guestRoom,
            propertyId,
            category: 'SPA',
            description: `Spa: ${data.serviceName}`,
            amount: Number(data.amount) || 0,
            reference: appointment.id,
          }),
        });
      } catch { /* Folio link fails silently */ }
    }

    return apiResponse(appointment);
  } catch (error: any) {
    console.error('Spa POST error:', error);
    return apiError(error);
  }
}

// ── PATCH ─────────────────────────────────────────────────────────────────────
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, type, ...updates } = body;

    if (!id) return apiError(new Error('ID required'), 400);

    if (type === 'service') {
      const service = await prisma.spaService.update({ where: { id }, data: updates });
      return apiResponse(service);
    }
    if (type === 'therapist') {
      const therapist = await prisma.spaTherapist.update({ where: { id }, data: updates });
      return apiResponse(therapist);
    }

    const appointment = await prisma.spaAppointment.update({
      where: { id },
      data: updates,
      include: { service: true, therapist: true },
    });
    return apiResponse(appointment);
  } catch (error: any) {
    return apiError(error);
  }
}

// ── DELETE ────────────────────────────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const type = searchParams.get('type') || 'appointment';

    if (!id) return apiError(new Error('ID required'), 400);

    if (type === 'service') {
      await prisma.spaService.update({ where: { id }, data: { isActive: false } });
    } else if (type === 'therapist') {
      await prisma.spaTherapist.update({ where: { id }, data: { isActive: false } });
    } else {
      await prisma.spaAppointment.update({ where: { id }, data: { status: 'CANCELLED' } });
    }

    return apiResponse({ success: true });
  } catch (error: any) {
    return apiError(error);
  }
}
