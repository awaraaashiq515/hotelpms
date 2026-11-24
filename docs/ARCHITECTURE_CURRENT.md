# ARCHITECTURE_CURRENT.md
> Generated: 2026-11-21 (pre-fix baseline)  
> Project: **OrderMint PMS / GuestFlow**  
> Live URL: https://ordermintpms.tech

---

## 1. Stack Overview

| Layer | Technology | Notes |
|---|---|---|
| **Framework** | **Next.js 15 (App Router)** | TypeScript, `src/app/` structure |
| **Language** | TypeScript | Strict mode on |
| **Database** | **SQLite** (`dev.db`) via Prisma | ⚠️ CRITICAL: SQLite in production, not PostgreSQL |
| **ORM** | **Prisma 6** | Schema: `prisma/schema.prisma` (3,578 lines) |
| **Auth** | **Custom JWT** (jose library) | 8-hour sessions, stored in `session` cookie or `Bearer` header |
| **Hosting** | Vercel (cloud) + Electron (desktop) + Capacitor (Android) | Three separate deployment targets |
| **File Storage** | Local filesystem / Base64 in DB | ⚠️ No cloud storage configured |
| **Cron** | None implemented | ⚠️ No real cron — night audit is manual HTTP call |
| **Queue** | None | ⚠️ BullMQ/DB-queue not implemented |
| **Real-time** | Socket.io (custom server) + Firebase RTDB | Walkie-talkie, KDS, bar display |
| **Mobile** | Capacitor → Android WebView | Not Flutter — wraps the Next.js web app |
| **Print** | QZ Tray + SerialPort + NetworkPrinter | ESC/POS via node |
| **AI** | Google Gemini API + Anthropic Claude | AI concierge, menu OCR |

---

## 2. Router & Page Structure

```
src/app/
├── (website)/                    # Public marketing website
│   ├── about/, blog/, contact/, features/, pricing/
├── [propertyCode]/               # Legacy POS/Restaurant routes (keep)
│   ├── dashboard/, pos/, orders/, invoices/, ...
├── hotel/                        # HMS (Hotel Management) pages
│   ├── page.tsx                  # Hotel Home / Dashboard
│   ├── bookings/, checkin/, checkout/, calendar/
│   ├── rooms/, housekeeping/, maintenance/
│   ├── pos/ (bar, cafe, kitchen-display, kots, counter-payments, ...)
│   ├── billing/, invoices/, folios/
│   ├── accounts/ (cash-book, day-book, ledger)
│   ├── night-audit/, night-audit/daily-report/
│   ├── hr/, payroll/, staff/
│   ├── analytics/, revenue/, booking-engine/, channel-manager/
│   ├── agents/, agent-bookings/
│   ├── loyalty/, crm/, customers/, guests/
│   ├── spa/, banquet/, sightseeing/
│   ├── smart-hotel/              # IoT (placeholder)
│   ├── ai-concierge/
│   ├── backup/, settings/, notifications/, discounts/
│   ├── purchasing/, inventory/, vendor/
│   ├── pool/, laundry/, lost-found/
│   └── engineering/              # Maintenance/CAPEX
├── admin/                        # Super-admin (SaaS management)
├── api/
│   ├── hotel/                    # HMS API handlers
│   │   ├── bookings/, checkin/, checkout/, rooms/, room-types/
│   │   ├── folios/, invoices/, guests/, kyc/
│   │   ├── night-audit/, daily-report/, analytics/, revenue/
│   │   ├── housekeeping/, maintenance/, laundry/, lost-found/
│   │   ├── agents/, agent-bookings/, channel-manager/
│   │   ├── loyalty/, pos (room-service, post-to-room), pool-passes/
│   │   ├── spa/, banquet (missing), smart-hotel/
│   │   ├── reports/generate/, backup/ (missing cron), settings/
│   │   ├── demo-data/            # Demo data presence check/clear
│   │   └── ai-concierge/
│   ├── [many POS routes]         # Existing restaurant/POS APIs
│   └── webhooks/whatsapp/
├── guest-portal/                 # Guest self-service (phone login)
├── room-portal/                  # In-room tablet portal
├── housekeeper-portal/           # Housekeeper mobile portal
├── staff-portal/                 # Staff mobile portal
├── bike-rental-portal/           # Bike rental (standalone)
├── driver-portal/                # Delivery driver app
└── b2b/                          # B2B supplier portal
```

