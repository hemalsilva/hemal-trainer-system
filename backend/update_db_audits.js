const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function setupAuditsTable() {
  const client = await pool.connect();
  try {
    console.log('Setting up room_audits table...\n');

    await client.query(`
      CREATE TABLE IF NOT EXISTS room_audits (
        id SERIAL PRIMARY KEY,
        emp_no VARCHAR(20) NOT NULL,
        emp_name VARCHAR(150),
        audit_type VARCHAR(50) NOT NULL, -- 'Departure' or 'Stayover'
        score INT NOT NULL,
        audit_date DATE NOT NULL,
        room_number VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ room_audits table ready');

    console.log('\n============================================');
    console.log('  AUDITS TABLE CREATED SUCCESSFULLY!');
    console.log('============================================\n');

  } catch (err) {
    console.error('Error setting up tables:', err.message);
  } finally {
    client.release();
    pool.end();
  }
}

setupAuditsTable();
