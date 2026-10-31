import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import { getSession } from '@/lib/session';
import { comparePassword } from '@/lib/auth';

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

/**
 * GET — Check logged in session from /login (cookie-based)
 * Automatically returns or provisions a BikeRentalVendor record for the logged in user/property
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.id) {
      return NextResponse.json({ success: false, authenticated: false, message: 'Not authenticated' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: { id: true, fullName: true, phone: true, email: true, propertyId: true }
    });

    const userEmail = user?.email || session.email;
    const userPhone = user?.phone;
    const propId = user?.propertyId || session.propertyId;

    // 1. Check if vendor already exists for this email, phone, or property
    let vendor = await prisma.bikeRentalVendor.findFirst({
      where: {
        OR: [
          ...(userEmail ? [{ email: userEmail }, { email: userEmail.toLowerCase() }] : []),
          ...(userPhone ? [{ phone: userPhone }] : []),
          ...(propId ? [{ propertyId: propId }] : []),
        ],
      },
    });

    // 2. If vendor doesn't exist yet, auto-provision one linked to user's property/name
    if (!vendor) {
      let propName = 'Two Wheeler Fleet Desk';
      let propCity = 'Local';
      let propState: string | null = null;

      if (propId) {
        const prop = await prisma.property.findUnique({
          where: { id: propId },
          select: { name: true, city: true, state: true }
        });
        if (prop) {
          propName = prop.name || propName;
          propCity = prop.city || propCity;
          propState = prop.state || null;
        }
      }

      const safePhone = userPhone || `V-${session.id.slice(-8)}`;

      vendor = await prisma.bikeRentalVendor.create({
        data: {
          propertyId: propId || null,
          name: user?.fullName || 'Fleet Operator',
          email: userEmail || null,
          phone: safePhone,
          shopName: propName,
          city: propCity,
          state: propState,
          isActive: true,
        },
      });
    }

    return NextResponse.json({
      success: true,
      authenticated: true,
      vendor: {
        id: vendor.id,
        name: vendor.name,
        phone: vendor.phone,
        email: vendor.email,
        shopName: vendor.shopName,
        city: vendor.city,
        state: vendor.state,
      },
    });
  } catch (error: any) {
    console.error('Bike vendor session check error:', error);
    return NextResponse.json({ success: false, message: error.message || 'Server error' }, { status: 500 });
  }
}

/**
 * POST — Authenticate or Register Bike Rental Vendor
 * Supports login via Email OR Phone
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action = 'login', phone, email, username, password, name, shopName, address, city, state } = body;

    const identifier = (email || phone || username || '').trim();

    if (!identifier || !password) {
      return NextResponse.json({ success: false, message: 'Email/Phone and password are required' }, { status: 400 });
    }

    const passwordHash = hashPassword(password);

    if (action === 'register') {
      if (!name) {
        return NextResponse.json({ success: false, message: 'Vendor name is required' }, { status: 400 });
      }

      const existing = await prisma.bikeRentalVendor.findFirst({
        where: {
          OR: [
            { phone: identifier },
            ...(email ? [{ email: email.trim().toLowerCase() }] : []),
          ],
        },
      });

      if (existing) {
        return NextResponse.json({ success: false, message: 'Vendor with this phone or email already registered' }, { status: 409 });
      }

      const vendor = await prisma.bikeRentalVendor.create({
        data: {
          name: name.trim(),
          phone: identifier,
          passwordHash,
          shopName: shopName?.trim() || null,
          email: email?.trim() || null,
          address: address?.trim() || null,
          city: city?.trim() || null,
          state: state?.trim() || null,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Registration successful! Welcome to Bike Rental Portal.',
        vendor: { id: vendor.id, name: vendor.name, phone: vendor.phone, email: vendor.email, shopName: vendor.shopName, city: vendor.city },
      });
    }

    // ── Login Action ──
    // 1. Try finding in BikeRentalVendor table (by email or phone)
    let vendor = await prisma.bikeRentalVendor.findFirst({
      where: {
        OR: [
          { email: identifier },
          { email: identifier.toLowerCase() },
          { phone: identifier },
        ],
      },
    });

    let isValidPassword = false;

    if (vendor && vendor.passwordHash) {
      if (vendor.passwordHash === passwordHash) {
        isValidPassword = true;
      } else {
        try {
          isValidPassword = await comparePassword(password, vendor.passwordHash);
        } catch (_) {}
      }
    }

    // 2. If not found or password didn't match, check User table ONLY if user has a Bike role
    if (!isValidPassword) {
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: identifier },
            { email: identifier.toLowerCase() },
            { phone: identifier },
          ],
          isActive: true,
        },
        include: { property: true, role: true },
      });

      if (user && user.passwordHash) {
        const roleName = (typeof user.role === 'object' ? (user as any).role?.name : (user as any).role) || '';
        const designation = ((user as any).designation || '').toLowerCase();
        const isBikeRole = 
          roleName === 'BIKE_RENTAL' || 
          roleName === 'BIKE_VENDOR' || 
          roleName.toLowerCase().includes('bike') ||
          designation.includes('bike');

        if (isBikeRole) {
          const userPassValid = await comparePassword(password, user.passwordHash);
          if (userPassValid) {
            isValidPassword = true;

            // Find or auto-link vendor record for this user
            if (!vendor) {
              vendor = await prisma.bikeRentalVendor.findFirst({
                where: {
                  OR: [
                    { email: user.email },
                    ...(user.propertyId ? [{ propertyId: user.propertyId }] : []),
                  ],
                },
              });

              if (!vendor) {
                vendor = await prisma.bikeRentalVendor.create({
                  data: {
                    propertyId: user.propertyId || null,
                    name: user.fullName || 'Fleet Operator',
                    email: user.email,
                    phone: user.phone || identifier,
                    shopName: user.property?.name || 'Two Wheeler Fleet Desk',
                    city: user.property?.city || 'Local',
                    state: user.property?.state || null,
                    passwordHash,
                    isActive: true,
                  },
                });
              }
            }
          }
        }
      }
    }

    if (!vendor || !isValidPassword) {
      return NextResponse.json({ success: false, message: 'Invalid email/phone or password' }, { status: 401 });
    }

    if (!vendor.isActive) {
      return NextResponse.json({ success: false, message: 'Your vendor account is inactive. Please contact admin.' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      vendor: {
        id: vendor.id,
        name: vendor.name,
        phone: vendor.phone,
        email: vendor.email,
        shopName: vendor.shopName,
        city: vendor.city,
        state: vendor.state,
      },
    });
  } catch (error: any) {
    console.error('Bike vendor auth error:', error);
    return NextResponse.json({ success: false, message: error.message || 'Server error' }, { status: 500 });
  }
}
