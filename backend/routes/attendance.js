const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verifyToken, checkRole } = require('../middleware/auth');

// Endpoint to generate a QR code payload for a training session
router.post('/generate-qr', verifyToken, checkRole(['Admin', 'Training Manager', 'Trainer']), async (req, res) => {
  const { training_id } = req.body;
  
  try {
    // Generate a unique token for this session valid for e.g., 2 hours
    const qrToken = Buffer.from(JSON.stringify({
      training_id,
      timestamp: Date.now(),
      valid_until: Date.now() + (2 * 60 * 60 * 1000)
    })).toString('base64');

    res.json({ qr_payload: qrToken });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoint for employees to scan and mark attendance
router.post('/scan', verifyToken, async (req, res) => {
  const { qr_payload, employee_id } = req.body;

  try {
    const data = JSON.parse(Buffer.from(qr_payload, 'base64').toString('ascii'));
    
    if (Date.now() > data.valid_until) {
      return res.status(400).json({ error: 'QR Code expired' });
    }

    const result = await pool.query(
      `INSERT INTO attendance (training_id, employee_id, method, status)
       VALUES ($1, $2, 'QR', 'Present')
       ON CONFLICT DO NOTHING
       RETURNING *`,
      [data.training_id, employee_id]
    );

    res.json({ message: 'Attendance marked successfully', record: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Invalid QR Code' });
  }
});

module.exports = router;
