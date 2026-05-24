const pool = require('./config/db');

async function updateDatabase() {
  try {
    console.log('Adding department column to ojt_records table...');
    await pool.query(`
      ALTER TABLE ojt_records 
      ADD COLUMN IF NOT EXISTS department VARCHAR(100) DEFAULT 'Rooms';
    `);
    
    console.log('Database schema successfully updated for OJT department!');
  } catch (err) {
    console.error('Error updating database:', err);
  } finally {
    pool.end();
  }
}

updateDatabase();
