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
    let config: any = {};

    if (propertyId) {
      const property = await prisma.property.findUnique({
        where: { id: propertyId }
      });
      if (property && property.whatsAppEnabled) {
        config = {
          WHATSAPP_ENABLED: 'true',
          WHATSAPP_API_KEY: property.whatsAppApiKey,
          WHATSAPP_INSTANCE_ID: property.whatsAppInstanceId,
          WHATSAPP_PROVIDER: 'ULTRAMSG' // Default to UltraMsg for now
        };
      }
    }

    // Fallback to Global Settings if property-specific is not enabled/found
    if (config.WHATSAPP_ENABLED !== 'true' || !config.WHATSAPP_API_KEY) {
      const settings = await prisma.systemSetting.findMany({
        where: { key: { startsWith: 'WHATSAPP_' } }
      });

      config = settings.reduce((acc: any, s: any) => {
        acc[s.key] = s.value;
        return acc;
      }, {});
    }

    if (config.WHATSAPP_ENABLED !== 'true' || !config.WHATSAPP_API_KEY) {
      const encodedMessage = encodeURIComponent(message);
      return { success: true, url: `https://wa.me/${mobile}?text=${encodedMessage}`, mode: 'MANUAL' };
    }

    const provider = config.WHATSAPP_PROVIDER || 'ULTRAMSG';
    const apiKey = config.WHATSAPP_API_KEY;
    const instanceId = config.WHATSAPP_INSTANCE_ID;

    if (provider === 'ULTRAMSG') {
      const url = `https://api.ultramsg.com/${instanceId}/messages/chat`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          token: apiKey,
          to: mobile,
          body: message
        })
      });
      const data = await response.json();
      return { success: !!data.sent || data.success, data, mode: 'API' };
    }

    // Fallback for unknown provider
    const encodedMessage = encodeURIComponent(message);
    return { success: true, url: `https://wa.me/${mobile}?text=${encodedMessage}`, mode: 'MANUAL' };

  } catch (error) {
    console.error('WhatsApp API Error:', error);
    const encodedMessage = encodeURIComponent(message);
    return { success: true, url: `https://wa.me/${mobile}?text=${encodedMessage}`, mode: 'MANUAL' };
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
