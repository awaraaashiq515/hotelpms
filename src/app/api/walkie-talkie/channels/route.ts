import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getWTUserFromRequest } from '@/lib/walkie-talkie-auth'

export async function GET(request: Request) {
  try {
    const currentUser = await getWTUserFromRequest(request)
    if (!currentUser) {
      return NextResponse.json({ message: 'Unauthorized.' }, { status: 401 })
    }

    if (currentUser.propertyId) {
      // Find all channels belonging to this property
      const propertyChannels = await prisma.wTChannel.findMany({
        where: { propertyId: currentUser.propertyId },
        select: { id: true }
      })
      const propertyChannelIds = propertyChannels.map((c: any) => c.id)

      if (propertyChannelIds.length > 0) {
        // Find channels where the current user is already a member
        const existingMemberships = await prisma.wTChannelMember.findMany({
          where: {
            userId: currentUser.id,
            channelId: { in: propertyChannelIds }
          },
          select: { channelId: true }
        })
        const existingChannelIds = new Set(existingMemberships.map((m: any) => m.channelId))
        const missingChannelIds = propertyChannelIds.filter((cid: string) => !existingChannelIds.has(cid))

        // Auto-join missing channels
        if (missingChannelIds.length > 0) {
          await prisma.wTChannelMember.createMany({
            data: missingChannelIds.map((cid: string) => ({
              channelId: cid,
              userId: currentUser.id,
              role: 'member'
            }))
          })
        }
      }
    }

    // Find all channels where the current user is a member
    const memberships = await prisma.wTChannelMember.findMany({
      where: { userId: currentUser.id },
      include: {
        channel: {
          include: {
            members: {
              include: {
                user: {
                  select: {
                    id: true,
                    fullName: true,
                    phone: true,
                    wtStatus: true,
                    designation: true
                  }
                }
              }
            },
            speakerLock: {
              include: {
                speaker: {
                  select: {
                    id: true,
                    fullName: true
                  }
                }
              }
            }
          }
        }
      }
    })

    const channels = memberships.map((membership: any) => {
      const channel = membership.channel
      return {
        id: channel.id,
        name: channel.name,
        type: channel.type,
        isEmergency: channel.isEmergency,
        createdBy: channel.createdBy,
        createdAt: channel.createdAt,
        role: membership.role,
        muted: membership.muted,
        speaker: channel.speakerLock
          ? {
              id: channel.speakerLock.speaker.id,
              name: channel.speakerLock.speaker.fullName,
              lockedAt: channel.speakerLock.lockedAt
            }
          : null,
        membersCount: channel.members.length,
        members: channel.members.map((m: any) => ({
          id: m.user.id,
          name: m.user.fullName,
          phone: m.user.phone,
          designation: m.user.designation || 'Staff',
          wtStatus: m.user.wtStatus,
          role: m.role
        }))
      }
    })

    return NextResponse.json(channels)
  } catch (error: any) {
    console.error('[WT Channels GET] Error:', error)
    return NextResponse.json({ message: 'Internal server error.', error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const currentUser = await getWTUserFromRequest(request)
    if (!currentUser) {
      return NextResponse.json({ message: 'Unauthorized.' }, { status: 401 })
    }

    const body = await request.json()
    const { name, type = 'group', isEmergency = false, memberIds = [] } = body

    if (!name) {
      return NextResponse.json({ message: 'Channel name is required.' }, { status: 400 })
    }

    // Create channel
    const newChannel = await prisma.$transaction(async (tx: any) => {
      const channel = await tx.wTChannel.create({
        data: {
          name,
          type,
          isEmergency,
          createdBy: currentUser.id,
          propertyId: currentUser.propertyId
        }
      })

      // Add creator as Admin member
      await tx.wTChannelMember.create({
        data: {
          channelId: channel.id,
          userId: currentUser.id,
          role: 'admin'
        }
      })

      // Add other members
      let additionalMemberIds: string[] = []
      if (currentUser.propertyId) {
        const propUsers = await tx.user.findMany({
          where: { propertyId: currentUser.propertyId },
          select: { id: true }
        })
        additionalMemberIds = propUsers.map((u: any) => u.id)
      }

      const uniqueMemberIds = Array.from(new Set<string>([...memberIds, ...additionalMemberIds])).filter((id) => id !== currentUser.id)

      if (uniqueMemberIds.length > 0) {
        // Verify these users actually exist in User table and belong to the same property
        const users = await tx.user.findMany({
          where: { 
            id: { in: uniqueMemberIds },
            propertyId: currentUser.propertyId
          }
        })

        const channelMembersData = users.map((user: any) => ({
          channelId: channel.id,
          userId: user.id,
          role: 'member'
        }))

        if (channelMembersData.length > 0) {
          await tx.wTChannelMember.createMany({
            data: channelMembersData
          })
        }
      }

      return channel
    })

    // Fetch the complete channel details to return
    const channelDetails = await prisma.wTChannel.findUnique({
      where: { id: newChannel.id },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                phone: true,
                wtStatus: true,
                designation: true
              }
            }
          }
        }
      }
    })

    if (!channelDetails) {
      return NextResponse.json({ message: 'Error retrieving created channel.' }, { status: 500 })
    }

    return NextResponse.json({
      message: 'Channel created successfully.',
      channel: {
        id: channelDetails.id,
        name: channelDetails.name,
        type: channelDetails.type,
        isEmergency: channelDetails.isEmergency,
        createdBy: channelDetails.createdBy,
        createdAt: channelDetails.createdAt,
        membersCount: channelDetails.members.length,
        members: channelDetails.members.map((m: any) => ({
          id: m.user.id,
          name: m.user.fullName,
          phone: m.user.phone,
          designation: m.user.designation || 'Staff',
          wtStatus: m.user.wtStatus,
          role: m.role
        }))
      }
    })
  } catch (error: any) {
    console.error('[WT Channels POST] Error:', error)
    return NextResponse.json({ message: 'Internal server error.', error: error.message }, { status: 500 })
  }
}
