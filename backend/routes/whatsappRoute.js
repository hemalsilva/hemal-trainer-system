const express = require('express');
const router = express.Router();
const { sendWhatsAppMessage, isReady, getQrCode } = require('../services/whatsapp');

router.post('/send', async (req, res) => {
  const { phone, message } = req.body;

  if (!phone || !message) {
    return res.status(400).json({ error: 'Phone number and message are required' });
  }

  if (!isReady()) {
    return res.status(503).json({ 
      error: 'WhatsApp Engine is currently offline or disconnected. Please check the backend terminal to scan the QR code.' 
    });
  }

  try {
    await sendWhatsAppMessage(phone, message);
    res.json({ success: true, message: 'Message sent successfully!' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send WhatsApp message', details: error.message });
  }
});

router.get('/status', (req, res) => {
  res.json({ ready: isReady() });
});


// Send today's training schedule to a WhatsApp number/group
router.post('/send-schedule', async (req, res) => {
  const { phone, schedules, date, department } = req.body;

  if (!phone || !schedules || schedules.length === 0) {
    return res.status(400).json({ error: 'Phone and schedules are required' });
  }

  if (!isReady()) {
    return res.status(503).json({ error: 'WhatsApp is offline. Please scan QR code in backend terminal.' });
  }

  try {
    const dateStr = date || new Date().toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long', year:'numeric' });
    const deptStr = department && department !== 'All' ? ` � ${department} Dept` : '';

    let message = `?? *HK Training Portal${deptStr}*\n`;
    message += `?? *Today's Training Schedule*\n`;
    message += `${dateStr}\n`;
    message += `????????????????????\n\n`;

    schedules.forEach((s, i) => {
      const time = s.training_date ? new Date(s.training_date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : '';
      message += `*${i + 1}. ${s.topic}*\n`;
      if (time) message += `   ?? ${time}\n`;
      if (s.venue) message += `   ?? ${s.venue}\n`;
      if (s.trainer_name) message += `   ?? Trainer: ${s.trainer_name}\n`;
      if (s.department) message += `   ?? ${s.department}\n`;
      message += `\n`;
    });

    message += `????????????????????\n`;
    message += `? Total: ${schedules.length} session(s) today\n`;
    message += `_Sent from HK Training Portal_`;

    await sendWhatsAppMessage(phone, message);
    res.json({ success: true, message: `Schedule sent to ${phone}` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send schedule', details: error.message });
  }
});

// Broadcast schedule to multiple numbers
router.post('/broadcast-schedule', async (req, res) => {
  const { phones, schedules, date, department } = req.body;

  if (!phones || phones.length === 0) {
    return res.status(400).json({ error: 'At least one phone number required' });
  }

  if (!isReady()) {
    return res.status(503).json({ error: 'WhatsApp is offline. Please scan QR code in backend terminal.' });
  }

  const results = [];
  for (const phone of phones) {
    try {
      const dateStr = date || new Date().toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long', year:'numeric' });
      const deptStr = department && department !== 'All' ? ` � ${department} Dept` : '';
      let message = `?? *HK Training Portal${deptStr}*\n?? *Today's Training Schedule*\n${dateStr}\n????????????????????\n\n`;
      schedules.forEach((s, i) => {
        const time = s.training_date ? new Date(s.training_date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : '';
        message += `*${i + 1}. ${s.topic}*\n`;
        if (time) message += `   ?? ${time}\n`;
        if (s.venue) message += `   ?? ${s.venue}\n`;
        if (s.trainer_name) message += `   ?? ${s.trainer_name}\n`;
        message += `\n`;
      });
      message += `? ${schedules.length} session(s) | _HK Training Portal_`;
      await sendWhatsAppMessage(phone, message);
      results.push({ phone, success: true });
    } catch (err) {
      results.push({ phone, success: false, error: err.message });
    }
  }
  res.json({ results });
});


router.get('/status', (req, res) => {
  res.json({
    isReady: isReady(),
    hasQr: !!getQrCode()
  });
});

router.get('/qr', (req, res) => {
  if (isReady()) {
    return res.status(400).json({ error: 'Already authenticated and ready' });
  }
  const qrCodeData = getQrCode();
  if (!qrCodeData) {
    return res.status(404).json({ error: 'QR code not generated yet. Please wait.' });
  }
  res.json({ qrCodeData });
});

module.exports = router;

