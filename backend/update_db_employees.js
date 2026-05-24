require('dotenv').config({ path: __dirname + '/.env' });
const pool = require('./config/db');

async function updateDb() {
  try {
    console.log("Updating employees table to support text departments...");
    
    // Attempt to drop any foreign key constraints if they exist
    await pool.query(`ALTER TABLE employees DROP CONSTRAINT IF EXISTS employees_department_id_fkey`);
    
    // Rename department_id to department
    try {
        await pool.query(`ALTER TABLE employees RENAME COLUMN department_id TO department`);
    } catch(e) {
        // Ignore if already renamed
    }
    
    // Change type to VARCHAR
    await pool.query(`ALTER TABLE employees ALTER COLUMN department TYPE VARCHAR(100)`);
    
    console.log("Database schema updated successfully.");
  } catch (err) {
    console.log("Note: Columns might already be updated:");
    console.error(err.message);
  } finally {
    process.exit(0);
  }
}

updateDb();
