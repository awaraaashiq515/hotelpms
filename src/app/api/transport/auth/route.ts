import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SignJWT } from 'jose';
import bcrypt from 'bcryptjs';

const secretKey = process.env.JWT_SECRET || 'super-secret-default-key-change-it-in-prod';
const key = new TextEncoder().encode(secretKey);

// POST /api/transport/auth — Driver Login & Register (Refreshed)
export async function POST(request: NextRequest) {
  try {
    console.log('[DEBUG PRISMA KEYS]:', Object.keys(prisma));
    console.log('[DEBUG TRANSPORT DRIVER]:', (prisma as any).transportDriver);
    const body = await request.json();
    const { action, phone, password, name } = body;

    if (!phone || !password) {
      return NextResponse.json({ success: false, message: 'Phone and password are required.' }, { status: 400 });
    }

    // ─── REGISTER ───────────────────────────────────────────────────────────
    if (action === 'register') {
      if (!name) {
        return NextResponse.json({ success: false, message: 'Name is required for registration.' }, { status: 400 });
      }

      const existing = await prisma.transportDriver.findUnique({ where: { phone: phone.trim() } });
      if (existing) {
        return NextResponse.json({ success: false, message: 'A driver with this phone number already exists.' }, { status: 409 });
      }

      const passwordHash = await bcrypt.hash(password, 10);

      const driver = await prisma.transportDriver.create({
        data: {
          name: name.trim(),
          phone: phone.trim(),
          passwordHash,
          email: body.email?.trim() || null,
          licenseNumber: body.licenseNumber?.trim() || null,
          idProofNumber: body.idProofNumber?.trim() || null,
          address: body.address?.trim() || null,
          city: body.city?.trim() || null,
          state: body.state?.trim() || null,
          photoUrl: body.photoUrl || null,
          licenseUrl: body.licenseUrl || null,
          idProofUrl: body.idProofUrl || null,
          rcUrl: body.rcUrl || null,
          isOnline: true,
        }
      });

      // Auto-register vehicle if plateNumber is provided
      if (body.plateNumber) {
        await prisma.transportVehicle.create({
          data: {
            driverId: driver.id,
            type: body.vehicleType || 'CAR',
            plateNumber: body.plateNumber.trim().toUpperCase(),
            model: body.model?.trim() || null,
            color: body.color?.trim() || null,
            capacity: Number(body.capacity) || 4,
            perKmRate: body.perKmRate ? Number(body.perKmRate) : 15.0,
            baseFare: body.baseFare ? Number(body.baseFare) : 50.0,
          }
        });
      }

      const token = await new SignJWT({
        driverId: driver.id,
        phone: driver.phone,
        type: 'TRANSPORT_PORTAL'
      })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('30d')
        .sign(key);

      return NextResponse.json({
        success: true,
        token,
        driver: {
          id: driver.id,
          name: driver.name,
          phone: driver.phone,
          email: driver.email,
          city: driver.city,
          state: driver.state,
          photoUrl: driver.photoUrl,
          rating: driver.rating,
          isOnline: driver.isOnline,
        }
      });
    }

    // ─── LOGIN ───────────────────────────────────────────────────────────────
    const driver = await prisma.transportDriver.findUnique({ where: { phone: phone.trim() } });

    if (!driver || !driver.isActive) {
      return NextResponse.json({ success: false, message: 'Invalid credentials or account is inactive.' }, { status: 401 });
    }

    const passwordMatch = await bcrypt.compare(password, driver.passwordHash);
    if (!passwordMatch) {
      return NextResponse.json({ success: false, message: 'Invalid phone or password.' }, { status: 401 });
    }

    const token = await new SignJWT({
      driverId: driver.id,
      phone: driver.phone,
      type: 'TRANSPORT_PORTAL'
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('30d')
      .sign(key);

    return NextResponse.json({
      success: true,
      token,
      driver: {
        id: driver.id,
        name: driver.name,
        phone: driver.phone,
        email: driver.email,
        photoUrl: driver.photoUrl,
        rating: driver.rating,
        isOnline: driver.isOnline,
      }
    });

  } catch (error: any) {
    console.error('[Transport Auth Error]:', error);
    return NextResponse.json({ success: false, message: error.message || 'Server error' }, { status: 500 });
  }
}
