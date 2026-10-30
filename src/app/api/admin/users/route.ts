import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';
import { getSession } from '@/lib/session';
import bcrypt from 'bcryptjs';

// GET all users (Super Admin / Admin Only)
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return apiError(new Error('Unauthorized'), 401);
    }

    const { searchParams } = new URL(request.url);
    const showGlobal = searchParams.get('global') === 'true' && session.role === 'SUPER_ADMIN';
    const isSuperRequest = session.role === 'SUPER_ADMIN';

    const users = await prisma.user.findMany({
      where: {
        organizationId: showGlobal ? undefined : session.organizationId,
        // Regular Admins cannot see Super Admins
        ...((isSuperRequest && showGlobal) ? {} : { role: { name: { not: 'SUPER_ADMIN' } } })
      },
      include: {
        organization: { select: { id: true, name: true } },
        property: { select: { id: true, name: true, code: true } },
        role: { select: { id: true, name: true, description: true } },
        servedOrders: { select: { grandTotal: true } },
        supplier: { select: { id: true, name: true } },
        staffMember: {
          select: {
            id: true,
            designation: true,
            salary: true,
            address: true,
            emergencyContact: true,
            joiningDate: true,
            shiftHours: true
          }
        },
        deliveryOrders: {
          where: {
            status: 'SETTLED',
            codCollected: true,
            deliveryPaymentMethod: 'CASH',
            riderHandoverId: null
          },
          select: {
            codAmountCollected: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    // Remove password hashes and calculate total sales & outstanding cash
    const safeUsers = users.map(({ passwordHash, ...user }: any) => ({
      ...user,
      totalSales: ((user as any).servedOrders || []).reduce((sum: number, b: any) => sum + (b.grandTotal || 0), 0),
      outstandingCash: ((user as any).deliveryOrders || []).reduce((sum: number, o: any) => sum + (o.codAmountCollected || 0), 0),
    }));

    return apiResponse(safeUsers, 'Users fetched successfully');
  } catch (error) {
    return apiError(error);
  }
}

const STAFF_MANAGEMENT_ROLES = [
  'SUPER_ADMIN', 
  'RESTAURANTS_ADMIN', 
  'HOTEL_ADMIN', 
  'HOTEL_MANAGER', 
  'HOTEL_RECEPTIONIST', 
  'POSSYSTEM', 
  'Staff'
];

// POST Create new User
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !STAFF_MANAGEMENT_ROLES.includes(session.role)) {
      return apiError(new Error('Unauthorized'), 401);
    }

    const body = await request.json();
    const { fullName, email, password, roleName, propertyId, floorId, supplierId } = body;

    // Validation
    if (!fullName || !email || !password || !roleName) {
      return apiError(new Error('Missing required fields: fullName, email, password, roleName'), 400);
    }

    // Security: Only SUPER_ADMIN can create SUPER_ADMIN or RESTAURANTS_ADMIN
    if (session.role !== 'SUPER_ADMIN' && (roleName === 'SUPER_ADMIN' || roleName === 'RESTAURANTS_ADMIN')) {
      return apiError(new Error('You do not have permission to create this admin role'), 403);
    }

    // Security: Receptionist/Staff/POS cannot create HOTEL_ADMIN
    if (['HOTEL_RECEPTIONIST', 'HOTEL_MANAGER', 'POSSYSTEM', 'Staff'].includes(session.role) && roleName === 'HOTEL_ADMIN') {
      return apiError(new Error('You do not have permission to create a Hotel Admin'), 403);
    }

    // Check if user already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return apiError(new Error('User with this email already exists'), 400);

    // Look up role
    let role = await prisma.role.findUnique({ where: { name: roleName } });
    if (!role && roleName === 'DELIVERY_RIDER') {
      role = await prisma.role.create({
        data: {
          name: 'DELIVERY_RIDER',
          description: 'Delivery Rider'
        }
      });
    }
    if (!role) return apiError(new Error(`Role '${roleName}' not found`), 400);

    const passwordHash = await bcrypt.hash(password, 10);

    let targetOrgId = session.organizationId;
    
    if (session.role === 'SUPER_ADMIN') {
      if (roleName === 'RESTAURANTS_ADMIN') {
        const newOrg = await prisma.organization.create({
          data: {
            name: `${fullName}'s Business`,
          }
        });
        targetOrgId = newOrg.id;
      } else if (propertyId) {
        const targetProperty = await prisma.property.findUnique({
          where: { id: propertyId }
        });
        if (targetProperty) {
          targetOrgId = targetProperty.organizationId;
        }
      }
    }

    const autoRefinedPropertyId = (roleName === 'SUPER_ADMIN' || roleName === 'RESTAURANTS_ADMIN') ? null : (propertyId || null);
    const autoRefinedSupplierId = roleName === 'B2B_SUPPLIER' ? (supplierId || null) : null;

    const newUser = await prisma.user.create({
      data: {
        fullName,
        email,
        passwordHash,
        organizationId: targetOrgId as string,
        propertyId: autoRefinedPropertyId,
        supplierId: autoRefinedSupplierId,
        roleId: role.id,
        isActive: true,
        posPin: body.posPin || null,
        onboardingCompleted: true,
        phone: body.phone || null,
        vehicleNumber: body.vehicleNumber || null,
        vehicleType: body.vehicleType || 'BIKE',
        deliveryLocation: body.deliveryLocation || null,
        deliveryLat: body.deliveryLat !== undefined && body.deliveryLat !== null ? parseFloat(body.deliveryLat) : null,
        deliveryLng: body.deliveryLng !== undefined && body.deliveryLng !== null ? parseFloat(body.deliveryLng) : null,
        deliveryRadius: body.deliveryRadius !== undefined && body.deliveryRadius !== null ? parseFloat(body.deliveryRadius) : 5.0,
      },
    });

    const { passwordHash: _, ...safeUser } = newUser;
    return apiResponse(safeUser, 'User created successfully', 201);
  } catch (error) {
    return apiError(error);
  }
}

