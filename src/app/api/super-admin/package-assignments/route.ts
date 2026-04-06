import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all packages with their assigned organizations and the users in those organizations
    const packages = await prisma.package.findMany({
      include: {
        organizations: {
          include: {
            users: {
              include: {
                role: true,
              },
            },
            _count: {
              select: { properties: true },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: packages,
    });
  } catch (error) {
    console.error('Error fetching package assignments:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
