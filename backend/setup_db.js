const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function setupAllTables() {
  const client = await pool.connect();
  try {
    console.log('Setting up all database tables...\n');

    await client.query(`
      CREATE TABLE IF NOT EXISTS employees (
        id SERIAL PRIMARY KEY,
        emp_no VARCHAR(100) UNIQUE NOT NULL,
        full_name VARCHAR(150) NOT NULL,
        department VARCHAR(100),
        designation VARCHAR(100),
        join_date DATE,
        date_of_birth DATE,
        contact_number VARCHAR(50),
        email VARCHAR(150),
        status VARCHAR(50) DEFAULT 'Active',
        photo_url VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ employees table ready');

    await client.query(`
      CREATE TABLE IF NOT EXISTS trainings (
        id SERIAL PRIMARY KEY,
        topic VARCHAR(200) NOT NULL,
        category VARCHAR(100),
        department VARCHAR(100) DEFAULT 'General',
        venue VARCHAR(150),
        duration_minutes INT DEFAULT 60,
        trainer_name VARCHAR(150),
        training_date TIMESTAMP NOT NULL,
        google_form_link VARCHAR(255),
        status VARCHAR(50) DEFAULT 'Scheduled',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ trainings table ready');

    await client.query(`
      CREATE TABLE IF NOT EXISTS training_allocations (
        id SERIAL PRIMARY KEY,
        training_id INT REFERENCES trainings(id) ON DELETE CASCADE,
        emp_no VARCHAR(100),
        emp_name VARCHAR(150),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ training_allocations table ready');

    await client.query(`
      CREATE TABLE IF NOT EXISTS trainer_days_off (
        id SERIAL PRIMARY KEY,
        trainer_name VARCHAR(150) NOT NULL,
        date_off DATE NOT NULL,
        UNIQUE(trainer_name, date_off)
      );
    `);
    console.log('✅ trainer_days_off table ready');

    await client.query(`
      CREATE TABLE IF NOT EXISTS attendance_records (
        id SERIAL PRIMARY KEY,
        training_id INT REFERENCES trainings(id) ON DELETE CASCADE,
        emp_no VARCHAR(100),
        emp_name VARCHAR(150),
        scanned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ attendance_records table ready');

    await client.query(`
      CREATE TABLE IF NOT EXISTS ojt_records (
        id SERIAL PRIMARY KEY,
        emp_no VARCHAR(100),
        emp_name VARCHAR(150),
        department VARCHAR(100) DEFAULT 'Rooms',
        assessment_date DATE,
        topic VARCHAR(200),
        trainer_name VARCHAR(150),
        location VARCHAR(150),
        assessment_notes TEXT,
        rating INT CHECK (rating >= 1 AND rating <= 5),
        pass_fail BOOLEAN,
        completion_status VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ ojt_records table ready');

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'admin',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ users table ready');

    const alterQueries = [
      `ALTER TABLE employees ADD COLUMN IF NOT EXISTS department VARCHAR(100)`,
      `ALTER TABLE employees ADD COLUMN IF NOT EXISTS date_of_birth DATE`,
      `ALTER TABLE employees ADD COLUMN IF NOT EXISTS photo_url VARCHAR(255)`,
      `ALTER TABLE trainings ADD COLUMN IF NOT EXISTS department VARCHAR(100) DEFAULT 'General'`,
      `ALTER TABLE trainings ADD COLUMN IF NOT EXISTS trainer_name VARCHAR(150)`,
      `ALTER TABLE ojt_records ADD COLUMN IF NOT EXISTS department VARCHAR(100) DEFAULT 'Rooms'`,
      `ALTER TABLE ojt_records ADD COLUMN IF NOT EXISTS emp_no VARCHAR(100)`,
      `ALTER TABLE ojt_records ADD COLUMN IF NOT EXISTS emp_name VARCHAR(150)`,
      `ALTER TABLE ojt_records ADD COLUMN IF NOT EXISTS assessment_date DATE`,
    ];

    for (const q of alterQueries) {
      try { await client.query(q); } catch(e) { /* already exists */ }
    }
    console.log('✅ All column upgrades applied');

    console.log('\n============================================');
    console.log('  ALL TABLES CREATED SUCCESSFULLY!');
    console.log('  Your database is ready to use.');
    console.log('============================================\n');

  } catch (err) {
    console.error('Error setting up tables:', err.message);
  } finally {
    client.release();
    pool.end();
  }
}

setupAllTables();
