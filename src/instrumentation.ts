export async function register() {
  // Only run on server side in production
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { Server: SocketServer } = await import('socket.io')
    const { createServer } = await import('http')

    // Dynamic import to avoid circular deps
    const prismaModule = await import('./lib/prisma')
    const prisma = prismaModule.prisma

    const authModule = await import('./lib/walkie-talkie-auth')
    const verifyWTToken = authModule.verifyWTToken

    const SOCKET_PORT = parseInt(process.env.SOCKET_PORT || '5001', 10)

    // Create a standalone HTTP server for socket only
    const httpServer = createServer((req, res) => {
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
          } catch (e) {}
          res.writeHead(400);
          res.end('Bad Request');
        });
      } else {
        res.writeHead(404);
        res.end('Not Found');
      }
    })

    const io = new SocketServer(httpServer, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
      transports: ['polling', 'websocket'],
    })


    // Authentication Middleware
    io.use(async (socket: any, next: any) => {
      try {
        const token = socket.handshake.auth?.token || socket.handshake.query?.token
        if (!token || typeof token !== 'string') {
          return next(new Error('Authentication token required.'))
        }
        const payload = await verifyWTToken(token)
        if (!payload || !payload.userId) {
          return next(new Error('Invalid or expired authentication token.'))
        }
        const user = await prisma.user.findUnique({
          where: { id: payload.userId },
          select: { id: true, fullName: true, phone: true, propertyId: true },
        })
        if (!user) {
          return next(new Error('User account not found.'))
        }
        socket.data.userId = user.id
        socket.data.userName = user.fullName
        socket.data.phone = user.phone
        socket.data.propertyId = user.propertyId
        socket.data.activeChannels = new Set()
        next()
      } catch (error) {
        next(new Error('Authentication service error.'))
      }
    })

    io.on('connection', async (socket: any) => {
      const userId = socket.data.userId
      const userName = socket.data.userName
      const propertyId = socket.data.propertyId
      console.log(`[Socket] Connected: ${userName} (${userId})`)

      if (propertyId) socket.join(`prop_${propertyId}`)

      await prisma.user
        .update({ where: { id: userId }, data: { wtStatus: 'online' } })
        .catch(console.error)

      if (propertyId) {
        socket.to(`prop_${propertyId}`).emit('staff_status_changed', {
          userId,
          name: userName,
          status: 'online',
        })
      }

      socket.on('join_channel', async ({ channelId }: any) => {
        if (!channelId) return
        const isMember = await prisma.wTChannelMember
          .findFirst({ where: { channelId, userId } })
          .catch(() => null)
        if (!isMember) {
          socket.emit('error_message', { message: 'Not a member.' })
          return
        }
        socket.join(channelId)
        socket.data.activeChannels.add(channelId)
        socket.emit('joined_channel_success', { channelId })
      })

      socket.on('leave_channel', ({ channelId }: any) => {
        if (!channelId) return
        socket.leave(channelId)
        socket.data.activeChannels.delete(channelId)
      })

      socket.on('ptt_start', async ({ channelId }: any) => {
        if (!channelId) return
        const membership = await prisma.wTChannelMember
          .findFirst({ where: { channelId, userId } })
          .catch(() => null)
        if (!membership) {
          socket.emit('speaker_busy', { allowed: false, message: 'Not a member.' })
          return
        }
        const existingLock = await prisma.wTSpeakerLock
          .findUnique({
            where: { channelId },
            include: { speaker: { select: { fullName: true } } },
          })
          .catch(() => null)
        if (existingLock) {
          socket.emit('speaker_busy', {
            allowed: false,
            message: `${existingLock.speaker.fullName} is speaking.`,
            currentSpeakerId: existingLock.speakerId,
            currentSpeakerName: existingLock.speaker.fullName,
          })
          return
        }
        await prisma.$transaction(async (tx: any) => {
          await tx.wTSpeakerLock.create({ data: { channelId, speakerId: userId } })
          const history = await tx.wTTalkHistory.create({
            data: { channelId, speakerId: userId, startedAt: new Date() },
          })
          socket.data.activeTalkId = history.id
          socket.data.speakingChannelId = channelId
        })
        io.to(channelId).emit('speaker_started', {
          userId,
          name: userName,
          channelId,
          talkId: socket.data.activeTalkId,
        })
        await prisma.user
          .update({ where: { id: userId }, data: { wtStatus: 'busy' } })
          .catch(console.error)
        if (propertyId) {
          io.to(`prop_${propertyId}`).emit('staff_status_changed', {
            userId,
            name: userName,
            status: 'busy',
          })
        }
      })

      socket.on('ptt_stop', async ({ channelId }: any) => {
        if (!channelId || socket.data.speakingChannelId !== channelId) return
        await releaseMicLock(io, prisma, channelId, userId, socket.data.activeTalkId)
        socket.data.activeTalkId = null
        socket.data.speakingChannelId = null
      })

      socket.on('disconnect', async () => {
        console.log(`[Socket] Disconnected: ${userName}`)
        const speakingChannelId = socket.data.speakingChannelId
        if (speakingChannelId) {
          await releaseMicLock(
            io,
            prisma,
            speakingChannelId,
            userId,
            socket.data.activeTalkId
          ).catch(console.error)
        }
        await prisma.user
          .update({ where: { id: userId }, data: { wtStatus: 'offline' } })
          .catch(console.error)
        if (socket.data.propertyId) {
          socket.to(`prop_${socket.data.propertyId}`).emit('staff_status_changed', {
            userId,
            name: userName,
            status: 'offline',
          })
        }
      })
    })

    httpServer.listen(SOCKET_PORT, '0.0.0.0', () => {
      console.log(`📡 Socket.IO server ready on port ${SOCKET_PORT}`)
    })

    async function releaseMicLock(
      io: any,
      prisma: any,
      channelId: string,
      speakerId: string,
      talkHistoryId?: string
    ) {
      await prisma.$transaction(async (tx: any) => {
        const lock = await tx.wTSpeakerLock.findFirst({ where: { channelId, speakerId } })
        if (lock) await tx.wTSpeakerLock.delete({ where: { channelId } })
        if (talkHistoryId) {
          await tx.wTTalkHistory.update({
            where: { id: talkHistoryId },
            data: { endedAt: new Date() },
          })
        }
      })
      io.to(channelId).emit('speaker_stopped', { userId: speakerId, channelId })
      await prisma.user
        .update({ where: { id: speakerId }, data: { wtStatus: 'online' } })
        .catch(console.error)
      const speaker = await prisma.user
        .findUnique({ where: { id: speakerId }, select: { fullName: true, propertyId: true } })
        .catch(() => null)
      if (speaker?.propertyId) {
        io.to(`prop_${speaker.propertyId}`).emit('staff_status_changed', {
          userId: speakerId,
          name: speaker.fullName,
          status: 'online',
        })
      }
    }
  }
}
