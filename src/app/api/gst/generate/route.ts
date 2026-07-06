import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError, resolveAdminProperty } from '@/lib/api-utils';
import { getSession } from '@/lib/session';

// ────────────────────────────────────────────────────────────────────────────
// GSTN JSON Builder — GSTR-1 / GSTR-3B
// ────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/gst/generate
 * Body: { month: "03", year: "2026", returnType: "GSTR-1", saveDraft: true }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const body = await request.json();
    const { month, year, date, returnType = 'GSTR-1', saveDraft = false } = body;

    const propertyId = await resolveAdminProperty(session, prisma);
    if (!propertyId) return apiError(new Error('No property found'), 404);

    // ── 1. Fetch Property GST config ─────────────────────────────────────────
    const property = await prisma.property.findFirst({
      where: { id: propertyId },
      include: { organization: { select: { gstNumber: true, legalName: true, name: true } } }
    });

    if (!property) return apiError(new Error('Property not found'), 404);

    const gstin = property.organization?.gstNumber || '';
    const stateCode = property.stateCode || '27'; // default Maharashtra

    let startDate: Date;
    let endDate: Date;
    let filingPeriod: string;

    if (date) {
      // Daily period selection
      startDate = new Date(`${date}T00:00:00`);
      endDate = new Date(`${date}T23:59:59.999`);
      filingPeriod = `D${date.split('-').reverse().join('')}`; // e.g. "D06072026"
    } else {
      // Monthly period selection
      if (!month || !year) {
        return apiError(new Error('Month and Year are required'), 400);
      }
      startDate = new Date(`${year}-${month.toString().padStart(2, '0')}-01T00:00:00`);
      endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1);
      endDate.setMilliseconds(-1);
      filingPeriod = `${month.toString().padStart(2, '0')}${year}`; // e.g. "072026"
    }

    // ── 3. Fetch all completed/settled POS orders with items ─────────────────
    const orders = await prisma.posOrder.findMany({
      where: {
        propertyId: propertyId,
        status: { in: ['SETTLED', 'COMPLETED', 'BILL_PRINTED'] },
        createdAt: { gte: startDate, lte: endDate },
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                hsnCode: true,
                name: true,
                taxRate: true,
                unit: true,
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    // ── 3.5 Fetch all settled Invoices (from PMS/Room Service / PM) ───────────
    const invoices = await prisma.invoice.findMany({
      where: {
        propertyId: propertyId,
        paymentStatus: 'PAID',
        invoiceDate: { gte: startDate, lte: endDate },
        posOrderId: null, // Exclude invoices linked to POS orders to avoid double counting
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                hsnCode: true,
                name: true,
                taxRate: true,
                unit: true,
              }
            }
          }
        }
      },
      orderBy: { invoiceDate: 'asc' }
    });

    const totalInvoiceCount = orders.length + invoices.length;

    if (totalInvoiceCount === 0) {
      return apiResponse({
        json: null,
        summary: {
          totalInvoices: 0,
          totalTaxableValue: 0,
          totalCGST: 0,
          totalSGST: 0,
          totalIGST: 0,
          totalGrandTotal: 0,
          period: filingPeriod,
          gstin,
        },
        detailedInvoices: [],
        message: 'No completed POS orders or PMS invoices found for this period.',
      }, 'No orders found');
    }

    // ── 4. Build B2CS groups: key = "taxRate|stateCode" ──────────────────────
    const b2csMap: Record<string, {
      rt: number; txval: number; camt: number; samt: number; iamt: number; csamt: number;
    }> = {};

    // ── 5. Build HSN summary: key = "hsnCode|taxRate" ────────────────────────
    const hsnMap: Record<string, {
      hsn_sc: string; desc: string; uqc: string;
      cnt: number; txval: number; camt: number; samt: number; iamt: number; csamt: number; rt: number;
    }> = {};

    let totalTaxable = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    let totalIgst = 0;
    let totalGrand = 0;
    let firstOrderNo = '';
    let lastOrderNo = '';

    const detailedInvoices: any[] = [];

    // Loop through POS Orders
    orders.forEach((order: any, idx: any) => {
      if (idx === 0 && !firstOrderNo) firstOrderNo = order.orderNo;
      if (order.orderNo) lastOrderNo = order.orderNo;

      let orderTaxable = 0;
      let orderCgst = 0;
      let orderSgst = 0;

      order.items.forEach((item: any) => {
        const taxRate = item.product?.taxRate ?? 0;
        const hsnCode = item.product?.hsnCode || '996331'; // default restaurant SAC
        const itemName = item.product?.name || 'Service';
        const unit = item.product?.unit || 'OTH';

        const totalAmt = item.totalAmount;
        const taxAmt = item.taxAmount || 0;
        const taxable = round2(totalAmt - taxAmt);
        const cgst = round2(taxAmt / 2);
        const sgst = round2(taxAmt / 2);

        totalTaxable += taxable;
        totalCgst += cgst;
        totalSgst += sgst;
        totalGrand += totalAmt;
        
        orderTaxable += taxable;
        orderCgst += cgst;
        orderSgst += sgst;

        // B2CS
        const b2csKey = `${taxRate}|${stateCode}`;
        if (!b2csMap[b2csKey]) {
          b2csMap[b2csKey] = { rt: taxRate, txval: 0, camt: 0, samt: 0, iamt: 0, csamt: 0 };
        }
        b2csMap[b2csKey].txval = round2(b2csMap[b2csKey].txval + taxable);
        b2csMap[b2csKey].camt = round2(b2csMap[b2csKey].camt + cgst);
        b2csMap[b2csKey].samt = round2(b2csMap[b2csKey].samt + sgst);

        // HSN
        const hsnKey = `${hsnCode}|${taxRate}`;
        if (!hsnMap[hsnKey]) {
          hsnMap[hsnKey] = {
            hsn_sc: hsnCode,
            desc: itemName.substring(0, 30),
            uqc: unit === 'NOS' ? 'NOS' : 'OTH',
            cnt: 0,
            txval: 0, camt: 0, samt: 0, iamt: 0, csamt: 0,
            rt: taxRate
          };
        }
        hsnMap[hsnKey].cnt += item.quantity;
        hsnMap[hsnKey].txval = round2(hsnMap[hsnKey].txval + taxable);
        hsnMap[hsnKey].camt = round2(hsnMap[hsnKey].camt + cgst);
        hsnMap[hsnKey].samt = round2(hsnMap[hsnKey].samt + sgst);
      });

      detailedInvoices.push({
        orderNo: order.orderNo,
        date: order.createdAt,
        taxable: round2(orderTaxable),
        cgst: round2(orderCgst),
        sgst: round2(orderSgst),
        total: order.grandTotal,
        status: order.status
      });
    });

    // Loop through PMS Room Invoices
    invoices.forEach((inv: any) => {
      if (!firstOrderNo) firstOrderNo = inv.invoiceNo;
      if (inv.invoiceNo) lastOrderNo = inv.invoiceNo;

      let invTaxable = 0;
      let invCgst = 0;
      let invSgst = 0;

      inv.items.forEach((item: any) => {
        const taxRate = item.taxRate ?? item.product?.taxRate ?? 0;
        const hsnCode = item.product?.hsnCode || (item.productName?.toLowerCase().includes('room') ? '996311' : '996331');
        const itemName = item.productName || item.product?.name || 'Service';
        const unit = item.product?.unit || 'OTH';

        const totalAmt = item.totalAmount;
        const taxAmt = item.taxAmount || 0;
        const taxable = round2(totalAmt - taxAmt);
        const cgst = round2(taxAmt / 2);
        const sgst = round2(taxAmt / 2);

        totalTaxable += taxable;
        totalCgst += cgst;
        totalSgst += sgst;
        totalGrand += totalAmt;
        
        invTaxable += taxable;
        invCgst += cgst;
        invSgst += sgst;

        // B2CS
        const b2csKey = `${taxRate}|${stateCode}`;
        if (!b2csMap[b2csKey]) {
          b2csMap[b2csKey] = { rt: taxRate, txval: 0, camt: 0, samt: 0, iamt: 0, csamt: 0 };
        }
        b2csMap[b2csKey].txval = round2(b2csMap[b2csKey].txval + taxable);
        b2csMap[b2csKey].camt = round2(b2csMap[b2csKey].camt + cgst);
        b2csMap[b2csKey].samt = round2(b2csMap[b2csKey].samt + sgst);

        // HSN
        const hsnKey = `${hsnCode}|${taxRate}`;
        if (!hsnMap[hsnKey]) {
          hsnMap[hsnKey] = {
            hsn_sc: hsnCode,
            desc: itemName.substring(0, 30),
            uqc: unit === 'NOS' ? 'NOS' : 'OTH',
            cnt: 0,
            txval: 0, camt: 0, samt: 0, iamt: 0, csamt: 0,
            rt: taxRate
          };
        }
        hsnMap[hsnKey].cnt += item.quantity;
        hsnMap[hsnKey].txval = round2(hsnMap[hsnKey].txval + taxable);
        hsnMap[hsnKey].camt = round2(hsnMap[hsnKey].camt + cgst);
        hsnMap[hsnKey].samt = round2(hsnMap[hsnKey].samt + sgst);
      });

      detailedInvoices.push({
        orderNo: inv.invoiceNo,
        date: inv.invoiceDate,
        taxable: round2(invTaxable),
        cgst: round2(invCgst),
        sgst: round2(invSgst),
        total: inv.totalAmount,
        status: inv.invoiceStatus || 'PAID'
      });
    });

    // Round final totals
    totalTaxable = round2(totalTaxable);
    totalCgst = round2(totalCgst);
    totalSgst = round2(totalSgst);
    totalGrand = round2(totalGrand);

    // ── 6. Build b2cs array ───────────────────────────────────────────────────
    const b2cs = Object.values(b2csMap)
      .filter(item => item.txval > 0)
      .map((item: any) => ({
        sply_ty: 'INTRA',
        pos: stateCode,
        typ: 'OE',
        rt: item.rt,
        txval: item.txval,
        iamt: item.iamt,
        camt: item.camt,
        samt: item.samt,
        csamt: item.csamt,
      }));

    // ── 7. Build HSN data array ───────────────────────────────────────────────
    const hsnData = Object.values(hsnMap)
      .filter(h => h.txval > 0)
      .map((h, i) => ({
        num: i + 1,
        hsn_sc: h.hsn_sc,
        desc: h.desc,
        uqc: h.uqc,
        qty: h.cnt,
        val: round2(h.txval + h.iamt + h.camt + h.samt + h.csamt),
        rt: h.rt,
        txval: h.txval,
        iamt: h.iamt,
        camt: h.camt,
        samt: h.samt,
        csamt: h.csamt,
      }));

    // ── 8. Document summary ───────────────────────────────────────────────────
    const doc_issue = {
      doc_det: [{
        doc_num: 1,
        docs: [{
          num: 1,
          from: firstOrderNo,
          to: lastOrderNo,
          totnum: totalInvoiceCount,
          cancel: 0,
          net_issue: totalInvoiceCount,
        }]
      }]
    };

    // ── 9. Final GSTN JSON ────────────────────────────────────────────────────
    const gstJson = {
      version: 'GST3.0.4',
      hash: 'hash',
      gstin: gstin,
      fp: filingPeriod,
      gt: 0,
      cur_gt: 0,
      ...(b2cs.length > 0 && { b2cs }),
      ...(hsnData.length > 0 && { hsn: { data: hsnData } }),
      doc_issue,
    };

    // ── 10. Optionally save as draft ─────────────────────────────────────────
    let filingId: string | null = null;
    if (saveDraft) {
      const existing = await prisma.gstFiling.findFirst({
        where: {
          propertyId: propertyId,
          filingMonth: filingPeriod,
          returnType,
          status: 'DRAFT',
        }
      });

      if (existing) {
        const updated = await prisma.gstFiling.update({
          where: { id: existing.id },
          data: {
            jsonData: JSON.stringify(gstJson),
            totalTaxable,
            totalCgst,
            totalSgst,
            totalIgst,
            totalAmount: totalGrand,
            invoiceCount: totalInvoiceCount,
            generatedAt: new Date(),
          }
        });
        filingId = updated.id;
      } else {
        const created = await prisma.gstFiling.create({
          data: {
            propertyId: propertyId,
            filingMonth: filingPeriod,
            returnType,
            status: 'DRAFT',
            jsonData: JSON.stringify(gstJson),
            totalTaxable,
            totalCgst,
            totalSgst,
            totalIgst,
            totalAmount: totalGrand,
            invoiceCount: totalInvoiceCount,
          }
        });
        filingId = created.id;
      }
    }

    return apiResponse({
      filingId,
      json: gstJson,
      detailedInvoices,
      summary: {
        totalInvoices: totalInvoiceCount,
        totalTaxableValue: totalTaxable,
        totalCGST: totalCgst,
        totalSGST: totalSgst,
        totalIGST: totalIgst,
        totalGrandTotal: totalGrand,
        period: filingPeriod,
        gstin,
      }
    }, 'GSTR-1 JSON generated successfully');

  } catch (error) {
    console.error('GST Generate Error:', error);
    return apiError(error);
  }
}

// Helper: round to 2 decimal places
function round2(val: number): number {
  return Math.round(val * 100) / 100;
}
