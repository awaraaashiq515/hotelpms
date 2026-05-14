import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError, resolveAdminProperty } from '@/lib/api-utils';
import { getSession } from '@/lib/session';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const propertyId = await resolveAdminProperty(session, prisma);
    if (!propertyId) return apiError(new Error('Property context required'), 400);

    let preferences: any[] = [];
    
    // Attempt to use model, fallback to Raw SQL if client is stale
    if ((prisma as any).notificationPreference) {
      preferences = await (prisma as any).notificationPreference.findMany({
        where: { propertyId },
      });
    } else {
      console.warn('Prisma client stale, using Raw SQL fallback for GET');
      preferences = await prisma.$queryRawUnsafe(
        `SELECT * FROM NotificationPreference WHERE propertyId = ?`,
        propertyId
      );
    }

    return apiResponse(preferences, 'Preferences fetched successfully');
  } catch (error) {
    console.error('[Notification Settings GET Error]:', error);
    return apiError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const propertyId = await resolveAdminProperty(session, prisma);
    if (!propertyId) return apiError(new Error('Property context required'), 400);

    const body = await request.json();
    const { type, isEnabled, soundEnabled } = body;
    if (!type) return apiError(new Error('Type is required'), 400);

    const enabled = isEnabled === true || isEnabled === 'true';
    const sound = soundEnabled === true || soundEnabled === 'true';

    let preference;

    // Attempt to use model, fallback to Raw SQL if client is stale
    if ((prisma as any).notificationPreference) {
      preference = await (prisma as any).notificationPreference.upsert({
        where: { propertyId_type: { propertyId, type } },
        update: { isEnabled: enabled, soundEnabled: sound },
        create: { propertyId, type, isEnabled: enabled, soundEnabled: sound },
      });
    } else {
      console.warn('Prisma client stale, using Raw SQL fallback for PUT');
      const now = new Date().toISOString();
      const id = `pref_${Math.random().toString(36).substring(2, 11)}`;
      
      // SQLite specific Upsert (REPLACE INTO or INSERT ON CONFLICT)
      await prisma.$executeRawUnsafe(
        `INSERT INTO NotificationPreference (id, propertyId, type, isEnabled, soundEnabled, createdAt, updatedAt) 
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(propertyId, type) DO UPDATE SET 
         isEnabled = excluded.isEnabled, 
         soundEnabled = excluded.soundEnabled, 
         updatedAt = excluded.updatedAt`,
        id, propertyId, type, enabled ? 1 : 0, sound ? 1 : 0, now, now
      );
      
      preference = { type, isEnabled: enabled, soundEnabled: sound };
    }

    return apiResponse(preference, 'Preference updated successfully');
  } catch (error) {
    console.error('[Notification Settings PUT Error]:', error);
    return apiError(error);
  }
}