// PATCH Update User Status (Block/Unblock)
export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !STAFF_MANAGEMENT_ROLES.includes(session.role)) {
      return apiError(new Error('Unauthorized'), 401);
    }

    const body = await request.json();
    const { userId, isActive } = body;

    if (!userId) return apiError(new Error('Missing userId'), 400);

    const targetUser = await prisma.user.findUnique({ 
      where: { id: userId }, 
      include: { role: true } 
    });

    if (!targetUser) return apiError(new Error('User not found'), 404);

    // Multi-tenant check
    if (session.role !== 'SUPER_ADMIN' && targetUser.organizationId !== session.organizationId) {
      return apiError(new Error('Unauthorized to modify user from another organization'), 403);
    }

    // Security: Regular Admins/Staff cannot modify Super Admins
    if (session.role !== 'SUPER_ADMIN' && targetUser.role?.name === 'SUPER_ADMIN') {
      return apiError(new Error('You do not have permission to modify a Super Admin'), 403);
    }

    // Security: Receptionist / Manager / POS / Staff cannot block Hotel Admin or Restaurant Admin
    if (['HOTEL_RECEPTIONIST', 'HOTEL_MANAGER', 'POSSYSTEM', 'Staff'].includes(session.role)) {
      if (['HOTEL_ADMIN', 'RESTAURANTS_ADMIN'].includes(targetUser.role?.name || '')) {
        return apiError(new Error('You do not have permission to modify an Admin user'), 403);
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { isActive },
    });

    const { passwordHash: _, ...safeUser } = updatedUser;
    return apiResponse(safeUser, 'User status updated successfully');
  } catch (error) {
    return apiError(error);
  }
}

