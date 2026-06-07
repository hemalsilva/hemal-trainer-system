require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://' + process.env.DB_USER + ':' + process.env.DB_PASSWORD + '@' + process.env.DB_HOST + ':' + process.env.DB_PORT + '/' + process.env.DB_NAME + '?sslmode=require'
});
pool.query('INSERT INTO room_audits (emp_no, emp_name, audit_type, score, audit_date, room_number) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *', ['138205', 'Hemal Silva', 'Stayover', 95, '2026-06-07', '1006'])
.then(res => { console.log('OK', res.rows); pool.end(); })
.catch(err => { console.error('PG ERROR:', err); pool.end(); });
