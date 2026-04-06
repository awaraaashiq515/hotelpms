import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params to support Next.js 15
    const resolvedParams = await params;
    const id = resolvedParams.id;
    
    const body = await request.json();
    const { x, y } = body;

    if (x === undefined || y === undefined) {
      return NextResponse.json(
        { success: false, message: 'Missing coordinates x or y' },
        { status: 400 }
      );
    }

    // Use raw query to bypass potential client-side validation issues with new fields
    await prisma.$executeRaw`UPDATE "Table" SET x = ${parseFloat(x)}, y = ${parseFloat(y)} WHERE id = ${id}`;

    return NextResponse.json({ success: true, data: { id, x, y } });
  } catch (error: any) {
    console.error('Error updating table position:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
