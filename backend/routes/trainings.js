const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const multer = require('multer');
const os = require('os');
const upload = multer({ dest: os.tmpdir() });
const fs = require('fs');

// Get all trainings
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM trainings ORDER BY training_date ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get a specific training by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM trainings WHERE id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Training not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new training
router.post('/', async (req, res) => {
  const {
    topic,
    category,
    venue,
    duration,
    trainer,
    training_date,
    google_form_link,
    department
  } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO trainings
      (topic, category, venue, duration_minutes, trainer_name, training_date, google_form_link, department)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      RETURNING *`,
      [topic, category, venue, duration, trainer, training_date, google_form_link || '', department || 'General']
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error inserting training:', err);
    res.status(500).json({ error: err.message });
  }
});

// Mark Attendance (QR Scanner)
router.post('/:id/attendance', async (req, res) => {
  const { id } = req.params;
  const { emp_no, emp_name } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO attendance_records
      (training_id, emp_no, emp_name)
      VALUES ($1, $2, $3)
      RETURNING *`,
      [id, emp_no, emp_name || '']
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error marking attendance:', err);
    res.status(500).json({ error: err.message });
  }
});

// Save Auto-Allocated Employees to a Session
router.post('/:id/allocations', async (req, res) => {
  const { id } = req.params;
  const { employees } = req.body;
  
  if (!employees || !employees.length) return res.json({ success: true });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const emp of employees) {
      await client.query(
        `INSERT INTO training_allocations (training_id, emp_no, emp_name) VALUES ($1, $2, $3)`,
        [id, emp.emp_no, emp.name]
      );
    }
    await client.query('COMMIT');
    res.json({ success: true });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// Get Allocated Employees for a Session
router.get('/:id/allocations', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM training_allocations WHERE training_id = $1', [id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Upload Monthly Calendar via CSV
router.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const { department } = req.body;

  try {
    const fileContent = fs.readFileSync(req.file.path, 'utf8');
    const lines = fileContent.split('\\n');
    let insertedCount = 0;

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // Expected Format: Date, Time, Topic, Venue, Trainer
      const cols = line.split(',');
      if (cols.length >= 3) {
        const dateStr = cols[0].trim();
        const timeStr = cols[1] ? cols[1].trim() : '09:00';
        const topic = cols[2].trim();
        const venue = cols[3] ? cols[3].trim() : 'Main Room';
        const trainer = cols[4] ? cols[4].trim() : 'TBD';

        // Attempt basic date parse
        const training_date = new Date(dateStr + " " + timeStr).toISOString();

        await pool.query(
          `INSERT INTO trainings
          (topic, category, venue, duration_minutes, trainer_name, training_date, department)
          VALUES ($1,$2,$3,$4,$5,$6,$7)`,
          [topic, 'Mandatory', venue, 60, trainer, training_date, department || 'General']
        );
        insertedCount++;
      }
    }
    res.json({ message: 'Calendar uploaded successfully', success: insertedCount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Delete Training
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM trainings WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Trainer Days Off
router.get('/trainer/days-off', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM trainer_days_off ORDER BY date_off ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Post Trainer Day Off
router.post('/trainer/days-off', async (req, res) => {
  const { trainer_name, date_off } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO trainer_days_off (trainer_name, date_off) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING *`,
      [trainer_name, date_off]
    );
    res.json(result.rows[0] || { success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Trainer Day Off
router.delete('/trainer/days-off/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM trainer_days_off WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
