import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError, getMultiTenantWhere, resolveAdminProperty } from '@/lib/api-utils';
import { getSession } from '@/lib/session';

// ── Default Services for Auto-Seeding ─────────────────────────────────────────
const DEFAULT_SERVICES = [
  { name: 'Swedish Relaxation Massage', category: 'Massage', duration: 60, price: 3500, description: 'A gentle, relaxing full-body massage using long flowing strokes.' },
  { name: 'Deep Tissue Therapy', category: 'Massage', duration: 90, price: 5000, description: 'Intensive massage targeting deep muscle layers for pain relief.' },
  { name: 'Hot Stone Massage', category: 'Massage', duration: 90, price: 5500, description: 'Warm volcanic stones melt tension and improve circulation.' },
  { name: 'Aromatherapy Massage', category: 'Aromatherapy', duration: 75, price: 4500, description: 'Essential oils blended for ultimate relaxation and wellness.' },
  { name: 'Couple Spa Package', category: 'Couple', duration: 90, price: 8000, description: 'Shared spa experience — massage + facial for two.' },
  { name: 'Luxury Facial', category: 'Facial', duration: 60, price: 3000, description: 'Deep cleansing and hydrating facial for glowing skin.' },
  { name: 'Body Wrap & Scrub', category: 'Body', duration: 75, price: 4000, description: 'Full body exfoliation and moisturizing treatment.' },
  { name: 'Manicure & Pedicure', category: 'Beauty', duration: 60, price: 2000, description: 'Complete nail care and polish treatment.' },
  { name: 'Ayurvedic Shirodhara', category: 'Wellness', duration: 60, price: 4500, description: 'Warm medicated oil poured on forehead for deep relaxation.' },
];

const DEFAULT_THERAPISTS = [
  { name: 'Anita Sharma', gender: 'Female', specialty: 'Swedish & Hot Stone', phone: '+91 98765 11111', rating: 4.9 },
  { name: 'Meera Pillai', gender: 'Female', specialty: 'Aromatherapy & Facial', phone: '+91 98765 22222', rating: 4.8 },
  { name: 'Rahul Gupta', gender: 'Male', specialty: 'Deep Tissue', phone: '+91 98765 33333', rating: 4.7 },
  { name: 'Sunita Nair', gender: 'Female', specialty: 'Ayurvedic & Body Wraps', phone: '+91 98765 44444', rating: 5.0 },
];

