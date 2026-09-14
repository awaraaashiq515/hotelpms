import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiError, apiResponse, getMultiTenantWhere } from '@/lib/api-utils';
import { getSession } from '@/lib/session';

// ─── Payroll calc helpers ────────────────────────────────────────────────────
const HRA_RATE       = 0.20;
const CONVEYANCE     = 1600;
const PF_RATE        = 0.12;
const ESI_RATE       = 0.0075;
const TDS_MULT       = 0.30;
const WORKING_DAYS   = 26;

export function calcPayroll(
  basic: number,
  structure: 'FLAT' | 'STATUTORY' = 'FLAT',
  days: { workingDays: number; paidDays: number; absentDays: number } = { workingDays: 26, paidDays: 26, absentDays: 0 }
) {
  const dailyRate = days.workingDays > 0 ? basic / days.workingDays : 0;
  const absenceDeduction = Math.round(days.absentDays * dailyRate);

  if (structure === 'STATUTORY') {
    const hra             = Math.round(basic * HRA_RATE);
    const otherAllowances = Math.round(basic * 0.06);
    const grossSalary     = basic + hra + CONVEYANCE + otherAllowances;
    const pf              = Math.round(basic * PF_RATE);
    const esi             = Math.round(grossSalary * ESI_RATE);
    const tds             = Math.round((pf + esi) * TDS_MULT);
    const statutoryDeductions = pf + esi + tds;
    const totalDeductions = statutoryDeductions + absenceDeduction;
    const netSalary       = Math.max(0, grossSalary - totalDeductions);
    return { grossSalary, deductions: totalDeductions, netSalary, absenceDeduction };
  }

  // FLAT / SIMPLE (Standard for hotels & restaurants)
  const netSalary = Math.max(0, basic - absenceDeduction);
  return {
    grossSalary: basic,
    deductions:  absenceDeduction,
    netSalary,
    absenceDeduction,
  };
}

