import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

function generateEnquiryRef() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = 'GRP-';
  for (let i = 0; i < 6; i++) result += chars[Math.floor(Math.random() * chars.length)];
  return result;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      agentId, agentName, agentCode, services = ['hotel'],
      groupName, contactPerson, contactPhone, contactEmail,
      fromDate, toDate, totalPax, children,
      fromLocation, toLocation,
      hotelCategory = 'MIDSCALE', roomsRequired, mealPlan = 'CP',
      busType, busCount,
      taxiCount, tempoCount, bikeCount,
      sightseeingDays, sightseeingDestinations,
      budget, specialRequests,
      vendorId, bikeId, propertyId,
    } = body;

    if (!groupName || !contactPhone || !fromDate || !totalPax) {
      return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
    }

    const enquiryRef = generateEnquiryRef();

    // ── Build Formatted Notes ──
    const serviceNotes: string[] = [];
    if (services.includes('hotel')) {
      serviceNotes.push(`Hotel: ${hotelCategory} | ${roomsRequired || '?'} rooms | Meal: ${mealPlan}`);
    }
    if (services.includes('bus') && (busCount || busType)) {
      serviceNotes.push(`Bus: ${busCount || 1}x ${busType || 'AC'}`);
    }
    if (services.includes('taxi') && taxiCount) {
      serviceNotes.push(`Taxi: ${taxiCount} cabs`);
    }
    if (services.includes('tempo') && tempoCount) {
      serviceNotes.push(`Tempo Traveller: ${tempoCount} vehicles`);
    }
    if (services.includes('bike') && bikeCount) {
      serviceNotes.push(`Bike Rental: ${bikeCount} bikes`);
    }
    if (services.includes('sightseeing') && (sightseeingDays || sightseeingDestinations)) {
      serviceNotes.push(`Sightseeing: ${sightseeingDays || 1} days | Destinations: ${sightseeingDestinations || 'Local'}`);
    }

    const formattedNotes = [
      `[GROUP ENQUIRY: ${enquiryRef}]`,
      `Agent: ${agentName || 'Agent'} (${agentCode || 'PORTAL'})`,
      `Group: ${groupName}`,
      `Contact: ${contactPerson || 'Group Leader'} | Phone: ${contactPhone}${contactEmail ? ' | Email: ' + contactEmail : ''}`,
      `Dates: ${fromDate}${toDate ? ' → ' + toDate : ''} | Total PAX: ${totalPax}${children ? ' (+ ' + children + ' kids)' : ''}`,
      `Route: ${fromLocation || 'Local'} → ${toLocation || 'Local'}`,
      `Budget: ₹${budget || 'Open'}/pax`,
      `Services: ${services.join(', ')}`,
      ...serviceNotes,
      specialRequests ? `Special Requests: ${specialRequests}` : '',
    ].filter(Boolean).join('\n');

    let createdAgentBookingId: string | null = null;
    let createdBikeBookingId: string | null = null;

    // ── 1. CREATE HOTEL AGENT BOOKING (If services include hotel or general travel) ──
    if (services.includes('hotel') || services.length === 0) {
      // Find or resolve target hotel property
      let targetProperty = null;
      if (propertyId) {
        targetProperty = await prisma.property.findUnique({ where: { id: propertyId } });
      }
      if (!targetProperty && agentId) {
        const agentRecord = await prisma.travelAgent.findUnique({ where: { id: agentId } });
        if (agentRecord?.propertyId) {
          targetProperty = await prisma.property.findUnique({ where: { id: agentRecord.propertyId } });
        }
      }
      if (!targetProperty) {
        targetProperty = await prisma.property.findFirst({
          where: { type: 'HOTEL' },
          orderBy: { createdAt: 'asc' },
        });
      }
      if (!targetProperty) {
        targetProperty = await prisma.property.findFirst();
      }

      // Find or resolve travel agent
      let targetAgent = null;
      if (agentId) {
        targetAgent = await prisma.travelAgent.findUnique({ where: { id: agentId } });
      }
      if (!targetAgent) {
        targetAgent = await prisma.travelAgent.findFirst({
          where: { isActive: true },
          orderBy: { createdAt: 'asc' },
        });
      }
      if (!targetAgent) {
        // Create a fallback portal agent if none exists
        targetAgent = await prisma.travelAgent.create({
          data: {
            name: agentName || 'Agent Portal Lead',
            agentCode: agentCode || 'AGT-PORTAL',
            phone: contactPhone || '9999999999',
            commissionRate: 10,
            propertyId: targetProperty?.id,
          },
        });
      }

      if (targetProperty && targetAgent) {
        const pax = Number(totalPax) || 1;
        const rooms = Number(roomsRequired) || Math.max(1, Math.ceil(pax / 2));
        const from = new Date(fromDate);
        const to = toDate ? new Date(toDate) : new Date(from.getTime() + 86400000);
        const nights = Math.max(1, Math.round((to.getTime() - from.getTime()) / 86400000)) || 1;

        // Estimate total amount
        const roomRate = hotelCategory === 'LUXURY' ? 5000 : hotelCategory === 'UPSCALE' ? 3500 : hotelCategory === 'MIDSCALE' ? 2200 : 1500;
        const estimatedTotal = (Number(budget) && Number(budget) > 100)
          ? Number(budget) * pax
          : rooms * roomRate * nights;

        const commission = (estimatedTotal * (targetAgent.commissionRate || 10)) / 100;

        const booking = await prisma.agentBooking.create({
          data: {
            propertyId: targetProperty.id,
            agentId: targetAgent.id,
            guestName: `${groupName} (Lead: ${contactPerson || 'Group Leader'})`,
            guestPhone: contactPhone,
            guestEmail: contactEmail || null,
            guestNationality: 'Indian',
            adults: pax,
            children: Number(children) || 0,
            checkIn: from,
            checkOut: to,
            roomType: `[GROUP] ${rooms} Rooms (${hotelCategory})`,
            totalAmount: estimatedTotal,
            commission,
            commissionPaid: false,
            status: 'PENDING',
            notes: formattedNotes,
            specialRequests: specialRequests || null,
          },
        });
        createdAgentBookingId = booking.id;

        // Create in-app notification for Hotel Front Office / Staff Bell
        await prisma.notification.create({
          data: {
            propertyId: targetProperty.id,
            title: `🔔 New Agent Group Enquiry: ${groupName}`,
            message: `${rooms} Rooms requested (${pax} Guests, ${nights} Nights). Lead: ${contactPerson} (${contactPhone})`,
            type: 'AGENT_BOOKING',
            status: 'UNREAD',
            priority: 'HIGH',
            metadata: JSON.stringify({
              bookingId: booking.id,
              agentName: targetAgent.name,
              groupName,
              rooms,
              pax,
              nights,
              totalAmount: estimatedTotal,
              source: 'AGENT_PORTAL',
              link: '/hotel/agent-bookings',
            }),
          },
        }).catch((err) => console.error('Failed to create hotel notification:', err));
      }
    }

    // ── 2. CREATE BIKE RENTAL ENQUIRY (If services include bike or bikeCount > 0) ──
    if (services.includes('bike') || Number(bikeCount) > 0) {
      // Find bike vendor
      let targetVendor = null;
      if (vendorId) {
        targetVendor = await prisma.bikeRentalVendor.findUnique({ where: { id: vendorId } });
      }
      if (!targetVendor && (toLocation || fromLocation)) {
        const loc = (toLocation || fromLocation || '').trim();
        targetVendor = await prisma.bikeRentalVendor.findFirst({
          where: {
            isActive: true,
            OR: [
              { city: { contains: loc } },
              { state: { contains: loc } },
            ],
          },
        });
      }
      if (!targetVendor) {
        targetVendor = await prisma.bikeRentalVendor.findFirst({
          where: { isActive: true },
          orderBy: { createdAt: 'asc' },
        });
      }

      if (targetVendor) {
        // Find a bike for this vendor
        let bike = null;
        if (bikeId) {
          bike = await prisma.rentalBike.findUnique({ where: { id: bikeId } });
        }
        if (!bike) {
          bike = await prisma.rentalBike.findFirst({
            where: { vendorId: targetVendor.id },
            orderBy: { createdAt: 'desc' },
          });
        }

        if (bike) {
          const sDate = fromDate;
          const eDate = toDate || fromDate;
          const sTime = new Date(sDate).getTime();
          const eTime = new Date(eDate).getTime();
          const rentalDays = Math.max(1, Math.round((eTime - sTime) / (1000 * 60 * 60 * 24)) || 1);
          const count = Number(bikeCount) || 1;
          const dailyRate = Number(bike.dailyRate) || 500;
          const totalRent = dailyRate * count * rentalDays;
          const deposit = (Number(bike.securityDeposit) || 1000) * count;

          const bikeBooking = await prisma.rentalBikeBooking.create({
            data: {
              vendorId: targetVendor.id,
              bikeId: bike.id,
              guestName: `${groupName} - ${contactPerson || 'Group Leader'}`,
              guestPhone: contactPhone,
              guestEmail: contactEmail || null,
              startDate: sDate,
              endDate: eDate,
              totalAmount: totalRent,
              securityDeposit: deposit,
              status: 'PENDING',
              notes: `[ENQUIRY] Source: AGENT_PORTAL | Ref: ${enquiryRef} | Quantity: ${count} Bikes (${bike.category}) | Route: ${fromLocation || 'Local'} → ${toLocation || 'Local'} | Notes: ${specialRequests || 'Agent Group Travel Lead'}`,
            },
          });
          createdBikeBookingId = bikeBooking.id;
        }
      }
    }

    // ── 3. Also log to general Enquiry table for audit ──
    try {
      await prisma.enquiry.create({
        data: {
          name: `${groupName} (${contactPerson || 'Lead'})`,
          email: contactEmail || `${contactPhone}@agentportal.local`,
          phone: contactPhone,
          subject: `[Group Enquiry ${enquiryRef}] ${services.join(', ')} for ${totalPax} Pax`,
          message: formattedNotes,
          status: 'NEW',
        },
      });
    } catch (_) {}

    return NextResponse.json({
      success: true,
      enquiryRef,
      message: 'Group enquiry submitted successfully! It has been dispatched to hotel managers and fleet vendors.',
      data: {
        enquiryRef,
        agentBookingId: createdAgentBookingId,
        bikeBookingId: createdBikeBookingId,
      },
    });
  } catch (err: any) {
    console.error('[group-enquiry POST error]', err);
    return NextResponse.json({ success: false, message: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const agentId = searchParams.get('agentId');

    const where: any = {
      OR: [
        { roomType: { contains: '[GROUP]' } },
        { notes: { contains: '[GROUP ENQUIRY' } },
      ],
    };
    if (agentId) where.agentId = agentId;

    const groupBookings = await prisma.agentBooking.findMany({
      where,
      include: {
        agent: { select: { id: true, name: true, agentCode: true, phone: true } },
        property: { select: { id: true, name: true, city: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: groupBookings,
    });
  } catch (err: any) {
    console.error('[group-enquiry GET error]', err);
    return NextResponse.json({ success: false, message: err.message || 'Internal server error' }, { status: 500 });
  }
}
