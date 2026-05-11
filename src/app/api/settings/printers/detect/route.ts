import { NextRequest, NextResponse } from 'next/server';
import { SerialPort } from 'serialport';
import { getSession } from '@/lib/session';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const ports = await SerialPort.list();
    return NextResponse.json(ports);
  } catch (error: any) {
    console.error('Detect Printers Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
