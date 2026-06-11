const fs = require('fs');
const filePath = 'backend/routes/trainings.js';
let content = fs.readFileSync(filePath, 'utf8');

const regex = /SELECT \$1, \$2, \$3([\s\S]*?)WHERE NOT EXISTS/g;
if (content.match(regex)) {
  content = content.replace(regex, 'SELECT $1::int, $2::varchar, $3::varchar$1WHERE NOT EXISTS');
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Fixed bulk insert query casting using regex!');
} else {
  console.log('Regex did not match.');
}
