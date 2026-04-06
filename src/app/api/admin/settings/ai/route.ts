import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';
import { getSession } from '@/lib/session';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const hasPermission = session.role === 'SUPER_ADMIN' || session.role === 'RESTAURANTS_ADMIN' || await prisma.rolePermission.findFirst({
      where: { 
        roleId: session.roleId,
        permission: { module: 'Settings' }
      }
    });

    if (!hasPermission) {
      return apiError(new Error('Unauthorized'), 401);
    }

    const setting = await prisma.systemSetting.findUnique({
      where: { key: 'GEMINI_API_KEY' }
    });

    return apiResponse({ geminiApiKey: setting?.value || '' });

  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const hasPermission = session.role === 'SUPER_ADMIN' || session.role === 'RESTAURANTS_ADMIN' || await prisma.rolePermission.findFirst({
      where: { 
        roleId: session.roleId,
        permission: { module: 'Settings' }
      }
    });

    if (!hasPermission) {
      return apiError(new Error('Unauthorized'), 401);
    }

    const body = await request.json();
    const { geminiApiKey } = body;

    if (!geminiApiKey) {
      return apiError(new Error('API Key is required'), 400);
    }

    const setting = await prisma.systemSetting.upsert({
      where: { key: 'GEMINI_API_KEY' },
      update: { value: geminiApiKey },
      create: { key: 'GEMINI_API_KEY', value: geminiApiKey }
    });

    return apiResponse(null, 'API Key saved successfully');

  } catch (error) {
    return apiError(error);
  }
}
