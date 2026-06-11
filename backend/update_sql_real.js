const fs = require('fs');
const filePath = 'backend/routes/trainings.js';
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace('SELECT $1, $2, $3\n           WHERE NOT EXISTS', 'SELECT $1::int, $2::varchar, $3::varchar\n           WHERE NOT EXISTS');
content = content.replace('SELECT $1, $2, $3\r\n           WHERE NOT EXISTS', 'SELECT $1::int, $2::varchar, $3::varchar\r\n           WHERE NOT EXISTS');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed bulk insert query casting for real.');
