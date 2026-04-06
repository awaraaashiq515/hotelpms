import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { getMultiTenantWhere } from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const propertyIdParam = searchParams.get('propertyId');
    const where = getMultiTenantWhere(session, propertyIdParam);

    const rules = await (prisma as any).driverGiftRule.findMany({
      where,
      orderBy: { customersRequired: 'asc' }
    });

    return NextResponse.json({ success: true, data: rules });
  } catch (error) {
    console.error('Error fetching gift rules:', error);
    return NextResponse.json({ success: false, message: 'Internal server error', error: (error as any).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    const body = await request.json();
    const { id, customersRequired, giftName, description, isActive, propertyId: bodyPropertyId } = body;

    const propertyId = session.propertyId || bodyPropertyId;
    if (!propertyId && !id) {
       return NextResponse.json({ success: false, message: 'Property ID is required' }, { status: 400 });
    }

    if (customersRequired === undefined || !giftName) {
      return NextResponse.json({ success: false, message: 'Required fields missing' }, { status: 400 });
    }

    let rule;
    if (id) {
       // Update
       rule = await (prisma as any).driverGiftRule.update({
          where: { id },
          data: {
             customersRequired: Number(customersRequired),
             giftName,
             description,
             isActive: isActive !== undefined ? isActive : true
          }
       });
    } else {
       // Create
       rule = await (prisma as any).driverGiftRule.create({
          data: {
             propertyId,
             customersRequired: Number(customersRequired),
             giftName,
             description,
             isActive: true
          }
       });
    }

    return NextResponse.json({ success: true, data: rule });
  } catch (error) {
    console.error('Error saving gift rule:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    
    // Admins and Super Admins can delete
    if (session.role !== 'RESTAURANTS_ADMIN' && session.role !== 'SUPER_ADMIN') {
       return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, message: 'ID is required' }, { status: 400 });
    }

    await (prisma as any).driverGiftRule.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: 'Rule deleted' });
  } catch (error) {
    console.error('Error deleting gift rule:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
