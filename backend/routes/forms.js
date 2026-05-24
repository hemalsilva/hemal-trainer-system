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
