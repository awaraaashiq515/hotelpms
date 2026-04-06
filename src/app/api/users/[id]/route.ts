import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';
import { getSession } from '@/lib/session';
import { hashPassword } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const user = await prisma.user.findUnique({
      where: { id },
      include: { role: true, property: true },
    });

    if (!user) return apiError(new Error('User not found'), 404);

    const { passwordHash, ...safeUser } = user;
    return apiResponse(safeUser);
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
    const { fullName, email, phone, roleId, isActive, password } = body;

    const data: any = {
      fullName,
      email,
      phone,
      roleId,
      isActive,
    };

    if (password) {
      data.passwordHash = await hashPassword(password);
    }

    const user = await prisma.user.update({
      where: { id },
      data,
    });

    const { passwordHash: _, ...safeUser } = user;
    return apiResponse(safeUser, 'User profile updated');
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

    await prisma.user.delete({
      where: { id },
    });

    return apiResponse(null, 'User deleted');
  } catch (error) {
    return apiError(error);
  }
}
