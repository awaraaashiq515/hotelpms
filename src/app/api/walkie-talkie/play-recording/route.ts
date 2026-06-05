import { NextResponse } from 'next/server'
import { getWTUserFromRequest } from '@/lib/walkie-talkie-auth'
import { readConfig } from '../settings/route'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import fs from 'fs'
import path from 'path'

export async function GET(request: Request) {
  try {
    const currentUser = await getWTUserFromRequest(request)
    const session = await getSession()
    if (!currentUser && (!session || !session.id)) {
      return new Response('Unauthorized', { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return new Response('id parameter is required', { status: 400 })
    }

    // Fetch talk history to identify which property/customer this recording belongs to
    const talk = await prisma.wTTalkHistory.findUnique({
      where: { id },
      include: {
        speaker: {
          include: {
            property: true
          }
        }
      }
    })

    if (!talk) {
      return new Response('Recording file not found', { status: 404 })
    }

    // Read config to find the local storage path
    const config = readConfig()
    let storageDir = config.storagePath

    // Resolve path relative to project root if it is relative
    if (!path.isAbsolute(storageDir)) {
      storageDir = path.resolve(process.cwd(), storageDir)
    }

    // Append the property/customer's code to find the correct file
    const propertyCode = talk.speaker?.property?.code || 'default'
    storageDir = path.join(storageDir, propertyCode)

    const fileName = `${id}.webm`
    const filePath = path.join(storageDir, fileName)

    if (!fs.existsSync(filePath)) {
      return new Response('Recording file not found', { status: 404 })
    }

    // Read file
    const fileBuffer = fs.readFileSync(filePath)

    return new Response(fileBuffer, {
      headers: {
        'Content-Type': 'audio/webm',
        'Content-Length': fileBuffer.length.toString(),
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    })
  } catch (error: any) {
    console.error('[WT Play Recording] Error:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}
