const fs = require('fs');
const filePath = 'backend/routes/trainings.js';
let content = fs.readFileSync(filePath, 'utf8');

const oldSummary = `    // Get the training department first
    const trainingRes = await pool.query('SELECT department FROM trainings WHERE id = $1', [id]);
    const trainingDept = trainingRes.rows.length > 0 ? trainingRes.rows[0].department : 'General';

    // Get Absent Employees (Employees not in attendance_records for this training_id)
    let absentQuery = \`
      SELECT e.emp_no, e.full_name as emp_name, e.department, e.designation 
      FROM employees e
      WHERE e.status = 'Active' AND e.emp_no NOT IN (
        SELECT emp_no FROM attendance_records WHERE training_id = $1
      )
    \`;
    const absentParams = [id];

    // Filter by department if not General
    if (trainingDept && trainingDept !== 'General') {
      absentQuery += \` AND e.department = $2 \`;
      absentParams.push(trainingDept);
    }`;

const newSummary = `    // Get the training department and category first
    const trainingRes = await pool.query('SELECT department, category FROM trainings WHERE id = $1', [id]);
    const trainingDept = trainingRes.rows.length > 0 ? trainingRes.rows[0].department : 'General';
    const trainingCategory = trainingRes.rows.length > 0 ? trainingRes.rows[0].category : '';

    let absentQuery = '';
    let absentParams = [id];

    // Check if it's an HR category training
    if (trainingCategory === 'Hotel HR' || trainingCategory === 'HR') {
      // For HR, only consider employees who were EXPLICITLY ALLOCATED to this training
      absentQuery = \`
        SELECT e.emp_no, e.full_name as emp_name, e.department, e.designation 
        FROM employees e
        JOIN training_allocations ta ON e.emp_no = ta.emp_no
        WHERE e.status = 'Active' AND ta.training_id = $1 AND e.emp_no NOT IN (
          SELECT emp_no FROM attendance_records WHERE training_id = $1
        )
      \`;
    } else {
      // Get Absent Employees (Employees not in attendance_records for this training_id)
      absentQuery = \`
        SELECT e.emp_no, e.full_name as emp_name, e.department, e.designation 
        FROM employees e
        WHERE e.status = 'Active' AND e.emp_no NOT IN (
          SELECT emp_no FROM attendance_records WHERE training_id = $1
        )
      \`;
      
      // Filter by department if not General or All Staff
      if (trainingDept && trainingDept !== 'General' && trainingDept !== 'All Staff') {
        absentQuery += \` AND e.department = $2 \`;
        absentParams.push(trainingDept);
      }
    }`;

content = content.replace(oldSummary, newSummary);
fs.writeFileSync(filePath, content, 'utf8');
console.log('attendance-summary route updated');
