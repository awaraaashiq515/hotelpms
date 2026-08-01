import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { syncAllProperties, syncGmailForProperty } from '@/lib/gmail-imap-syncer';

// POST /api/hotel/email-bookings/sync
// Body: { propertyId?: string } - if propertyId given, sync only that property, else sync all
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const propertyId = body.propertyId || session.propertyId;

    console.log('[DEBUG] Sync API POST called. Session propertyId:', session.propertyId, 'Request body propertyId:', body.propertyId, 'Final propertyId:', propertyId);

    if (propertyId) {
      // Sync single property
      const result = await syncGmailForProperty(propertyId);
      console.log('[DEBUG] syncGmailForProperty result:', result);
      return NextResponse.json({
        success: true,
        message: result.synced > 0 
          ? `✅ ${result.synced} new booking email(s) synced from Gmail.`
          : result.errors.length > 0 
            ? `❌ Sync failed: ${result.errors[0]}`
            : 'No new booking emails found.',
        data: result,
      });
    } else if (session.role === 'SUPER_ADMIN') {
      // Sync ALL properties (Super Admin only)
      const results = await syncAllProperties();
      const totalSynced = results.reduce((sum, r) => sum + r.synced, 0);
      return NextResponse.json({
        success: true,
        message: `Sync complete. ${totalSynced} new booking(s) found across ${results.length} hotel(s).`,
        data: results,
      });
    } else {
      return NextResponse.json({ success: false, message: 'No property ID found in session' }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || 'Sync failed' }, { status: 500 });
  }
}
