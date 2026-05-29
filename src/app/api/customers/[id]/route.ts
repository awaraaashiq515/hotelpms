import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';
import { getSession } from '@/lib/session';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const customer = await prisma.guest.findUnique({
      where: { id },
    });

    if (!customer) return apiError(new Error('Customer not found'), 404);

    return apiResponse(customer);
  } catch (error) {
    return apiError(error);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const body = await request.json();
    const { firstName, lastName, email, mobile, address, gender, birthDate } = body;

    const customer = await prisma.guest.update({
      where: { id },
      data: {
        firstName,
        lastName,
        email: email || null,
        mobile: mobile || null,
        address,
        gender,
        birthDate: birthDate ? new Date(birthDate) : null,
      },
    });

    return apiResponse(customer, 'Customer updated');
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    await prisma.guest.delete({
      where: { id },
    });

    return apiResponse(null, 'Customer deleted');
  } catch (error) {
    return apiError(error);
  }
}
