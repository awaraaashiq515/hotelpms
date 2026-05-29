import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { withGeminiRetry } from '@/lib/gemini-retry';

// GET: Meta Cloud API Webhook Verification Challenge
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    if (mode && token) {
      if (mode === 'subscribe') {
        // Find if any property is configured with this verify token
        const property = await prisma.property.findFirst({
          where: { metaVerifyToken: token },
        });

        const globalVerifyToken = process.env.WHATSAPP_INBOUND_TOKEN || 'ordermint-default-token';

        if (property || token === globalVerifyToken) {
          console.log('[WhatsApp Webhook] Meta Verification Successful');
          return new NextResponse(challenge, { status: 200 });
        } else {
          console.warn('[WhatsApp Webhook] Meta Verification Token Mismatch:', token);
        }
      }
    }
    return NextResponse.json({ error: 'Verification failed' }, { status: 403 });
  } catch (err: any) {
    console.error('[WhatsApp Webhook] GET Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST: Incoming messages from Meta or Twilio
export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';
    let body: any = {};
    let messageText = '';
    let senderPhone = '';
    let recipientPhone = ''; // Phone number of our bot
    let providerUsed: 'META' | 'TWILIO' | 'ULTRAMSG' = 'META';

    // 1. Extract message & sender info based on Content Type
    if (contentType.includes('application/x-www-form-urlencoded')) {
      // Twilio webhook payload
      const formData = await req.formData();
      body = Object.fromEntries(formData.entries());

      senderPhone = (body.From as string)?.replace('whatsapp:', '').replace('+', '').trim() || '';
      recipientPhone = (body.To as string)?.replace('whatsapp:', '').replace('+', '').trim() || '';
      messageText = body.Body as string || '';
      providerUsed = 'TWILIO';
      
      console.log(`[WhatsApp Webhook] Twilio Message from ${senderPhone}: "${messageText}"`);
    } else {
      // Meta (or UltraMsg) Webhook JSON Payload
      body = await req.json();

      // Check if it is a Meta Cloud API payload
      const entry = body.entry?.[0];
      const change = entry?.changes?.[0];
      const val = change?.value;
      const messageObj = val?.messages?.[0];

      if (messageObj) {
        senderPhone = messageObj.from;
        recipientPhone = val?.metadata?.display_phone_number || '';
        messageText = messageObj.text?.body || '';
        providerUsed = 'META';
        console.log(`[WhatsApp Webhook] Meta Message from ${senderPhone}: "${messageText}"`);
      } else if (body.data?.body && body.data?.from) {
        // UltraMsg fallback structure (from existing lib/whatsapp.ts)
        senderPhone = body.data.from.replace('@c.us', '').replace('+', '').trim();
        messageText = body.data.body;
        providerUsed = 'ULTRAMSG';
        console.log(`[WhatsApp Webhook] UltraMsg Message from ${senderPhone}: "${messageText}"`);
      }
    }

    if (!senderPhone || !messageText) {
      // Meta calls the webhook for delivery statuses as well, return 200 to acknowledge
      return NextResponse.json({ success: true, message: 'No inbound message to process' });
    }

    // 2. Load or Create WhatsApp Session
    let session = await prisma.whatsAppSession.findUnique({
      where: { phone: senderPhone },
    });

    // If session is in active support mode, bypass automated parsing unless they want to exit
    if (session && session.state === 'SUPPORT') {
      const cleanMsg = messageText.toLowerCase().trim();
      if (cleanMsg === 'exit' || cleanMsg === 'restart') {
        session = await prisma.whatsAppSession.update({
          where: { id: session.id },
          data: { state: 'GREETING', cart: '[]' },
        });
      } else {
        console.log(`[WhatsApp Webhook] Silent support bypass for ${senderPhone}.`);
        return NextResponse.json({ success: true, message: 'Agent taking care of this chat' });
      }
    }

    // Scan message for property ID (CUID) to bind session
    const words = messageText.split(/\s+/);
    let messagePropertyId = '';
    for (const word of words) {
      const cleanWord = word.replace(/[^a-zA-Z0-9]/g, '');
      if (cleanWord.length >= 20 && cleanWord.length <= 30) {
        const prop = await prisma.property.findUnique({
          where: { id: cleanWord },
        });
        if (prop) {
          messagePropertyId = prop.id;
          break;
        }
      }
    }

    if (!session) {
      session = await prisma.whatsAppSession.create({
        data: {
          phone: senderPhone,
          state: 'GREETING',
          cart: '[]',
          propertyId: messagePropertyId || null,
        },
      });
    } else if (messagePropertyId && session.propertyId !== messagePropertyId) {
      // Switched property / restaurant code, reset state and cart
      session = await prisma.whatsAppSession.update({
        where: { id: session.id },
        data: {
          propertyId: messagePropertyId,
          state: 'GREETING',
          cart: '[]',
        },
      });
    }

    // 3. Fetch Property configurations dynamically based on precedence
    let property: any = null;

    // A. Resolve by UltraMsg instanceId
    const bodyInstanceId = body.instanceId || body.instance_id;
    if (providerUsed === 'ULTRAMSG' && bodyInstanceId) {
      property = await prisma.property.findFirst({
        where: { whatsAppInstanceId: String(bodyInstanceId) },
      });
    }

    // B. Resolve by session's active propertyId if bound
    if (!property && session?.propertyId) {
      property = await prisma.property.findUnique({
        where: { id: session.propertyId },
      });
    }

    // C. Resolve by recipient phone numbers
    if (!property && recipientPhone) {
      property = await prisma.property.findFirst({
        where: {
          OR: [
            { metaPhoneId: recipientPhone },
            { twilioFromNumber: recipientPhone },
            { phone: recipientPhone },
          ],
        },
      });
    }

    // D. Fallback to first property
    if (!property) {
      property = await prisma.property.findFirst();
    }

    if (!property) {
      console.error('[WhatsApp Webhook] No property found in database');
      return NextResponse.json({ error: 'Property not configured' }, { status: 404 });
    }

    // Auto-bind the session to the resolved property if not already bound
    if (session && !session.propertyId) {
      session = await prisma.whatsAppSession.update({
        where: { id: session.id },
        data: { propertyId: property.id },
      });
    }

    // Auto-create or resolve Guest profile in the property's organization for loyalty rewards
    if (property) {
      const guest = await prisma.guest.findFirst({
        where: {
          mobile: senderPhone,
          organizationId: property.organizationId,
        },
      });

      if (!guest) {
        await prisma.guest.create({
          data: {
            organizationId: property.organizationId,
            firstName: 'WhatsApp',
            lastName: `Guest (${senderPhone.slice(-4)})`,
            mobile: senderPhone,
            loyaltyPoints: 0,
          },
        });
      }
    }

    // 4. Load all active products from this property to pass to AI for mapping
    const products = await prisma.product.findMany({
      where: {
        propertyId: property.id,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        sellingPrice: true,
        description: true,
        category: {
          select: {
            name: true,
          },
        },
      },
    });

    // 5. Get AI configuration API key
    let apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      const settings = await prisma.websiteSettings.findFirst();
      apiKey = settings?.geminiApiKey || undefined;
    }

    let aiResult: any;
    if (!apiKey) {
      console.warn('[WhatsApp Webhook] Gemini API key is missing. Using local mock parser fallback.');
      aiResult = parseMessageLocally(session, messageText, session.cart, products);
    } else {
      // 6. Call AI Parser to extract Intent and Cart Items
      aiResult = await parseMessageWithGemini(messageText, session.cart, products, apiKey);
    }

    // 7. Process States & Update Session Cart in SQLite
    const responseText = await processSessionWorkflow(session, aiResult, products, property, messageText);

    // 8. Dispatch Reply back to User via active provider config
    if (providerUsed === 'TWILIO') {
      await sendTwilioMessage(property, senderPhone, responseText);
    } else if (providerUsed === 'META') {
      await sendMetaMessage(property, senderPhone, responseText);
    } else {
      // UltraMsg fallback using existing sendWhatsAppMessage implementation if enabled
      await sendUltraMsgMessage(property, senderPhone, responseText);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[WhatsApp Webhook] POST Webhook Processing Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// AI Message parsing with Gemini 3 Flash
async function parseMessageWithGemini(userText: string, currentCartJson: string, productsList: any[], apiKey: string) {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });

    const menuSummary = productsList
      .map((p) => `ID: ${p.id} | Name: ${p.name} | Category: ${p.category?.name || 'General'} | Price: ₹${p.sellingPrice}`)
      .join('\n');

    const prompt = `You are a conversational AI Waiter for OrderMint restaurant. The customer is messaging on WhatsApp.
Current Cart Items: ${currentCartJson}
User Input: "${userText}"

Here is the Active Restaurant Menu:
${menuSummary}

Analyze the user input to extract their intent, cart items, and details.
You must support English, Hindi, and Hinglish (e.g. "Ek butter chicken aur do garlic naan add karo", "1 burger remove kar do").
Intent mapping:
- "ADD_TO_CART": Customer wants to order/add food items.
- "REMOVE_FROM_CART": Customer wants to remove/reduce items.
- "CLEAR_CART": Customer wants to reset/empty their order.
- "VIEW_CART": Customer asks what's in their order.
- "CHECKOUT": Customer wants to place/confirm order, pay, or checkout.
- "GREETING": Simple hello/greeting or generic conversation.
- "MENU_BROWSE": Customer wants to see the menu, list of food items, categories, or pricing card.
- "TRACK_ORDER": Customer wants to track their order status or ask where their food is.
- "REORDER": Customer wants to repeat, re-order, or duplicate their pichla/last order.
- "SUPPORT": Customer wants help, customer care, support, or a human agent.
- "LOYALTY_CHECK": Customer asks about their loyalty points, rewards, or membership balance.

Return ONLY a valid JSON block matching this structure (no markdown fences, no extra text, just raw JSON):
{
  "intent": "ADD_TO_CART",
  "items": [
    {
      "productId": "id_of_the_item",
      "name": "Exact Name of matched product",
      "quantity": 1,
      "notes": "spicy / less oil / modifier details"
    }
  ],
  "messageText": "Optional short polite conversational note explaining what was done in English (e.g., 'I have added the Spring Roll to your cart!')"
}`;

    const result = await withGeminiRetry(() => model.generateContent(prompt));
    const response = await result.response;
    const text = response.text();

    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error('[WhatsApp Webhook] AI Parser Error:', error);
    return {
      intent: 'GREETING',
      items: [],
      messageText: 'I had trouble understanding your message. Could you please specify your order again? (e.g., "Add 1 Burger and 1 Coke")',
    };
  }
}

