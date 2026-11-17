import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError, resolvePropertyIdentifier } from '@/lib/api-utils';
import { getSession } from '@/lib/session';
import { syncOrderToInventory } from '@/app/api/b2b/orders/route';

export const dynamic = 'force-dynamic';

// Helper to determine shop category from supplier category or item name
function resolveShopCategory(supplierCategory?: string | null, supplierName?: string | null, itemName?: string | null) {
  const text = `${supplierCategory || ''} ${supplierName || ''} ${itemName || ''}`.toLowerCase();
  if (text.includes('meat') || text.includes('chicken') || text.includes('fish') || text.includes('egg') || text.includes('mutton') || text.includes('poultry')) {
    return { id: 'MEAT_CHICKEN', name: 'Chicken & Meat Shop', emoji: '🍗', badge: 'Meat & Poultry' };
  }
  if (text.includes('vegetable') || text.includes('fruit') || text.includes('sabzi') || text.includes('mandi') || text.includes('produce') || text.includes('aloo') || text.includes('onion')) {
    return { id: 'SABZI_MANDI', name: 'Vegetables & Produce Market', emoji: '🥦', badge: 'Greens & Produce' };
  }
  if (text.includes('dairy') || text.includes('milk') || text.includes('paneer') || text.includes('curd') || text.includes('butter') || text.includes('cheese') || text.includes('amul')) {
    return { id: 'DAIRY_STORE', name: 'Dairy & Milk Booth', emoji: '🥛', badge: 'Dairy & Cheese' };
  }
  if (text.includes('grocery') || text.includes('kirana') || text.includes('ration') || text.includes('rice') || text.includes('atta') || text.includes('dal') || text.includes('oil') || text.includes('spice')) {
    return { id: 'KIRANA_RATION', name: 'Dry Ration & Grocery Store', emoji: '🌾', badge: 'Grains & Spices' };
  }
  if (text.includes('bakery') || text.includes('bread') || text.includes('bun') || text.includes('pav') || text.includes('toast')) {
    return { id: 'BAKERY_STORE', name: 'Bakery & Bread Store', emoji: '🍞', badge: 'Bakery & Breads' };
  }
  if (text.includes('beverage') || text.includes('drink') || text.includes('water') || text.includes('soda') || text.includes('juice')) {
    return { id: 'BEVERAGE_DISTRIBUTOR', name: 'Beverages & Packaged Water', emoji: '🥤', badge: 'Drinks & Water' };
  }
  if (text.includes('clean') || text.includes('housekeep') || text.includes('toilet') || text.includes('dishwash') || text.includes('soap')) {
    return { id: 'HOUSEKEEPING_STORE', name: 'Housekeeping & Cleaning Supplies', emoji: '🧹', badge: 'Cleaning & Amenities' };
  }
  if (text.includes('pack') || text.includes('box') || text.includes('foil') || text.includes('napkin') || text.includes('disposable')) {
    return { id: 'PACKAGING_STORE', name: 'Disposables & Food Packaging', emoji: '📦', badge: 'Packaging & Disposables' };
  }
  return { id: 'GENERAL_STORE', name: 'General Market & Supplies', emoji: '🛒', badge: 'General Supplies' };
}

