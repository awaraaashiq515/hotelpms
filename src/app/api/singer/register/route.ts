import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SignJWT } from 'jose';
import bcrypt from 'bcryptjs';

const secretKey = process.env.JWT_SECRET || 'super-secret-default-key-change-it-in-prod';
const key = new TextEncoder().encode(secretKey);

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, phone, genre, bio, photoUrl } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json({ success: false, message: 'Name, email and password are required.' }, { status: 400 });
    }

    // Check if email already exists
    const existing = await prisma.singer.findUnique({
      where: { email: email.toLowerCase().trim() }
    });

    if (existing) {
      return NextResponse.json({ success: false, message: 'A singer with this email already exists.' }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password.trim(), 10);

    const singer = await prisma.singer.create({
      data: {
        name,
        email: email.toLowerCase().trim(),
        passwordHash,
        phone: phone || null,
        genre: genre || null,
        bio: bio || null,
        photoUrl: photoUrl || null,
        isActive: true, // Self-registered singers are active by default
      }
    });

    // Issue JWT token (auto-login after registration)
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
      message: 'Registration successful!',
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
    console.error('[Singer Self-Register API Error]:', error);
    return NextResponse.json({ success: false, message: error.message || 'Server error' }, { status: 500 });
  }
}
