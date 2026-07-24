import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';
import { getSession } from '@/lib/session';
import { sendWhatsAppMessage } from '@/lib/whatsapp';
import { sendMail } from '@/lib/mail';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.propertyId) return apiError(new Error('Unauthorized'), 401);

    const campaigns = await prisma.campaign.findMany({
      where: { propertyId: session.propertyId },
      include: {
        coupon: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return apiResponse(campaigns);
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.propertyId || !session.organizationId) {
      return apiError(new Error('Unauthorized'), 401);
    }

    const propertyId = session.propertyId;
    const organizationId = session.organizationId;

    const body = await request.json();
    const { name, type, targetGroup, message, couponId } = body;

    if (!name || !type || !targetGroup || !message) {
      return apiError(new Error('Missing required fields: name, type, targetGroup, message'), 400);
    }

    // 1. Create campaign in DRAFT
    const campaign = await prisma.campaign.create({
      data: {
        name,
        type,
        targetGroup,
        message,
        couponId: couponId || null,
        propertyId,
        status: 'SENDING',
      },
    });

    // 2. Fetch target guests
    let guests: any[] = [];
    const now = new Date();
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(now.getDate() - 14);
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setDate(now.getDate() - 60);

    if (targetGroup === 'ALL') {
      guests = await prisma.guest.findMany({
        where: {
          organizationId,
          OR: [
            { mobile: { not: null } },
            { email: { not: null } }
          ]
        },
      });
    } else if (targetGroup === 'VIP' || targetGroup === 'REGULAR' || targetGroup === 'INACTIVE' || targetGroup === 'NEW') {
      guests = await prisma.guest.findMany({
        where: {
          organizationId,
          segment: targetGroup,
          OR: [
            { mobile: { not: null } },
            { email: { not: null } }
          ]
        },
      });
    } else if (targetGroup === 'BIRTHDAY_TODAY') {
      const allGuests = await prisma.guest.findMany({
        where: {
          organizationId,
          birthDate: { not: null },
          OR: [
            { mobile: { not: null } },
            { email: { not: null } }
          ]
        },
      });
      // Filter by today's day and month in memory (since SQLite doesn't have standard date functions)
      const currentDay = now.getDate();
      const currentMonth = now.getMonth();
      guests = allGuests.filter((g: any) => {
        if (!g.birthDate) return false;
        const b = new Date(g.birthDate);
        return b.getDate() === currentDay && b.getMonth() === currentMonth;
      });
    }

    if (guests.length === 0) {
      await prisma.campaign.update({
        where: { id: campaign.id },
        data: { status: 'SENT', sentAt: new Date() },
      });
      return apiResponse(campaign, 'Campaign launched, but no matching target guests found.');
    }

    // 3. Optional Coupon template loading
    let couponTemplate: any = null;
    if (couponId) {
      couponTemplate = await prisma.coupon.findUnique({
        where: { id: couponId },
      });
    }

    // Send messages asynchronously in the background so API does not hang
    (async () => {
      let successCount = 0;
      let failCount = 0;

      for (const guest of guests) {
        let personalMessage = message;
        personalMessage = personalMessage.replace(/{NAME}/g, `${guest.firstName} ${guest.lastName || ''}`.trim());

        // Dynamic Coupon generation per guest if couponTemplate is set
        if (couponTemplate) {
          const suffix = guest.id.slice(-4).toUpperCase();
          const guestCouponCode = `${couponTemplate.code}-${suffix}`;

          // Register guest-specific coupon in DB
          try {
            const alreadyExists = await prisma.coupon.findUnique({
              where: { code: guestCouponCode },
            });

            if (!alreadyExists) {
              await prisma.coupon.create({
                data: {
                  code: guestCouponCode,
                  discountType: couponTemplate.discountType,
                  discountValue: couponTemplate.discountValue,
                  minOrderValue: couponTemplate.minOrderValue,
                  maxDiscount: couponTemplate.maxDiscount,
                  expiryDate: couponTemplate.expiryDate,
                  propertyId,
                  assignedGuestId: guest.id,
                },
              });
            }
            personalMessage = personalMessage.replace(/{COUPON}/g, guestCouponCode);
          } catch (couponErr) {
            console.error('Failed to create guest personalized coupon:', couponErr);
            personalMessage = personalMessage.replace(/{COUPON}/g, couponTemplate.code);
          }
        }

        let sentWhatsApp = false;
        let sentEmail = false;

        if (guest.mobile && guest.mobile.trim() !== '') {
          try {
            const res = await sendWhatsAppMessage({
              mobile: guest.mobile,
              message: personalMessage,
              propertyId,
            });
            if (res.success) {
              sentWhatsApp = true;
            }
          } catch (sendErr) {
            console.error(`Failed to send WhatsApp campaign message to ${guest.mobile}:`, sendErr);
          }
        }

        if (guest.email && guest.email.trim() !== '') {
          try {
            const htmlContent = `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
                <div style="text-align: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid #f1f5f9;">
                  <h2 style="color: #ef4444; margin: 0; font-size: 20px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em;">GuestFlow Special Offer</h2>
                </div>
                <div style="font-size: 15px; color: #334155; line-height: 1.6; white-space: pre-wrap; margin-bottom: 24px;">
                  ${personalMessage}
                </div>
                <div style="text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 16px; text-transform: uppercase; letter-spacing: 0.1em;">
                  Sent via GuestFlow CRM Hub. Thank you for being our valued guest!
                </div>
              </div>
            `;
            const mailRes = await sendMail({
              to: guest.email,
              subject: name,
              html: htmlContent,
            });
            if (mailRes) {
              sentEmail = true;
            }
          } catch (mailErr) {
            console.error(`Failed to send email campaign message to ${guest.email}:`, mailErr);
          }
        }

        if (sentWhatsApp || sentEmail) {
          successCount++;
        } else {
          failCount++;
        }
      }

      await prisma.campaign.update({
        where: { id: campaign.id },
        data: {
          status: 'SENT',
          sentAt: new Date(),
          message: `${message}\n\n[Dispatch Status: ${successCount} sent, ${failCount} failed]`,
        },
      });
      console.log(`[Campaign Dispatch Finished] Campaign: ${name}. Sent: ${successCount}. Failed: ${failCount}.`);
    })().catch(err => console.error('Campaign background dispatcher crashed:', err));

    return apiResponse(campaign, `Campaign created. Sending messages to ${guests.length} customers in the background.`);
  } catch (error) {
    return apiError(error);
  }
}
