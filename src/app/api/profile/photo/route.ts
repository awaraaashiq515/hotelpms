import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { getWTUserFromRequest } from '@/lib/walkie-talkie-auth';
import { jwtVerify } from 'jose';

const secretKey = process.env.JWT_SECRET || 'super-secret-default-key-change-it-in-prod';
const key = new TextEncoder().encode(secretKey);

export async function POST(request: NextRequest) {
  try {
    let fileBuffer: Buffer | null = null;
    let fileExt = 'jpg';
    let userType = '';
    let targetId = '';

    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as unknown as File | null;
      userType = (formData.get('userType') as string) || '';
      targetId = (formData.get('id') as string) || '';

      if (!file) {
        return NextResponse.json({ success: false, message: 'No file uploaded' }, { status: 400 });
      }

      const bytes = await file.arrayBuffer();
      fileBuffer = Buffer.from(bytes);
      const ext = file.name?.split('.').pop()?.toLowerCase();
      if (ext && ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)) {
        fileExt = ext === 'jpeg' ? 'jpg' : ext;
      }
    } else {
      const body = await request.json();
      userType = body.userType || '';
      targetId = body.id || '';
      const base64Data = body.photoBase64 || body.image;

      if (!base64Data) {
        return NextResponse.json({ success: false, message: 'No image data provided' }, { status: 400 });
      }

      // Parse base64
      const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        const mime = matches[1];
        fileExt = mime.split('/')[1] || 'jpg';
        if (fileExt === 'jpeg') fileExt = 'jpg';
        fileBuffer = Buffer.from(matches[2], 'base64');
      } else {
        fileBuffer = Buffer.from(base64Data, 'base64');
      }
    }

    if (!fileBuffer) {
      return NextResponse.json({ success: false, message: 'Failed to process image' }, { status: 400 });
    }

    // Determine user: Guest or Staff
    let guestId: string | null = null;
    let userId: string | null = null;

    // 1. Check Guest JWT Bearer Token
    const authHeader = request.headers.get('Authorization') || request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const { payload } = await jwtVerify(token, key, { algorithms: ['HS256'] });
        if (payload && payload.type === 'GUEST_PORTAL' && payload.guestId) {
          guestId = payload.guestId as string;
        }
      } catch {}
    }

    // 2. Check Walkie-Talkie User
    if (!guestId) {
      const wtUser = await getWTUserFromRequest(request);
      if (wtUser?.id) {
        userId = wtUser.id;
      }
    }

    // 3. Check Session Cookie
    if (!guestId && !userId) {
      const session = await getSession();
      if (session?.id) {
        userId = session.id;
      }
    }

    // Fallbacks from body/targetId
    if (!guestId && userType === 'guest' && targetId) {
      guestId = targetId;
    } else if (!userId && (userType === 'staff' || userType === 'housekeeper') && targetId) {
      userId = targetId;
    }

    // Save File
    const uniqueId = guestId || userId || targetId || 'anon';
    const filename = `avatar-${uniqueId}-${Date.now()}.${fileExt}`;
    const filePath = join(process.cwd(), 'public/uploads/avatars', filename);

    await writeFile(filePath, fileBuffer);
    const avatarUrl = `/api/images/avatars/${filename}`;

    // Update DB
    if (guestId || userType === 'guest') {
      const targetGuestId = guestId || targetId;
      if (targetGuestId) {
        await prisma.guest.update({
          where: { id: targetGuestId },
          data: { avatarUrl },
        });
      }
    } else if (userId || userType === 'staff' || userType === 'housekeeper') {
      const targetUserId = userId || targetId;
      if (targetUserId) {
        // Update User
        await prisma.user.updateMany({
          where: { OR: [{ id: targetUserId }, { email: targetUserId }] },
          data: { avatarUrl },
        });

        // Also update linked StaffMember if exists
        await prisma.staffMember.updateMany({
          where: { OR: [{ userId: targetUserId }, { id: targetUserId }] },
          data: { avatarUrl },
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Profile photo uploaded successfully',
      avatarUrl,
    });
  } catch (error: any) {
    console.error('Profile photo upload error:', error);
    return NextResponse.json({ success: false, message: error.message || 'Upload failed' }, { status: 500 });
  }
}

// DELETE /api/profile/photo — Remove profile photo
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userType = searchParams.get('userType');
    const id = searchParams.get('id');

    if (userType === 'guest' && id) {
      await prisma.guest.update({
        where: { id },
        data: { avatarUrl: null },
      });
    } else if (id) {
      await prisma.user.updateMany({
        where: { OR: [{ id }, { email: id }] },
        data: { avatarUrl: null },
      });
      await prisma.staffMember.updateMany({
        where: { OR: [{ userId: id }, { id }] },
        data: { avatarUrl: null },
      });
    }

    return NextResponse.json({ success: true, message: 'Profile photo removed' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
