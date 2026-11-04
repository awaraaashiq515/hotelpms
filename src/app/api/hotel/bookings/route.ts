import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError, getMultiTenantWhere, resolveAdminProperty } from '@/lib/api-utils';
import { getSession } from '@/lib/session';
import { sendAuthKeyWhatsAppTemplate, sendWhatsAppMessage } from '@/lib/whatsapp';

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
        },
        checkIns: {
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
      linkedRoomId,
      totalAmount,
      advanceAmount = 0,
      wifiPassword,
      wifiStatus = 'ACTIVE',
      mealPlan = 'EP',
      poolAccess = false,
      poolPackage = 'NONE',
      poolPassCost = 0,
      spaPackage = 'NONE',
      spaPackageCost = 0,
      addOnNotes = '',
      gstNumber,
      companyName,
      billingAddress,
      isOwnerGuest = false,
      ownerVipCode = null,
      ownerName = null,
      ownerBillingType = 'COMPLIMENTARY',
      waiveBill = false,
      checkInImmediately = false,
    } = body;

    // Extract GST fields from guestData or root body
    const resolvedGstNumber = (gstNumber || guestData?.gstNumber || body.guestGstNumber || '').trim().toUpperCase() || null;
    const resolvedCompanyName = (companyName || guestData?.companyName || body.guestCompanyName || '').trim() || null;
    const resolvedBillingAddress = (billingAddress || guestData?.billingAddress || body.guestBillingAddress || '').trim() || null;

    // Resolve comprehensive guest fields from either guestData, prefixed or raw body fields
    const resolvedFirstName = (guestData?.firstName || body.guestFirstName || body.firstName || '').trim();
    const resolvedLastName = (guestData?.lastName || body.guestLastName || body.lastName || '').trim();
    const resolvedMobile = (guestData?.mobile || body.guestMobile || body.mobile || body.phone || '').trim();
    const resolvedEmail = (guestData?.email || body.guestEmail || body.email || '').trim();
    const resolvedIdType = (guestData?.idType || body.idType || '').trim();
    const resolvedIdNumber = (guestData?.idNumber || body.idNumber || '').trim();
    const resolvedAddress = (guestData?.address || body.guestAddress || body.address || '').trim();
    const resolvedNationality = (guestData?.nationality || body.guestNationality || body.nationality || 'Indian').trim();
    const resolvedDocumentUrl = guestData?.documentUrl || body.documentUrl || '';

    // Load property settings for guest portal
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: {
        id: true,
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

    let finalGuestId = guestId || null;
    let guestMobile = resolvedMobile;
    let guestEmail = resolvedEmail;
    let guestFirstName = resolvedFirstName;

    if (finalGuestId) {
      // Guest was specified or selected by ID. Update their record with any new or updated fields.
      const existingGuest = await prisma.guest.findUnique({
        where: { id: finalGuestId }
      });

      if (existingGuest) {
        const updateData: any = {};
        if (resolvedFirstName && resolvedFirstName !== existingGuest.firstName) {
          updateData.firstName = resolvedFirstName;
        }
        if (resolvedLastName && resolvedLastName !== existingGuest.lastName) {
          updateData.lastName = resolvedLastName;
        }
        if (resolvedMobile && resolvedMobile !== existingGuest.mobile) {
          updateData.mobile = resolvedMobile;
        }
        if (resolvedEmail && resolvedEmail !== existingGuest.email) {
          updateData.email = resolvedEmail;
        }
        if (resolvedIdType && resolvedIdType !== existingGuest.idType) {
          updateData.idType = resolvedIdType;
        }
        if (resolvedIdNumber && resolvedIdNumber !== existingGuest.idNumber) {
          updateData.idNumber = resolvedIdNumber;
        }
        if (resolvedAddress && resolvedAddress !== existingGuest.address) {
          updateData.address = resolvedAddress;
        }
        if (resolvedNationality && resolvedNationality !== existingGuest.nationality) {
          updateData.nationality = resolvedNationality;
        }
        if (resolvedGstNumber && resolvedGstNumber !== existingGuest.gstNumber) {
          updateData.gstNumber = resolvedGstNumber;
        }
        if (resolvedCompanyName && resolvedCompanyName !== existingGuest.companyName) {
          updateData.companyName = resolvedCompanyName;
        }
        if (resolvedBillingAddress && resolvedBillingAddress !== existingGuest.billingAddress) {
          updateData.billingAddress = resolvedBillingAddress;
        }

        if (Object.keys(updateData).length > 0) {
          await prisma.guest.update({
            where: { id: finalGuestId },
            data: updateData,
          });
        }

        if (resolvedDocumentUrl) {
          await prisma.guestDocument.create({
            data: {
              guestId: finalGuestId,
              documentType: resolvedIdType || 'ID_PROOF',
              documentUrl: resolvedDocumentUrl,
              verified: true,
            }
          }).catch(() => null);
        }

        guestMobile = resolvedMobile || existingGuest.mobile || '';
        guestEmail = resolvedEmail || existingGuest.email || '';
        guestFirstName = resolvedFirstName || existingGuest.firstName || '';
      }
    } else if (resolvedFirstName || resolvedMobile || resolvedEmail || resolvedIdNumber) {
      // Find or create guest by mobile or email
      let existingGuest: any = null;
      if (resolvedMobile) {
        existingGuest = await prisma.guest.findFirst({
          where: {
            organizationId: session.organizationId,
            mobile: resolvedMobile,
          }
        });
      }
      if (!existingGuest && resolvedEmail) {
        existingGuest = await prisma.guest.findFirst({
          where: {
            organizationId: session.organizationId,
            email: resolvedEmail,
          }
        });
      }

      if (existingGuest) {
        finalGuestId = existingGuest.id;
        const updateData: any = {};
        if (resolvedFirstName && (!existingGuest.firstName || resolvedFirstName !== existingGuest.firstName)) {
          updateData.firstName = resolvedFirstName;
        }
        if (resolvedLastName && (!existingGuest.lastName || resolvedLastName !== existingGuest.lastName)) {
          updateData.lastName = resolvedLastName;
        }
        if (resolvedMobile && (!existingGuest.mobile || resolvedMobile !== existingGuest.mobile)) {
          updateData.mobile = resolvedMobile;
        }
        if (resolvedEmail && (!existingGuest.email || resolvedEmail !== existingGuest.email)) {
          updateData.email = resolvedEmail;
        }
        if (resolvedIdType && resolvedIdType !== existingGuest.idType) {
          updateData.idType = resolvedIdType;
        }
        if (resolvedIdNumber && resolvedIdNumber !== existingGuest.idNumber) {
          updateData.idNumber = resolvedIdNumber;
        }
        if (resolvedAddress && resolvedAddress !== existingGuest.address) {
          updateData.address = resolvedAddress;
        }
        if (resolvedNationality && resolvedNationality !== existingGuest.nationality) {
          updateData.nationality = resolvedNationality;
        }
        if (resolvedGstNumber && resolvedGstNumber !== existingGuest.gstNumber) {
          updateData.gstNumber = resolvedGstNumber;
        }
        if (resolvedCompanyName && resolvedCompanyName !== existingGuest.companyName) {
          updateData.companyName = resolvedCompanyName;
        }
        if (resolvedBillingAddress && resolvedBillingAddress !== existingGuest.billingAddress) {
          updateData.billingAddress = resolvedBillingAddress;
        }

        if (Object.keys(updateData).length > 0) {
          await prisma.guest.update({
            where: { id: existingGuest.id },
            data: updateData,
          });
        }

        if (resolvedDocumentUrl) {
          await prisma.guestDocument.create({
            data: {
              guestId: existingGuest.id,
              documentType: resolvedIdType || 'ID_PROOF',
              documentUrl: resolvedDocumentUrl,
              verified: true,
            }
          }).catch(() => null);
        }

        guestMobile = resolvedMobile || existingGuest.mobile || '';
        guestEmail = resolvedEmail || existingGuest.email || '';
        guestFirstName = resolvedFirstName || existingGuest.firstName || '';
      } else {
        // Create a new guest
        const newGuest = await prisma.guest.create({
          data: {
            organizationId: session.organizationId,
            firstName: resolvedFirstName || 'Guest',
            lastName: resolvedLastName || '',
            mobile: resolvedMobile || '',
            email: resolvedEmail || '',
            idType: resolvedIdType || '',
            idNumber: resolvedIdNumber || '',
            address: resolvedAddress || '',
            nationality: resolvedNationality || 'Indian',
            gstNumber: resolvedGstNumber,
            companyName: resolvedCompanyName,
            billingAddress: resolvedBillingAddress,
            documents: resolvedDocumentUrl ? {
              create: {
                documentType: resolvedIdType || 'ID_PROOF',
                documentUrl: resolvedDocumentUrl,
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
      return apiError(new Error('Guest information (name, mobile or email) is required.'), 400);
    }

    // Generate unique Booking No
    const bookingNo = `RES-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    const total = Number(totalAmount || 0);
    const advance = Number(advanceAmount || 0);
    const effectiveWaiveBill = Boolean(waiveBill);
    const due = effectiveWaiveBill ? 0 : Math.max(0, total - advance);
    const initialStatus = (checkInImmediately || body.status === 'CHECKED_IN') ? 'CHECKED_IN' : (body.status || 'CONFIRMED');

    let targetRoomTypeId = roomTypeId;
    if (assignedRoomId && (!targetRoomTypeId || targetRoomTypeId === 'default')) {
      const rm = await prisma.room.findUnique({
        where: { id: assignedRoomId },
        select: { roomTypeId: true },
      });
      if (rm?.roomTypeId) targetRoomTypeId = rm.roomTypeId;
    }
    if (!targetRoomTypeId || targetRoomTypeId === 'default') {
      const anyType = await prisma.roomType.findFirst({
        where: propertyId ? { propertyId } : {},
        select: { id: true },
      });
      if (anyType) targetRoomTypeId = anyType.id;
    }

    const reservation = await prisma.reservation.create({
      data: {
        propertyId,
        guestId: finalGuestId,
        bookingNo,
        arrivalDate: new Date(arrivalDate),
        departureDate: new Date(departureDate),
        adults: Number(adults || 1),
        children: Number(children || 0),
        roomTypeId: targetRoomTypeId,
        assignedRoomId: assignedRoomId || null,
        status: initialStatus,
        totalAmount: total,
        advanceAmount: effectiveWaiveBill ? total : advance,
        dueAmount: due,
        isOwnerGuest: Boolean(isOwnerGuest),
        ownerVipCode: ownerVipCode ? String(ownerVipCode).trim() : null,
        ownerName: ownerName ? String(ownerName).trim() : null,
        ownerBillingType: ownerBillingType || 'COMPLIMENTARY',
        waiveBill: effectiveWaiveBill,
        wifiPassword: wifiPassword || null,
        wifiStatus: wifiStatus || 'ACTIVE',
        mealPlan: (mealPlan === 'RO' ? 'EP' : mealPlan) || 'EP',
        poolAccess: Boolean(poolAccess),
        poolPackage: poolPackage || 'NONE',
        poolPassCost: Number(poolPassCost || 0),
        spaPackage: spaPackage || 'NONE',
        spaPackageCost: Number(spaPackageCost || 0),
        addOnNotes: addOnNotes || null,
        specialOffer: body.specialOffer || null,
        offerCode: body.offerCode || null,
        extraAdults: Number(body.extraAdults || 0),
        extraAdultCharge: Number(body.extraAdultCharge || 0),
        extraChildren: Number(body.extraChildren || 0),
        extraChildCharge: Number(body.extraChildCharge || 0),
        extraBed: Boolean(body.extraBed),
        extraBedCharge: Number(body.extraBedCharge || 0),
        gstNumber: resolvedGstNumber,
        companyName: resolvedCompanyName,
        billingAddress: resolvedBillingAddress,
        // Create matching ReservationRoom detail
        rooms: {
          create: [
            {
              roomId: assignedRoomId || null,
              ratePerNight: Number(body.ratePerNight) || (total / Math.max(1, Math.round((new Date(departureDate).getTime() - new Date(arrivalDate).getTime()) / (1000 * 60 * 60 * 24)))),
              adults: Number(adults || 1),
              children: Number(children || 0),
            },
            ...(linkedRoomId && linkedRoomId !== assignedRoomId ? [{
              roomId: linkedRoomId,
              ratePerNight: Number(body.linkedRoomRatePerNight || body.ratePerNight || 0),
              adults: 1,
              children: 0,
            }] : [])
          ]
        }
      },
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
        },
      }
    });

    // ── Instant Check-in & Folio for VIP / Direct Check-in ───────────────────
    if (initialStatus === 'CHECKED_IN' && assignedRoomId) {
      await prisma.room.update({
        where: { id: assignedRoomId },
        data: { status: 'OCCUPIED' },
      }).catch(() => null);

      await prisma.checkIn.create({
        data: {
          reservationId: reservation.id,
          guestId: finalGuestId,
          roomId: assignedRoomId,
          checkedInAt: new Date(),
          expectedCheckoutAt: new Date(departureDate),
          status: 'ACTIVE',
        },
      }).catch(() => null);

      const folioNo = `FOL-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
      await prisma.folio.create({
        data: {
          reservationId: reservation.id,
          guestId: finalGuestId,
          folioNo,
          openingBalance: 0,
          totalCharges: total,
          totalPayments: effectiveWaiveBill ? total : advance,
          closingBalance: effectiveWaiveBill ? 0 : due,
          status: 'OPEN',
        },
      }).catch(() => null);
    }

    if (isOwnerGuest && finalGuestId) {
      await prisma.guest.update({
        where: { id: finalGuestId },
        data: { segment: 'VIP' },
      }).catch(() => null);
    }

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
        ...(Number(body.extraAdultCharge || 0) > 0 ? [`👥 *Extra Person Charge:* ₹${Number(body.extraAdultCharge).toLocaleString('en-IN')} (${body.extraAdults} Extra Guest${body.extraAdults > 1 ? 's' : ''})`] : []),
        ...(body.extraBed ? [`🛏️ *Extra Bed / Rollaway:* Included (₹${Number(body.extraBedCharge || 0).toLocaleString('en-IN')})`] : []),
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
          if (property.whatsAppProvider === 'AUTHKEY' && authKey) {
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
          } else {
            // Uses Property credentials or Super Admin Master Meta Gateway
            await sendWhatsAppMessage({
              mobile: guestMobile,
              message,
              propertyId: property.id,
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
      status,
      assignedRoomId,
      roomTypeId,
      upgradeCharge,
      arrivalDate,
      departureDate, 
      extraCharge, 
      expectedCheckoutAt,
      wifiPassword, 
      wifiStatus, 
      mealPlan, 
      poolAccess,
      poolPackage,
      poolPassCost,
      spaPackage,
      spaPackageCost,
      addOnNotes,
      specialOffer,
      offerCode,
      gstNumber,
      companyName,
      billingAddress,
      guestData,
      guestEmail,
      email,
      guestMobile,
      mobile,
      guestFirstName,
      firstName,
      guestLastName,
      lastName,
      guestAddress,
      address,
      idType,
      idNumber,
    } = body;

    if (!id) {
      return apiError(new Error('Reservation ID is required'), 400);
    }

    // Build update data — only update fields that are provided
    const updateData: any = {};
    if (status !== undefined) {
      updateData.status = status;
      if (status === 'CHECKED_OUT' && wifiStatus === undefined) {
        updateData.wifiStatus = 'EXPIRED';
      } else if (status === 'CHECKED_IN' && wifiStatus === undefined) {
        updateData.wifiStatus = 'ACTIVE';
      }
    }
    if (wifiPassword !== undefined) updateData.wifiPassword = wifiPassword;
    if (wifiStatus !== undefined) updateData.wifiStatus = wifiStatus;
    if (mealPlan !== undefined) updateData.mealPlan = mealPlan === 'RO' ? 'EP' : mealPlan;
    if (poolAccess !== undefined) updateData.poolAccess = Boolean(poolAccess);
    if (poolPackage !== undefined) updateData.poolPackage = poolPackage;
    if (poolPassCost !== undefined) updateData.poolPassCost = Number(poolPassCost);
    if (spaPackage !== undefined) updateData.spaPackage = spaPackage;
    if (spaPackageCost !== undefined) updateData.spaPackageCost = Number(spaPackageCost);
    if (addOnNotes !== undefined) updateData.addOnNotes = addOnNotes;
    if (specialOffer !== undefined) updateData.specialOffer = specialOffer;
    if (offerCode !== undefined) updateData.offerCode = offerCode;
    if (gstNumber !== undefined) updateData.gstNumber = gstNumber ? String(gstNumber).trim().toUpperCase() : null;
    if (companyName !== undefined) updateData.companyName = companyName ? String(companyName).trim() : null;
    if (billingAddress !== undefined) updateData.billingAddress = billingAddress ? String(billingAddress).trim() : null;
    if (body.adults !== undefined) updateData.adults = Number(body.adults);
    if (body.children !== undefined) updateData.children = Number(body.children);
    if (body.isOwnerGuest !== undefined) updateData.isOwnerGuest = Boolean(body.isOwnerGuest);
    if (body.ownerVipCode !== undefined) updateData.ownerVipCode = body.ownerVipCode ? String(body.ownerVipCode).trim() : null;
    if (body.ownerName !== undefined) updateData.ownerName = body.ownerName ? String(body.ownerName).trim() : null;
    if (body.ownerBillingType !== undefined) updateData.ownerBillingType = body.ownerBillingType;
    if (body.waiveBill !== undefined) {
      updateData.waiveBill = Boolean(body.waiveBill);
      if (body.waiveBill) updateData.dueAmount = 0;
    }

    // Handle arrival date modification
    if (arrivalDate) {
      updateData.arrivalDate = new Date(arrivalDate);
    }

    // Handle room assignment / upgrade
    if (assignedRoomId) {
      updateData.assignedRoomId = assignedRoomId;
      const targetRoom = await prisma.room.findUnique({
        where: { id: assignedRoomId },
        include: { roomType: true }
      });
      if (targetRoom) {
        updateData.roomTypeId = targetRoom.roomTypeId;
      }
    } else if (roomTypeId) {
      updateData.roomTypeId = roomTypeId;
    }

    // Handle room upgrade extra charge
    if (upgradeCharge && Number(upgradeCharge) > 0) {
      const currentRes = await prisma.reservation.findUnique({ where: { id } });
      if (currentRes) {
        updateData.totalAmount = (currentRes.totalAmount || 0) + Number(upgradeCharge);
        updateData.dueAmount = Math.max(0, (currentRes.dueAmount || 0) + Number(upgradeCharge));
      }
    }

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

    // Also update guest details if provided in PATCH
    const targetRes = await prisma.reservation.findUnique({
      where: { id },
      select: { guestId: true }
    });

    if (targetRes?.guestId) {
      const gUpdate: any = {};
      const resEmail = guestEmail || email || guestData?.email;
      if (resEmail !== undefined) gUpdate.email = String(resEmail).trim();
      const resMobile = guestMobile || mobile || body.phone || guestData?.mobile;
      if (resMobile !== undefined) gUpdate.mobile = String(resMobile).trim();
      const resFn = guestFirstName || firstName || guestData?.firstName;
      if (resFn !== undefined) gUpdate.firstName = String(resFn).trim();
      const resLn = guestLastName || lastName || guestData?.lastName;
      if (resLn !== undefined) gUpdate.lastName = String(resLn).trim();
      const resAddr = guestAddress || address || guestData?.address;
      if (resAddr !== undefined) gUpdate.address = String(resAddr).trim();
      const resIdType = idType || guestData?.idType;
      if (resIdType !== undefined) gUpdate.idType = String(resIdType).trim();
      const resIdNum = idNumber || guestData?.idNumber;
      if (resIdNum !== undefined) gUpdate.idNumber = String(resIdNum).trim();
      const resGst = gstNumber || guestData?.gstNumber;
      if (resGst !== undefined) gUpdate.gstNumber = String(resGst).trim().toUpperCase();
      const resComp = companyName || guestData?.companyName;
      if (resComp !== undefined) gUpdate.companyName = String(resComp).trim();
      const resBillAddr = billingAddress || guestData?.billingAddress;
      if (resBillAddr !== undefined) gUpdate.billingAddress = String(resBillAddr).trim();

      if (Object.keys(gUpdate).length > 0) {
        await prisma.guest.update({
          where: { id: targetRes.guestId },
          data: gUpdate,
        }).catch((err) => console.error('Failed to update guest in PATCH /api/hotel/bookings:', err));
      }
    }

    const updated = await prisma.reservation.update({
      where: { id },
      data: updateData,
      include: {
        rooms: {
          include: {
            room: true
          }
        },
        roomType: true,
        guest: {
          include: {
            documents: true,
          }
        },
      }
    });

    // Handle room assignment & upgrade side effects
    if (assignedRoomId) {
      await prisma.reservationRoom.updateMany({
        where: { reservationId: id },
        data: { roomId: assignedRoomId }
      }).catch(() => null);

      const activeCheckIn = await prisma.checkIn.findFirst({
        where: { reservationId: id, status: 'ACTIVE' }
      });
      if (activeCheckIn) {
        const oldRoomId = activeCheckIn.roomId;
        if (oldRoomId && oldRoomId !== assignedRoomId) {
          await prisma.room.update({
            where: { id: oldRoomId },
            data: { status: 'AVAILABLE', housekeepingStatus: 'DIRTY' }
          }).catch(() => null);
        }
        await prisma.room.update({
          where: { id: assignedRoomId },
          data: { status: 'OCCUPIED' }
        }).catch(() => null);
        await prisma.checkIn.update({
          where: { id: activeCheckIn.id },
          data: { roomId: assignedRoomId }
        }).catch(() => null);

        if (upgradeCharge && Number(upgradeCharge) > 0) {
          const openFolio = await prisma.folio.findFirst({
            where: { reservationId: id, status: 'OPEN' }
          });
          if (openFolio) {
            await prisma.folioTransaction.create({
              data: {
                folioId: openFolio.id,
                txnType: 'DEBIT',
                sourceModule: 'HMS',
                description: `Room Upgrade Surcharge`,
                debitAmount: Number(upgradeCharge),
                creditAmount: 0,
                netAmount: Number(upgradeCharge),
              }
            }).catch(() => null);
            await prisma.folio.update({
              where: { id: openFolio.id },
              data: {
                totalCharges: { increment: Number(upgradeCharge) },
                closingBalance: { increment: Number(upgradeCharge) },
              }
            }).catch(() => null);
          }
        }
      }
    }

    // Handle CHECKED_IN status side effects
    if (status === 'CHECKED_IN') {
      const targetRoomId = updated.assignedRoomId || updated.rooms?.[0]?.roomId;
      if (targetRoomId) {
        await prisma.room.update({
          where: { id: targetRoomId },
          data: { status: 'OCCUPIED' }
        }).catch(() => null);

        // Check if an active check-in record exists, if not create one
        const existingCheckIn = await prisma.checkIn.findFirst({
          where: { reservationId: id, status: 'ACTIVE' }
        });

        if (!existingCheckIn) {
          await prisma.checkIn.create({
            data: {
              reservationId: id,
              guestId: updated.guestId,
              roomId: targetRoomId,
              checkedInAt: new Date(),
              expectedCheckoutAt: updated.departureDate || new Date(Date.now() + 86400000),
              status: 'ACTIVE',
            }
          }).catch(() => null);

          // Create open Folio if not exists
          const existingFolio = await prisma.folio.findFirst({
            where: { reservationId: id, status: 'OPEN' }
          });
          if (!existingFolio) {
            const folioNo = `FOL-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
            await prisma.folio.create({
              data: {
                reservationId: id,
                guestId: updated.guestId,
                folioNo,
                openingBalance: 0,
                totalCharges: updated.totalAmount || 0,
                totalPayments: updated.advanceAmount || 0,
                closingBalance: (updated.totalAmount || 0) - (updated.advanceAmount || 0),
                status: 'OPEN',
              }
            }).catch(() => null);
          }
        }
      }
    } else if (status === 'CHECKED_OUT') {
      const targetRoomId = updated.assignedRoomId || updated.rooms?.[0]?.roomId;
      if (targetRoomId) {
        await prisma.room.update({
          where: { id: targetRoomId },
          data: { status: 'AVAILABLE', housekeepingStatus: 'DIRTY' }
        }).catch(() => null);
      }
      await prisma.checkIn.updateMany({
        where: { reservationId: id, status: 'ACTIVE' },
        data: { status: 'COMPLETED' }
      }).catch(() => null);
    }

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

