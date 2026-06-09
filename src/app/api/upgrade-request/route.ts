import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, message, preferredContact, featureKey, featureLabel, organizationName, currentPlan } = body;

    if (!name || !phone) {
      return NextResponse.json({ success: false, error: 'Name and phone are required.' }, { status: 400 });
    }

    // Try to get session for org context
    let organizationId: string | null = null;
    let userId: string | null = null;
    try {
      const session = await getSession();
      if (session?.organizationId) organizationId = session.organizationId;
      if (session?.id) userId = session.id;
    } catch {}

    // Store upgrade request as a special notification/log in DB
    // We use the SupportMessage model if it exists, otherwise fall back to console log
    try {
      // Check if SupportMessage model exists
      const record = await (prisma as any).upgradeRequest?.create?.({
        data: {
          name,
          email: email || null,
          phone,
          message: message || '',
          preferredContact: preferredContact || 'WHATSAPP',
          featureKey,
          featureLabel,
          organizationName: organizationName || '',
          currentPlan: currentPlan || '',
          organizationId: organizationId || null,
          requestedBy: userId || null,
          status: 'PENDING',
        },
      });
      if (record) {
        return NextResponse.json({ success: true, id: record.id });
      }
    } catch {
      // Model doesn't exist yet — log and proceed gracefully
    }

    // Fallback: log to console & return success (request is still captured in logs)
    console.log('[UPGRADE REQUEST]', {
      name, email, phone, message,
      preferredContact, featureKey, featureLabel,
      organizationName, currentPlan, organizationId,
    });

    // TODO: Send WhatsApp/email notification to support team here
    // e.g., await sendWhatsappAlert(`New upgrade request from ${name} for ${featureLabel}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Upgrade request error:', error);
    return NextResponse.json({ success: false, error: 'Server error. Please try again.' }, { status: 500 });
  }
}
