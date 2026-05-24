require('dotenv').config({ path: __dirname + '/.env' });
const pool = require('./config/db');

async function updateDb() {
  try {
    console.log("Upgrading database for Trainer Days Off...");
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS trainer_days_off (
        id SERIAL PRIMARY KEY,
        trainer_name VARCHAR(100) NOT NULL,
        date_off DATE NOT NULL,
        UNIQUE(trainer_name, date_off)
      )
    `);
    
    console.log("Database schema updated successfully.");
  } catch (err) {
    console.error("Migration Error:", err.message);
  } finally {
    process.exit(0);
  }
}

updateDb();
