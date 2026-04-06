import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';
import { getSession } from '@/lib/session';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const body = await request.json();
    const { width, height } = body;

    // Use raw query to bypass client-side validation of missing fields
    await prisma.$executeRaw`UPDATE "Table" SET width = ${width}, height = ${height} WHERE id = ${id}`;

    return apiResponse({ id, width, height }, 'Table size updated');
  } catch (error: any) {
    console.error('Resize Error:', error);
    return apiResponse(null, `Resize Error: ${error?.message || String(error)}`, 500);
  }
}
