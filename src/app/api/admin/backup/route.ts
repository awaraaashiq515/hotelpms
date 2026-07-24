import { NextRequest } from 'next/server';
import { apiResponse, apiError } from '@/lib/api-utils';
import { prisma } from '@/lib/prisma';
import { generateBackupData } from '@/lib/backup-utils';
import { sendMail } from '@/lib/mail';

export async function POST(req: NextRequest) {
  try {
    // 1. Get Session (assuming auth middleware is in place or using a helper)
    const sessionRes = await fetch(new URL('/api/auth/session', req.url), {
      headers: req.headers,
    });
    const session = await sessionRes.json();

    if (!session.authenticated || (session.user.role !== 'RESTAURANTS_ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return apiError('Unauthorized', 401);
    }

    const { user } = session;
    const organizationId = user.organizationId;
    const propertyId = req.nextUrl.searchParams.get('propertyId');

    if (!organizationId) {
      return apiError('Organization not found for this user', 404);
    }

    // 2. Generate Data
    const backupData = await generateBackupData(organizationId, propertyId || undefined);

    if (!backupData) {
      return apiError('Could not generate backup data', 500);
    }

    // 3. Prepare Email Attachment
    const jsonString = JSON.stringify(backupData, null, 2);
    const fileName = `backup_${organizationId}_${new Date().toISOString().split('T')[0]}.json`;

    // 4. Send Email
    const emailSent = await sendMail({
      to: user.email,
      subject: `Data Backup: ${backupData.organization.name} - ${new Date().toLocaleDateString()}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #6366f1;">Data Backup Successful</h2>
          <p>Hello <b>${user.fullName}</b>,</p>
          <p>Your requested data backup for <b>${backupData.organization.name}</b> has been generated successfully.</p>
          <p>Please find the attached JSON file containing all your restaurant's data including products, orders, guests, and accounting records.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #666;">
            <b>Security Note:</b> This file contains sensitive business information. Store it securely and do not share it with unauthorized personnel.
          </p>
          <p style="font-size: 12px; color: #666;">
            Sent via GuestFlow POS Backup System.
          </p>
        </div>
      `,
      attachments: [
        {
          filename: fileName,
          content: jsonString,
        }
      ]
    });

    if (!emailSent) {
      return apiError('Backup generated but failed to send email. Please check your SMTP settings.', 500);
    }

    return apiResponse({ email: user.email }, 'Backup sent to your email successfully!');

  } catch (error: any) {
    return apiError(error);
  }
}
