const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'hemal_training',
  password: process.env.DB_PASSWORD || 'root',
  port: process.env.DB_PORT || 5432,
});

async function addPhotoColumn() {
  try {
    console.log('Connecting to database to add photo_url...');
    await pool.query(`
      ALTER TABLE employees
      ADD COLUMN IF NOT EXISTS photo_url VARCHAR(255);
    `);
    console.log('Successfully added photo_url column to employees table!');
  } catch (err) {
    console.error('Error updating database:', err);
  } finally {
    await pool.end();
  }
}

addPhotoColumn();
