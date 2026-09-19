import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const winPath = path.join(process.cwd(), 'public/downloads/ordermintpms.exe');
  const macPath = path.join(process.cwd(), 'public/downloads/ordermintpms.dmg');
  const androidPath = path.join(process.cwd(), 'public/downloads/ordermintpms.apk');

  const settings = await prisma.websiteSettings.findFirst();

  return NextResponse.json({
    windows: fs.existsSync(winPath) || fs.existsSync(path.join(process.cwd(), 'public/downloads/ordermint.exe')),
    mac: fs.existsSync(macPath) || fs.existsSync(path.join(process.cwd(), 'public/downloads/ordermint.dmg')),
    android: fs.existsSync(androidPath) || fs.existsSync(path.join(process.cwd(), 'public/downloads/OrderMintPMS.apk')),
    windowsComingSoon: settings?.windowsComingSoon || false,
    macComingSoon: settings?.macComingSoon || false,
    androidComingSoon: settings?.androidComingSoon || false
  });
}
