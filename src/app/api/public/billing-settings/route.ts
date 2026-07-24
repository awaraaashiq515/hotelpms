import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Public endpoint — returns only safe payment fields needed for the checkout screen.
 * Does NOT expose sensitive admin settings.
 */
export async function GET(req: NextRequest) {
  try {
    let settings = await prisma.paymentSetting.findUnique({
      where: { id: 'system' }
    });

    if (!settings) {
      // Auto-provision with defaults if admin hasn't configured yet
      settings = await prisma.paymentSetting.create({
        data: {
          id: 'system',
          upiId: 'pay@guestflow',
          upiName: 'GuestFlow',
          bankName: 'GuestFlow Global Bank',
          bankAccount: '1200384819283',
          bankIfsc: 'ORDM0001092',
          bankSwift: 'ORDMININBB'
        }
      });
    }

    // Only expose what the customer needs to see
    return NextResponse.json({
      success: true,
      data: {
        upiId: settings.upiId,
        upiName: settings.upiName,
        bankName: settings.bankName,
        bankAccount: settings.bankAccount,
        bankIfsc: settings.bankIfsc,
        bankSwift: settings.bankSwift,
      }
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Server error' }, { status: 500 });
  }
}
