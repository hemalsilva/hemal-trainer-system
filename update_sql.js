const fs = require('fs');
const filePath = 'backend/routes/trainings.js';
let content = fs.readFileSync(filePath, 'utf8');

const oldQ = `        const insertRes = await client.query(
          \`INSERT INTO attendance_records (training_id, emp_no, emp_name)
           SELECT $1, $2, $3
           WHERE NOT EXISTS (
             SELECT 1 FROM attendance_records WHERE training_id = $1 AND emp_no = $2
           ) RETURNING *\`,
          [id, cleanEmpNo, empName]
        );`;

const newQ = `        const insertRes = await client.query(
          \`INSERT INTO attendance_records (training_id, emp_no, emp_name)
           SELECT $1::int, $2::varchar, $3::varchar
           WHERE NOT EXISTS (
             SELECT 1 FROM attendance_records WHERE training_id = $1 AND emp_no = $2
           ) RETURNING *\`,
          [id, cleanEmpNo, empName]
        );`;

content = content.replace(oldQ, newQ);
fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed bulk insert query casting.');