// PUT Update User Details
export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !STAFF_MANAGEMENT_ROLES.includes(session.role)) {
      return apiError(new Error('Unauthorized'), 401);
    }

    const body = await request.json();
    const { id, fullName, email, password, roleName, propertyId, supplierId } = body;

    if (!id || !fullName || !email || !roleName) {
      return apiError(new Error('Missing required fields: id, fullName, email, roleName'), 400);
    }

    const targetUser = await prisma.user.findUnique({ 
      where: { id }, 
      include: { role: true } 
    });

    if (!targetUser) return apiError(new Error('User not found'), 404);

    // Multi-tenant check
    if (session.role !== 'SUPER_ADMIN' && targetUser.organizationId !== session.organizationId) {
      return apiError(new Error('Unauthorized to modify user from another organization'), 403);
    }

    // Security: Cannot modify Super Admins or promote anyone to Super Admin unless session is Super Admin
    if (session.role !== 'SUPER_ADMIN') {
      if (targetUser?.role?.name === 'SUPER_ADMIN' || roleName === 'SUPER_ADMIN') {
        return apiError(new Error('You do not have permission for this role action'), 403);
      }
    }

    // Security: Staff / Receptionist / POS cannot edit Admin accounts or promote to Admin
    if (['HOTEL_RECEPTIONIST', 'HOTEL_MANAGER', 'POSSYSTEM', 'Staff'].includes(session.role)) {
      if (['HOTEL_ADMIN', 'RESTAURANTS_ADMIN'].includes(targetUser.role?.name || '') || ['HOTEL_ADMIN', 'RESTAURANTS_ADMIN'].includes(roleName)) {
        return apiError(new Error('You do not have permission to edit Admin accounts'), 403);
      }
    }

    let role = await prisma.role.findUnique({ where: { name: roleName } });
    if (!role && roleName === 'DELIVERY_RIDER') {
      role = await prisma.role.create({
        data: {
          name: 'DELIVERY_RIDER',
          description: 'Delivery Rider'
        }
      });
    }
    if (!role) return apiError(new Error(`Role '${roleName}' not found`), 400);

    const dataToUpdate: any = {
      fullName,
      email,
      roleId: role.id,
      propertyId: (roleName === 'SUPER_ADMIN' || roleName === 'RESTAURANTS_ADMIN') ? null : (propertyId || null),
      supplierId: roleName === 'B2B_SUPPLIER' ? (supplierId || null) : null,
      phone: body.phone !== undefined ? body.phone : undefined,
      vehicleNumber: body.vehicleNumber !== undefined ? body.vehicleNumber : undefined,
      vehicleType: body.vehicleType !== undefined ? body.vehicleType : undefined,
      deliveryLocation: body.deliveryLocation !== undefined ? body.deliveryLocation : undefined,
      deliveryLat: body.deliveryLat !== undefined ? (body.deliveryLat !== null ? parseFloat(body.deliveryLat) : null) : undefined,
      deliveryLng: body.deliveryLng !== undefined ? (body.deliveryLng !== null ? parseFloat(body.deliveryLng) : null) : undefined,
      deliveryRadius: body.deliveryRadius !== undefined ? (body.deliveryRadius !== null ? parseFloat(body.deliveryRadius) : 5.0) : undefined,
    };

    if (session.role === 'SUPER_ADMIN' && dataToUpdate.propertyId) {
      const targetProperty = await prisma.property.findUnique({
        where: { id: dataToUpdate.propertyId }
      });
      if (targetProperty) {
        dataToUpdate.organizationId = targetProperty.organizationId;
      }
    }

    if (password) {
      dataToUpdate.passwordHash = await bcrypt.hash(password, 10);
    }

    if (body.posPin !== undefined) {
      dataToUpdate.posPin = body.posPin;
    }

    if (targetUser.email !== email) {
      const emailCheck = await prisma.user.findUnique({ where: { email } });
      if (emailCheck) return apiError(new Error('User with this email already exists'), 400);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: dataToUpdate,
    });

    const { passwordHash: _, ...safeUser } = updatedUser;
    return apiResponse(safeUser, 'User updated successfully');
  } catch (error) {
    return apiError(error);
  }
}

