import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action = 'register', phone, password, name, shopName, address, city, state, email } = body;

    if (!phone || !password) {
      return NextResponse.json({ success: false, message: 'Phone and password are required' }, { status: 400 });
    }

    const cleanPhone = phone.trim();
    const passwordHash = hashPassword(password);

    if (action === 'register') {
      if (!name) {
        return NextResponse.json({ success: false, message: 'Vendor name is required' }, { status: 400 });
      }

      const existing = await prisma.bikeRentalVendor.findUnique({
        where: { phone: cleanPhone },
      });
      if (existing) {
        return NextResponse.json({ success: false, message: 'Vendor with this phone number already registered' }, { status: 409 });
      }

      const vendor = await prisma.bikeRentalVendor.create({
        data: {
          name: name.trim(),
          phone: cleanPhone,
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
        vendor: { id: vendor.id, name: vendor.name, phone: vendor.phone, shopName: vendor.shopName, city: vendor.city },
      });
    }

    // Login action
    const vendor = await prisma.bikeRentalVendor.findUnique({
      where: { phone: cleanPhone },
    });

    if (!vendor || vendor.passwordHash !== passwordHash) {
      return NextResponse.json({ success: false, message: 'Invalid phone or password' }, { status: 401 });
    }

    if (!vendor.isActive) {
      return NextResponse.json({ success: false, message: 'Your vendor account is inactive. Please contact admin.' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      vendor: { id: vendor.id, name: vendor.name, phone: vendor.phone, shopName: vendor.shopName, city: vendor.city },
    });
  } catch (error: any) {
    console.error('Bike vendor auth error:', error);
    return NextResponse.json({ success: false, message: error.message || 'Server error' }, { status: 500 });
  }
}
