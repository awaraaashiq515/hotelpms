/**
 * Health Check API
 * 
 * Ye endpoint do kaam karta hai:
 * 1. Electron ka server-manager.js isko check karta hai — server ready hai ya nahi
 * 2. Sync manager isko use karta hai internet check ke liye
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Database connection check karo
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json(
      {
        status: 'ok',
        mode: process.env.OFFLINE_MODE === 'true' ? 'offline-local' : 'online-cloud',
        database: 'connected',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        database: 'disconnected',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}

// Cache nahi karna — har baar fresh response chahiye
export const dynamic = 'force-dynamic';
export const revalidate = 0;
