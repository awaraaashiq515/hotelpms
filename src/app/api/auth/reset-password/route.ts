import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return apiError(new Error('Token and password are required'), 400);
    }

    // H22: Enforce strong password rules — block weak/common passwords
    const COMMON_WEAK_PASSWORDS = ['password', '123456', '12345678', 'admin123', 'qwerty', 'guestflow', 'ordermint', 'welcome123'];
    if (password.length < 8) {
      return apiError(new Error('Password must be at least 8 characters long.'), 400);
    }
    if (COMMON_WEAK_PASSWORDS.includes(password.toLowerCase().trim())) {
      return apiError(new Error('This password is too common and weak. Please choose a stronger password.'), 400);
    }

    // Find and validate token
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!resetToken || resetToken.expiresAt < new Date()) {
      return apiError(new Error('Invalid or expired reset token'), 400);
    }

    // Update user password
    const passwordHash = await bcrypt.hash(password, 10);
    
    await prisma.user.update({
      where: { email: resetToken.email },
      data: { passwordHash },
    });

    // Delete the token
    await prisma.passwordResetToken.delete({
      where: { token },
    });

    return apiResponse(null, 'Password has been reset successfully. You can now login.');
  } catch (error) {
    return apiError(error);
  }
}
