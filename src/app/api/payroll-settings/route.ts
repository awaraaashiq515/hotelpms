import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiError, apiResponse } from '@/lib/api-utils';
import { getSession } from '@/lib/session';

// GET — fetch payroll settings for the property
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.organizationId) return apiError(new Error('Unauthorized'), 401);

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId') || session.propertyId;
    if (!propertyId) return apiError(new Error('Property ID required'), 400);

    let setting = await (prisma as any).payrollSetting.findUnique({
      where: { propertyId },
    });

    if (!setting) {
      setting = await (prisma as any).payrollSetting.create({
        data: {
          propertyId,
          salaryDisbursementDay: 7,
          standardWorkingDays:   26,
          defaultPaidLeaves:     2,
          defaultStructure:      'FLAT',
          enableHra:             false,
          hraPercentage:         20.0,
          enablePf:              false,
          pfPercentage:          12.0,
          enableEsi:             false,
          esiPercentage:         0.75,
          enableTds:             false,
          enableOvertime:        false,
          overtimeHourlyRate:    100.0,
          authorizedSignatory:   'Hotel General Manager',
          currency:              'INR',
        },
      });
    }

    return apiResponse(setting, 'Payroll settings fetched successfully');
  } catch (err) {
    return apiError(err);
  }
}

// POST / PUT — update payroll settings for the property
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.organizationId) return apiError(new Error('Unauthorized'), 401);

    const body = await request.json();
    const propertyId = body.propertyId || session.propertyId;
    if (!propertyId) return apiError(new Error('Property ID required'), 400);

    const data: any = {};
    if (typeof body.salaryDisbursementDay === 'number') data.salaryDisbursementDay = Math.max(1, Math.min(31, body.salaryDisbursementDay));
    if (typeof body.standardWorkingDays === 'number')   data.standardWorkingDays   = Math.max(1, Math.min(31, body.standardWorkingDays));
    if (typeof body.defaultPaidLeaves === 'number')     data.defaultPaidLeaves     = Math.max(0, Math.min(31, body.defaultPaidLeaves));
    if (body.defaultStructure)                         data.defaultStructure      = ['FLAT', 'STATUTORY'].includes(body.defaultStructure) ? body.defaultStructure : 'FLAT';
    if (typeof body.enableHra === 'boolean')           data.enableHra             = body.enableHra;
    if (typeof body.hraPercentage === 'number')        data.hraPercentage         = body.hraPercentage;
    if (typeof body.enablePf === 'boolean')            data.enablePf              = body.enablePf;
    if (typeof body.pfPercentage === 'number')         data.pfPercentage          = body.pfPercentage;
    if (typeof body.enableEsi === 'boolean')           data.enableEsi             = body.enableEsi;
    if (typeof body.esiPercentage === 'number')        data.esiPercentage         = body.esiPercentage;
    if (typeof body.enableTds === 'boolean')           data.enableTds             = body.enableTds;
    if (typeof body.enableOvertime === 'boolean')      data.enableOvertime        = body.enableOvertime;
    if (typeof body.overtimeHourlyRate === 'number')   data.overtimeHourlyRate    = body.overtimeHourlyRate;
    if (typeof body.authorizedSignatory === 'string')  data.authorizedSignatory   = body.authorizedSignatory.trim();
    if (typeof body.currency === 'string')             data.currency              = body.currency.trim();

    const setting = await (prisma as any).payrollSetting.upsert({
      where: { propertyId },
      update: data,
      create: {
        propertyId,
        ...data,
      },
    });

    return apiResponse(setting, 'Payroll settings saved successfully');
  } catch (err) {
    return apiError(err);
  }
}
