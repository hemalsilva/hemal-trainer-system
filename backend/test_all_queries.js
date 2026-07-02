const { Client } = require('pg');

async function test() {
  const client = new Client({ connectionString: 'postgresql://neondb_owner:npg_dvm1yAkENnO8@ep-shiny-tooth-aqfpdhtk.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require' });
  await client.connect();

  const start = '2026-06-01';
  const end = '2026-06-10';
  const department = '';

  let trainingFilter = '1=1';
  let trainingParams = [];
  if (start) { trainingParams.push(start); trainingFilter += ` AND DATE(training_date) >= $${trainingParams.length}`; }
  if (end) { trainingParams.push(end); trainingFilter += ` AND DATE(training_date) <= $${trainingParams.length}`; }
  if (department) { trainingParams.push(department); trainingFilter += ` AND department = $${trainingParams.length}`; }

  console.log('trainingFilter:', trainingFilter);
  console.log('trainingParams:', trainingParams);

  try {
    await client.query(`SELECT TO_CHAR(training_date, 'Mon') as name, COALESCE(SUM(duration_minutes) / 60, 0) as hours FROM trainings WHERE ${trainingFilter} GROUP BY name, EXTRACT(MONTH FROM training_date) ORDER BY EXTRACT(MONTH FROM training_date) ASC`, trainingParams);
    console.log('Q1 passed');
  } catch(e) { console.error('Q1 error:', e.message); }

  try {
    const deptFilter = start || end ? trainingFilter : '1=1';
    await client.query(`SELECT department as name, COALESCE(SUM(duration_minutes) / 60, 0) as value FROM trainings WHERE ${deptFilter} GROUP BY department`, trainingParams);
    console.log('Q2 passed');
  } catch(e) { console.error('Q2 error:', e.message); }

  try {
    await client.query(`SELECT t.id, t.topic FROM trainings t WHERE ${trainingFilter} ORDER BY t.training_date DESC LIMIT 10`, trainingParams);
    console.log('Q3 passed');
  } catch(e) { console.error('Q3 error:', e.message); }

  try {
    await client.query(`SELECT e.full_name as employee, t.topic, 'High' as severity FROM employees e CROSS JOIN trainings t WHERE t.category = 'Mandatory' AND e.status = 'Active' AND (t.department = 'General' OR e.department = t.department) AND e.emp_no NOT IN (SELECT emp_no FROM attendance_records a WHERE a.training_id = t.id) ${department ? 'AND e.department = $1' : ''} LIMIT 50`, department ? [department] : []);
    console.log('Q4 passed');
  } catch(e) { console.error('Q4 error:', e.message); }

  let ojtFilter = '1=1';
  let ojtParams = [];
  if (start) { ojtParams.push(start); ojtFilter += ` AND DATE(o.date) >= $${ojtParams.length}`; }
  if (end) { ojtParams.push(end); ojtFilter += ` AND DATE(o.date) <= $${ojtParams.length}`; }
  if (department) { ojtParams.push(department); ojtFilter += ` AND e.department = $${ojtParams.length}`; }

  try {
    await client.query(`SELECT o.employee_name as employee, o.topic, o.rating, TO_CHAR(o.date, 'YYYY-MM-DD') as date FROM ojt_records o LEFT JOIN employees e ON o.emp_no = e.emp_no WHERE (o.rating < 3 OR o.verdict = 'FAIL') AND ${ojtFilter} ORDER BY o.date DESC LIMIT 20`, ojtParams);
    console.log('Q5 passed');
  } catch(e) { console.error('Q5 error:', e.message); }

  try {
    await client.query(`SELECT o.employee_name as employee, COUNT(*) as completed, SUM(CASE WHEN o.verdict = 'FAIL' THEN 1 ELSE 0 END) as failed, ROUND(AVG(o.rating), 1) as avg_rating, MAX(o.topic) as last_topic FROM ojt_records o LEFT JOIN employees e ON o.emp_no = e.emp_no WHERE ${ojtFilter} GROUP BY o.employee_name ORDER BY completed DESC LIMIT 50`, ojtParams);
    console.log('Q6 passed');
  } catch(e) { console.error('Q6 error:', e.message); }

  try {
    await client.query(`SELECT topic, COUNT(id) as sessions, COALESCE((SELECT COUNT(*) FROM attendance_records a WHERE a.training_id IN (SELECT id FROM trainings t2 WHERE t2.topic = t.topic)), 0) as attendees FROM trainings t WHERE category ILIKE ANY (ARRAY['%Mandatory%', '%SOP%']) AND ${trainingFilter} GROUP BY topic`, trainingParams);
    console.log('Q7 SOP passed');
  } catch(e) { console.error('Q7 SOP error:', e.message); }

  try {
    await client.query(`SELECT o.topic, COUNT(*) as assessed, SUM(CASE WHEN o.verdict = 'PASS' THEN 1 ELSE 0 END) as passed FROM ojt_records o LEFT JOIN employees e ON o.emp_no = e.emp_no WHERE ${ojtFilter} GROUP BY o.topic`, ojtParams);
    console.log('Q7 OJT passed');
  } catch(e) { console.error('Q7 OJT error:', e.message); }

  try {
    await client.query(`SELECT topic, COUNT(id) as sessions, COALESCE((SELECT COUNT(*) FROM attendance_records a WHERE a.training_id IN (SELECT id FROM trainings t2 WHERE t2.topic = t.topic)), 0) as attendees FROM trainings t WHERE category ILIKE '%Hotel HR%' AND ${trainingFilter} GROUP BY topic`, trainingParams);
    console.log('Q7 HR passed');
  } catch(e) { console.error('Q7 HR error:', e.message); }

  try {
    await client.query(`SELECT COALESCE(SUM(duration_minutes)/60, 0) as hours FROM trainings WHERE category ILIKE ANY (ARRAY['%Mandatory%', '%SOP%']) AND ${trainingFilter}`, trainingParams);
    console.log('Q8 SOP Hours passed');
  } catch(e) { console.error('Q8 SOP Hours error:', e.message); }

  let ojtRecFilter = '1=1';
  let ojtRecParams = [];
  if (start) { ojtRecParams.push(start); ojtRecFilter += ` AND DATE(date) >= $${ojtRecParams.length}`; }
  if (end) { ojtRecParams.push(end); ojtRecFilter += ` AND DATE(date) <= $${ojtRecParams.length}`; }
  
  try {
    await client.query(`SELECT COALESCE(SUM(duration_minutes)/60, 0) as hours FROM ojt_records WHERE ${ojtRecFilter}`, ojtRecParams);
    console.log('Q8 OJT Hours passed');
  } catch(e) { console.error('Q8 OJT Hours error:', e.message); }

  await client.end();
}

test();
