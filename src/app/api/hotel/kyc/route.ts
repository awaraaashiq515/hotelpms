import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const guestId = searchParams.get('guestId');
    const reservationId = searchParams.get('reservationId');
    const listActive = searchParams.get('list') === 'true' || (!guestId && !reservationId);
    const propertyCode = searchParams.get('propertyCode');

    if (listActive) {
      let propertyIdFilter: string | undefined = undefined;
      if (propertyCode) {
        const prop = await prisma.property.findUnique({
          where: { code: propertyCode },
          select: { id: true },
        });
        if (prop) propertyIdFilter = prop.id;
      }

      const activeReservations = await prisma.reservation.findMany({
        where: {
          ...(propertyIdFilter ? { propertyId: propertyIdFilter } : {}),
          status: { in: ['CONFIRMED', 'CHECKED_IN'] },
        },
        orderBy: { arrivalDate: 'desc' },
        take: 100,
        include: {
          guest: {
            include: {
              documents: {
                orderBy: { createdAt: 'desc' },
                take: 1,
              },
            },
          },
          rooms: {
            include: { room: true },
          },
          roomType: true,
        },
      });

      const formatted = activeReservations.map((r) => {
        const roomNum = r.rooms?.[0]?.room?.roomNumber || r.assignedRoomId || 'Unassigned';
        const doc = r.guest?.documents?.[0];
        const isVerified = Boolean(doc?.documentUrl || (r.guest?.idType && r.guest?.idNumber));
        return {
          reservationId: r.id,
          bookingNo: r.bookingNo,
          status: r.status,
          guestId: r.guestId,
          guestName: `${r.guest?.firstName || ''} ${r.guest?.lastName || ''}`.trim() || 'Guest',
          phone: r.guest?.mobile || '',
          roomNumber: roomNum,
          roomType: r.roomType?.name || 'Standard',
          idType: r.guest?.idType || 'Aadhaar Card',
          idNumber: r.guest?.idNumber || '',
          isVerified,
          documentUrl: doc?.documentUrl || null,
        };
      });

      return NextResponse.json({
        success: true,
        data: formatted,
      });
    }

    if (reservationId) {
      const reservation = await prisma.reservation.findUnique({
        where: { id: reservationId },
        include: {
          guest: {
            include: {
              documents: {
                orderBy: { createdAt: 'desc' }
              }
            }
          },
          rooms: {
            include: { room: true }
          },
          roomType: true,
        }
      });

      if (!reservation) {
        return NextResponse.json({ success: false, message: 'Reservation not found' }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        data: {
          reservation,
          guest: reservation.guest,
          hasDocuments: Boolean(reservation.guest?.documents && reservation.guest.documents.length > 0),
          latestDocument: reservation.guest?.documents?.[0] || null,
          documents: reservation.guest?.documents || [],
          isVerified: Boolean(
            reservation.guest?.documents &&
            reservation.guest.documents.length > 0 &&
            reservation.guest.idType &&
            reservation.guest.idNumber
          ),
        }
      });
    }

    if (guestId) {
      const guest = await prisma.guest.findUnique({
        where: { id: guestId },
        include: {
          documents: {
            orderBy: { createdAt: 'desc' }
          },
          reservations: {
            take: 1,
            orderBy: { createdAt: 'desc' },
            include: {
              rooms: { include: { room: true } },
              roomType: true,
            }
          }
        }
      });

      if (!guest) {
        return NextResponse.json({ success: false, message: 'Guest not found' }, { status: 404 });
      }

      const reservation = guest.reservations?.[0] || null;

      return NextResponse.json({
        success: true,
        data: {
          guest,
          reservation,
          hasDocuments: Boolean(guest.documents && guest.documents.length > 0),
          latestDocument: guest.documents?.[0] || null,
          documents: guest.documents || [],
          isVerified: Boolean(
            guest.documents &&
            guest.documents.length > 0 &&
            guest.idType &&
            guest.idNumber
          ),
        }
      });
    }

    return NextResponse.json({ success: false, message: 'Invalid query' }, { status: 400 });
  } catch (error: any) {
    console.error('Error fetching KYC:', error);
    return NextResponse.json({ success: false, message: error.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';
    let guestId = '';
    let reservationId = '';
    let idType = 'Aadhaar Card';
    let idNumber = '';
    let uploadedUrl = '';

    const uploadsDir = join(process.cwd(), 'public/uploads/kyc');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    let extraEmail = '';
    let extraMobile = '';
    let extraAddress = '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      guestId = (formData.get('guestId') as string) || '';
      reservationId = (formData.get('reservationId') as string) || '';
      idType = (formData.get('idType') as string) || 'Aadhaar Card';
      idNumber = (formData.get('idNumber') as string) || '';
      extraEmail = (formData.get('email') as string) || (formData.get('guestEmail') as string) || '';
      extraMobile = (formData.get('mobile') as string) || (formData.get('guestMobile') as string) || '';
      extraAddress = (formData.get('address') as string) || (formData.get('guestAddress') as string) || '';

      const file = formData.get('file') as File | null;
      if (file && typeof file !== 'string') {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const cleanName = (file.name || 'kyc_proof.jpg').replace(/[^a-zA-Z0-9.-]/g, '_');
        const filename = `${Date.now()}-${cleanName}`;
        const filePath = join(uploadsDir, filename);
        await writeFile(filePath, buffer);
        uploadedUrl = `/api/images/kyc/${filename}`;
      } else {
        const rawUrl = formData.get('documentUrl') as string | null;
        if (rawUrl) uploadedUrl = rawUrl;
      }
    } else {
      // JSON body
      const body = await request.json();
      guestId = body.guestId || '';
      reservationId = body.reservationId || '';
      idType = body.idType || 'Aadhaar Card';
      idNumber = body.idNumber || '';
      extraEmail = body.email || body.guestEmail || '';
      extraMobile = body.mobile || body.guestMobile || '';
      extraAddress = body.address || body.guestAddress || '';

      if (body.base64Image) {
        const matches = body.base64Image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        let ext = 'jpg';
        let buffer: Buffer;

        if (matches && matches.length === 3) {
          const mime = matches[1];
          if (mime.includes('png')) ext = 'png';
          else if (mime.includes('webp')) ext = 'webp';
          buffer = Buffer.from(matches[2], 'base64');
        } else {
          buffer = Buffer.from(body.base64Image, 'base64');
        }

        const filename = `camera_${Date.now()}.${ext}`;
        const filePath = join(uploadsDir, filename);
        await writeFile(filePath, buffer);
        uploadedUrl = `/api/images/kyc/${filename}`;
      } else if (body.documentUrl) {
        uploadedUrl = body.documentUrl;
      }
    }

    if (!guestId && reservationId) {
      const res = await prisma.reservation.findUnique({
        where: { id: reservationId },
        select: { guestId: true }
      });
      if (res?.guestId) guestId = res.guestId;
    }

    if (!guestId) {
      return NextResponse.json({ success: false, message: 'guestId or valid reservationId is required' }, { status: 400 });
    }

    // Update guest record
    const updateData: any = {};
    if (idType) updateData.idType = idType;
    if (idNumber) updateData.idNumber = idNumber;
    if (extraEmail) updateData.email = extraEmail.trim();
    if (extraMobile) updateData.mobile = extraMobile.trim();
    if (extraAddress) updateData.address = extraAddress.trim();

    if (Object.keys(updateData).length > 0) {
      await prisma.guest.update({
        where: { id: guestId },
        data: updateData
      });
    }

    let createdDoc = null;
    if (uploadedUrl) {
      createdDoc = await prisma.guestDocument.create({
        data: {
          guestId,
          documentType: idType || 'ID_PROOF',
          documentUrl: uploadedUrl,
          verified: true,
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: 'KYC Document successfully saved and verified!',
      data: {
        guestId,
        idType,
        idNumber,
        documentUrl: uploadedUrl,
        document: createdDoc,
      }
    });
  } catch (error: any) {
    console.error('Error handling KYC upload:', error);
    return NextResponse.json({ success: false, message: error.message || 'Server upload error' }, { status: 500 });
  }
}
