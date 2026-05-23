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

    const modules = role.rolePermissions.map((rp: any) => rp.permission.module);
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

    // Retrieve organization's package features for sanitization
    let packageFeatures: string[] = [];
    if (session.role !== 'SUPER_ADMIN' && session.organizationId) {
      const org = await prisma.organization.findUnique({
        where: { id: session.organizationId },
        include: {
          package: {
            include: { features: true }
          }
        }
      });
      if (org?.package) {
        packageFeatures = org.package.features.map((f: any) => f.feature);
      }
    }

    const MODULE_FEATURE_MAP: Record<string, string> = {
      'POS Home': 'POS',
      'POS Terminal': 'POS',
      'Invoices': 'POS',
      'Payments': 'POS',
      'Inventory': 'INVENTORY',
      'KOTs': 'POS',
      'Kitchen Display': 'POS',
      'Day Closing': 'POS',
      'Expenses': 'ACCOUNTING',
      'All Expenses': 'ACCOUNTING',
      'New Expense': 'ACCOUNTING',
      'Categories': 'ACCOUNTING',
      'Accounting': 'ACCOUNTING',
      'Voucher List': 'ACCOUNTING',
      'Cash Book': 'ACCOUNTING',
      'Day Book': 'ACCOUNTING',
      'Ledger': 'ACCOUNTING',
      'Table Layout': 'TABLES',
      'Orders Control': 'POS',
      'Live Occupancy': 'HMS',
      'Table Bookings': 'TABLES',
      'Drivers': 'DRIVERS',
      'POS Staff': 'STAFF',
      'Reports': 'REPORTS',
      'Sales Summary': 'REPORTS',
      'Order Summary': 'REPORTS',
      'Executive Sales': 'REPORTS',
      'POS Access': 'POS',
      'Settings': 'POS'
    };

    // Filter out modules that are not allowed by the organization's package features
    const sanitizedModules = modules.filter((m) => {
      if (session.role === 'SUPER_ADMIN') return true;
      if (packageFeatures.length === 0) return true; // Grace mode / no package
      const reqFeature = MODULE_FEATURE_MAP[m];
      if (!reqFeature) return true; // Modules without mapped features are core
      return packageFeatures.includes(reqFeature);
    });

    // Ensure permissions exist
    const permissionIds: string[] = [];
    for (const module of sanitizedModules) {
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
