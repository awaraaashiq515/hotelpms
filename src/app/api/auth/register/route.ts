import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'
import { apiError, apiResponse } from '@/lib/api-utils'
import { decrypt } from '@/lib/session'
import { cookies } from 'next/headers'

const signupSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  businessName: z.string().min(2, 'Business name must be at least 2 characters').optional().nullable(),
  captchaText: z.string().min(1, 'Security code is required'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { fullName, email, password, businessName, captchaText } = signupSchema.parse(body)

    // 1. Verify Security Captcha
    const cookieStore = await cookies()
    const captchaCookie = cookieStore.get('captcha')?.value

    if (!captchaCookie) {
      return apiError(new Error('Security code expired or not found. Please refresh.'), 400)
    }

    try {
      const decodedCaptcha = await decrypt(captchaCookie) as any
      if (!captchaText || decodedCaptcha.text !== captchaText.trim().toLowerCase()) {
        return apiError(new Error('Invalid security code. Please try again.'), 400)
      }
      // Delete the captcha cookie after successful validation
      cookieStore.delete('captcha')
    } catch (err) {
      return apiError(new Error('Security code verification failed. Please refresh.'), 400)
    }

    // 2. Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    })

    if (existingUser) {
      return apiError(new Error('An account with this email address already exists.'), 400)
    }

    // 3. Find default RESTAURANTS_ADMIN role
    const restaurantsAdminRole = await prisma.role.findUnique({
      where: { name: 'RESTAURANTS_ADMIN' },
    })

    if (!restaurantsAdminRole) {
      return apiError(new Error('Required system role (RESTAURANTS_ADMIN) was not found in the database. Please run migrations/seeds.'), 500)
    }

    // 4. Determine default Package if available
    let defaultPackage = await prisma.package.findFirst({
      where: { name: { in: ['Free Trial', 'Starter', 'Enterprise'] } }
    })

    if (!defaultPackage) {
      defaultPackage = await prisma.package.findFirst({
        where: { isActive: true }
      })
    }

    // 5. Create Organization and User in a transaction
    const result = await prisma.$transaction(async (tx: any) => {
      // Create Organization
      const orgName = businessName ? businessName.trim() : `${fullName.trim()}'s Business`
      const organization = await tx.organization.create({
        data: {
          name: orgName,
          packageId: defaultPackage ? defaultPackage.id : null,
          packageStartDate: defaultPackage ? new Date() : null,
          packageEndDate: defaultPackage ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null, // 30 days trial
        },
      })

      // Hash password
      const passwordHash = await hashPassword(password)

      // Create User
      const user = await tx.user.create({
        data: {
          fullName: fullName.trim(),
          email: email.toLowerCase().trim(),
          passwordHash,
          organizationId: organization.id,
          roleId: restaurantsAdminRole.id,
          isActive: true,
          onboardingCompleted: false, // Will prompt onboarding wizard upon login
        },
      })

      return { user, organization }
    })

    // 6. Return response (excluding password hash)
    const { passwordHash: _, ...safeUser } = result.user

    return apiResponse(
      { user: safeUser, organization: result.organization },
      'Account registered successfully! You can now log in.',
      201
    )

  } catch (error) {
    return apiError(error)
  }
}
