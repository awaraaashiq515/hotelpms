import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

const WHATSAPP_KEYS = [
  'WHATSAPP_ENABLED',
  'WHATSAPP_PROVIDER',
  'META_ACCESS_TOKEN',
  'META_PHONE_ID',
  'META_WABA_ID',
  'WHATSAPP_API_KEY',
  'WHATSAPP_INSTANCE_ID',
  'WHATSAPP_TEMPLATE_BILL'
];

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, message: 'Please log in first' }, { status: 401 });
    }

    const settings = await prisma.systemSetting.findMany({
      where: { key: { in: WHATSAPP_KEYS } }
    });

    const data = WHATSAPP_KEYS.reduce((acc, key) => {
      acc[key] = settings.find((s: any) => s.key === key)?.value || '';
      return acc;
    }, {} as Record<string, string>);

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('[Super Admin WhatsApp GET Error]:', error);
    return NextResponse.json({ success: false, message: error.message || 'Failed to load settings' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, message: 'Please log in first' }, { status: 401 });
    }

    const body = await req.json();

    for (const key of WHATSAPP_KEYS) {
      if (body[key] !== undefined) {
        const stringValue = typeof body[key] === 'boolean' ? String(body[key]) : String(body[key]);
        await prisma.systemSetting.upsert({
          where: { key },
          update: { value: stringValue },
          create: { key, value: stringValue }
        });
      }
    }

    return NextResponse.json({ success: true, message: 'Master WhatsApp settings saved successfully' });
  } catch (error: any) {
    console.error('[Super Admin WhatsApp PUT Error]:', error);
    return NextResponse.json({ success: false, message: error.message || 'Failed to save settings' }, { status: 500 });
  }
}

// POST: Send Live Test Message
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, message: 'Please log in first' }, { status: 401 });
    }

    const body = await req.json();
    const { mobile, metaAccessToken, metaPhoneId, message } = body;

    if (!mobile) {
      return NextResponse.json({ success: false, message: 'Mobile number is required' }, { status: 400 });
    }

    // Clean mobile number (add 91 if 10 digits)
    let cleanMobile = mobile.replace(/[^0-9]/g, '');
    if (cleanMobile.length === 10) {
      cleanMobile = `91${cleanMobile}`;
    }

    // Load from body or fallback to system settings
    let token = metaAccessToken;
    let phoneId = metaPhoneId;

    if (!token || !phoneId) {
      const dbSettings = await prisma.systemSetting.findMany({
        where: { key: { in: ['META_ACCESS_TOKEN', 'META_PHONE_ID'] } }
      });
      const map = dbSettings.reduce((acc, s) => { acc[s.key] = s.value; return acc; }, {} as Record<string, string>);
      token = token || map['META_ACCESS_TOKEN'] || process.env.META_ACCESS_TOKEN;
      phoneId = phoneId || map['META_PHONE_ID'] || process.env.META_PHONE_ID;
    }

    if (!token || !phoneId) {
      return NextResponse.json({ success: false, message: 'Meta Phone ID and Access Token must be provided or saved.' }, { status: 400 });
    }

    const url = `https://graph.facebook.com/v20.0/${phoneId}/messages`;

    // Send official Meta test template 'hello_world' (Supported on all Meta Cloud API test numbers)
    console.log(`[Meta WhatsApp] Dispatching test to: ${cleanMobile} via PhoneID: ${phoneId}`);

    let metaRes = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: cleanMobile,
        type: 'template',
        template: {
          name: 'hello_world',
          language: { code: 'en_US' }
        }
      }),
    });

    let data = await metaRes.json();
    console.log('[Meta WhatsApp] Meta Response:', JSON.stringify(data));

    // If template succeeds or if we want to try text
    if (!metaRes.ok) {
      const errMsg = data?.error?.message || data?.error?.error_user_msg || 'Meta API returned an error';
      const errDetails = data?.error?.error_data?.details || '';
      return NextResponse.json({
        success: false,
        message: `Meta Error: ${errMsg} ${errDetails ? '(' + errDetails + ')' : ''}`,
        metaError: data?.error
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `Test message delivered successfully to +${cleanMobile}! (Check your WhatsApp)`,
      data
    });
  } catch (error: any) {
    console.error('[Super Admin WhatsApp Test Error]:', error);
    return NextResponse.json({ success: false, message: error.message || 'Internal server error' }, { status: 500 });
  }
}

