import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

// POST to test Spotify client credentials (Super Admin only)
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const { clientId, clientSecret } = await req.json();
  if (!clientId || !clientSecret) {
    return NextResponse.json({ success: false, message: 'Client ID and Secret are required' });
  }

  try {
    const res = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64'),
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
      }),
    });

    const data = await res.json();
    if (res.ok && data.access_token) {
      return NextResponse.json({ success: true, message: 'Credentials are valid! Connection successful.' });
    } else {
      return NextResponse.json({ 
        success: false, 
        message: data.error_description || data.error || 'Failed to authenticate with Spotify' 
      });
    }
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message || 'Connection failed' });
  }
}
