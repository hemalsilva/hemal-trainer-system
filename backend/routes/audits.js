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
      SELECT emp_no, emp_name, audit_type, MAX(score) as max_score
      FROM room_audits
      ${dateFilter}
      GROUP BY emp_no, emp_name, audit_type
      ORDER BY max_score DESC
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
        COUNT(ra.id) FILTER (WHERE ra.audit_type IN ('Departure', 'IP Departure')) as departure_completed
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
        totalPending: Math.max(0, targetStayover - stCompleted) + Math.max(0, targetDeparture - depCompleted)
      };
    });

    res.json(balances);
  } catch (err) {
    console.error('Error fetching audit balances:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;
