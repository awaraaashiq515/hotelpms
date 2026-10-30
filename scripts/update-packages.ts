import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Updating packages with proper pricing, features, and limits...');

  const packageUpdates = [
    {
      name: 'Free Trial',
      description: '14-day full feature trial to explore Hotel PMS & POS. No credit card required.',
      priceINR: 0,
      priceUSD: 0,
      discountPercent: 100,
      color: '#10b981',
      allowedHotelCount: 1,
      allowedPropertyCount: 1,
      allowedPosCount: 1,
      features: ['POS', 'HMS', 'REPORTS', 'STAFF', 'TABLES'],
    },
    {
      name: 'Starter',
      description: 'Essential front-desk hotel PMS, POS billing, tables & staff management.',
      priceINR: 3999,
      priceUSD: 49,
      discountPercent: 0,
      color: '#06b6d4',
      allowedHotelCount: 1,
      allowedPropertyCount: 1,
      allowedPosCount: 2,
      features: ['POS', 'HMS', 'REPORTS', 'STAFF', 'TABLES', 'INVENTORY'],
    },
    {
      name: 'Professional',
      description: 'Complete hospitality suite with HMS, inventory, CRM, waiter app & WhatsApp.',
      priceINR: 11999,
      priceUSD: 149,
      discountPercent: 10,
      color: '#f43f5e',
      allowedHotelCount: 3,
      allowedPropertyCount: 3,
      allowedPosCount: 5,
      features: ['POS', 'HMS', 'INVENTORY', 'REPORTS', 'STAFF', 'TABLES', 'TABLETS', 'CRM', 'WHATSAPP', 'GST', 'OFFERS'],
    },
    {
      name: 'Enterprise',
      description: 'All-inclusive multi-property solution with unlimited terminals & advanced AI.',
      priceINR: 24999,
      priceUSD: 299,
      discountPercent: 20,
      color: '#8b5cf6',
      allowedHotelCount: 10,
      allowedPropertyCount: 10,
      allowedPosCount: 10,
      features: [
        'POS', 'HMS', 'INVENTORY', 'REPORTS', 'STAFF', 'TABLES', 'TABLETS',
        'CRM', 'WHATSAPP', 'GST', 'OFFERS', 'ACCOUNTING', 'DRIVERS', 'WEBSITE',
        'B2B', 'WALKIETALKIE', 'BARPOS', 'CAFEPOS', 'PARKING', 'WASTE', 'TIPS', 'GEOFENCING'
      ],
    },
  ];

  for (const pkg of packageUpdates) {
    const existing = await prisma.package.findUnique({
      where: { name: pkg.name },
      include: { features: true },
    });

    if (existing) {
      // Update package details
      await prisma.package.update({
        where: { id: existing.id },
        data: {
          description: pkg.description,
          priceINR: pkg.priceINR,
          priceUSD: pkg.priceUSD,
          discountPercent: pkg.discountPercent,
          color: pkg.color,
          allowedHotelCount: pkg.allowedHotelCount,
          allowedPropertyCount: pkg.allowedPropertyCount,
          allowedPosCount: pkg.allowedPosCount,
          isActive: true,
        },
      });

      // Update features
      // Remove old features
      await prisma.packageFeature.deleteMany({
        where: { packageId: existing.id },
      });

      // Create updated features
      await prisma.packageFeature.createMany({
        data: pkg.features.map(f => ({
          packageId: existing.id,
          feature: f,
        })),
      });

      console.log(`✅ Updated package: ${pkg.name} (₹${pkg.priceINR}/yr) with ${pkg.features.length} features`);
    } else {
      // Create new package
      const created = await prisma.package.create({
        data: {
          name: pkg.name,
          description: pkg.description,
          priceINR: pkg.priceINR,
          priceUSD: pkg.priceUSD,
          discountPercent: pkg.discountPercent,
          color: pkg.color,
          allowedHotelCount: pkg.allowedHotelCount,
          allowedPropertyCount: pkg.allowedPropertyCount,
          allowedPosCount: pkg.allowedPosCount,
          isActive: true,
          features: {
            create: pkg.features.map(f => ({ feature: f })),
          },
        },
      });
      console.log(`✨ Created new package: ${created.name}`);
    }
  }

  console.log('🔄 Seeding feature pricing...');
  const featuresList = [
    { feature: 'POS', label: 'Point of Sale', priceINR: 999, priceUSD: 15 },
    { feature: 'INVENTORY', label: 'Inventory', priceINR: 799, priceUSD: 10 },
    { feature: 'ACCOUNTING', label: 'Accounting', priceINR: 799, priceUSD: 10 },
    { feature: 'HMS', label: 'Hotel Management', priceINR: 1499, priceUSD: 20 },
    { feature: 'TABLES', label: 'Table Management', priceINR: 499, priceUSD: 7 },
    { feature: 'TABLETS', label: 'Tablet / Waiter App', priceINR: 699, priceUSD: 9 },
    { feature: 'BARPOS', label: 'Bar POS', priceINR: 599, priceUSD: 8 },
    { feature: 'CAFEPOS', label: 'Cafe POS', priceINR: 599, priceUSD: 8 },
    { feature: 'REPORTS', label: 'Reports & Analytics', priceINR: 499, priceUSD: 7 },
    { feature: 'GST', label: 'GST Filing', priceINR: 699, priceUSD: 9 },
    { feature: 'STAFF', label: 'Staff Management', priceINR: 499, priceUSD: 7 },
    { feature: 'DRIVERS', label: 'Driver Management', priceINR: 599, priceUSD: 8 },
    { feature: 'CRM', label: 'CRM & Memberships', priceINR: 699, priceUSD: 9 },
    { feature: 'OFFERS', label: 'Offers & Rewards', priceINR: 499, priceUSD: 7 },
    { feature: 'WEBSITE', label: 'Website CMS', priceINR: 899, priceUSD: 12 },
    { feature: 'B2B', label: 'B2B Marketplace', priceINR: 899, priceUSD: 12 },
    { feature: 'PARKING', label: 'Parking', priceINR: 399, priceUSD: 5 },
    { feature: 'WASTE', label: 'Waste Management', priceINR: 399, priceUSD: 5 },
    { feature: 'WHATSAPP', label: 'WhatsApp Bot', priceINR: 999, priceUSD: 15 },
    { feature: 'WALKIETALKIE', label: 'Staff Walkie-Talkie', priceINR: 899, priceUSD: 12 },
    { feature: 'GEOFENCING', label: 'Geo Attendance', priceINR: 499, priceUSD: 7 },
    { feature: 'TIPS', label: 'Tips & Gratuity', priceINR: 299, priceUSD: 4 },
  ];

  for (const f of featuresList) {
    await prisma.featurePricing.upsert({
      where: { feature: f.feature },
      update: { label: f.label, priceINR: f.priceINR, priceUSD: f.priceUSD, isActive: true },
      create: { feature: f.feature, label: f.label, priceINR: f.priceINR, priceUSD: f.priceUSD, isActive: true },
    });
  }

  console.log('🎉 All packages and feature pricings updated successfully!');
}

main()
  .catch((e) => {
    console.error('Error updating packages:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
