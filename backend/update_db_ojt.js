require('dotenv').config({ path: __dirname + '/.env' });
const pool = require('./config/db');

async function updateOjtDb() {
  try {
    console.log("Updating ojt_records table schema for manual entry...");
    
    // Drop the foreign key constraint
    await pool.query(`ALTER TABLE ojt_records DROP CONSTRAINT IF EXISTS ojt_records_employee_id_fkey`);
    
    // Add new columns if they don't exist
    await pool.query(`ALTER TABLE ojt_records ADD COLUMN IF NOT EXISTS emp_no VARCHAR(50)`);
    await pool.query(`ALTER TABLE ojt_records ADD COLUMN IF NOT EXISTS emp_name VARCHAR(255)`);
    await pool.query(`ALTER TABLE ojt_records ADD COLUMN IF NOT EXISTS assessment_date DATE DEFAULT CURRENT_DATE`);
    
    // We can leave employee_id as is (it will just be NULL for new records) or drop it,
    // but leaving it is safer for old data.
    
    console.log("Database schema updated successfully for manual OJT entries.");
  } catch (err) {
    console.log("Note: Columns might already be updated, or another error occurred:");
    console.error(err.message);
  } finally {
    process.exit(0);
  }
}

updateOjtDb();
