import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const orders = await prisma.posOrder.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: { id: true, orderNo: true, status: true }
  })
  console.log(orders)
}
main()