// GET: Fetch all active market buying orders & items for this kitchen
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    const { searchParams } = new URL(request.url);
    const propertyParam = searchParams.get('propertyId') || searchParams.get('propertyCode') || session?.propertyId;

    let targetPropertyIds: string[] = [];
    if (propertyParam) {
      const prop = await resolvePropertyIdentifier(propertyParam, session);
      if (prop) {
        targetPropertyIds.push(prop.id);
        const fullProp = await prisma.property.findUnique({
          where: { id: prop.id },
          select: { organizationId: true },
        });
        if (fullProp?.organizationId) {
          const siblings = await prisma.property.findMany({
            where: { organizationId: fullProp.organizationId },
            select: { id: true },
          });
          targetPropertyIds = siblings.map((s) => s.id);
        }
      }
    }

    const where: any = {};
    if (targetPropertyIds.length > 0) {
      where.propertyId = { in: targetPropertyIds };
    }

    // Orders active today or pending procurement
    const orders = await prisma.b2BOrder.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        supplier: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    // Format orders for kitchen market list
    const formattedOrders = orders.map((o) => {
      // Parse purchased item IDs stored in comments or logs
      let purchasedIds: string[] = [];
      try {
        if (o.comments && o.comments.includes('__PURCHASED_IDS:')) {
          const match = o.comments.match(/__PURCHASED_IDS:(\[[^\]]*\])/);
          if (match && match[1]) {
            purchasedIds = JSON.parse(match[1]);
          }
        }
      } catch {}

      const shop = resolveShopCategory(o.supplier?.category, o.supplier?.name);

      const items = o.items.map((it) => {
        const isDone = o.status === 'DELIVERED' || purchasedIds.includes(it.id);
        const itemShop = resolveShopCategory(null, null, it.product?.name || '');
        return {
          id: it.id,
          name: it.product?.name || 'Item',
          quantity: it.quantity,
          unit: it.product?.unit || 'Kg',
          unitPrice: it.unitPrice,
          totalPrice: it.totalPrice,
          isDone,
          category: it.product?.category || shop.name,
          shopCategory: itemShop.id !== 'GENERAL_STORE' ? itemShop : shop,
        };
      });

      const totalItems = items.length;
      const doneItems = items.filter((i) => i.isDone).length;

      return {
        id: o.id,
        orderNo: o.orderNo,
        status: o.status,
        supplierName: o.supplier?.name || shop.name,
        supplierPhone: o.supplier?.phone || '',
        supplierCategory: o.supplier?.category || shop.badge,
        shop,
        items,
        totalAmount: o.totalAmount,
        createdAt: o.createdAt,
        totalItems,
        doneItems,
        isFullyPurchased: totalItems > 0 && doneItems === totalItems,
        isDeliveredToKitchen: o.status === 'DELIVERED',
      };
    });

    return apiResponse(formattedOrders);
  } catch (error: any) {
    console.error('Kitchen market orders GET error:', error);
    return apiError(error, 500);
  }
}

