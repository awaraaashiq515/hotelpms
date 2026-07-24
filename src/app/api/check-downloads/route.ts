import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const winPath = path.join(process.cwd(), 'public/downloads/guestflow-pos-windows.exe');
  const macPath = path.join(process.cwd(), 'public/downloads/guestflow-pos-mac.dmg');
  const androidPath = path.join(process.cwd(), 'public/downloads/guestflow-pos.apk');

  const settings = await prisma.websiteSettings.findFirst();

  return NextResponse.json({
    windows: fs.existsSync(winPath),
    mac: fs.existsSync(macPath),
    android: fs.existsSync(androidPath),
    windowsComingSoon: settings?.windowsComingSoon || false,
    macComingSoon: settings?.macComingSoon || false,
    androidComingSoon: settings?.androidComingSoon || false
  });
}
