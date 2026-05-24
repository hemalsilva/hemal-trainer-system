const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: 'C:/Users/User/.gemini/antigravity/brain/efea42d5-e2f1-4aca-ad48-5b27089cfb4a/backend/.env' });

const pool = new Pool({
  connectionString: 'postgres://postgres:yourpassword@localhost:5432/hemal_training'
});

async function clearData() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Truncate all tables
    const tables = [
      'whatsapp_logs',
      'training_schedules',
      'room_audits',
      'ojt_records',
      'form_submissions',
      'employees'
    ];

    for (const table of tables) {
      console.log(`Truncating ${table}...`);
      try {
        await client.query(`TRUNCATE TABLE ${table} RESTART IDENTITY CASCADE`);
      } catch (e) {
        console.log(`Skipped ${table} (might not exist)`);
      }
    }

    await client.query('COMMIT');
    console.log('Database cleared successfully.');

    // Clear uploads directory safely
    const uploadsDir = 'C:/Users/User/.gemini/antigravity/brain/efea42d5-e2f1-4aca-ad48-5b27089cfb4a/backend/uploads';
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      for (const file of files) {
        if (file !== '.gitkeep') {
          const filePath = path.join(uploadsDir, file);
          if (fs.lstatSync(filePath).isFile()) {
            fs.unlinkSync(filePath);
          } else {
             // If directory like 'photos', clear it
             const subfiles = fs.readdirSync(filePath);
             for(const sf of subfiles) {
               fs.unlinkSync(path.join(filePath, sf));
             }
          }
        }
      }
      console.log('Uploads directory cleared.');
    }

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error clearing data:', err);
  } finally {
    client.release();
    pool.end();
  }
}

clearData();
