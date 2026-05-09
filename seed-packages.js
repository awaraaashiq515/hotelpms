const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedPackages() {
  console.log('🌱 Seeding demo packages...');

  const packages = [
    {
      name: 'Starter',
      description: 'Perfect for small restaurants and cafes just getting started.',
      discountPercent: 0,
      isActive: true,
      color: '#10b981',
      features: ['POS', 'REPORTS', 'STAFF'],
      permissions: [
        { module: 'orders', action: 'read' },
        { module: 'orders', action: 'create' },
        { module: 'orders', action: 'update' },
        { module: 'products', action: 'read' },
        { module: 'products', action: 'create' },
        { module: 'reports', action: 'read' },
        { module: 'staff', action: 'read' },
        { module: 'staff', action: 'create' },
      ],
    },
    {
      name: 'Professional',
      description: 'Full POS + HMS for mid-size hospitality businesses with inventory tracking.',
      discountPercent: 10,
      isActive: true,
      color: '#6366f1',
      features: ['POS', 'HMS', 'INVENTORY', 'REPORTS', 'STAFF', 'TABLES', 'TABLETS'],
      permissions: [
        { module: 'orders', action: 'read' },
        { module: 'orders', action: 'create' },
        { module: 'orders', action: 'update' },
        { module: 'orders', action: 'delete' },
        { module: 'products', action: 'read' },
        { module: 'products', action: 'create' },
        { module: 'products', action: 'update' },
        { module: 'products', action: 'delete' },
        { module: 'inventory', action: 'read' },
        { module: 'inventory', action: 'create' },
        { module: 'inventory', action: 'update' },
        { module: 'reports', action: 'read' },
        { module: 'guests', action: 'read' },
        { module: 'guests', action: 'create' },
        { module: 'guests', action: 'update' },
        { module: 'reservations', action: 'read' },
        { module: 'reservations', action: 'create' },
        { module: 'reservations', action: 'update' },
        { module: 'staff', action: 'read' },
        { module: 'staff', action: 'create' },
        { module: 'staff', action: 'update' },
        { module: 'staff', action: 'delete' },
        { module: 'payments', action: 'read' },
        { module: 'payments', action: 'create' },
      ],
    },
    {
      name: 'Enterprise',
      description: 'All-inclusive plan with GST filing, accounting, drivers, offers & website CMS.',
      discountPercent: 20,
      isActive: true,
      color: '#f59e0b',
      features: ['POS', 'HMS', 'INVENTORY', 'REPORTS', 'STAFF', 'TABLES', 'TABLETS', 'GST', 'ACCOUNTING', 'DRIVERS', 'OFFERS', 'WEBSITE'],
      permissions: [
        { module: 'orders', action: 'read' },
        { module: 'orders', action: 'create' },
        { module: 'orders', action: 'update' },
        { module: 'orders', action: 'delete' },
        { module: 'products', action: 'read' },
        { module: 'products', action: 'create' },
        { module: 'products', action: 'update' },
        { module: 'products', action: 'delete' },
        { module: 'inventory', action: 'read' },
        { module: 'inventory', action: 'create' },
        { module: 'inventory', action: 'update' },
        { module: 'inventory', action: 'delete' },
        { module: 'reports', action: 'read' },
        { module: 'users', action: 'read' },
        { module: 'users', action: 'create' },
        { module: 'users', action: 'update' },
        { module: 'users', action: 'delete' },
        { module: 'payments', action: 'read' },
        { module: 'payments', action: 'create' },
        { module: 'expenses', action: 'read' },
        { module: 'expenses', action: 'create' },
        { module: 'expenses', action: 'update' },
        { module: 'expenses', action: 'delete' },
        { module: 'guests', action: 'read' },
        { module: 'guests', action: 'create' },
        { module: 'guests', action: 'update' },
        { module: 'reservations', action: 'read' },
        { module: 'reservations', action: 'create' },
        { module: 'reservations', action: 'update' },
        { module: 'reservations', action: 'delete' },
        { module: 'staff', action: 'read' },
        { module: 'staff', action: 'create' },
        { module: 'staff', action: 'update' },
        { module: 'staff', action: 'delete' },
      ],
    },
    {
      name: 'Free Trial',
      description: 'Limited 30-day trial with basic POS access. No credit card required.',
      discountPercent: 100,
      isActive: true,
      color: '#8b5cf6',
      features: ['POS'],
      permissions: [
        { module: 'orders', action: 'read' },
        { module: 'orders', action: 'create' },
        { module: 'products', action: 'read' },
        { module: 'reports', action: 'read' },
      ],
    },
  ];

  for (const pkg of packages) {
    // Check if already exists
    const existing = await prisma.package.findUnique({ where: { name: pkg.name } });
    if (existing) {
      console.log(`  ⚠️  Package "${pkg.name}" already exists — skipping.`);
      continue;
    }

    const created = await prisma.package.create({
      data: {
        name: pkg.name,
        description: pkg.description,
        discountPercent: pkg.discountPercent,
        isActive: pkg.isActive,
        color: pkg.color,
        features: {
          create: pkg.features.map((f) => ({ feature: f })),
        },
        permissions: {
          create: pkg.permissions.map((p) => ({ module: p.module, action: p.action })),
        },
      },
    });

    console.log(`  ✅ Created: ${created.name} (${pkg.features.length} features, ${pkg.discountPercent}% discount)`);
  }

  // Assign "Enterprise" to all existing organizations to restore access
  const enterprisePkg = await prisma.package.findUnique({ where: { name: 'Enterprise' } });
  if (enterprisePkg) {
    const orgs = await prisma.organization.findMany();
    for (const org of orgs) {
      await prisma.organization.update({
        where: { id: org.id },
        data: { packageId: enterprisePkg.id },
      });
      console.log(`  🔗 Assigned "Enterprise" package to organization: ${org.name}`);
    }
  }

  console.log('\n✨ Done! Visit /admin/packages to see all demo packages.');
  await prisma.$disconnect();
}

seedPackages().catch((e) => {
  console.error(e);
  process.exit(1);
});
