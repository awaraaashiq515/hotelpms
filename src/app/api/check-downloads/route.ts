import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const downloadsDir = path.join(process.cwd(), 'public/downloads');

  // Check for GuestFlow PMS files (primary) and fallback to legacy OrderMint names
  const winExists = fs.existsSync(path.join(downloadsDir, 'guestflow-pms.exe'))
    || fs.existsSync(path.join(downloadsDir, 'ordermintpms.exe'))
    || fs.existsSync(path.join(downloadsDir, 'ordermint.exe'));

  const macExists = fs.existsSync(path.join(downloadsDir, 'guestflow-pms.dmg'))
    || fs.existsSync(path.join(downloadsDir, 'ordermintpms.dmg'))
    || fs.existsSync(path.join(downloadsDir, 'ordermint.dmg'));

  const androidExists = fs.existsSync(path.join(downloadsDir, 'guestflow-pms.apk'))
    || fs.existsSync(path.join(downloadsDir, 'ordermintpms.apk'))
    || fs.existsSync(path.join(downloadsDir, 'OrderMintPMS.apk'));

  const settings = await prisma.websiteSettings.findFirst();

  return NextResponse.json({
    windows: winExists,
    mac: macExists,
    android: androidExists,
    windowsComingSoon: settings?.windowsComingSoon || false,
    macComingSoon: settings?.macComingSoon || false,
    androidComingSoon: settings?.androidComingSoon || false
  });
}
