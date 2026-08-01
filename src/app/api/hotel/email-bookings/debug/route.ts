import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ authenticated: false, error: 'No session' });
    }

    const property = session.propertyId 
      ? await prisma.property.findUnique({
          where: { id: session.propertyId },
          select: { id: true, name: true, bookingEmail: true, gmailAppPassword: true }
        })
      : null;

    return NextResponse.json({
      authenticated: true,
      session,
      dbProperty: property
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message });
  }
}
