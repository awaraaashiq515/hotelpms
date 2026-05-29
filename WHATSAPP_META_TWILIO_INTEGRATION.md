# 💬 Meta Cloud API & Twilio WhatsApp Integration Plan

Yeh guide aapko batayegi ki **Meta Cloud API** aur **Twilio WhatsApp API** dono ko ek hi webhook handler se dynamically kaise support karna hai. Hamein ek switchable provider mechanism banana hoga taaki admin settings se select kar sake ki use **Meta** chalana hai ya **Twilio**.

---

## 🛠️ 1. Database Configuration (Prisma Schema Updates)

Hamein [schema.prisma](file:///Users/ritchie/Desktop/live%20website%20/posendwebsite/prisma/schema.prisma) ke `Property` model ya ek global config table me Meta aur Twilio ke credentials save karne ke liye fields badhani hongi.

Add these fields to the `Property` model:
```prisma
whatsAppProvider     String              @default("META") // "META" | "TWILIO" | "ULTRAMSG"
metaAccessToken      String?                              // Meta permanent system user access token
metaPhoneId          String?                              // Meta Phone Number ID
metaVerifyToken      String?                              // Webhook verification challenge string
twilioAccountSid     String?                              // Twilio Account SID
twilioAuthToken      String?                              // Twilio Auth Token
twilioFromNumber     String?                              // Twilio Sandbox/Live WhatsApp number
```

Migration command run karein:
```bash
npx prisma migrate dev --name add_whatsapp_credentials
```

---

## 📥 2. Webhook Inbound Handling (`POST` & `GET` Endpoints)

Meta verification ke liye `GET` request bhejta hai (challenge verification), jabki Twilio directly `POST` request bhejta hai. Hamein dono cases handle karne honge in:
`src/app/api/webhooks/whatsapp/route.ts`

### A. Meta Verification (`GET` Method)
Meta demands a verify challenge response. Write this in your GET request handler:

```typescript
// GET verification handler for Meta Cloud API Webhook
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode && token) {
    if (mode === 'subscribe') {
      // Find active property configurations having this verification token
      const property = await prisma.property.findFirst({
        where: { metaVerifyToken: token }
      });
      
      if (property || token === process.env.GLOBAL_META_VERIFY_TOKEN) {
        console.log('Meta Webhook Verified Successfully');
        return new NextResponse(challenge, { status: 200 });
      }
    }
  }
  return NextResponse.json({ error: 'Verification failed' }, { status: 403 });
}
```

### B. Handling Multi-Provider Payloads (`POST` Method)
Incoming payloads of Meta and Twilio are structured differently. Here is how we map them:

```typescript
export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';
    let body: any = {};
    let messageText = '';
    let senderPhone = '';
    let providerUsed: 'META' | 'TWILIO' = 'META';

    // 1. Parse Inbound Body based on Content Type
    if (contentType.includes('application/x-www-form-urlencoded')) {
      // Twilio usually sends URL-encoded form data
      const formData = await req.formData();
      body = Object.fromEntries(formData.entries());
      
      senderPhone = (body.From as string)?.replace('whatsapp:', '').replace('+', '').trim();
      messageText = body.Body as string;
      providerUsed = 'TWILIO';
    } else {
      // Meta sends standard JSON payload
      body = await req.json();
      
      // Meta nested structure check
      const entry = body.entry?.[0];
      const change = entry?.changes?.[0];
      const val = change?.value;
      const messageObj = val?.messages?.[0];
      
      if (messageObj) {
        senderPhone = messageObj.from; // Sender phone number
        messageText = messageObj.text?.body || '';
        providerUsed = 'META';
      }
    }

    if (!senderPhone || !messageText) {
      return NextResponse.json({ success: true, message: 'No message extracted' });
    }

    // 2. Fetch/Start Customer State Machine Session
    const session = await getOrCreateSession(senderPhone);

    // 3. Process with Gemini NLP Engine (Menu matching + intent detection)
    const responseText = await processMessageWithAI(messageText, session);

    // 4. Dispatch Reply back to User via active provider
    if (providerUsed === 'TWILIO') {
      await sendTwilioMessage(senderPhone, responseText);
    } else {
      await sendMetaMessage(senderPhone, responseText);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
```

---

## 📤 3. Outbound Messaging Handlers

Hamein dono providers ke liye dynamic payload post methods likhne honge:

### A. Meta Outbound (Graph API)
```typescript
async function sendMetaMessage(toPhone: string, text: string) {
  const property = await prisma.property.findFirst({
    where: { whatsAppProvider: 'META' }
  });
  
  if (!property || !property.metaAccessToken || !property.metaPhoneId) {
    throw new Error('Meta API credentials missing');
  }

  const res = await fetch(`https://graph.facebook.com/v20.0/${property.metaPhoneId}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${property.metaAccessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: toPhone,
      type: 'text',
      text: { body: text }
    })
  });

  const responseData = await res.json();
  if (!res.ok) {
    console.error('Meta Send Error:', responseData);
    throw new Error(responseData.error?.message || 'Meta API failed');
  }
}
```

### B. Twilio Outbound (REST API)
```typescript
async function sendTwilioMessage(toPhone: string, text: string) {
  const property = await prisma.property.findFirst({
    where: { whatsAppProvider: 'TWILIO' }
  });

  if (!property || !property.twilioAccountSid || !property.twilioAuthToken || !property.twilioFromNumber) {
    throw new Error('Twilio API credentials missing');
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${property.twilioAccountSid}/Messages.json`;
  const auth = Buffer.from(`${property.twilioAccountSid}:${property.twilioAuthToken}`).toString('base64');

  const params = new URLSearchParams();
  params.append('To', `whatsapp:+${toPhone}`);
  params.append('From', `whatsapp:${property.twilioFromNumber}`);
  params.append('Body', text);

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: params
  });

  const responseData = await res.json();
  if (!res.ok) {
    console.error('Twilio Send Error:', responseData);
    throw new Error(responseData.message || 'Twilio API failed');
  }
}
```

---

## 🎛️ 4. Key Differences to Keep in Mind

| Detail | Meta Cloud API | Twilio WhatsApp API |
| :--- | :--- | :--- |
| **Inbound Message Type** | Direct JSON payload from Meta | Form-URL-Encoded content from Twilio |
| **Webhook Validation** | Required `GET` verification challenge | Signature header encryption matching |
| **Phone Number Setup** | Configured directly in Meta Developer console | Virtual WhatsApp Numbers leased from Twilio |
| **Auth Headers** | `Bearer <AccessToken>` | Basic Auth (`AccountSid:AuthToken`) |
| **Pricing Models** | Conversation-based billing (Meta Direct) | Twilio lease markup + Meta conversation fee |
