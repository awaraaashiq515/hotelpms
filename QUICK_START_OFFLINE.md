# 🏨 GuestFlow PMS — Offline Mode User & Administrator Guide
### Uninterrupted Hotel & Restaurant Operations During Power & Internet Outages

---

## ⚡ How the Offline System Operates

1. **When Power or Internet is Lost:**
   - The GuestFlow PMS desktop application continues operating seamlessly on your local computer or laptop.
   - Front desk staff can check guests in and out, assign rooms, process food & beverage orders (KOT), print thermal receipts, and issue invoices without any network connection.
   - All transactions are securely written to your local encrypted database (`dev.db`).
   - A red indicator in the bottom-right corner shows **🔴 Offline Mode** along with the count of locally queued actions.

2. **When Power or Internet is Restored:**
   - The system automatically detects internet connectivity in the background.
   - The indicator switches to **🔄 Syncing... (X items)**.
   - All transactions recorded while offline are dispatched and committed to the central cloud server.
   - Once finished, the indicator displays **🟢 Online — Fully Synced** and confirms zero data loss.

---

## 🚀 One-Time Initial Setup (Run Once)

Open your terminal or command prompt in the project root directory and execute:

```bash
npm run setup:offline
```

This automated setup:
1. Generates and synchronizes the local Prisma database schema.
2. Creates the default Local Super Administrator account:
   - **Email:** `admin@guestflow.local`
   - **Password:** `Admin@123`
   - **Role:** `SUPER_ADMIN`
3. Initializes backup folders (`Desktop/Hotel-PMS-Backups/` or project `backups/`).

---

## 💻 Daily Usage Instructions

### Option 1: Desktop Application (Recommended)
Launch the desktop client with embedded server:
```bash
npm run electron-dev
```
Or double-click the installed **GuestFlow PMS** desktop shortcut.

### Option 2: Local Web Browser Mode
If accessing from a secondary tablet or terminal on the local network:
```bash
npm run offline:dev
```
Then navigate to: `http://localhost:3000/login`

---

## 📋 Status Indicator Legend

The status widget in the lower right of your screen provides real-time state awareness:

| Visual Indicator | Operational State | Recommended Action |
|---|---|---|
| 🟢 **Online — Fully Synced** | Internet is active and all local records are up-to-date in the cloud. | None required; proceed with standard operations. |
| 🔴 **Offline — X items stored locally** | Network or power is down; records are persisting safely on the local hard drive. | Continue regular billing, check-ins, and kitchen order ticketing normally. |
| 🔄 **Syncing... (X items)** | Connectivity was re-established; queued actions are being uploaded to cloud. | Allow a few seconds for data transmission to finish. |
| ✅ **Sync Complete!** | Synchronization finished with zero errors. | The notification will dismiss automatically after 5 seconds. |
| ⚠️ **X Conflicts** | Conflicting updates were detected between local and cloud states. | Click the badge to review and choose which record to keep ("Keep Local" or "Keep Cloud"). |

---

## 💾 Automated Local Backup System

Your local database is archived every 30 minutes to guard against unexpected hardware issues:
- **Primary Archive Path:** `Desktop/Hotel-PMS-Backups/offline/` (or `backups/offline/`)
- **Cloud Mirror:** If Google Drive for Desktop is installed, backups are mirrored to Google Drive automatically.

To trigger an instant manual backup at any time:
```bash
npm run offline:backup
```

---

## ❓ Frequently Asked Questions (FAQ)

**Q1: Can we print receipts and kitchen tickets (KOT) while the internet is down?**  
Yes. Thermal printers connected via USB, COM, or local Bluetooth interface directly with the local POS terminal and function without internet.

**Q2: What happens if the internet remains offline for several days?**  
All operations continue unimpeded. The local database will hold days or weeks of transactions and synchronize automatically once connectivity returns.

**Q3: How do I reset or verify the local administrator credentials?**  
Run the following command from the terminal:
```bash
node scripts/create-local-admin.js admin@guestflow.local Admin@123
```
Then log in with your updated password.
