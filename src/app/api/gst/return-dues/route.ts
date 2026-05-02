import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError, resolveAdminProperty } from '@/lib/api-utils';
import { getSession } from '@/lib/session';

// GET - List all GST return dues for a property
export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const propertyId = await resolveAdminProperty(session, prisma);
    if (!propertyId) return apiResponse([], 'No property found');

    const dues = await (prisma as any).gstReturnDue.findMany({
      where: { propertyId },
      orderBy: { dueDate: 'asc' },
    });

    return apiResponse(dues, 'GST return dues fetched');
  } catch (err) {
    return apiError(err);
  }
}

// POST - Add new GST return due date
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const propertyId = await resolveAdminProperty(session, prisma);
    if (!propertyId) return apiError(new Error('No property found'), 404);

    const body = await req.json();
    const { returnType, period, dueDate, notes } = body;

    if (!returnType || !period || !dueDate) {
      return apiError(new Error('returnType, period, dueDate are required'), 400);
    }

    const due = await (prisma as any).gstReturnDue.create({
      data: {
        propertyId,
        returnType,
        period,
        dueDate: new Date(dueDate),
        status: 'PENDING',
        notes: notes || null,
      },
    });

    return apiResponse(due, 'GST return due date added');
  } catch (err) {
    return apiError(err);
  }
}

// PATCH - Mark as filed
export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const body = await req.json();
    const { id, filedDate, notes } = body;

    if (!id) return apiError(new Error('id is required'), 400);

    const due = await (prisma as any).gstReturnDue.update({
      where: { id },
      data: {
        status: 'FILED',
        filedDate: filedDate ? new Date(filedDate) : new Date(),
        ...(notes !== undefined && { notes }),
      },
    });

    return apiResponse(due, 'GST return marked as filed');
  } catch (err) {
    return apiError(err);
  }
}

// DELETE - Remove a due date entry
export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return apiError(new Error('id is required'), 400);

    await (prisma as any).gstReturnDue.delete({ where: { id } });
    return apiResponse(null, 'GST return due date deleted');
  } catch (err) {
    return apiError(err);
  }
}
