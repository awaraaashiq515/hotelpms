import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError, resolveAdminProperty } from '@/lib/api-utils';
import { getSession } from '@/lib/session';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    const { searchParams } = new URL(request.url);
    const propertyIdParam = searchParams.get('propertyId');
    const propertyId = propertyIdParam || session?.propertyId || (session ? await resolveAdminProperty(session, prisma) : null);

    let passes = await prisma.poolPassCategory.findMany({
      where: propertyId ? {
        OR: [
          { propertyId },
          { propertyId: null },
          { propertyId: '' }
        ]
      } : {},
      orderBy: { price: 'asc' },
    });

    if (passes.length === 0) {
      passes = await prisma.poolPassCategory.findMany({
        orderBy: { price: 'asc' },
      });
    }

    // If no pool passes exist at all in DB, seed defaults
    if (passes.length === 0) {
      const defaults = [
        {
          propertyId,
          name: 'Complimentary / Free Pool Access',
          category: 'COMPLIMENTARY',
          price: 0,
          duration: 'Free / Stay',
          capacity: 1,
          description: 'Complimentary pool access included with stay or meal plan.',
          includes: 'Pool Access, Towels, Loungers, Lockers',
          isActive: true,
        },
        {
          propertyId,
          name: 'Standard Swimming Pool Pass',
          category: 'STANDARD',
          price: 500,
          duration: 'Full Day',
          capacity: 1,
          description: 'Access to main swimming pool, poolside loungers, and locker room facilities.',
          includes: 'Locker, Clean Towel, Pool Access, Shower Room',
          isActive: true,
        },
        {
          propertyId,
          name: 'All-Day VIP Cabana Pass',
          category: 'VIP_CABANA',
          price: 1200,
          duration: 'Full Day',
          capacity: 2,
          description: 'Reserved private poolside cabana with cushioned sunbeds, premium towel service, and welcome drinks.',
          includes: 'Private Cabana, Sunbeds, Welcome Drinks, Premium Towels, Dedicated Server',
          isActive: true,
        },
        {
          propertyId,
          name: 'Family Pool & Fun Pass',
          category: 'FAMILY_PASS',
          price: 1800,
          duration: 'Full Day',
          capacity: 4,
          description: 'Group pass for up to 2 adults and 2 kids with complimentary pool floats, snacks, and juices.',
          includes: '4 Pool Passes, Pool Floats & Toys, Welcome Juices, Fruit Basket, Lockers',
          isActive: true,
        },
        {
          propertyId,
          name: 'Sunset Cocktail & Jacuzzi Pass',
          category: 'SUNSET_PASS',
          price: 1500,
          duration: 'Evening (4 PM - 9 PM)',
          capacity: 2,
          description: 'Evening access to heated infinity pool and jacuzzi with complimentary signature cocktails.',
          includes: 'Heated Jacuzzi Access, 2 Signature Poolside Cocktails, Evening DJ Lounge Access',
          isActive: true,
        },
      ];

      await prisma.poolPassCategory.createMany({ data: defaults });

      passes = await prisma.poolPassCategory.findMany({
        where: propertyId ? { propertyId } : {},
        orderBy: { price: 'asc' },
      });
    }

    return apiResponse(passes);
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const body = await request.json();
    const propertyId = body.propertyId || session.propertyId || await resolveAdminProperty(session, prisma);

    const {
      name,
      category = 'STANDARD',
      price = 500,
      duration = 'Full Day',
      capacity = 1,
      description = '',
      includes = '',
      isActive = true,
    } = body;

    if (!name) {
      return apiError(new Error('Pool pass category name is required'), 400);
    }

    const newPass = await prisma.poolPassCategory.create({
      data: {
        propertyId,
        name,
        category,
        price: Number(price),
        duration,
        capacity: Number(capacity),
        description,
        includes,
        isActive: Boolean(isActive),
      },
    });

    return apiResponse(newPass, 'Pool Pass Category created successfully', 201);
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const body = await request.json();
    const { id, name, category, price, duration, capacity, description, includes, isActive } = body;

    if (!id) {
      return apiError(new Error('Pool Pass ID is required'), 400);
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (category !== undefined) updateData.category = category;
    if (price !== undefined) updateData.price = Number(price);
    if (duration !== undefined) updateData.duration = duration;
    if (capacity !== undefined) updateData.capacity = Number(capacity);
    if (description !== undefined) updateData.description = description;
    if (includes !== undefined) updateData.includes = includes;
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);

    const updated = await prisma.poolPassCategory.update({
      where: { id },
      data: updateData,
    });

    return apiResponse(updated, 'Pool Pass Category updated successfully');
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return apiError(new Error('Pool Pass ID is required'), 400);
    }

    await prisma.poolPassCategory.delete({
      where: { id },
    });

    return apiResponse({ id }, 'Pool Pass Category deleted successfully');
  } catch (error) {
    return apiError(error);
  }
}
