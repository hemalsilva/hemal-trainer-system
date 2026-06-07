const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});


router.get('/migrate', async (req, res) => {
  try {
      await pool.query(`
      CREATE TABLE IF NOT EXISTS room_audits (
        id SERIAL PRIMARY KEY,
        emp_no VARCHAR(20) NOT NULL,
        emp_name VARCHAR(150),
        audit_type VARCHAR(50) NOT NULL,
        score INT NOT NULL,
        audit_date DATE NOT NULL,
        room_number VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      `);
      
      try {
        await pool.query(`ALTER TABLE room_audits ADD COLUMN room_number VARCHAR(50);`);
      } catch(e) { }

      res.send('Migrated successfully');
  } catch(err) {
      res.status(500).json({error: err.message});
  }
});

// GET /api/audits
// Fetch recent audits
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM room_audits ORDER BY audit_date DESC, created_at DESC LIMIT 100`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching audits:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// GET /api/audits/top-performers
// Fetch top performers for a given month and year
router.get('/top-performers', async (req, res) => {
  const { month, year } = req.query;
  
  try {
    let dateFilter = '';
    let params = [];
    
    if (month && year) {
      dateFilter = `WHERE EXTRACT(MONTH FROM audit_date) = $1 AND EXTRACT(YEAR FROM audit_date) = $2`;
      params = [month, year];
    } else {
      // Default to current month
      dateFilter = `WHERE EXTRACT(MONTH FROM audit_date) = EXTRACT(MONTH FROM CURRENT_DATE) 
                    AND EXTRACT(YEAR FROM audit_date) = EXTRACT(YEAR FROM CURRENT_DATE)`;
    }

    const query = `
      WITH RankedAudits AS (
        SELECT emp_no, emp_name, audit_type, ROUND(AVG(score), 1) as score,
               DENSE_RANK() OVER(PARTITION BY audit_type ORDER BY AVG(score) DESC) as rank
        FROM room_audits
        ${dateFilter}
        GROUP BY emp_no, emp_name, audit_type
      )
      SELECT * FROM RankedAudits WHERE rank <= 3
      ORDER BY audit_type, rank ASC, emp_name ASC
    `;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching top performers:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// POST /api/audits/webhook
// Receive payload from Google Apps Script
router.post('/webhook', async (req, res) => {
  const { emp_no, emp_name, audit_type, score, audit_date, room_number } = req.body;
  
  if (!emp_no || !audit_type || score === undefined || !audit_date) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO room_audits (emp_no, emp_name, audit_type, score, audit_date, room_number)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [emp_no, emp_name, audit_type, score, audit_date, room_number]
    );
    
    res.status(201).json({ message: 'Audit saved successfully', audit: result.rows[0] });
  } catch (err) {
    console.error('Error saving audit via webhook:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// GET /api/audits/balances
// Fetch audit balances for all employees for a given month and year
router.get('/balances', async (req, res) => {
  const { month, year } = req.query;
  try {
    let joinDateCondition = '';
    let params = [];
    if (month && year) {
      joinDateCondition = `EXTRACT(MONTH FROM ra.audit_date) = $1 AND EXTRACT(YEAR FROM ra.audit_date) = $2`;
      params = [month, year];
    } else {
      joinDateCondition = `EXTRACT(MONTH FROM ra.audit_date) = EXTRACT(MONTH FROM CURRENT_DATE) AND EXTRACT(YEAR FROM ra.audit_date) = EXTRACT(YEAR FROM CURRENT_DATE)`;
    }

    const query = `
      SELECT 
        e.emp_no, 
        e.full_name as emp_name, 
        e.department, 
        e.designation,
        COUNT(ra.id) FILTER (WHERE ra.audit_type IN ('Stayover', 'IP Stayover')) as stayover_completed,
        COUNT(ra.id) FILTER (WHERE ra.audit_type IN ('Departure', 'IP Departure')) as departure_completed,
        AVG(ra.score) FILTER (WHERE ra.audit_type IN ('Stayover', 'IP Stayover', 'Departure', 'IP Departure')) as avg_score
      FROM employees e
      LEFT JOIN room_audits ra ON e.emp_no = ra.emp_no AND ${joinDateCondition}
      GROUP BY e.emp_no, e.full_name, e.department, e.designation
      ORDER BY e.full_name ASC
    `;

    const result = await pool.query(query, params);
    
    const balances = result.rows.map(emp => {
      const isTeamLeader = emp.designation && emp.designation.toLowerCase().includes('team leader');
      const targetStayover = 30;
      const targetDeparture = 30;
      
      const stCompleted = parseInt(emp.stayover_completed, 10) || 0;
      const depCompleted = parseInt(emp.departure_completed, 10) || 0;

      return {
        ...emp,
        isTeamLeader,
        typeLabel: isTeamLeader ? 'IP Room Audit' : 'Room Audit',
        stayoverTarget: targetStayover,
        departureTarget: targetDeparture,
        stayoverCompleted: stCompleted,
        departureCompleted: depCompleted,
        stayoverPending: Math.max(0, targetStayover - stCompleted),
        departurePending: Math.max(0, targetDeparture - depCompleted),
        totalPending: Math.max(0, targetStayover - stCompleted) + Math.max(0, targetDeparture - depCompleted),
        avgScore: emp.avg_score ? parseFloat(emp.avg_score).toFixed(1) : '-'
      };
    });

    res.json(balances);
  } catch (err) {
    console.error('Error fetching audit balances:', err);
    res.status(500).json({ error: 'Database error' });
  }
});


// POST /api/audits
// Manually add an audit
router.post('/', async (req, res) => {
  const { emp_no, emp_name, audit_type, score, audit_date, room_number } = req.body;
  
  if (!emp_no || !audit_type || score === undefined || !audit_date) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO room_audits (emp_no, emp_name, audit_type, score, audit_date, room_number)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [emp_no, emp_name, audit_type, score, audit_date, room_number]
    );
    
    res.status(201).json({ message: 'Audit saved successfully', audit: result.rows[0] });
  } catch (err) {
    console.error('Error saving manual audit:', err);
    res.status(500).json({ error: 'Database error' });
  }
});


// POST /api/audits/bulk
// Manually add multiple audits from bulk text
router.post('/bulk', async (req, res) => {
  const { audits } = req.body;
  
  if (!audits || !Array.isArray(audits) || audits.length === 0) {
    return res.status(400).json({ error: 'No audits provided' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const audit of audits) {
      const { emp_no, emp_name, audit_type, score, audit_date, room_number } = audit;
      if (!emp_no || score === undefined || !audit_date) continue; // Skip invalid
      
      await client.query(
        `INSERT INTO room_audits (emp_no, emp_name, audit_type, score, audit_date, room_number)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [emp_no, emp_name, audit_type || 'Departure', score, audit_date, room_number || '']
      );
    }
    await client.query('COMMIT');
    res.status(201).json({ message: 'Bulk audits saved successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error saving bulk audits:', err);
    res.status(500).json({ error: 'Database error' });
  } finally {
    client.release();
  }
});

module.exports = router;
