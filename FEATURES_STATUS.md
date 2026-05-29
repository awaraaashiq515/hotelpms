# OrderMint: Features Status Report & Gap Analysis
This document outlines the detailed feature status of the **OrderMint AI Restaurant Operating System** project. It distinguishes what has been implemented (complete with file references) and what remains to be built.

---

## 🛠️ 1. Core Architecture & Tech Stack Status

| Component | Requested Stack | Current Implementation | Status |
| :--- | :--- | :--- | :--- |
| **Frontend** | Next.js + React | Next.js 16 + React 19 + Tailwind CSS | ✅ Implemented |
| **Mobile App** | Flutter | Unified Next.js app wrapped via **Capacitor** ([package.json](file:///Users/ritchie/Desktop/live%20website%20/posendwebsite/package.json#L17-L19)) | ⚠️ Wrapped Web (Not Flutter) |
| **Desktop App** | - | Unified Next.js app wrapped via **Electron** ([package.json](file:///Users/ritchie/Desktop/live%20website%20/posendwebsite/package.json#L64-L65)) | ✅ Implemented |
| **Database** | PostgreSQL | SQLite (`dev.db`) | ⚙️ Dev Environment (SQLite) |
| **Caching** | Redis | Not implemented | ❌ Missing |
| **Analytics Engine** | ClickHouse | Not implemented | ❌ Missing |
| **Search Engine** | Elasticsearch | Not implemented | ❌ Missing |
| **Real-time Layer**| Socket.IO | HTTP Polling (10-15s intervals) | ⚠️ Polling (Not WebSockets) |
| **Queue Layer** | Kafka | Not implemented | ❌ Missing |
| **Offline Sync** | CouchDB + PouchDB | IndexedDB Queue ([offline-db.ts](file:///Users/ritchie/Desktop/live%20website%20/posendwebsite/src/lib/offline-db.ts)) + Service Worker ([sw.js](file:///Users/ritchie/Desktop/live%20website%20/posendwebsite/public/sw.js)) | ⚠️ Custom Sync Queue |

---

## ✅ 2. What is Already Built (Bana Hua Hai)

### 💳 POS Billing & Order Desk
Cashier-facing operations, order creation, hold-recall, settlements, and receipt generation.
*   **POS Billing Screen**: [src/app/(dashboard)/billing/page.tsx](file:///Users/ritchie/Desktop/live%20website%20/posendwebsite/src/app/%28dashboard%29/billing/page.tsx) - Cart logic, half/full portion switches, custom variant triggers, guest linking, manual discounts, and payment settling.
*   **Settlement Modal**: [src/components/billing/BillModal.tsx](file:///Users/ritchie/Desktop/live%20website%20/posendwebsite/src/components/billing/BillModal.tsx) - Capturing cash/UPI/card details and closing orders.
*   **KOT Slip rendering**: [src/components/kots/KotSlipModal.tsx](file:///Users/ritchie/Desktop/live%20website%20/posendwebsite/src/components/kots/KotSlipModal.tsx) - Visualizing ticket details.
*   **Offline Mode Queue**: [src/lib/offline-db.ts](file:///Users/ritchie/Desktop/live%20website%20/posendwebsite/src/lib/offline-db.ts) and [src/components/shared/offline-badge.tsx](file:///Users/ritchie/Desktop/live%20website%20/posendwebsite/src/components/shared/offline-badge.tsx) - Backs up orders to IndexedDB during offline state and auto-syncs when connections return.

### 🍳 Kitchen Display System (KDS) & Tokens
Chef-facing dashboard, status trackers, and audio/voice alerts.
*   **KDS Interface**: [src/app/(dashboard)/kitchen-display/page.tsx](file:///Users/ritchie/Desktop/live%20website%20/posendwebsite/src/app/%28dashboard%29/kitchen-display/page.tsx) - Order queue grids, prep timer alerts, status trackers (NEW, PREPARING, READY, SERVED), and multi-station filters.
*   **Voice Alerts (KDS)**: [src/app/(dashboard)/kitchen-display/page.tsx#L270-L300](file:///Users/ritchie/Desktop/live%20website%20/posendwebsite/src/app/%28dashboard%29/kitchen-display/page.tsx#L270-L300) - Synthesizes spoken voice alerts in English or Hindi/Punjabi to announce new tickets or preparations.
*   **Token Status Display (Customer Facing)**: [src/app/order-display/page.tsx](file:///Users/ritchie/Desktop/live%20website%20/posendwebsite/src/app/order-display/page.tsx) - Displays active tokens and calls out "Ready" tokens vocally.

### 📱 Waiter Tablet Panel
Waiter-facing mobile/tablet terminal for table orders.
*   **Tablet Layout**: [src/app/tablet/[id]/page.tsx](file:///Users/ritchie/Desktop/live%20website%20/posendwebsite/src/app/tablet/%5Bid%5D/page.tsx) - Table selections scoped by floor, guest PAX selector, tray builder, double-click order dispatching, and live kitchen ready updates.

### 📦 Inventory & Waste Tracker
Basic backend operations for storage management and spoilage audits.
*   **Wastage Logging API**: [src/app/api/waste/route.ts](file:///Users/ritchie/Desktop/live%20website%20/posendwebsite/src/app/api/waste/route.ts) - Records food items wasted, reasons (burnt, expired, customer return), and costs.
*   **Waste UI**: [src/app/(dashboard)/operations/waste-management/page.tsx](file:///Users/ritchie/Desktop/live%20website%20/posendwebsite/src/app/%28dashboard%29/operations/waste-management/page.tsx).
*   **Stock Ledger Engine**: [src/lib/inventory-utils.ts](file:///Users/ritchie/Desktop/live%20website%20/posendwebsite/src/lib/inventory-utils.ts) - Deducts stock items based on recipe requirements and triggers low-stock alerts.

### 🤝 B2B Supplier Marketplace
Supply-chain and local bulk product trade panel.
*   **Market Catalog**: [src/app/(dashboard)/b2b/market/page.tsx](file:///Users/ritchie/Desktop/live%20website%20/posendwebsite/src/app/%28dashboard%29/b2b/market/page.tsx) - Search and order fresh supplies.
*   **Supplier Panel**: [src/app/(dashboard)/b2b/supplier/page.tsx](file:///Users/ritchie/Desktop/live%20website%20/posendwebsite/src/app/%28dashboard%29/b2b/supplier/page.tsx) - Product updates, HSN/GST configurations, and order management.
*   **Supplier QR Scanning Order Portal**: [src/app/(dashboard)/b2b/supplier/qr/page.tsx](file:///Users/ritchie/Desktop/live%20website%20/posendwebsite/src/app/%28dashboard%29/b2b/supplier/qr/page.tsx).

### 👥 Staff, Drivers, CRM & Loyalty
*   **Driver Incentive Engine**: [src/lib/driverOfferEngine.ts](file:///Users/ritchie/Desktop/live%20website%20/posendwebsite/src/lib/driverOfferEngine.ts) and [src/lib/incentive-utils.ts](file:///Users/ritchie/Desktop/live%20website%20/posendwebsite/src/lib/incentive-utils.ts) - Registers customer-delivering drivers, counts rides/referrals, triggers progress rules, and issues gifts or cash payouts.
*   **Customer & Membership Cards**: POS guest registration and card parsing to apply discounts.
*   **Shift Manager**: [src/app/api/day-closing/shift/[id]/route.ts](file:///Users/ritchie/Desktop/live%20website%20/posendwebsite/src/app/api/day-closing/shift/%5Bid%5D/route.ts) - Logs cash drawer balances, variances, and staff attendance entries.

### 🤖 AI Utilities & Modules
*   **Menu OCR Photo Scanner**: [src/app/api/ai/scan-menu/route.ts](file:///Users/ritchie/Desktop/live%20website%20/posendwebsite/src/app/api/ai/scan-menu/route.ts) - Utilizes Google Gemini 3 Flash to read uploaded menu photos and convert them to database-compatible JSON items.
*   **AI SEO Blog Studio**: [src/app/api/ai/blog-generate/route.ts](file:///Users/ritchie/Desktop/live%20website%20/posendwebsite/src/app/api/ai/blog-generate/route.ts) - Generates website articles using Gemini.
*   **B2B Image Recognition**: [src/lib/ai-product-recognition.ts](file:///Users/ritchie/Desktop/live%20website%20/posendwebsite/src/lib/ai-product-recognition.ts) - Client-side TensorFlow.js MobileNet classifier to identify vegetables and groceries from camera feeds without calling external APIs.
*   **WhatsApp Receipt Dispatch**: [src/lib/whatsapp.ts](file:///Users/ritchie/Desktop/live%20website%20/posendwebsite/src/lib/whatsapp.ts) - Outbound template-driven text bills to WhatsApp clients via UltraMsg API.

---

## ❌ 3. What is Left to Build (Banana Baki Hai)

### 🧠 AI Business Intelligence Engine (Analytics)
No predictive intelligence exists yet. The dashboard [src/app/api/admin/dashboard/route.ts](file:///Users/ritchie/Desktop/live%20website%20/posendwebsite/src/app/api/admin/dashboard/route.ts) runs basic `groupBy` aggregation counts.
*   **Predictive Sales & Analytics**: Forecast daily sales volume, rush hours, seasonal dish popularity, and delivery trends.
*   **AI Advisor Dashboard**: Chat integration or dynamic cards answering *"Why sales dropped today"*, *"Which branch is underperforming"*, and *"Which raw inventory will spoil first"*.
*   **Dynamic Pricing & Promotions**: Suggest automated pricing models based on local demand/expiry risks.

### 💬 WhatsApp Commerce Engine (Conversational Ordering)
Current WhatsApp integration is purely outbound receipt notifications.
*   **Inbound Chatbot Ordering Webhook**: A listener endpoint `/api/webhooks/whatsapp` to parse text orders (e.g. *"1 butter chicken and 2 garlic naan"*).
*   **Regional NLP (Hinglish/Hindi/English)**: Conversational intent handler extracting dish names, quantities, and optional modifiers (spicy, no onions).
*   **Cart & Payment Link Injection**: Sending payment links and pushing order cards directly to the KDS upon successful payment confirmation.

### 🍳 Advanced Kitchen AI
*   **AI Prep Prioritization**: Smart balancing of chef workloads based on active tickets.
*   **Dynamic Prep Delay Alerts**: ETA calculations for bills based on current kitchen heatmaps.

### 📦 Advanced Inventory AI
*   **Purchase Cycles Predictor**: Automated vendor purchase order trigger when stock drops below projected usage limits.
*   **Vendor Comparison Analytics**: Recommending suppliers based on historical invoice rates and delivery speed.

### 🛵 Hyperlocal Delivery & Dispatch AI
*   **Auto Rider Dispatch**: Hyperlocal routing algorithms for delivery staff.
*   **Third-party Aggregator Integration**: Backend connectors and menu sync engines for Swiggy and Zomato APIs. (Currently not implemented).

### 👥 Staff Shift Optimization AI
*   **Predictive Scheduling**: Suggestions to optimize work shifts based on predicted rush hours.

### 🎙️ Voice-Activated Self Ordering
*   **Voice Ordering Input**: Speech-to-cart conversion module in Captain Tablet and Guest QR menus to translate Hindi/English speech into KOT items.

### 🔌 API Marketplace Integrations
*   **Payment Gateways**: Razorpay, Stripe webhooks/API setup.
*   **Accounting Integrations**: QuickBooks, Tally, Zoho sync.
*   **Hotel PMS connectors**: Bridge linking dining checks directly to room reservation folios.
