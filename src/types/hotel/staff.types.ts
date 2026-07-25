// ── Staff Types ───────────────────────────────────────────────────
export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY' | 'LEAVE';

export interface StaffMember {
  id: string;
  propertyId: string;
  name: string;
  phone?: string;
  designation?: string;
  salary?: number;
  address?: string;
  joiningDate?: string;
  isActive: boolean;
  shiftHours?: number;
  userId?: string;
}

export interface AttendanceRecord {
  id: string;
  staffMemberId?: string;
  userId?: string;
  propertyId: string;
  clockIn: string;
  clockOut?: string;
  status: AttendanceStatus;
  note?: string;
  hoursWorked?: number;
  staffMember?: { name: string; designation?: string };
}

export interface AttendanceSummary {
  date: string;
  totalStaff: number;
  present: number;
  absent: number;
  late: number;
  onLeave: number;
  attendancePct: number;
}

export interface StaffShift {
  id: string;
  propertyId: string;
  name: string;
  startTime: string;
  endTime: string;
  staffCount: number;
  date: string;
}
