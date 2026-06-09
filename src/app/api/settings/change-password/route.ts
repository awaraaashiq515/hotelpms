import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { apiResponse, apiError } from '@/lib/api-utils';
import { sendMail } from '@/lib/mail';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.id) {
      return apiError(new Error('Unauthorized'), 401);
    }

    const { action, otp, newPassword } = await req.json();

    if (!action) {
      return apiError(new Error('Action is required'), 400);
    }

    // Retrieve full user record to ensure we have the registered email
    const user = await prisma.user.findUnique({
      where: { id: session.id },
    });

    if (!user) {
      return apiError(new Error('User not found'), 404);
    }

    if (action === 'send-otp') {
      const email = user.email;
      if (!email) {
        return apiError(new Error('User does not have an email associated'), 400);
      }

      // Generate a random 6-digit OTP code
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();

      // Clear any prior reset tokens for this email to avoid clutter
      await prisma.passwordResetToken.deleteMany({
        where: { email },
      });

      // Store new OTP token in the DB with a 15 minute lifespan
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
      await prisma.passwordResetToken.create({
        data: {
          email,
          token: generatedOtp,
          expiresAt,
        },
      });

      // Send the email with the OTP code
      const emailHtml = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; max-width: 550px; margin: 20px auto; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="width: 56px; height: 56px; border-radius: 14px; background: linear-gradient(135deg, #6366f1, #818cf8); display: inline-flex; align-items: center; justify-content: center; font-size: 24px; color: #ffffff; line-height: 56px; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">🔑</div>
          </div>
          <h2 style="color: #1e1b4b; text-align: center; font-size: 20px; font-weight: 800; margin: 0 0 10px; letter-spacing: -0.01em;">Password Change Request</h2>
          <p style="color: #475569; font-size: 14px; line-height: 1.6; text-align: center; margin: 0 0 24px;">Hello <strong>${user.fullName}</strong>, you requested to update your password. Use the verification code below to authorize this change:</p>
          <div style="background: #f8fafc; border: 1.5px dashed #6366f1; border-radius: 12px; padding: 18px; text-align: center; margin-bottom: 24px;">
            <span style="font-size: 36px; font-weight: 900; tracking: 0.15em; color: #4f46e5; font-family: 'Courier New', Courier, monospace; letter-spacing: 4px;">${generatedOtp}</span>
          </div>
          <p style="color: #64748b; font-size: 12px; line-height: 1.5; text-align: center; margin: 0 0 24px;">This code is valid for <strong>15 minutes</strong>. If you did not make this request, you can safely ignore this email.</p>
          <hr style="border: 0; border-top: 1px solid #f1f5f9; margin-bottom: 20px;" />
          <p style="color: #94a3b8; font-size: 10px; text-align: center; margin: 0;">OrderMint POS Security Center · Automated Notification</p>
        </div>
      `;

      const emailSent = await sendMail({
        to: email,
        subject: 'Verification Code for Password Change - OrderMint POS',
        html: emailHtml,
      });

      if (!emailSent) {
        // Fallback: log to server console in case SMTP is not configured/offline
        console.log(`[SMTP Offline Fallback] OTP for user ${email} (${user.fullName}) is: ${generatedOtp}`);
        return apiResponse({ fallback: true }, 'Verification OTP logged to server logs (SMTP not configured).');
      }

      return apiResponse({ sent: true }, 'Verification OTP has been sent to your email.');
    }

    if (action === 'verify-and-change') {
      if (!otp || !newPassword) {
        return apiError(new Error('OTP and new password are required'), 400);
      }

      // Check if OTP matches and has not expired
      const resetToken = await prisma.passwordResetToken.findUnique({
        where: { token: otp },
      });

      if (!resetToken || resetToken.email !== user.email || resetToken.expiresAt < new Date()) {
        return apiError(new Error('Invalid or expired OTP code.'), 400);
      }

      // Hash the new password and update user record
      const passwordHash = await bcrypt.hash(newPassword, 10);
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
      });

      // Clear the OTP token record since verification was successful
      await prisma.passwordResetToken.delete({
        where: { id: resetToken.id },
      });

      return apiResponse(null, 'Password updated successfully!');
    }

    return apiError(new Error('Invalid action request'), 400);
  } catch (error) {
    return apiError(error);
  }
}
