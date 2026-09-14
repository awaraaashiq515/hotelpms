import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function getPrismaClient(): PrismaClient {
  if (
    globalForPrisma.prisma &&
    (globalForPrisma.prisma as any).leaveRequest &&
    (globalForPrisma.prisma as any).payrollRun &&
    (globalForPrisma.prisma as any).payrollRunEntry &&
    (globalForPrisma.prisma as any).payrollSetting
  ) {
    return globalForPrisma.prisma
  }
  // Clear stale client so it gets rebuilt with latest generated schema
  globalForPrisma.prisma = undefined

  // Clear Node require cache for @prisma/client if stale from dev server pre-generation
  try {
    if (typeof require !== 'undefined' && require.cache) {
      Object.keys(require.cache).forEach((key) => {
        if (key.includes('@prisma/client') || key.includes('.prisma')) {
          delete require.cache[key]
        }
      })
    }
  } catch {}

  const FreshPrismaClient = require('@prisma/client').PrismaClient
  const client = new FreshPrismaClient({ log: ['error', 'warn'] })
  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = client
  }
  return client
}

export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    let client = getPrismaClient() as any
    // Auto-reload client if accessing a model not present on current cached instance
    if (
      typeof prop === 'string' &&
      client[prop] === undefined &&
      !prop.startsWith('$') &&
      !prop.startsWith('_')
    ) {
      globalForPrisma.prisma = undefined
      try {
        if (typeof require !== 'undefined' && require.cache) {
          Object.keys(require.cache).forEach((key) => {
            if (key.includes('@prisma/client') || key.includes('.prisma')) {
              delete require.cache[key]
            }
          })
        }
      } catch {}
      const FreshPrisma = require('@prisma/client').PrismaClient
      client = new FreshPrisma({ log: ['error', 'warn'] })
      if (process.env.NODE_ENV !== 'production') {
        globalForPrisma.prisma = client
      }
    }
    const val = client[prop]
    if (typeof val === 'function') {
      return val.bind(client)
    }
    return val
  }
})
