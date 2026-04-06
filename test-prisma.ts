import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
  const users = await prisma.user.findMany({ take: 1 })
  console.log('Success:', users.length)
}
main().catch(console.error).finally(() => prisma.$disconnect())
