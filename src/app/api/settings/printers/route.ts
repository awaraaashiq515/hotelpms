import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get('propertyId');

    if (!propertyId) {
      return NextResponse.json({ error: 'Property ID is required' }, { status: 400 });
    }

    const printers = await prisma.printer.findMany({
      where: { propertyId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(printers);
  } catch (error: any) {
    console.error('Printers GET Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { 
      propertyId, 
      name, 
      connectionType, 
      ipAddress, 
      port, 
      printerType, 
      paperSize, 
      isBilling, 
      isKitchen, 
      isEnabled, 
      autoCut,
      fontSize,
      margin,
      padding
    } = body;

    if (!propertyId || !name || !connectionType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // If this is set as billing printer, unset others
    if (isBilling) {
      await prisma.printer.updateMany({
        where: { propertyId, isBilling: true },
        data: { isBilling: false }
      });
    }

    // If this is set as kitchen printer, unset others (Actually users might want multiple kitchen printers in future, but for now let's keep it simple or allow multiple)
    // The requirement says "One Kitchen Printer", but also "Add more printers in future".
    // I'll allow multiple for now if they want, but the roles section mentions "One Billing Printer" and "One Kitchen Printer".
    // Let's stick to the requirement: "One Billing Printer", "One Kitchen Printer".
    if (isKitchen) {
        await prisma.printer.updateMany({
          where: { propertyId, isKitchen: true },
          data: { isKitchen: false }
        });
    }

    const printer = await prisma.printer.create({
      data: {
        propertyId,
        name,
        connectionType,
        ipAddress,
        port: port ? parseInt(port) : 9100,
        printerType,
        paperSize,
        isBilling,
        isKitchen,
        isEnabled,
        autoCut,
        fontSize: fontSize ? parseInt(fontSize) : 12,
        margin: margin ? parseInt(margin) : 0,
        padding: padding ? parseInt(padding) : 0,
      },
    });

    return NextResponse.json(printer);
  } catch (error: any) {
    console.error('Printers POST Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