// Session workflow state machine logic
interface CartItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  notes?: string;
}

async function processSessionWorkflow(session: any, aiResult: any, productsList: any[], property: any, userRawMessage: string): Promise<string> {
  const propertyId = property.id;
  const currentCart: CartItem[] = JSON.parse(session.cart || '[]');
  let replyText = aiResult.messageText || '';

  // 1. Handle REORDER confirmation state machine flow
  if (session.state === 'CONFIRM_REORDER') {
    const textNormal = (userRawMessage || '').toLowerCase().trim();
    if (textNormal.includes('yes') || textNormal.includes('confirm') || textNormal.includes('haan') || textNormal.includes('ha ')) {
      // Fetch the last completed order items and set them to active cart
      const lastOrder = await prisma.posOrder.findFirst({
        where: {
          deliveryPhone: session.phone,
          status: { not: 'CANCELLED' }
        },
        orderBy: { createdAt: 'desc' },
        include: { items: { include: { product: true } } }
      });
      if (lastOrder) {
        const reorderCart = lastOrder.items.map((item: any) => ({
          productId: item.productId,
          name: item.product.name,
          quantity: item.quantity,
          price: item.unitPrice,
          notes: 'Reordered via Chatbot'
        }));
        await prisma.whatsAppSession.update({
          where: { id: session.id },
          data: {
            cart: JSON.stringify(reorderCart),
            state: 'ORDERING'
          }
        });
        const cartSummary = formatCartSummary(reorderCart);
        replyText = `✅ *Last order added to your cart!*\n\n${cartSummary}\n\n👉 Type *"checkout"* to place the order, or add more items!`;
        return replyText;
      }
    } else {
      // If they said no or something else, cancel reorder check
      await prisma.whatsAppSession.update({
        where: { id: session.id },
        data: { state: 'ORDERING' }
      });
      replyText = 'Okay, let\'s continue with a fresh order. What would you like to add?';
      return replyText;
    }
  }

  // 2. Intent State Machine
  if (aiResult.intent === 'GREETING') {
    const welcome = property.whatsAppWelcomeMessage || `*Welcome to OrderMint!* 🍽️\n\nYou can place your order directly through WhatsApp.`;
    replyText = `${welcome}\n\n*Our popular items:*\n` +
      productsList.slice(0, 4).map(p => `• ${p.name} - ₹${p.sellingPrice}`).join('\n') +
      `\n\nTo place an order, type something like: *"Add 1 Veg Pizza and 2 Cold Coffees"*`;
    
    await prisma.whatsAppSession.update({
      where: { id: session.id },
      data: { state: 'ORDERING' }
    });
  } 
  
  else if (aiResult.intent === 'MENU_BROWSE') {
    const activeProducts = await prisma.product.findMany({
      where: { propertyId, isActive: true },
      include: { category: true }
    });

    if (activeProducts.length === 0) {
      replyText = 'Our digital menu is currently empty. Please check back later!';
    } else {
      const groups: { [key: string]: any[] } = {};
      activeProducts.forEach((p: any) => {
        const catName = p.category?.name || 'General';
        if (!groups[catName]) groups[catName] = [];
        groups[catName].push(p);
      });

      let menuText = `🍽️ *${property.name} Menu* 🍽️\n\n`;
      for (const [catName, items] of Object.entries(groups)) {
        menuText += `*🟢 Category: ${catName}*\n`;
        items.forEach(item => {
          menuText += `• ${item.name} - ₹${item.sellingPrice}\n`;
        });
        menuText += `\n`;
      }
      menuText += `👉 To add items to your cart, reply with: *"Add 1 Paneer Pizza and 2 Cold Coffee"*`;
      replyText = menuText;
    }
  }

  else if (aiResult.intent === 'TRACK_ORDER') {
    const lastOrder = await prisma.posOrder.findFirst({
      where: { deliveryPhone: session.phone, propertyId },
      orderBy: { createdAt: 'desc' }
    });

    if (!lastOrder) {
      replyText = 'We couldn\'t find any recent orders placed from this number.';
    } else {
      let statusIcon = '⏳';
      let statusDesc = 'Processing';
      if (lastOrder.status === 'KOT_RUNNING') {
        statusIcon = '🍳';
        statusDesc = 'Cooking in the kitchen';
      } else if (lastOrder.status === 'READY') {
        statusIcon = '🛍️';
        statusDesc = 'Ready for pickup / delivery!';
      } else if (lastOrder.status === 'COMPLETED' || lastOrder.status === 'SETTLED') {
        statusIcon = '✅';
        statusDesc = 'Delivered & Completed';
      } else if (lastOrder.status === 'CANCELLED') {
        statusIcon = '❌';
        statusDesc = 'Cancelled';
      }

      replyText = `📦 *Live Order Status:* \n\n*Order No:* #${lastOrder.orderNo}\n*Status:* ${statusIcon} ${statusDesc}\n*Total Bill:* ₹${lastOrder.grandTotal.toFixed(2)}\n*Placed On:* ${new Date(lastOrder.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}\n\nWe will notify you immediately once there is a status update!`;
    }
  }

  else if (aiResult.intent === 'REORDER') {
    const lastOrder = await prisma.posOrder.findFirst({
      where: { deliveryPhone: session.phone, propertyId, status: { not: 'CANCELLED' } },
      orderBy: { createdAt: 'desc' },
      include: { items: { include: { product: true } } }
    });

    if (!lastOrder || lastOrder.items.length === 0) {
      replyText = 'We couldn\'t find any previous orders to repeat for your number.';
    } else {
      await prisma.whatsAppSession.update({
        where: { id: session.id },
        data: { state: 'CONFIRM_REORDER' }
      });

      const itemsList = lastOrder.items.map((item: any) => `• ${item.product.name} x${item.quantity}`).join('\n');
      replyText = `🔄 *Repeat Previous Order:* \n\nFound your last order:\n${itemsList}\n\n👉 Would you like to re-order this? Reply with *"yes"* or *"confirm"* to load it into your cart!`;
    }
  }

  else if (aiResult.intent === 'LOYALTY_CHECK') {
    const guest = await prisma.guest.findFirst({
      where: { mobile: session.phone, organizationId: property.organizationId }
    });
    const points = guest ? guest.loyaltyPoints : 0;
    replyText = `🎁 *Loyalty Rewards Balance:* \n\n*Loyalty Points:* ${points} Points\n\n💰 _(You earn 10 points on every successful order! Save points to redeem special discounts on your next dine-in or takeaway!)_`;
  }

  else if (aiResult.intent === 'SUPPORT') {
    await prisma.whatsAppSession.update({
      where: { id: session.id },
      data: { state: 'SUPPORT' }
    });

    await prisma.notification.create({
      data: {
        propertyId,
        title: 'WhatsApp Help Request',
        message: `Customer (+${session.phone}) requested human agent support on WhatsApp. Chatbot is paused.`,
        type: 'ORDER',
        priority: 'HIGH',
      }
    });

    replyText = `📞 *Customer Support Connection* \n\nWe have paused the chatbot. A restaurant executive will take over this chat to assist you directly.\n\n👉 _(If you want to resume the chatbot ordering at any time, just reply with *"exit"* or *"restart"*)_`;
  }
  
  else if (aiResult.intent === 'ADD_TO_CART') {
    aiResult.items.forEach((aiItem: any) => {
      const match = productsList.find(p => p.id === aiItem.productId || p.name.toLowerCase() === aiItem.name.toLowerCase());
      if (match) {
        const existing = currentCart.find(c => c.productId === match.id);
        if (existing) {
          existing.quantity += aiItem.quantity || 1;
          if (aiItem.notes) existing.notes = aiItem.notes;
        } else {
          currentCart.push({
            productId: match.id,
            name: match.name,
            quantity: aiItem.quantity || 1,
            price: match.sellingPrice,
            notes: aiItem.notes,
          });
        }
      }
    });

    const upsell = await getUpsellRecommendation(currentCart, propertyId);
    const cartSummary = formatCartSummary(currentCart);
    replyText = `${replyText || 'Cart updated!'}\n\n${cartSummary}${upsell}\n\n👉 Type *"checkout"* to place the order, or add more items!`;

    await prisma.whatsAppSession.update({
      where: { id: session.id },
      data: {
        cart: JSON.stringify(currentCart),
        state: 'ORDERING',
      },
    });
  } 
  
  else if (aiResult.intent === 'REMOVE_FROM_CART') {
    aiResult.items.forEach((aiItem: any) => {
      const matchIndex = currentCart.findIndex(c => c.productId === aiItem.productId || c.name.toLowerCase() === aiItem.name.toLowerCase());
      if (matchIndex > -1) {
        const item = currentCart[matchIndex];
        item.quantity -= aiItem.quantity || 1;
        if (item.quantity <= 0) {
          currentCart.splice(matchIndex, 1);
        }
      }
    });

    const cartSummary = formatCartSummary(currentCart);
    replyText = `${replyText || 'Items removed.'}\n\n${cartSummary}`;

    await prisma.whatsAppSession.update({
      where: { id: session.id },
      data: { cart: JSON.stringify(currentCart) },
    });
  } 
  
  else if (aiResult.intent === 'CLEAR_CART') {
    replyText = 'Your cart has been cleared. Type items to start a new order.';
    await prisma.whatsAppSession.update({
      where: { id: session.id },
      data: {
        cart: '[]',
        state: 'ORDERING',
      },
    });
  } 
  
  else if (aiResult.intent === 'VIEW_CART') {
    const upsell = await getUpsellRecommendation(currentCart, propertyId);
    replyText = formatCartSummary(currentCart) + upsell;
  } 
  
  else if (aiResult.intent === 'CHECKOUT') {
    if (currentCart.length === 0) {
      replyText = 'Your cart is currently empty. Please add items before checking out.';
    } else {
      const subtotal = currentCart.reduce((s, c) => s + (c.price * c.quantity), 0);
      const tax = subtotal * 0.05; // 5% standard tax
      const total = subtotal + tax;

      const paymentLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/order-display?phone=${session.phone}&pay=success`;

      replyText = `*Order Checkout Summary:* 📝\n` +
        currentCart.map(c => `• ${c.name} x${c.quantity} - ₹${c.price * c.quantity}`).join('\n') +
        `\n\nSubtotal: ₹${subtotal.toFixed(2)}` +
        `\nTax (5%): ₹${tax.toFixed(2)}` +
        `\n*Grand Total: ₹${total.toFixed(2)}*\n\n` +
        `👉 Please click this link to complete your payment:\n${paymentLink}\n\n` +
        `_(Note: For demo testing, you can simply reply with *"pay"* or *"cod"* to send the order directly to the kitchen!)_`;

      await prisma.whatsAppSession.update({
        where: { id: session.id },
        data: { state: 'AWAITING_PAYMENT' },
      });
    }
  }

  // Handle direct test triggers for cash-on-delivery/sandbox payments
  if (session.state === 'AWAITING_PAYMENT') {
    const textNormal = (userRawMessage || '').toLowerCase();
    if (textNormal.includes('pay') || textNormal.includes('cod') || textNormal.includes('cash') || textNormal.includes('confirm')) {
      replyText = await executeOrderCreation(session, currentCart, propertyId);
    }
  }

  return replyText;
}

function formatCartSummary(cart: CartItem[]): string {
  if (cart.length === 0) return '🛒 Your cart is currently empty.';
  const subtotal = cart.reduce((s, c) => s + (c.price * c.quantity), 0);
  
  return `*🛒 Your Current Order:* \n` +
    cart.map(c => `• ${c.name} x${c.quantity} - ₹${c.price * c.quantity} ${c.notes ? `(${c.notes})` : ''}`).join('\n') +
    `\n\n*Subtotal: ₹${subtotal.toFixed(2)}*`;
}

// Database Order & KOT Creation logic
async function executeOrderCreation(session: any, cart: CartItem[], propertyId: string): Promise<string> {
  try {
    const subtotal = cart.reduce((s, c) => s + (c.price * c.quantity), 0);
    const tax = subtotal * 0.05;
    const total = subtotal + tax;

    // Fetch default outlet for this property
    const outlet = await prisma.outlet.findFirst({
      where: { propertyId }
    });

    if (!outlet) {
      throw new Error('No outlet configured for this property');
    }

    const orderNo = `WA-${Date.now().toString().slice(-6)}`;
    const kotNo = `KOT-${Date.now().toString().slice(-4)}`;

    // Create POS Order and KOT Ticket sequentially to map KotItem to PosOrderItem
    const order = await prisma.$transaction(async (tx: any) => {
      const createdOrder = await tx.posOrder.create({
        data: {
          propertyId,
          outletId: outlet.id,
          orderNo,
          orderType: 'TAKEAWAY',
          status: 'KOT_RUNNING',
          subtotal,
          taxAmount: tax,
          grandTotal: total,
          deliveryCustomerName: `WhatsApp Guest (${session.phone.slice(-4)})`,
          deliveryPhone: session.phone,
          items: {
            create: cart.map(c => ({
              productId: c.productId,
              quantity: c.quantity,
              unitPrice: c.price,
              totalAmount: c.price * c.quantity,
              taxAmount: c.price * c.quantity * 0.05,
            }))
          }
        },
        include: {
          items: true
        }
      });

      await tx.kotTicket.create({
        data: {
          kotNo,
          orderId: createdOrder.id,
          propertyId,
          outletId: outlet.id,
          status: 'NEW',
          items: {
            create: cart.map(c => {
              const matchedItem = createdOrder.items.find((oi: any) => oi.productId === c.productId);
              if (!matchedItem) {
                throw new Error(`Failed to find order item for product ${c.productId}`);
              }
              return {
                productId: c.productId,
                itemName: c.name,
                quantity: c.quantity,
                notes: c.notes || 'Ordered via WhatsApp Chatbot',
                orderItemId: matchedItem.id,
              };
            })
          }
        }
      });

      return createdOrder;
    });

    // Reset session cart & state
    await prisma.whatsAppSession.update({
      where: { id: session.id },
      data: {
        cart: '[]',
        state: 'GREETING',
      }
    });

    // Trigger Notification for new order to alert the user dashboard
    await prisma.notification.create({
      data: {
        propertyId,
        title: 'New WhatsApp Order',
        message: `Order #${orderNo} placed via WhatsApp for ₹${total.toFixed(2)}`,
        type: 'ORDER',
        priority: 'HIGH',
      }
    });

    // Award loyalty points to the Guest record
    try {
      const propertyObj = await prisma.property.findUnique({
        where: { id: propertyId }
      });
      if (propertyObj) {
        await prisma.guest.updateMany({
          where: {
            mobile: session.phone,
            organizationId: propertyObj.organizationId
          },
          data: {
            loyaltyPoints: {
              increment: 10
            }
          }
        });
      }
    } catch (e) {
      console.error('[WhatsApp Webhook] Failed to credit loyalty points:', e);
    }

    return `*🎉 Order Placed Successfully!* \n\n` +
      `Your order has been sent to the kitchen and is now being prepared.\n` +
      `*Order No:* #${orderNo}\n` +
      `*KOT No:* #${kotNo}\n` +
      `*Total Bill:* ₹${total.toFixed(2)}\n\n` +
      `We will notify you as soon as your order is ready! Thank you for ordering with OrderMint. 🙏`;
  } catch (err: any) {
    console.error('[WhatsApp Webhook] Order Creation Failed:', err);
    return `There was an issue processing your order: ${err.message}. Please try again later.`;
  }
}

