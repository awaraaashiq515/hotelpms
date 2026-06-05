import { NextResponse } from 'next/server'
import { getWTUserFromRequest } from '@/lib/walkie-talkie-auth'
import { getSession } from '@/lib/session'
import fs from 'fs'
import path from 'path'

const CONFIG_PATH = path.join(process.cwd(), 'wt-settings.json')

export function readConfig() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const data = fs.readFileSync(CONFIG_PATH, 'utf8')
      const config = JSON.parse(data)
      if (config && config.storagePath) {
        return config
      }
    }
  } catch (error) {
    console.error('Error reading wt-settings.json:', error)
  }
  return { storagePath: './public/uploads/voice-messages' }
}

function writeConfig(config: { storagePath: string }) {
  try {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf8')
    return true
  } catch (error) {
    console.error('Error writing wt-settings.json:', error)
    return false
  }
}

export async function GET(request: Request) {
  try {
    const currentUser = await getWTUserFromRequest(request)
    const session = await getSession()
    if (!currentUser && (!session || !session.id)) {
      return NextResponse.json({ message: 'Unauthorized.' }, { status: 401 })
    }

    const config = readConfig()
    return NextResponse.json(config)
  } catch (error: any) {
    return NextResponse.json({ message: 'Internal server error.', error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const currentUser = await getWTUserFromRequest(request)
    const session = await getSession()
    if (!currentUser && (!session || !session.id)) {
      return NextResponse.json({ message: 'Unauthorized.' }, { status: 401 })
    }

    const body = await request.json()
    const { storagePath } = body

    if (!storagePath) {
      return NextResponse.json({ message: 'storagePath is required.' }, { status: 400 })
    }

    const config = { storagePath: storagePath.trim() }
    const success = writeConfig(config)

    if (!success) {
      return NextResponse.json({ message: 'Failed to write settings file.' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Settings updated successfully.', config })
  } catch (error: any) {
    return NextResponse.json({ message: 'Internal server error.', error: error.message }, { status: 500 })
  }
}
