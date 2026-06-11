import os

filepath = 'backend/routes/reports.js'
with open(filepath, 'r', encoding='utf8') as f:
    content = f.read()

first_res_json_idx = content.find('res.json({')

new_code = """
    // 6. printSOPRes
    const printSOPRes = await pool.query(`
      SELECT topic, COUNT(id) as sessions, 
             COALESCE((SELECT COUNT(*) FROM attendance_records a WHERE a.training_id IN (SELECT id FROM trainings t2 WHERE t2.topic = t.topic)), 0) as attendees 
      FROM trainings t 
      WHERE category IN ('Mandatory', 'SOP') AND """ + "${trainingFilter}" + """
      GROUP BY topic
    `, trainingParams);

    const printOJTRes = await pool.query(`
      SELECT o.topic, COUNT(*) as assessed, SUM(CASE WHEN o.verdict = 'PASS' THEN 1 ELSE 0 END) as passed 
      FROM ojt_assessments o
      LEFT JOIN employees e ON o.emp_no = e.emp_no
      WHERE """ + "${ojtFilter}" + """
      GROUP BY o.topic
    `, ojtParams);

    const printHRRes = await pool.query(`
      SELECT topic, COUNT(id) as sessions, 
             COALESCE((SELECT COUNT(*) FROM attendance_records a WHERE a.training_id IN (SELECT id FROM trainings t2 WHERE t2.topic = t.topic)), 0) as attendees 
      FROM trainings t 
      WHERE category = 'Hotel HR' AND """ + "${trainingFilter}" + """
      GROUP BY topic
    `, trainingParams);

    const sopHours = await pool.query(`SELECT COALESCE(SUM(duration_minutes)/60, 0) as hours FROM trainings WHERE category IN ('Mandatory', 'SOP') AND """ + "${trainingFilter}`" + """, trainingParams);
    const hrHours = await pool.query(`SELECT COALESCE(SUM(duration_minutes)/60, 0) as hours FROM trainings WHERE category = 'Hotel HR' AND """ + "${trainingFilter}`" + """, trainingParams);
    
    let ojtRecFilter = '1=1';
    let ojtRecParams = [];
    if (start) { ojtRecParams.push(start); ojtRecFilter += ` AND date >= $${ojtRecParams.length}`; }
    if (end) { ojtRecParams.push(end); ojtRecFilter += ` AND date <= $${ojtRecParams.length}`; }
    const ojtHours = await pool.query(`SELECT COALESCE(SUM(duration_minutes)/60, 0) as hours FROM ojt_records WHERE """ + "${ojtRecFilter}`" + """, ojtRecParams);

    const printDataHours = [
      { category: 'Department wise SOP training hours', hours: parseInt(sopHours.rows[0].hours, 10) },
      { category: 'OJT hours', hours: parseInt(ojtHours.rows[0].hours, 10) },
      { category: 'Hotel HR Training hours', hours: parseInt(hrHours.rows[0].hours, 10) }
    ];

    res.json({
      printDataSOP: printSOPRes.rows.map(r => ({ topic: r.topic, sessions: parseInt(r.sessions, 10), attendees: parseInt(r.attendees, 10) })),
      printDataOJT: printOJTRes.rows.map(r => ({ topic: r.topic, assessed: parseInt(r.assessed, 10), passed: parseInt(r.passed, 10) })),
      printDataHR: printHRRes.rows.map(r => ({ topic: r.topic, sessions: parseInt(r.sessions, 10), attendees: parseInt(r.attendees, 10) })),
      printDataHours: printDataHours,
"""

part1 = content[:first_res_json_idx]
part2 = content[first_res_json_idx:]
part2 = part2.replace('res.json({', '', 1) 

final_content = part1 + new_code + part2

with open('backend/routes/reports.js', 'w', encoding='utf8') as f:
    f.write(final_content)

print("Restored and patched perfectly.")
