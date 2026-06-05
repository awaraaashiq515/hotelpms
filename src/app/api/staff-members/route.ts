import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { apiError, apiResponse, getMultiTenantWhere } from '@/lib/api-utils';
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
  username: z.string().min(3).optional().or(z.literal('')),
  password: z.string().min(6).optional().or(z.literal('')),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.organizationId) {
      return apiError(new Error('Unauthorized'), 401);
    }

    const { searchParams } = new URL(request.url);
    const propertyIdParam = searchParams.get('propertyId');

    const staffMembers = await (prisma as any).staffMember.findMany({
      where: getMultiTenantWhere(session, propertyIdParam),
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            email: true
          }
        }
      }
    });

    return apiResponse(staffMembers, 'Staff members fetched successfully');
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.organizationId) {
      return apiError(new Error('Unauthorized'), 401);
    }

    const body = await request.json();
    const parsedData = staffSchema.parse(body);

    const staffMember = await prisma.$transaction(async (tx: any) => {
      let createdUserId: string | null = null;

      if (parsedData.username && parsedData.password) {
        const email = `${parsedData.username.toLowerCase()}@pos-staff.local`;
        
        // Check duplicate email/username
        const existingUser = await tx.user.findUnique({ where: { email } });
        if (existingUser) {
          throw new Error(`Username "${parsedData.username}" is already taken.`);
        }

        // Hashing password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(parsedData.password, salt);

        // Get appropriate role
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

        const newUser = await tx.user.create({
          data: {
            organizationId: session.organizationId,
            propertyId: session.propertyId!,
            roleId: role.id,
            fullName: parsedData.name,
            email: email,
            phone: parsedData.phone || null,
            passwordHash: passwordHash,
            isActive: parsedData.isActive !== undefined ? parsedData.isActive : true
          }
        });

        createdUserId = newUser.id;
      }

      return await tx.staffMember.create({
        data: {
          name: parsedData.name,
          phone: parsedData.phone || null,
          designation: parsedData.designation || 'Waiter',
          salary: parsedData.salary || 0,
          address: parsedData.address || null,
          emergencyContact: parsedData.emergencyContact || null,
          joiningDate: parsedData.joiningDate ? new Date(parsedData.joiningDate) : new Date(),
          isActive: parsedData.isActive !== undefined ? parsedData.isActive : true,
          shiftHours: parsedData.shiftHours !== undefined ? Number(parsedData.shiftHours) : 8,
          propertyId: session.propertyId!,
          userId: createdUserId
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

    return apiResponse(staffMember, 'Staff member created successfully', 201);
  } catch (error: any) {
    return apiError(error);
  }
}
