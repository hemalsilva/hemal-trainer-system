const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const multer = require('multer');
const xlsx = require('xlsx');
const OfficeCrypto = require('officecrypto-tool');
const ExcelJS = require('exceljs');

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
    const { search, month, year } = req.query;
    let standardWhere = '';
    let ojtWhere = '';
    const params = [];
    let paramIndex = 1;
    
    if (month && year && month !== 'All' && year !== 'All') {
      const dbMonth = parseInt(month) + 1; // JS month (0-11) to Postgres month (1-12)
      standardWhere = `WHERE EXTRACT(MONTH FROM t.training_date) = $${paramIndex} AND EXTRACT(YEAR FROM t.training_date) = $${paramIndex+1}`;
      ojtWhere = `WHERE EXTRACT(MONTH FROM assessment_date) = $${paramIndex} AND EXTRACT(YEAR FROM assessment_date) = $${paramIndex+1}`;
      params.push(dbMonth, parseInt(year));
      paramIndex += 2;
    }

    const queryBase = `
      SELECT e.*, 
        COALESCE(th.training_hours, 0) AS standard_training_hours,
        COALESCE(oh.ojt_hours, 0) AS ojt_hours,
        (COALESCE(th.training_hours, 0) + COALESCE(oh.ojt_hours, 0)) AS total_training_hours
      FROM employees e
      LEFT JOIN (
        SELECT a.emp_no, SUM(t.duration_minutes) / 60.0 AS training_hours
        FROM attendance_records a
        JOIN trainings t ON a.training_id = t.id
        ${standardWhere}
        GROUP BY a.emp_no
      ) th ON e.emp_no = th.emp_no
      LEFT JOIN (
        SELECT emp_no, SUM(duration_minutes) / 60.0 AS ojt_hours
        FROM ojt_records
        ${ojtWhere}
        GROUP BY emp_no
      ) oh ON e.emp_no = oh.emp_no
    `;

    let result;
    if (search) {
      params.push(`%${search}%`);
      result = await pool.query(
        `${queryBase} WHERE LOWER(e.emp_no::text) LIKE LOWER($${paramIndex}) OR LOWER(e.full_name) LIKE LOWER($${paramIndex}) LIMIT 10`,
        params
      );
    } else {
      result = await pool.query(`${queryBase} ORDER BY e.emp_no`, params);
    }
    res.json(result.rows);
  } catch (err) {
    console.error(err); console.error(err); res.status(500).json({ error: err.message });
  }
});

// POST single employee
router.post('/', upload.single('photo'), async (req, res) => {
  const { emp_no, full_name, department, designation, join_date, date_of_birth, contact_number, email, status } = req.body;

  const photo_url = null; // Photo upload not supported on serverless // Normalize slashes for DB

  try {
    const result = await pool.query(
      `INSERT INTO employees
      (emp_no, full_name, department, designation, join_date, date_of_birth, contact_number, email, photo_url, status)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING *`,
      [emp_no, full_name, department, designation, join_date, date_of_birth, contact_number, email, photo_url, status || 'Active']
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
  const { emp_no: new_emp_no, full_name, department, designation, join_date, date_of_birth, contact_number, email, status } = req.body;
  const old_emp_no = req.params.emp_no;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // If emp_no is changing, update it in related tables first to prevent orphaned records!
    if (new_emp_no && new_emp_no !== old_emp_no) {
      await client.query('UPDATE attendance_records SET emp_no = $1 WHERE emp_no = $2', [new_emp_no, old_emp_no]);
      await client.query('UPDATE training_allocations SET emp_no = $1 WHERE emp_no = $2', [new_emp_no, old_emp_no]);
      await client.query('UPDATE ojt_records SET emp_no = $1 WHERE emp_no = $2', [new_emp_no, old_emp_no]);
    }

    const result = await client.query(
      `UPDATE employees
      SET emp_no = $1, full_name = $2, department = $3, designation = $4, join_date = $5, date_of_birth = $6, contact_number = $7, email = $8, status = $9
      WHERE TRIM(emp_no) = TRIM($10)
      RETURNING *`,
      [new_emp_no || old_emp_no, full_name, department, designation, join_date, date_of_birth, contact_number, email, status || 'Active', old_emp_no]
    );
    
    await client.query('COMMIT');
    res.json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
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


// POST bulk update via JSON (from OCR)
router.post('/bulk-json', async (req, res) => {
  const { employees } = req.body;
  if (!employees || !Array.isArray(employees)) {
    return res.status(400).json({ error: 'Invalid payload. Expected array of employees.' });
  }

  try {
    let insertedCount = 0;
    const errors = [];

    await Promise.all(employees.map(async (emp) => {
      try {
        if (!emp.emp_no || !emp.full_name) return;
        await pool.query(
          `INSERT INTO employees (emp_no, full_name, designation, email) 
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (emp_no) DO UPDATE 
           SET full_name = EXCLUDED.full_name`,
          [emp.emp_no, emp.full_name, emp.designation || 'Staff', emp.email || '']
        );
        insertedCount++;
      } catch (err) {
        errors.push({ emp_no: emp.emp_no, error: err.message });
      }
    }));

    res.json({ 
      message: 'Upload processing complete', 
      processed: employees.length,
      success: insertedCount,
      errors: errors 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// POST bulk upload encrypted excel
router.post('/bulk-encrypted-excel', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  const password = req.body.password;
  if (!password) {
    return res.status(400).json({ error: 'Password is required' });
  }

  try {
    // Decrypt the file in memory
    const officecrypto = new OfficeCrypto(req.file.buffer);
    officecrypto.setPassword(password);
    const decryptedBuffer = officecrypto.decrypt();

    // Parse with exceljs
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(decryptedBuffer);
    const worksheet = workbook.worksheets[0];
    
    const data = [];
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) { // Skip header
        data.push({
          'Emp No': row.getCell(1).value?.toString(),
          'Name': row.getCell(2).value?.toString(),
          'Designation': row.getCell(3).value?.toString(),
          'Email': row.getCell(4).value?.toString(),
          'Department': row.getCell(5).value?.toString(),
          'Join Date': row.getCell(6).value
        });
      }
    });

    let insertedCount = 0;
    const errors = [];
    const chunkSize = 20;

    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.slice(i, i + chunkSize);
      await Promise.all(chunk.map(async (row) => {
        try {
          if (!row['Emp No']) return;
          await pool.query(
            `INSERT INTO employees (emp_no, full_name, designation, email, department) 
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (emp_no) DO UPDATE 
             SET full_name = EXCLUDED.full_name, designation = EXCLUDED.designation, email = EXCLUDED.email, department = EXCLUDED.department`,
            [row['Emp No'], row['Name'], row['Designation'] || 'Staff', row['Email'] || '', row['Department'] || '']
          );
          insertedCount++;
        } catch (err) {
          errors.push({ emp_no: row['Emp No'], error: err.message });
        }
      }));
    }

    res.json({ 
      message: 'Encrypted Upload processing complete', 
      processed: data.length,
      success: insertedCount,
      errors: errors 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Decryption or parsing failed. Check password or file format.' });
  }
});

module.exports = router;

