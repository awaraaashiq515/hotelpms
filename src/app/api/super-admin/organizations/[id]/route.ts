import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

// PATCH - assign or unassign a package from an organization
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const { packageId, packageStartDate, packageEndDate, subscriptionStatus } = body;

  const updateData: any = {};
  if ('packageId' in body)        updateData.packageId       = packageId ?? null;
  if ('packageStartDate' in body) updateData.packageStartDate = packageStartDate ? new Date(packageStartDate) : null;
  if ('packageEndDate' in body)   updateData.packageEndDate   = packageEndDate   ? new Date(packageEndDate)   : null;
  if ('subscriptionStatus' in body) updateData.subscriptionStatus = subscriptionStatus;

  const org = await prisma.organization.update({
    where: { id },
    data: updateData,
    include: { package: { include: { features: true } } },
  });

  return NextResponse.json({ success: true, data: org });
}

// GET - single org detail
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  const org = await prisma.organization.findUnique({
    where: { id },
    include: { package: { include: { features: true } } },
  });

  if (!org) {
    return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: org });
}
