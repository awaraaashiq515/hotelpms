# 🤖 GuestFlow — AI Agent Integration Plan
### Claude API + Gemini API | Auto Error Checking + Smart Automation

> **Status:** Planning Phase  
> **Target:** Claude Sonnet as primary reasoning AI + Gemini Flash as fast tasks AI  
> **Date:** November 2026

---

## 📌 Overview — Kya Banana Hai?

Is plan mein hum **Claude API (Anthropic)** ko GuestFlow mein integrate karenge taake:

1. **AI khud errors/bugs dhunde** — codebase ya runtime errors auto-check kare
2. **AI Agent bane** — hotel ke kaam apne aap kare (decisions le, actions kare)
3. **Dual AI System** — Claude (sochna/reasoning) + Gemini (fast content) dono saath chalein

---

## 🧠 Part 1 — Claude API Setup

### Step 1.1 — Package Install

```bash
npm install @anthropic-ai/sdk
```

### Step 1.2 — Environment Variables (`.env.local`)

```env
# Claude (Anthropic)
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxx

# Gemini (already existing)
GEMINI_API_KEY=AIzaSy_xxxxxxxxxxxxxxxxxxxx

# AI Provider selection (claude | gemini | auto)
AI_PROVIDER=auto
```

### Step 1.3 — Claude Client Library banao

**File:** `src/lib/claude.ts`

```typescript
import Anthropic from '@anthropic-ai/sdk';

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Smart AI router — Claude ya Gemini decide kare task ke hisaab se
export type AITask = 
  | 'reasoning'      // Claude → complex decisions
  | 'content'        // Gemini → blog, SEO, descriptions
  | 'error-check'    // Claude → code/data analysis
  | 'chat'           // Claude → concierge conversations
  | 'ocr'            // Gemini → image/menu scanning
  | 'analytics';     // Claude → business intelligence

export function getAIProvider(task: AITask): 'claude' | 'gemini' {
  const provider = process.env.AI_PROVIDER || 'auto';
  if (provider !== 'auto') return provider as 'claude' | 'gemini';
  
  const claudeTasks: AITask[] = ['reasoning', 'error-check', 'chat', 'analytics'];
  return claudeTasks.includes(task) ? 'claude' : 'gemini';
}
```

---

## 🔍 Part 2 — AI Auto Error Checker (Sabse Zaruri!)

### Kya Karega?
- **Runtime errors** API calls mein pakdega
- **Data inconsistencies** dhundega (e.g., room booked but guest not checked in)
- **Business rule violations** check karega (e.g., bill closed bina payment ke)
- **Stock alerts** dega (inventory negative ho gai)
- **Nightly audit** — raat ko khud check karega sab theek hai ya nahi

### Step 2.1 — Error Checker API Route

**File:** `src/app/api/ai/error-check/route.ts`

```typescript
import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { checkType } = await req.json();
    
    // Data gather karo database se
    const data = await gatherDataForCheck(checkType);
    
    // Claude se check karwao
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: `You are a hotel PMS audit AI. Analyze this data and find any errors, inconsistencies, or issues:

Check Type: ${checkType}
Data: ${JSON.stringify(data, null, 2)}

