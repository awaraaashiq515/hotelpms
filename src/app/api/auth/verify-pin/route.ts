import { NextRequest } from 'next/server';
import { apiResponse, apiError } from '@/lib/api-utils';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { pin } = await req.json();
    
    // Get current session user
    const sessionRes = await fetch(new URL('/api/auth/session', req.url), {
      headers: req.headers,
    });
    const session = await sessionRes.json();

    if (!session.authenticated) {
      return apiError('Unauthorized', 401);
    }

    const propertyId = session.user.propertyId;
    if (!propertyId) {
      return apiError('No property associated with this session. Cannot verify terminal PIN.', 400);
    }

    const property = await prisma.property.findUnique({
      where: { id: propertyId }
    });

    if (!property) return apiError('Property not found', 404);

    if (!property.posTerminalPin) {
      return apiError('No Terminal PIN configured for this property. Please set it in Settings -> Admin.', 400);
    }

    if (property.posTerminalPin === pin) {
      return apiResponse({ verified: true }, 'Terminal Unlocked');
    } else {
      return apiError('Invalid Terminal PIN', 403);
    }

  } catch (error: any) {
    return apiError(error);
  }
}
