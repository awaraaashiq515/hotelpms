import { NextRequest, NextResponse } from 'next/server';
import { getSession, slugify } from '@/lib/session';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    // Fetch latest permissions directly from DB so changes take effect without relogging
    const roleWithPerms = await prisma.role.findUnique({
      where: { id: session.roleId },
      include: {
        rolePermissions: {
          include: { permission: true }
        }
      }
    });

    const latestPermissions = roleWithPerms?.rolePermissions.map((rp: any) => rp.permission.module) || [];

    // Fetch latest package features live from DB
    let packageFeatures: string[] = [];
    let discountPercent = 0;
    if (session.organizationId) {
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
        discountPercent = org.package.discountPercent;
      }
    }

    // Fetch propertyCode + propertySlug
    let propertyCode = null;
    let propertySlug = null;
    if (session.propertyId) {
      const prop = await prisma.property.findUnique({ where: { id: session.propertyId }, select: { code: true, name: true } });
      propertyCode = prop?.code || null;
      propertySlug = prop?.name ? slugify(prop.name) : session.propertySlug || null;
    } else if (session.organizationId) {
      const prop = await prisma.property.findFirst({ where: { organizationId: session.organizationId }, select: { code: true, name: true } });
      propertyCode = prop?.code || null;
      propertySlug = prop?.name ? slugify(prop.name) : session.propertySlug || null;
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        ...session,
        permissions: latestPermissions,
        packageFeatures,
        discountPercent,
        propertyCode,
        propertySlug,
      },
      // Also expose at top level for usePackage hook
      packageFeatures,
      discountPercent,
    });
  } catch (error) {
    console.error('Session fetch error:', error);
    return NextResponse.json({ authenticated: false }, { status: 500 });
  }
}
