const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// Webhook endpoint to receive data from Google Forms/Sheets
// In a real scenario, an Apps Script in Google Sheets would POST to this URL
router.post('/webhook', async (req, res) => {
  const { training_id, responses } = req.body;
  // responses format expected: [{ emp_no: 'EMP-001', score: 85, passed: true }, ...]

  try {
    let insertedCount = 0;

    for (const r of responses) {
      // Find employee ID from emp_no
      const empResult = await pool.query('SELECT id FROM employees WHERE emp_no = $1', [r.emp_no]);
      
      if (empResult.rows.length > 0) {
        const emp_id = empResult.rows[0].id;
        
        await pool.query(
          `INSERT INTO questionnaire_results (training_id, employee_id, score, max_score, passed, submitted_at)
           VALUES ($1, $2, $3, 100, $4, NOW())`,
          [training_id, emp_id, r.score, r.passed]
        );
        insertedCount++;
      }
    }

    res.json({ success: true, message: `Synced ${insertedCount} responses from Google Forms.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Webhook for Attendance Forms
router.post('/attendance-webhook', async (req, res) => {
  const { emp_no, emp_name, training_topic, date } = req.body;

  try {
    // Try to find the most recent training with this topic
    const trainingResult = await pool.query(
      `SELECT id FROM trainings 
       WHERE topic ILIKE $1 
       ORDER BY training_date DESC LIMIT 1`,
      [`%${training_topic}%`]
    );

    if (trainingResult.rows.length === 0) {
      return res.status(404).json({ error: 'Matching training topic not found' });
    }

    const training_id = trainingResult.rows[0].id;

    // Check if attendance already exists
    const existing = await pool.query(
      `SELECT * FROM attendance_records WHERE training_id = $1 AND emp_no = $2`,
      [training_id, emp_no]
    );

    if (existing.rows.length > 0) {
      return res.json({ success: true, message: 'Attendance already recorded', record: existing.rows[0] });
    }

    // Insert attendance
    const result = await pool.query(
      `INSERT INTO attendance_records (training_id, emp_no, emp_name)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [training_id, emp_no, emp_name || '']
    );

    res.json({ success: true, record: result.rows[0] });
  } catch (err) {
    console.error('Attendance webhook error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Endpoint to fetch results for a training
router.get('/results/:training_id', async (req, res) => {
  const { training_id } = req.params;
  
  try {
    const result = await pool.query(`
      SELECT q.score, q.passed, q.submitted_at, e.full_name, e.emp_no
      FROM questionnaire_results q
      JOIN employees e ON q.employee_id = e.id
      WHERE q.training_id = $1
    `, [training_id]);
    
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
