const fs = require('fs');
const filePath = 'setup_db.js';
let content = fs.readFileSync(filePath, 'utf8');

// Replace VARCHAR(20) with VARCHAR(100) for emp_no across the file
content = content.replace(/emp_no VARCHAR\(20\)/g, 'emp_no VARCHAR(100)');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Updated setup_db.js schemas.');
