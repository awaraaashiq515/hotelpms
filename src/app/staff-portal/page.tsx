import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic';

// /staff-portal → redirect to first property, or show selector
export default async function StaffPortalIndexPage() {
  // Get first available property
  const firstProp = await prisma.property.findFirst({
    select: { code: true, name: true },
    orderBy: { createdAt: 'asc' },
  })

  if (firstProp?.code) {
    redirect(`/staff-portal/${firstProp.code.toLowerCase()}`)
  }

  // Fallback: show message if no properties yet
  return (
    <div style={{
      minHeight: '100vh', background: '#0a0c12', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Inter, sans-serif', color: '#f1f5f9',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>🏨</div>
        <h1 style={{ fontSize: 20, fontWeight: 900 }}>No Properties Found</h1>
        <p style={{ fontSize: 13, color: '#475569', marginTop: 8 }}>
          Ask your admin to set up a property first.
        </p>
      </div>
    </div>
  )
}
