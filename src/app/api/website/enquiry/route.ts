import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';
import nodemailer from 'nodemailer';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const enquiries = await prisma.enquiry.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return apiResponse(enquiries);
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phone, subject, message } = body;

    if (!name || !email || !phone || !message) {
      return apiResponse(null, 'Missing required fields', 400);
    }

    // 1. Save to Database
    const enquiry = await prisma.enquiry.create({
      data: {
        name,
        email,
        phone,
        subject: subject || 'General Inquiry',
        message,
        status: 'NEW',
      },
    });

    // 2. Fetch SMTP Settings from Database
    const settings = await prisma.websiteSettings.findFirst();

    if (settings && settings.smtpEmail && settings.smtpPassword) {
      const transporter = nodemailer.createTransport({
        host: settings.smtpHost || 'smtp.hostinger.com',
        port: Number(settings.smtpPort) || 465,
        secure: true, // true for 465, false for other ports
        auth: {
          user: settings.smtpEmail,
          pass: settings.smtpPassword,
        },
      });

      const mailOptions = {
        from: `"${settings.hotelName || 'OrderMint Website'}" <${settings.smtpEmail}>`, 
        to: settings.contactReceiverEmail || settings.smtpEmail,    
        replyTo: email,                              
        subject: `New Website Enquiry: ${subject || 'General Inquiry'}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #333; border-bottom: 2px solid #ff6b6b; padding-bottom: 10px;">New Contact Submission</h2>
            
            <p><strong>From:</strong> ${name} (<a href="mailto:${email}">${email}</a>)</p>
            <p><strong>Phone:</strong> ${phone}</p>
            <p><strong>Subject:</strong> ${subject || 'General Inquiry'}</p>
            
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin-top: 20px;">
              <h3 style="margin-top: 0; color: #555;">Message:</h3>
              <p style="white-space: pre-wrap; color: #333; line-height: 1.5;">${message}</p>
            </div>
            
            <p style="font-size: 12px; color: #999; margin-top: 30px; text-align: center;">
              This email was sent automatically from the OrderMint Website Contact Form.
            </p>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);
    }

    return apiResponse(enquiry, 'Enquiry submitted successfully', 201);
  } catch (error) {
    console.error('Error processing contact form:', error);
    return apiError(error);
  }
}