// ── Helper: resolve propertyId ────────────────────────────────────────────────
async function getEffectivePropertyId(req: NextRequest, session: any, bodyPropertyId?: string): Promise<string | null> {
  const { searchParams } = new URL(req.url);
  const paramPropId = searchParams.get('propertyId') || bodyPropertyId;

  if (paramPropId && paramPropId.length > 5 && paramPropId !== 'null' && paramPropId !== 'undefined') {
    return paramPropId;
  }

  if (session) {
    const adminProp = await resolveAdminProperty(session, prisma);
    if (adminProp) return adminProp;
  }

  const hotelProp = await (prisma as any).property.findFirst({
    where: { type: 'HOTEL' },
    select: { id: true },
  }).catch(() => null);
  if (hotelProp) return hotelProp.id;

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

    // ── SPA OPERATIONAL SETTINGS ──
    if (type === 'settings') {
      const property = await prisma.property.findUnique({
        where: { id: propertyId },
        select: {
          id: true,
          name: true,
          externalSpaEnabled: true,
          spas: { where: { isActive: true }, take: 1 },
        },
      });

      // Default or loaded operational settings
      const settings = {
        propertyId,
        propertyName: property?.name || 'Hotel Spa & Wellness',
        externalSpaEnabled: !!property?.externalSpaEnabled,
        activeExternalSpa: property?.spas?.[0] || null,
        openTime: '09:00',
        closeTime: '21:00',
        slotDuration: 60,
        taxRate: 18,
        allowRoomCharge: true,
        advanceNoticeHours: 1,
        bookingPortalUrl: `http://localhost:3000/room-portal/dashboard/spa`,
      };

      return apiResponse(settings);
    }

    // ── SERVICES & PRICES ──
    if (type === 'services') {
      const property = await prisma.property.findUnique({
        where: { id: propertyId },
        select: {
          externalSpaEnabled: true,
          spas: { where: { isActive: true }, orderBy: { createdAt: 'desc' }, take: 1 },
        },
      });

      if (property?.externalSpaEnabled && property.spas.length > 0) {
        const activeSpa = property.spas[0];
        const services = await prisma.spaService.findMany({
          where: { spaId: activeSpa.id, isActive: true },
          orderBy: { category: 'asc' },
        });
        return apiResponse(services.map(s => ({
          ...s,
          spaId: activeSpa.id,
          providerMode: 'EXTERNAL',
          spaName: activeSpa.name,
        })));
      }

      // Default: In-house hotel spa
      let services = await prisma.spaService.findMany({
        where: { propertyId, spaId: null, isActive: true },
        orderBy: { category: 'asc' },
      });

      // Auto-seed default services if catalog is empty
      if (services.length === 0) {
        for (const s of DEFAULT_SERVICES) {
          await prisma.spaService.create({
            data: {
              propertyId,
              name: s.name,
              category: s.category,
              duration: s.duration,
              price: s.price,
              description: s.description,
              isActive: true,
            }
          });
        }
        services = await prisma.spaService.findMany({
          where: { propertyId, spaId: null, isActive: true },
          orderBy: { category: 'asc' },
        });
      }

      return apiResponse(services.map(s => ({
        ...s,
        providerMode: 'IN_HOUSE',
        spaName: 'In-House Spa',
      })));
    }

    // ── THERAPISTS ──
    if (type === 'therapists') {
      const property = await prisma.property.findUnique({
        where: { id: propertyId },
        select: {
          externalSpaEnabled: true,
          spas: { where: { isActive: true }, orderBy: { createdAt: 'desc' }, take: 1 },
        },
      });

      if (property?.externalSpaEnabled && property.spas.length > 0) {
        const activeSpa = property.spas[0];
        const therapists = await prisma.spaTherapist.findMany({
          where: { spaId: activeSpa.id, isActive: true },
          orderBy: { name: 'asc' },
        });
        return apiResponse(therapists);
      }

      // Default: In-house therapists
      let therapists = await prisma.spaTherapist.findMany({
        where: { propertyId, spaId: null, isActive: true },
        orderBy: { name: 'asc' },
      });

      // Auto-seed default therapists if list is empty
      if (therapists.length === 0) {
        for (const t of DEFAULT_THERAPISTS) {
          await prisma.spaTherapist.create({
            data: {
              propertyId,
              name: t.name,
              gender: t.gender,
              specialty: t.specialty,
              phone: t.phone,
              rating: t.rating,
              isActive: true,
            }
          });
        }
        therapists = await prisma.spaTherapist.findMany({
          where: { propertyId, spaId: null, isActive: true },
          orderBy: { name: 'asc' },
        });
      }

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

    // Save/Update Spa Operational Settings
    if (type === 'settings') {
      if (typeof data.externalSpaEnabled === 'boolean') {
        await prisma.property.update({
          where: { id: propertyId },
          data: { externalSpaEnabled: data.externalSpaEnabled },
        });
      }
      return apiResponse({ success: true }, 'Spa settings saved successfully');
    }

    // Add or Update Spa Service / Price
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
      return apiResponse(service, 'Spa service created successfully', 201);
    }

    // Add Therapist
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
      return apiResponse(therapist, 'Therapist added successfully', 201);
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

    return apiResponse(appointment, 'Appointment booked successfully', 201);
  } catch (error: any) {
    console.error('Spa POST error:', error);
    return apiError(error);
  }
}

// ── PATCH / PUT ───────────────────────────────────────────────────────────────
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, type, ...updates } = body;

    if (!id) return apiError(new Error('ID required'), 400);

    if (type === 'service') {
      const service = await prisma.spaService.update({
        where: { id },
        data: {
          ...(updates.name ? { name: updates.name } : {}),
          ...(updates.category ? { category: updates.category } : {}),
          ...(typeof updates.price !== 'undefined' ? { price: Number(updates.price) } : {}),
          ...(typeof updates.duration !== 'undefined' ? { duration: Number(updates.duration) } : {}),
          ...(typeof updates.isActive !== 'undefined' ? { isActive: !!updates.isActive } : {}),
          ...(updates.description ? { description: updates.description } : {}),
        },
      });
      return apiResponse(service, 'Spa service price & details updated');
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

    return apiResponse({ success: true }, 'Deleted successfully');
  } catch (error: any) {
    return apiError(error);
  }
}
