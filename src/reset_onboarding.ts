import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  await prisma.user.update({
    where: { email: 'admin@example.com' },
    data: { onboardingCompleted: false },
  })
  console.log('Onboarding state reset successfully for admin@example.com')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