// DELETE User
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !STAFF_MANAGEMENT_ROLES.includes(session.role)) {
      return apiError(new Error('Unauthorized'), 401);
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return apiError(new Error('Missing user id'), 400);

    if (id === session.id) {
      return apiError(new Error('Cannot delete your own account'), 400);
    }

    const targetUser = await prisma.user.findUnique({ 
      where: { id }, 
      include: { role: true, staffMember: true } 
    });

    if (!targetUser) {
      return apiError(new Error('User not found'), 404);
    }

    // Security: Non-Super Admins cannot delete Super Admins
    if (session.role !== 'SUPER_ADMIN' && targetUser.role?.name === 'SUPER_ADMIN') {
      return apiError(new Error('You do not have permission to delete a Super Admin'), 403);
    }

    // Multi-tenant check: Cannot delete user from another organization
    if (session.role !== 'SUPER_ADMIN' && targetUser.organizationId !== session.organizationId) {
      return apiError(new Error('Unauthorized to delete user from another organization'), 403);
    }

    // Security: Receptionist / Manager / POS / Staff cannot delete Hotel Admin or Restaurant Admin
    if (['HOTEL_RECEPTIONIST', 'HOTEL_MANAGER', 'POSSYSTEM', 'Staff'].includes(session.role)) {
      if (['HOTEL_ADMIN', 'RESTAURANTS_ADMIN', 'SUPER_ADMIN'].includes(targetUser.role?.name || '')) {
        return apiError(new Error('You do not have permission to delete an Admin account'), 403);
      }
    }

    // Clean up or detach all dependent relations safely in a transaction
    await prisma.$transaction(async (tx) => {
      // 1. Unlink PosOrder records (do not delete financial orders, just unlink)
      await tx.posOrder.updateMany({
        where: { servedById: id },
        data: { servedById: null }
      }).catch(() => {});
      await tx.posOrder.updateMany({
        where: { deliveryRiderId: id },
        data: { deliveryRiderId: null }
      }).catch(() => {});

      // 2. Unlink AuditLog records
      await tx.auditLog.updateMany({
        where: { userId: id },
        data: { userId: null }
      }).catch(() => {});

      // 3. Delete attendance for user and their staffMember
      await tx.attendance.deleteMany({
        where: {
          OR: [
            { userId: id },
            ...(targetUser.staffMember ? [{ staffMemberId: targetUser.staffMember.id }] : [])
          ]
        }
      }).catch(() => {});

      // 4. Delete staffMember related leaves, tips, unlink pos orders, and delete the staffMember itself
      if (targetUser.staffMember) {
        await tx.leaveRequest.deleteMany({ where: { staffId: targetUser.staffMember.id } }).catch(() => {});
        await tx.tipTransaction.deleteMany({ where: { staffMemberId: targetUser.staffMember.id } }).catch(() => {});
        await tx.posOrder.updateMany({
          where: { staffMemberId: targetUser.staffMember.id },
          data: { staffMemberId: null }
        }).catch(() => {});
        await tx.staffMember.deleteMany({ where: { id: targetUser.staffMember.id } }).catch(() => {});
      } else {
        await tx.staffMember.deleteMany({ where: { userId: id } }).catch(() => {});
      }

      // 5. Clean up delivery trips, handovers, walkie-talkie & table assignments
      await tx.deliveryTrip.deleteMany({ where: { riderId: id } }).catch(() => {});
      await tx.riderCashHandover.deleteMany({ where: { riderId: id } }).catch(() => {});
      await tx.tableAssignment.deleteMany({ where: { userId: id } }).catch(() => {});
      await tx.staffLocation.deleteMany({ where: { userId: id } }).catch(() => {});
      await tx.wTChannelMember.deleteMany({ where: { userId: id } }).catch(() => {});
      await tx.wTSpeakerLock.deleteMany({ where: { speakerId: id } }).catch(() => {});
      await tx.wTTalkHistory.deleteMany({ where: { speakerId: id } }).catch(() => {});
      await tx.wTContact.deleteMany({
        where: { OR: [{ userId: id }, { contactUserId: id }] }
      }).catch(() => {});

      // 6. Delete user
      await tx.user.delete({ where: { id } });
    });

    return apiResponse(null, 'User deleted successfully');
  } catch (error: any) {
    console.error('Delete User Error:', error);
    if (error.code === 'P2003') {
      return apiError(new Error('Cannot delete user as they have associated records. Please block them instead.'), 400);
    }
    return apiError(error);
  }
}
