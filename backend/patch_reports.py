import os
import re

filepath = 'backend/routes/reports.js'
with open(filepath, 'r', encoding='utf8') as f:
    content = f.read()

# I will add the 4 new queries just before "res.json({"
# First find the return statement
pattern = r'(res\.json\(\{)'
replacement = r"""
    // 6. printDataSOP
    const sopRes = await pool.query(`
      SELECT topic, COUNT(id) as sessions,
      (SELECT COUNT(*) FROM attendance_records a JOIN trainings t2 ON a.training_id = t2.id WHERE t2.topic = t.topic) as attendees
      FROM trainings t
      WHERE category != 'Compliance' AND ${trainingFilter}
      GROUP BY topic
    `, trainingParams);

    // 7. printDataOJT
    const ojtSumRes = await pool.query(`
      SELECT o.topic, COUNT(o.id) as assessed, 
      COUNT(CASE WHEN o.rating >= 3 OR o.verdict = 'PASS' THEN 1 END) as passed
      FROM ojt_assessments o
      LEFT JOIN employees e ON o.emp_no = e.emp_no
      WHERE ${ojtFilter}
      GROUP BY o.topic
    `, ojtParams);

    // 8. printDataHR
    const hrRes = await pool.query(`
      SELECT topic, COUNT(id) as sessions,
      (SELECT COUNT(*) FROM attendance_records a JOIN trainings t2 ON a.training_id = t2.id WHERE t2.topic = t.topic) as attendees
      FROM trainings t
      WHERE category = 'Compliance' AND ${trainingFilter}
      GROUP BY topic
    `, trainingParams);

    // 9. printDataHours
    const hoursRes = await pool.query(`
      SELECT category, COALESCE(SUM(duration_minutes) / 60, 0) as hours
      FROM trainings t
      WHERE ${trainingFilter}
      GROUP BY category
    `, trainingParams);

    \1
      printDataSOP: sopRes.rows.map(r => ({ topic: r.topic, sessions: parseInt(r.sessions, 10), attendees: parseInt(r.attendees, 10) })),
      printDataOJT: ojtSumRes.rows.map(r => ({ topic: r.topic, assessed: parseInt(r.assessed, 10), passed: parseInt(r.passed, 10) })),
      printDataHR: hrRes.rows.map(r => ({ topic: r.topic, sessions: parseInt(r.sessions, 10), attendees: parseInt(r.attendees, 10) })),
      printDataHours: hoursRes.rows.map(r => ({ category: r.category, hours: parseInt(r.hours, 10) })),
"""

new_content = re.sub(pattern, replacement, content)

if new_content != content:
    with open(filepath, 'w', encoding='utf8') as f:
        f.write(new_content)
    print("Successfully patched reports.js")
else:
    print("Could not patch reports.js")
