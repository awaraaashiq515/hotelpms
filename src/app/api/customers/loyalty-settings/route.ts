import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';
import { getSession } from '@/lib/session';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.organizationId) {
      return apiError(new Error('Unauthorized'), 401);
    }

    const settings = await prisma.systemSetting.findMany({
      where: {
        key: {
          in: ['loyalty_earn_rate', 'loyalty_redeem_value', 'referral_bonus_points']
        }
      }
    });

    // Map database settings to a key-value object
    const settingsMap = settings.reduce((acc: Record<string, string>, s: any) => {
      acc[s.key] = s.value;
      return acc;
    }, {});

    const loyaltyEarnRate = settingsMap['loyalty_earn_rate'] !== undefined ? Number(settingsMap['loyalty_earn_rate']) : 0.1;
    const loyaltyRedeemValue = settingsMap['loyalty_redeem_value'] !== undefined ? Number(settingsMap['loyalty_redeem_value']) : 1.0;
    const referralBonusPoints = settingsMap['referral_bonus_points'] !== undefined ? Number(settingsMap['referral_bonus_points']) : 50;

    return apiResponse({
      loyalty_earn_rate: loyaltyEarnRate,
      loyalty_redeem_value: loyaltyRedeemValue,
      referral_bonus_points: referralBonusPoints
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.organizationId) {
      return apiError(new Error('Unauthorized'), 401);
    }

    const body = await request.json();
    const { loyalty_earn_rate, loyalty_redeem_value, referral_bonus_points } = body;

    // Validation
    if (loyalty_earn_rate === undefined || loyalty_earn_rate === null || isNaN(Number(loyalty_earn_rate))) {
      return apiError(new Error('loyalty_earn_rate must be a valid number'), 400);
    }
    if (loyalty_redeem_value === undefined || loyalty_redeem_value === null || isNaN(Number(loyalty_redeem_value))) {
      return apiError(new Error('loyalty_redeem_value must be a valid number'), 400);
    }
    if (referral_bonus_points === undefined || referral_bonus_points === null || isNaN(Number(referral_bonus_points))) {
      return apiError(new Error('referral_bonus_points must be a valid number'), 400);
    }

    // Upsert all keys
    const settingsToSave = [
      { key: 'loyalty_earn_rate', value: String(loyalty_earn_rate) },
      { key: 'loyalty_redeem_value', value: String(loyalty_redeem_value) },
      { key: 'referral_bonus_points', value: String(referral_bonus_points) }
    ];

    for (const setting of settingsToSave) {
      await prisma.systemSetting.upsert({
        where: { key: setting.key },
        update: { value: setting.value },
        create: { key: setting.key, value: setting.value }
      });
    }

    return apiResponse(null, 'Loyalty settings updated successfully');
  } catch (error) {
    return apiError(error);
  }
}
