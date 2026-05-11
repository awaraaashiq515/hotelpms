import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await req.json();
    
    // Check if printer exists
    const existingPrinter = await prisma.printer.findUnique({
      where: { id }
    });

    if (!existingPrinter) {
      return NextResponse.json({ error: 'Printer not found' }, { status: 404 });
    }

    // If this is set as billing printer, unset others
    if (body.isBilling) {
      await prisma.printer.updateMany({
        where: { propertyId: existingPrinter.propertyId, isBilling: true, id: { not: id } },
        data: { isBilling: false }
      });
    }

    if (body.isKitchen) {
      await prisma.printer.updateMany({
        where: { propertyId: existingPrinter.propertyId, isKitchen: true, id: { not: id } },
        data: { isKitchen: false }
      });
    }

    const updatedPrinter = await prisma.printer.update({
      where: { id },
      data: {
        ...body,
        port: body.port ? parseInt(body.port) : undefined,
        fontSize: body.fontSize ? parseInt(body.fontSize) : undefined,
        margin: body.margin ? parseInt(body.margin) : undefined,
        padding: body.padding ? parseInt(body.padding) : undefined,
      },
    });

    return NextResponse.json(updatedPrinter);
  } catch (error: any) {
    console.error('Printer PATCH Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await prisma.printer.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Printer DELETE Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
