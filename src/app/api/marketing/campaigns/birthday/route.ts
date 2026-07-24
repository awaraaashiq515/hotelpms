import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';
import { getSession } from '@/lib/session';
import { sendWhatsAppMessage } from '@/lib/whatsapp';
import { sendMail } from '@/lib/mail';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.propertyId || !session.organizationId) {
      return apiError(new Error('Unauthorized'), 401);
    }

    const propertyId = session.propertyId;
    const organizationId = session.organizationId;

    // 1. Scan for guests whose birthday is today
    const now = new Date();
    const currentDay = now.getDate();
    const currentMonth = now.getMonth();

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

    const birthdayGuests = allGuests.filter((g: any) => {
      if (!g.birthDate) return false;
      const b = new Date(g.birthDate);
      return b.getDate() === currentDay && b.getMonth() === currentMonth;
    });

    if (birthdayGuests.length === 0) {
      return apiResponse({ sentCount: 0 }, 'No guests celebrating birthdays today.');
    }

    // 2. Fetch birthday campaign settings
    const bdayMessageSetting = await prisma.systemSetting.findUnique({
      where: { key: 'CAMPAIGN_BIRTHDAY_MESSAGE' },
    });
    const defaultMessage = `Dear {NAME}, Happy Birthday! 🎂🎉 We wish you an amazing year ahead! Here is a birthday treat from us: Use coupon code {COUPON} to get 15% off on your next visit. Valid for the next 7 days!`;
    const messageTemplate = bdayMessageSetting?.value || defaultMessage;

    // 3. Create or resolve a Birthday Coupon template
    let bdayCouponTemplate = await prisma.coupon.findFirst({
      where: { code: 'BDAY15', propertyId },
    });

    if (!bdayCouponTemplate) {
      // Auto-create template
      const nextWeek = new Date();
      nextWeek.setDate(now.getDate() + 7);
      bdayCouponTemplate = await prisma.coupon.create({
        data: {
          code: 'BDAY15',
          discountType: 'PERCENTAGE',
          discountValue: 15,
          minOrderValue: 500,
          maxDiscount: 200,
          expiryDate: nextWeek,
          propertyId,
          isActive: true,
        },
      });
    }

    // 4. Create campaign audit log
    const campaign = await prisma.campaign.create({
      data: {
        name: `Automated Birthday Campaign - ${now.toLocaleDateString()}`,
        type: 'BIRTHDAY',
        targetGroup: 'BIRTHDAY_TODAY',
        message: messageTemplate,
        couponId: bdayCouponTemplate.id,
        propertyId,
        status: 'SENT',
        sentAt: now,
      },
    });

    let sentCount = 0;

    // 5. Send messages
    for (const guest of birthdayGuests) {
      const suffix = guest.id.slice(-4).toUpperCase();
      const personalCouponCode = `BDAY-${suffix}`;

      // Create guest-specific coupon
      const expiry = new Date();
      expiry.setDate(now.getDate() + 7);

      try {
        const existingCoupon = await prisma.coupon.findUnique({
          where: { code: personalCouponCode },
        });

        if (!existingCoupon) {
          await prisma.coupon.create({
            data: {
              code: personalCouponCode,
              discountType: 'PERCENTAGE',
              discountValue: 15,
              minOrderValue: 500,
              maxDiscount: 200,
              expiryDate: expiry,
              propertyId,
              assignedGuestId: guest.id,
            },
          });
        }
      } catch (cErr) {
        console.error('Failed to create birthday coupon:', cErr);
      }

      let personalMessage = messageTemplate
        .replace(/{NAME}/g, `${guest.firstName} ${guest.lastName || ''}`.trim())
        .replace(/{COUPON}/g, personalCouponCode);

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
          console.error(`Birthday WhatsApp send failed for ${guest.mobile}:`, sendErr);
        }
      }

      if (guest.email && guest.email.trim() !== '') {
        try {
          const htmlContent = `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
              <div style="text-align: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid #f1f5f9;">
                <h2 style="color: #ef4444; margin: 0; font-size: 20px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em;">Happy Birthday! 🎂🎉</h2>
              </div>
              <div style="font-size: 15px; color: #334155; line-height: 1.6; white-space: pre-wrap; margin-bottom: 24px;">
                ${personalMessage}
              </div>
              <div style="text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 16px; text-transform: uppercase; letter-spacing: 0.1em;">
                Sent via GuestFlow CRM Hub. Have a wonderful birthday celebration!
              </div>
            </div>
          `;
          const mailRes = await sendMail({
            to: guest.email,
            subject: 'Happy Birthday from GuestFlow! 🎂🎉',
            html: htmlContent,
          });
          if (mailRes) {
            sentEmail = true;
          }
        } catch (mailErr) {
          console.error(`Birthday email send failed for ${guest.email}:`, mailErr);
        }
      }

      if (sentWhatsApp || sentEmail) {
        sentCount++;
      }
    }

    await prisma.campaign.update({
      where: { id: campaign.id },
      data: {
        message: `${messageTemplate}\n\n[Dispatch Status: ${sentCount} sent successfully]`,
      },
    });

    return apiResponse({ sentCount }, `Successfully sent birthday greetings to ${sentCount} guests.`);
  } catch (error) {
    return apiError(error);
  }
}
