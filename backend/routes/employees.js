const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const multer = require('multer');
const xlsx = require('xlsx');

const fs = require('fs');

// Ensure uploads directories exist
const uploadsDir = '/tmp/photos';
try { if (!fs.existsSync(uploadsDir)){ fs.mkdirSync(uploadsDir, { recursive: true }); } } catch(e) {}

const os = require('os');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// GET all employees (supports ?search=EMP001 for OJT auto-lookup)
router.get('/', async (req, res) => {
  try {
    const { search } = req.query;
    let result;
    const queryBase = `
      SELECT e.*, COALESCE(th.training_hours, 0) AS training_hours
      FROM employees e
      LEFT JOIN (
        SELECT a.emp_no, SUM(t.duration_minutes) / 60.0 AS training_hours
        FROM attendance_records a
        JOIN trainings t ON a.training_id = t.id
        GROUP BY a.emp_no
      ) th ON e.emp_no = th.emp_no
    `;

    if (search) {
      result = await pool.query(
        `${queryBase} WHERE LOWER(e.emp_no::text) LIKE LOWER($1) OR LOWER(e.full_name) LIKE LOWER($1) LIMIT 10`,
        [`%${search}%`]
      );
    } else {
      result = await pool.query(`${queryBase} ORDER BY e.emp_no`);
    }
    res.json(result.rows);
  } catch (err) {
    console.error(err); console.error(err); res.status(500).json({ error: err.message });
  }
});

// POST single employee
router.post('/', upload.single('photo'), async (req, res) => {
  const { emp_no, full_name, department, designation, join_date, date_of_birth, contact_number, email } = req.body;

  const photo_url = null; // Photo upload not supported on serverless // Normalize slashes for DB

  try {
    const result = await pool.query(
      `INSERT INTO employees
      (emp_no, full_name, department, designation, join_date, date_of_birth, contact_number, email, photo_url)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING *`,
      [emp_no, full_name, department, designation, join_date, date_of_birth, contact_number, email, photo_url]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST bulk upload via Excel
router.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    
    const data = xlsx.utils.sheet_to_json(sheet);
    
    let insertedCount = 0;
    const errors = [];

    // Process in chunks of 20 to avoid overwhelming connection pool while keeping it fast
    const chunkSize = 20;
    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.slice(i, i + chunkSize);
      await Promise.all(chunk.map(async (row) => {
        try {
          await pool.query(
            `INSERT INTO employees (emp_no, full_name, designation, email) 
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (emp_no) DO UPDATE 
             SET full_name = EXCLUDED.full_name, designation = EXCLUDED.designation, email = EXCLUDED.email`,
            [row['Emp No'], row['Name'], row['Designation'], row['Email']]
          );
          insertedCount++;
        } catch (err) {
          errors.push({ emp_no: row['Emp No'], error: err.message });
        }
      }));
    }

    res.json({ 
      message: 'Upload processing complete', 
      processed: data.length,
      success: insertedCount,
      errors: errors 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// POST bulk upload photos
router.post('/bulk-photos', upload.array('photos', 500), async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'No photos uploaded' });
  }

  try {
    let processedCount = 0;
    
    for (const file of req.files) {
      const extIndex = file.originalname.lastIndexOf('.');
      const emp_no = extIndex > 0 ? file.originalname.substring(0, extIndex) : file.originalname;
      
      const photo_url = file.path.replace(/\\/g, '/');
      
      const result = await pool.query(
        'UPDATE employees SET photo_url = $1 WHERE UPPER(emp_no) = UPPER($2)',
        [photo_url, emp_no]
      );
      
      if (result.rowCount > 0) {
        processedCount++;
      }
    }

    res.json({ message: 'Photos uploaded', processed: processedCount, totalFiles: req.files.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});


// PUT single employee
router.put('/:emp_no', upload.single('photo'), async (req, res) => {
  const { full_name, department, designation, join_date, date_of_birth, contact_number, email } = req.body;
  const emp_no = req.params.emp_no;

  try {
    const result = await pool.query(
      `UPDATE employees
      SET full_name = $1, department = $2, designation = $3, join_date = $4, date_of_birth = $5, contact_number = $6, email = $7
      WHERE emp_no = $8
      RETURNING *`,
      [full_name, department, designation, join_date, date_of_birth, contact_number, email, emp_no]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE single employee
router.delete('/:emp_no', async (req, res) => {
  const emp_no = req.params.emp_no;
  try {
    // Delete from attendance_records and training_allocations first to satisfy foreign key constraints if any
    await pool.query('DELETE FROM attendance_records WHERE emp_no = $1', [emp_no]);
    await pool.query('DELETE FROM training_allocations WHERE emp_no = $1', [emp_no]);
    
    // Now delete the employee
    const result = await pool.query('DELETE FROM employees WHERE emp_no = $1 RETURNING *', [emp_no]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    res.json({ message: 'Employee deleted successfully', employee: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
