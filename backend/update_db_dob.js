const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'hemal_training',
  password: process.env.DB_PASSWORD || 'root',
  port: process.env.DB_PORT || 5432,
});

async function addDOBColumn() {
  try {
    console.log('Connecting to database to add date_of_birth...');
    await pool.query(`
      ALTER TABLE employees
      ADD COLUMN IF NOT EXISTS date_of_birth DATE;
    `);
    console.log('Successfully added date_of_birth column to employees table!');
  } catch (err) {
    console.error('Error updating database:', err);
  } finally {
    await pool.end();
  }
}

addDOBColumn();
