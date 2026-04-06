const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const propertyId = "cmnfz7gms001bhef1i5muffo0";
  const updated = await prisma.property.update({
    where: { id: propertyId },
    data: {
      name: "ASHOKA DHABA (MODIFIED)",
      logoUrl: "https://example.com/logo.png",
      address: "Mandi, Himachal Pradesh",
      phone: "9876543210",
      taxDetails: "TEST_GSTIN_123"
    }
  });
  console.log('Update Result:', updated);
}

main().catch(console.error).finally(() => prisma.$disconnect());
