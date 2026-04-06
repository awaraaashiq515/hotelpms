import { prisma } from '@/lib/prisma';

export const sendSMS = async (phone: string, templateKey: 'TEMPLATE_BILL_PAID' | 'TEMPLATE_WELCOME', variables: Record<string, string>) => {
  try {
    if (!phone || phone.trim() === '') {
      console.log('No phone number provided, skipping SMS.');
      return { success: false, error: 'No phone number provided' };
    }

    const keys = ['SMS_PROVIDER', 'SMS_API_KEY', 'SMS_SENDER_ID', templateKey];
    const settings = await prisma.systemSetting.findMany({
      where: { key: { in: keys } }
    });

    const config = keys.reduce((acc, key) => {
      acc[key] = settings.find(s => s.key === key)?.value || '';
      return acc;
    }, {} as Record<string, string>);

    if (!config.SMS_API_KEY) {
      console.warn('SMS API Key missing. SMS not sent.');
      return { success: false, error: 'API key not configured' };
    }

    let messageText = config[templateKey];
    if (!messageText) {
      console.warn(`Template ${templateKey} is missing.`);
      return { success: false, error: 'Template not configured' };
    }

    // Replace variables e.g. {NAME}
    Object.keys(variables).forEach((varKey) => {
      messageText = messageText.replace(new RegExp(`{${varKey}}`, 'g'), variables[varKey]);
    });

    // Determine default provider if not set
    const provider = config.SMS_PROVIDER || 'FAST2SMS';

    if (provider === 'FAST2SMS') {
      console.log(`[Fast2SMS] Sending SMS to ${phone}... Text: ${messageText}`);
      
      const res = await fetch('https://www.fast2sms.com/dev/bulkV2', {
        method: 'POST',
        headers: {
          'authorization': config.SMS_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          route: 'v3',
          sender_id: config.SMS_SENDER_ID || 'TXTIND',
          message: messageText,
          language: 'english',
          flash: 0,
          numbers: phone
        })
      });
      const data = await res.json();
      console.log('[Fast2SMS Response]:', data);
      return { success: data.return || data.success, data };
    } 
    else if (provider === 'TWILIO') {
      console.log(`[Twilio] Would send SMS to ${phone}... Text: ${messageText}`);
      return { success: true, message: `Dispatched dummy request to ${phone}` };
    }
    else {
      console.warn('Unknown SMS provider', provider);
      return { success: false, error: 'Unknown SMS Provider' };
    }

  } catch (error) {
    console.error('sendSMS error:', error);
    return { success: false, error: 'Internal error sending SMS' };
  }
};
