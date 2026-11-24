# GuestFlow PMS — Step-by-Step Testing & Verification Guide

> **Property:** Aatmayog (6 Rooms)  
> **Test Login:** `gm@ordermint.in`  
> **Base URL:** `http://localhost:3000` (or `https://ordermintpms.tech`)  
> **Testing Scope:** Verification of all 31 fixes across Critical (C1–C8), High (H1–H10), Medium (M1–M8), and Low (L1–L5) issues.

---

## 📋 Quick Test Summary Table

| Module | URL Path | Issues Fixed | Key Verification Check |
|---|---|---|---|
| **Header & Live Clock** | All hotel pages | M5, H1, C2 | Asia/Kolkata timezone, role says Receptionist (not Admin), occupancy matches dashboard |
| **Operations Dashboard** | `/hotel` | C2, H4, M6 | 14-day outlook matches live occupied count, arrivals match today's date, plan name is "All-Inclusive Enterprise" |
| **Room Status Board** | `/hotel/rooms` | C1, L2 | Single status truth (Room 101), button says `+ Book Room` (no `+ +`), vacant rooms match |
| **Booking Calendar** | `/hotel/calendar` | C1, C2, M4 | Occupancy shows `33%` (not `33,00%`), rates show `₹3,500` (not `₹ 3500,00`), no double bookings |
| **Bookings Directory** | `/hotel/bookings` | C7, H3, C5 | Aadhaar masked as `XXXX-XXXX-1234`, VIP PIN hidden (`••••`), check-in blocked without room/phone/KYC |
| **Folio Drawer** | Reservation Drawer | H2, C7 | Due balance from folio directly (no food double count), Aadhaar masked |
| **Invoices & Bills** | `/hotel/invoices` | C4, C5, H6, H7 | Gapless `INV/2026-27/0001` series, open folios say `PROFORMA`, real CGST/SGST (no food amount in tax) |
| **Checkout & Folios** | `/hotel/checkout` | C3, C4, M1 | 5% / 18% GST slabs, folio breaks down Rate, Meal Plan & Tax separately |
| **Night Audit** | `/hotel/night-audit` | C6, H5, M3 | 4 vacant rooms (not 0), daily room rent posted to folios, overdue overstays caught |
| **Housekeeping** | `/hotel/housekeeping` | M3 | Vacant rooms show `—` (not `Unknown`), occupied rooms auto-dirty daily |
| **Customers / Guests** | `/hotel/guests` | M2, C7 | Label says "Checked-Out Guest Visits", "Total spent" = payments received (₹0 when unpaid) |
| **Channel Manager** | `/hotel/channel-manager` | H8 | Channels with sync >1h marked `STALE (>1h)`, Sync Now creates real sync logs |
| **Staff & Live GPS** | `/hotel/staff` | M7 | Telemetry shows "0 Active on Shift" if staff is off-duty (no fake in-range count) |
| **Subscription Plan** | `/hotel/subscription` | M6 | Features count shows `22 / 22 features` (not `39 / 22`), plan is "All-Inclusive Enterprise" |
| **Analytics & BI** | `/hotel/analytics` | C8 | Dummy numbers (`4.8/5`, `64 reviews`, fake trend arrows) replaced with "Not enough data yet" |
| **Restaurant POS** | `/hotel/pos`, Cafe POS | H9 | Dishes show `SAC 996331` (not `HSN 2106`) |
| **Sidebar Navigation** | Sidebar on all pages | H1, L1, L3 | Settings/Payroll/Accounting hidden from Receptionist, no duplicate items |
| **Public Legal Pages** | `/privacy`, `/terms`, `/cookies` | M8, L5 | Real legal pages published, DPDP Act & Aadhaar masking disclosed, footer links work |

---

## 🔍 Detailed Module-by-Module Testing Steps

---

### 1. Header & Live Clock (M5, H1, C2)
* **Page URL:** `/hotel` (Header visible on all pages)
* **Test Steps:**
  1. Header ke right side par **Live Clock** dekhein.
  2. Greeting aur time check karein.
* **Expected Result:**
  - Time device ke timezone ki jagah strictly **Asia/Kolkata (IST)** dikhayega.
  - Receptionist role par top right mein "Admin" ki jagah **"Reception Desk" / "Receptionist"** show hoga.
  - Occupancy percentage dashboard ke saath exactly match karegi.

---

### 2. Operations Dashboard (C2, H4, M6)
* **Page URL:** `/hotel`
* **Test Steps:**
  1. Top KPI cards check karein: **Occupancy %**, **Arrivals**, **Departures**.
  2. Niche **14-Day Outlook** ka pehla column (Day 0) check karein.
  3. Header ke badge par plan name check karein.
