const fs = require('fs');
let code = fs.readFileSync('backend/routes/audits.js', 'utf8');

code = code.replace(
  "const { Pool } = require('pg');\n\nconst pool = new Pool({\n  user: process.env.DB_USER,\n  host: process.env.DB_HOST,\n  database: process.env.DB_NAME,\n  password: process.env.DB_PASSWORD,\n  port: process.env.DB_PORT,\n});",
  "const pool = require('../config/db');"
);

fs.writeFileSync('backend/routes/audits.js', code, 'utf8');
console.log('Fixed audits.js pool');
