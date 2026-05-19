import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

// GET - List all packages
export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const packages = await prisma.package.findMany({
    include: {
      features: true,
      permissions: true,
      _count: { select: { organizations: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ success: true, data: packages });
}

// POST - Create package
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { name, description, discountPercent, priceUSD, priceINR, isActive, color, features = [], permissions = [] } = body;

  if (!name) {
    return NextResponse.json({ success: false, error: 'Package name is required' }, { status: 400 });
  }

  const pkg = await prisma.package.create({
    data: {
      name,
      description,
      discountPercent: discountPercent ?? 0,
      priceUSD: priceUSD ?? 0,
      priceINR: priceINR ?? 0,
      isActive: isActive ?? true,
      color: color ?? '#6366f1',
      features: {
        create: (features as string[]).map((f) => ({ feature: f })),
      },
      permissions: {
        create: (permissions as { module: string; action: string }[]).map((p) => ({
          module: p.module,
          action: p.action,
        })),
      },
    },
    include: { features: true, permissions: true },
  });

  return NextResponse.json({ success: true, data: pkg });
}

// PUT - Update package
export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { id, name, description, discountPercent, priceUSD, priceINR, isActive, color, features = [], permissions = [] } = body;

  if (!id) {
    return NextResponse.json({ success: false, error: 'Package ID is required' }, { status: 400 });
  }

  // Delete and re-create features and permissions (simplest update strategy)
  await prisma.packageFeature.deleteMany({ where: { packageId: id } });
  await prisma.packagePermission.deleteMany({ where: { packageId: id } });

  const pkg = await prisma.package.update({
    where: { id },
    data: {
      name,
      description,
      discountPercent: discountPercent ?? 0,
      priceUSD: priceUSD ?? 0,
      priceINR: priceINR ?? 0,
      isActive: isActive ?? true,
      color: color ?? '#6366f1',
      features: {
        create: (features as string[]).map((f) => ({ feature: f })),
      },
      permissions: {
        create: (permissions as { module: string; action: string }[]).map((p) => ({
          module: p.module,
          action: p.action,
        })),
      },
    },
    include: { features: true, permissions: true },
  });

  return NextResponse.json({ success: true, data: pkg });
}

// DELETE - Delete package
export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ success: false, error: 'Package ID is required' }, { status: 400 });
  }

  // Unassign from organizations first
  await prisma.organization.updateMany({
    where: { packageId: id },
    data: { packageId: null },
  });

  await prisma.package.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
