import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';
import { getSession } from '@/lib/session';

/**
 * GET /api/staff-table-assignments
 * Returns all active tables and staff members with their table assignments.
 */
export async function GET(_request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.propertyId) {
      return apiError(new Error('Unauthorized'), 401);
    }

    const propertyId = session.propertyId;

    // Fetch all active staff users for this property
    const staff = await prisma.user.findMany({
      where: { propertyId, isActive: true },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: {
          select: { name: true }
        },
        tableAssignments: {
          select: { tableId: true }
        }
      },
      orderBy: { fullName: 'asc' }
    });

    // Format staff list to include simple assignedTableIds array
    const formattedStaff = staff.map((s: any) => ({
      id: s.id,
      fullName: s.fullName,
      email: s.email,
      role: s.role?.name || 'Staff',
      assignedTableIds: s.tableAssignments.map((ta: any) => ta.tableId)
    }));

    // Fetch all tables for this property grouped by floor
    const tables = await prisma.table.findMany({
      where: { propertyId },
      select: {
        id: true,
        name: true,
        floor: {
          select: { id: true, name: true }
        }
      },
      orderBy: [
        { floor: { name: 'asc' } },
        { name: 'asc' }
      ]
    });

    return apiResponse({
      staff: formattedStaff,
      tables: tables
    }, 'Staff table assignments and tables fetched successfully');
  } catch (error) {
    return apiError(error);
  }
}

/**
 * POST /api/staff-table-assignments
 * Replaces a staff member's table assignments with a new set.
 * Body: { userId: string, tableIds: string[] }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.propertyId) {
      return apiError(new Error('Unauthorized'), 401);
    }

    const propertyId = session.propertyId;
    const body = await request.json();
    const { userId, tableIds } = body;

    if (!userId || !Array.isArray(tableIds)) {
      return apiError(new Error('Missing userId or tableIds array'), 400);
    }

    // Verify user exists and belongs to this property
    const user = await prisma.user.findFirst({
      where: { id: userId, propertyId }
    });

    if (!user) {
      return apiError(new Error('User not found or belongs to another property'), 404);
    }

    // Perform database transaction to replace assignments
    await prisma.$transaction(async (tx: any) => {
      // 1. Delete all existing table assignments for this staff user
      await tx.tableAssignment.deleteMany({
        where: {
          userId,
          propertyId
        }
      });

      // 2. Insert new table assignments
      if (tableIds.length > 0) {
        await tx.tableAssignment.createMany({
          data: tableIds.map(tableId => ({
            userId,
            tableId,
            propertyId
          }))
        });
      }
    });

    return apiResponse({ success: true }, 'Table assignments updated successfully');
  } catch (error) {
    return apiError(error);
  }
}
