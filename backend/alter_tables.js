require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'hemal_trainer',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

async function run() {
  const client = await pool.connect();
  try {
    console.log('Altering tables to increase emp_no length to 100...');
    await client.query(`ALTER TABLE employees ALTER COLUMN emp_no TYPE VARCHAR(100);`);
    await client.query(`ALTER TABLE training_allocations ALTER COLUMN emp_no TYPE VARCHAR(100);`);
    await client.query(`ALTER TABLE attendance_records ALTER COLUMN emp_no TYPE VARCHAR(100);`);
    console.log('Tables altered successfully!');
  } catch (err) {
    console.error('Error altering tables:', err.message);
  } finally {
    client.release();
    process.exit();
  }
}
run();
