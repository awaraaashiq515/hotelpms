import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PATCH /api/spa/[spaId]/services/[serviceId]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ spaId: string; serviceId: string }> }
) {
  try {
    const { serviceId } = await params;
    const body = await req.json();

    const service = await prisma.spaService.update({
      where: { id: serviceId },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.category !== undefined && { category: body.category }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.duration !== undefined && { duration: parseInt(body.duration) }),
        ...(body.price !== undefined && { price: parseFloat(body.price) }),
        ...(body.gstRate !== undefined && { gstRate: parseFloat(body.gstRate) }),
        ...(body.image !== undefined && { image: body.image }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
      },
    });

    return NextResponse.json({ service });
  } catch (error) {
    console.error('[PATCH /api/spa/[spaId]/services/[serviceId]]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE /api/spa/[spaId]/services/[serviceId]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ spaId: string; serviceId: string }> }
) {
  try {
    const { serviceId } = await params;
    await prisma.spaService.delete({ where: { id: serviceId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE /api/spa/[spaId]/services/[serviceId]]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
