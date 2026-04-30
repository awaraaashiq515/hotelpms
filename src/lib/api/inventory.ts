import { apiClient } from './client';

export interface StockItem {
  id: string;
  propertyId: string;
  name: string;
  sku?: string;
  unit?: string;
  openingStock: number;
  minimumStock: number;
  reorderLevel: number;
  costPrice: number;
  isActive: boolean;
  itemType?: string;
  currentStock?: number;
  isLow?: boolean;
  products?: { id: string; name: string }[];
}

export interface StockMovement {
  id: string;
  stockItemId: string;
  warehouseId: string;
  movementType: string;
  qtyIn: number;
  qtyOut: number;
  balanceQty: number;
  unitCost: number;
  movementDate: string;
  referenceModule?: string;
  referenceId?: string;
  stockItem?: { name: string; unit?: string };
  warehouse?: { name: string };
}

export interface StockAdjustment {
  id: string;
  adjustmentNo: string;
  adjustmentDate: string;
  reason?: string;
  status: string;
  warehouse?: { name: string };
}

export const inventoryApi = {
  // Stock Items
  async listStockItems(params?: { search?: string; lowStock?: boolean; warehouseId?: string; itemType?: string }): Promise<StockItem[]> {
    return apiClient.get('/api/inventory/stock-items', {
      params: {
        ...(params?.search ? { search: params.search } : {}),
        ...(params?.lowStock ? { lowStock: 'true' } : {}),
        ...(params?.warehouseId ? { warehouseId: params.warehouseId } : {}),
        ...(params?.itemType ? { itemType: params.itemType } : {}),
      },
    });
  },

  async getStockItem(id: string): Promise<StockItem> {
    return apiClient.get(`/api/inventory/stock-items/${id}`);
  },

  async createStockItem(data: Partial<StockItem>): Promise<StockItem> {
    return apiClient.post('/api/inventory/stock-items', data);
  },

  async updateStockItem(id: string, data: Partial<StockItem>): Promise<StockItem> {
    return apiClient.put(`/api/inventory/stock-items/${id}`, data);
  },

  async deleteStockItem(id: string): Promise<void> {
    return apiClient.delete(`/api/inventory/stock-items/${id}`);
  },

  // Movements
  async listMovements(params?: {
    stockItemId?: string;
    movementType?: string;
    page?: number;
  }): Promise<{ movements: StockMovement[]; total: number; page: number }> {
    return apiClient.get('/api/inventory/movements', {
      params: {
        ...(params?.stockItemId ? { stockItemId: params.stockItemId } : {}),
        ...(params?.movementType ? { movementType: params.movementType } : {}),
        ...(params?.page ? { page: String(params.page) } : {}),
      },
    });
  },

  // Stock In
  async stockIn(data: {
    stockItemId: string;
    qty: number;
    unitCost?: number;
    movementType?: string;
    remarks?: string;
  }): Promise<StockMovement> {
    return apiClient.post('/api/inventory/stock-in', data);
  },

  // Adjustment
  async adjust(data: {
    stockItemId: string;
    physicalQty: number;
    reason?: string;
  }): Promise<{ adjustment: StockAdjustment; diff: number; physicalQty: number }> {
    return apiClient.post('/api/inventory/adjustments', data);
  },

  async listAdjustments(): Promise<StockAdjustment[]> {
    return apiClient.get('/api/inventory/adjustments');
  },

  // Map product to stock item
  async mapProduct(productId: string, stockItemId: string | null): Promise<void> {
    return apiClient.post('/api/inventory/map-product', { productId, stockItemId });
  },

  // Recipes
  async listRecipes(productId: string): Promise<any[]> {
    return apiClient.get('/api/inventory/recipes', { params: { productId } });
  },

  async updateRecipe(productId: string, ingredients: { stockItemId: string; quantity: number }[]): Promise<void> {
    return apiClient.post('/api/inventory/recipes', { productId, ingredients });
  },

  // Warehouses & Transfers
  async listWarehouses(): Promise<any[]> {
    return apiClient.get('/api/inventory/transfer');
  },

  async transferStock(data: { stockItemId: string; fromWarehouseId: string; toWarehouseId: string; qty: number }): Promise<void> {
    return apiClient.post('/api/inventory/transfer', data);
  },
};
