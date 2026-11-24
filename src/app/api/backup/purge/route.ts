import { NextRequest, NextResponse } from 'next/server';
import * as path from 'path';
import { execSync } from 'child_process';
import { getSession } from '@/lib/session';

const PROJECT_DIR = process.cwd();
const DB_PATH     = path.join(PROJECT_DIR, 'prisma', 'dev.db');

// ── Purgeable data categories with their table + date column ──────────────────
const PURGE_CATEGORIES: Record<string, {
  label: string;
  tables: { table: string; dateCol: string; joinSql?: string }[];
  warning: string;
}> = {
  reservations: {
    label: 'Reservations & Check-ins',
    tables: [
      { table: 'ReservationRoom',  dateCol: 'createdAt', joinSql: `WHERE reservationId IN (SELECT id FROM Reservation WHERE departureDate < '{BEFORE}')` },
      { table: 'GuestDocument',    dateCol: 'createdAt', joinSql: `WHERE reservationId IN (SELECT id FROM Reservation WHERE departureDate < '{BEFORE}')` },
      { table: 'CheckOut',         dateCol: 'createdAt', joinSql: `WHERE checkInId IN (SELECT id FROM CheckIn WHERE createdAt < '{BEFORE}')` },
      { table: 'CheckIn',          dateCol: 'createdAt' },
      { table: 'Folio',            dateCol: 'createdAt' },
      { table: 'FolioTransaction', dateCol: 'createdAt', joinSql: `WHERE folioId IN (SELECT id FROM Folio WHERE createdAt < '{BEFORE}')` },
      { table: 'Reservation',      dateCol: 'departureDate' },
    ],
    warning: 'Deletes all reservation, check-in, folio & guest document records before the selected date.',
  },
  pos_orders: {
    label: 'POS Orders & KOT',
    tables: [
      { table: 'PosOrderItem', dateCol: 'createdAt', joinSql: `WHERE orderId IN (SELECT id FROM PosOrder WHERE createdAt < '{BEFORE}')` },
      { table: 'KotItem',      dateCol: 'createdAt', joinSql: `WHERE kotId IN (SELECT id FROM KotTicket WHERE createdAt < '{BEFORE}')` },
      { table: 'KotStatusLog', dateCol: 'createdAt', joinSql: `WHERE kotId IN (SELECT id FROM KotTicket WHERE createdAt < '{BEFORE}')` },
      { table: 'KotTicket',    dateCol: 'createdAt' },
      { table: 'OrderRating',  dateCol: 'createdAt', joinSql: `WHERE orderId IN (SELECT id FROM PosOrder WHERE createdAt < '{BEFORE}')` },
      { table: 'TipTransaction', dateCol: 'createdAt', joinSql: `WHERE orderId IN (SELECT id FROM PosOrder WHERE createdAt < '{BEFORE}')` },
      { table: 'DiscountApproval', dateCol: 'createdAt', joinSql: `WHERE orderId IN (SELECT id FROM PosOrder WHERE createdAt < '{BEFORE}')` },
      { table: 'PosOrder',     dateCol: 'createdAt' },
    ],
    warning: 'Deletes all POS orders, KOT tickets, ratings and tips before the selected date.',
  },
  invoices: {
    label: 'Invoices & Receipts',
    tables: [
      { table: 'InvoiceItem', dateCol: 'createdAt', joinSql: `WHERE invoiceId IN (SELECT id FROM Invoice WHERE invoiceDate < '{BEFORE}')` },
      { table: 'Receipt',     dateCol: 'receiptDate' },
      { table: 'Payment',     dateCol: 'createdAt' },
      { table: 'Settlement',  dateCol: 'createdAt' },
      { table: 'Invoice',     dateCol: 'invoiceDate' },
    ],
    warning: 'Deletes all invoices, invoice items, receipts, and payments before the selected date.',
  },
  accounting: {
    label: 'Vouchers & Expenses',
    tables: [
      { table: 'VoucherEntry', dateCol: 'createdAt', joinSql: `WHERE voucherId IN (SELECT id FROM Voucher WHERE voucherDate < '{BEFORE}')` },
      { table: 'Voucher',      dateCol: 'voucherDate' },
      { table: 'Expense',      dateCol: 'expenseDate' },
      { table: 'DayClosing',   dateCol: 'closingDate' },
    ],
    warning: 'Deletes accounting vouchers, expenses, and day closing records before the selected date.',
  },
  housekeeping: {
    label: 'Housekeeping Tasks',
    tables: [
      { table: 'HousekeepingTask',  dateCol: 'createdAt' },
      { table: 'MaintenanceTicket', dateCol: 'createdAt' },
      { table: 'LaundryRequest',    dateCol: 'createdAt' },
      { table: 'DailyWashLog',      dateCol: 'createdAt' },
    ],
    warning: 'Deletes housekeeping, maintenance, and laundry records before the selected date.',
  },
  attendance: {
    label: 'Attendance & Shifts',
    tables: [
      { table: 'Attendance',       dateCol: 'createdAt' },
      { table: 'Shift',            dateCol: 'createdAt' },
      { table: 'CashWithdrawal',   dateCol: 'createdAt' },
      { table: 'CashTopUp',        dateCol: 'createdAt' },
      { table: 'StaffLocation',    dateCol: 'createdAt' },
    ],
    warning: 'Deletes staff attendance, shift, and cash transaction records before the selected date.',
  },
  audit_logs: {
    label: 'Audit Logs & Notifications',
    tables: [
      { table: 'AuditLog',          dateCol: 'createdAt' },
      { table: 'Notification',      dateCol: 'createdAt' },
      { table: 'StaffChatMessage',  dateCol: 'createdAt' },
      { table: 'OfflineSyncQueue',  dateCol: 'createdAt' },
    ],
    warning: 'Deletes audit logs, notifications and chat messages before the selected date.',
  },
};

