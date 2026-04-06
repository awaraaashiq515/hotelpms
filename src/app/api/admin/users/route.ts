import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';
import { getSession } from '@/lib/session';
import bcrypt from 'bcryptjs';

// GET all users (Super Admin / Admin Only)
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== 'SUPER_ADMIN' && session.role !== 'RESTAURANTS_ADMIN')) {
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
      },
      orderBy: { createdAt: 'desc' },
    });

    // Remove password hashes and calculate total sales
    const safeUsers = users.map(({ passwordHash, ...user }) => ({
      ...user,
      totalSales: ((user as any).servedOrders || []).reduce((sum: number, b: any) => sum + (b.grandTotal || 0), 0),
    }));

    return apiResponse(safeUsers, 'Users fetched successfully');
  } catch (error) {
    return apiError(error);
  }
}

// POST Create new User
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== 'SUPER_ADMIN' && session.role !== 'RESTAURANTS_ADMIN')) {
      return apiError(new Error('Unauthorized'), 401);
    }

    const body = await request.json();
    const { fullName, email, password, roleName, propertyId } = body;

    // Validation
    if (!fullName || !email || !password || !roleName) {
      return apiError(new Error('Missing required fields: fullName, email, password, roleName'), 400);
    }

    // Security: Regular Admins cannot create Super Admins
    if (session.role !== 'SUPER_ADMIN' && roleName === 'SUPER_ADMIN') {
      return apiError(new Error('You do not have permission to create a Super Admin'), 403);
    }

    // Check if user already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return apiError(new Error('User with this email already exists'), 400);

    // Look up role
    const role = await prisma.role.findUnique({ where: { name: roleName } });
    if (!role) return apiError(new Error(`Role '${roleName}' not found`), 400);

    const passwordHash = await bcrypt.hash(password, 10);

    // CRITICAL: Multi-Tenant Isolation Logic
    // If a Super Admin is creating a new ADMIN, we create a fresh ORGANIZATION for them.
    // Otherwise, they stay in the creator's organization.
    let targetOrgId = session.organizationId;
    
    if (session.role === 'SUPER_ADMIN' && roleName === 'RESTAURANTS_ADMIN') {
      const newOrg = await prisma.organization.create({
        data: {
          name: `${fullName}'s Business`,
        }
      });
      targetOrgId = newOrg.id;
    }

    const newUser = await prisma.user.create({
      data: {
        fullName,
        email,
        passwordHash,
        organizationId: targetOrgId as string,
        propertyId: propertyId || null,
        roleId: role.id,
        isActive: true,
        onboardingCompleted: true, // Bypass onboarding for provisioned users
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
    if (!session || (session.role !== 'SUPER_ADMIN' && session.role !== 'RESTAURANTS_ADMIN')) {
      return apiError(new Error('Unauthorized'), 401);
    }

    const body = await request.json();
    const { userId, isActive } = body;

    if (!userId) return apiError(new Error('Missing userId'), 400);

    // Security: Regular Admins cannot modify Super Admins
    if (session.role !== 'SUPER_ADMIN') {
      const targetUser = await prisma.user.findUnique({ 
        where: { id: userId }, 
        include: { role: true } 
      });
      if (targetUser?.role?.name === 'SUPER_ADMIN') {
        return apiError(new Error('You do not have permission to modify a Super Admin'), 403);
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
    if (!session || (session.role !== 'SUPER_ADMIN' && session.role !== 'RESTAURANTS_ADMIN')) {
      return apiError(new Error('Unauthorized'), 401);
    }

    const body = await request.json();
    const { id, fullName, email, password, roleName, propertyId } = body;

    if (!id || !fullName || !email || !roleName) {
      return apiError(new Error('Missing required fields: id, fullName, email, roleName'), 400);
    }

    // Security: Regular Admins cannot modify Super Admins or promote/demote anyone to/from Super Admin
    if (session.role !== 'SUPER_ADMIN') {
      const targetUser = await prisma.user.findUnique({ 
        where: { id }, 
        include: { role: true } 
      });
      if (targetUser?.role?.name === 'SUPER_ADMIN' || roleName === 'SUPER_ADMIN') {
        return apiError(new Error('You do not have permission for this role action'), 403);
      }
    }

    const role = await prisma.role.findUnique({ where: { name: roleName } });
    if (!role) return apiError(new Error(`Role '${roleName}' not found`), 400);

    const dataToUpdate: any = {
      fullName,
      email,
      roleId: role.id,
      propertyId: propertyId || null,
    };

    if (password) {
      dataToUpdate.passwordHash = await bcrypt.hash(password, 10);
    }

    const existing = await prisma.user.findUnique({ where: { id } });
    if (existing && existing.email !== email) {
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
    if (!session || (session.role !== 'SUPER_ADMIN' && session.role !== 'RESTAURANTS_ADMIN')) {
      return apiError(new Error('Unauthorized'), 401);
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return apiError(new Error('Missing user id'), 400);

    if (id === session.id) {
      return apiError(new Error('Cannot delete your own account'), 400);
    }

    // Security: Regular Admins cannot delete Super Admins
    if (session.role !== 'SUPER_ADMIN') {
      const targetUser = await prisma.user.findUnique({ 
        where: { id }, 
        include: { role: true } 
      });
      if (targetUser?.role?.name === 'SUPER_ADMIN') {
        return apiError(new Error('You do not have permission to delete a Super Admin'), 403);
      }
    }

    await prisma.user.delete({
      where: { id },
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
