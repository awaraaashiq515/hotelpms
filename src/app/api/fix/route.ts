import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    let output = "";
    // Fix 1: Update user organizations based on their assigned property
    const users = await prisma.user.findMany({
      where: { propertyId: { not: null } },
      include: { property: true }
    });

    let fixedOrgCount = 0;
    for (const user of users) {
      if (user.property && user.organizationId !== user.property.organizationId) {
        await prisma.user.update({
          where: { id: user.id },
          data: { organizationId: user.property.organizationId }
        });
        fixedOrgCount++;
        output += `Fixed Org for ${user.email}\n`;
      }
    }

    // Fix 2: Clear propertyId for SUPER_ADMIN role
    const superAdminRole = await prisma.role.findUnique({ where: { name: 'SUPER_ADMIN' } });
    let fixedAdminCount = 0;
    if (superAdminRole) {
      const superAdmins = await prisma.user.findMany({
        where: { roleId: superAdminRole.id, propertyId: { not: null } }
      });
      for (const admin of superAdmins) {
        await prisma.user.update({
          where: { id: admin.id },
          data: { propertyId: null }
        });
        fixedAdminCount++;
        output += `Cleared Property for SuperAdmin ${admin.email}\n`;
      }
    }
    
    // Fix 3: Clear propertyId for RESTAURANTS_ADMIN role
    const restAdminRole = await prisma.role.findUnique({ where: { name: 'RESTAURANTS_ADMIN' } });
    if (restAdminRole) {
      const restAdmins = await prisma.user.findMany({
        where: { roleId: restAdminRole.id, propertyId: { not: null } }
      });
      for (const admin of restAdmins) {
        await prisma.user.update({
          where: { id: admin.id },
          data: { propertyId: null }
        });
        output += `Cleared Property for RestAdmin ${admin.email}\n`;
      }
    }

    return NextResponse.json({ success: true, fixedOrgCount, fixedAdminCount, output });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
