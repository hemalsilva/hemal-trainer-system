require('dotenv').config({ path: __dirname + '/.env' });
const pool = require('./config/db');

async function fixDb() {
  try {
    console.log("Fixing trainings table schema...");
    
    // 1. Ensure google_form_link exists (This is likely what caused the crash!)
    await pool.query(`ALTER TABLE trainings ADD COLUMN IF NOT EXISTS google_form_link VARCHAR(255)`);
    
    // 2. Ensure trainer_id is safely renamed to trainer_name
    await pool.query(`ALTER TABLE trainings DROP CONSTRAINT IF EXISTS trainings_trainer_id_fkey`);
    
    // Catch rename if it hasn't been done yet
    try {
        await pool.query(`ALTER TABLE trainings RENAME COLUMN trainer_id TO trainer_name`);
    } catch(e) {
        // Ignore if already renamed
    }
    
    await pool.query(`ALTER TABLE trainings ALTER COLUMN trainer_name TYPE VARCHAR(255)`);
    
    console.log("Database schema fixed successfully. The form should now save correctly!");
  } catch (err) {
    console.log("Error during migration:");
    console.error(err.message);
  } finally {
    process.exit(0);
  }
}

fixDb();
