require('dotenv').config();
const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("No DATABASE_URL found in .env");
  process.exit(1);
}

const pool = new Pool({
  connectionString: connectionString,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  const client = await pool.connect();
  try {
    console.log('Altering tables to increase emp_no length to 100 on REAL DB...');
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