// POST: Kitchen staff adds a new item to buy
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    const body = await request.json();
    const { propertyCode, shopId, itemName, quantity, unit, estimatedPrice, notes, staffName } = body;

    if (!itemName?.trim()) {
      return apiError(new Error('Item name is required'), 400);
    }

    const prop = await resolvePropertyIdentifier(propertyCode || session?.propertyId, session);
    const propertyId = prop?.id || session?.propertyId;
    if (!propertyId) {
      return apiError(new Error('Property not found'), 400);
    }

    const qty = Math.max(1, Number(quantity) || 1);
    const price = Math.max(0, Number(estimatedPrice) || 0);
    const itemUnit = unit || 'Kg';

    // Map shop category
    const shopMeta = resolveShopCategory(null, null, `${shopId} ${itemName}`);

    // Find or create default supplier for this shop category
    let supplier = await prisma.b2BSupplier.findFirst({
      where: {
        category: shopMeta.badge,
      },
    });

    if (!supplier) {
      supplier = await prisma.b2BSupplier.create({
        data: {
          name: `${shopMeta.name} Supplier`,
          category: shopMeta.badge,
          phone: '',
          email: '',
          address: 'Local Market',
        },
      });
    }

    // Find active PENDING order today for this supplier, or create a new order
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let activeOrder = await prisma.b2BOrder.findFirst({
      where: {
        propertyId,
        supplierId: supplier.id,
        status: { in: ['PENDING', 'ACCEPTED', 'CONFIRMED', 'SENT'] },
        createdAt: { gte: today },
      },
    });

    if (!activeOrder) {
      const orderNo = `MKT-${Date.now().toString().slice(-6)}`;
      activeOrder = await prisma.b2BOrder.create({
        data: {
          propertyId,
          supplierId: supplier.id,
          orderNo,
          status: 'PENDING',
          totalAmount: 0,
          buyerRestaurant: prop?.name || 'Kitchen Staff',
          comments: `Kitchen Market Buying List added by ${staffName || 'Kitchen Staff'}.`,
        },
      });
    }

    // Find or create B2BProduct
    let product = await prisma.b2BProduct.findFirst({
      where: {
        supplierId: supplier.id,
        name: itemName.trim(),
      },
    });

    if (!product) {
      product = await prisma.b2BProduct.create({
        data: {
          supplierId: supplier.id,
          name: itemName.trim(),
          unit: itemUnit,
          price,
          category: shopMeta.badge,
        },
      });
    }

    // Create B2BOrderItem
    const itemTotalPrice = qty * price;
    const orderItem = await prisma.b2BOrderItem.create({
      data: {
        orderId: activeOrder.id,
        productId: product.id,
        quantity: qty,
        unitPrice: price,
        totalPrice: itemTotalPrice,
      },
      include: { product: true },
    });

    // Update order total amount
    await prisma.b2BOrder.update({
      where: { id: activeOrder.id },
      data: {
        totalAmount: { increment: itemTotalPrice },
      },
    });

    return apiResponse({
      success: true,
      orderItem,
      orderId: activeOrder.id,
      orderNo: activeOrder.orderNo,
    });
  } catch (error: any) {
    console.error('Kitchen market orders POST error:', error);
    return apiError(error, 500);
  }
}

// PATCH: Toggle item purchased or mark shop order delivered & inward stock
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, orderId, itemId, isPurchased, staffName } = body;

    if (!orderId) {
      return apiError(new Error('Order ID is required'), 400);
    }

    const order = await prisma.b2BOrder.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      return apiError(new Error('Order not found'), 404);
    }

    // ACTION 1: Toggle Item Purchased / Done
    if (action === 'TOGGLE_ITEM') {
      let purchasedIds: string[] = [];
      try {
        if (order.comments && order.comments.includes('__PURCHASED_IDS:')) {
          const match = order.comments.match(/__PURCHASED_IDS:(\[[^\]]*\])/);
          if (match && match[1]) {
            purchasedIds = JSON.parse(match[1]);
          }
        }
      } catch {}

      if (isPurchased) {
        if (!purchasedIds.includes(itemId)) purchasedIds.push(itemId);
      } else {
        purchasedIds = purchasedIds.filter((id) => id !== itemId);
      }

      // Update comments with new JSON marker
      const cleanComments = (order.comments || '').replace(/__PURCHASED_IDS:(\[[^\]]*\])/, '').trim();
      const updatedComments = `${cleanComments} __PURCHASED_IDS:${JSON.stringify(purchasedIds)}`.trim();

      await prisma.b2BOrder.update({
        where: { id: orderId },
        data: {
          comments: updatedComments,
        },
      });

      return apiResponse({ success: true, purchasedIds });
    }

    // ACTION 2: Mark Entire Order Received & Add Stock (GRN)
    if (action === 'RECEIVE_ORDER') {
      await prisma.b2BOrder.update({
        where: { id: orderId },
        data: {
          status: 'DELIVERED',
          comments: `${order.comments || ''} [Received & Inwarded by ${staffName || 'Kitchen Staff'}]`.trim(),
        },
      });

      // Automatically sync stock to hotel/kitchen inventory
      await syncOrderToInventory(prisma, orderId);

      return apiResponse({
        success: true,
        message: 'Order received & stock added directly to Kitchen Inventory! 📦',
      });
    }

    return apiError(new Error('Invalid action'), 400);
  } catch (error: any) {
    console.error('Kitchen market orders PATCH error:', error);
    return apiError(error, 500);
  }
}
