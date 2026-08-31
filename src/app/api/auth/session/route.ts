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
    const [roleWithPerms, dbUser] = await Promise.all([
      prisma.role.findUnique({
        where: { id: session.roleId },
        include: {
          rolePermissions: {
            include: { permission: true }
          }
        }
      }),
      prisma.user.findUnique({
        where: { id: session.id },
        select: {
          staffMember: { select: { designation: true } }
        }
      })
    ]);

    const latestPermissions = roleWithPerms?.rolePermissions.map((rp: any) => rp.permission.module) || [];
    const designation = dbUser?.staffMember?.designation || null;

    // Fetch latest package features live from DB
    let packageFeatures: string[] = [];
    let discountPercent = 0;
    let packageName: string | null = null;
    let packageEndDate: string | null = null;
    let subscriptionStatus = 'TRIAL';
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
        packageName = org.package.name;
      }
      packageEndDate = org?.packageEndDate ? org.packageEndDate.toISOString() : null;
      subscriptionStatus = org?.subscriptionStatus || 'TRIAL';
    }

    // Fetch propertyCode + propertySlug + propertyType
    let propertyCode = null;
    let propertySlug = null;
    let propertyType = null;
    if (session.propertyId) {
      const prop = await prisma.property.findUnique({ where: { id: session.propertyId }, select: { code: true, name: true, type: true } });
      propertyCode = prop?.code || null;
      propertySlug = prop?.name ? slugify(prop.name) : session.propertySlug || null;
      propertyType = prop?.type || null;
    } else if (session.organizationId) {
      const prop = await prisma.property.findFirst({ where: { organizationId: session.organizationId }, select: { code: true, name: true, type: true } });
      propertyCode = prop?.code || null;
      propertySlug = prop?.name ? slugify(prop.name) : session.propertySlug || null;
      propertyType = prop?.type || null;
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        ...session,
        permissions: latestPermissions,
        packageFeatures,
        discountPercent,
        packageName,
        packageEndDate,
        subscriptionStatus,
        propertyCode,
        propertySlug,
        propertyType,
        designation,
      },
      // Also expose at top level for usePackage hook
      packageFeatures,
      discountPercent,
      packageEndDate,
      subscriptionStatus,
    });
  } catch (error) {
    console.error('Session fetch error:', error);
    return NextResponse.json({ authenticated: false }, { status: 500 });
  }
}
