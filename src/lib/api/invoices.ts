import { apiClient } from './client';

export interface InvoiceItem {
  id?: string;
  productId?: string;
  description?: string;
  qty: number;
  hsnCode?: string;
  unitPrice: number;
  taxAmount: number;
  totalAmount: number;
  product?: {
    name: string;
  };
}

export interface Settlement {
  id: string;
  settlementNo: string;
  settlementDate: string;
  grossAmount: number;
  paidAmount: number;
  balanceAmount: number;
  status: string;
}

export interface Invoice {
  id: string;
  invoiceNo: string;
  invoiceDate: string;
  propertyId: string;
  guestId?: string;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paymentStatus: 'PAID' | 'UNPAID' | 'PARTIAL' | 'REFUNDED';
  invoiceStatus: 'ACTIVE' | 'SETTLED' | 'CANCELLED' | 'REFUNDED';
  property?: {
    name: string;
    address?: string;
    phone?: string;
    gstNo?: string;
    taxDetails?: string;
  };
  guest?: {
    firstName: string;
    lastName?: string;
    mobile?: string;
  };
  items?: InvoiceItem[];
  settlements?: Settlement[];
  paidAmount?: number;
  dueAmount?: number;
  cancelReason?: string;
  _count?: {
    items: number;
  };
}

export const invoicesApi = {
  async list(params?: { guestId?: string, status?: string, propertyId?: string }): Promise<Invoice[]> {
    return apiClient.get('/api/invoices', { params: params as any });
  },

  async get(id: string): Promise<Invoice> {
    return apiClient.get(`/api/invoices/${id}`);
  },

  async delete(id: string, reason?: string): Promise<void> {
    return apiClient.delete(`/api/invoices/${id}`, { body: { reason } } as any);
  },
};
