import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const settings = await prisma.websiteSettings.findFirst();
    
    if (!settings) {
      // Create default settings if not exists
      const newSettings = await prisma.websiteSettings.create({
        data: {
          hotelName: 'OrderMint Solutions',
          address: '123 Tech Park, Silicon Valley, CA 94025, USA',
          email: 'support@ordermint.com',
          storyTitle: 'Our Mission – Redefining POS for the Modern Era',
        },
      });
      return apiResponse(newSettings);
    }
    
    return apiResponse(settings);
  } catch (error) {
    return apiError(error);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    let settings = await prisma.websiteSettings.findFirst();
    
    if (settings) {
      // Create a dynamic data object based on what's provided in body
      const updateData: any = {};
      const fields = [
        'hotelName', 'logoUrl', 'address', 'email', 'phone', 
        'storyTitle', 'storyContent', 'storyImage1', 'storyImage2',
        'mapIframe', 'facebookUrl', 'instagramUrl', 'twitterUrl',
        'galleryHeroVideoUrl', 'galleryHeroImageUrl', 'bookingRedirectToContact',
        'smtpHost', 'smtpPort', 'smtpEmail', 'smtpPassword', 'contactReceiverEmail'
      ];
      
      fields.forEach(field => {
        if (field in body) {
          updateData[field] = body[field];
        }
      });

      settings = await prisma.websiteSettings.update({
        where: { id: settings.id },
        data: updateData,
      });
    } else {
      settings = await prisma.websiteSettings.create({
        data: body,
      });
    }
    return apiResponse(settings, 'Settings updated successfully');
  } catch (error) {
    return apiError(error);
  }
}
