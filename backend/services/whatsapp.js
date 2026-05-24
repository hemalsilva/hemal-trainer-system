const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

let client;
let isReady = false;

const initializeWhatsApp = () => {
  console.log('\n=============================================');
  console.log('INITIALIZING WHATSAPP WEB ENGINE...');
  console.log('=============================================\n');

  client = new Client({
    authStrategy: new LocalAuth(), // Saves the session locally so you don't have to scan every time
    puppeteer: {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    }
  });

  client.on('qr', (qr) => {
    console.log('>>> ACTION REQUIRED: Scan this QR Code with your WhatsApp app to link the system!\n');
    qrcode.generate(qr, { small: true });
  });

  client.on('ready', () => {
    isReady = true;
    console.log('\n✅ WHATSAPP ENGINE IS READY!');
    console.log('The system is now securely linked to your phone number and ready to send schedules.\n');
  });

  client.on('authenticated', () => {
    console.log('WhatsApp Authenticated Successfully!');
  });

  client.on('auth_failure', msg => {
    console.error('WhatsApp Authentication failed:', msg);
  });

  client.on('disconnected', (reason) => {
    console.log('WhatsApp Client was disconnected', reason);
    isReady = false;
    // Attempt to reconnect after 5 seconds
    setTimeout(initializeWhatsApp, 5000);
  });

  client.initialize().catch(err => {
    console.error('Failed to initialize WhatsApp client:', err);
  });
};

const sendWhatsAppMessage = async (phoneNumber, message) => {
  if (!isReady || !client) {
    throw new Error('WhatsApp Engine is not ready. Please check the backend terminal and scan the QR code.');
  }

  // Format phone number to WhatsApp ID format (e.g., 94771234567@c.us)
  // Ensure the number contains the country code, strip spaces/pluses
  const formattedNumber = phoneNumber.replace(/[^0-9]/g, '') + '@c.us';

  try {
    const response = await client.sendMessage(formattedNumber, message);
    console.log(`Message successfully sent to ${phoneNumber}`);
    return response;
  } catch (error) {
    console.error(`Failed to send message to ${phoneNumber}:`, error);
    throw error;
  }
};

module.exports = {
  initializeWhatsApp,
  sendWhatsAppMessage,
  isReady: () => isReady
};
