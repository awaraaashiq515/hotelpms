import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { signWTToken } from '@/lib/walkie-talkie-auth'

export async function POST(request: NextRequest) {
  try {
    const { username, password, propertyCode } = await request.json()

    if (!username || !password) {
      return NextResponse.json({ message: 'Username and password are required.' }, { status: 400 })
    }

    const email = `${username.toLowerCase().trim()}@pos-staff.local`

    // Find user
    let posUser: any = await (prisma as any).user.findUnique({
      where: { email },
      include: {
        role: true,
        property: true,
        staffMember: { select: { designation: true, salary: true, shiftHours: true, isActive: true } }
      }
    })

    if (!posUser) {
      return NextResponse.json({ message: 'Invalid username or password.' }, { status: 401 })
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, posUser.passwordHash)
    if (!isMatch) {
      return NextResponse.json({ message: 'Invalid username or password.' }, { status: 401 })
    }

    // Check designation — only allow Housekeeper
    const designation = posUser.staffMember?.designation || posUser.role?.name || ''
    if (!designation.toLowerCase().includes('housekeeper')) {
      return NextResponse.json({
        message: 'Access denied. This portal is only for Housekeeping staff.'
      }, { status: 403 })
    }

    // Sign WT token
    const wtToken = await signWTToken(posUser.id, posUser.phone || '')

    const { passwordHash, twoFactorSecret, twoFactorBackupCodes, ...safeUser } = posUser as any

    return NextResponse.json({
      wtToken,
      user: {
        ...safeUser,
        designation: posUser.staffMember?.designation ?? null,
      },
    })
  } catch (error: any) {
    console.error('[Housekeeper Login]', error)
    return NextResponse.json({ message: 'Internal server error.' }, { status: 500 })
  }
}
