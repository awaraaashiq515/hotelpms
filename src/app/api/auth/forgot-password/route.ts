import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';
import { sendMail } from '@/lib/mail';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return apiError(new Error('Email is required'), 400);
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { role: true }
    });

    // We don't want to leak if a user exists or not for security reasons,
    // but in internal POS systems, sometimes it's okay. 
    // However, let's follow best practices.
    if (!user) {
      return apiResponse(null, 'If an account exists with this email, a reset link has been sent.');
    }

    // Only RESTAURANTS_ADMIN and SUPER_ADMIN can use self-service reset for now
    // POSSYSTEM users should be reset by their admin
    if (user.role.name === 'POSSYSTEM') {
      return apiError(new Error('Please contact your administrator to reset your password.'), 403);
    }

    // Generate token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour

    // Save token
    await prisma.passwordResetToken.upsert({
      where: { token },
      update: {
        token,
        expiresAt,
      },
      create: {
        email,
        token,
        expiresAt,
      },
    });

    // Send email
    const protocol = req.headers.get('x-forwarded-proto') || 'http';
    const host = req.headers.get('host');
    const baseUrl = process.env.NEXTAUTH_URL || `${protocol}://${host}`;
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;

    
    const mailSent = await sendMail({
      to: email,
      subject: 'Password Reset Request - OrderMint POS',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #333; border-bottom: 2px solid #b91c1c; padding-bottom: 10px;">Password Reset</h2>
          <p>Hello ${user.fullName},</p>
          <p>We received a request to reset your password for your OrderMint POS account. Click the button below to set a new password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #b91c1c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Reset Password</a>
          </div>
          <p>If you didn't request this, you can safely ignore this email. This link will expire in 1 hour.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #999;">
            If the button doesn't work, copy and paste this link into your browser:<br />
            <a href="${resetUrl}">${resetUrl}</a>
          </p>
        </div>
      `,
    });

    if (!mailSent) {
      // If email fails, in a development/internal environment we might want to know why or even return the token
      // but let's just log it and return success to the user (as if it was sent)
      console.error('Failed to send reset email to:', email);
      // For testing purposes, I'll log the token
      console.log('RESET TOKEN:', token);
    }

    return apiResponse(null, 'If an account exists with this email, a reset link has been sent.');
  } catch (error) {
    return apiError(error);
  }
}
