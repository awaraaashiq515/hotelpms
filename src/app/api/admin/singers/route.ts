import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import bcrypt from 'bcryptjs';

// GET: List all singers
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const singers = await prisma.singer.findMany({
      orderBy: { name: 'asc' },
      include: {
        videos: true,
        posts: true,
      }
    });

    return NextResponse.json({ success: true, data: singers });
  } catch (error: any) {
    console.error('[Admin Singers GET Error]:', error);
    return NextResponse.json({ success: false, message: error.message || 'Server error' }, { status: 500 });
  }
}

// POST: Add new singer
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { 
      name, email, password, phone, bio, genre, photoUrl,
      chargeWithoutGst, gstPercent, chargeWithGst, gstNumber
    } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json({ success: false, message: 'Name, email and password are required.' }, { status: 400 });
    }

    // Check if email already exists
    const existing = await prisma.singer.findUnique({
      where: { email: email.toLowerCase().trim() }
    });

    if (existing) {
      return NextResponse.json({ success: false, message: 'Singer with this email already exists.' }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password.trim(), 10);

    const parsedChargeWithoutGst = chargeWithoutGst !== undefined && chargeWithoutGst !== '' && chargeWithoutGst !== null ? parseFloat(chargeWithoutGst) : null;
    const parsedGstPercent = gstPercent !== undefined && gstPercent !== '' && gstPercent !== null ? parseFloat(gstPercent) : 18.0;
    let parsedChargeWithGst = chargeWithGst !== undefined && chargeWithGst !== '' && chargeWithGst !== null ? parseFloat(chargeWithGst) : null;

    if (parsedChargeWithoutGst !== null && (parsedChargeWithGst === null || isNaN(parsedChargeWithGst))) {
      const gstAmt = (parsedChargeWithoutGst * (parsedGstPercent || 0)) / 100;
      parsedChargeWithGst = Math.round(parsedChargeWithoutGst + gstAmt);
    }

    const singer = await prisma.singer.create({
      data: {
        name,
        email: email.toLowerCase().trim(),
        passwordHash,
        phone: phone || null,
        bio: bio || null,
        genre: genre || null,
        photoUrl: photoUrl || null,
        chargeWithoutGst: parsedChargeWithoutGst,
        gstPercent: parsedGstPercent,
        chargeWithGst: parsedChargeWithGst,
        gstNumber: gstNumber ? gstNumber.trim().toUpperCase() : null,
      }
    });

    return NextResponse.json({ success: true, message: 'Singer created successfully.', data: singer });
  } catch (error: any) {
    console.error('[Admin Singers POST Error]:', error);
    return NextResponse.json({ success: false, message: error.message || 'Server error' }, { status: 500 });
  }
}

// PUT: Update existing singer
export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { 
      id, name, email, password, phone, bio, genre, photoUrl, isActive,
      chargeWithoutGst, gstPercent, chargeWithGst, gstNumber
    } = await request.json();

    if (!id) {
      return NextResponse.json({ success: false, message: 'Singer ID is required.' }, { status: 400 });
    }

    // Prepare update data
    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email.toLowerCase().trim();
    if (phone !== undefined) updateData.phone = phone;
    if (bio !== undefined) updateData.bio = bio;
    if (genre !== undefined) updateData.genre = genre;
    if (photoUrl !== undefined) updateData.photoUrl = photoUrl;
    if (isActive !== undefined) updateData.isActive = isActive;

    if (chargeWithoutGst !== undefined) {
      updateData.chargeWithoutGst = chargeWithoutGst !== '' && chargeWithoutGst !== null ? parseFloat(chargeWithoutGst) : null;
    }
    if (gstPercent !== undefined) {
      updateData.gstPercent = gstPercent !== '' && gstPercent !== null ? parseFloat(gstPercent) : 18.0;
    }
    if (chargeWithGst !== undefined) {
      updateData.chargeWithGst = chargeWithGst !== '' && chargeWithGst !== null ? parseFloat(chargeWithGst) : null;
    }
    if (gstNumber !== undefined) {
      updateData.gstNumber = gstNumber ? gstNumber.trim().toUpperCase() : null;
    }

    if (password) {
      updateData.passwordHash = await bcrypt.hash(password.trim(), 10);
    }

    const singer = await prisma.singer.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({ success: true, message: 'Singer updated successfully.', data: singer });
  } catch (error: any) {
    console.error('[Admin Singers PUT Error]:', error);
    return NextResponse.json({ success: false, message: error.message || 'Server error' }, { status: 500 });
  }
}

// DELETE: Delete a singer
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, message: 'Singer ID is required.' }, { status: 400 });
    }

    await prisma.singer.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: 'Singer deleted successfully.' });
  } catch (error: any) {
    console.error('[Admin Singers DELETE Error]:', error);
    return NextResponse.json({ success: false, message: error.message || 'Server error' }, { status: 500 });
  }
}
