import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';
import { getSession } from '@/lib/session';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const hasPermission = session.role === 'SUPER_ADMIN' || session.role === 'RESTAURANTS_ADMIN' || await prisma.rolePermission.findFirst({
      where: { 
        roleId: session.roleId,
        permission: { module: 'Role Management' }
      }
    });

    if (!hasPermission) {
      return apiError(new Error('Unauthorized'), 401);
    }
    const { id } = await params;

    const role = await prisma.role.findUnique({
      where: { id },
      include: {
        rolePermissions: {
          include: { permission: true }
        }
      }
    });

    if (!role) return apiError(new Error('Role not found'), 404);

    const modules = role.rolePermissions.map(rp => rp.permission.module);
    return apiResponse(modules, 'Permissions fetched successfully');
  } catch (error) {
    return apiError(error);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const hasPermission = session.role === 'SUPER_ADMIN' || session.role === 'RESTAURANTS_ADMIN' || await prisma.rolePermission.findFirst({
      where: { 
        roleId: session.roleId,
        permission: { module: 'Role Management' }
      }
    });

    if (!hasPermission) {
      return apiError(new Error('Unauthorized'), 401);
    }

    const { id } = await params;
    const body = await request.json();
    const modules: string[] = body.modules || [];

    // Ensure permissions exist
    const permissionIds: string[] = [];
    for (const module of modules) {
      let perm = await prisma.permission.findFirst({ where: { module, action: 'ACCESS' } });
      if (!perm) {
        perm = await prisma.permission.create({ data: { module, action: 'ACCESS' } });
      }
      permissionIds.push(perm.id);
    }

    // Replace role permissions
    await prisma.$transaction(async (tx: any) => {
      await tx.rolePermission.deleteMany({ where: { roleId: id } });
      
      for (const pid of permissionIds) {
        await tx.rolePermission.create({
          data: { roleId: id, permissionId: pid }
        });
      }
    });

    return apiResponse(modules, 'Permissions updated successfully');
  } catch (error) {
    return apiError(error);
  }
}
