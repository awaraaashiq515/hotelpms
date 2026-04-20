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
