import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiError, apiResponse } from '@/lib/api-utils';
import { getSession } from '@/lib/session';

// PATCH — update a single entry status, days adjustment, OR mark all as processed
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.organizationId) return apiError(new Error('Unauthorized'), 401);

    const { id } = await context.params;
    const body = await request.json();

    // Bulk update: processAll = true → all PENDING → PROCESSED
    if (body.processAll) {
      await (prisma as any).payrollRunEntry.updateMany({
        where: { payrollRunId: id, status: 'PENDING' },
        data:  { status: 'PROCESSED' },
      });
      const run = await (prisma as any).payrollRun.findFirst({
        where: { id },
        include: { entries: { orderBy: { staffName: 'asc' } } },
      });
      return apiResponse(run, 'All salaries processed');
    }

    // Single entry update (status change or manual attendance adjustment)
    if (body.entryId) {
      const updateData: any = {};

      if (body.status) {
        const validStatuses = ['PENDING', 'PROCESSED', 'PAID'];
        if (!validStatuses.includes(body.status)) {
          return apiError(new Error('Invalid status'), 400);
        }
        updateData.status = body.status;
      }

      // If manager manually adjusts attendance days
      if (typeof body.presentDays === 'number' || typeof body.leaveDays === 'number' || typeof body.absentDays === 'number') {
        const currentEntry = await (prisma as any).payrollRunEntry.findFirst({ where: { id: body.entryId } });
        if (!currentEntry) return apiError(new Error('Entry not found'), 404);

        const workingDays = currentEntry.workingDays || 26;
        const presentDays = typeof body.presentDays === 'number' ? body.presentDays : currentEntry.presentDays;
        const leaveDays   = typeof body.leaveDays === 'number' ? body.leaveDays : currentEntry.leaveDays;
        const absentDays  = typeof body.absentDays === 'number' ? body.absentDays : Math.max(0, workingDays - presentDays - leaveDays);
        const paidDays    = Math.min(workingDays, Math.max(0, presentDays + leaveDays));

        const dailyRate = workingDays > 0 ? currentEntry.basicSalary / workingDays : 0;
        const deductions = Math.round(absentDays * dailyRate);
        const netSalary = Math.max(0, Math.round(currentEntry.basicSalary - deductions));

        updateData.presentDays = presentDays;
        updateData.leaveDays   = leaveDays;
        updateData.absentDays  = absentDays;
        updateData.paidDays    = paidDays;
        updateData.deductions  = deductions;
        updateData.netSalary   = netSalary;
      }

      const entry = await (prisma as any).payrollRunEntry.update({
        where: { id: body.entryId },
        data:  updateData,
      });

      // Recalculate run totalNet
      const allEntries = await (prisma as any).payrollRunEntry.findMany({
        where: { payrollRunId: id },
        select: { netSalary: true },
      });
      const totalNet = allEntries.reduce((s: number, e: any) => s + e.netSalary, 0);
      await (prisma as any).payrollRun.update({
        where: { id },
        data:  { totalNet },
      });

      return apiResponse(entry, 'Entry updated');
    }

    return apiError(new Error('Invalid request body'), 400);
  } catch (err) {
    return apiError(err);
  }
}
