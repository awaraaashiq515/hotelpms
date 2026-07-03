import { createServer } from 'http'
import { Server, Socket } from 'socket.io'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables from root .env
dotenv.config({ path: path.join(__dirname, '../../.env') })

import { prisma } from '../lib/prisma'
import { verifyWTToken } from '../lib/walkie-talkie-auth'

const PORT = parseInt(process.env.PORT || '5002', 10)

const httpServer = createServer((req, res) => {
  // Support local Next.js REST API route broadcasts
  if (req.method === 'POST' && req.url === '/api/broadcast-notification') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const { propertyId, event, payload } = data;
        if (propertyId && event) {
          io.to(`prop_${propertyId}`).emit(event, payload);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true }));
          return;
        }
      } catch (e) {
        console.error('[Socket HTTP Broadcast Error]', e);
      }
      res.writeHead(400);
      res.end('Bad Request');
    });
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
})

const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
})


// Authentication Middleware for Socket.IO
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token

    if (!token || typeof token !== 'string') {
      console.log('[Socket Auth] Connection rejected: Token missing')
      return next(new Error('Authentication token required.'))
    }

    const payload = await verifyWTToken(token)
    if (!payload || !payload.userId) {
      console.log('[Socket Auth] Connection rejected: Invalid JWT token')
      return next(new Error('Invalid or expired authentication token.'))
    }

    // Fetch user details from database
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, fullName: true, phone: true, propertyId: true }
    })

    if (!user) {
      console.log('[Socket Auth] Connection rejected: User not found in database')
      return next(new Error('User account not found.'))
    }

    // Attach user information to socket session
    socket.data.userId = user.id
    socket.data.userName = user.fullName
    socket.data.phone = user.phone
    socket.data.propertyId = user.propertyId
    socket.data.activeChannels = new Set<string>()

    next()
  } catch (error) {
    console.error('[Socket Auth] Middleware error:', error)
    next(new Error('Authentication service error.'))
  }
})

