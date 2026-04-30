import { apiClient } from './client';

export interface Product {
  id: string;
  categoryId: string;
  outletId?: string;
  name: string;
  sku?: string;
  barcode?: string;
  hsnCode?: string;
  productType: string;
  costPrice: number;
  sellingPrice: number;
  taxRate?: number | null;
  taxType?: 'INCLUSIVE' | 'EXCLUSIVE' | 'EXEMPT';
  trackInventory: boolean;
  isActive: boolean;
  menuType?: 'RESTAURANT' | 'BAR';
  pegSize?: number | null;
  pegUnit?: string;
  image?: string;
  createdAt?: string;
  updatedAt?: string;
  category?: {
    id: string;
    name: string;
  };
  variants?: {
    id?: string;
    name: string;
    price: number;
  }[];
}


export const productsApi = {
  async list(propertyId?: string): Promise<Product[]> {
    const url = propertyId ? `/api/products?propertyId=${propertyId}` : '/api/products';
    return apiClient.get(url);
  },

  async get(id: string): Promise<Product> {
    return apiClient.get(`/api/products/${id}`);
  },

  async create(data: Partial<Product>): Promise<Product> {
    return apiClient.post('/api/products', data);
  },

  async update(id: string, data: Partial<Product>): Promise<Product> {
    return apiClient.put(`/api/products/${id}`, data);
  },

  async delete(id: string): Promise<void> {
    return apiClient.delete(`/api/products/${id}`);
  },

  async bulkUpdateTaxType(taxType: string): Promise<void> {
    return apiClient.post('/api/products/bulk-update-tax', { taxType });
  },
};
