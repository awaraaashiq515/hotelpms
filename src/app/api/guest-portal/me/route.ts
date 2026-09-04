import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jwtVerify } from 'jose';

const secretKey = process.env.JWT_SECRET || 'super-secret-default-key-change-it-in-prod';
const key = new TextEncoder().encode(secretKey);

export async function GET(request: NextRequest) {
  try {
    // Only check Authorization header (localStorage token)
    const authHeader = request.headers.get('Authorization') || request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, message: 'No token provided.' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    
    let payload: any;
    try {
      const result = await jwtVerify(token, key, { algorithms: ['HS256'] });
      payload = result.payload;
    } catch (jwtErr: any) {
      console.error('[Guest Portal JWT Error]:', jwtErr.message);
      return NextResponse.json({ success: false, message: 'Invalid or expired session.' }, { status: 401 });
    }

    if (!payload || payload.type !== 'GUEST_PORTAL' || !payload.guestId) {
      return NextResponse.json({ success: false, message: 'Invalid session type.' }, { status: 401 });
    }

    const guest = await prisma.guest.findUnique({
      where: { id: payload.guestId as string },
      include: {
        reservations: {
          include: {
            roomType: true,
            property: true,
            rooms: {
              include: {
                room: true,
              }
            },
            folios: {
              include: {
                transactions: {
                  orderBy: { txnDate: 'desc' }
                },
                posOrders: {
                  orderBy: { createdAt: 'desc' },
                  include: {
                    outlet: { select: { name: true, type: true } },
                    items: {
                      select: {
                        id: true,
                        quantity: true,
                        unitPrice: true,
                        totalAmount: true,
                        variantName: true,
                        product: {
                          select: {
                            name: true
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          orderBy: { createdAt: 'desc' },
        },
      },
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
        birthDate: guest.birthDate,
        idType: guest.idType,
        idNumber: guest.idNumber,
        address: guest.address,
        companyName: guest.companyName,
        gstNumber: guest.gstNumber,
        billingAddress: guest.billingAddress,
        loyaltyPoints: guest.loyaltyPoints,
        segment: guest.segment,
        reservations: guest.reservations,
      },
    });
  } catch (error: any) {
    console.error('[Guest Portal Me Error]:', error);
    return NextResponse.json({ success: false, message: error.message || 'Failed to load data.' }, { status: 500 });
  }
}
