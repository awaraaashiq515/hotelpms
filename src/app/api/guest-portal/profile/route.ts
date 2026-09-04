import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jwtVerify } from 'jose';

const secretKey = process.env.JWT_SECRET || 'super-secret-default-key-change-it-in-prod';
const key = new TextEncoder().encode(secretKey);

async function verifyGuestToken(request: NextRequest) {
  const authHeader = request.headers.get('Authorization') || request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.substring(7);
  try {
    const result = await jwtVerify(token, key, { algorithms: ['HS256'] });
    const payload = result.payload;
    if (!payload || payload.type !== 'GUEST_PORTAL' || !payload.guestId) {
      return null;
    }
    return payload.guestId as string;
  } catch {
    return null;
  }
}

// GET /api/guest-portal/profile
export async function GET(request: NextRequest) {
  try {
    const guestId = await verifyGuestToken(request);
    if (!guestId) {
      return NextResponse.json({ success: false, message: 'Unauthorized session.' }, { status: 401 });
    }

    const guest = await prisma.guest.findUnique({
      where: { id: guestId },
      include: {
        documents: {
          select: {
            id: true,
            documentType: true,
            documentUrl: true,
            verified: true,
            createdAt: true,
          }
        },
        _count: {
          select: {
            reservations: true,
            posOrders: true,
          }
        }
      }
    });

    if (!guest) {
      return NextResponse.json({ success: false, message: 'Guest not found.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: guest.id,
        firstName: guest.firstName,
        lastName: guest.lastName,
        mobile: guest.mobile,
        email: guest.email,
        avatarUrl: guest.avatarUrl,
        gender: guest.gender,
        nationality: guest.nationality,
        birthDate: guest.birthDate ? guest.birthDate.toISOString().split('T')[0] : null,
        idType: guest.idType,
        idNumber: guest.idNumber,
        address: guest.address,
        companyName: guest.companyName,
        gstNumber: guest.gstNumber,
        billingAddress: guest.billingAddress,
        loyaltyPoints: guest.loyaltyPoints,
        segment: guest.segment,
        hasCustomPassword: Boolean(guest.guestPortalPassword && guest.guestPortalPassword !== guest.mobile),
        documents: guest.documents,
        stats: {
          totalBookings: guest._count.reservations,
          totalOrders: guest._count.posOrders,
        }
      }
    });
  } catch (error: any) {
    console.error('[Guest Profile GET Error]:', error);
    return NextResponse.json({ success: false, message: error.message || 'Failed to load profile.' }, { status: 500 });
  }
}

// PUT or PATCH /api/guest-portal/profile — Update profile and optionally password
export async function PUT(request: NextRequest) {
  return handleProfileUpdate(request);
}

export async function PATCH(request: NextRequest) {
  return handleProfileUpdate(request);
}

async function handleProfileUpdate(request: NextRequest) {
  try {
    const guestId = await verifyGuestToken(request);
    if (!guestId) {
      return NextResponse.json({ success: false, message: 'Unauthorized session.' }, { status: 401 });
    }

    const body = await request.json();
    const {
      firstName,
      lastName,
      email,
      mobile,
      gender,
      nationality,
      birthDate,
      idType,
      idNumber,
      address,
      companyName,
      gstNumber,
      billingAddress,
      newPassword,
    } = body;

    if (!firstName || firstName.trim().length === 0) {
      return NextResponse.json({ success: false, message: 'First name is required.' }, { status: 400 });
    }

    // Prepare update payload
    const updateData: Record<string, any> = {
      firstName: firstName.trim(),
      lastName: lastName !== undefined ? (lastName?.trim() || null) : undefined,
      email: email !== undefined ? (email?.trim() || null) : undefined,
      mobile: mobile !== undefined ? (mobile?.trim() || null) : undefined,
      gender: gender !== undefined ? (gender?.trim() || null) : undefined,
      nationality: nationality !== undefined ? (nationality?.trim() || null) : undefined,
      birthDate: birthDate ? new Date(birthDate) : (birthDate === null ? null : undefined),
      idType: idType !== undefined ? (idType?.trim() || null) : undefined,
      idNumber: idNumber !== undefined ? (idNumber?.trim() || null) : undefined,
      address: address !== undefined ? (address?.trim() || null) : undefined,
      companyName: companyName !== undefined ? (companyName?.trim() || null) : undefined,
      gstNumber: gstNumber !== undefined ? (gstNumber?.trim() || null) : undefined,
      billingAddress: billingAddress !== undefined ? (billingAddress?.trim() || null) : undefined,
    };

    // Clean undefined keys
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) delete updateData[key];
    });

    // Handle password update if supplied
    if (newPassword) {
      const cleanPass = newPassword.trim();
      if (cleanPass.length < 4) {
        return NextResponse.json({ success: false, message: 'Password must be at least 4 characters long.' }, { status: 400 });
      }
      updateData.guestPortalPassword = cleanPass;
    }

    const updatedGuest = await prisma.guest.update({
      where: { id: guestId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully!',
      data: {
        id: updatedGuest.id,
        firstName: updatedGuest.firstName,
        lastName: updatedGuest.lastName,
        email: updatedGuest.email,
        mobile: updatedGuest.mobile,
        gender: updatedGuest.gender,
        nationality: updatedGuest.nationality,
        birthDate: updatedGuest.birthDate ? updatedGuest.birthDate.toISOString().split('T')[0] : null,
        idType: updatedGuest.idType,
        idNumber: updatedGuest.idNumber,
        address: updatedGuest.address,
        companyName: updatedGuest.companyName,
        gstNumber: updatedGuest.gstNumber,
        billingAddress: updatedGuest.billingAddress,
      }
    });
  } catch (error: any) {
    console.error('[Guest Profile Update Error]:', error);
    return NextResponse.json({ success: false, message: error.message || 'Failed to update profile.' }, { status: 500 });
  }
}
