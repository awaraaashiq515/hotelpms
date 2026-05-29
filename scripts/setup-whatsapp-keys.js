/**
 * Config script to update your Meta/Twilio WhatsApp credentials in the DB
 * Run: node scripts/setup-whatsapp-keys.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function configureKeys() {
  console.log('🔄 Checking property settings...');
  const property = await prisma.property.findFirst();

  if (!property) {
    console.error('❌ No property found! Run prisma seed first.');
    process.exit(1);
  }

  // Edit these fields with your credentials for testing
  const updatedProperty = await prisma.property.update({
    where: { id: property.id },
    data: {
      whatsAppProvider: 'TWILIO', // Change to 'META' if testing Meta Cloud API
      whatsAppEnabled: true,
      
      // Meta API Credentials
      metaAccessToken: 'YOUR_META_PERMANENT_ACCESS_TOKEN',
      metaPhoneId: 'YOUR_META_PHONE_NUMBER_ID',
      metaVerifyToken: 'ordermint-default-token',
      
      // Twilio API Credentials
      twilioAccountSid: 'YOUR_TWILIO_ACCOUNT_SID', 
      twilioAuthToken: 'YOUR_TWILIO_AUTH_TOKEN',
      twilioFromNumber: '14155238886', // Twilio Sandbox Number
    }
  });

  console.log('========================================');
  console.log('✅ WhatsApp Credentials Saved in Database!');
  console.log(`Provider Set: ${updatedProperty.whatsAppProvider}`);
  console.log('========================================');
  process.exit(0);
}

configureKeys();