* **Expected Result:**
  - Header, Dashboard KPI, aur 14-Day Outlook Day 0 teeno jagah occupancy aur occupied rooms count ek hi hoga (e.g. 2 occupied / 6 total = 33%).
  - Arrivals sirf aaj ki date (`Asia/Kolkata`) ke bookings count karega.
  - Subscription badge **"All-Inclusive Enterprise"** dikhayega.

---

### 3. Room Status Board (C1, L2)
* **Page URL:** `/hotel/rooms`
* **Test Steps:**
  1. Room 101 aur baaki rooms ka card check karein.
  2. Top action buttons dekhein.
* **Expected Result:**
  - Room 101 ab teeno screens par agree karega: agar booking in-house hai to Occupied dikhayega, clean vacant hai to Available dikhayega.
  - Top button par label ab clean **`+ Book Room`** dikhega (pehle icon aur text milkar `+ + Book Room` dikh raha tha).

---

### 4. Booking Calendar (C1, C2, M4)
* **Page URL:** `/hotel/calendar`
* **Test Steps:**
  1. Calendar ke table header mein rozana ka **Occupancy %** dekhein.
  2. Room type rows ke right side par **Effective Room Rate** dekhein.
* **Expected Result:**
  - Occupancy percentage ab Indian standard **`33%`** dikhayega (pehle European comma `33,00%` tha).
  - Rates ab **`₹3,500`** dikhayenge (pehle `₹ 3500,00` tha).
  - Occupied room par dobara check-in allowed nahi hoga.

---

### 5. Bookings Directory & Drawer (C7, H2, H3, C5)
* **Page URL:** `/hotel/bookings`
* **Test Steps:**
  1. Table mein kisi bhi guest ka **ID Number (Aadhaar)** dekhein.
  2. VIP Booking ka **VIP PIN** dekhein.
  3. Kisi reservation par click karke **Detail Drawer** kholein.
  4. Naya Check-in try karein bina phone number ya room assign kiye.
  5. Owner/Hosted stay (`RES-923747`) check karein.
* **Expected Result:**
  - Aadhaar number screen par sirf last 4 digits dikhayega: `XXXX-XXXX-1234`.
  - VIP PIN plain text ki jagah `• PIN: ••••` dikhega.
  - Drawer ke andar "Net Due Balance" directly folio se aayega; restaurant food order (₹420) dobara add hokar double-count nahi hoga.
  - Phone `0000000000` ya bina room assignment ke check-in button error dikhakar **block** karega.
  - Hosted stay (`RES-923747`) waived/₹0 dikhayega aur revenue metrics mein ₹8,000 paid add nahi karega.

---

### 6. Checkout, Invoices & GST Engine (C3, C4, H6, H7, M1)
* **Page URLs:** `/hotel/checkout` aur `/hotel/invoices`
* **Test Steps:**
  1. `/hotel/invoices` page open karein.
  2. Settled bill aur in-house guest (Room 103) ka bill check karein.
  3. "GST Tax" column dekhein.
  4. Guest checkout settle karein aur thermal/PDF receipt dekhein.
* **Expected Result:**
  - In-house guest jiska folio OPEN hai, uska invoice number **`PROFORMA-FOLIO-XXXX`** (Interim Bill) dikhega, official tax invoice nahi (H7).
  - Settle hone ke baad single sequence tax invoice banegi: **`INV/2026-27/0001`** (C4).
  - Bill #2 mein GST column actual tax dikhayega, food amount (₹420) ko tax nahi batayega (H6).
  - Room tariff ₹1,001 se ₹7,500 tak **5% GST**, aur ₹7,500 se upar (Suite ₹8,000) **18% GST** calculate hoga (C3).
  - Receipt/Folio par Room Rate, Meal Plan (`[Plan: CP/MAP]`), aur CGST/SGST alag-alag lines mein aayenge (M1).

---

### 7. Night Audit (C6, H5, M3)
* **Page URL:** `/hotel/night-audit`
* **Test Steps:**
  1. Room Status audit card dekhein: Occupied aur Vacant counts check karein.
  2. Overdue / No-Show audit card dekhein.
  3. "Run Night Audit" / "Post Daily Room Charges" par click karein.
* **Expected Result:**
  - 6 rooms mein se agar 2 occupied hain, to **4 Vacant** show hoga (pehle 0 vacant dikha raha tha).
  - 16 aur 17 Nov ke overstay guests alert honge.
  - Har in-house room ke folio par rozana ka room rent aur GST debit automatically post hoga.
  - In-house occupied rooms housekeeping mein automatically dirty (stay-over clean needed) mark ho jayenge.

---

### 8. Housekeeping Inspection (M3)
* **Page URL:** `/hotel/housekeeping`
* **Test Steps:**
  1. Table mein har unit ka **Condition** aur **Arrival Time** column check karein.
