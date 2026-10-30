import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rawVendorId = searchParams.get('vendorId');
    const vendorId = (rawVendorId && rawVendorId !== 'undefined' && rawVendorId !== 'null') ? rawVendorId : null;

    // 1. Fetch pending enquiries from RentalBikeBooking
    const bookingQuery = {
      include: {
        bike: true,
        vendor: { select: { id: true, name: true, shopName: true } },
      },
      orderBy: { createdAt: 'desc' as const },
    };

    let dbBookings = await prisma.rentalBikeBooking.findMany({
      where: {
        ...(vendorId ? { vendorId } : {}),
        OR: [
          { status: { in: ['PENDING', 'QUOTED', 'NEW'] } },
          { notes: { contains: '[ENQUIRY]' } },
          { notes: { contains: 'AGENT:' } },
          { notes: { contains: 'AGENT_PORTAL' } },
          { notes: { contains: 'HOTEL:' } },
        ],
      },
      ...bookingQuery,
    });

    // Fallback: If filtered by vendorId yielded 0, load active enquiries so vendor sees available leads
    if (dbBookings.length === 0 && vendorId) {
      dbBookings = await prisma.rentalBikeBooking.findMany({
        where: {
          OR: [
            { status: { in: ['PENDING', 'QUOTED', 'NEW'] } },
            { notes: { contains: '[ENQUIRY]' } },
            { notes: { contains: 'AGENT:' } },
            { notes: { contains: 'AGENT_PORTAL' } },
            { notes: { contains: 'HOTEL:' } },
          ],
        },
        ...bookingQuery,
      });
    }

    // Filter into enquiries (PENDING, QUOTED, or notes with [ENQUIRY])
    const pendingEnquiries = dbBookings.map((b) => {
      let days = 1;
      try {
        if (b.startDate && b.endDate) {
          const s = new Date(b.startDate).getTime();
          const e = new Date(b.endDate).getTime();
          if (!isNaN(s) && !isNaN(e) && e > s) {
            days = Math.max(1, Math.round((e - s) / (1000 * 60 * 60 * 24)));
          }
        }
      } catch (_) {
        days = 1;
      }

      let source: 'AGENT_PORTAL' | 'HOTEL_DESK' | 'WALK_IN' | 'ONLINE' = 'WALK_IN';
      if (b.notes?.includes('AGENT:') || b.notes?.includes('AGENT_PORTAL')) source = 'AGENT_PORTAL';
      else if (b.notes?.includes('HOTEL:') || b.notes?.includes('HOTEL_DESK')) source = 'HOTEL_DESK';

      // Parse quantity if in notes
      let quantity = 1;
      try {
        const qtyMatch = b.notes?.match(/Quantity:\s*(\d+)/i);
        if (qtyMatch && qtyMatch[1]) {
          quantity = parseInt(qtyMatch[1], 10) || 1;
        }
      } catch (_) {}

      // If status is PENDING, we present it as NEW so it's prominent in the dashboard
      const displayStatus = b.status === 'PENDING' ? 'NEW' : b.status;

      let createdAtStr = new Date().toISOString();
      try {
        if (b.createdAt instanceof Date) {
          createdAtStr = b.createdAt.toISOString();
        } else if (b.createdAt) {
          createdAtStr = new Date(b.createdAt).toISOString();
        }
      } catch (_) {}

      return {
        id: b.id,
        vendorId: b.vendorId,
        customerName: b.guestName,
        customerPhone: b.guestPhone,
        customerEmail: b.guestEmail || '',
        categoryRequested: b.bike?.category || 'SCOOTER',
        quantity,
        startDate: b.startDate,
        endDate: b.endDate,
        days,
        estimatedBudget: b.totalAmount || 0,
        specialRequirements: b.notes || 'Helmet & Roadside assistance requested',
        source,
        status: displayStatus,
        quotedPrice: b.totalAmount || 0,
        assignedBikeId: b.bikeId,
        bike: b.bike,
        createdAt: createdAtStr,
      };
    });

    return NextResponse.json({
      success: true,
      data: pendingEnquiries,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      vendorId, customerName, customerPhone, customerEmail,
      categoryRequested = 'SCOOTER', startDate, endDate,
      budget, source = 'AGENT_PORTAL', specialRequests,
    } = body;

    if (!customerName || !customerPhone || !startDate || !endDate) {
      return NextResponse.json({ success: false, message: 'Customer name, phone, start and end dates are required' }, { status: 400 });
    }

    // Resolve a vendor or fallback
    let vId = vendorId;
    if (!vId) {
      const defaultVendor = await prisma.bikeRentalVendor.findFirst();
      if (defaultVendor) vId = defaultVendor.id;
    }

    if (!vId) {
      return NextResponse.json({ success: false, message: 'No registered bike vendor available' }, { status: 400 });
    }

    // Find any bike in requested category or fallback to any available bike
    let bike = await prisma.rentalBike.findFirst({
      where: { vendorId: vId, category: categoryRequested, status: 'AVAILABLE' },
    });
    if (!bike) {
      bike = await prisma.rentalBike.findFirst({
        where: { vendorId: vId },
      });
    }

    if (!bike) {
      return NextResponse.json({ success: false, message: 'No bike found for vendor' }, { status: 400 });
    }

    const booking = await prisma.rentalBikeBooking.create({
      data: {
        vendorId: vId,
        bikeId: bike.id,
        guestName: customerName,
        guestPhone: customerPhone,
        guestEmail: customerEmail || null,
        startDate,
        endDate,
        totalAmount: Number(budget) || bike.dailyRate,
        securityDeposit: bike.securityDeposit,
        status: 'PENDING',
        notes: `[ENQUIRY] Source: ${source}. Special notes: ${specialRequests || 'None'}`,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Rental enquiry received successfully',
      data: booking,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, action, assignedBikeId, quotedPrice, reason } = body;

    if (!id || !action) {
      return NextResponse.json({ success: false, message: 'Enquiry id and action are required' }, { status: 400 });
    }

    const booking = await prisma.rentalBikeBooking.findUnique({ where: { id } });
    if (!booking) {
      return NextResponse.json({ success: false, message: 'Enquiry not found' }, { status: 404 });
    }

    if (action === 'ACCEPT') {
      const bikeIdToUse = assignedBikeId || booking.bikeId;
      await prisma.$transaction([
        prisma.rentalBikeBooking.update({
          where: { id },
          data: {
            bikeId: bikeIdToUse,
            status: 'CONFIRMED',
            totalAmount: quotedPrice ? Number(quotedPrice) : booking.totalAmount,
            notes: `${booking.notes || ''} | [Accepted by Vendor]`,
          },
        }),
        prisma.rentalBike.update({
          where: { id: bikeIdToUse },
          data: { status: 'ON_RENT' },
        }),
      ]);
      return NextResponse.json({ success: true, message: 'Enquiry accepted & bike booked!' });
    }

    if (action === 'QUOTE') {
      await prisma.rentalBikeBooking.update({
        where: { id },
        data: {
          totalAmount: Number(quotedPrice) || booking.totalAmount,
          notes: `${booking.notes || ''} | [Quoted: ₹${quotedPrice}]`,
        },
      });
      return NextResponse.json({ success: true, message: `Price quote of ₹${quotedPrice} submitted to customer/agent` });
    }

    if (action === 'REJECT') {
      await prisma.rentalBikeBooking.update({
        where: { id },
        data: {
          status: 'CANCELLED',
          notes: `${booking.notes || ''} | [Rejected: ${reason || 'Not available'}]`,
        },
      });
      return NextResponse.json({ success: true, message: 'Enquiry declined' });
    }

    return NextResponse.json({ success: false, message: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
