const path = require('path');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { initializeWhatsApp } = require('./services/whatsapp');

// Initialize the WhatsApp Web Engine on server boot
// initializeWhatsApp();

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

app.use('/api/employees', require('./routes/employees'));
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

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running on ${PORT}`);
  });
}
module.exports = app;
