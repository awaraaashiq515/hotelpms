const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.user.updateMany({
    data: { onboardingCompleted: true }
  });
  console.log(`Updated ${result.count} users to onboardingCompleted: true`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