---

## 3. Database Schema (Prisma / SQLite)

**Schema file:** `prisma/schema.prisma` (3,578 lines)

### Key Models

| Model | Purpose | Critical Issues |
|---|---|---|
| `Organization` | Multi-tenant root (SaaS customer) | `paymentAmount Float` — money as float |
| `Property` | Hotel / restaurant / cafe outlet | No `timezone` field; `managerDiscountPin "1234"` default |
| `User` | Staff accounts | Role via `roleId` → `Role` table |
| `Role` / `Permission` / `RolePermission` | RBAC (exists in schema) | ⚠️ NOT enforced in API routes |
| `Reservation` | Hotel bookings | ⚠️ No DB-level exclusion constraint; double booking possible |
| `CheckIn` / `CheckOut` | Stay tracking | No `portalToken` / expiry |
| `Folio` / `FolioTransaction` | Guest bill | ⚠️ All amounts are `Float`; no paise; no double-entry |
| `Invoice` / `InvoiceItem` | Tax invoice | ⚠️ No CGST/SGST/IGST columns; no SAC code per line |
| `Room` / `RoomType` | Inventory | No `@@unique([propertyId, number])` |
| `KotTicket` | Kitchen orders | `kotNo` unique but no per-property sequence |
| `Payment` / `Receipt` | Money in/out | ⚠️ No `JournalEntry` model; no double-entry ledger |
| `Voucher` / `VoucherEntry` | Accounting | Exists but not auto-posted |
| `AuditLog` | Change tracking | Exists; not called consistently |
| `RoomPortalSession` | QR portal auth | Has `token` but no `expiresAt` tied to checkout |
| `GstFiling` | GSTR-1 | Has JSON blob; not generated from real invoices |

### Missing Models (required by Build Prompt)
- `JournalEntry` / `JournalLine` (double-entry ledger)
- `RatePlan` / `RateCalendar` / `Season` / `Restriction`
- `InvoiceSeries` (FY invoice numbering)
- `CreditNote` / `DebitNote`
- `NightAuditRun` / `NightAuditStep` (idempotent audit log)
- `BackupRun` / `IntegrityRun`
- `ApprovalRequest` (discount approval workflow)
- `RoomBlock` (OOO/maintenance blocks)
- `StayRoomSegment` (room move history)
- `UserPropertyRole` (multi-property user assignment)
- `LoginEvent` / `UserMfa` (2FA / login history)

---

## 4. Authentication & Authorization

### Auth Flow
1. Login → `POST /api/auth/login` → custom JWT signed with `jose`
2. Token stored in `session` cookie (8h) or passed as `Authorization: Bearer`
3. `getSession()` in `src/lib/session.ts` reads cookie or header on every request

### Session Payload Fields
```typescript
{ id, email, roleId, role, organizationId, propertyId,
  propertyCode, propertyType, permissions?: string[],
  packageFeatures?: string[] }
```

### Authorization Problems
- **No `requirePermission()` utility** — routes check `session.role === 'ADMIN'` ad hoc
- **No middleware.ts** — no route-level RBAC guard
- `getMultiTenantWhere()` accepts `propertyIdParam` from the request (attacker can pass any propertyId)
- `resolvePropertyIdentifier()` falls back to ANY first property in DB — cross-tenant data leak risk
- Permission table exists in DB but is NOT enforced in any API route

---

## 5. Money & Tax

### Current State
- **All monetary values stored as `Float`** (rupees, not paise) — ⚠️ violates Rule #1
- GST engine exists (`src/lib/hotel/gst-service.ts`) with correct slabs
- GST computed but **not broken down into CGST/SGST/IGST columns** on Invoice/FolioTransaction
- Room discount: `Float` percentage on `Room` model; no approval workflow enforced at DB level
- No double-entry ledger; no `JournalEntry` table

### GST Rules (as coded in gst-service.ts)
| Tariff/night | Rate | SAC |
|---|---|---|
| < ₹1,001 | 0% | 996311 |
| ₹1,001–₹7,500 | 5% | 996311 |
| > ₹7,500 | 18% | 996311 |
| F&B (normal premises) | 5% | 996331 |
| F&B (specified premises) | 18% | 996331 |

