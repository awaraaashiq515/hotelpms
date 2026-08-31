import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError, getMultiTenantWhere, resolveAdminProperty } from '@/lib/api-utils';
import { getSession } from '@/lib/session';

// GET /api/hotel/revenue/pricing-rules - Fetch all pricing rules for property
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const { searchParams } = new URL(request.url);
    const propertyIdParam = searchParams.get('propertyId');
    const where = getMultiTenantWhere(session, propertyIdParam);

    let propertyId = propertyIdParam || session.propertyId;
    if (!propertyId && session.role === 'RESTAURANTS_ADMIN') {
      propertyId = await resolveAdminProperty(session, prisma);
    }

    if (!propertyId && where.propertyId) {
      propertyId = where.propertyId;
    }

    let rules: any[] = [];
    if (propertyId && propertyId !== 'all') {
      rules = await prisma.dynamicPricingRule.findMany({
        where: { propertyId },
        orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
      });

      // Seed default rules if none exist for this property
      if (rules.length === 0) {
        const defaultRules = [
          {
            propertyId,
            name: 'Weekend Surge',
            ruleType: 'DAY_OF_WEEK',
            condition: 'Fri, Sat, Sun',
            adjustment: 20,
            adjustmentType: 'PERCENTAGE',
            roomTypeName: 'All',
            isActive: true,
            priority: 1,
            description: 'Automated 20% rate increase on peak weekend nights',
          },
          {
            propertyId,
            name: 'High Occupancy Surge',
            ruleType: 'OCCUPANCY',
            condition: 'Occ > 80%',
            adjustment: 15,
            adjustmentType: 'PERCENTAGE',
            roomTypeName: 'All',
            isActive: true,
            priority: 2,
            description: 'Increase rates by 15% when property occupancy exceeds 80%',
          },
          {
            propertyId,
            name: 'Low Demand Fill',
            ruleType: 'OCCUPANCY',
            condition: 'Occ < 40%',
            adjustment: -10,
            adjustmentType: 'PERCENTAGE',
            roomTypeName: 'All',
            isActive: false,
            priority: 3,
            description: '10% discount stimulation when occupancy is below 40%',
          },
          {
            propertyId,
            name: 'Last-Minute Booking',
            ruleType: 'LEAD_TIME',
            condition: '< 24 hrs',
            adjustment: -15,
            adjustmentType: 'PERCENTAGE',
            roomTypeName: 'All',
            isActive: true,
            priority: 4,
            description: 'Encourage same-day conversions with 15% flash rate',
          },
          {
            propertyId,
            name: 'Festival & Holiday Demand',
            ruleType: 'EVENT',
            condition: 'Diwali / New Year',
            adjustment: 35,
            adjustmentType: 'PERCENTAGE',
            roomTypeName: 'All',
            isActive: true,
            priority: 5,
            description: 'Festival season premium surcharge',
          },
        ];

        await prisma.dynamicPricingRule.createMany({
          data: defaultRules,
        });

        rules = await prisma.dynamicPricingRule.findMany({
          where: { propertyId },
          orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
        });
      }
    } else {
      rules = await prisma.dynamicPricingRule.findMany({
        where,
        orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
      });
    }

    return apiResponse(rules);
  } catch (error) {
    return apiError(error);
  }
}

// POST /api/hotel/revenue/pricing-rules - Create dynamic pricing rule
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const body = await request.json();
    let propertyId = body.propertyId || session.propertyId;

    if (!propertyId && session.role === 'RESTAURANTS_ADMIN') {
      propertyId = await resolveAdminProperty(session, prisma);
    }

    if (!propertyId) {
      // Find first property of organization
      if (session.organizationId) {
        const firstProp = await prisma.property.findFirst({
          where: { organizationId: session.organizationId },
          select: { id: true },
        });
        propertyId = firstProp?.id;
      }
    }

    if (!propertyId) return apiError(new Error('Property ID is required'), 400);

    const {
      name,
      ruleType,
      condition,
      adjustment,
      adjustmentType = 'PERCENTAGE',
      roomTypeId = null,
      roomTypeName = 'All',
      isActive = true,
      priority = 1,
      minRate = null,
      maxRate = null,
      startDate = null,
      endDate = null,
      description = null,
    } = body;

    if (!name || !condition || adjustment === undefined) {
      return apiError(new Error('Name, condition, and adjustment are required'), 400);
    }

    const createdRule = await prisma.dynamicPricingRule.create({
      data: {
        propertyId,
        name,
        ruleType: ruleType || 'OCCUPANCY',
        condition,
        adjustment: Number(adjustment),
        adjustmentType,
        roomTypeId,
        roomTypeName: roomTypeName || 'All',
        isActive: Boolean(isActive),
        priority: Number(priority) || 1,
        minRate: minRate ? Number(minRate) : null,
        maxRate: maxRate ? Number(maxRate) : null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        description,
      },
    });

    return apiResponse(createdRule, 'Dynamic pricing rule created successfully', 201);
  } catch (error) {
    return apiError(error);
  }
}

// PUT /api/hotel/revenue/pricing-rules - Update or toggle rule
export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) return apiError(new Error('Rule ID is required'), 400);

    const dataToUpdate: any = {};
    if (updateData.name !== undefined) dataToUpdate.name = updateData.name;
    if (updateData.ruleType !== undefined) dataToUpdate.ruleType = updateData.ruleType;
    if (updateData.condition !== undefined) dataToUpdate.condition = updateData.condition;
    if (updateData.adjustment !== undefined) dataToUpdate.adjustment = Number(updateData.adjustment);
    if (updateData.adjustmentType !== undefined) dataToUpdate.adjustmentType = updateData.adjustmentType;
    if (updateData.roomTypeId !== undefined) dataToUpdate.roomTypeId = updateData.roomTypeId;
    if (updateData.roomTypeName !== undefined) dataToUpdate.roomTypeName = updateData.roomTypeName;
    if (updateData.isActive !== undefined) dataToUpdate.isActive = Boolean(updateData.isActive);
    if (updateData.priority !== undefined) dataToUpdate.priority = Number(updateData.priority);
    if (updateData.minRate !== undefined) dataToUpdate.minRate = updateData.minRate ? Number(updateData.minRate) : null;
    if (updateData.maxRate !== undefined) dataToUpdate.maxRate = updateData.maxRate ? Number(updateData.maxRate) : null;
    if (updateData.startDate !== undefined) dataToUpdate.startDate = updateData.startDate ? new Date(updateData.startDate) : null;
    if (updateData.endDate !== undefined) dataToUpdate.endDate = updateData.endDate ? new Date(updateData.endDate) : null;
    if (updateData.description !== undefined) dataToUpdate.description = updateData.description;

    const updated = await prisma.dynamicPricingRule.update({
      where: { id },
      data: dataToUpdate,
    });

    return apiResponse(updated, 'Dynamic pricing rule updated successfully');
  } catch (error) {
    return apiError(error);
  }
}

// DELETE /api/hotel/revenue/pricing-rules - Delete a rule
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return apiError(new Error('Rule ID is required'), 400);

    await prisma.dynamicPricingRule.delete({
      where: { id },
    });

    return apiResponse({ id }, 'Rule deleted successfully');
  } catch (error) {
    return apiError(error);
  }
}
