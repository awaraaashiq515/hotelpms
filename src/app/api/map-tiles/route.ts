import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const z = searchParams.get('z');
    const x = searchParams.get('x');
    const y = searchParams.get('y');

    if (!z || !x || !y) {
      return NextResponse.json({ message: 'Missing parameters' }, { status: 400 });
    }

    const type = searchParams.get('type') || 'google';

    let tileUrl = `https://mt1.google.com/vt/lyrs=m&x=${x}&y=${y}&z=${z}`;
    if (type === 'dark') {
      tileUrl = `https://a.basemaps.cartocdn.com/dark_all/${z}/${x}/${y}.png`;
    } else if (type === 'satellite') {
      tileUrl = `https://mt1.google.com/vt/lyrs=y&x=${x}&y=${y}&z=${z}`;
    } else if (type === 'osm') {
      tileUrl = `https://tile.openstreetmap.org/${z}/${x}/${y}.png`;
    }

    const res = await fetch(tileUrl, {
      headers: {
        'User-Agent': 'OrderMint-POS-Manager/1.0',
      },
    });

    if (!res.ok) {
      return NextResponse.json({ message: 'Failed to fetch tile' }, { status: res.status });
    }

    const imageBuffer = await res.arrayBuffer();

    return new NextResponse(Buffer.from(imageBuffer), {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=86400',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error: any) {
    console.error('Map tile proxy error:', error);
    return NextResponse.json({ message: error.message || 'Error' }, { status: 500 });
  }
}
