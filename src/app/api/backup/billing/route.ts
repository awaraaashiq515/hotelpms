import { NextRequest, NextResponse } from 'next/server';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { execSync } from 'child_process';
import { getSession } from '@/lib/session';

const PROJECT_DIR    = process.cwd();
const BACKUP_FOLDER  = 'Hotel-PMS-Backups';
const DESKTOP_BASE   = path.join(os.homedir(), 'Desktop', BACKUP_FOLDER);
const SETTINGS_PATH  = path.join(PROJECT_DIR, 'scripts', 'backup-settings.json');

// ── Resolve effective base path ───────────────────────────────────────────────
function getEffectiveDesktopBase(): string {
  try {
    if (fs.existsSync(SETTINGS_PATH)) {
      const settings = JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf-8'));
      if (settings.customDesktopPath && settings.customDesktopPath.trim()) {
        const p = settings.customDesktopPath.trim();
        try { fs.mkdirSync(p, { recursive: true }); } catch (_) {}
        return p;
      }
    }
  } catch (_) {}
  return DESKTOP_BASE;
}

// ── Resolve active property ───────────────────────────────────────────────────
function resolveProperty(req: NextRequest, sessionUser: any) {
  const queryCode = req.nextUrl.searchParams.get('propertyCode');
  const targetCode = queryCode || sessionUser?.propertyCode || null;
  const propId = sessionUser?.propertyId || null;

  try {
    if (targetCode) {
      const sanitized = targetCode.replace(/[^a-zA-Z0-9_-]/g, '');
      const output = execSync(`sqlite3 prisma/dev.db "SELECT id, code, name FROM Property WHERE code = '${sanitized}' LIMIT 1;"`, {
        cwd: PROJECT_DIR, stdio: ['pipe', 'pipe', 'ignore'],
      }).toString().trim();
      if (output) {
        const parts = output.split('|');
        return { id: parts[0], code: parts[1], name: parts[2] || parts[1] };
      }
    }

    if (propId) {
      const sanitizedId = propId.replace(/[^a-zA-Z0-9_-]/g, '');
      const output = execSync(`sqlite3 prisma/dev.db "SELECT id, code, name FROM Property WHERE id = '${sanitizedId}' LIMIT 1;"`, {
        cwd: PROJECT_DIR, stdio: ['pipe', 'pipe', 'ignore'],
      }).toString().trim();
      if (output) {
        const parts = output.split('|');
        return { id: parts[0], code: parts[1], name: parts[2] || parts[1] };
      }
    }

    const firstOutput = execSync('sqlite3 prisma/dev.db "SELECT id, code, name FROM Property LIMIT 1;"', {
      cwd: PROJECT_DIR, stdio: ['pipe', 'pipe', 'ignore'],
    }).toString().trim();
    if (firstOutput) {
      const parts = firstOutput.split('|');
      return { id: parts[0], code: parts[1], name: parts[2] || parts[1] };
    }
  } catch (_) {}

  return { id: '', code: targetCode || 'HOTEL', name: 'Hotel Property' };
}

