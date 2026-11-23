const dns = require('dns');
try {
  dns.setDefaultResultOrder('ipv4first');
} catch (e) {}

const { Pool } = require('pg');

const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL || '';

const pool = new Pool({
  connectionString: connectionString || undefined,
  ssl: connectionString ? { rejectUnauthorized: false } : false,
  connectionTimeoutMillis: 25000,
  idleTimeoutMillis: 60000,
  max: 10,
  user:     connectionString ? undefined : process.env.DB_USER,
  host:     connectionString ? undefined : process.env.DB_HOST,
  database: connectionString ? undefined : process.env.DB_NAME,
  password: connectionString ? undefined : process.env.DB_PASSWORD,
  port:     connectionString ? undefined : process.env.DB_PORT,
});

module.exports = pool;