// Twilio REST API integration
async function sendTwilioMessage(property: any, toPhone: string, text: string) {
  console.log(`[WhatsApp Outbound Mock - Twilio] To: ${toPhone} | Text: "${text}"`);
  if (!property.twilioAccountSid || !property.twilioAuthToken || !property.twilioFromNumber || property.twilioAccountSid.startsWith('YOUR_')) {
    console.warn('[WhatsApp Outbound Mock] Twilio credentials not configured or placeholder used. Bypassing actual Twilio HTTP request.');
    return;
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
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params,
  });

  if (!res.ok) {
    const errData = await res.json();
    throw new Error(`Twilio error: ${errData.message}`);
  }
}

// Meta Graph API integration
async function sendMetaMessage(property: any, toPhone: string, text: string) {
  console.log(`[WhatsApp Outbound Mock - Meta] To: ${toPhone} | Text: "${text}"`);
  if (!property.metaAccessToken || !property.metaPhoneId || property.metaAccessToken.startsWith('YOUR_')) {
    console.warn('[WhatsApp Outbound Mock] Meta credentials not configured or placeholder used. Bypassing actual Meta HTTP request.');
    return;
  }

  const url = `https://graph.facebook.com/v20.0/${property.metaPhoneId}/messages`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${property.metaAccessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: toPhone,
      type: 'text',
      text: { body: text },
    }),
  });

  if (!res.ok) {
    const errData = await res.json();
    throw new Error(`Meta Graph API error: ${errData.error?.message || 'Unknown'}`);
  }
}

