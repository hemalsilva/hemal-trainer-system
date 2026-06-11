require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
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
    console.log('Insert successful. Rows affected:', insertRes.rowCount);
  } catch (err) {
    console.error('SQL Error:', err.message);
  } finally {
    client.release();
    process.exit();
  }
}
run();
