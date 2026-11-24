import { prisma } from './prisma';

export async function sendWhatsAppMessage({ 
  mobile, 
  message, 
  propertyId,
  forceManual = false 
}: { 
  mobile: string; 
  message: string; 
  propertyId?: string;
  forceManual?: boolean; 
}) {
  if (forceManual) {
    const encodedMessage = encodeURIComponent(message);
    return { success: true, url: `https://wa.me/${mobile}?text=${encodedMessage}`, mode: 'MANUAL' };
  }

  try {
    let property: any = null;
    if (propertyId) {
      property = await prisma.property.findUnique({
        where: { id: propertyId }
      });
    }

    // Load Super Admin Master System Settings
    const masterSettings = await prisma.systemSetting.findMany({
      where: {
        key: { in: ['WHATSAPP_ENABLED', 'WHATSAPP_PROVIDER', 'META_ACCESS_TOKEN', 'META_PHONE_ID', 'WHATSAPP_API_KEY', 'WHATSAPP_INSTANCE_ID'] }
      }
    });
    const masterMap = masterSettings.reduce((acc, s) => { acc[s.key] = s.value; return acc; }, {} as Record<string, string>);

    const isGloballyEnabled = masterMap['WHATSAPP_ENABLED'] === 'true';
    const isPropEnabled = property?.whatsAppEnabled ?? false;

    if (!isPropEnabled && !isGloballyEnabled) {
      // Fallback to manual wa.me link
      const encodedMessage = encodeURIComponent(message);
      return { success: true, url: `https://wa.me/${mobile}?text=${encodedMessage}`, mode: 'MANUAL' };
    }

    const provider = property?.whatsAppProvider || masterMap['WHATSAPP_PROVIDER'] || 'META';

    if (provider === 'ULTRAMSG') {
      const apiKey = property?.whatsAppApiKey || masterMap['WHATSAPP_API_KEY'];
      const instanceId = property?.whatsAppInstanceId || masterMap['WHATSAPP_INSTANCE_ID'];
      if (!apiKey || !instanceId) {
        throw new Error('UltraMsg credentials not configured');
      }
      const url = `https://api.ultramsg.com/${instanceId}/messages/chat`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          token: apiKey,
          to: mobile.startsWith('+') ? mobile : `+${mobile}`,
          body: message
        })
      });
      const data = await response.json();
      return { success: !!data.sent || data.success, data, mode: 'API' };
    }

    if (provider === 'TWILIO') {
      if (!property?.twilioAccountSid || !property?.twilioAuthToken || !property?.twilioFromNumber) {
        throw new Error('Twilio credentials not configured');
      }
      const url = `https://api.twilio.com/2010-04-01/Accounts/${property.twilioAccountSid}/Messages.json`;
      const auth = Buffer.from(`${property.twilioAccountSid}:${property.twilioAuthToken}`).toString('base64');
      const params = new URLSearchParams();
      params.append('To', mobile.startsWith('whatsapp:') ? mobile : `whatsapp:+${mobile}`);
      params.append('From', property.twilioFromNumber.startsWith('whatsapp:') ? property.twilioFromNumber : `whatsapp:${property.twilioFromNumber}`);
      params.append('Body', message);

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

      const data = await res.json();
      return { success: true, data, mode: 'API' };
    }

    if (provider === 'AUTHKEY' || provider === 'META') {
      const authKey = property?.whatsAppApiKey || masterMap['WHATSAPP_API_KEY'] || process.env.AUTHKEY_API_KEY;
      if (provider === 'AUTHKEY' && authKey) {
        const cleanMobile = mobile.replace(/[^0-9]/g, '').slice(-10);
        const url = `https://api.authkey.io/request?authkey=${authKey}&mobile=${cleanMobile}&country_code=91&sid=guest_booking_confirmation&1=Guest&2=${encodeURIComponent(property?.name || 'Hotel')}&3=${encodeURIComponent(message)}`;
        const res = await fetch(url);
        const data = await res.json();
        return { success: data.status === 'success' || data.code === 200, data, mode: 'API' };
      }

      // Meta Cloud API: Use Property credentials if provided; else fallback to Super Admin Master credentials
      const metaToken = property?.metaAccessToken || masterMap['META_ACCESS_TOKEN'] || process.env.META_ACCESS_TOKEN;
      const metaPhoneId = property?.metaPhoneId || masterMap['META_PHONE_ID'] || process.env.META_PHONE_ID;

      if (!metaToken || !metaPhoneId) {
        throw new Error('Meta Graph credentials not configured in Property or Super Admin Master Settings');
      }

      const url = `https://graph.facebook.com/v20.0/${metaPhoneId}/messages`;
      let cleanMobile = mobile.replace(/[^0-9]/g, '');
      if (cleanMobile.length === 10) {
        cleanMobile = `91${cleanMobile}`;
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${metaToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: cleanMobile,
          type: 'text',
          text: { body: message },
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(`Meta error: ${errData.error?.message || 'Unknown'}`);
      }

      const data = await res.json();
      return { success: true, data, mode: 'API' };
    }

    const encodedMessage = encodeURIComponent(message);
    return { success: true, url: `https://wa.me/${mobile}?text=${encodedMessage}`, mode: 'MANUAL' };

  } catch (error) {
    console.error('WhatsApp Outbound API Error:', error);
    const encodedMessage = encodeURIComponent(message);
    return { success: false, url: `https://wa.me/${mobile}?text=${encodedMessage}`, mode: 'MANUAL', error };
  }
}

