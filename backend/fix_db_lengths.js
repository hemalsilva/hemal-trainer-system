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
    await client.query('BEGIN');
    console.log('Altering employees table...');
    await client.query('ALTER TABLE employees ALTER COLUMN emp_no TYPE VARCHAR(100);');
    
    console.log('Altering training_allocations table...');
    await client.query('ALTER TABLE training_allocations ALTER COLUMN emp_no TYPE VARCHAR(100);');
    
    console.log('Altering attendance_records table...');
    await client.query('ALTER TABLE attendance_records ALTER COLUMN emp_no TYPE VARCHAR(100);');

    console.log('Altering quiz_results table... (if emp_no exists)');
    try {
        await client.query('ALTER TABLE quiz_results ALTER COLUMN emp_no TYPE VARCHAR(100);');
    } catch(e) {}
    
    await client.query('COMMIT');
    console.log('Successfully updated DB schema lengths');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Failed to update DB schema', err);
  } finally {
    client.release();
    process.exit(0);
  }
}
run();
