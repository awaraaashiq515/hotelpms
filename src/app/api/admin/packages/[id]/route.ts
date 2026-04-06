import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

// GET - Single package detail
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  const pkg = await prisma.package.findUnique({
    where: { id },
    include: {
      features: true,
      permissions: true,
      organizations: { select: { id: true, name: true } },
    },
  });

  if (!pkg) {
    return NextResponse.json({ success: false, error: 'Package not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: pkg });
}

// PATCH - Assign package to organization
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const { organizationId } = body;

  if (!organizationId) {
    return NextResponse.json({ success: false, error: 'organizationId is required' }, { status: 400 });
  }

  await prisma.organization.update({
    where: { id: organizationId },
    data: { packageId: id },
  });

  return NextResponse.json({ success: true });
}
