import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError, getMultiTenantWhere, resolveAdminProperty } from '@/lib/api-utils';
import { getSession } from '@/lib/session';
import { sendAuthKeyWhatsAppTemplate } from '@/lib/whatsapp';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const { searchParams } = new URL(request.url);
    const propertyIdParam = searchParams.get('propertyId');

    const propertyId = propertyIdParam || session.propertyId;
    let targetPropertyId = propertyId;

    if (propertyId && propertyId !== 'all' && propertyId !== 'null' && propertyId !== 'undefined') {
      const prop = await prisma.property.findUnique({
        where: { id: propertyId },
        select: { hmsEnabled: true, type: true, organizationId: true }
      });
      if (prop && !prop.hmsEnabled && prop.type !== 'HOTEL') {
        const hotelProp = await prisma.property.findFirst({
          where: {
            organizationId: prop.organizationId || session.organizationId,
            OR: [
              { hmsEnabled: true },
              { type: 'HOTEL' }
            ]
          },
          select: { id: true }
        });
        if (hotelProp) {
          targetPropertyId = hotelProp.id;
        }
      }
    } else if (session.organizationId) {
      const hotelProp = await prisma.property.findFirst({
        where: {
          organizationId: session.organizationId,
          OR: [
            { hmsEnabled: true },
            { type: 'HOTEL' }
          ]
        },
        select: { id: true }
      });
      if (hotelProp) {
        targetPropertyId = hotelProp.id;
      }
    }

    const reservations = await prisma.reservation.findMany({
      where: targetPropertyId ? { propertyId: targetPropertyId } : getMultiTenantWhere(session, propertyIdParam),
      include: {
        guest: {
          include: {
            documents: true,
          }
        },
        roomType: true,
        rooms: {
          include: {
            room: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    console.log("GET /api/hotel/bookings reservations count:", reservations.length);
    return apiResponse(reservations);
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const body = await request.json();
    let propertyId = body.propertyId || await resolveAdminProperty(session, prisma);

    if (propertyId) {
      const prop = await prisma.property.findUnique({
        where: { id: propertyId },
        select: { hmsEnabled: true, type: true, organizationId: true }
      });
      if (prop && !prop.hmsEnabled && prop.type !== 'HOTEL') {
        const hotelProp = await prisma.property.findFirst({
          where: {
            organizationId: prop.organizationId || session.organizationId,
            OR: [
              { hmsEnabled: true },
              { type: 'HOTEL' }
            ]
          },
          select: { id: true }
        });
        if (hotelProp) {
          propertyId = hotelProp.id;
        }
      }
    }

    if (!propertyId) {
      return apiError(new Error('No property context found.'), 400);
    }

    const {
      guestId,
      guestData, // if guestId is null, we create guest
      arrivalDate,
      departureDate,
      adults,
      children,
      roomTypeId,
      assignedRoomId,
      totalAmount,
      advanceAmount = 0,
      wifiPassword,
      wifiStatus = 'ACTIVE',
      mealPlan = 'RO',
      poolAccess = false,
      poolPackage = 'NONE',
      poolPassCost = 0,
      spaPackage = 'NONE',
      spaPackageCost = 0,
      addOnNotes = '',
    } = body;

    // Load property settings for guest portal
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: {
        name: true,
        guestPortalEnabled: true,
        guestPortalPasswordMode: true,
        guestPortalDefaultPassword: true,
        whatsAppEnabled: true,
        whatsAppApiKey: true,
        whatsAppProvider: true,
        whatsAppInstanceId: true,
        whatsAppTemplate: true,  // this stores the wid (template ID)
        metaAccessToken: true,
        metaPhoneId: true,
      }
    });

    let finalGuestId = guestId;
    let guestMobile = '';
    let guestEmail = '';
    let guestFirstName = '';

    if (!finalGuestId && guestData) {
      // Find or create guest
      const existingGuest = await prisma.guest.findFirst({
        where: {
          organizationId: session.organizationId,
          mobile: guestData.mobile || undefined,
        }
      });

      if (existingGuest) {
        finalGuestId = existingGuest.id;
        guestMobile = existingGuest.mobile || '';
        guestEmail = existingGuest.email || '';
        guestFirstName = existingGuest.firstName || '';
        // Update guest details if KYC info is provided
        if (guestData.idType || guestData.idNumber) {
          await prisma.guest.update({
            where: { id: existingGuest.id },
            data: {
              idType: guestData.idType || undefined,
              idNumber: guestData.idNumber || undefined,
            }
          });
        }
        if (guestData.documentUrl) {
          await prisma.guestDocument.create({
            data: {
              guestId: existingGuest.id,
              documentType: guestData.idType || 'ID_PROOF',
              documentUrl: guestData.documentUrl,
              verified: true,
            }
          });
        }
      } else {
        const newGuest = await prisma.guest.create({
          data: {
            organizationId: session.organizationId,
            firstName: guestData.firstName,
            lastName: guestData.lastName || '',
            mobile: guestData.mobile || '',
            email: guestData.email || '',
            idType: guestData.idType || '',
            idNumber: guestData.idNumber || '',
            documents: guestData.documentUrl ? {
              create: {
                documentType: guestData.idType || 'ID_PROOF',
                documentUrl: guestData.documentUrl,
                verified: true,
              }
            } : undefined
          }
        });
        finalGuestId = newGuest.id;
        guestMobile = newGuest.mobile || '';
        guestEmail = newGuest.email || '';
        guestFirstName = newGuest.firstName || '';
      }
    }

    if (!finalGuestId) {
      return apiError(new Error('Guest information is required.'), 400);
    }

    // Generate unique Booking No
    const bookingNo = `RES-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    const total = Number(totalAmount || 0);
    const advance = Number(advanceAmount || 0);
    const due = total - advance;

    const reservation = await prisma.reservation.create({
      data: {
        propertyId,
        guestId: finalGuestId,
        bookingNo,
        arrivalDate: new Date(arrivalDate),
        departureDate: new Date(departureDate),
        adults: Number(adults || 1),
        children: Number(children || 0),
        roomTypeId,
        assignedRoomId: assignedRoomId || null,
        status: 'CONFIRMED',
        totalAmount: total,
        advanceAmount: advance,
        dueAmount: due,
        wifiPassword: wifiPassword || null,
        wifiStatus: wifiStatus || 'ACTIVE',
        mealPlan: mealPlan || 'RO',
        poolAccess: Boolean(poolAccess),
        poolPackage: poolPackage || 'NONE',
        poolPassCost: Number(poolPassCost || 0),
        spaPackage: spaPackage || 'NONE',
        spaPackageCost: Number(spaPackageCost || 0),
        addOnNotes: addOnNotes || null,
        // Create matching ReservationRoom detail
        rooms: {
          create: {
            roomId: assignedRoomId || null,
            ratePerNight: total / Math.max(1, Math.round((new Date(departureDate).getTime() - new Date(arrivalDate).getTime()) / (1000 * 60 * 60 * 24))),
            adults: Number(adults || 1),
            children: Number(children || 0),
          }
        }
      },
      include: {
        guest: true,
        roomType: true,
        rooms: true,
      }
    });

    // ── Guest Portal: Auto-set credentials ──────────────────────────────────
    if (property?.guestPortalEnabled && finalGuestId) {
      const portalPassword = property.guestPortalPasswordMode === 'CUSTOM'
        ? (property.guestPortalDefaultPassword || 'welcome@123')
        : (guestMobile || 'welcome@123');

      // Save portal password to guest record (if not already set)
      const currentGuest = await prisma.guest.findUnique({ where: { id: finalGuestId } });
      if (currentGuest && !currentGuest.guestPortalPassword) {
        await prisma.guest.update({
          where: { id: finalGuestId },
          data: { guestPortalPassword: portalPassword }
        });
      }

      // ── Fetch room + floor details for the message ────────────────────────
      let roomNumber = 'N/A';
      let floorName = 'N/A';
      let roomPriceStr = `₹${total.toLocaleString('en-IN')}`;

      if (assignedRoomId) {
        const assignedRoom = await prisma.room.findUnique({
          where: { id: assignedRoomId },
        });
        if (assignedRoom) {
          roomNumber = assignedRoom.roomNumber || 'N/A';
          floorName = assignedRoom.floor ? `Floor ${assignedRoom.floor}` : 'N/A';
          const nights = Math.max(1, Math.round((new Date(departureDate).getTime() - new Date(arrivalDate).getTime()) / (1000 * 60 * 60 * 24)));
          const ratePerNight = total / nights;
          roomPriceStr = `₹${ratePerNight.toLocaleString('en-IN', { maximumFractionDigits: 0 })}/night`;
        }
      }

      // ── Build proper English WhatsApp message ────────────────────────────
      const arrStr = new Date(arrivalDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
      const depStr = new Date(departureDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
      const nights = Math.max(1, Math.round((new Date(departureDate).getTime() - new Date(arrivalDate).getTime()) / (1000 * 60 * 60 * 24)));
      const portalUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/guest-portal`;
      const guestName = `${guestFirstName || 'Guest'}${guestData?.lastName ? ' ' + guestData.lastName : ''}`;

      const message = [
        `🏨 *${property.name}* — Booking Confirmed! ✅`,
        ``,
        `Dear ${guestFirstName || 'Guest'},`,
        ``,
        `Your reservation has been successfully confirmed. Here are your stay details:`,
        ``,
        `📋 *Booking No:* ${bookingNo}`,
        `📅 *Check-In:* ${arrStr}`,
        `📅 *Check-Out:* ${depStr}`,
        `🌙 *Duration:* ${nights} Night${nights > 1 ? 's' : ''}`,
        `🛏️ *Room No:* ${roomNumber}`,
        `🏢 *Floor:* ${floorName}`,
        `💰 *Room Rate:* ${roomPriceStr}`,
        `💳 *Total Bill:* ₹${total.toLocaleString('en-IN')}`,
        ``,
        `🌐 *Guest Portal Access*`,
        `Link: ${portalUrl}`,
        `👤 Username: ${guestName}`,
        `🔑 Password: ${portalPassword}`,
        ``,
        `You can view your booking, request services, and manage your stay anytime through the Guest Portal.`,
        ``,
        `We look forward to welcoming you!`,
        ``,
        `— ${property.name} Team 🙏`,
      ].join('\n');

      // ── Send WhatsApp ────────────────────────────────────────────────────
      if (guestMobile) {
        try {
          const authKey = property.whatsAppApiKey || process.env.AUTHKEY_API_KEY;
          if (property.whatsAppProvider === 'AUTHKEY' || authKey) {
            await sendAuthKeyWhatsAppTemplate({
              mobile: guestMobile,
              templateId: property.whatsAppTemplate || undefined,  // wid from authkey.io
              guestName,
              hotelName: property.name || 'Hotel',
              portalUrl,
              username: guestName,
              password: portalPassword,
              authKey: authKey || undefined,
              roomNumber,
              floor: floorName,
              roomPrice: roomPriceStr,
            });
          } else if (property.whatsAppProvider === 'ULTRAMSG' && property.whatsAppApiKey && property.whatsAppInstanceId) {
            await fetch(`https://api.ultramsg.com/${property.whatsAppInstanceId}/messages/chat`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                token: property.whatsAppApiKey,
                to: guestMobile.startsWith('+') ? guestMobile : `+91${guestMobile}`,
                body: message,
              }),
            });
          } else if (property.whatsAppProvider === 'META' && property.metaAccessToken && property.metaPhoneId) {
            const recipient = guestMobile.startsWith('+') ? guestMobile.replace('+', '') : `91${guestMobile}`;
            await fetch(`https://graph.facebook.com/v18.0/${property.metaPhoneId}/messages`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${property.metaAccessToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                messaging_product: 'whatsapp',
                to: recipient,
                type: 'text',
                text: { body: message },
              }),
            });
          }
        } catch (waErr) {
          console.error('[WhatsApp Send Error]:', waErr);
          // Non-fatal: booking is still created
        }
      }
    }


    return apiResponse(reservation, 'Booking created successfully', 201);
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const body = await request.json();
    const { 
      id, 
      wifiPassword, 
      wifiStatus, 
      mealPlan, 
      departureDate, 
      extraCharge, 
      expectedCheckoutAt,
      poolAccess,
      poolPackage,
      poolPassCost,
      spaPackage,
      spaPackageCost,
      addOnNotes,
    } = body;

    if (!id) {
      return apiError(new Error('Reservation ID is required'), 400);
    }

    // Build update data — only update fields that are provided
    const updateData: any = {};
    if (wifiPassword !== undefined) updateData.wifiPassword = wifiPassword;
    if (wifiStatus !== undefined) updateData.wifiStatus = wifiStatus;
    if (mealPlan !== undefined) updateData.mealPlan = mealPlan;
    if (poolAccess !== undefined) updateData.poolAccess = Boolean(poolAccess);
    if (poolPackage !== undefined) updateData.poolPackage = poolPackage;
    if (poolPassCost !== undefined) updateData.poolPassCost = Number(poolPassCost);
    if (spaPackage !== undefined) updateData.spaPackage = spaPackage;
    if (spaPackageCost !== undefined) updateData.spaPackageCost = Number(spaPackageCost);
    if (addOnNotes !== undefined) updateData.addOnNotes = addOnNotes;

    // Handle stay extension: update departure date + recalc amounts
    if (departureDate) {
      const reservation = await prisma.reservation.findUnique({ where: { id } });
      if (!reservation) return apiError(new Error('Reservation not found'), 404);

      updateData.departureDate = new Date(departureDate);

      // Add extra charge to total & due amounts
      if (extraCharge && Number(extraCharge) > 0) {
        updateData.totalAmount = (reservation.totalAmount || 0) + Number(extraCharge);
        updateData.dueAmount = Math.max(0, (reservation.dueAmount || 0) + Number(extraCharge));
      }
    }

    const updated = await prisma.reservation.update({
      where: { id },
      data: updateData
    });

    // If guest is checked in, also extend the checkIn expected checkout & post to folio
    if (departureDate) {
      const activeCheckIn = await prisma.checkIn.findFirst({
        where: { reservationId: id, status: 'ACTIVE' },
        include: {
          reservation: { include: { folios: { where: { status: 'OPEN' } } } }
        }
      });

      if (activeCheckIn) {
        // Update expected checkout on the checkIn record
        await prisma.checkIn.update({
          where: { id: activeCheckIn.id },
          data: { expectedCheckoutAt: new Date(departureDate) }
        });

        // Post extra charge to open folio if applicable
        if (extraCharge && Number(extraCharge) > 0) {
          const openFolio = activeCheckIn.reservation?.folios?.[0];
          if (openFolio) {
            await prisma.folioTransaction.create({
              data: {
                folioId: openFolio.id,
                txnType: 'DEBIT',
                sourceModule: 'HMS',
                description: `Stay Extension — Additional Night(s)`,
                debitAmount: Number(extraCharge),
                creditAmount: 0,
                netAmount: Number(extraCharge),
              }
            });
            // Update folio totals
            await prisma.folio.update({
              where: { id: openFolio.id },
              data: {
                totalCharges: { increment: Number(extraCharge) },
                closingBalance: { increment: Number(extraCharge) },
              }
            });
          }
        }
      }
    }

    return apiResponse(updated, 'Reservation updated successfully');
  } catch (error) {
    return apiError(error);
  }
}

