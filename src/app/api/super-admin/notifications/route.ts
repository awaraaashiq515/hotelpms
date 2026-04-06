import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const keys = [
      'SMS_PROVIDER',
      'SMS_API_KEY',
      'SMS_SENDER_ID',
      'TEMPLATE_BILL_PAID',
      'TEMPLATE_KOT',
      'TEMPLATE_WELCOME',
      'GEMINI_API_KEY'
    ];

    const settings = await prisma.systemSetting.findMany({
      where: { key: { in: keys } }
    });

    const data = keys.reduce((acc, key) => {
      acc[key] = settings.find(s => s.key === key)?.value || '';
      return acc;
    }, {} as Record<string, string>);

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: 'Failed to load settings' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const keys = [
      'SMS_PROVIDER',
      'SMS_API_KEY',
      'SMS_SENDER_ID',
      'TEMPLATE_BILL_PAID',
      'TEMPLATE_KOT',
      'TEMPLATE_WELCOME',
      'GEMINI_API_KEY'
    ];

    for (const key of keys) {
      if (body[key] !== undefined) {
        await prisma.systemSetting.upsert({
          where: { key },
          update: { value: body[key] },
          create: { key, value: body[key] }
        });
      }
    }

    return NextResponse.json({ success: true, message: 'Settings saved successfully' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: 'Failed to update settings' }, { status: 500 });
  }
}