// GET — fetch payroll run for month/year (creates DRAFT if not exists)
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.organizationId) return apiError(new Error('Unauthorized'), 401);

    const { searchParams } = new URL(request.url);
    const propertyIdParam = searchParams.get('propertyId');
    const propertyId = propertyIdParam || session.propertyId;
    if (!propertyId) return apiError(new Error('Property ID required'), 400);

    const now   = new Date();
    const month = parseInt(searchParams.get('month') || String(now.getMonth() + 1));
    const year  = parseInt(searchParams.get('year')  || String(now.getFullYear()));
    const structure = (searchParams.get('structure') === 'STATUTORY' ? 'STATUTORY' : 'FLAT') as 'FLAT' | 'STATUTORY';
    const forceRecalc = searchParams.get('recalc') === 'true' || searchParams.get('reset') === '1';

    // Month date boundaries
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd   = new Date(year, month, 0, 23, 59, 59, 999);

    // History mode — just return all runs
    if (searchParams.get('history') === '1') {
      const runs = await (prisma as any).payrollRun.findMany({
        where: { propertyId },
        orderBy: [{ year: 'desc' }, { month: 'desc' }],
        include: { entries: true },
      });
      return apiResponse(runs, 'Payroll history fetched');
    }

    // Try to find existing run
    let run = await (prisma as any).payrollRun.findFirst({
      where: { propertyId, month, year },
      include: { entries: { orderBy: { staffName: 'asc' } } },
    });

    // Helper to calculate days for staff based on real attendance & leaves
    async function getStaffDaysMap() {
      const [attendances, leaves] = await Promise.all([
        (prisma as any).attendance.findMany({
          where: {
            propertyId,
            clockIn: { gte: monthStart, lte: monthEnd },
          },
        }),
        (prisma as any).leaveRequest.findMany({
          where: {
            propertyId,
            status: 'APPROVED',
            fromDate: { lte: monthEnd },
            toDate:   { gte: monthStart },
          },
        }),
      ]);

      const hasAttendanceRecords = attendances.length > 0;

      return (staffId: string) => {
        const staffAtt = attendances.filter((a: any) => a.staffMemberId === staffId);
        const staffLeaves = leaves.filter((l: any) => l.staffId === staffId);
        const actualLeaves = staffLeaves.reduce((acc: number, l: any) => acc + (l.days || 1), 0);

        if (hasAttendanceRecords) {
          const actualPresent = staffAtt.filter((a: any) => a.status === 'PRESENT' || a.status === 'LATE').length;
          const presentDays   = Math.min(WORKING_DAYS, actualPresent);
          const leaveDays     = Math.min(Math.max(0, WORKING_DAYS - presentDays), actualLeaves);
          const absentDays    = Math.max(0, WORKING_DAYS - presentDays - leaveDays);
          const paidDays      = Math.min(WORKING_DAYS, presentDays + leaveDays);
          return { workingDays: WORKING_DAYS, presentDays, leaveDays, absentDays, paidDays };
        } else {
          // If no check-ins tracked yet, default to full month or deducted only by approved leaves
          const leaveDays   = Math.min(WORKING_DAYS, actualLeaves);
          const presentDays = WORKING_DAYS - leaveDays;
          const absentDays  = 0;
          const paidDays    = WORKING_DAYS; // paid leave included in full salary
          return { workingDays: WORKING_DAYS, presentDays, leaveDays, absentDays, paidDays };
        }
      };
    }

    // If force recalc requested or DRAFT run exists with old formula
    if (run && (forceRecalc || (structure === 'FLAT' && run.entries.some((e: any) => e.grossSalary > e.basicSalary)))) {
      const getDaysForStaff = await getStaffDaysMap();
      const staff = await (prisma as any).staffMember.findMany({
        where: { propertyId, isActive: true, salary: { gt: 0 } },
        select: { id: true, name: true, designation: true, salary: true },
      });

      const staffMap = new Map<string, any>(staff.map((s: any) => [s.id, s]));

      for (const entry of run.entries) {
        const staffObj = staffMap.get(entry.staffId);
        const basic = staffObj ? Math.round(staffObj.salary) : entry.basicSalary;
        const dayStats = getDaysForStaff(entry.staffId);
        const { grossSalary, deductions, netSalary } = calcPayroll(basic, structure, dayStats);

        await (prisma as any).payrollRunEntry.update({
          where: { id: entry.id },
          data: {
            basicSalary: basic,
            grossSalary,
            deductions,
            netSalary,
            workingDays: dayStats.workingDays,
            presentDays: dayStats.presentDays,
            leaveDays:   dayStats.leaveDays,
            absentDays:  dayStats.absentDays,
            paidDays:    dayStats.paidDays,
          },
        });
      }

      // Reload fresh run
      run = await (prisma as any).payrollRun.findFirst({
        where: { id: run.id },
        include: { entries: { orderBy: { staffName: 'asc' } } },
      });

      const totalNet = run.entries.reduce((s: number, e: any) => s + e.netSalary, 0);
      await (prisma as any).payrollRun.update({
        where: { id: run.id },
        data: { totalNet },
      });
      run.totalNet = totalNet;
    }

    if (!run) {
      // Create DRAFT from current staff with real attendance & leave calculations
      const staff = await (prisma as any).staffMember.findMany({
        where: { propertyId, isActive: true, salary: { gt: 0 } },
        select: { id: true, name: true, designation: true, salary: true },
      });

      if (staff.length === 0) {
        return apiResponse(null, 'No staff with salary configured');
      }

      const getDaysForStaff = await getStaffDaysMap();

      const entries = staff.map((s: any) => {
        const basic = Math.round(s.salary);
        const dayStats = getDaysForStaff(s.id);
        const { grossSalary, deductions, netSalary } = calcPayroll(basic, structure, dayStats);

        return {
          staffId:     s.id,
          staffName:   s.name,
          designation: s.designation || 'Staff',
          basicSalary: basic,
          grossSalary,
          deductions,
          netSalary,
          workingDays: dayStats.workingDays,
          presentDays: dayStats.presentDays,
          leaveDays:   dayStats.leaveDays,
          absentDays:  dayStats.absentDays,
          paidDays:    dayStats.paidDays,
          status:      'PENDING',
        };
      });

      const totalNet = entries.reduce((s: number, e: any) => s + e.netSalary, 0);

      run = await (prisma as any).payrollRun.create({
        data: {
          propertyId,
          month,
          year,
          status:   'DRAFT',
          totalNet,
          entries:  { create: entries },
        },
        include: { entries: { orderBy: { staffName: 'asc' } } },
      });
    }

    return apiResponse(run, 'Payroll run fetched');
  } catch (err) {
    return apiError(err);
  }
}
