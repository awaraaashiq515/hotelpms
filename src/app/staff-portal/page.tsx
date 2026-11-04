import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export const dynamic = 'force-dynamic';

export default async function StaffPortalIndexPage() {
  const session = await getSession();

  // 1. If user is currently logged in with a propertyCode in their session
  if (session?.propertyCode) {
    redirect(`/staff-portal/${session.propertyCode.toLowerCase()}`);
  }

  // 2. If user is logged into an organization, find their property
  if (session?.organizationId) {
    const orgProp = await prisma.property.findFirst({
      where: { organizationId: session.organizationId },
      select: { code: true },
      orderBy: { createdAt: 'desc' },
    });
    if (orgProp?.code) {
      redirect(`/staff-portal/${orgProp.code.toLowerCase()}`);
    }
  }

  // 3. Fallback: latest property
  const firstProp = await prisma.property.findFirst({
    select: { code: true, name: true },
    orderBy: { createdAt: 'desc' },
  });

  if (firstProp?.code) {
    redirect(`/staff-portal/${firstProp.code.toLowerCase()}`);
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