// ── GET /api/backup/purge → Return categories + record counts ─────────────────
export async function GET(req: NextRequest) {
  // H12: Strict role permission — Owner / Admin only
  const session = await getSession();
  if (!session || !['HOTEL_ADMIN', 'SUPER_ADMIN', 'RESTAURANTS_ADMIN'].includes(session.role)) {
    return NextResponse.json({ success: false, error: 'Unauthorized: Data purge requires Hotel Owner/Admin permissions.' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const beforeDate = searchParams.get('before');   // ISO date string
  const propCode   = searchParams.get('propertyCode') || '';

  let propId = '';
  try {
    const sanitized = propCode.replace(/[^a-zA-Z0-9_-]/g, '');
    if (sanitized) {
      const out = execSync(`sqlite3 prisma/dev.db "SELECT id FROM Property WHERE code = '${sanitized}' LIMIT 1;"`, {
        cwd: PROJECT_DIR, stdio: ['pipe', 'pipe', 'ignore'],
      }).toString().trim();
      if (out) propId = out;
    }
  } catch (_) {}

  const categories: Record<string, { label: string; count: number; warning: string }> = {};

  for (const [key, cat] of Object.entries(PURGE_CATEGORIES)) {
    let totalCount = 0;
    if (beforeDate) {
      // Count records for the primary (last) table
      const primary = cat.tables[cat.tables.length - 1];
      try {
        const beforeStr = new Date(beforeDate).toISOString();
        let sql = `SELECT COUNT(*) FROM "${primary.table}" WHERE "${primary.dateCol}" < '${beforeStr}'`;
        const countStr = execSync(`sqlite3 prisma/dev.db "${sql}"`, {
          cwd: PROJECT_DIR, stdio: ['pipe', 'pipe', 'ignore'],
        }).toString().trim();
        totalCount = parseInt(countStr) || 0;
      } catch (_) {}
    }
    categories[key] = {
      label: cat.label,
      count: totalCount,
      warning: cat.warning,
    };
  }

  return NextResponse.json({ categories, propId });
}

// ── POST /api/backup/purge → Execute purge ────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    // H12: Strict role permission — Owner / Admin only
    const session = await getSession();
    if (!session || !['HOTEL_ADMIN', 'SUPER_ADMIN', 'RESTAURANTS_ADMIN'].includes(session.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Data purge requires Hotel Owner/Admin permissions.' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { beforeDate, selectedCategories, propertyCode, confirmKeyword } = body as {
      beforeDate: string;
      selectedCategories: string[];
      propertyCode?: string;
      confirmKeyword?: string;
    };

    if (String(confirmKeyword).trim().toUpperCase() !== 'PURGE') {
      return NextResponse.json({ success: false, error: 'Typed confirmation PURGE is strictly required to delete data.' }, { status: 400 });
    }

    if (!beforeDate) {
      return NextResponse.json({ success: false, error: 'beforeDate is required' }, { status: 400 });
    }
    if (!selectedCategories || selectedCategories.length === 0) {
      return NextResponse.json({ success: false, error: 'No categories selected' }, { status: 400 });
    }

    const beforeStr = new Date(beforeDate).toISOString();
    const results: { category: string; deleted: number; error?: string }[] = [];
    let totalDeleted = 0;

    for (const catKey of selectedCategories) {
      const cat = PURGE_CATEGORIES[catKey];
      if (!cat) continue;

      let catDeleted = 0;
      for (const tbl of cat.tables) {
        try {
          // Check if table exists
          const exists = execSync(`sqlite3 prisma/dev.db "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='${tbl.table}';"`, {
            cwd: PROJECT_DIR, stdio: ['pipe', 'pipe', 'ignore'],
          }).toString().trim();
          if (exists !== '1') continue;

          let sql: string;
          if (tbl.joinSql) {
            // Join-based delete (child tables)
            sql = `DELETE FROM "${tbl.table}" ${tbl.joinSql.replace(/{BEFORE}/g, beforeStr)}`;
          } else {
            sql = `DELETE FROM "${tbl.table}" WHERE "${tbl.dateCol}" < '${beforeStr}'`;
          }

          execSync(`sqlite3 prisma/dev.db "${sql.replace(/"/g, '\\"')}"`, {
            cwd: PROJECT_DIR, stdio: ['pipe', 'pipe', 'ignore'],
          });

          // Count deleted (approximate — changes() not easily accessible via CLI)
          catDeleted++;
        } catch (err) {
          // Non-fatal — table may not have matching schema
        }
      }

      results.push({ category: cat.label, deleted: catDeleted });
      totalDeleted += catDeleted;
    }

    // Run VACUUM to reclaim space
    try {
      execSync('sqlite3 prisma/dev.db "VACUUM;"', {
        cwd: PROJECT_DIR, stdio: ['pipe', 'pipe', 'ignore'],
      });
    } catch (_) {}

    return NextResponse.json({
      success: true,
      message: `Data purge completed. ${selectedCategories.length} category group(s) cleaned up before ${new Date(beforeDate).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}.`,
      results,
      totalDeleted,
    });

  } catch (err) {
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 });
  }
}