// UltraMsg HTTP post API integration
async function sendUltraMsgMessage(property: any, toPhone: string, text: string) {
  console.log(`[WhatsApp Outbound Mock - UltraMsg] To: ${toPhone} | Text: "${text}"`);
  if (!property.whatsAppApiKey || !property.whatsAppInstanceId || property.whatsAppApiKey.startsWith('YOUR_') || property.whatsAppApiKey.includes('private-token')) {
    console.warn('[WhatsApp Outbound Mock] UltraMsg credentials not configured or placeholder used. Bypassing actual UltraMsg HTTP request.');
    return;
  }

  const url = `https://api.ultramsg.com/${property.whatsAppInstanceId}/messages/chat`;
  
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      token: property.whatsAppApiKey,
      to: `+${toPhone}`,
      body: text,
    }),
  });

  if (!res.ok) {
    throw new Error('UltraMsg message dispatch failed');
  }
}

// Local mock parser for testing checkout flows when Gemini is not configured
function parseMessageLocally(session: any, userText: string, currentCartJson: string, productsList: any[]) {
  const text = userText.toLowerCase().trim();
  const state = session?.state || 'GREETING';

  if (state === 'CONFIRM_REORDER') {
    if (text.includes('yes') || text.includes('confirm') || text.includes('haan') || text.includes('ha ')) {
      return {
        intent: 'CONFIRM_REORDER',
        items: [],
        messageText: 'yes',
      };
    } else {
      return {
        intent: 'CONFIRM_REORDER',
        items: [],
        messageText: 'no',
      };
    }
  }

  if (text.includes('support') || text.includes('help') || text.includes('agent') || text.includes('human') || text.includes('madad')) {
    return {
      intent: 'SUPPORT',
      items: [],
      messageText: 'Connecting you to support...',
    };
  }

  if (text.includes('track') || text.includes('status') || text.includes('where is') || text.includes('kaha') || text.includes('pahuncha')) {
    return {
      intent: 'TRACK_ORDER',
      items: [],
      messageText: 'Checking order status...',
    };
  }

  if (text.includes('reorder') || text.includes('repeat') || text.includes('pichla') || text.includes('same')) {
    return {
      intent: 'REORDER',
      items: [],
      messageText: 'Fetching your last order details...',
    };
  }

  if (text.includes('loyalty') || text.includes('points') || text.includes('rewards') || text.includes('offer')) {
    return {
      intent: 'LOYALTY_CHECK',
      items: [],
      messageText: 'Fetching your loyalty points balance...',
    };
  }

  if (text.includes('menu') || text.includes('browse') || text.includes('card') || text.includes('bhaav') || text.includes('dishes')) {
    return {
      intent: 'MENU_BROWSE',
      items: [],
      messageText: 'Loading restaurant menu...',
    };
  }
  
  if (text === 'hello' || text === 'hi' || text === 'suno' || text === 'helo' || text === 'greeting') {
    return {
      intent: 'GREETING',
      items: [],
      messageText: 'Hello! Welcome to our restaurant. How can we serve you today?',
    };
  }
  
  if (text.includes('checkout') || text.includes('pay') || text.includes('cod') || text.includes('cash') || text.includes('confirm')) {
    return {
      intent: 'CHECKOUT',
      items: [],
      messageText: `Preparing checkout summary. User said: ${userText}`,
    };
  }
  
  if (text.includes('clear') || text.includes('empty') || text.includes('reset')) {
    return {
      intent: 'CLEAR_CART',
      items: [],
      messageText: 'Your cart has been cleared.',
    };
  }
  
  if (text.includes('view') || text.includes('show') || text.includes('cart')) {
    return {
      intent: 'VIEW_CART',
      items: [],
      messageText: 'Here is your current cart.',
    };
  }

  // Look for items to add/remove
  const itemsToAdd: any[] = [];
  const isRemove = text.includes('remove') || text.includes('delete') || text.includes('reduce');
  
  for (const product of productsList) {
    const nameLower = product.name.toLowerCase();
    if (text.includes(nameLower) || (nameLower.length > 3 && text.includes(nameLower.split(/\s+/)[0]))) {
      let quantity = 1;
      const match = text.match(new RegExp(`(\\d+)\\s*${nameLower}|${nameLower}\\s*(\\d+)`));
      if (match) {
        quantity = parseInt(match[1] || match[2] || '1', 10);
      } else {
        if (text.includes('ek ') || text.includes('one ')) quantity = 1;
        else if (text.includes('do ') || text.includes('2 ') || text.includes('two ')) quantity = 2;
        else if (text.includes('teen ') || text.includes('3 ') || text.includes('three ')) quantity = 3;
      }
      
      itemsToAdd.push({
        productId: product.id,
        name: product.name,
        quantity,
      });
    }
  }

  // If no products matched but standard food items typed, map to first two menu items as fallback
  if (itemsToAdd.length === 0 && (text.includes('pizza') || text.includes('coffee') || text.includes('naan') || text.includes('burger'))) {
    if (productsList.length > 0) {
      itemsToAdd.push({
        productId: productsList[0].id,
        name: productsList[0].name,
        quantity: text.includes('do') || text.includes('2') ? 2 : 1,
      });
    }
    if (productsList.length > 1 && (text.includes('coffee') || text.includes('pizza'))) {
      itemsToAdd.push({
        productId: productsList[1].id,
        name: productsList[1].name,
        quantity: text.includes('do') || text.includes('2') ? 2 : 1,
      });
    }
  }

  if (itemsToAdd.length > 0) {
    return {
      intent: isRemove ? 'REMOVE_FROM_CART' : 'ADD_TO_CART',
      items: itemsToAdd,
      messageText: isRemove 
        ? `I have removed the items from your cart.`
        : `I have added the items to your cart.`,
    };
  }

  return {
    intent: 'GREETING',
    items: [],
    messageText: 'Welcome! How can we help you with your order today?',
  };
}

