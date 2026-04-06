import { NextRequest, NextResponse } from 'next/server';
import { getSession, encrypt } from '@/lib/session';
import { cookies } from 'next/headers';
import { apiError, apiResponse } from '@/lib/api-utils';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const { propertyId } = await request.json();
    if (!propertyId) return apiError(new Error('Property ID is required'), 400);

    // Update session payload with new propertyId
    const newSession = {
      ...session,
      propertyId: propertyId
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

    return apiResponse({ propertyId }, 'Property selected successfully');
  } catch (error) {
    return apiError(error);
  }
}