// ── Helper: Get billing archives folder ───────────────────────────────────────
function getArchivesDir(propCode: string): string {
  const base = getEffectiveDesktopBase();
  const dir = path.join(base, propCode, 'billing-archives');
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

// ── GET /api/backup/billing ───────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    const prop = resolveProperty(req, session);
    const propId = prop.id;

    // 1. Current Live Billing Stats
    let invoicesCount = 0;
    let invoicesTotal = 0;
    let ordersCount = 0;
    let ordersTotal = 0;
    let receiptsCount = 0;
    let receiptsTotal = 0;
    let settlementsCount = 0;
    let settlementsTotal = 0;
    let earliestDate: string | null = null;
    let latestDate: string | null = null;

    try {
      const pClause = propId ? `WHERE propertyId = '${propId}'` : '';
      
      const invOut = execSync(`sqlite3 prisma/dev.db "SELECT COUNT(*), COALESCE(SUM(totalAmount), 0), MIN(invoiceDate), MAX(invoiceDate) FROM Invoice ${pClause};"`, {
        cwd: PROJECT_DIR, stdio: ['pipe', 'pipe', 'ignore'],
      }).toString().trim();
      if (invOut) {
        const p = invOut.split('|');
        invoicesCount = parseInt(p[0]) || 0;
        invoicesTotal = parseFloat(p[1]) || 0;
        earliestDate = p[2] || null;
        latestDate = p[3] || null;
      }

      const ordOut = execSync(`sqlite3 prisma/dev.db "SELECT COUNT(*), COALESCE(SUM(grandTotal), 0), MIN(createdAt), MAX(createdAt) FROM PosOrder ${pClause};"`, {
        cwd: PROJECT_DIR, stdio: ['pipe', 'pipe', 'ignore'],
      }).toString().trim();
      if (ordOut) {
        const p = ordOut.split('|');
        ordersCount = parseInt(p[0]) || 0;
        ordersTotal = parseFloat(p[1]) || 0;
        if (!earliestDate && p[2]) earliestDate = p[2];
        if (p[3] && (!latestDate || p[3] > latestDate)) latestDate = p[3];
      }

      const rcpOut = execSync(`sqlite3 prisma/dev.db "SELECT COUNT(*), COALESCE(SUM(amount), 0) FROM Receipt ${pClause};"`, {
        cwd: PROJECT_DIR, stdio: ['pipe', 'pipe', 'ignore'],
      }).toString().trim();
      if (rcpOut) {
        const p = rcpOut.split('|');
        receiptsCount = parseInt(p[0]) || 0;
        receiptsTotal = parseFloat(p[1]) || 0;
      }

      const stlOut = execSync(`sqlite3 prisma/dev.db "SELECT COUNT(*), COALESCE(SUM(paidAmount), 0) FROM Settlement ${pClause};"`, {
        cwd: PROJECT_DIR, stdio: ['pipe', 'pipe', 'ignore'],
      }).toString().trim();
      if (stlOut) {
        const p = stlOut.split('|');
        settlementsCount = parseInt(p[0]) || 0;
        settlementsTotal = parseFloat(p[1]) || 0;
      }
    } catch (_) {}

    // 2. Read Saved Billing Archives
    const archivesDir = getArchivesDir(prop.code);
    const archives: any[] = [];

    if (fs.existsSync(archivesDir)) {
      try {
        const files = fs.readdirSync(archivesDir)
          .filter(f => f.startsWith('billing-archive-') && f.endsWith('.json'))
          .sort().reverse();

        for (const file of files) {
          const filePath = path.join(archivesDir, file);
          try {
            const stat = fs.statSync(filePath);
            const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
            const summary = content.summary || {};
            const created = content.createdAt || stat.mtime.toISOString();
            const d = new Date(created);

            archives.push({
              id:            file.replace('.json', ''),
              filename:      file,
              filePath,
              propertyCode:  content.property?.code || prop.code,
              propertyName:  content.property?.name || prop.name,
              timestamp:     created,
              dateStr:       d.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }),
              timeStr:       d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
              invoicesCount: summary.invoicesCount ?? (content.tables?.Invoice?.length || 0),
              ordersCount:   summary.ordersCount ?? (content.tables?.PosOrder?.length || 0),
              receiptsCount: summary.receiptsCount ?? (content.tables?.Receipt?.length || 0),
              totalRevenue:  summary.totalRevenue ?? summary.invoicesTotal ?? summary.ordersTotal ?? 0,
              scope:         content.scope || 'ALL',
              beforeDate:    content.beforeDate || null,
              fileSize:      (stat.size / 1024).toFixed(1) + ' KB',
              sizeBytes:     stat.size,
            });
          } catch (_) {}
        }
      } catch (_) {}
    }

    return NextResponse.json({
      property: {
        id: prop.id,
        code: prop.code,
        name: prop.name,
      },
      currentStats: {
        invoicesCount,
        invoicesTotal: invoicesTotal.toFixed(2),
        ordersCount,
        ordersTotal: ordersTotal.toFixed(2),
        receiptsCount,
        receiptsTotal: receiptsTotal.toFixed(2),
        settlementsCount,
        settlementsTotal: settlementsTotal.toFixed(2),
        totalBillingItems: invoicesCount + ordersCount + receiptsCount + settlementsCount,
        earliestDate,
        latestDate,
      },
      archives,
    });

  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