---

## 6. Time & Timezone

- `HOTEL_TIMEZONE = 'Asia/Kolkata'` constant in `src/lib/hotel/room-status-service.ts`
- `getHotelBusinessDate()` uses `Intl.DateTimeFormat` with IST — correct approach
- **Most API routes use `new Date()` / `setHours(0,0,0,0)` directly** (UTC wall-clock), not IST
- `property.timezone` column does NOT exist
- No `lib/time.ts` central module

---

## 7. Night Audit

**Location:** `src/app/api/hotel/night-audit/route.ts`

- Steps: ROOM_STATUS, NO_SHOW, ROOM_RENT, POS_RECONCILE, CLOSE_SHIFT
- Posts `FolioTransaction` rows for room rent with GST
- **No idempotency** — running twice posts double charges
- **No `NightAuditRun` record** — no audit of audit
- **No business date rollover** — `Property.businessDate` column does not exist
- **Not scheduled** — must be triggered manually

---

## 8. Backup System

- `npm run backup:start` → spawns background Node.js process
- Copies `dev.db` SQLite file to local `backups/` directory
- Also attempts Google Drive Desktop sync (mount path dependency)
- **No server-side cloud backup** (S3/R2/GCS)
- **No `BackupRun` record** in DB
- **No owner alert** for stale backup

---

## 9. Mobile App Reality

- **No Flutter** — the "mobile app" is a Capacitor Android WebView
- `android/app/src/main/java/com/ordermint/pos/MainActivity.java` — standard Capacitor stub
- Loads the Next.js web app inside a WebView
- No separate native apps (Owner, Staff, Guest) as described in Build Prompt

---

## 10. External Integrations Status

| Integration | Status |
|---|---|
| WhatsApp (Meta/Twilio/UltraMsg) | Partially implemented |
| Google Gemini | Implemented |
| Anthropic Claude | Implemented |
| Razorpay / Cashfree | NOT implemented (UI only) |
| Channel Manager (OTA) | Fake / placeholder |
| TTLock (smart locks) | NOT implemented |
| Gmail IMAP | Implemented |
| Firebase Admin | Implemented (notifications + WT) |
| ESC/POS Printers | Implemented (QZ Tray + SerialPort) |
| Agora | Implemented (walkie-talkie) |

---

## 11. File Locations Quick Reference

| Concern | File |
|---|---|
| Prisma schema | `prisma/schema.prisma` |
| Session / JWT | `src/lib/session.ts` |
| Auth helpers | `src/lib/auth.ts` (bcrypt only) |
| API utils | `src/lib/api-utils.ts` |
| GST engine | `src/lib/hotel/gst-service.ts` |
| Room status (source of truth) | `src/lib/hotel/room-status-service.ts` |
| Hotel print | `src/lib/hotel-print-utils.ts` |
| Invoice sequence | `src/lib/hotel/invoice-sequence.ts` |
| WhatsApp | `src/lib/whatsapp.ts` |
| Prisma client | `src/lib/prisma.ts` |
| Backup utils | `src/lib/backup-utils.ts` |

---

## 12. Summary of Critical Gaps vs Build Prompt

| Gap | Severity |
|---|---|
| SQLite instead of PostgreSQL (no exclusion constraints, no row-level locking) | 🔴 Critical |
| Money as Float (should be Int paise) | 🔴 Critical |
| No double-entry ledger (`JournalEntry`) | 🔴 Critical |
| No DB-level double-booking prevention | 🔴 Critical |
| No `requirePermission()` / middleware RBAC | 🔴 Critical |
| No night audit idempotency or business date rollover | 🔴 Critical |
| No real backup (server-side, cloud) | 🔴 Critical |
| No test suite (no Vitest, no Playwright, no jest) | 🔴 Critical |
| No `lib/time.ts` central time module | 🟠 High |
| No Zod validators on most API inputs | 🟠 High |
| No OpenAPI / versioned API (`/api/v1/`) | 🟠 High |
| No Flutter (Capacitor WebView instead) | 🟠 High |
| No rate plan / restriction engine | 🟠 High |
| No proper GST line-level breakdown on invoices | 🟠 High |
| `localhost:3000` hardcoded in production UI files | 🟠 High |
| Discount approval PIN is `"1234"` default, 4 digits | 🟠 High |
