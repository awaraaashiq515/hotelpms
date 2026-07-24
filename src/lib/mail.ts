import nodemailer from 'nodemailer';
import { prisma } from './prisma';

export async function getTransporter() {
  const settings = await prisma.websiteSettings.findFirst();
  
  if (!settings || !settings.smtpEmail || !settings.smtpPassword) {
    return null;
  }

  return nodemailer.createTransport({
    host: settings.smtpHost || 'smtp.hostinger.com',
    port: Number(settings.smtpPort) || 465,
    secure: true,
    auth: {
      user: settings.smtpEmail,
      pass: settings.smtpPassword,
    },
  });
}

export async function sendMail({ to, subject, html, attachments }: { 
  to: string; 
  subject: string; 
  html: string;
  attachments?: any[];
}) {
  const transporter = await getTransporter();
  if (!transporter) {
    console.error('SMTP settings not configured');
    return false;
  }

  const settings = await prisma.websiteSettings.findFirst();
  
  const mailOptions = {
    from: `"${settings?.hotelName || 'GuestFlow POS'}" <${settings?.smtpEmail}>`,
    to,
    subject,
    html,
    attachments,
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}
