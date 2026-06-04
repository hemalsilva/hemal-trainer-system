const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');

let client;
let isReady = false;
let qrCodeData = null;

const initializeWhatsApp = () => {
  console.log('\n=============================================');
  console.log('INITIALIZING WHATSAPP WEB ENGINE...');
  console.log('=============================================\n');

  try {
    client = new Client({
      authStrategy: new LocalAuth(),
      puppeteer: {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
          '--disable-web-security'
        ]
      }
    });

    client.on('qr', async (qr) => {
      console.log('>>> ACTION REQUIRED: Scan the QR Code in the Settings page!\n');
      try {
        qrCodeData = await qrcode.toDataURL(qr);
      } catch (err) {
        console.error('Failed to generate QR code data URL', err);
      }
    });

    client.on('ready', () => {
      isReady = true;
      qrCodeData = null;
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
      qrCodeData = null;
      setTimeout(initializeWhatsApp, 5000);
    });

    client.initialize().catch(err => {
      console.error('Failed to initialize WhatsApp client:', err);
    });
  } catch (e) {
    console.log('WhatsApp disabled on this environment');
  }
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
  isReady: () => isReady,
  getQrCode: () => qrCodeData
};

