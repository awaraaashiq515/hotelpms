# DEMO_DATA_INVENTORY.md
> Generated: 2026-11-21 (pre-fix baseline)
> Purpose: Every hardcoded demo/seed/mock value in the codebase that must be removed or gated before production

---

## 1. `localhost:3000` Hardcoded in UI

These must be replaced with `process.env.NEXT_PUBLIC_APP_URL` or `typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_APP_URL`.

| File | Line | Context |
|---|---|---|
| `src/app/hotel/spa/page.tsx` | 634 | Spa portal URL construction |
| `src/app/hotel/spa/page.tsx` | 1262 | Spa portal link display |
| `src/app/hotel/spa/page.tsx` | 1269 | Clipboard copy of spa link |
| `src/app/hotel/rooms/qr-codes/page.tsx` | 172 | QR code base URL |
| `src/app/hotel/booking-engine/page.tsx` | 38 | "Preview Booking Site" link |
| `src/app/hotel/settings/page.tsx` | 680 | Guest portal URL preview |
| `.env` | 2 | `NEXT_PUBLIC_APP_URL="http://localhost:3000"` |
| `src/app/api/kots/route.ts` | — | Demo origin fallback |
| `src/app/api/b2b/supplier/generate-qr/route.ts` | — | QR base URL |

**Fix:** Set `NEXT_PUBLIC_APP_URL=https://ordermintpms.tech` in production `.env` and use it everywhere.

---

## 2. Demo Phone Numbers Exposed in UI

| File | Context | Value |
|---|---|---|
| `src/app/hotel/settings/page.tsx:399` | Phone placeholder | `+91 9876543210` |
| `src/app/hotel/settings/page.tsx:709` | Guest portal password hint | `9876543210` |
| `src/app/hotel/purchasing/components/PurchaseOrderForm.tsx:378` | Placeholder | `9876543210` |
| `src/app/hotel/purchasing/components/PurchaseOrderForm.tsx:494` | Staff phone placeholder | `9876543210` |
| `src/app/hotel/agents/page.tsx:789` | Phone input placeholder | `+91 9876543210` |
| `src/app/hotel/guests/page.tsx:1057` | Phone input placeholder | `+91 9876543210` |
| `src/app/hotel/subscription/page.tsx:262` | WhatsApp contact link | `wa.me/919876543210` |
| `src/app/hotel/subscription/page.tsx:635` | WhatsApp upgrade link | `wa.me/919876543210` |
| `src/app/hotel/subscription/page.tsx:644` | Phone `tel:` link | `+919876543210` |

**Fix (subscription page):** Replace `9876543210` with the real GuestFlow support contact number from env var `SUPPORT_PHONE`.

---

## 3. Hardcoded "Avasa Hotels" Brand in DB Schema

The `WebsiteSettings` model has hardcoded defaults for the "Avasa Hotels" brand:

| Field | Default Value |
|---|---|
| `hotelName` | `"Avasa Hotels"` |
| `storyTitle` | `"Our Story – The Story of Avasa Hotels"` |
| `author` (WebsiteBlog) | `"Avasa Hotels"` |
| `smtpHost` | `"smtp.hostinger.com"` |
| `smtpPort` | `"465"` |

**Fix:** Change defaults to `"GuestFlow"` / `"Your Hotel Name"` or remove defaults and require setup on onboarding.

---

## 4. Sample Data in Demo Data Flow

The system ships with a demo data seeding mechanism for new hotel accounts:

| Location | Data Type | Description |
|---|---|---|
| `src/app/api/hotel/demo-data/route.ts` | API | Checks for seeded demo guests |
| `src/app/hotel/page.tsx:2030` | UI | "Tarun & Priya" sample guests |
| `src/app/hotel/page.tsx:2046` | UI | "Rooms 101–203" sample rooms |
| `src/app/hotel/settings/page.tsx:941` | UI | "sample rooms and bookings" copy |
| `scripts/add-ashoka-demo.js` | Script | Adds Ashoka demo property |
| `scripts/seed-5x5-products.js` | Script | Seeds 5×5 restaurant products |
| `scripts/seed-membership-demo.ts` | Script | Seeds membership demo |

**Fix:** Add `isDemo: Boolean @default(false)` to `Reservation`, `Guest`, `Room`, `RoomType` models. Seed scripts must set this flag. Integrity check must assert `isDemo rows = 0` in production.

---

## 5. Mock / Fallback Data in UI Components

| File | Description |
|---|---|
| `src/app/hotel/maintenance/page.tsx:2189` | Creates a `mock` MaintenanceTicket object when API fails |
| `src/app/hotel/vendor/page.tsx:74-525` | `SAMPLE_PRODUCTS_BY_CATEGORY` and `LOW_STOCK_SAMPLE` hardcoded arrays used as fallback |
| `src/app/hotel/purchasing/components/ShopProcurementHub.tsx:178-188` | Hardcoded product catalog suggestions (item names, prices) |
| `src/app/hotel/calendar/page.tsx:825-830` | Falls back to `Math.round(group.type.baseRate || 3500)` default rate |
| `src/components/hotel/dashboard/OccupancyForecast.tsx` | Needs audit for hardcoded forecast data |
| `src/components/hotel/operations/QuickReservationModal.tsx` | Needs audit for demo state |

