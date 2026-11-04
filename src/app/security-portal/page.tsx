import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export const dynamic = 'force-dynamic'

export default async function SecurityPortalIndexPage() {
  const session = await getSession();

  // 1. If user is currently logged in with a propertyCode in their session
  if (session?.propertyCode) {
    redirect(`/security-portal/${session.propertyCode.toLowerCase()}`);
  }

  // 2. If user is logged into an organization, find their hotel property
  if (session?.organizationId) {
    const hotelProp = await prisma.property.findFirst({
      where: { organizationId: session.organizationId, type: 'HOTEL' },
      select: { code: true },
      orderBy: { createdAt: 'desc' },
    });
    if (hotelProp?.code) {
      redirect(`/security-portal/${hotelProp.code.toLowerCase()}`);
    }

    const anyOrgProp = await prisma.property.findFirst({
      where: { organizationId: session.organizationId },
      select: { code: true },
      orderBy: { createdAt: 'desc' },
    });
    if (anyOrgProp?.code) {
      redirect(`/security-portal/${anyOrgProp.code.toLowerCase()}`);
    }
  }

  // 3. Fallback: find the latest Hotel property
  const hotelProp = await prisma.property.findFirst({
    where: { type: 'HOTEL' },
    select: { code: true },
    orderBy: { createdAt: 'desc' },
  });

  if (hotelProp?.code) {
    redirect(`/security-portal/${hotelProp.code.toLowerCase()}`);
  }

  // 4. Any active property (latest)
  const firstProp = await prisma.property.findFirst({
    select: { code: true },
    orderBy: { createdAt: 'desc' },
  });

  if (firstProp?.code) {
    redirect(`/security-portal/${firstProp.code.toLowerCase()}`);
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#0a0c12', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Inter, sans-serif', color: '#f1f5f9',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🛡️</div>
        <h1 style={{ fontSize: 20, fontWeight: 900, margin: 0 }}>No Properties Found</h1>
        <p style={{ fontSize: 13, color: '#475569', marginTop: 8 }}>
          Ask your admin to set up a property first.
        </p>
      </div>
    </div>
  )
}
