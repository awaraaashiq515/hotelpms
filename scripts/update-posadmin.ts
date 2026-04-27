
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = 'posadmin@gmail.com';
  const targetPropertyId = 'cmnfz7gms001bhef1i5muffo0'; // ASHOKA DHABA
  const targetOrganizationId = 'cmnfz2q8e0015hef1uto03jij';

  console.log(`🔍 Updating user ${email}...`);

  const user = await prisma.user.update({
    where: { email },
    data: {
      propertyId: targetPropertyId,
      organizationId: targetOrganizationId,
    },
  });

  console.log(`✅ User ${email} updated successfully!`);
  console.log(`Property ID: ${user.propertyId}`);
  console.log(`Organization ID: ${user.organizationId}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
