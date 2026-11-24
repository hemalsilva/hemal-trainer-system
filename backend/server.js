const dns = require('dns');
try {
  dns.setDefaultResultOrder('ipv4first');
} catch (e) {}

const path = require('path');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load .env FIRST so DB credentials are available immediately
dotenv.config({ path: require('path').join(__dirname, '.env') });


// Initialize the WhatsApp Web Engine on server boot (only if explicitly enabled)
try {
  const { initializeWhatsApp } = require('./services/whatsapp');
  if (process.env.ENABLE_WHATSAPP === 'true') {
    initializeWhatsApp();
  }
} catch (e) {
  console.warn('WhatsApp module not available. Skipping WhatsApp init.');
}

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

app.use('/api/employees', require('./routes/employees'));
app.use('/api/birthdays', require('./routes/birthdays'));
app.use('/api/trainings', require('./routes/trainings'));
app.use('/api/ojt', require('./routes/ojt'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/ocr', require('./routes/ocr'));
app.use('/api/forms', require('./routes/forms'));
app.use('/api/certificates', require('./routes/certificates'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/whatsapp', require('./routes/whatsappRoute'));
app.use('/api/audits', require('./routes/audits'));
app.use('/api/backups', require('./routes/backups'));


// Serve frontend in production
app.use(express.static(path.join(__dirname, '../frontend/dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

const PORT = process.env.PORT || 5000;

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}
module.exports = app;