// Function to send Official Meta Cloud API Approved Template
export async function sendMetaWhatsAppTemplate({
  mobile,
  templateName,
  parameters = [],
  buttonUrlParameter,
  propertyId,
  languageCode = 'en',
}: {
  mobile: string;
  templateName: string;
  parameters?: (string | number)[];
  buttonUrlParameter?: string;
  propertyId?: string;
  languageCode?: string;
}) {
  try {
    let property: any = null;
    if (propertyId) {
      property = await prisma.property.findUnique({
        where: { id: propertyId },
      });
    }

    const masterConfigs = await prisma.systemSetting.findMany({
      where: { key: { in: ['META_ACCESS_TOKEN', 'META_PHONE_ID'] } },
    });
    const masterMap = masterConfigs.reduce((acc, c) => ({ ...acc, [c.key]: c.value }), {} as Record<string, string>);

    const metaToken = property?.metaAccessToken || masterMap['META_ACCESS_TOKEN'] || process.env.META_ACCESS_TOKEN;
    const metaPhoneId = property?.metaPhoneId || masterMap['META_PHONE_ID'] || process.env.META_PHONE_ID;

    if (!metaToken || !metaPhoneId) {
      console.warn('[Meta WhatsApp] Credentials not configured for Property:', propertyId);
      return { success: false, error: 'Meta credentials not configured' };
    }

    let cleanMobile = mobile.replace(/[^0-9]/g, '');
    if (cleanMobile.length === 10) {
      cleanMobile = `91${cleanMobile}`;
    }

    const url = `https://graph.facebook.com/v20.0/${metaPhoneId}/messages`;

    const components: any[] = [];
    if (parameters.length > 0) {
      components.push({
        type: 'body',
        parameters: parameters.map((val) => ({
          type: 'text',
          text: String(val ?? ''),
        })),
      });
    }

    if (buttonUrlParameter) {
      components.push({
        type: 'button',
        sub_type: 'url',
        index: '0',
        parameters: [
          {
            type: 'text',
            text: String(buttonUrlParameter),
          },
        ],
      });
    }

    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: cleanMobile,
      type: 'template',
      template: {
        name: templateName,
        language: { code: languageCode },
        ...(components.length > 0 ? { components } : {}),
      },
    };

    console.log('[Meta WhatsApp] Sending Template:', templateName, 'to:', cleanMobile);

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${metaToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error('[Meta WhatsApp] Template Dispatch Error:', data);
      return { success: false, error: data.error?.message || 'Meta API error', data };
    }

    console.log('[Meta WhatsApp] Successfully Sent Template:', templateName);
    return { success: true, data };
  } catch (err: any) {
    console.error('[Meta WhatsApp] Send Template Exception:', err);
    return { success: false, error: err.message };
  }
}

