import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import PaymentPendingClient from './PaymentPendingClient'

export default async function PaymentPendingPage() {
  const session = await getSession()
  if (!session) {
    redirect('/login')
  }

  const organization = await prisma.organization.findUnique({
    where: { id: session.organizationId },
    include: { package: true }
  })

  if (!organization) {
    redirect('/login')
  }

  // If status is already active, redirect them
  if (organization.subscriptionStatus !== 'PENDING_PAYMENT' && organization.subscriptionStatus !== 'PENDING_APPROVAL') {
    const isHotelRole = session.role === 'HOTEL_ADMIN' || session.role === 'HOTEL_MANAGER' || session.role?.startsWith('HOTEL_') || session.propertyType === 'HOTEL';
    if (session.role === 'SUPER_ADMIN') {
      redirect('/admin/dashboard')
    } else if (isHotelRole) {
      redirect('/hotel')
    } else if (session.role === 'RESTAURANTS_ADMIN') {
      redirect(session.propertyType === 'HOTEL' ? '/hotel' : (session.organizationSlug ? `/restaurantadmin/${session.organizationSlug}` : '/operations'))
    } else {
      redirect(isHotelRole ? '/hotel' : '/operations')
    }
  }

  // Query pending package details
  let pendingPackage = null
  if (organization.pendingPackageId) {
    pendingPackage = await prisma.package.findUnique({
      where: { id: organization.pendingPackageId }
    })
  }

  // Fetch payment settings from database
  let paymentSettings = await prisma.paymentSetting.findUnique({
    where: { id: 'system' }
  })

  if (!paymentSettings) {
    paymentSettings = {
      id: 'system',
      upiId: 'pay@guestflow',
      upiName: 'GuestFlow',
      bankName: 'GuestFlow Global Bank',
      bankAccount: '1200384819283',
      bankIfsc: 'ORDM0001092',
      bankSwift: 'ORDMININBB',
      updatedAt: new Date()
    }
  }

  return (
    <PaymentPendingClient 
      organization={JSON.parse(JSON.stringify(organization))}
      pendingPackage={pendingPackage ? JSON.parse(JSON.stringify(pendingPackage)) : null}
      paymentSettings={JSON.parse(JSON.stringify(paymentSettings))}
      userRole={session.role}
      propertyType={session.propertyType}
      organizationSlug={session.organizationSlug}
    />
  )
}

