import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { apiError, apiResponse } from '@/lib/api-utils';
import { getSession } from '@/lib/session';
import bcrypt from 'bcryptjs';

const staffSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  phone: z.string().optional(),
  designation: z.string().optional(),
  salary: z.number().min(0).optional(),
  address: z.string().optional(),
  emergencyContact: z.string().optional(),
  joiningDate: z.string().optional(),
  isActive: z.boolean().optional(),
  shiftHours: z.number().min(0.1).optional(),
  email: z.string().email().optional().or(z.literal('')),
  password: z.string().min(6).optional().or(z.literal('')),
  propertyId: z.string().optional().or(z.literal('')),
});

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || !session.organizationId) {
      return apiError(new Error('Unauthorized'), 401);
    }

    const { id } = await params;
    const body = await request.json();
    const parsedData = staffSchema.parse(body);

    const staffMember = await prisma.$transaction(async (tx: any) => {
      // Find current staff member to check linked User
      const currentStaff = await tx.staffMember.findUnique({
        where: { id }
      });

      if (!currentStaff) {
        throw new Error('Staff member not found');
      }

      let targetUserId = currentStaff.userId;

      if (parsedData.email) {
        const email = parsedData.email.toLowerCase().trim();

        if (targetUserId) {
          // Check if another user is using this email
          const duplicate = await tx.user.findFirst({
            where: {
              email,
              id: { not: targetUserId }
            }
          });
          if (duplicate) {
            throw new Error(`Email "${email}" is already registered to another staff.`);
          }

          const targetPropertyId = parsedData.propertyId || currentStaff.propertyId;

          // Update existing user details
          const updateData: any = {
            fullName: parsedData.name,
            email,
            phone: parsedData.phone || null,
            isActive: parsedData.isActive !== undefined ? parsedData.isActive : true,
            propertyId: targetPropertyId
          };

          if (parsedData.password) {
            const salt = await bcrypt.genSalt(10);
            updateData.passwordHash = await bcrypt.hash(parsedData.password, salt);
          }

          await tx.user.update({
            where: { id: targetUserId },
            data: updateData
          });
        } else {
          // No linked user, create a new one (password is required here)
          if (!parsedData.password) {
            throw new Error('Password is required when creating credentials for first time.');
          }

          const existingUser = await tx.user.findUnique({ where: { email } });
          if (existingUser) {
            throw new Error(`Email "${email}" is already registered.`);
          }

          const salt = await bcrypt.genSalt(10);
          const passwordHash = await bcrypt.hash(parsedData.password, salt);

          let role = await tx.role.findFirst({
            where: { name: parsedData.designation || 'Waiter' }
          });
          if (!role) {
            role = await tx.role.findFirst({ where: { name: 'Staff' } });
          }
          if (!role) {
            role = await tx.role.create({
              data: { name: 'Staff', description: 'System Staff' }
            });
          }

          const targetPropertyId = parsedData.propertyId || currentStaff.propertyId;
          const newUser = await tx.user.create({
            data: {
              organizationId: session.organizationId,
              propertyId: targetPropertyId,
              roleId: role.id,
              fullName: parsedData.name,
              email,
              phone: parsedData.phone || null,
              passwordHash,
              isActive: parsedData.isActive !== undefined ? parsedData.isActive : true
            }
          });

          targetUserId = newUser.id;
        }
      } else if (targetUserId) {
        // If email was cleared, remove the associated user login
        await tx.user.delete({
          where: { id: targetUserId }
        });
        targetUserId = null;
      }

      const targetPropertyId = parsedData.propertyId || currentStaff.propertyId;
      return await tx.staffMember.update({
        where: { id },
        data: {
          name: parsedData.name,
          phone: parsedData.phone || null,
          designation: parsedData.designation || 'Waiter',
          salary: parsedData.salary || 0,
          address: parsedData.address || null,
          emergencyContact: parsedData.emergencyContact || null,
          joiningDate: parsedData.joiningDate ? new Date(parsedData.joiningDate) : undefined,
          isActive: parsedData.isActive !== undefined ? parsedData.isActive : true,
          shiftHours: parsedData.shiftHours !== undefined ? Number(parsedData.shiftHours) : undefined,
          propertyId: targetPropertyId,
          userId: targetUserId
        },
        include: {
          user: {
            select: {
              email: true
            }
          }
        }
      });
    });

    return apiResponse(staffMember, 'Staff member updated successfully');
  } catch (error: any) {
    return apiError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || !session.organizationId) {
      return apiError(new Error('Unauthorized'), 401);
    }

    const { id } = await params;

    await prisma.$transaction(async (tx: any) => {
      const staffMember = await tx.staffMember.findUnique({
        where: { id },
        select: { userId: true }
      });

      if (staffMember) {
        // Delete staff member first
        await tx.staffMember.delete({
          where: { id }
        });

        // Delete associated user if exists
        if (staffMember.userId) {
          await tx.user.delete({
            where: { id: staffMember.userId }
          });
        }
      }
    });

    return apiResponse(null, 'Staff member deleted successfully');
  } catch (error) {
    return apiError(error);
  }
}
