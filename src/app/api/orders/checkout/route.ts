import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';
import { getSession } from '@/lib/session';
import { sendSMS } from '@/lib/notificationService';
import { processDriverRide } from '@/lib/driverOfferEngine';
import { sendWhatsAppMessage, formatWhatsAppReceipt } from '@/lib/whatsapp';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const body = await request.json();
    const { items, paymentModeId, totalAmount, guestId, restaurantTableId, driverId, staffMemberId, orderType, membershipCardId, membershipDiscount, sendWhatsApp } = body;

    const result = await prisma.$transaction(async (tx: any) => {
      // 0. Find target account (Cash Account)
      const cashAccount = await tx.account.findFirst({
        where: { 
          propertyId: session.propertyId!,
          accountType: 'CASH'
        }
      });

      if (!cashAccount) {
        throw new Error('Cash account not found. Please ensure accounts are set up.');
      }

      // 1. Find or Create PosOrder
      let posOrder = null;
      if (restaurantTableId) {
        posOrder = await (tx as any).posOrder.findFirst({
          where: { 
            restaurantTableId, 
            status: { in: ['OPEN', 'PENDING', 'PLACED', 'IN_KITCHEN', 'READY', 'SERVED', 'BILL_PRINTED'] } 
          }
        });
      }

      // Calculate true totals from items
      const productDetails = await tx.product.findMany({
        where: { id: { in: items.map((i: any) => i.id) } },
        select: { id: true, hsnCode: true, taxRate: true, taxType: true }
      });

      let subtotal = 0;
      let taxAmount = 0;
      let grandTotal = 0;
      const totalRaw = items.reduce((acc: number, item: any) => acc + ((item.sellingPrice || item.unitPrice || 0) * (item.quantity || item.qty || 1)), 0);

      const itemsWithTax = items.map((item: any) => {
        const detail = productDetails.find((p: any) => p.id === item.id);
        const unitPrice = item.sellingPrice || item.unitPrice || item.basePrice || 0;
        const qty = item.quantity || item.qty || 1;
        const lineTotalRaw = unitPrice * qty;

        const lineDiscount = totalRaw > 0 ? (lineTotalRaw / totalRaw) * (membershipDiscount || 0) : 0;
        const lineNetAfterDiscount = Math.max(0, lineTotalRaw - lineDiscount);

        const taxRate = detail?.taxRate !== null && detail?.taxRate !== undefined ? detail.taxRate : 5;
        const taxType = detail?.taxType || 'EXCLUSIVE';

        let lineTax = 0;
        let lineGrandTotal = 0;

        if (taxType === 'EXEMPT') {
          lineTax = 0;
          lineGrandTotal = lineNetAfterDiscount;
        } else if (taxType === 'INCLUSIVE') {
          lineTax = lineNetAfterDiscount - (lineNetAfterDiscount / (1 + (taxRate / 100)));
          lineGrandTotal = lineNetAfterDiscount;
        } else {
          lineTax = lineNetAfterDiscount * (taxRate / 100);
          lineGrandTotal = lineNetAfterDiscount + lineTax;
        }

        subtotal += lineTotalRaw;
        taxAmount += lineTax;
        grandTotal += lineGrandTotal;

        return {
          ...item,
          qty,
          unitPrice,
          lineTax,
          lineDiscount,
          lineGrandTotal,
          hsnCode: detail?.hsnCode
        };
      });

      if (posOrder) {
        // Update existing order
        posOrder = await tx.posOrder.update({
          where: { id: posOrder.id },
          data: {
            status: 'SETTLED',
            subtotal: subtotal,
            taxAmount: taxAmount,
            grandTotal: grandTotal,
            discountAmount: membershipDiscount || 0,
            ...(driverId && { driverId }),
            ...(staffMemberId && { staffMemberId }),
            membershipCardId: membershipCardId || null,
            membershipDiscount: membershipDiscount || 0
          }
        });
      } else {
        // Create new order (Fast Billing)
        const outlet = await (tx as any).outlet.findFirst({ where: { propertyId: session.propertyId! } });
        if (!outlet) {
          throw new Error('No POS outlet found for this property.');
        }
        
        const table = restaurantTableId ? await (tx as any).table.findUnique({ where: { id: restaurantTableId } }) : null;

        posOrder = await (tx as any).posOrder.create({
          data: {
              propertyId: session.propertyId!,
              outletId: outlet.id,
              orderNo: `POS-${Date.now()}`,
              orderType: 'DINE_IN',
              status: 'SETTLED',
              subtotal: subtotal,
              taxAmount: taxAmount,
              discountAmount: membershipDiscount || 0,
              grandTotal: grandTotal,
              restaurantTableId: restaurantTableId || null,
              tableNo: table?.name || null,
              driverId: driverId || null,
              staffMemberId: staffMemberId || null,
              membershipCardId: membershipCardId || null,
              membershipDiscount: membershipDiscount || 0,
              items: {
                create: items.map((item: any) => {
                  const mappedItem = itemsWithTax.find((i: any) => i.id === item.id);
                  return {
                    productId: item.id,
                    quantity: mappedItem.qty,
                    unitPrice: mappedItem.unitPrice,
                    taxAmount: mappedItem.lineTax,
                    discountAmount: mappedItem.lineDiscount,
                    totalAmount: mappedItem.qty * mappedItem.unitPrice,
                  };
                })
              }
          }
        });
      }


      // 2. Generate Professional Invoice Number
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();
      const fy = month >= 4 ? `${year}-${(year + 1).toString().slice(-2)}` : `${year - 1}-${year.toString().slice(-2)}`;
      
      const count = await tx.invoice.count({
        where: { propertyId: session.propertyId! }
      });
      // Use a more robust unique invoice number to avoid 409 Conflicts in concurrent requests
      const randomSuffix = Math.random().toString(36).substring(2, 5).toUpperCase();
      const invoiceNo = `PJ/${fy}/${(count + 1).toString().padStart(4, '0')}-${randomSuffix}`;

      const isPayLater = paymentModeId === 'PAY_LATER';

      // 3. Create Invoice linked to the order
      const invoice = await tx.invoice.create({
        data: {
          invoiceNo,
          propertyId: session.propertyId!,
          guestId: guestId || null,
          subtotal: subtotal,
          discountAmount: membershipDiscount || 0,
          taxAmount: taxAmount,
          totalAmount: grandTotal,
          paymentStatus: isPayLater ? 'UNPAID' : 'PAID',
          invoiceStatus: isPayLater ? 'PENDING' : 'SETTLED',
          tableNo: posOrder?.tableNo || null,
          orderType: orderType || posOrder?.orderType || 'DINE_IN',
          posOrderId: posOrder?.id || null,
          membershipCardId: membershipCardId || null,
          membershipDiscount: membershipDiscount || 0,
        },
      });

      // 4. Create Invoice Items
      await tx.invoiceItem.createMany({
        data: itemsWithTax.map((item: any) => {
          return {
            invoiceId: invoice.id,
            productId: item.id,
            hsnCode: item.hsnCode || null,
            qty: item.qty,
            unitPrice: item.unitPrice,
            taxAmount: item.lineTax,
            totalAmount: item.qty * item.unitPrice,
          };
        }),
      });

      // 5. Create Settlement & Payment ( Financial Tracking )
      await tx.settlement.create({
        data: {
          propertyId: session.propertyId!,
          settlementNo: `SET-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
          sourceId: invoice.id,
          sourceType: 'INVOICE',
          guestId: guestId || null,
          grossAmount: grandTotal,
          paidAmount: isPayLater ? 0 : grandTotal,
          balanceAmount: isPayLater ? grandTotal : 0,
          status: isPayLater ? 'PENDING' : 'COMPLETED',
          settlementDate: new Date(),
        }
      });

      if (!isPayLater) {
        await tx.payment.create({
          data: {
            paymentNo: `PAY-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
            propertyId: session.propertyId!,
            amount: grandTotal,
            paymentModeId: paymentModeId,
            paidToAccountId: cashAccount.id,
          },
        });
      }

      // 6. Record Membership Usage
      if (membershipCardId) {
        await tx.membershipUsage.create({
          data: {
            membershipCardId,
            posOrderId: posOrder.id,
            discountApplied: membershipDiscount || 0,
          }
        });
      }

      // 7. Update Table Status to VACANT
      if (restaurantTableId) {
        await (tx as any).table.update({
          where: { id: restaurantTableId },
          data: { status: 'VACANT' }
        });
      }

      // 8. Inventory Deduction (Recipes)
      try {
        const warehouse = await tx.warehouse.findFirst({
          where: { propertyId: session.propertyId!, name: { contains: 'Kitchen' } }
        }) || await tx.warehouse.findFirst({
          where: { propertyId: session.propertyId! }
        });

        if (warehouse) {
          for (const item of itemsWithTax) {
            const ingredients = await tx.productIngredient.findMany({
              where: { productId: item.id }
            });

            for (const ing of ingredients) {
              const lastMovement = await tx.stockMovement.findFirst({
                where: { stockItemId: ing.stockItemId, warehouseId: warehouse.id },
                orderBy: { movementDate: 'desc' }
              });

              const currentBalance = lastMovement?.balanceQty || 0;
              const qtyOut = ing.quantity * item.qty;

              await tx.stockMovement.create({
                data: {
                  propertyId: session.propertyId!,
                  warehouseId: warehouse.id,
                  stockItemId: ing.stockItemId,
                  movementType: 'SALE_OUT',
                  referenceModule: 'POS_ORDER',
                  referenceId: posOrder.id,
                  qtyIn: 0,
                  qtyOut: qtyOut,
                  balanceQty: currentBalance - qtyOut,
                  movementDate: new Date(),
                }
              });
            }
            
            // Also check for legacy 1-to-1 mapping
            const product = await tx.product.findUnique({
              where: { id: item.id },
              select: { stockItemId: true, trackInventory: true }
            });

            if (product?.trackInventory && product.stockItemId) {
              // Only deduct if not already handled by ingredients to avoid double deduction
              const alreadyHandled = ingredients.some((i: any) => i.stockItemId === product.stockItemId);
              if (!alreadyHandled) {
                const lastMovement = await tx.stockMovement.findFirst({
                  where: { stockItemId: product.stockItemId, warehouseId: warehouse.id },
                  orderBy: { movementDate: 'desc' }
                });

                const currentBalance = lastMovement?.balanceQty || 0;
                const qtyOut = item.qty;

                await tx.stockMovement.create({
                  data: {
                    propertyId: session.propertyId!,
                    warehouseId: warehouse.id,
                    stockItemId: product.stockItemId,
                    movementType: 'SALE_OUT',
                    referenceModule: 'POS_ORDER',
                    referenceId: posOrder.id,
                    qtyIn: 0,
                    qtyOut: qtyOut,
                    balanceQty: currentBalance - qtyOut,
                    movementDate: new Date(),
                  }
                });
              }
            }
          }
        }
      } catch (invErr) {
        console.error('Inventory Deduction Error (Non-blocking):', invErr);
      }

      return { invoice, orderNo: posOrder.orderNo, grandTotal, driverId: posOrder.driverId || driverId };
    });

    // Check Driver Offer rule
    if (result.driverId) {
      processDriverRide(result.driverId).catch(err => console.error('Driver Engine Error:', err));
    }

    // Notifications (SMS & WhatsApp)
    if (guestId) {
      const guest = await prisma.guest.findUnique({ where: { id: guestId } });
      const property = await prisma.property.findUnique({ where: { id: session.propertyId! } });
      
      if (guest?.mobile) {
        // 1. WhatsApp Receipt
        if (sendWhatsApp) {
          const templateSetting = await prisma.systemSetting.findUnique({ where: { key: 'WHATSAPP_TEMPLATE_BILL' } });
          const message = formatWhatsAppReceipt({ ...result, items }, property, templateSetting?.value);
          
          sendWhatsAppMessage({
            mobile: guest.mobile,
            message: message,
            propertyId: session.propertyId!
          }).catch(err => console.error('Failed to trigger WhatsApp:', err));
        }

        // 2. Standard SMS
        sendSMS(guest.mobile, 'TEMPLATE_BILL_PAID', {
          NAME: guest.firstName || 'Guest',
          AMOUNT: result.grandTotal.toString(),
          HOTEL: property?.name || 'OrderMint Solutions',
          ORDER_NO: result.orderNo
        }).catch(err => console.error('Failed to trigger SMS:', err));
      }
    }

    return apiResponse(result, 'Checkout successful', 201);
  } catch (error: any) {
    console.error('Checkout Error:', error);
    return apiError(error, 400);
  }
}
