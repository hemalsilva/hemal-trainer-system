const express = require('express');
const router = express.Router();
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');

let qrCodeData = null;
let isAuthenticated = false;
let isReady = false;
let client = null;

try {
  client = new Client({
    authStrategy: new LocalAuth({ dataPath: './.wwebjs_auth' }),
    puppeteer: {
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      headless: true
    }
  });

  client.on('qr', (qr) => {
    console.log('WhatsApp QR RECEIVED');
    qrcode.toDataURL(qr, (err, url) => {
      if (!err) {
        qrCodeData = url;
      }
    });
  });

  client.on('ready', () => {
    console.log('WhatsApp Client is ready!');
    isReady = true;
    isAuthenticated = true;
    qrCodeData = null;
  });

  client.on('authenticated', () => {
    console.log('WhatsApp Authenticated!');
    isAuthenticated = true;
    qrCodeData = null;
  });

  client.on('auth_failure', msg => {
    console.error('WhatsApp Authentication failure', msg);
    isAuthenticated = false;
    isReady = false;
  });

  client.on('disconnected', (reason) => {
    console.log('WhatsApp Client was logged out', reason);
    isAuthenticated = false;
    isReady = false;
    client.initialize();
  });

  console.log('Initializing WhatsApp Client...');
  client.initialize().catch(err => console.error('Failed to init whatsapp:', err));

} catch (err) {
  console.error('Failed to setup WhatsApp client:', err);
}


router.get('/status', (req, res) => {
  res.json({
    isAuthenticated,
    isReady,
    hasQr: !!qrCodeData
  });
});

router.get('/qr', (req, res) => {
  if (isReady) {
    return res.status(400).json({ error: 'Already authenticated and ready' });
  }
  if (!qrCodeData) {
    return res.status(404).json({ error: 'QR code not generated yet. Please wait.' });
  }
  res.json({ qrCodeData });
});

module.exports = router;
