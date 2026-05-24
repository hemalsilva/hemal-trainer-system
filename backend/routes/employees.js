const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const multer = require('multer');
const xlsx = require('xlsx');

const fs = require('fs');

// Ensure uploads directories exist
const uploadsDir = 'uploads/photos';
if (!fs.existsSync(uploadsDir)){
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.fieldname === 'photo') {
      cb(null, 'uploads/photos/');
    } else {
      cb(null, 'uploads/');
    }
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

// GET all employees (supports ?search=EMP001 for OJT auto-lookup)
router.get('/', async (req, res) => {
  try {
    const { search } = req.query;
    let result;
    if (search) {
      result = await pool.query(
        `SELECT * FROM employees WHERE LOWER(emp_no::text) LIKE LOWER($1) OR LOWER(full_name) LIKE LOWER($1) LIMIT 10`,
        [`%${search}%`]
      );
    } else {
      result = await pool.query('SELECT * FROM employees');
    }
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST single employee
router.post('/', upload.single('photo'), async (req, res) => {
  const {
    emp_no, full_name, department_id, designation, join_date, date_of_birth, contact_number, email
  } = req.body;

  const photo_url = req.file ? req.file.path.replace(/\\/g, '/') : null; // Normalize slashes for DB

  try {
    const result = await pool.query(
      `INSERT INTO employees
      (emp_no, full_name, department_id, designation, join_date, date_of_birth, contact_number, email, photo_url)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING *`,
      [emp_no, full_name, department_id, designation, join_date, date_of_birth, contact_number, email, photo_url]
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
    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    
    const data = xlsx.utils.sheet_to_json(sheet);
    
    let insertedCount = 0;
    const errors = [];

    for (const row of data) {
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

module.exports = router;

