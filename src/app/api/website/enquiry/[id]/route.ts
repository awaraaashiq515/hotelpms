import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { status } = await req.json();
    
    if (!status || !['NEW', 'READ', 'RESPONDED'].includes(status)) {
      return apiResponse(null, 'Invalid status', 400);
    }

    const enquiry = await prisma.enquiry.update({
      where: { id },
      data: { status },
    });

    return apiResponse(enquiry, 'Enquiry updated successfully');
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.enquiry.delete({
      where: { id },
    });

    return apiResponse(null, 'Enquiry deleted successfully');
  } catch (error) {
    return apiError(error);
  }
}
