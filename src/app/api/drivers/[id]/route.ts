import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json();
    const { name, phone, vehicleNumber, vehicleType, isActive } = body;
    const { id } = await params;

    const updatedDriver = await (prisma as any).driver.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(phone !== undefined && { phone }),
        ...(vehicleNumber !== undefined && { vehicleNumber }),
        ...(vehicleType !== undefined && { vehicleType }),
        ...(isActive !== undefined && { isActive }),
      }
    });

    return NextResponse.json({ success: true, data: updatedDriver });
  } catch (error) {
    console.error('Error updating driver:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const driver = await (prisma as any).driver.findUnique({
      where: { id },
      include: {
        _count: {
          select: { posOrders: true, tableReservations: true }
        }
      }
    });

    if (!driver) {
      return NextResponse.json({ success: false, message: 'Driver not found' }, { status: 404 });
    }

    if (driver._count.posOrders > 0 || driver._count.tableReservations > 0) {
      // Soft delete if there's related data
      await (prisma as any).driver.update({
        where: { id },
        data: { isActive: false }
      });
      return NextResponse.json({ success: true, message: 'Driver marked as inactive due to existing records' });
    }

    await (prisma as any).driver.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Driver deleted successfully' });
  } catch (error) {
    console.error('Error deleting driver:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
