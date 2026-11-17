import { NextRequest, NextResponse } from 'next/server';
import { saveSecurityAlert, ThreatType, Severity } from '@/lib/security-monitor';

// POST /api/admin/security-log
// Internal endpoint called by middleware to log threats
// (no auth check needed — middleware calls this internally)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, severity, message, ip, userAgent, path, method, payload, userId, propertyId } = body;

    if (!type || !severity || !message) {
      return NextResponse.json({ success: false }, { status: 400 });
    }

    await saveSecurityAlert({
      type: type as ThreatType,
      severity: severity as Severity,
      message,
      ip,
      userAgent,
      path,
      method,
      payload,
      userId,
      propertyId,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

