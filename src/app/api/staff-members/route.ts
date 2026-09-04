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
  email: z.string().email().optional().or(z.literal('')),
  password: z.string().min(6).optional().or(z.literal('')),
  propertyId: z.string().optional().or(z.literal('')),
  upiId: z.string().optional().or(z.literal('')),
  upiName: z.string().optional().or(z.literal('')),
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
            email: true,
            role: { select: { name: true } },
          }
        },
        property: {
          select: { id: true, name: true, code: true }
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

      if (parsedData.email && parsedData.password) {
        const email = parsedData.email.toLowerCase().trim();
        
        // Check duplicate email
        const existingUser = await tx.user.findUnique({ where: { email } });
        if (existingUser) {
          throw new Error(`Email "${email}" is already registered.`);
        }

        // Hashing password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(parsedData.password, salt);

        // Get appropriate role — match designation name first, then fallback
        const targetDesignation = parsedData.designation || 'Waiter';
        let role = await tx.role.findFirst({
          where: { name: targetDesignation }
        });
        if (!role) {
          // Create the role with the designation name so it persists
          role = await tx.role.create({
            data: { name: targetDesignation, description: `${targetDesignation} role (auto-created)` }
          });
        }

        const targetPropertyId = parsedData.propertyId || session.propertyId!;
        const newUser = await tx.user.create({
          data: {
            organizationId: session.organizationId,
            propertyId: targetPropertyId,
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

      const targetPropertyId = parsedData.propertyId || session.propertyId!;
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
          propertyId: targetPropertyId,
          userId: createdUserId,
          upiId: parsedData.upiId || null,
          upiName: parsedData.upiName || null,
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
