require('dotenv').config({ path: __dirname + '/.env' });
const pool = require('./config/db');

async function createAttendanceDb() {
  try {
    console.log("Setting up attendance_records table for QR Check-ins...");
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS attendance_records (
        id SERIAL PRIMARY KEY,
        training_id INTEGER REFERENCES trainings(id) ON DELETE CASCADE,
        emp_no VARCHAR(50) NOT NULL,
        emp_name VARCHAR(255),
        check_in_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log("Database schema updated successfully for QR Attendance!");
  } catch (err) {
    console.log("Error creating table:");
    console.error(err.message);
  } finally {
    process.exit(0);
  }
}

createAttendanceDb();
