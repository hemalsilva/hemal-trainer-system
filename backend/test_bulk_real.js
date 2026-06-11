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
    const res = await client.query('SELECT id FROM trainings LIMIT 1');
    if (res.rows.length === 0) {
      console.log('No trainings found to test with.');
      return;
    }
    const id = res.rows[0].id;
    const cleanEmpNo = 'TEST-001';
    const empName = 'Test Employee';
    
    console.log(`Testing insert for training_id: ${id}`);
    const insertRes = await client.query(
        `INSERT INTO attendance_records (training_id, emp_no, emp_name)
         SELECT $1::int, $2::varchar, $3::varchar
         WHERE NOT EXISTS (
           SELECT 1 FROM attendance_records WHERE training_id = $1 AND emp_no = $2
         ) RETURNING *`,
        [id, cleanEmpNo, empName]
      );
    console.log('Insert successful:', insertRes.rows);
  } catch (err) {
    console.error('SQL Error:', err.message);
  } finally {
    client.release();
    process.exit();
  }
}
run();
