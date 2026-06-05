import { NextResponse } from 'next/server'
import { getWTUserFromRequest } from '@/lib/walkie-talkie-auth'
import { prisma } from '@/lib/prisma'
import { readConfig } from '../settings/route'
import fs from 'fs'
import path from 'path'

export async function POST(request: Request) {
  try {
    const currentUser = await getWTUserFromRequest(request)
    if (!currentUser) {
      return NextResponse.json({ message: 'Unauthorized.' }, { status: 401 })
    }

    const formData = await request.formData()
    const talkId = formData.get('talkId') as string
    const file = formData.get('file') as File | null

    if (!talkId) {
      return NextResponse.json({ message: 'talkId is required.' }, { status: 400 })
    }
    if (!file) {
      return NextResponse.json({ message: 'audio file is required.' }, { status: 400 })
    }

    // Read config to find the local storage path
    const config = readConfig()
    let storageDir = config.storagePath

    // Resolve path relative to project root if it is relative
    if (!path.isAbsolute(storageDir)) {
      storageDir = path.resolve(process.cwd(), storageDir)
    }

    // Partition by customer/property code so each customer's files are separate
    const propertyCode = currentUser.property?.code || 'default'
    storageDir = path.join(storageDir, propertyCode)

    // Ensure directory exists
    if (!fs.existsSync(storageDir)) {
      fs.mkdirSync(storageDir, { recursive: true })
    }

    // Save the file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const fileName = `${talkId}.webm`
    const filePath = path.join(storageDir, fileName)

    fs.writeFileSync(filePath, buffer)

    // Update database record
    const playUrl = `/api/walkie-talkie/play-recording?id=${talkId}`
    await prisma.wTTalkHistory.update({
      where: { id: talkId },
      data: { recordingUrl: playUrl }
    })

    return NextResponse.json({
      success: true,
      message: 'Recording uploaded successfully.',
      recordingUrl: playUrl
    })
  } catch (error: any) {
    console.error('[WT Upload Recording] Error:', error)
    return NextResponse.json({ message: 'Internal server error.', error: error.message }, { status: 500 })
  }
}