**Fix:** Replace all mock fallback data with proper empty states. Never render fabricated metrics.

---

## 6. Hardcoded Default Credentials & PINs

| Location | Value | Risk |
|---|---|---|
| `Property.managerDiscountPin` default | `"1234"` | Weak PIN, 4 digits (should be 6+ digits, hashed) |
| `RoomPortalConfig.kioskExitPin` default | `"1234"` | Weak default |
| `Property.guestPortalDefaultPassword` | `"welcome@123"` | Default guest password |
| `Property.hotelWifiPassword` default | `"welcome123"` | Exposed WiFi password |
| `src/lib/session.ts:4` | `'super-secret-default-key-change-it-in-prod'` | JWT secret fallback |
| `scripts/create-local-admin.js` | — | Creates admin with known default credentials |
| `scripts/create-super-admin.js` | — | Creates super admin |

**Fix:**
- Remove JWT secret fallback; throw if `JWT_SECRET` env var is missing.
- Remove 4-digit PIN defaults; force setup during onboarding.
- Increase `managerDiscountPin` to 6+ digits, store hashed with argon2.

---

## 7. Date Format / Timezone Inconsistencies (Full Inventory)

Files using `new Date()` directly instead of `getHotelBusinessDate()`:

| File | Issue |
|---|---|
| `src/app/api/hotel/revenue/route.ts` | `new Date()`, `setHours(0,0,0,0)` (UTC) |
| `src/app/api/hotel/analytics/route.ts` | Same pattern — uses `getHotelBusinessDate()` for some, raw `new Date()` for others |
| `src/app/api/hotel/checkin/route.ts` | `new Date()` for `checkedInAt` |
| `src/app/api/hotel/checkout/route.ts` | `new Date()` for `checkedOutAt` |
| `src/app/api/hotel/bookings/route.ts` | Date parsing from query params (no timezone) |
| `src/lib/hotel/gst-service.ts:115` | `new Date()` for FY calculation |
| Most `FolioTransaction` creates | `txnDate: new Date()` without timezone normalization |

**Fix:** Create `src/lib/time.ts` with `businessDate(tz)`, `fmt(date, tz, pattern)`, `nowInTz(tz)`. Replace all raw `new Date()` usage.

---

## 8. Seeded / Test Data Detection Rule

For integrity checks, demo/seed rows should be detectable. 

Proposed detection criteria (until `isDemo` flag is added):
- `Guest.firstName IN ('Tarun', 'Priya', 'Demo', 'Test')`
- `RoomType.name IN ('Demo Suite', 'Sample Room', 'Test Deluxe')`
- `Property.name LIKE '%Demo%' OR Property.name LIKE '%Test%'`
- Any `Reservation` linked to above demo guests

---

## 9. Env Var Audit

### Currently Set (`.env`)
```
DATABASE_URL="file:./dev.db"
NEXT_PUBLIC_APP_URL="http://localhost:3000"    ⚠️ WRONG for production
OFFLINE_MODE="true"
SYNC_SERVER_URL="https://ordermintpms.tech"
NEXT_TELEMETRY_DISABLED="1"
```

### Missing Env Vars (required for production)
```
JWT_SECRET=                     # REQUIRED; remove fallback in session.ts
NEXT_PUBLIC_APP_URL=https://ordermintpms.tech
DATABASE_URL=                   # PostgreSQL connection string
SUPPORT_PHONE=                  # Real GuestFlow support number
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
FIREBASE_PROJECT_ID=
FIREBASE_PRIVATE_KEY=
FIREBASE_CLIENT_EMAIL=
GOOGLE_GEMINI_API_KEY=
ANTHROPIC_API_KEY=
WHATSAPP_META_ACCESS_TOKEN=
WHATSAPP_META_PHONE_ID=
BACKUP_S3_BUCKET=               # For WP-0.12
BACKUP_S3_REGION=
BACKUP_S3_ACCESS_KEY=
BACKUP_S3_SECRET_KEY=
```

---

## 10. Action Checklist

- [ ] Replace `localhost:3000` with `NEXT_PUBLIC_APP_URL` in all 9 locations
- [ ] Replace `9876543210` subscription page contact with real support number
- [ ] Change `WebsiteSettings` defaults from "Avasa Hotels" to "GuestFlow" / placeholder
- [ ] Add `isDemo: Boolean @default(false)` to Reservation, Guest, Room, RoomType
- [ ] Remove JWT secret fallback string from `session.ts`
- [ ] Force `managerDiscountPin` to 6+ digits during onboarding, hashed with argon2
- [ ] Gate seed scripts behind `NODE_ENV !== 'production'`
- [ ] Audit and replace all mock fallback arrays in UI with empty states
- [ ] Create `src/lib/time.ts` and migrate all raw `new Date()` date computations
