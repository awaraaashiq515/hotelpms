import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  const winPath = path.join(process.cwd(), 'public/downloads/ordermint-pos-windows.exe');
  const macPath = path.join(process.cwd(), 'public/downloads/ordermint-pos-mac.dmg');

  return NextResponse.json({
    windows: fs.existsSync(winPath),
    mac: fs.existsSync(macPath)
  });
}
