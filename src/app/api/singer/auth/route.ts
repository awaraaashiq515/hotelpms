import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SignJWT } from 'jose';
import bcrypt from 'bcryptjs';

const secretKey = process.env.JWT_SECRET || 'super-secret-default-key-change-it-in-prod';
const key = new TextEncoder().encode(secretKey);

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ success: false, message: 'Please enter email and password.' }, { status: 400 });
    }

    const singer = await prisma.singer.findUnique({
      where: { email: email.toLowerCase().trim() }
    });

    if (!singer || !singer.isActive) {
      return NextResponse.json({ success: false, message: 'Invalid credentials or inactive account.' }, { status: 401 });
    }

    const passwordMatch = await bcrypt.compare(password, singer.passwordHash);

    if (!passwordMatch) {
      return NextResponse.json({ success: false, message: 'Invalid credentials.' }, { status: 401 });
    }

    // Issue singer JWT token (valid for 24 hours)
    const token = await new SignJWT({
      singerId: singer.id,
      email: singer.email,
      type: 'SINGER_PORTAL'
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(key);

    return NextResponse.json({
      success: true,
      token,
      singer: {
        id: singer.id,
        name: singer.name,
        email: singer.email,
        genre: singer.genre,
        photoUrl: singer.photoUrl,
        rating: singer.rating
      }
    });
  } catch (error: any) {
    console.error('[Singer Auth Login Error]:', error);
    return NextResponse.json({ success: false, message: error.message || 'Server error' }, { status: 500 });
  }
}
