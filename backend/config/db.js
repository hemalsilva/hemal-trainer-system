const { Pool } = require('pg');

let poolConfig = {
  ssl: { rejectUnauthorized: false }
};

if (process.env.POSTGRES_URL) {
  poolConfig.connectionString = process.env.POSTGRES_URL;
} else if (process.env.DATABASE_URL) {
  poolConfig.connectionString = process.env.DATABASE_URL;
} else {
  poolConfig.user = process.env.DB_USER;
  poolConfig.host = process.env.DB_HOST;
  poolConfig.database = process.env.DB_NAME;
  poolConfig.password = process.env.DB_PASSWORD;
  poolConfig.port = process.env.DB_PORT;
}

const pool = new Pool(poolConfig);
module.exports = pool;
