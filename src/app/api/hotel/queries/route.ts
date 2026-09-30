import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';
import { getSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const enquiries = await prisma.enquiry.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return apiResponse(enquiries);
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const body = await req.json();
    const { name, phone, email, subject, message, status = 'NEW' } = body;

    if (!name || (!phone && !email)) {
      return apiError(new Error('Guest name and at least a phone number or email are required.'), 400);
    }

    const enquiry = await prisma.enquiry.create({
      data: {
        name,
        phone: phone || '',
        email: email || '',
        subject: subject || 'Room Booking & Tariff Query',
        message: message || 'Guest enquired about room tariffs and availability.',
        status: status || 'NEW',
      },
    });

    return apiResponse(enquiry, 'Query recorded successfully', 201);
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const body = await req.json();
    const { id, status, message, subject } = body;

    if (!id) {
      return apiError(new Error('Query ID is required.'), 400);
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (message !== undefined) updateData.message = message;
    if (subject !== undefined) updateData.subject = subject;

    const enquiry = await prisma.enquiry.update({
      where: { id },
      data: updateData,
    });

    return apiResponse(enquiry, 'Query status updated');
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return apiError(new Error('Query ID is required.'), 400);
    }

    await prisma.enquiry.delete({
      where: { id },
    });

    return apiResponse(null, 'Query deleted successfully');
  } catch (error) {
    return apiError(error);
  }
}
