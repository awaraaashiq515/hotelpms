/**
 * Utility to format and dispatch Purchase Orders directly to Vendors via WhatsApp
 */

export interface POWhatsAppItem {
  name: string;
  quantity: number;
  unit?: string;
  description?: string;
  unitPrice?: number;
  totalPrice?: number;
}

export interface POWhatsAppPayload {
  hotelName?: string;
  hotelPhone?: string;
  poNumber: string;
  orderDate?: string;
  expectedDate?: string;
  vendorName: string;
  vendorPhone?: string;
  items: POWhatsAppItem[];
  totalAmount?: number;
  notes?: string;
  assignedStaffName?: string;
  assignedStaffPhone?: string;
}

/**
 * Clean phone number into an international format without spaces/dashes.
 * Defaults Indian 10-digit mobile numbers with country code 91.
 */
export function sanitizeWhatsAppPhone(phone?: string | null): string {
  if (!phone) return '';
  const digitsOnly = phone.replace(/\D/g, '');
  if (digitsOnly.length === 10) {
    return `91${digitsOnly}`;
  }
  return digitsOnly;
}

/**
 * Generate formatted WhatsApp message text in English
 */
export function generatePOMessageText(payload: POWhatsAppPayload): string {
  const hotel = (payload.hotelName || 'HOTEL MANAGEMENT').toUpperCase();
  const dateStr = payload.orderDate || new Date().toISOString().split('T')[0];

  let text = `🏨 *${hotel} - OFFICIAL PURCHASE ORDER*\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `📄 *PO Number:* ${payload.poNumber}\n`;
  text += `📅 *Order Date:* ${dateStr}\n`;
  if (payload.expectedDate) {
    text += `⏰ *Required Delivery:* ${payload.expectedDate}\n`;
  }
  text += `👤 *Vendor:* ${payload.vendorName}\n`;
  if (payload.assignedStaffName) {
    const phoneSuffix = payload.assignedStaffPhone ? ` (${payload.assignedStaffPhone})` : '';
    text += `🏃 *Staff Contact / Receiver:* ${payload.assignedStaffName}${phoneSuffix}\n`;
  }
  text += `━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

  text += `📋 *PURCHASE ITEMS LIST (${payload.items.length} items):*\n`;
  payload.items.forEach((item, index) => {
    const qtyUnit = `${item.quantity} ${item.unit || 'units'}`;
    const desc = item.description && item.description.trim() ? ` _(${item.description.trim()})_` : '';
    const rate = item.unitPrice && item.unitPrice > 0 ? ` [@ ₹${item.unitPrice.toLocaleString('en-IN')}]` : '';
    text += `  ${index + 1}. *${item.name}* : ${qtyUnit}${desc}${rate}\n`;
  });

  if (payload.totalAmount && payload.totalAmount > 0) {
    text += `\n💰 *Total Estimated Value:* ₹${payload.totalAmount.toLocaleString('en-IN')}\n`;
  } else {
    text += `\n💰 *Billing:* As per Vendor Daily Market Rate / Invoice\n`;
  }

  if (payload.notes && payload.notes.trim()) {
    text += `\n📝 *Special Instructions:*\n"${payload.notes.trim()}"\n`;
  }

  text += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `✅ *Please confirm receipt and dispatch time on this chat.* Thank you!`;

  return text;
}

/**
 * Open WhatsApp Web / Mobile with the pre-filled Purchase Order message
 */
export function openWhatsAppPO(payload: POWhatsAppPayload): boolean {
  const cleanedPhone = sanitizeWhatsAppPhone(payload.vendorPhone);
  const message = generatePOMessageText(payload);
  const encodedText = encodeURIComponent(message);

  let url = '';
  if (cleanedPhone) {
    url = `https://wa.me/${cleanedPhone}?text=${encodedText}`;
  } else {
    // If phone is missing, open WhatsApp share dialog allowing user to choose the contact
    url = `https://api.whatsapp.com/send?text=${encodedText}`;
  }

  if (typeof window !== 'undefined') {
    window.open(url, '_blank', 'noopener,noreferrer');
    return true;
  }
  return false;
}
