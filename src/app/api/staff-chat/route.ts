import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';
import { getSession } from '@/lib/session';
import { getWTUserFromRequest } from '@/lib/walkie-talkie-auth';
import { createNotification } from '@/lib/notificationService';

// Ensure StaffChatMessage table and channels exist in SQLite
async function ensureChatTable() {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS StaffChatMessage (
        id TEXT PRIMARY KEY,
        propertyId TEXT NOT NULL,
        staffId TEXT NOT NULL,
        staffName TEXT NOT NULL,
        senderRole TEXT NOT NULL,
        senderName TEXT NOT NULL,
        message TEXT NOT NULL,
        channelType TEXT DEFAULT 'ADMIN',
        recipientId TEXT,
        isRead INTEGER DEFAULT 0,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_staff_chat_prop ON StaffChatMessage(propertyId);
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_staff_chat_staff ON StaffChatMessage(staffId);
    `);
    try {
      const columns: any[] = await prisma.$queryRawUnsafe(`PRAGMA table_info(StaffChatMessage);`);
      const colNames = Array.isArray(columns) ? columns.map((c: any) => c.name) : [];
      if (!colNames.includes('channelType')) {
        await prisma.$executeRawUnsafe(`ALTER TABLE StaffChatMessage ADD COLUMN channelType TEXT DEFAULT 'ADMIN';`);
      }
      if (!colNames.includes('recipientId')) {
        await prisma.$executeRawUnsafe(`ALTER TABLE StaffChatMessage ADD COLUMN recipientId TEXT;`);
      }
    } catch (_) {}
  } catch (e) {
    console.error('Error ensuring StaffChatMessage table:', e);
  }
}

let tableChecked = false;

/**
 * GET /api/staff-chat
 * Fetches contacts, channel messages, or admin summaries.
 */
export async function GET(request: NextRequest) {
  try {
    if (!tableChecked) {
      await ensureChatTable();
      tableChecked = true;
    }

    const { searchParams } = new URL(request.url);
    const propertyCode = searchParams.get('propertyCode');
    const requestedStaffId = searchParams.get('staffId');
    const summary = searchParams.get('summary') === 'true';
    const contacts = searchParams.get('contacts') === 'true';
    const channelType = searchParams.get('channelType') || 'ADMIN'; // 'GROUP' | 'ADMIN' | 'DIRECT'
    const recipientId = searchParams.get('recipientId');
    const fromAdmin = searchParams.get('fromAdmin') === 'true';

    // 1. Resolve auth: prioritize admin session if summary or fromAdmin is requested
    const authHeader = request.headers.get('authorization');
    let staffUser: any = null;
    let session: any = null;

    if (summary || fromAdmin) {
      session = await getSession();
      if (!session && authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
        staffUser = await getWTUserFromRequest(request as any);
      }
    } else {
      if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
        staffUser = await getWTUserFromRequest(request as any);
      }
      if (!staffUser) {
        session = await getSession();
      }
      if (!staffUser && !session) {
        staffUser = await getWTUserFromRequest(request as any);
      }
    }

    if (!session && !staffUser) {
      return apiError(new Error('Unauthorized'), 401);
    }

    // 2. Resolve propertyId and organizationId
    let propertyId = session?.propertyId || staffUser?.propertyId;
    let organizationId = session?.organizationId || staffUser?.organizationId;

    if (propertyCode) {
      const prop = await prisma.property.findFirst({
        where: { code: propertyCode.toUpperCase() },
        select: { id: true, organizationId: true },
      });
      if (prop?.id) {
        propertyId = prop.id;
        organizationId = prop.organizationId;
      }
    }

    if (!organizationId && propertyId) {
      const prop = await prisma.property.findUnique({
        where: { id: propertyId },
        select: { organizationId: true },
      });
      if (prop?.organizationId) organizationId = prop.organizationId;
    }

    // Organization-wide properties for attached Hotel + Restaurant
    let propertyIds: string[] = propertyId ? [propertyId] : [];
    if (organizationId) {
      const orgProps = await prisma.property.findMany({
        where: { organizationId },
        select: { id: true },
      });
      propertyIds = orgProps.map((p: any) => p.id);
    }

    if (propertyIds.length === 0) {
      return apiError(new Error('Property not resolved'), 400);
    }

    const propPlaceholders = propertyIds.map(() => '?').join(',');

    // 3. Resolve current user's staffMember record
    let myStaffMember: any = null;
    const lookupId = staffUser?.id || requestedStaffId || session?.id;
    if (lookupId) {
      myStaffMember = await prisma.staffMember.findFirst({
        where: { OR: [{ id: lookupId }, { userId: lookupId }] },
      });
    }

    // ── CASE 1: Fetch Contacts List (Staff members in property/org) ──
    if (contacts) {
      const allStaff = await prisma.staffMember.findMany({
        where: { propertyId: { in: propertyIds }, isActive: true },
        select: { id: true, name: true, designation: true, avatarUrl: true, phone: true, userId: true },
        orderBy: { name: 'asc' },
      });

      // Filter out self if known
      const otherStaff = myStaffMember ? allStaff.filter(s => s.id !== myStaffMember.id && s.userId !== myStaffMember.userId) : allStaff;

      const myId = myStaffMember?.id || '';
      const myUserId = myStaffMember?.userId || '';

      const unreadList: any[] = await prisma.$queryRawUnsafe(`
        SELECT channelType, staffId, recipientId, COUNT(*) as count
        FROM StaffChatMessage
        WHERE propertyId IN (${propPlaceholders}) AND isRead = 0
        GROUP BY channelType, staffId, recipientId
      `, ...propertyIds);

      const groupUnread = unreadList
        .filter((u: any) => u.channelType === 'GROUP' && u.staffId !== myId && u.staffId !== myUserId)
        .reduce((sum: number, u: any) => sum + Number(u.count || 0), 0);

      const adminUnread = unreadList
        .filter((u: any) => (u.channelType === 'ADMIN' || !u.channelType) && (u.staffId === myId || u.staffId === myUserId))
        .reduce((sum: number, u: any) => sum + Number(u.count || 0), 0);

      const staffWithUnread = otherStaff.map(s => {
        const directUnread = unreadList
          .filter((u: any) => 
            (u.channelType === 'DIRECT' || u.channelType === 'ADMIN') &&
            (u.staffId === s.id || u.staffId === s.userId) &&
            (u.recipientId === myId || u.recipientId === myUserId || !u.recipientId)
          )
          .reduce((sum: number, u: any) => sum + Number(u.count || 0), 0);
        return {
          id: s.id,
          userId: s.userId,
          name: s.name,
          designation: s.designation,
          avatarUrl: s.avatarUrl,
          phone: s.phone,
          unreadCount: directUnread,
        };
      });

      return apiResponse({
        currentStaff: myStaffMember ? { id: myStaffMember.id, userId: myStaffMember.userId, name: myStaffMember.name, designation: myStaffMember.designation } : null,
        staffList: staffWithUnread,
        unreadSummary: {
          group: groupUnread,
          admin: adminUnread,
          total: groupUnread + adminUnread + staffWithUnread.reduce((a, b) => a + b.unreadCount, 0),
        },
      }, 'Contacts fetched');
    }

    // ── CASE 2: Admin requesting summary list of all staff chats ──
    if (session && summary) {
      const allStaff = await prisma.staffMember.findMany({
        where: { propertyId: { in: propertyIds }, isActive: true },
        select: { id: true, name: true, designation: true, avatarUrl: true, userId: true },
        orderBy: { name: 'asc' },
      });

      const chats: any[] = await prisma.$queryRawUnsafe(`
        SELECT staffId, message, senderRole, senderName, isRead, createdAt, channelType, recipientId
        FROM StaffChatMessage
        WHERE propertyId IN (${propPlaceholders})
        ORDER BY createdAt DESC
      `, ...propertyIds);

      const summaryList = allStaff.map(s => {
        const staffMsgs = chats.filter((c: any) =>
          (c.staffId === s.id || c.staffId === s.userId || c.recipientId === s.id || c.recipientId === s.userId) &&
          (c.channelType === 'ADMIN' || c.channelType === 'DIRECT' || !c.channelType)
        );
        const latestMsg = staffMsgs[0] || null;
        const unreadCount = staffMsgs.filter((c: any) => c.senderRole === 'STAFF' && !c.isRead).length;
        return {
          staff: s,
          latestMessage: latestMsg,
          unreadCount,
        };
      });

      summaryList.sort((a, b) => {
        if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
        if (b.unreadCount > 0 && a.unreadCount === 0) return 1;
        if (a.latestMessage && !b.latestMessage) return -1;
        if (!a.latestMessage && b.latestMessage) return 1;
        if (a.latestMessage && b.latestMessage) {
          return new Date(b.latestMessage.createdAt).getTime() - new Date(a.latestMessage.createdAt).getTime();
        }
        return 0;
      });

      return apiResponse(summaryList, 'Chat summary fetched');
    }

    // ── CASE 3: Fetch Messages by Channel ──
    // A) GROUP CHANNEL
    if (channelType === 'GROUP') {
      const messages: any[] = await prisma.$queryRawUnsafe(`
        SELECT id, propertyId, staffId, staffName, senderRole, senderName, message, isRead, createdAt, channelType, recipientId
        FROM StaffChatMessage
        WHERE propertyId IN (${propPlaceholders}) AND channelType = 'GROUP'
        ORDER BY createdAt ASC
        LIMIT 150
      `, ...propertyIds);

      return apiResponse(messages, 'Group messages fetched');
    }

    // B) 1-ON-1 / ADMIN / DIRECT CHANNEL
    const targetLookup = requestedStaffId || recipientId || myStaffMember?.id;
    let targetStaff: any = null;
    if (targetLookup) {
      targetStaff = await prisma.staffMember.findFirst({
        where: { OR: [{ id: targetLookup }, { userId: targetLookup }] },
        select: { id: true, userId: true, name: true }
      });
    }

    const targetIds = Array.from(new Set([
      requestedStaffId,
      recipientId,
      targetStaff?.id,
      targetStaff?.userId,
      myStaffMember?.id,
      myStaffMember?.userId
    ].filter(Boolean))) as string[];

    if (targetIds.length === 0) {
      return apiResponse([], 'No staff selected');
    }

    const idPlaceholders = targetIds.map(() => '?').join(',');

    const messages: any[] = await prisma.$queryRawUnsafe(`
      SELECT id, propertyId, staffId, staffName, senderRole, senderName, message, isRead, createdAt, channelType, recipientId
      FROM StaffChatMessage
      WHERE propertyId IN (${propPlaceholders})
        AND (
          staffId IN (${idPlaceholders})
          OR recipientId IN (${idPlaceholders})
        )
        AND (channelType != 'GROUP' OR channelType IS NULL)
      ORDER BY createdAt ASC
      LIMIT 150
    `, ...propertyIds, ...targetIds, ...targetIds);

    // Mark messages as read
    if (staffUser) {
      await prisma.$executeRawUnsafe(`
        UPDATE StaffChatMessage
        SET isRead = 1
        WHERE propertyId IN (${propPlaceholders})
          AND (staffId IN (${idPlaceholders}) OR recipientId IN (${idPlaceholders}))
          AND senderRole = 'ADMIN' AND isRead = 0
      `, ...propertyIds, ...targetIds, ...targetIds).catch(() => null);
    } else if (session) {
      await prisma.$executeRawUnsafe(`
        UPDATE StaffChatMessage
        SET isRead = 1
        WHERE propertyId IN (${propPlaceholders})
          AND (staffId IN (${idPlaceholders}) OR recipientId IN (${idPlaceholders}))
          AND senderRole = 'STAFF' AND isRead = 0
      `, ...propertyIds, ...targetIds, ...targetIds).catch(() => null);
    }

    return apiResponse(messages, 'Messages fetched');
  } catch (error) {
    return apiError(error);
  }
}

/**
 * POST /api/staff-chat
 * Sends a message in GROUP, ADMIN, or DIRECT channel.
 */
export async function POST(request: NextRequest) {
  try {
    if (!tableChecked) {
      await ensureChatTable();
      tableChecked = true;
    }

    const authHeader = request.headers.get('authorization');
    let staffUser: any = null;
    let session: any = null;

    if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
      staffUser = await getWTUserFromRequest(request as any);
    }
    if (!staffUser) {
      session = await getSession();
    }
    if (!staffUser && !session) {
      staffUser = await getWTUserFromRequest(request as any);
    }

    if (!session && !staffUser) {
      return apiError(new Error('Unauthorized'), 401);
    }

    const body = await request.json();
    const text = (body.message || '').trim();
    if (!text) {
      return apiError(new Error('Message text is required'), 400);
    }

    const channelType = body.channelType || 'ADMIN'; // 'GROUP' | 'ADMIN' | 'DIRECT'
    const recipientId = body.recipientId || null;

    let propertyId = body.propertyId || session?.propertyId || staffUser?.propertyId;
    if (body.propertyCode) {
      const prop = await prisma.property.findFirst({
        where: { code: body.propertyCode.toUpperCase() },
        select: { id: true },
      });
      if (prop?.id) propertyId = prop.id;
    }

    if (!propertyId) {
      return apiError(new Error('Property ID missing'), 400);
    }

    const id = 'scm_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);

    const isStaffSender = Boolean(
      (staffUser && !body.fromAdminDashboard && body.senderRole !== 'ADMIN') ||
      body.senderRole === 'STAFF' ||
      (body.staffId && !body.fromAdminDashboard && channelType !== 'GROUP' && body.senderRole !== 'ADMIN') ||
      (channelType === 'ADMIN' && !body.fromAdminDashboard && !recipientId && body.senderRole !== 'ADMIN')
    );

    // ── Sent by Staff ──
    if (isStaffSender) {
      const staffLookupId = staffUser?.id || body.staffId || session?.id;
      let staffMember: any = null;

      if (staffLookupId) {
        staffMember = await prisma.staffMember.findFirst({
          where: { OR: [{ userId: staffLookupId }, { id: staffLookupId }] },
        });
      }

      if (!staffMember) {
        const userRec = staffLookupId
          ? await prisma.user.findFirst({
              where: { OR: [{ id: staffLookupId }, { email: staffLookupId }] },
              include: { role: true, staffMember: true },
            })
          : null;

        if (userRec?.staffMember) {
          staffMember = userRec.staffMember;
        } else if (userRec) {
          staffMember = await prisma.staffMember.findFirst({
            where: { userId: userRec.id },
          });
          if (!staffMember) {
            const nameToUse = body.senderName || staffUser?.fullName || userRec?.fullName || 'Housekeeping Staff';
            staffMember = await prisma.staffMember.create({
              data: {
                name: nameToUse,
                propertyId: userRec?.propertyId || propertyId,
                userId: userRec?.id,
                designation: userRec?.role?.name || body.designation || 'Housekeeping',
                shiftHours: 8.0,
                salary: 0,
              },
            }).catch(() => null);
          }
        }

        if (!staffMember) {
          staffMember = await prisma.staffMember.findFirst({
            where: { OR: [{ userId: staffLookupId }, { id: staffLookupId }] },
          });
        }
      }

      const staffId = staffMember?.id || staffLookupId || 'staff_unknown';
      const staffName = staffMember?.name || staffUser?.fullName || body.senderName || 'Staff';
      const actualPropId = staffMember?.propertyId || propertyId;

      await prisma.$executeRawUnsafe(`
        INSERT INTO StaffChatMessage (id, propertyId, staffId, staffName, senderRole, senderName, message, channelType, recipientId, isRead, createdAt)
        VALUES (?, ?, ?, ?, 'STAFF', ?, ?, ?, ?, 0, datetime('now'))
      `, id, actualPropId, staffId, staffName, staffName, text, channelType, recipientId);

      // Trigger admin notification if sent to ADMIN or GROUP
      if (channelType === 'ADMIN' || channelType === 'GROUP' || channelType === 'DIRECT') {
        try {
          await createNotification({
            propertyId: actualPropId,
            title: channelType === 'GROUP' ? `📢 Team Chat: ${staffName}` : `💬 Staff Message: ${staffName}`,
            message: text.length > 80 ? text.substring(0, 80) + '…' : text,
            type: 'STAFF',
            priority: 'MEDIUM',
            metadata: {
              staffId,
              staffName,
              channelType,
              link: '/hotel/staff?tab=chat',
            },
          });
        } catch (_) {}
      }

      return apiResponse({
        id,
        propertyId: actualPropId,
        staffId,
        staffName,
        senderRole: 'STAFF',
        senderName: staffName,
        message: text,
        channelType,
        recipientId,
        isRead: 0,
        createdAt: new Date().toISOString(),
      }, 'Message sent', 201);
    }

    // ── Sent by Admin ──
    if (session) {
      const adminName = (session as any).fullName || session.email?.split('@')[0] || 'Hotel Admin';

      if (channelType === 'GROUP') {
        await prisma.$executeRawUnsafe(`
          INSERT INTO StaffChatMessage (id, propertyId, staffId, staffName, senderRole, senderName, message, channelType, recipientId, isRead, createdAt)
          VALUES (?, ?, 'ADMIN', 'Hotel Admin', 'ADMIN', ?, ?, 'GROUP', NULL, 0, datetime('now'))
        `, id, propertyId, adminName, text);

        return apiResponse({
          id,
          propertyId,
          staffId: 'ADMIN',
          staffName: 'Hotel Admin',
          senderRole: 'ADMIN',
          senderName: adminName,
          message: text,
          channelType: 'GROUP',
          recipientId: null,
          isRead: 0,
          createdAt: new Date().toISOString(),
        }, 'Group message sent', 201);
      }

      const targetStaffLookup = body.staffId || recipientId;
      if (!targetStaffLookup) {
        return apiError(new Error('Target staffId is required for admin message'), 400);
      }

      const staffMember = await prisma.staffMember.findFirst({
        where: { OR: [{ id: targetStaffLookup }, { userId: targetStaffLookup }] },
        select: { id: true, name: true, propertyId: true },
      });

      const staffId = staffMember?.id || targetStaffLookup;
      const staffName = staffMember?.name || 'Staff Member';
      const actualPropId = staffMember?.propertyId || propertyId;

      await prisma.$executeRawUnsafe(`
        INSERT INTO StaffChatMessage (id, propertyId, staffId, staffName, senderRole, senderName, message, channelType, recipientId, isRead, createdAt)
        VALUES (?, ?, ?, ?, 'ADMIN', ?, ?, ?, ?, 0, datetime('now'))
      `, id, actualPropId, staffId, staffName, adminName, text, channelType, staffId);

      return apiResponse({
        id,
        propertyId: actualPropId,
        staffId,
        staffName,
        senderRole: 'ADMIN',
        senderName: adminName,
        message: text,
        channelType,
        recipientId: staffId,
        isRead: 0,
        createdAt: new Date().toISOString(),
      }, 'Message sent', 201);
    }

    return apiError(new Error('Invalid session'), 400);
  } catch (error) {
    return apiError(error);
  }
}
