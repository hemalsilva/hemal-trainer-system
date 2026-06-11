const pool = require('./config/db');

async function test() {
  try {
    const trainingFilter = '1=1';
    const trainingParams = [];

    const sopRes = await pool.query(`
      SELECT topic, COUNT(id) as sessions,
      (SELECT COUNT(*) FROM attendance_records a JOIN trainings t2 ON a.training_id = t2.id WHERE t2.topic = t.topic) as attendees
      FROM trainings t
      WHERE category != 'Compliance' AND ${trainingFilter}
      GROUP BY topic
    `, trainingParams);
    console.log("SOP:", sopRes.rows);

    const ojtSumRes = await pool.query(`
      SELECT o.topic, COUNT(o.id) as assessed, 
      COUNT(CASE WHEN o.rating >= 3 OR o.verdict = 'PASS' THEN 1 END) as passed
      FROM ojt_assessments o
      LEFT JOIN employees e ON o.emp_no = e.emp_no
      WHERE 1=1
      GROUP BY o.topic
    `);
    console.log("OJT:", ojtSumRes.rows);

    const hoursRes = await pool.query(`
      SELECT category, COALESCE(SUM(duration_minutes) / 60, 0) as hours
      FROM trainings t
      WHERE ${trainingFilter}
      GROUP BY category
    `, trainingParams);
    console.log("HOURS:", hoursRes.rows);

  } catch (err) {
    console.error("TEST FAILED:", err);
  } finally {
    pool.end();
  }
}
test();
