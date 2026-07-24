import { NextRequest, NextResponse } from 'next/server';
import { getSession, encrypt, slugify } from '@/lib/session';
import { cookies } from 'next/headers';
import { apiError, apiResponse } from '@/lib/api-utils';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const { propertyId } = await request.json();
    if (!propertyId) return apiError(new Error('Property ID is required'), 400);

    // Fetch property details to update session cookie payload
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: { code: true, name: true, type: true }
    });

    if (!property) {
      return apiError(new Error('Property not found'), 404);
    }

    const propSlug = property.name ? slugify(property.name) : null;

    // Update session payload with new propertyId, propertyCode, propertySlug, and propertyType
    const newSession = {
      ...session,
      propertyId: propertyId,
      propertyCode: property.code,
      propertySlug: propSlug,
      propertyType: property.type
    };

    const token = await encrypt(newSession);
    
    // Set updated cookie
    const cookieStore = await cookies();
    cookieStore.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 8, // 8 hours
    });

    return apiResponse({ propertyId, propertyCode: property.code, propertySlug: propSlug }, 'Property selected successfully');
  } catch (error) {
    return apiError(error);
  }
}