* **Expected Result:**
  - Vacant rooms jinki koi incoming booking nahi hai, arrival time mein "Unknown" ki jagah **`—`** dikhega.
  - Occupied rooms stayover cleaning ke liye daily **"Dirty"** mark rahenge jab tak inspect na kiye jayein.

---

### 9. Customers & Guest CRM (M2, C7)
* **Page URL:** `/hotel/guests` (ya `/hotel/customers`)
* **Test Steps:**
  1. Top KPI card "Completed Stays" dekhein.
  2. Kisi guest ka "Total Spent" dekhein jiska bill ₹0 paid hai.
* **Expected Result:**
  - Subtitle "Total In-House Bookings" ki jagah **"Checked-Out Guest Visits"** dikhega.
  - "Total Spent" sirf actually collected payments dikhayega. Agar ₹0 paid hai to ₹0 show hoga (₹23,020 uncollected dues add nahi honge).
  - Customer directory mein Aadhaar strictly masked format mein hoga.

---

### 10. Channel Manager (H8)
* **Page URL:** `/hotel/channel-manager`
* **Test Steps:**
  1. Connected OTA channels (Booking.com, Agoda, MakeMyTrip, etc.) ka status dekhein.
  2. "Sync Now" button par click karein.
  3. "2-Way Sync Logs" tab open karein.
* **Expected Result:**
  - Agar last sync 1 ghante se purana hai, to green dot ki jagah amber **`STALE (>1h)`** badge dikhega aur "(Needs Sync)" alert aayega.
  - "Sync Now" dabane par live sync complete hoga aur "2-Way Sync Logs" tab mein timestamped log create hoga.

---

### 11. Staff & Live GPS (M7)
* **Page URL:** `/hotel/staff`
* **Test Steps:**
  1. Top KPI cards dekhein: "Live GPS Telemetry".
* **Expected Result:**
  - Agar staff off-duty hai ya clock-in nahi kiya hai, to fake count nahi aayega.
  - Card par **"0 Active on Shift"** dikhega jab koi staff clocked-in na ho.

---

### 12. Subscription Management (M6)
* **Page URL:** `/hotel/subscription`
* **Test Steps:**
  1. Current Plan card aur "Feature Access" card check karein.
* **Expected Result:**
  - Feature count ab list ke total se match karega: **`22 / 22 features`** (pehle invalid `39 / 22 features` dikha raha tha).
  - Plan name uniformly **"All-Inclusive Enterprise"** display hoga.

---

### 13. Analytics & BI (C8)
* **Page URL:** `/hotel/analytics`
* **Test Steps:**
  1. Guest Satisfaction card aur AI Insights section check karein.
* **Expected Result:**
  - Fake placeholder text ("4.8/5 from 64 reviews", fake +5% trend) gayab ho chuka hoga.
  - Jab tak property ka actual reviews/AI data na ho, clean **"Not enough data yet"** dikhega.

---

### 14. Restaurant POS & Table Billing (H9)
* **Page URL:** `/hotel/pos` aur Cafe POS
* **Test Steps:**
  1. Menu items ke niche HSN/SAC code check karein.
* **Expected Result:**
  - Food dishes par `HSN 2106` ki jagah Restaurant Service Code **`SAC 996331`** dikhega.

---

### 15. Reports & Button Labels (L2)
* **Page URL:** `/hotel/reports`
* **Test Steps:**
  1. Kisi report card ke action buttons dekhein.
* **Expected Result:**
  - Hindi button "Dekho" ki jagah clean **"View" / "View Details"** dikhega.

---

### 16. Role-Based Access Control (H1, H10)
* **Test Steps:**
  1. `HOTEL_RECEPTIONIST` role se login karein.
  2. Sidebar menu dekhein.
  3. URL mein manually `/hotel/settings` ya `/admin/payroll` daalkar enter karein.
* **Expected Result:**
  - Sidebar mein Hotel Settings, Payroll, aur Accounting Hub hide rahenge.
  - Direct URL hit karne par API 403 Forbidden return karegi aur sensitive credentials browser ko leak nahi honge.

---

### 17. Public Legal Pages (M8, L5)
* **Test Steps:**
  1. Public website footer mein **Privacy Policy**, **Terms of Service**, aur **Cookie Policy** par click karein.
* **Expected Result:**
  - Links contact page par redirect hone ki jagah proper pages open karenge:
    - `/privacy`: DPDP Act 2023 compliant policy with Aadhaar masking and ID encryption disclosures.
    - `/terms`: SaaS service conditions and GST statutory obligations.
    - `/cookies`: Essential security cookies policy (no 3rd-party ad trackers).
