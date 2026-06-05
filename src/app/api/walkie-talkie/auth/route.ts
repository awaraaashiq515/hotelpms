import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyFirebaseToken, signWTToken } from '@/lib/walkie-talkie-auth'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { firebaseToken, phone, name } = body

    if (!firebaseToken) {
      return NextResponse.json({ message: 'Firebase token is required.' }, { status: 400 })
    }

    // Verify token with Firebase
    const verified = await verifyFirebaseToken(firebaseToken)
    if (!verified) {
      return NextResponse.json({ message: 'Invalid or expired Firebase token.' }, { status: 401 })
    }

    const verifiedPhone = verified.phone
    
    // Clean up verified phone number to search in DB
    // e.g., "+919999999999" -> check both full phone and without country code
    const cleanPhone = verifiedPhone.replace(/\s+/g, '')
    const phoneWithoutCountry = cleanPhone.replace(/^\+\d{1,3}/, '')

    // Search for existing user in POS User table
    let posUser = await prisma.user.findFirst({
      where: {
        OR: [
          { phone: cleanPhone },
          { phone: phoneWithoutCountry },
          { phone: { endsWith: phoneWithoutCountry } }
        ]
      },
      include: {
        role: true,
        property: true
      }
    })

    if (!posUser) {
      return NextResponse.json(
        { message: `Phone number ${verifiedPhone} is not registered in the POS system. Please contact your manager.` },
        { status: 404 }
      )
    }

    // Link the Firebase UID and set WT status to online
    posUser = await prisma.user.update({
      where: { id: posUser.id },
      data: {
        firebaseUid: cleanPhone, // We can store the clean phone or actual Firebase UID here
        wtStatus: 'online'
      },
      include: {
        role: true,
        property: true
      }
    })

    // Sign Walkie-Talkie session JWT token
    const token = await signWTToken(posUser.id, posUser.phone || verifiedPhone)

    // Return token and user details (omitting sensitive password hashes)
    const { passwordHash, twoFactorSecret, twoFactorBackupCodes, ...safeUser } = posUser as any

    return NextResponse.json({
      token,
      user: safeUser
    })
  } catch (error: any) {
    console.error('[WT Auth Route] Error:', error)
    return NextResponse.json({ message: 'Internal server error.', error: error.message }, { status: 500 })
  }
}
