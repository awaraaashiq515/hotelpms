import { NextResponse } from 'next/server';
import { SP_ACCESS_COOKIE, SP_REFRESH_COOKIE } from '@/lib/spotify';

export async function GET() {
  const res = NextResponse.json({ success: true });
  res.cookies.delete(SP_ACCESS_COOKIE);
  res.cookies.delete(SP_REFRESH_COOKIE);
  return res;
}
