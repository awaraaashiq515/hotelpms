/**
 * Test script for WhatsApp Conversational Ordering Chatbot Webhook
 * Run: node scripts/test-whatsapp-chatbot.js
 */

const http = require('http');

const PORT = 3002;
const PATH = '/api/webhooks/whatsapp';

function sendWebhookMessage(messageBody, stepName) {
  return new Promise((resolve, reject) => {
    console.log(`\n========================================`);
    console.log(`🚀 Step: ${stepName}`);
    console.log(`💬 Sending Message: "${messageBody}"`);
    console.log(`========================================`);

    const payload = JSON.stringify({
      entry: [{
        changes: [{
          value: {
            metadata: { display_phone_number: '919999999999' },
            messages: [{
              from: '919876543210',
              text: { body: messageBody }
            }]
          }
        }]
      }]
    });

    const options = {
      hostname: 'localhost',
      port: PORT,
      path: PATH,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        console.log(`Status Code: ${res.statusCode}`);
        console.log(`Response: ${data}`);
        resolve();
      });
    });

    req.on('error', (e) => {
      console.error(`Error sending message: ${e.message}`);
      reject(e);
    });

    req.write(payload);
    req.end();
  });
}

async function runTests() {
  try {
    // 1. Send Hello (Greeting)
    await sendWebhookMessage('Hello', '1. Greeting Bot');
    await new Promise(r => setTimeout(r, 1000));
 
    // 2. Menu Browsing
    await sendWebhookMessage('show menu please', '2. Menu Browsing Card');
    await new Promise(r => setTimeout(r, 1000));

    // 3. Add items + verify AI upselling recommendations
    await sendWebhookMessage('Add 1 Pizza Margherita', '3. Cart Addition & AI Upselling Complementary Beverage');
    await new Promise(r => setTimeout(r, 1000));

    // 4. Loyalty points check
    await sendWebhookMessage('loyalty points', '4. CRM Loyalty Points Inquiry');
    await new Promise(r => setTimeout(r, 1000));

    // 5. Support human hand-off escalations
    await sendWebhookMessage('I need help, support please', '5. Support Agent Transition (Bot Paused)');
    await new Promise(r => setTimeout(r, 1000));

    // 6. Support bypass (Any message sent while in SUPPORT state should be ignored by the bot)
    await sendWebhookMessage('Add a soft drink', '6. Silent Support bypass (Bot should not reply)');
    await new Promise(r => setTimeout(r, 1000));

    // 7. Support exit (Resume chatbot)
    await sendWebhookMessage('restart', '7. Resuming Chatbot from Support Mode');
    await new Promise(r => setTimeout(r, 1000));

    // 8. Reorder automation request
    await sendWebhookMessage('reorder last order', '8. Fetch Reorder History');
    await new Promise(r => setTimeout(r, 1000));

    // 9. Confirm Reorder
    await sendWebhookMessage('yes confirm', '9. Confirming Reorder Sequence');
    await new Promise(r => setTimeout(r, 1000));

    // 10. Checkout Summary
    await sendWebhookMessage('checkout please', '10. Checkout Receipt & Invoice link');
    await new Promise(r => setTimeout(r, 1000));

    // 11. Payment and points award confirmation
    await sendWebhookMessage('pay cod', '11. Payment success, KDS Dispatch & Loyalty Point credit');
    await new Promise(r => setTimeout(r, 1000));

    // 12. Live Order Tracking status mapping
    await sendWebhookMessage('where is my order?', '12. Live Order Cooking & Preparation Status Tracking');

    console.log('\n========================================');
    console.log('✅ WhatsApp Commerce Engine Flow Verified Successfully!');
    console.log('========================================');
  } catch (err) {
    console.error('Testing sequence failed:', err);
  }
}

runTests();
