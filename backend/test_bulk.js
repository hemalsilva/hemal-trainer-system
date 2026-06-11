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
    const id = 1;
    const cleanEmpNo = '1234';
    const empName = 'Test Name';
    
    console.log('Testing bulk insert query...');
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
