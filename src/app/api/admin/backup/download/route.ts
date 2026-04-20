import { NextRequest, NextResponse } from 'next/server';
import { apiError } from '@/lib/api-utils';
import { generateBackupData } from '@/lib/backup-utils';

export async function GET(req: NextRequest) {
  try {
    // 1. Get Session
    const sessionRes = await fetch(new URL('/api/auth/session', req.url), {
      headers: req.headers,
    });
    const session = await sessionRes.json();

    if (!session.authenticated || (session.user.role !== 'RESTAURANTS_ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return apiError('Unauthorized', 401);
    }

    const { user } = session;
    const organizationId = user.organizationId;
    const propertyId = req.nextUrl.searchParams.get('propertyId');

    if (!organizationId) {
      return apiError('Organization not found', 404);
    }

    // 2. Generate Data
    const backupData = await generateBackupData(organizationId, propertyId || undefined);

    if (!backupData) {
      return apiError('Could not generate backup data', 500);
    }

    // 3. Return as JSON file response
    const fileName = `backup_${organizationId}_${new Date().toISOString().split('T')[0]}.json`;
    
    return new NextResponse(JSON.stringify(backupData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });

  } catch (error: any) {
    return apiError(error);
  }
}
