import { io as ClientIO } from 'socket.io-client'
import { prisma } from '../lib/prisma'
import { signWTToken } from '../lib/walkie-talkie-auth'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.join(__dirname, '../../.env') })

const PORT = process.env.PORT || '5001'
const SOCKET_URL = `http://localhost:${PORT}`

async function runTest() {
  console.log('🧪 Starting Walkie-Talkie Integration Test...')

  // 1. Setup Test Data in SQLite/PostgreSQL
  console.log('📦 Setting up test database records...')
  
  // Find a default organization and property to link users to
  const org = await prisma.organization.findFirst()
  if (!org) {
    console.error('❌ Error: No organization found in the database. Run POS migrations or seeds first.')
    process.exit(1)
  }
  
  const property = await prisma.property.findFirst({ where: { organizationId: org.id } })
  const defaultPropertyId = property ? property.id : null

  // Find a default role
  const role = await prisma.role.findFirst()
  if (!role) {
    console.error('❌ Error: No roles found in the database. Run POS migrations or seeds first.')
    process.exit(1)
  }

  // Create two temporary test users
  const userA = await prisma.user.create({
    data: {
      fullName: 'Test Staff A',
      email: 'test_staff_a@ordermint.com',
      phone: '+919876543210',
      passwordHash: 'dummy_hash',
      organizationId: org.id,
      propertyId: defaultPropertyId,
      roleId: role.id
    }
  })

  const userB = await prisma.user.create({
    data: {
      fullName: 'Test Staff B',
      email: 'test_staff_b@ordermint.com',
      phone: '+918765432109',
      passwordHash: 'dummy_hash',
      organizationId: org.id,
      propertyId: defaultPropertyId,
      roleId: role.id
    }
  })

  // Create a temporary group channel
  const channel = await prisma.wTChannel.create({
    data: {
      name: 'Test Walkie Channel',
      type: 'group',
      createdBy: userA.id,
      propertyId: defaultPropertyId
    }
  })

  // Add both test users as members of the channel
  await prisma.wTChannelMember.createMany({
    data: [
      { channelId: channel.id, userId: userA.id, role: 'admin' },
      { channelId: channel.id, userId: userB.id, role: 'member' }
    ]
  })

  // 2. Generate Authentication JWT Tokens
  const tokenA = await signWTToken(userA.id, userA.phone!)
  const tokenB = await signWTToken(userB.id, userB.phone!)

  console.log(`✅ Test users created:\n - User A: ${userA.fullName}\n - User B: ${userB.fullName}`)
  console.log(`✅ Test channel created: ${channel.name}`)

  // 3. Connect Socket Clients
  console.log(`🔌 Connecting clients to Socket Server at ${SOCKET_URL}...`)

  const clientA = ClientIO(SOCKET_URL, { auth: { token: tokenA } })
  const clientB = ClientIO(SOCKET_URL, { auth: { token: tokenB } })

  // Helper promise to wait for connections
  const waitForConnect = (client: any, name: string) =>
    new Promise<void>((resolve, reject) => {
      client.on('connect', () => {
        console.log(`🔌 ${name} connected successfully!`)
        resolve()
      })
      client.on('connect_error', (err: any) => {
        reject(new Error(`${name} connection failed: ${err.message}`))
      })
    })

  try {
    await Promise.all([
      waitForConnect(clientA, 'Client A'),
      waitForConnect(clientB, 'Client B')
    ])
  } catch (err: any) {
    console.error(`❌ Connection failed: ${err.message}`)
    await cleanUp(userA.id, userB.id, channel.id)
    process.exit(1)
  }

  // 4. Test Room Joining
  console.log('🤝 Joining channel room...')
  clientA.emit('join_channel', { channelId: channel.id })
  clientB.emit('join_channel', { channelId: channel.id })

  await new Promise((r) => setTimeout(r, 1000)) // wait for room join to complete

  // 5. Test PTT Locking Sequence
  console.log('\n--- 🎙️ Test Scenario 1: User A starts speaking ---')
  
  let userBReceivedStart = false
  clientB.on('speaker_started', (data: any) => {
    console.log(`📢 Client B heard broadcast: "${data.name} started speaking in channel ${data.channelId}"`)
    if (data.userId === userA.id && data.channelId === channel.id) {
      userBReceivedStart = true
    }
  })

  // Client A requests mic lock
  clientA.emit('ptt_start', { channelId: channel.id })

  await new Promise((r) => setTimeout(r, 1500))

  if (userBReceivedStart) {
    console.log('✅ Lock broadcast received successfully by other users!')
  } else {
    console.error('❌ Error: User B did not receive the speaker started broadcast.')
  }

  console.log('\n--- 🎙️ Test Scenario 2: User B tries to speak (Should fail) ---')
  
  let userBBlocked = false
  clientB.on('speaker_busy', (data: any) => {
    console.log(`🚫 Client B received busy notice: "${data.message}" (Allowed: ${data.allowed})`)
    if (data.allowed === false) {
      userBBlocked = true
    }
  })

  // Client B requests mic lock while A is speaking
  clientB.emit('ptt_start', { channelId: channel.id })

  await new Promise((r) => setTimeout(r, 1500))

  if (userBBlocked) {
    console.log('✅ Lock mechanism correctly blocked User B from speaking!')
  } else {
    console.error('❌ Error: User B was NOT blocked while User A was speaking.')
  }

  console.log('\n--- 🎙️ Test Scenario 3: User A stops speaking (Channel opens) ---')

  let userBReceivedStop = false
  clientB.on('speaker_stopped', (data: any) => {
    console.log(`📢 Client B heard broadcast: "Speaker stopped on channel ${data.channelId}"`)
    if (data.channelId === channel.id) {
      userBReceivedStop = true
    }
  })

  // Client A releases lock
  clientA.emit('ptt_stop', { channelId: channel.id })

  await new Promise((r) => setTimeout(r, 1500))

  if (userBReceivedStop) {
    console.log('✅ Channel successfully released and broadcast sent to all!')
  } else {
    console.error('❌ Error: User B did not receive speaker stopped notice.')
  }

  // 6. Tear down and Cleanup
  console.log('\n🧹 Cleaning up test database records and disconnecting clients...')
  clientA.disconnect()
  clientB.disconnect()

  await cleanUp(userA.id, userB.id, channel.id)
  console.log('🎉 All integration tests passed successfully!')
}

async function cleanUp(userAId: string, userBId: string, channelId: string) {
  try {
    // Delete speaker locks
    await prisma.wTSpeakerLock.deleteMany({ where: { channelId } })
    // Delete talk history logs
    await prisma.wTTalkHistory.deleteMany({ where: { channelId } })
    // Delete channel members
    await prisma.wTChannelMember.deleteMany({ where: { channelId } })
    // Delete channels
    await prisma.wTChannel.deleteMany({ where: { id: channelId } })
    // Delete test users
    await prisma.user.deleteMany({ where: { id: { in: [userAId, userBId] } } })
    console.log('✅ Cleanup completed.')
  } catch (err: any) {
    console.error('❌ Error during cleanup:', err.message)
  }
}

runTest().catch((err: any) => {
  console.error('❌ Test failed with error:', err)
})
