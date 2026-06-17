import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';
import { getSession } from '@/lib/session';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getSession();
    console.log('--- Property Update Start ---');
    console.log('Session PropertyID:', session?.propertyId);
    console.log('Target PropertyID [params.id]:', id);

    if (!session) return apiError(new Error('Unauthorized'), 401);

    const body = await request.json();
    console.log('Incoming Payload:', body);
    const { name, brandName, logoUrl, city, state, country, address, phone, taxDetails, posAutoLockTimeout, posLockScreenMessage, posLockScreenBgUrl, posTerminalPin, thermalPrinterName, enableDirectPrinting, restaurantPosEnabled, showRestaurantInQrMenu, barPosEnabled, showBarInQrMenu, cafePosEnabled, showCafeInQrMenu, deliveryEnabled, showDeliveryInQrMenu, upiId, upiName, upiLimit, upiId2, upiName2, upiLimit2, whatsAppEnabled, whatsAppProvider, metaAccessToken, metaPhoneId, metaVerifyToken, twilioAccountSid, twilioAuthToken, twilioFromNumber, whatsAppApiKey, whatsAppInstanceId, whatsAppTemplate, whatsAppWelcomeMessage, targetShiftHours, latitude, longitude } = body;
    const isSuperAdmin = session.role === 'SUPER_ADMIN';

    const updateData: any = {};
    if (latitude !== undefined) updateData.latitude = latitude !== null ? Number(latitude) : null;
    if (longitude !== undefined) updateData.longitude = longitude !== null ? Number(longitude) : null;
    if (name !== undefined) updateData.name = name;
    if (whatsAppEnabled !== undefined) updateData.whatsAppEnabled = whatsAppEnabled;
    if (whatsAppProvider !== undefined) updateData.whatsAppProvider = whatsAppProvider;
    if (whatsAppApiKey !== undefined) updateData.whatsAppApiKey = whatsAppApiKey;
    if (whatsAppInstanceId !== undefined) updateData.whatsAppInstanceId = whatsAppInstanceId;
    if (whatsAppTemplate !== undefined) updateData.whatsAppTemplate = whatsAppTemplate;
    if (whatsAppWelcomeMessage !== undefined) updateData.whatsAppWelcomeMessage = whatsAppWelcomeMessage;

    // Only SUPER_ADMIN is allowed to update global platform developer keys
    if (isSuperAdmin) {
      if (metaAccessToken !== undefined) updateData.metaAccessToken = metaAccessToken;
      if (metaPhoneId !== undefined) updateData.metaPhoneId = metaPhoneId;
      if (metaVerifyToken !== undefined) updateData.metaVerifyToken = metaVerifyToken;
      if (twilioAccountSid !== undefined) updateData.twilioAccountSid = twilioAccountSid;
      if (twilioAuthToken !== undefined) updateData.twilioAuthToken = twilioAuthToken;
      if (twilioFromNumber !== undefined) updateData.twilioFromNumber = twilioFromNumber;
    }
    if (brandName !== undefined) updateData.brandName = brandName;
    if (logoUrl !== undefined) updateData.logoUrl = logoUrl;
    if (city !== undefined) updateData.city = city;
    if (state !== undefined) updateData.state = state;
    if (country !== undefined) updateData.country = country;
    if (address !== undefined) updateData.address = address;
    if (phone !== undefined) updateData.phone = phone;
    if (taxDetails !== undefined) updateData.taxDetails = taxDetails;
    if (posAutoLockTimeout !== undefined) updateData.posAutoLockTimeout = posAutoLockTimeout;
    if (posLockScreenMessage !== undefined) updateData.posLockScreenMessage = posLockScreenMessage;
    if (posLockScreenBgUrl !== undefined) updateData.posLockScreenBgUrl = posLockScreenBgUrl;
    if (posTerminalPin !== undefined) updateData.posTerminalPin = posTerminalPin;
    if (thermalPrinterName !== undefined) updateData.thermalPrinterName = thermalPrinterName;
    if (enableDirectPrinting !== undefined) updateData.enableDirectPrinting = enableDirectPrinting;
    // Enforce POS terminal count limit based on Organization's Package
    const existingProperty = await prisma.property.findUnique({
      where: { id },
      include: { organization: { include: { package: { include: { features: true } } } } }
    });

    if (existingProperty) {
      const isRestEnabled = restaurantPosEnabled !== undefined ? restaurantPosEnabled : (existingProperty.restaurantPosEnabled !== false);
      const isBarEnabled = barPosEnabled !== undefined ? barPosEnabled : !!existingProperty.barPosEnabled;
      const isCafeEnabled = cafePosEnabled !== undefined ? cafePosEnabled : !!existingProperty.cafePosEnabled;

      let selectedCount = 0;
      if (isRestEnabled) selectedCount++;
      if (isBarEnabled) selectedCount++;
      if (isCafeEnabled) selectedCount++;

      if (existingProperty.organization?.package) {
        // 1. Enforce allowedPosCount
        const limit = existingProperty.organization.package.allowedPosCount ?? 1;
        if (selectedCount > limit) {
          return apiError(new Error(`Your subscription plan allows a maximum of ${limit} POS terminal(s). You selected ${selectedCount}.`), 400);
        }

        // 2. Enforce specific module feature gating
        const packageFeatures = existingProperty.organization.package.features.map((f: any) => f.feature);
        const isDelivEnabled = deliveryEnabled !== undefined ? deliveryEnabled : !!existingProperty.deliveryEnabled;

        if (isRestEnabled && !packageFeatures.includes('POS')) {
          return apiError(new Error('Restaurant POS is not included in this package plan.'), 400);
        }
        if (isBarEnabled && !packageFeatures.includes('BARPOS')) {
          return apiError(new Error('Bar POS is not included in this package plan.'), 400);
        }
        if (isCafeEnabled && !packageFeatures.includes('CAFEPOS')) {
          return apiError(new Error('Cafe POS is not included in this package plan.'), 400);
        }
        // Home Delivery is allowed for all package plans
        // if (isDelivEnabled && !packageFeatures.includes('DRIVERS')) {
        //   return apiError(new Error('Home Delivery is not included in this package plan.'), 400);
        // }
      }
    }

    if (restaurantPosEnabled !== undefined) updateData.restaurantPosEnabled = restaurantPosEnabled;
    if (showRestaurantInQrMenu !== undefined) updateData.showRestaurantInQrMenu = showRestaurantInQrMenu;
    if (barPosEnabled !== undefined) updateData.barPosEnabled = barPosEnabled;
    if (showBarInQrMenu !== undefined) updateData.showBarInQrMenu = showBarInQrMenu;
    if (cafePosEnabled !== undefined) updateData.cafePosEnabled = cafePosEnabled;
    if (showCafeInQrMenu !== undefined) updateData.showCafeInQrMenu = showCafeInQrMenu;
    if (deliveryEnabled !== undefined) updateData.deliveryEnabled = deliveryEnabled;
    if (showDeliveryInQrMenu !== undefined) updateData.showDeliveryInQrMenu = showDeliveryInQrMenu;
    if (upiId !== undefined) updateData.upiId = upiId;
    if (upiName !== undefined) updateData.upiName = upiName;
    if (upiLimit !== undefined) updateData.upiLimit = upiLimit;
    if (upiId2 !== undefined) updateData.upiId2 = upiId2;
    if (upiName2 !== undefined) updateData.upiName2 = upiName2;
    if (upiLimit2 !== undefined) updateData.upiLimit2 = upiLimit2;
    if (targetShiftHours !== undefined) updateData.targetShiftHours = Number(targetShiftHours);

    console.log('Processed Update Data:', updateData);

    const fields = Object.keys(updateData);
    const values = Object.values(updateData);
    
    if (fields.length > 0) {
      // PostgreSQL uses $1, $2... instead of ?
      const setClause = fields.map((f, i) => `"${f}" = $${i + 1}`).join(', ');
      const sql = `UPDATE "Property" SET ${setClause}, "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = $${fields.length + 1}`;
      console.log('Executing Raw SQL:', sql);
      console.log('With Values:', [...values, id]);
      await (prisma as any).$executeRawUnsafe(sql, ...values, id);
    }

    const property = await prisma.property.findUnique({ where: { id } });

    if (property && !isSuperAdmin) {
      (property as any).metaAccessToken = null;
      (property as any).metaPhoneId = null;
      (property as any).metaVerifyToken = null;
      (property as any).twilioAccountSid = null;
      (property as any).twilioAuthToken = null;
      (property as any).twilioFromNumber = null;
    }

    return apiResponse(property, 'Branding settings updated successfully');
  } catch (error: any) {
    console.error('Property update error [ID:', id, ']:', error);
    return apiError(error);
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const property = await prisma.property.findUnique({
      where: { id },
    });

    if (!property) return apiError(new Error('Property not found'), 404);

    const isSuperAdmin = session.role === 'SUPER_ADMIN';
    if (!isSuperAdmin) {
      (property as any).metaAccessToken = null;
      (property as any).metaPhoneId = null;
      (property as any).metaVerifyToken = null;
      (property as any).twilioAccountSid = null;
      (property as any).twilioAuthToken = null;
      (property as any).twilioFromNumber = null;
    }

    return apiResponse(property);
  } catch (error) {
    return apiError(error);
  }
}
