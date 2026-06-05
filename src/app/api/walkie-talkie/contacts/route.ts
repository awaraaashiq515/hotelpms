import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getWTUserFromRequest } from '@/lib/walkie-talkie-auth'

export async function GET(request: Request) {
  try {
    const currentUser = await getWTUserFromRequest(request)
    if (!currentUser) {
      return NextResponse.json({ message: 'Unauthorized.' }, { status: 401 })
    }

    // 1. Fetch automatic contacts: Staff members belonging to the same property
    let samePropertyStaff: any[] = []
    if (currentUser.propertyId) {
      samePropertyStaff = await prisma.user.findMany({
        where: {
          propertyId: currentUser.propertyId,
          id: { not: currentUser.id }
        },
        select: {
          id: true,
          fullName: true,
          phone: true,
          wtStatus: true,
          designation: true,
          email: true
        }
      })
    }

    // 2. Fetch custom contacts: From WTContact table (accepted requests)
    const customContacts = await prisma.wTContact.findMany({
      where: {
        OR: [
          { userId: currentUser.id },
          { contactUserId: currentUser.id }
        ],
        status: 'accepted'
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            wtStatus: true,
            designation: true,
            email: true
          }
        },
        contactUser: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            wtStatus: true,
            designation: true,
            email: true
          }
        }
      }
    })

    // Merge contacts, avoiding duplicates
    const contactsMap = new Map<string, any>()

    // Add same property staff
    samePropertyStaff.forEach((staff) => {
      contactsMap.set(staff.id, {
        id: staff.id,
        name: staff.fullName,
        phone: staff.phone,
        designation: staff.designation || 'Staff',
        wtStatus: staff.wtStatus || 'offline',
        email: staff.email,
        isStaff: true
      })
    })

    // Add custom contacts
    customContacts.forEach((contact: any) => {
      const targetUser = contact.userId === currentUser.id ? contact.contactUser : contact.user
      if (!contactsMap.has(targetUser.id)) {
        contactsMap.set(targetUser.id, {
          id: targetUser.id,
          name: targetUser.fullName,
          phone: targetUser.phone,
          designation: targetUser.designation || 'External Contact',
          wtStatus: targetUser.wtStatus || 'offline',
          email: targetUser.email,
          isStaff: false
        })
      }
    })

    const contactsList = Array.from(contactsMap.values())
    return NextResponse.json(contactsList)
  } catch (error: any) {
    console.error('[WT Contacts GET] Error:', error)
    return NextResponse.json({ message: 'Internal server error.', error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const currentUser = await getWTUserFromRequest(request)
    if (!currentUser) {
      return NextResponse.json({ message: 'Unauthorized.' }, { status: 401 })
    }

    const { phone } = await request.json()
    if (!phone) {
      return NextResponse.json({ message: 'Phone number is required.' }, { status: 400 })
    }

    // Find the target user in the POS system belonging to the same property
    const targetUser = await prisma.user.findFirst({
      where: {
        propertyId: currentUser.propertyId,
        OR: [
          { phone: phone },
          { phone: phone.replace(/\s+/g, '') },
          { phone: { endsWith: phone.replace(/^\+\d{1,3}/, '') } }
        ]
      }
    })

    if (!targetUser) {
      return NextResponse.json({ message: 'Staff member not found with this phone number.' }, { status: 404 })
    }

    if (targetUser.id === currentUser.id) {
      return NextResponse.json({ message: 'You cannot add yourself as a contact.' }, { status: 400 })
    }

    // Check if contact relationship already exists
    const existingContact = await prisma.wTContact.findFirst({
      where: {
        OR: [
          { userId: currentUser.id, contactUserId: targetUser.id },
          { userId: targetUser.id, contactUserId: currentUser.id }
        ]
      }
    })

    if (existingContact) {
      return NextResponse.json({ message: 'Contact or request already exists.', status: existingContact.status })
    }

    // Since they are colleagues in the same POS workspace, we can auto-accept contacts immediately
    const contact = await prisma.wTContact.create({
      data: {
        userId: currentUser.id,
        contactUserId: targetUser.id,
        status: 'accepted'
      }
    })

    return NextResponse.json({
      message: 'Contact added successfully.',
      contact: {
        id: targetUser.id,
        name: targetUser.fullName,
        phone: targetUser.phone,
        designation: targetUser.designation,
        wtStatus: targetUser.wtStatus
      }
    })
  } catch (error: any) {
    console.error('[WT Contacts POST] Error:', error)
    return NextResponse.json({ message: 'Internal server error.', error: error.message }, { status: 500 })
  }
}