// Function to send AuthKey WhatsApp Approved Template
// Uses authkey.io API with wid (WhatsApp Template ID)
export async function sendAuthKeyWhatsAppTemplate({
  mobile,
  templateId,       // wid = numeric template ID from authkey.io console
  guestName,
  hotelName,
  portalUrl,
  username,
  password,
  authKey,
  roomNumber,
  floor,
  roomPrice,
}: {
  mobile: string;
  templateId?: string;   // wid - the numeric ID shown in authkey template list
  guestName: string;
  hotelName: string;
  portalUrl: string;
  username: string;
  password: string;
  authKey?: string;
  roomNumber?: string;
  floor?: string;
  roomPrice?: string;
}) {
  const key = authKey || process.env.AUTHKEY_API_KEY || '';
  const cleanMobile = mobile.replace(/[^0-9]/g, '').slice(-10);

  const params: Record<string, string> = {
    authkey: key,
    mobile: cleanMobile,
    country_code: '91',
    '1': guestName,
    '2': password,
  };

  // Use wid if templateId is provided (authkey.io WhatsApp template ID)
  if (templateId) {
    params['wid'] = templateId;
  }

  const queryParams = new URLSearchParams(params);
  const url = `https://api.authkey.io/request?${queryParams.toString()}`;

  console.log('[AuthKey WhatsApp] Sending to:', cleanMobile, '| wid:', templateId);

  try {
    const res = await fetch(url, { method: 'GET' });
    const data = await res.json();
    console.log('[AuthKey WhatsApp] Response:', data);
    const isSuccess = data.status === 'success' || data.code === 200 || data.Message === 'Submitted Successfully' || !!data.LogID;
    return { success: isSuccess, data };
  } catch (error) {
    console.error('AuthKey API Error:', error);

    return { success: false, error };
  }
}

export function formatWhatsAppReceipt(bill: any, property: any, defaultTemplate?: string) {
  const itemsText = (bill.items || []).map((item: any) => {
    const qty = item.quantity || item.qty || 1;
    const price = item.price || item.unitPrice || item.sellingPrice || 0;
    return `${item.name || 'Item'} x ${qty} = ₹${(qty * price).toFixed(0)}`;
  }).join('\n');
  
  let msg = property?.whatsAppTemplate || defaultTemplate || `*Receipt from {HOTEL}*
Order No: {ORDER_NO}
Table: {TABLE_NO}
---
{ITEMS}
---
Subtotal: ₹{SUBTOTAL}
Tax: ₹{TAX}
*Total: ₹{AMOUNT}*
---
Thank you! Visit again.`;

  const subtotal = bill.subtotal || bill.invoice?.subtotal || 0;
  const tax = bill.tax || bill.taxAmount || bill.invoice?.taxAmount || 0;
  const grandTotal = bill.grandTotal || bill.totalAmount || bill.invoice?.totalAmount || 0;

  msg = msg.replace(/{HOTEL}/g, property?.name || 'POS');
  msg = msg.replace(/{ORDER_NO}/g, bill.orderNo || bill.invoice?.invoiceNo || 'N/A');
  msg = msg.replace(/{TABLE_NO}/g, bill.tableNo || 'Walk-in');
  msg = msg.replace(/{ITEMS}/g, itemsText);
  msg = msg.replace(/{SUBTOTAL}/g, Number(subtotal).toFixed(0));
  msg = msg.replace(/{TAX}/g, Number(tax).toFixed(0));
  msg = msg.replace(/{AMOUNT}/g, Number(grandTotal).toFixed(0));
  msg = msg.replace(/{NAME}/g, bill.customerName || 'Customer');

  return msg;
}
