const { Pool } = require('pg');
require('dotenv').config({ path: 'backend/.env' });
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
async function check() {
  const { rows } = await pool.query('SELECT * FROM room_audits ORDER BY id DESC LIMIT 5');
  console.log(rows);
  process.exit(0);
}
check();
