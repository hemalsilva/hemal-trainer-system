const express = require('express');
const router = express.Router();
const pool = require('../config/db');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM ojt_records');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  const {
    emp_no,
    emp_name,
    department,
    assessment_date,
    topic,
    trainer_name,
    location,
    assessment_notes,
    rating,
    pass_fail,
    completion_status
  } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO ojt_records
      (emp_no, emp_name, department, assessment_date, topic, trainer_name, location, assessment_notes, rating, pass_fail, completion_status)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      RETURNING *`,
      [emp_no, emp_name, department, assessment_date, topic, trainer_name, location, assessment_notes, rating, pass_fail, completion_status]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error inserting OJT record:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
