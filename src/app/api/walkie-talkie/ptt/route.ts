import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getWTUserFromRequest } from '@/lib/walkie-talkie-auth'
import { RtcTokenBuilder, RtcRole } from 'agora-token'

const AGORA_MOCK_MODE = process.env.AGORA_MOCK_MODE === 'true'
const AGORA_APP_ID = process.env.AGORA_APP_ID || 'mock_agora_app_id'
const AGORA_APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE || 'mock_agora_app_certificate'

export async function GET(request: Request) {
  try {
    const currentUser = await getWTUserFromRequest(request)
    if (!currentUser) {
      return NextResponse.json({ message: 'Unauthorized.' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const channelId = searchParams.get('channelId')

    if (!channelId) {
      return NextResponse.json({ message: 'channelId is required.' }, { status: 400 })
    }

    // Verify channel membership
    const membership = await prisma.wTChannelMember.findFirst({
      where: { channelId, userId: currentUser.id }
    })

    if (!membership) {
      return NextResponse.json({ message: 'You are not a member of this channel.' }, { status: 403 })
    }

    // Fetch voice talk history
    const history = await prisma.wTTalkHistory.findMany({
      where: { channelId },
      orderBy: { startedAt: 'desc' },
      take: 50,
      include: {
        speaker: {
          select: {
            id: true,
            fullName: true,
            designation: true
          }
        }
      }
    })

    return NextResponse.json(history)
  } catch (error: any) {
    console.error('[WT PTT GET] Error:', error)
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
    const { channelId } = body

    if (!channelId) {
      return NextResponse.json({ message: 'channelId is required.' }, { status: 400 })
    }

    // Verify channel membership
    const membership = await prisma.wTChannelMember.findFirst({
      where: { channelId, userId: currentUser.id }
    })

    if (!membership) {
      return NextResponse.json({ message: 'You are not a member of this channel.' }, { status: 403 })
    }

    let token = 'mock_agora_token_for_walkie_talkie'
    const expirationTimeInSeconds = 3600 * 24 // 24 hours
    const currentTimestamp = Math.floor(Date.now() / 1000)
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds

    if (!AGORA_MOCK_MODE && process.env.AGORA_APP_ID && process.env.AGORA_APP_CERTIFICATE) {
      try {
        // Build token using Agora RtcTokenBuilder
        // We use buildTokenWithUserAccount since our user IDs are cuid strings
        token = RtcTokenBuilder.buildTokenWithUserAccount(
          AGORA_APP_ID,
          AGORA_APP_CERTIFICATE,
          channelId,
          currentUser.id,
          RtcRole.PUBLISHER,
          privilegeExpiredTs,
          privilegeExpiredTs // privilege expiration
        )
      } catch (err: any) {
        console.error('[Agora Token] Generation failed:', err)
        return NextResponse.json({ message: 'Failed to generate Agora token.', error: err.message }, { status: 500 })
      }
    } else {
      console.log(`[Agora Token Mock] Generating mock token for channel: ${channelId}, user: ${currentUser.id}`);
      token = `mock_token_ch_${channelId}_u_${currentUser.id}`
    }

    return NextResponse.json({
      token,
      appId: AGORA_APP_ID,
      channelId,
      userId: currentUser.id
    })
  } catch (error: any) {
    console.error('[WT PTT POST] Error:', error)
    return NextResponse.json({ message: 'Internal server error.', error: error.message }, { status: 500 })
  }
}
