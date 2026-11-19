# 🔌 GuestFlow PMS — Offline Architecture & Implementation Plan
## Continuous Operation During Power & Internet Outages

> **Objective:** Keep the entire property management system running seamlessly locally when power or internet is down. Once power/internet is restored, automatically synchronize all queued transactions back to the cloud server with zero data loss.

---

## 🔍 System Architecture Overview

### Previous Architecture (Cloud-Dependent)
```
[User Browser / Electron Client]
        ↓ Requires active internet connection
[ordermintpms.tech — Remote Cloud Server]
        ↓
[Remote PostgreSQL / Database]
```
*Vulnerability:* Internet or power outage immediately halts operations; reception and point-of-sale become non-functional.

---

### New Architecture (Offline-First Resilient Hybrid)
```
[GuestFlow Electron Desktop Client]
        ↓ Local zero-latency connection
[Local Embedded Next.js Server (localhost:3000)]
        ↓
[Local SQLite Database (dev.db) on Host Machine]
        ↓ (Automatic synchronization on internet restoration)
[Cloud Auto-Sync API → ordermintpms.tech]
```
*Result:* System continues full operations uninterrupted during blackouts or network downtime. All check-ins, check-outs, room service orders, KOT generation, invoices, and payments persist to the local database and synchronize automatically when connectivity is re-established.

---

## 📋 Comprehensive Phase Breakdown

---

## 🚀 PHASE 1 — Embedded Local Server & Electron Lifecycle
**Status:** Completed ✅

### Purpose:
Package the Next.js runtime, standalone production assets, and SQLite database directly inside the Electron desktop application.

### Key Implementation Details:
1. **`electron/server-manager.js`**:
   - Manages child process lifecycles for Next.js (`localhost:3000`).
   - Automatically allocates ports, verifies server readiness via internal health probes, and manages process shutdown cleanly on app exit.
   - Sets the database connection string to point to the secure user data directory (`guestflow.db`).
2. **`electron/main.js`**:
   - Displays a branded startup splash screen while initializing local background services.
   - Continuously monitors network reachability every 15 seconds.
   - Emits system-level window events (`guestflow-online`, `guestflow-offline`) and desktop OS notifications when internet status changes.
   - Intercepts navigation failures and presents an automatic local recovery screen.
3. **`electron-builder.json`**:
   - Bundles standalone Next.js server files, static assets, Prisma schemas, and database files into single-file Windows setup installers (`.exe`) and macOS disk images (`.dmg`).

---

## 🗄️ PHASE 2 — Local SQLite Storage & Queue Schema
**Status:** Completed ✅

### Purpose:
Store operational data locally on the computer and maintain an indexed queue for changes that need upstream replication.

### Key Implementation Details:
1. **Prisma Engine Configuration**:
   ```prisma
   datasource db {
     provider = "sqlite"
     url      = env("DATABASE_URL")
   }
   ```
2. **`OfflineSyncQueue` Model**:
   ```prisma
   model OfflineSyncQueue {
     id         Int       @id @default(autoincrement())
     type       String    // CREATE_ORDER, CHECK_IN, CHECK_OUT, ADD_KOT, etc.
     endpoint   String    // Target API endpoint
     method     String    // POST, PUT, PATCH
     payload    String    // Serialized JSON payload
     timestamp  DateTime  @default(now())
     synced     Boolean   @default(false)
     syncedAt   DateTime?
     retries    Int       @default(0)
     error      String?
     propertyId String?

     @@index([synced])
     @@index([timestamp])
   }
   ```
3. **`src/lib/offline-db.ts`**:
   - IndexedDB and client-side transaction queue helper.
   - Captures front-end actions when offline, ensuring immediate UI feedback without waiting for server network responses.

---

## 🔄 PHASE 3 — Cloud Synchronization Engine
**Status:** Completed ✅

### Purpose:
Provide automated upstream replication of locally accumulated offline transactions to the remote central server.

### Key Implementation Details:
1. **`src/lib/sync-manager.ts`**:
   - Background polling daemon running every 15 seconds.
   - Detects reconnection transitions (offline ➔ online).
   - Iterates through pending queue items, dispatches API requests, marks successful entries as synced, and tracks failed attempts with retry backoff.
2. **`src/app/api/sync/route.ts`**:
   - Batch sync endpoint that receives accumulated transaction records.
   - Validates user sessions and applies records in topological order (Bookings ➔ Guests ➔ Orders ➔ Payments).
3. **`src/app/api/sync/status/route.ts` & `src/app/api/health/route.ts`**:
   - Operational probes reporting queue depth, connectivity state, database latency, and timestamp verification.

---

## ⚡ PHASE 4 — Conflict Resolution System
**Status:** Completed ✅

### Purpose:
Gracefully handle cases where the same room or order record was modified both locally while offline and on the remote server by another property branch.

### Key Implementation Details:
1. **`src/lib/conflict-resolver.ts`**:
   - Provides deterministic conflict resolution algorithms (`LATEST_WINS`, `LOCAL_WINS`, `CLOUD_WINS`, `MANUAL`).
   - Automatically tracks conflicting mutations with timestamps and payload snapshots.
2. **`src/app/api/sync/conflicts/route.ts`**:
   - REST endpoints to query and manually resolve pending data discrepancies.
3. **`src/components/common/ConflictBadge.tsx`**:
   - Reactive badge component rendered in the navigation header.
   - Opens a diff inspection modal allowing administrative staff to review and choose which version ("Keep Local" vs "Keep Cloud") to retain.

---

## 📊 PHASE 5 — User Interface & Status Indicators
**Status:** Completed ✅

### Purpose:
Provide clear, real-time feedback to front desk and restaurant staff regarding current operational status.

### Component Overview:
**`src/components/common/OfflineSyncStatus.tsx`**
- Fixed floating indicator in the bottom-right viewport:
  - 🟢 **Online — Fully Synced**: Normal connected state.
  - 🔴 **Offline — X items stored locally**: Notifies staff that work continues securely off-grid.
  - 🔄 **Syncing... (X items)**: Actively transmitting accumulated data upon reconnection.
  - ✅ **Sync Complete!**: Confirms all records successfully backed up to the cloud.

---

## 💾 PHASE 6 — Automated Multi-Tier Backup
**Status:** Completed ✅

### Purpose:
Prevent data loss in hardware failure or operating system crashes during long-term offline operation.

### Key Implementation Details:
1. **`scripts/offline-backup.js`**:
   - Generates automated snapshots of `dev.db` every 30 minutes.
   - Stores archives under `Desktop/Hotel-PMS-Backups/offline/` (with fallback to project `backups/`).
   - Automatically detects local Google Drive desktop sync folders and replicates copies into the cloud whenever network is available.
   - Automatically prunes older backups, retaining the 20 most recent snapshots.

---

## 🛠️ Operational Command Reference

| Command | Description |
|---|---|
| `npm run setup:offline` | Initializes database schemas, super-admin account, and backup directories. |
| `npm run offline:dev` | Runs local browser mode with offline capabilities enabled. |
| `npm run electron-dev` | Launches the standalone Electron desktop client with embedded server. |
| `npm run offline:backup` | Triggers an immediate database backup snapshot to disk. |
| `npm run build-win` | Builds the production Windows standalone installer (`.exe`). |
| `npm run build-mac` | Builds the production macOS installer (`.dmg`). |

---

*Document Revision: Production 1.0.0*  
*Project: GuestFlow PMS*
