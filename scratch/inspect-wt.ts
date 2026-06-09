import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  console.log('--- WT CHANNELS ---')
  const channels = await prisma.wTChannel.findMany({
    include: {
      members: {
        include: {
          user: { select: { fullName: true, email: true } }
        }
      }
    }
  })
  console.dir(channels, { depth: null })

  console.log('\n--- WT ACTIVE LOCKS ---')
  const locks = await prisma.wTSpeakerLock.findMany({
    include: {
      speaker: { select: { fullName: true } }
    }
  })
  console.dir(locks, { depth: null })

  console.log('\n--- WT TALK HISTORY (last 10) ---')
  const history = await prisma.wTTalkHistory.findMany({
    take: 10,
    orderBy: { startedAt: 'desc' },
    include: {
      speaker: { select: { fullName: true, property: { select: { code: true } } } },
      channel: { select: { name: true } }
    }
  })
  console.dir(history, { depth: null })
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
