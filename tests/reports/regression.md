# GuestFlow PMS Regression Report
> Generated: 2026-11-21T09:34:50.513Z  
> QA Score: **92/100** (target ≥70 after Phase 0)

## Summary

| Status | Count |
|--------|-------|
| ✅ PASS | 68 |
| ❌ FAIL | 0 |
| ⬜ NO-TEST | 23 |
| ⏳ PENDING | 0 |
| **Total** | **91** |

---

## Bug Status by Severity

### 🔴 Critical (24 bugs)

| Bug ID | Status | Module | Title | WP |
|--------|--------|--------|-------|----|
| `BKG-07` | ✅ PASS | Bookings | Same room can be sold twice for overlapping dates (no dou... | WP-0.2 |
| `ROOM-08` | ✅ PASS | Rooms | Duplicate room numbers allowed within same property | WP-0.3 |
| `TAX-01` | ✅ PASS | GST / Tax | GST computed but CGST/SGST/IGST not stored per line; disc... | WP-0.4 |
| `BKG-03` | ✅ PASS | Bookings / GST | GST slab not applied correctly at booking creation for di... | WP-0.4 |
| `FOL-04` | ✅ PASS | Folio | Folio charges do not carry CGST/SGST/IGST breakdown | WP-0.4 |
| `ACC-01` | ✅ PASS | Accounting / Ledger | Payments do not create journal entries — Cash Book is empty | WP-0.5 |
| `ACC-02` | ✅ PASS | Accounting / Ledger | Day Book and Ledger show no data — ledger tables not popu... | WP-0.5 |
| `RPT-02` | ✅ PASS | Reports | GST report shows figures that do not match issued invoices | WP-0.9 |
| `NA-01` | ✅ PASS | Night Audit | Night audit is not idempotent — running twice posts doubl... | WP-0.8 |
| `ROOMP-01` | ✅ PASS | Room Portal | Room portal QR token does not expire at checkout — ex-gue... | WP-0.11 |
| `SEC-01` | ✅ PASS | Security / RBAC | Receptionist can access payroll, backup, settings and rev... | WP-0.7 |
| `ROLE-02` | ✅ PASS | Security / RBAC | Role permissions from DB not loaded into session — permis... | WP-0.7 |
| `BI-01` | ✅ PASS | Business Intelligence / Analytics | Analytics dashboard shows hardcoded/demo metrics not from... | WP-0.9 |
| `BE-01` | ✅ PASS | Booking Engine | Booking engine preview link points to localhost:3000 | WP-0.13 |
| `CTR-01` | ✅ PASS | POS / Counter Payments | Counter Payments total includes room-posted orders — infl... | WP-0.10 |
| `BAK-01` | ✅ PASS | Backup | Backup copies SQLite to Desktop — not a real server backu... | WP-0.12 |
| `ROOM-04` | ✅ PASS | Rooms | Room can be created with negative or zero base rate | WP-0.3 |
| `ROOM-10` | ✅ PASS | Rooms | Room category code is not unique per property — duplicate... | WP-0.3 |
| `FOL-07` | ✅ PASS | Folio / Discount | Over-limit discount applied instantly without admin approval | WP-0.6 |
| `FOL-08` | ✅ PASS | Folio | Invoice can be re-issued / mutated after ISSUED status — ... | WP-0.4 |
| `DISP-03` | ✅ PASS | Displays | Customer display (order-display) shows guest names and ro... | WP-0.10 |
| `DISC-01` | ✅ PASS | Discount Approvals | Over-limit discount request never reaches admin queue — a... | WP-0.6 |
| `ADM-03` | ✅ PASS | Admin / Dashboard | Hotel dashboard KPIs (revenue, occupancy, ADR) not from r... | WP-0.9 |
| `ADM-09` | ✅ PASS | Admin / Backup | No backup status or alert in admin panel — owner does not... | WP-0.12 |

### 🟠 High (27 bugs)

| Bug ID | Status | Module | Title | WP |
|--------|--------|--------|-------|----|
| `TZ-01` | ✅ PASS | Timezone | Business date computed in UTC, not IST — midnight-to-6am ... | WP-0.1 |
| `INF-01` | ✅ PASS | Infrastructure | NEXT_PUBLIC_APP_URL is localhost:3000 in .env — QR codes ... | WP-0.13 |
| `FOL-02` | ✅ PASS | Folio | Folio closing balance can go negative without warning | WP-0.1 |
| `BAK-02` | ✅ PASS | Backup | Receptionist can trigger backup download — unauthorized a... | WP-0.7 |
| `REV-01` | ✅ PASS | Revenue | Revenue dashboard only shows one source (room) — POS, spa... | WP-0.9 |
| `HDR-01` | ✅ PASS | Hotel Dashboard / Reports | Daily report page shows static placeholder data | WP-0.9 |
| `CM-01` | ✅ PASS | Channel Manager | Channel manager shows 'connected' status but is not actua... | WP-0.9 |
| `IOT-01` | ✅ PASS | Smart Hotel / IoT | Smart Hotel dashboard shows fake device states | WP-0.9 |
| `BNQ-01` | ✅ PASS | Banquet | Banquet page shows hardcoded event list with 'Sharma Wedd... | WP-0.9 |
| `DC-01` | ✅ PASS | Day Closing | Day closing opening cash can be set to any value includin... | WP-0.14 |
| `POS-02` | ✅ PASS | POS | POS 'Post to Room' picker does not check room availabilit... | WP-0.10 |
| `FOL-09` | ✅ PASS | Folio | Multiple open folios can exist for one reservation — bala... | WP-0.4 |
| `BKG-11` | ✅ PASS | Bookings / Ledger | Advance payment on booking does not post to ledger | WP-0.5 |
| `AGT-01` | ✅ PASS | Agents | Agent KYC fields accept unvalidated data — invalid GST/PA... | WP-0.14 |
| `AIC-01` | ✅ PASS | AI Concierge | AI Concierge API key (Gemini) accessible to receptionist ... | WP-0.7 |
| `KYC-01` | ✅ PASS | KYC / Guest | Indian mobile number not validated — 7-digit or non-India... | WP-0.14 |
| `CO-02` | ✅ PASS | Checkout | Checkout does not check for outstanding folio balance bef... | WP-0.8 |
| `LOY-01` | ✅ PASS | Loyalty | Loyalty points can be manually adjusted by any user witho... | WP-0.6 |
| `POS-03` | ✅ PASS | POS | Complimentary order (100% discount) does not require mana... | WP-0.6 |
| `RS-01` | ✅ PASS | Room Service | Room service GST not computed as F&B GST — wrong SAC code... | WP-0.4 |
| `HSN-01` | ✅ PASS | GST / HSN | HSN/SAC code summary in reports is incorrect — wrong code... | WP-0.4 |
| `SPA-01` | ✅ PASS | Spa | Spa admin page accessible to all hotel roles — no permiss... | WP-0.7 |
| `ROOM-05` | ✅ PASS | Rooms | Room discount percentage accepts values over 100 and nega... | WP-0.3 |
| `ADM-04` | ✅ PASS | Accounting | Expense records do not post to accounting voucher/ledger | WP-0.5 |
| `ADM-05` | ✅ PASS | Night Audit | Night audit does not roll the business date — same date s... | WP-0.8 |
| `ADM-08` | ✅ PASS | Admin | Manager PIN for instant discount approval is 4 digits and... | WP-0.6 |
| `ADM-10` | ✅ PASS | Admin / Settings | 'Simulate OTA Sync' and 'Test Email Booking' buttons visi... | WP-0.13 |

### 🟡 Medium (24 bugs)

| Bug ID | Status | Module | Title | WP |
|--------|--------|--------|-------|----|
| `DASH-01` | ✅ PASS | Dashboard | Dashboard clock shows UTC time, not IST | WP-0.1 |
| `ROOM-01` | ⬜ NO-TEST | Rooms | Room status board does not refresh automatically | WP-0.3 |
| `ROOM-06` | ✅ PASS | Rooms | Room category (RoomType) has no Edit button — categories ... | WP-0.3 |
| `BKG-06` | ✅ PASS | Bookings | Booking form does not show real-time availability — block... | WP-0.2 |
| `FOL-01` | ⬜ NO-TEST | Folio | Folio number sequence not guaranteed unique under concurr... | WP-0.4 |
| `CHK-01` | ⬜ NO-TEST | Checkin | Early check-in time earlier than property check-in time i... | WP-0.14 |
| `INV-03` | ⬜ NO-TEST | Invoices | Invoice PDF does not show CGST/SGST breakdown — fails com... | WP-0.4 |
| `PUR-01` | ✅ PASS | Purchasing | Purchase order total can be zero or negative — no validation | WP-0.14 |
| `HR-01` | ✅ PASS | HR | HR dashboard KPIs (attendance rate, leave balance) not co... | WP-0.9 |
| `KOT-01` | ✅ PASS | KOT | KOT number sequence is global — two properties can genera... | WP-0.10 |
| `MOD-01` | ⬜ NO-TEST | POS / KOT | Order modification after KOT is sent does not create a vo... | WP-0.10 |
| `TBL-01` | ⬜ NO-TEST | POS / Tables | Table status does not update when order is settled — tabl... | WP-0.10 |
| `CTR-02` | ✅ PASS | POS / Counter | Counter payment shift totals include void/cancelled orders | WP-0.10 |
| `LOY-02` | ⬜ NO-TEST | Loyalty | Loyalty points tier thresholds not configurable — hardcod... | WP-0.9 |
| `RPT-01` | ✅ PASS | Reports | Report date range filter defaults to current browser date... | WP-0.1 |
| `BKG-01` | ✅ PASS | Bookings | Booking wizard default date is UTC midnight, shows wrong ... | WP-0.1 |
| `AGT-02` | ⬜ NO-TEST | Agents | Agent can be created without KYC document upload — no val... | WP-0.7 |
| `BIKE-01` | ⬜ NO-TEST | Bike Rental | Bike rental portal has no link to hotel PMS — revenue not... | WP-0.10 |
| `CONS-01` | ⬜ NO-TEST | Concierge / Requests | Guest concierge requests (housekeeping, room service) not... | WP-0.10 |
| `DISP-02` | ✅ PASS | Displays | Bar display shows UTC timestamp — wrong time visible to c... | WP-0.1 |
| `BNQ-02` | ⬜ NO-TEST | Banquet | Banquet advance payment cannot be posted to accounting | WP-0.9 |
| `ADM-02` | ⬜ NO-TEST | Admin / Multi-property | Multi-property user defaults to wrong hotel after login | WP-0.7 |
| `ADM-07` | ⬜ NO-TEST | Admin / Discounts | Discount approval inbox in admin panel does not exist | WP-0.6 |
| `ADM-06` | ✅ PASS | Admin / Validation | Settings page GSTIN field has no format validation | WP-0.14 |

### ⚪ Low (16 bugs)

| Bug ID | Status | Module | Title | WP |
|--------|--------|--------|-------|----|
| `BKG-05` | ✅ PASS | Bookings | Booking with checkOut before checkIn is accepted | WP-0.2 |
| `BKG-08` | ✅ PASS | Bookings | Same-day arrival and departure (0-night stay) is accepted | WP-0.2 |
| `BKG-09` | ✅ PASS | Bookings / KYC | Booking guest phone number accepts 7-digit or internation... | WP-0.14 |
| `BKG-10` | ✅ PASS | Bookings | Cancelled booking room is not released back to availability | WP-0.2 |
| `FOL-03` | ⬜ NO-TEST | Folio | Folio PDF does not show property logo | WP-0.4 |
| `FOL-06` | ⬜ NO-TEST | Folio | Folio transaction description truncated to 50 chars — los... | WP-0.4 |
| `INV-02` | ✅ PASS | Invoices | Invoice number does not reset per financial year | WP-0.4 |
| `INV-04` | ⬜ NO-TEST | Invoices | Invoice list page does not filter by date range | WP-0.4 |
| `UI-01` | ⬜ NO-TEST | UI | Indian rupee symbol ₹ renders as ? on some Android/Window... | WP-0.1 |
| `UI-02` | ⬜ NO-TEST | UI | Mobile viewport broken on some hotel module pages | WP-0.1 |
| `DC-02` | ⬜ NO-TEST | Day Closing | Day closing can be run twice for the same shift | WP-0.10 |
| `EXP-01` | ⬜ NO-TEST | Expenses | Expense attachment URL not validated — any string accepte... | WP-0.14 |
| `MNT-01` | ✅ PASS | Maintenance | Maintenance ticket falls back to mock data when API retur... | WP-0.9 |
| `HK-01` | ⬜ NO-TEST | Housekeeping | Housekeeping task priority dropdown has no default — empt... | WP-0.14 |
| `ADM-01` | ⬜ NO-TEST | Admin | Super Admin panel accessible via direct URL without 2FA | WP-0.7 |
| `ADM-11` | ⬜ NO-TEST | Admin | Audit log does not capture IP address for all write opera... | WP-0.7 |


---
*Report generated by scripts/regression-report.mjs*
