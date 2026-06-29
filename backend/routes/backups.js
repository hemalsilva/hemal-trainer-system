const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:0r@cl3D8@localhost:5432/trainer_db'
});

const configPath = path.join(__dirname, '../backup_config.json');

router.get('/config', (req, res) => {
  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath));
    res.json(config);
  } else {
    res.json({ path: '' });
  }
});

router.post('/config', (req, res) => {
  fs.writeFileSync(configPath, JSON.stringify({ path: req.body.path }));
  res.json({ success: true });
});

router.post('/trigger', async (req, res) => {
  try {
    if (!fs.existsSync(configPath)) {
      return res.status(400).json({ error: 'No backup path configured' });
    }
    const config = JSON.parse(fs.readFileSync(configPath));
    const destPath = config.path;
    
    if (!fs.existsSync(destPath)) {
        fs.mkdirSync(destPath, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const zipFilePath = path.join(destPath, `Trainer_Backup_${timestamp}.zip`);
    
    const output = fs.createWriteStream(zipFilePath);
    const archive = archiver('zip', { zlib: { level: 9 } });
    
    output.on('close', function() {
        res.json({ message: 'Backup created successfully at ' + zipFilePath });
    });
    
    archive.on('error', function(err) {
        throw err;
    });
    
    archive.pipe(output);
    
    // Dump DB tables
    const tables = ['employees', 'trainings', 'attendance_records', 'ojt_records', 'whatsapp_logs'];
    const dbData = {};
    for (const table of tables) {
        const result = await pool.query(`SELECT * FROM ${table}`);
        dbData[table] = result.rows;
    }
    
    archive.append(JSON.stringify(dbData, null, 2), { name: 'database_dump.json' });
    
    // Add uploads folder
    const uploadsDir = path.join(__dirname, '../uploads');
    if (fs.existsSync(uploadsDir)) {
        archive.directory(uploadsDir, 'uploads');
    }
    
    await archive.finalize();

  } catch (err) {
      console.error('Backup error', err);
      res.status(500).json({ error: err.message });
  }
});

module.exports = router;