Return JSON format:
{
  "issues": [
    {
      "severity": "critical|warning|info",
      "type": "string",
      "description": "string", 
      "affectedRecord": "id or name",
      "suggestedFix": "string"
    }
  ],
  "summary": "string",
  "totalIssues": number,
  "isHealthy": boolean
}`
      }]
    });
    
    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    const result = JSON.parse(responseText.replace(/```json/g, '').replace(/```/g, '').trim());
    
    return apiResponse(result);
  } catch (error: any) {
    return apiError(error.message, 500);
  }
}

async function gatherDataForCheck(checkType: string) {
  switch (checkType) {
    case 'billing':
      return {
        openBills: await prisma.bill.findMany({ 
          where: { status: 'OPEN' },
          take: 50,
          orderBy: { createdAt: 'desc' }
        }),
      };
    case 'rooms':
      return {
        rooms: await prisma.room.findMany({ take: 100 }),
      };
    case 'inventory':
      return {
        // inventory items with low stock
      };
    default:
      return {};
  }
}
```

### Step 2.2 — Scheduled Auto-Check (Nightly Audit)

**File:** `src/app/api/ai/nightly-audit/route.ts`

```typescript
// Ye API raat ko automatically call hoti hai (cron job se)
// Ya admin dashboard se manual trigger bhi ho sakta hai

export async function GET() {
  const checks = ['billing', 'rooms', 'inventory', 'staff', 'reservations'];
  const results = [];
  
  for (const check of checks) {
    const res = await fetch('/api/ai/error-check', {
      method: 'POST',
      body: JSON.stringify({ checkType: check })
    });
    results.push(await res.json());
  }
  
  // Critical issues pe notification bhejo
  const criticalIssues = results
    .flatMap(r => r.issues || [])
    .filter(i => i.severity === 'critical');
    
  if (criticalIssues.length > 0) {
    // Email/WhatsApp alert bhejo manager ko
    await sendCriticalAlert(criticalIssues);
  }
  
  return apiResponse({ 
    auditCompleted: true, 
    totalChecks: checks.length,
    results 
  });
}
```

---

## 🤖 Part 3 — AI Agent Tasks List

### Ye sab kaam AI Agent khud kar sakta hai:

---

### 🏨 HOTEL OPERATIONS AGENT

| Task | AI Kya Karega | Priority |
|------|--------------|----------|
| **Room Status Check** | Khud check kare koi room dirty hai, maintenance pending hai, ya guest checkout miss hua | 🔴 High |
| **Guest Complaint Handler** | Guest message/complaint padhe, category kare (housekeeping/maintenance/billing), ticket banaye | 🔴 High |
| **Late Checkout Decision** | Guest ki history dekhe, room demand dekhe, aur khud decide kare late checkout approve kare ya nahi | 🟡 Medium |
| **Upsell Suggestions** | Guest check-in ke waqt spa/restaurant/tour recommend kare based on booking history | 🟡 Medium |
| **Early Warning System** | Agar koi payment pending hai ya room service bahut late hai to manager ko alert kare | 🔴 High |

---

### 🍽️ RESTAURANT/POS AGENT

| Task | AI Kya Karega | Priority |
|------|--------------|----------|
| **Low Stock Alert** | Inventory dekhe, aur automatic purchase order draft kare | 🔴 High |
| **Menu Price Optimizer** | Sales data dekhe, suggest kare kon si item ka price badhana chahiye | 🟡 Medium |
| **Wastage Analyzer** | Daily waste log padhe, pattern nikale (konsa item zyada waste ho raha), reason suggest kare | 🟡 Medium |
| **Peak Hour Predictor** | Last 30 days ka data dekhe, aaj ke rush hours predict kare, staff suggest kare | 🟢 Low |
| **KOT Delay Monitor** | Agar koi KOT 20+ min se pending hai, chef aur manager ko auto-alert kare | 🔴 High |

---

### 💰 FINANCE & BILLING AGENT

| Task | AI Kya Karega | Priority |
|------|--------------|----------|
| **Daily Revenue Summary** | Raat ko khud report banaye: total revenue, top items, comparison with yesterday | 🔴 High |
| **Anomaly Detection** | Unusual transactions dhunde (e.g., bahut bada discount, void order, bina reason refund) | 🔴 High |
| **GST Compliance Check** | Bills mein GST sahi laga ya nahi, missing GSTIN check kare | 🟡 Medium |
| **Expense Categorizer** | Naye expenses ko khud category mein dalna | 🟢 Low |
| **Pending Payment Chaser** | Agar koi B2B payment pending hai, automated reminder draft kare | 🟡 Medium |

---

### 👥 STAFF MANAGEMENT AGENT

| Task | AI Kya Karega | Priority |
|------|--------------|----------|
| **Attendance Analyzer** | Absences pattern dhunde, alert kare agar koi staff zyada absent hai | 🟡 Medium |
| **Performance Scorer** | Orders handled, complaints resolved, tips received — score banaye | 🟢 Low |
| **Shift Planner** | Based on predicted rush hours, suggest optimal staff schedule | 🟢 Low |
| **Leave Approval Assistant** | Leave request padhe, check kare koi conflict to nahi, suggestion de approve/reject | 🟡 Medium |

---

### 🧹 HOUSEKEEPING AGENT

| Task | AI Kya Karega | Priority |
|------|--------------|----------|
| **Priority Room Queue** | Checkout rooms pehle assign kare, VIP rooms priority pe rakhe | 🔴 High |
| **Maintenance Auto-Ticket** | Guest complaint se automatically maintenance ticket banaye correct department pe | 🔴 High |
| **Deep Clean Scheduler** | Based on room history, suggest kab deep clean karni chahiye | 🟢 Low |

---

### 🛎️ CONCIERGE AI AGENT (Already Partial — Enhance Karo)

| Task | AI Kya Karega | Priority |
|------|--------------|----------|
| **24/7 Guest Chat** | Guest ke sawaalon ke jawab de (WiFi, checkout time, facilities) | 🔴 High |
| **Local Recommendations** | Guest ki location aur preferences se tours/restaurants suggest kare | 🟡 Medium |
| **Cab/Tour Booking** | Guest request pe booking form pre-fill kare | 🟡 Medium |
| **Complaint Escalation** | Agar AI solve nahi kar pa raha, human staff ko auto-escalate kare | 🔴 High |

---

## 🏗️ Part 4 — Implementation Architecture

```
┌─────────────────────────────────────────────────┐
│                  GuestFlow PMS                   │
├─────────────────────────────────────────────────┤
│                                                   │
│  ┌──────────────┐    ┌──────────────────────┐   │
│  │  Admin Panel  │    │   AI Command Center   │   │
│  │  Dashboard   │───▶│  /admin/ai-dashboard  │   │
│  └──────────────┘    └──────────┬───────────┘   │
│                                  │                │
│         ┌────────────────────────┼──────────┐    │
│         ▼                        ▼          ▼    │
│  ┌─────────────┐  ┌─────────────────┐  ┌──────┐ │
│  │ Error Checker│  │  Agent Router   │  │ Audit│ │
│  │ /api/ai/    │  │ /api/ai/agent/  │  │ Cron │ │
│  │ error-check │  │ run             │  │      │ │
│  └──────┬──────┘  └───────┬─────────┘  └──┬───┘ │
│         │                  │               │      │
│         └──────────────────┴───────────────┘      │
│                            │                       │
│               ┌────────────┴────────────┐          │
│               ▼                         ▼          │
│        ┌────────────┐           ┌─────────────┐   │
│        │  CLAUDE AI  │           │  GEMINI AI  │   │
│        │  (Reasoning)│           │  (Content)  │   │
│        │  Sonnet 4.5 │           │  Flash      │   │
│        └────────────┘           └─────────────┘   │
│                                                   │
└─────────────────────────────────────────────────┘
```

---

## 📂 Part 5 — Files Jo Banani Hain

### New Files (banana hai):

```
src/
├── lib/
│   ├── claude.ts                    ← Claude client + AI router
│   └── ai-agent.ts                  ← Agent orchestrator
│
├── app/api/ai/
│   ├── error-check/route.ts         ← Error checking endpoint
│   ├── nightly-audit/route.ts       ← Scheduled audit
│   ├── agent/
│   │   ├── run/route.ts             ← Agent task runner
│   │   ├── billing/route.ts         ← Billing agent
│   │   ├── inventory/route.ts       ← Inventory agent
│   │   ├── housekeeping/route.ts    ← Housekeeping agent
│   │   └── analytics/route.ts      ← Analytics agent
│   │
│   └── dashboard/route.ts           ← AI dashboard data
│
└── app/admin/ai-dashboard/
    └── page.tsx                      ← AI Command Center UI
```

### Existing Files (modify karne hain):

```
src/lib/ai-concierge-engine.ts       ← Claude support add karo
src/app/api/ai/blog-generate/route.ts ← Dual provider support
src/app/api/ai/scan-menu/route.ts    ← Keep Gemini (best for OCR)
```

---

## 🖥️ Part 6 — AI Command Center Dashboard

**File:** `src/app/admin/ai-dashboard/page.tsx`

### UI Components:

```
┌─────────────────── AI Command Center ───────────────────┐
│                                                           │
│  🤖 AI Status    ✅ Claude Connected  ✅ Gemini Connected │
│                                                           │
│  ┌─────────────┐ ┌─────────────┐ ┌──────────────────┐   │
│  │ Run Error   │ │ Nightly     │ │  Agent Tasks     │   │
│  │ Check Now   │ │ Audit       │ │  Queue           │   │
│  └─────────────┘ └─────────────┘ └──────────────────┘   │
│                                                           │
│  📊 Last Audit Results (3 issues found)                  │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ 🔴 CRITICAL: Bill #1234 closed without payment      │ │
│  │ 🟡 WARNING: Room 204 dirty for 3+ hours             │ │
│  │ 🟢 INFO: Stock for 'Butter' below reorder level    │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                           │
│  💬 Ask AI Anything                                      │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ "Aaj kitni revenue aayi?" / "Koi bug hai?"          │ │
│  └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

## ⚙️ Part 7 — Implementation Order (Step by Step)

### 🏁 Phase 1 — Foundation (Week 1)
- [ ] `npm install @anthropic-ai/sdk`
- [ ] `.env.local` mein `ANTHROPIC_API_KEY` add karo
- [ ] `src/lib/claude.ts` banao (Claude client)
- [ ] `src/lib/ai-agent.ts` banao (agent orchestrator)

### 🔍 Phase 2 — Error Checker (Week 1-2)
- [ ] `src/app/api/ai/error-check/route.ts` banao
- [ ] `src/app/api/ai/nightly-audit/route.ts` banao
- [ ] Admin dashboard mein "Run AI Audit" button add karo
- [ ] Test karo — Claude sahi errors pakad raha hai ya nahi

### 🤖 Phase 3 — Agents (Week 2-3)
- [ ] Billing Agent banao
- [ ] Inventory Agent banao
- [ ] Housekeeping Agent banao
- [ ] Analytics Agent banao
- [ ] Concierge Agent upgrade karo (Claude se)

### 🖥️ Phase 4 — AI Dashboard (Week 3-4)
- [ ] `src/app/admin/ai-dashboard/page.tsx` banao
- [ ] Real-time audit results show karo
- [ ] Manual agent triggers add karo
- [ ] AI chat interface add karo

### 🔄 Phase 5 — Automation (Week 4+)
- [ ] Cron job setup karo nightly audit ke liye
- [ ] WhatsApp alerts for critical issues
- [ ] Email digest for daily AI summary
- [ ] Fine-tune Claude prompts based on results

---

## 💡 Part 8 — Claude vs Gemini — Konsa Kab Use Karo?

| Situation | Use Karo | Reason |
|-----------|----------|--------|
| Guest chat / concierge | **Claude** | Better conversation, context memory |
| Error/bug detection | **Claude** | Better at analysis and reasoning |
| Business analytics | **Claude** | Complex multi-step reasoning |
| Blog/SEO content | **Gemini** | Already working, good at content |
| Menu photo scanning (OCR) | **Gemini** | Better vision/image understanding |
| Product descriptions | **Gemini** | Fast and cheap for content |
| Code review | **Claude** | Excellent code analysis |
| Anomaly detection | **Claude** | Pattern recognition in data |

---

## 🔐 Part 9 — API Key Settings Page

**Existing settings page mein add karo:**
- Claude API Key field (ANTHROPIC_API_KEY)
- Test connection button
- Provider preference selector (Auto / Claude Only / Gemini Only)
- Usage stats (tokens used, cost estimate)

**DB Schema update (prisma/schema.prisma):**
```prisma
model Settings {
  // ... existing fields ...
  claudeApiKey    String?   // Claude (Anthropic) API key
  aiProvider      String    @default("auto") // auto | claude | gemini
  aiAuditEnabled  Boolean   @default(true)
  aiAuditTime     String    @default("02:00") // 2 AM audit
}
```

---

## 📊 Part 10 — Cost Estimate

| AI Task | Model | Est. Daily Usage | Est. Monthly Cost |
|---------|-------|-----------------|-------------------|
| Error Checks (5x/day) | Claude Sonnet | ~10K tokens/day | ~\$4-6/month |
| Nightly Audit | Claude Sonnet | ~15K tokens/night | ~\$6-9/month |
| Guest Concierge Chats | Claude Haiku | ~20K tokens/day | ~\$2-3/month |
| Blog Generation | Gemini Flash | ~5K tokens/week | ~\$0.5/month |
| Menu OCR | Gemini Flash | ~2K tokens/week | ~\$0.2/month |
| **Total Estimate** | | | **~\$13-19/month** |

> 💡 **Tip:** Claude Haiku use karo simple tasks ke liye (cost kam hogi). Claude Sonnet sirf complex reasoning ke liye.

---

## ✅ Ready to Start?

**Pehla kaam:**
1. Anthropic ka account banao → [console.anthropic.com](https://console.anthropic.com)
2. API key lo
3. `.env.local` mein add karo: `ANTHROPIC_API_KEY=sk-ant-...`
4. `npm install @anthropic-ai/sdk`
5. Mujhe batao — main pehle **Error Checker** banata hoon ya **AI Dashboard** pehle?

---

*Plan ready by: Antigravity AI | GuestFlow Project | Nov 2026*

