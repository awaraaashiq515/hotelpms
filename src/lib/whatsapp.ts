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

    if (!property || !property.whatsAppEnabled) {
      // Fallback to manual wa.me link
      const encodedMessage = encodeURIComponent(message);
      return { success: true, url: `https://wa.me/${mobile}?text=${encodedMessage}`, mode: 'MANUAL' };
    }

    const provider = property.whatsAppProvider || 'META';

    if (provider === 'ULTRAMSG') {
      if (!property.whatsAppApiKey || !property.whatsAppInstanceId) {
        throw new Error('UltraMsg credentials not configured');
      }
      const url = `https://api.ultramsg.com/${property.whatsAppInstanceId}/messages/chat`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          token: property.whatsAppApiKey,
          to: mobile.startsWith('+') ? mobile : `+${mobile}`,
          body: message
        })
      });
      const data = await response.json();
      return { success: !!data.sent || data.success, data, mode: 'API' };
    }

    if (provider === 'TWILIO') {
      if (!property.twilioAccountSid || !property.twilioAuthToken || !property.twilioFromNumber) {
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
      const authKey = property?.whatsAppApiKey || process.env.AUTHKEY_API_KEY;
      if (provider === 'AUTHKEY' && authKey) {
        const cleanMobile = mobile.replace(/[^0-9]/g, '').slice(-10);
        const url = `https://api.authkey.io/request?authkey=${authKey}&mobile=${cleanMobile}&country_code=91&sid=guest_booking_confirmation&1=Guest&2=${encodeURIComponent(property?.name || 'Hotel')}&3=${encodeURIComponent(message)}`;
        const res = await fetch(url);
        const data = await res.json();
        return { success: data.status === 'success' || data.code === 200, data, mode: 'API' };
      }

      if (!property?.metaAccessToken || !property?.metaPhoneId) {
        throw new Error('Meta Graph credentials not configured');
      }
      const url = `https://graph.facebook.com/v20.0/${property.metaPhoneId}/messages`;
      const cleanMobile = mobile.replace(/[^0-9]/g, ''); // strip leading '+' for Meta API
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${property.metaAccessToken}`,
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