// ── POST /api/backup/billing ──────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    const body = await req.json().catch(() => ({}));
    const action = body.action || 'archive_and_remove';
    const prop = resolveProperty(req, { ...session, propertyCode: body.propertyCode || session?.propertyCode });
    const propId = prop.id;
    const archivesDir = getArchivesDir(prop.code);

    // ──────────────────────────────────────────────────────────────────────────
    // 1. ACTION: ARCHIVE & REMOVE BILLING DATA
    // ──────────────────────────────────────────────────────────────────────────
    if (action === 'archive_and_remove') {
      const scope = body.scope || 'ALL'; // 'ALL' | 'DATE_RANGE'
      const beforeDate = body.beforeDate ? new Date(body.beforeDate).toISOString() : null;

      const pWhere = propId ? `propertyId = '${propId}'` : '1=1';

      // Table Queries
      const tablesToArchive: Record<string, string> = {
        PosOrder: scope === 'DATE_RANGE' && beforeDate
          ? `SELECT * FROM PosOrder WHERE ${pWhere} AND createdAt < '${beforeDate}';`
          : `SELECT * FROM PosOrder WHERE ${pWhere};`,
        PosOrderItem: `SELECT * FROM PosOrderItem WHERE posOrderId IN (SELECT id FROM PosOrder WHERE ${pWhere});`,
        KotTicket: scope === 'DATE_RANGE' && beforeDate
          ? `SELECT * FROM KotTicket WHERE ${pWhere} AND createdAt < '${beforeDate}';`
          : `SELECT * FROM KotTicket WHERE ${pWhere};`,
        KotItem: `SELECT * FROM KotItem WHERE kotId IN (SELECT id FROM KotTicket WHERE ${pWhere});`,
        KotStatusLog: `SELECT * FROM KotStatusLog WHERE kotId IN (SELECT id FROM KotTicket WHERE ${pWhere});`,
        OrderRating: `SELECT * FROM OrderRating WHERE orderId IN (SELECT id FROM PosOrder WHERE ${pWhere});`,
        DiscountApproval: scope === 'DATE_RANGE' && beforeDate
          ? `SELECT * FROM DiscountApproval WHERE ${pWhere} AND createdAt < '${beforeDate}';`
          : `SELECT * FROM DiscountApproval WHERE ${pWhere};`,
        TipTransaction: scope === 'DATE_RANGE' && beforeDate
          ? `SELECT * FROM TipTransaction WHERE ${pWhere} AND createdAt < '${beforeDate}';`
          : `SELECT * FROM TipTransaction WHERE ${pWhere};`,
        Invoice: scope === 'DATE_RANGE' && beforeDate
          ? `SELECT * FROM Invoice WHERE ${pWhere} AND invoiceDate < '${beforeDate}';`
          : `SELECT * FROM Invoice WHERE ${pWhere};`,
        InvoiceItem: `SELECT * FROM InvoiceItem WHERE invoiceId IN (SELECT id FROM Invoice WHERE ${pWhere});`,
        Receipt: scope === 'DATE_RANGE' && beforeDate
          ? `SELECT * FROM Receipt WHERE ${pWhere} AND receiptDate < '${beforeDate}';`
          : `SELECT * FROM Receipt WHERE ${pWhere};`,
        Payment: scope === 'DATE_RANGE' && beforeDate
          ? `SELECT * FROM Payment WHERE ${pWhere} AND paymentDate < '${beforeDate}';`
          : `SELECT * FROM Payment WHERE ${pWhere};`,
        Settlement: scope === 'DATE_RANGE' && beforeDate
          ? `SELECT * FROM Settlement WHERE ${pWhere} AND settlementDate < '${beforeDate}';`
          : `SELECT * FROM Settlement WHERE ${pWhere};`,
        FolioTransaction: propId
          ? `SELECT * FROM FolioTransaction WHERE folioId IN (SELECT id FROM Folio WHERE reservationId IN (SELECT id FROM Reservation WHERE propertyId = '${propId}'));`
          : `SELECT * FROM FolioTransaction;`,
      };

      const archivedTablesData: Record<string, any[]> = {};
      let totalRecords = 0;

      for (const [tbl, sql] of Object.entries(tablesToArchive)) {
        try {
          const raw = execSync(`sqlite3 -json prisma/dev.db "${sql}"`, {
            cwd: PROJECT_DIR, stdio: ['pipe', 'pipe', 'ignore'],
          }).toString();
          if (raw.trim()) {
            const rows = JSON.parse(raw);
            if (Array.isArray(rows) && rows.length > 0) {
              archivedTablesData[tbl] = rows;
              totalRecords += rows.length;
            }
          }
        } catch (_) {}
      }

      if (totalRecords === 0) {
        return NextResponse.json({
          success: false,
          error: 'No billing records found matching the selection criteria to archive.'
        }, { status: 400 });
      }

      // Calculate summary
      const invoices = archivedTablesData.Invoice || [];
      const orders = archivedTablesData.PosOrder || [];
      const receipts = archivedTablesData.Receipt || [];
      const settlements = archivedTablesData.Settlement || [];

      const invoicesTotal = invoices.reduce((acc, i) => acc + (Number(i.totalAmount) || 0), 0);
      const ordersTotal = orders.reduce((acc, o) => acc + (Number(o.grandTotal) || 0), 0);
      const receiptsTotal = receipts.reduce((acc, r) => acc + (Number(r.amount) || 0), 0);
      const totalRevenue = invoicesTotal > 0 ? invoicesTotal : ordersTotal;

      const now = new Date();
      const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const filename = `billing-archive-${timestamp}.json`;
      const filePath = path.join(archivesDir, filename);

      const archivePayload = {
        archiveType: 'HOTEL_PMS_BILLING_ARCHIVE',
        version: '1.0',
        property: {
          id: prop.id,
          code: prop.code,
          name: prop.name,
        },
        createdAt: now.toISOString(),
        scope,
        beforeDate: beforeDate || null,
        summary: {
          invoicesCount: invoices.length,
          invoicesTotal,
          ordersCount: orders.length,
          ordersTotal,
          receiptsCount: receipts.length,
          receiptsTotal,
          settlementsCount: settlements.length,
          totalRevenue,
          totalRecords,
        },
        tables: archivedTablesData,
      };

      // 1. Write archive JSON file
      fs.writeFileSync(filePath, JSON.stringify(archivePayload, null, 2), 'utf-8');

      // 2. Perform deletion in SQLite in safe foreign-key order
      try {
        const deleteSqlCommands = [
          'PRAGMA foreign_keys = OFF;',
          // Pos Order children
          `DELETE FROM PosOrderItem WHERE posOrderId IN (SELECT id FROM PosOrder WHERE ${pWhere});`,
          `DELETE FROM KotStatusLog WHERE kotId IN (SELECT id FROM KotTicket WHERE ${pWhere});`,
          `DELETE FROM KotItem WHERE kotId IN (SELECT id FROM KotTicket WHERE ${pWhere});`,
          `DELETE FROM KotTicket WHERE ${pWhere};`,
          `DELETE FROM OrderRating WHERE orderId IN (SELECT id FROM PosOrder WHERE ${pWhere});`,
          `DELETE FROM PosOrder WHERE ${pWhere};`,
          // Invoice children
          `DELETE FROM InvoiceItem WHERE invoiceId IN (SELECT id FROM Invoice WHERE ${pWhere});`,
          `DELETE FROM Invoice WHERE ${pWhere};`,
          // Financials
          `DELETE FROM Receipt WHERE ${pWhere};`,
          `DELETE FROM Payment WHERE ${pWhere};`,
          `DELETE FROM Settlement WHERE ${pWhere};`,
          `DELETE FROM DiscountApproval WHERE ${pWhere};`,
          `DELETE FROM TipTransaction WHERE ${pWhere};`,
          // Folio transactions
          propId
            ? `DELETE FROM FolioTransaction WHERE folioId IN (SELECT id FROM Folio WHERE reservationId IN (SELECT id FROM Reservation WHERE propertyId = '${propId}'));`
            : `DELETE FROM FolioTransaction;`,
          'PRAGMA foreign_keys = ON;',
          'VACUUM;',
        ];

        const batchSql = deleteSqlCommands.join('\n');
        execSync(`sqlite3 prisma/dev.db "${batchSql}"`, {
          cwd: PROJECT_DIR, stdio: ['pipe', 'pipe', 'ignore'],
        });
      } catch (delErr) {
        return NextResponse.json({
          success: false,
          error: 'Archive was saved, but data deletion failed: ' + (delErr as Error).message
        }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: `Successfully archived and cleared ${totalRecords} billing records. Saved as ${filename}.`,
        archive: {
          id: filename.replace('.json', ''),
          filename,
          filePath,
          totalRecords,
          invoicesCount: invoices.length,
          ordersCount: orders.length,
          receiptsCount: receipts.length,
          totalRevenue: totalRevenue.toFixed(2),
        }
      });
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 2. ACTION: RESTORE BILLING DATA ARCHIVE
    // ──────────────────────────────────────────────────────────────────────────
    if (action === 'restore') {
      const archiveId = body.archiveId || body.archiveName;
      if (!archiveId) {
        return NextResponse.json({ success: false, error: 'archiveId is required to restore' }, { status: 400 });
      }

      const filename = archiveId.endsWith('.json') ? archiveId : `${archiveId}.json`;
      const filePath = path.join(archivesDir, filename);

      if (!fs.existsSync(filePath)) {
        return NextResponse.json({ success: false, error: `Billing archive file not found: ${filename}` }, { status: 404 });
      }

      const raw = fs.readFileSync(filePath, 'utf-8');
      const archive = JSON.parse(raw);
      const tables = archive.tables || {};

      let totalRestored = 0;

      // Restore each table using INSERT OR REPLACE
      try {
        execSync('sqlite3 prisma/dev.db "PRAGMA foreign_keys = OFF;"', { cwd: PROJECT_DIR, stdio: ['pipe', 'pipe', 'ignore'] });

        for (const [table, rows] of Object.entries(tables)) {
          if (!Array.isArray(rows) || rows.length === 0) continue;

          for (const row of rows as any[]) {
            const keys = Object.keys(row).map(k => `"${k}"`);
            const vals = Object.values(row).map(v => {
              if (v === null || v === undefined) return 'NULL';
              if (typeof v === 'number') return v;
              if (typeof v === 'boolean') return v ? 1 : 0;
              return `'${String(v).replace(/'/g, "''")}'`;
            });

            const sql = `INSERT OR REPLACE INTO "${table}" (${keys.join(', ')}) VALUES (${vals.join(', ')});`;
            try {
              execSync(`sqlite3 prisma/dev.db "${sql}"`, { cwd: PROJECT_DIR, stdio: ['pipe', 'pipe', 'ignore'] });
              totalRestored++;
            } catch (_) {}
          }
        }

        execSync('sqlite3 prisma/dev.db "PRAGMA foreign_keys = ON;"', { cwd: PROJECT_DIR, stdio: ['pipe', 'pipe', 'ignore'] });
      } catch (resErr) {
        return NextResponse.json({
          success: false,
          error: 'Error restoring billing records: ' + (resErr as Error).message
        }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: `Successfully restored ${totalRestored} billing records from ${filename}.`,
        totalRestored,
        invoicesRestored: tables.Invoice?.length || 0,
        ordersRestored: tables.PosOrder?.length || 0,
        receiptsRestored: tables.Receipt?.length || 0,
      });
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 3. ACTION: DELETE ARCHIVE FILE
    // ──────────────────────────────────────────────────────────────────────────
    if (action === 'delete_archive') {
      const archiveId = body.archiveId || body.archiveName;
      if (!archiveId) {
        return NextResponse.json({ success: false, error: 'archiveId is required' }, { status: 400 });
      }

      const filename = archiveId.endsWith('.json') ? archiveId : `${archiveId}.json`;
      const filePath = path.join(archivesDir, filename);

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return NextResponse.json({ success: true, message: `Billing archive ${filename} deleted successfully.` });
      }

      return NextResponse.json({ success: false, error: 'Archive file not found' }, { status: 404 });
    }

    return NextResponse.json({ success: false, error: `Invalid action: ${action}` }, { status: 400 });

  } catch (err) {
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 });
  }
}