io.on('connection', async (socket: Socket) => {
  const userId = socket.data.userId
  const userName = socket.data.userName
  const propertyId = socket.data.propertyId
  console.log(`[Socket Conn] Staff Connected: ${userName} (${userId})`)

  // Join a property room to group status broadcasts
  if (propertyId) {
    socket.join(`prop_${propertyId}`)
  }

  // Update user status to online in database
  await prisma.user.update({
    where: { id: userId },
    data: { wtStatus: 'online' }
  }).catch((err: any) => console.error(`[Socket Conn] Error updating status for ${userName}:`, err))

  // Broadcast to other users in the same property that this user is online
  if (propertyId) {
    socket.to(`prop_${propertyId}`).emit('staff_status_changed', {
      userId,
      name: userName,
      status: 'online'
    })
  }

  // Join a channel
  socket.on('join_channel', async ({ channelId }) => {
    try {
      if (!channelId) return

      // Verify that user is indeed a member of this channel
      const isMember = await prisma.wTChannelMember.findFirst({
        where: { channelId, userId }
      })

      if (!isMember) {
        socket.emit('error_message', { message: 'You are not a member of this channel.' })
        return
      }

      socket.join(channelId)
      socket.data.activeChannels.add(channelId)
      console.log(`[Socket Room] ${userName} joined channel room: ${channelId}`)
      
      socket.emit('joined_channel_success', { channelId })
    } catch (err: any) {
      console.error('[Socket Join Channel] Error:', err)
      socket.emit('error_message', { message: 'Failed to join channel.' })
    }
  })

  // Leave a channel room
  socket.on('leave_channel', ({ channelId }) => {
    if (!channelId) return
    socket.leave(channelId)
    socket.data.activeChannels.delete(channelId)
    console.log(`[Socket Room] ${userName} left channel room: ${channelId}`)
  })

  // PTT Start (Request to Speak)
  socket.on('ptt_start', async ({ channelId }) => {
    try {
      if (!channelId) {
        socket.emit('speaker_busy', { allowed: false, message: 'channelId is required.' })
        return
      }

      // 1. Verify user is in channel
      const membership = await prisma.wTChannelMember.findFirst({
        where: { channelId, userId }
      })

      if (!membership) {
        socket.emit('speaker_busy', { allowed: false, message: 'You are not a member of this channel.' })
        return
      }

      // 2. Check lock inside database (Ensuring only one speaker speaks at a time)
      const existingLock = await prisma.wTSpeakerLock.findUnique({
        where: { channelId },
        include: { speaker: { select: { fullName: true } } }
      })

      if (existingLock) {
        // Someone else is speaking
        socket.emit('speaker_busy', {
          allowed: false,
          message: `${existingLock.speaker.fullName} is currently speaking.`,
          currentSpeakerId: existingLock.speakerId,
          currentSpeakerName: existingLock.speaker.fullName
        })
        return
      }

      // 3. Acquire lock
      await prisma.$transaction(async (tx: any) => {
        // Create lock
        await tx.wTSpeakerLock.create({
          data: {
            channelId,
            speakerId: userId
          }
        })

        // Create voice history entry
        const history = await tx.wTTalkHistory.create({
          data: {
            channelId,
            speakerId: userId,
            startedAt: new Date()
          }
        })

        // Track active talk ID on socket for end logging
        socket.data.activeTalkId = history.id
        socket.data.speakingChannelId = channelId
      })

      console.log(`[PTT Lock] Microphone locked for ${userName} on channel ${channelId}`)

      // 4. Announce speaker started to everyone in the channel (including sender)
      io.to(channelId).emit('speaker_started', {
        userId,
        name: userName,
        channelId,
        talkId: socket.data.activeTalkId
      })

      // Update user state to busy (speaking)
      await prisma.user.update({
        where: { id: userId },
        data: { wtStatus: 'busy' }
      }).catch((err: any) => console.error(err))

      if (socket.data.propertyId) {
        io.to(`prop_${socket.data.propertyId}`).emit('staff_status_changed', { userId, name: userName, status: 'busy' })
      }
    } catch (err: any) {
      console.error('[PTT Start] Error:', err)
      socket.emit('speaker_busy', { allowed: false, message: 'Failed to acquire microphone.' })
    }
  })

  // PTT Stop (Release Microphone)
  socket.on('ptt_stop', async ({ channelId }) => {
    try {
      if (!channelId) return

      const speakingChannelId = socket.data.speakingChannelId
      if (speakingChannelId !== channelId) {
        return // Socket was not the active speaker in this channel
      }

      // Release lock and record talk history
      await releaseMicLock(channelId, userId, socket.data.activeTalkId)

      // Clean up socket state variables
      socket.data.activeTalkId = null
      socket.data.speakingChannelId = null

      console.log(`[PTT Lock] Microphone released by ${userName} on channel ${channelId}`)
    } catch (err) {
      console.error('[PTT Stop] Error:', err)
    }
  })

  // Handle Disconnection
  socket.on('disconnect', async () => {
    console.log(`[Socket Disc] Staff Disconnected: ${userName} (${userId})`)

    // 1. If user was speaking, release their lock
    const speakingChannelId = socket.data.speakingChannelId
    if (speakingChannelId) {
      try {
        await releaseMicLock(speakingChannelId, userId, socket.data.activeTalkId)
        console.log(`[PTT Lock] Microphone auto-released for disconnected user ${userName}`)
      } catch (err) {
        console.error('[PTT Auto-Release] Error:', err)
      }
    }

    // 2. Update status to offline in database
    await prisma.user.update({
      where: { id: userId },
      data: { wtStatus: 'offline' }
    }).catch((err: any) => console.error(err))

    // 3. Broadcast offline status
    if (socket.data.propertyId) {
      socket.to(`prop_${socket.data.propertyId}`).emit('staff_status_changed', {
        userId,
        name: userName,
        status: 'offline'
      })
    }
  })
})

/**
 * Shared helper to release microphone lock and complete the history record.
 */
async function releaseMicLock(channelId: string, speakerId: string, talkHistoryId?: string) {
  try {
    await prisma.$transaction(async (tx: any) => {
      // Remove lock (confirming it is indeed owned by this user)
      const lock = await tx.wTSpeakerLock.findFirst({
        where: { channelId, speakerId }
      })

      if (lock) {
        await tx.wTSpeakerLock.delete({
          where: { channelId }
        })
      }

      // Update talk history end time
      if (talkHistoryId) {
        await tx.wTTalkHistory.update({
          where: { id: talkHistoryId },
          data: { endedAt: new Date() }
        })
      }
    })

    // Announce to channel members
    io.to(channelId).emit('speaker_stopped', {
      userId: speakerId,
      channelId,
      talkId: talkHistoryId
    })

    // Revert user status to online
    await prisma.user.update({
      where: { id: speakerId },
      data: { wtStatus: 'online' }
    }).catch((err: any) => console.error(err))

    const speaker = await prisma.user.findUnique({ where: { id: speakerId }, select: { fullName: true, propertyId: true } })
    if (speaker && speaker.propertyId) {
      io.to(`prop_${speaker.propertyId}`).emit('staff_status_changed', { userId: speakerId, name: speaker.fullName, status: 'online' })
    }
  } catch (err) {
    console.error('[releaseMicLock] Error:', err)
  }
}

// Start HTTP Server
httpServer.listen(PORT, () => {
  console.log(`📡 Walkie-Talkie Socket.IO Server running on port ${PORT}`)
})
