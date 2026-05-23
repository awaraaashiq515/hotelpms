import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    let settings = await prisma.paymentSetting.findUnique({
      where: { id: 'system' }
    });

    if (!settings) {
      // Auto-provision with defaults
      settings = await prisma.paymentSetting.create({
        data: {
          id: 'system',
          upiId: 'pay@ordermint',
          upiName: 'OrderMint',
          bankName: 'OrderMint Global Bank',
          bankAccount: '1200384819283',
          bankIfsc: 'ORDM0001092',
          bankSwift: 'ORDMININBB'
        }
      });
    }

    return NextResponse.json({ success: true, data: settings });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { upiId, upiName, bankName, bankAccount, bankIfsc, bankSwift } = body;

    const settings = await prisma.paymentSetting.upsert({
      where: { id: 'system' },
      create: {
        id: 'system',
        upiId: upiId || 'pay@ordermint',
        upiName: upiName || 'OrderMint',
        bankName: bankName || 'OrderMint Global Bank',
        bankAccount: bankAccount || '1200384819283',
        bankIfsc: bankIfsc || 'ORDM0001092',
        bankSwift: bankSwift || 'ORDMININBB'
      },
      update: {
        upiId: upiId || 'pay@ordermint',
        upiName: upiName || 'OrderMint',
        bankName: bankName || 'OrderMint Global Bank',
        bankAccount: bankAccount || '1200384819283',
        bankIfsc: bankIfsc || 'ORDM0001092',
        bankSwift: bankSwift || 'ORDMININBB'
      }
    });

    return NextResponse.json({ success: true, message: 'Payment settings updated successfully', data: settings });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Server error' }, { status: 500 });
  }
}