// AI upselling engine utility
async function getUpsellRecommendation(cart: CartItem[], propertyId: string): Promise<string> {
  if (cart.length === 0) return '';
  
  const hasBeverage = cart.some(c => 
    c.name.toLowerCase().includes('coffee') || 
    c.name.toLowerCase().includes('tea') || 
    c.name.toLowerCase().includes('cold drink') || 
    c.name.toLowerCase().includes('coke') || 
    c.name.toLowerCase().includes('pepsi') || 
    c.name.toLowerCase().includes('sprite') || 
    c.name.toLowerCase().includes('soda') || 
    c.name.toLowerCase().includes('beverage')
  );

  const hasFood = cart.some(c => 
    !c.name.toLowerCase().includes('coffee') && 
    !c.name.toLowerCase().includes('tea') && 
    !c.name.toLowerCase().includes('cold drink') && 
    !c.name.toLowerCase().includes('coke') && 
    !c.name.toLowerCase().includes('pepsi') && 
    !c.name.toLowerCase().includes('sprite') && 
    !c.name.toLowerCase().includes('soda')
  );

  if (hasFood && !hasBeverage) {
    const bev = await prisma.product.findFirst({
      where: {
        propertyId,
        isActive: true,
        OR: [
          { name: { contains: 'Coffee' } },
          { name: { contains: 'Tea' } },
          { name: { contains: 'Coke' } },
          { name: { contains: 'Drink' } },
          { name: { contains: 'Soft' } },
        ]
      }
    });
    if (bev) {
      return `\n\n💡 *AI Recommendation:* Pair your meal with a refreshing *${bev.name}* (₹${bev.sellingPrice})! Reply *"Add ${bev.name}"* to add it!`;
    }
  } else if (hasBeverage && !hasFood) {
    const food = await prisma.product.findFirst({
      where: {
        propertyId,
        isActive: true,
        NOT: [
          { name: { contains: 'Coffee' } },
          { name: { contains: 'Tea' } },
          { name: { contains: 'Coke' } },
          { name: { contains: 'Drink' } },
          { name: { contains: 'Soft' } },
        ]
      }
    });
    if (food) {
      return `\n\n💡 *AI Recommendation:* Try our popular *${food.name}* (₹${food.sellingPrice})! Reply *"Add ${food.name}"* to add it!`;
    }
  }

  return '';
}
