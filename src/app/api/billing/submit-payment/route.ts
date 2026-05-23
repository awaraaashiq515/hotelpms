import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { apiError, apiResponse } from '@/lib/api-utils'
import { encrypt, getSession, SessionPayload } from '@/lib/session'
import { cookies } from 'next/headers'

const paymentSchema = z.object({
  paymentReference: z.string().min(6, 'Payment reference must be at least 6 characters'),
  paymentAmount: z.number().positive('Payment amount must be greater than zero'),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || !session.organizationId) {
      return apiError(new Error('Unauthorized'), 401)
    }

    const body = await request.json()
    const { paymentReference, paymentAmount } = paymentSchema.parse(body)

    // Update organization with payment reference
    const updatedOrg = await prisma.organization.update({
      where: { id: session.organizationId },
      data: {
        subscriptionStatus: 'PENDING_APPROVAL',
        paymentReference,
        paymentAmount,
        paymentDate: new Date(),
      },
    })

    // Also update session to avoid immediate middleware redirection lockouts
    const cookieStore = await cookies()
    const sessionData: SessionPayload = {
      ...session,
      subscriptionStatus: 'PENDING_APPROVAL',
    }

    const token = await encrypt(sessionData)
    const url = new URL(request.url)
    const isLocal = url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname.startsWith('192.168.') || url.hostname.startsWith('10.') || url.hostname.startsWith('172.')
    const isSecure = process.env.NODE_ENV === 'production' && !isLocal

    cookieStore.set('session', token, {
      httpOnly: true,
      secure: isSecure,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 8, // 8 hours
    })

    return apiResponse(updatedOrg, 'Payment reference submitted successfully for approval')
  } catch (error) {
    return apiError(error)
  }
}
