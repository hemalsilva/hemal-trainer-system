
const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// Add the new analytics endpoint first
router.get('/analytics', async (req, res) => {
  try {
    const { start, end, department } = req.query;
    
    let trainingFilter = '1=1';
    let trainingParams = [];
    
    if (start) {
      trainingParams.push(start);
      trainingFilter += ` AND training_date >= $${trainingParams.length}`;
    }
    if (end) {
      trainingParams.push(end);
      trainingFilter += ` AND training_date <= $${trainingParams.length}`;
    }
    if (department) {
      trainingParams.push(department);
      trainingFilter += ` AND department = $${trainingParams.length}`;
    }

    // 1. monthlyHours
    const monthlyHoursRes = await pool.query(`
      SELECT TO_CHAR(training_date, 'Mon') as name, 
             COALESCE(SUM(duration_minutes) / 60, 0) as hours 
      FROM trainings 
      WHERE ${trainingFilter}
      GROUP BY name, EXTRACT(MONTH FROM training_date)
      ORDER BY EXTRACT(MONTH FROM training_date) ASC
    `, trainingParams);
    
    const colors = ['#3B82F6', '#10B981', '#8B5CF6', '#EC4899', '#F59E0B', '#14B8A6', '#6B7280'];
    
    // 2. departmentHours
    const deptFilter = start || end ? trainingFilter : '1=1'; // If no date, show all time or we keep it filtered
    const deptHoursRes = await pool.query(`
      SELECT department as name, 
             COALESCE(SUM(duration_minutes) / 60, 0) as value 
      FROM trainings 
      WHERE ${deptFilter}
      GROUP BY department
    `, trainingParams);
    
    const deptData = deptHoursRes.rows.map((r, i) => ({
      name: r.name || 'General',
      value: parseInt(r.value, 10),
      color: colors[i % colors.length]
    }));

    // 3. absenteeism (last 10 trainings matching filters)
    const absentRes = await pool.query(`
      SELECT t.id, t.topic, 
        (SELECT COUNT(*) FROM employees e WHERE e.status = 'Active' AND e.emp_no NOT IN (SELECT emp_no FROM attendance_records a WHERE a.training_id = t.id) AND (t.department = 'General' OR e.department = t.department)) as absent_count,
        (SELECT string_agg(e.full_name, ', ') FROM employees e WHERE e.status = 'Active' AND e.emp_no NOT IN (SELECT emp_no FROM attendance_records a WHERE a.training_id = t.id) AND (t.department = 'General' OR e.department = t.department)) as names
      FROM trainings t
      WHERE ${trainingFilter}
      ORDER BY t.training_date DESC
      LIMIT 10
    `, trainingParams);
    
    const absentData = absentRes.rows.map(r => ({
      topic: r.topic,
      absent: parseInt(r.absent_count, 10),
      names: r.names || ''
    })).filter(r => r.absent > 0);

    // 4. missingTopicsData (limit 50)
    const missingRes = await pool.query(`
      SELECT e.full_name as employee, t.topic, 'High' as severity
      FROM employees e
      CROSS JOIN trainings t
      WHERE t.category = 'Mandatory' AND e.status = 'Active' 
      AND (t.department = 'General' OR e.department = t.department)
      AND e.emp_no NOT IN (SELECT emp_no FROM attendance_records a WHERE a.training_id = t.id)
      ${department ? 'AND e.department = $1' : ''}
      LIMIT 50
    `, department ? [department] : []);

    // 5. lowPerformanceOJT
    let ojtFilter = '1=1';
    let ojtParams = [];
    if (department) {
       // Assuming ojt_assessments has no department, but we can join employees
       ojtParams.push(department);
       ojtFilter += ` AND e.department = $1`;
    }

    const lowOJTRes = await pool.query(`
      SELECT o.employee_name as employee, o.topic, o.rating, TO_CHAR(o.date, 'YYYY-MM-DD') as date
      FROM ojt_assessments o
      LEFT JOIN employees e ON o.emp_no = e.emp_no
      WHERE (o.rating < 3 OR o.verdict = 'FAIL') AND ${ojtFilter}
      ORDER BY o.date DESC
      LIMIT 20
    `, ojtParams);

    // 6. ojtDetails
    const ojtMasterRes = await pool.query(`
      SELECT 
        o.employee_name as employee, 
        COUNT(*) as completed,
        SUM(CASE WHEN o.verdict = 'FAIL' THEN 1 ELSE 0 END) as failed,
        ROUND(AVG(o.rating), 1) as avg_rating,
        MAX(o.topic) as last_topic
      FROM ojt_assessments o
      LEFT JOIN employees e ON o.emp_no = e.emp_no
      WHERE ${ojtFilter}
      GROUP BY o.employee_name
      ORDER BY completed DESC
      LIMIT 50
    `, ojtParams);
    
    const ojtDetails = ojtMasterRes.rows.map(r => ({
      employee: r.employee,
      completed: parseInt(r.completed, 10),
      failed: parseInt(r.failed, 10),
      avgRating: parseFloat(r.avg_rating),
      lastTopic: r.last_topic
    }));

    // 7. PRINT SUMMARIES
    const printSOPRes = await pool.query(`
      SELECT topic, COUNT(id) as sessions, 
             COALESCE((SELECT COUNT(*) FROM attendance_records a WHERE a.training_id IN (SELECT id FROM trainings t2 WHERE t2.topic = t.topic)), 0) as attendees 
      FROM trainings t 
      WHERE category IN ('Mandatory', 'SOP') AND ${trainingFilter}
      GROUP BY topic
    `, trainingParams);

    const printOJTRes = await pool.query(`
      SELECT o.topic, COUNT(*) as assessed, SUM(CASE WHEN o.verdict = 'PASS' THEN 1 ELSE 0 END) as passed 
      FROM ojt_assessments o
      LEFT JOIN employees e ON o.emp_no = e.emp_no
      WHERE ${ojtFilter}
      GROUP BY o.topic
    `, ojtParams);

    const printHRRes = await pool.query(`
      SELECT topic, COUNT(id) as sessions, 
             COALESCE((SELECT COUNT(*) FROM attendance_records a WHERE a.training_id IN (SELECT id FROM trainings t2 WHERE t2.topic = t.topic)), 0) as attendees 
      FROM trainings t 
      WHERE category = 'Hotel HR' AND ${trainingFilter}
      GROUP BY topic
    `, trainingParams);

    // Hours calculations
    const sopHours = await pool.query(`SELECT COALESCE(SUM(duration_minutes)/60, 0) as hours FROM trainings WHERE category IN ('Mandatory', 'SOP') AND ${trainingFilter}`, trainingParams);
    const hrHours = await pool.query(`SELECT COALESCE(SUM(duration_minutes)/60, 0) as hours FROM trainings WHERE category = 'Hotel HR' AND ${trainingFilter}`, trainingParams);
    
    // OJT records (different table) - sum duration from ojt_records
    let ojtRecFilter = '1=1';
    let ojtRecParams = [];
    if (start) { ojtRecParams.push(start); ojtRecFilter += ` AND date >= $${ojtRecParams.length}`; }
    if (end) { ojtRecParams.push(end); ojtRecFilter += ` AND date <= $${ojtRecParams.length}`; }
    const ojtHours = await pool.query(`SELECT COALESCE(SUM(duration_minutes)/60, 0) as hours FROM ojt_records WHERE ${ojtRecFilter}`, ojtRecParams);

    const printDataHours = [
      { category: 'Department wise SOP training hours', hours: parseInt(sopHours.rows[0].hours, 10) },
      { category: 'OJT hours', hours: parseInt(ojtHours.rows[0].hours, 10) },
      { category: 'Hotel HR Training hours', hours: parseInt(hrHours.rows[0].hours, 10) }
    ];

    
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

    
    // 6. printSOPRes
    const printSOPRes = await pool.query(`
      SELECT topic, COUNT(id) as sessions, 
             COALESCE((SELECT COUNT(*) FROM attendance_records a WHERE a.training_id IN (SELECT id FROM trainings t2 WHERE t2.topic = t.topic)), 0) as attendees 
      FROM trainings t 
      WHERE category IN ('Mandatory', 'SOP') AND ${trainingFilter}
      GROUP BY topic
    `, trainingParams);

    const printOJTRes = await pool.query(`
      SELECT o.topic, COUNT(*) as assessed, SUM(CASE WHEN o.verdict = 'PASS' THEN 1 ELSE 0 END) as passed 
      FROM ojt_assessments o
      LEFT JOIN employees e ON o.emp_no = e.emp_no
      WHERE ${ojtFilter}
      GROUP BY o.topic
    `, ojtParams);

    const printHRRes = await pool.query(`
      SELECT topic, COUNT(id) as sessions, 
             COALESCE((SELECT COUNT(*) FROM attendance_records a WHERE a.training_id IN (SELECT id FROM trainings t2 WHERE t2.topic = t.topic)), 0) as attendees 
      FROM trainings t 
      WHERE category = 'Hotel HR' AND ${trainingFilter}
      GROUP BY topic
    `, trainingParams);

    const sopHours = await pool.query(`SELECT COALESCE(SUM(duration_minutes)/60, 0) as hours FROM trainings WHERE category IN ('Mandatory', 'SOP') AND ${trainingFilter}`, trainingParams);
    const hrHours = await pool.query(`SELECT COALESCE(SUM(duration_minutes)/60, 0) as hours FROM trainings WHERE category = 'Hotel HR' AND ${trainingFilter}`, trainingParams);
    
    let ojtRecFilter = '1=1';
    let ojtRecParams = [];
    if (start) { ojtRecParams.push(start); ojtRecFilter += ` AND date >= $${ojtRecParams.length}`; }
    if (end) { ojtRecParams.push(end); ojtRecFilter += ` AND date <= $${ojtRecParams.length}`; }
    const ojtHours = await pool.query(`SELECT COALESCE(SUM(duration_minutes)/60, 0) as hours FROM ojt_records WHERE ${ojtRecFilter}`, ojtRecParams);

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

      printDataSOP: sopRes.rows.map(r => ({ topic: r.topic, sessions: parseInt(r.sessions, 10), attendees: parseInt(r.attendees, 10) })),
      printDataOJT: ojtSumRes.rows.map(r => ({ topic: r.topic, assessed: parseInt(r.assessed, 10), passed: parseInt(r.passed, 10) })),
      printDataHR: hrRes.rows.map(r => ({ topic: r.topic, sessions: parseInt(r.sessions, 10), attendees: parseInt(r.attendees, 10) })),
      printDataHours: hoursRes.rows.map(r => ({ category: r.category, hours: parseInt(r.hours, 10) })),

      monthlyData: monthlyHoursRes.rows.map(r => ({ name: r.name, hours: parseInt(r.hours, 10) })),
      deptData: deptData,
      absentData: absentData,
      missingTopicsData: missingRes.rows,
      lowPerformanceOJT: lowOJTRes.rows,
      ojtDetails: ojtDetails,
      printDataSOP: printSOPRes.rows.map(r => ({ topic: r.topic, sessions: parseInt(r.sessions, 10), attendees: parseInt(r.attendees, 10) })),
      printDataOJT: printOJTRes.rows.map(r => ({ topic: r.topic, assessed: parseInt(r.assessed, 10), passed: parseInt(r.passed, 10) })),
      printDataHR: printHRRes.rows.map(r => ({ topic: r.topic, sessions: parseInt(r.sessions, 10), attendees: parseInt(r.attendees, 10) })),
      printDataHours
    });
  } catch (err) {
    console.error('Analytics Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Original code for AI
// AI Smart Query Engine
router.post('/ai', async (req, res) => {
  try {
    const prompt = req.body.prompt.toLowerCase();
    
    // 1. Determine Intent (What table?)
    let intent = 'trainings'; // default
    if (prompt.includes('failed') || prompt.includes('rating') || prompt.includes('assess')) {
        intent = 'ojt_failed';
    } else if (prompt.includes('employee') || prompt.includes('staff')) {
        intent = 'employees';
    } else if (prompt.includes('allocate') || prompt.includes('roster')) {
        intent = 'allocations';
    }

    // 2. Determine Filters
    const filters = [];
    const values = [];
    let query = '';
    let reportTitle = 'Custom AI Report';

    if (intent === 'trainings') {
        query = 'SELECT topic as "Topic", department as "Department", category as "Category", TO_CHAR(training_date, \'YYYY-MM-DD HH12:MI AM\') as "Date & Time", venue as "Venue", trainer_name as "Trainer" FROM trainings WHERE 1=1';
        reportTitle = 'Training Schedule Report';
        
        if (prompt.includes('upcoming') || prompt.includes('future')) {
            filters.push(`training_date > NOW()`);
            reportTitle = 'Upcoming ' + reportTitle;
        }
        if (prompt.includes('past') || prompt.includes('completed')) {
            filters.push(`training_date <= NOW()`);
            reportTitle = 'Completed ' + reportTitle;
        }
    } else if (intent === 'ojt_failed') {
        query = 'SELECT employee_name as "Employee Name", topic as "Assessment Topic", TO_CHAR(date, \'YYYY-MM-DD\') as "Date", rating as "Score/5" FROM ojt_assessments WHERE verdict = \'FAIL\'';
        reportTitle = 'Failed OJT Assessments Report';
    } else if (intent === 'employees') {
        query = 'SELECT emp_no as "Emp No", name as "Employee Name", department as "Department", designation as "Designation" FROM employees WHERE 1=1';
        reportTitle = 'Employee Directory Report';
    } else if (intent === 'allocations') {
        query = 'SELECT t.topic as "Topic", t.department as "Department", a.emp_name as "Allocated Staff", a.emp_no as "Emp No" FROM training_allocations a JOIN trainings t ON a.training_id = t.id WHERE 1=1';
        reportTitle = 'Staff Allocation Report';
    }

    // Apply Global Filters (Department & Category)
    const departments = ['rooms', 'laundry', 'public area', 'flower'];
    for (const dept of departments) {
        if (prompt.includes(dept)) {
            const deptCapitalized = dept.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
            values.push(deptCapitalized);
            if (intent === 'allocations') {
                filters.push(`t.department = $${values.length}`);
            } else if (intent === 'trainings' || intent === 'employees') {
                filters.push(`department = $${values.length}`);
            }
            reportTitle = deptCapitalized + ' ' + reportTitle;
            break; 
        }
    }

    if (intent === 'trainings') {
        const categories = ['sop', 'ojt', 'hotel hr', 'mandatory'];
        for (const cat of categories) {
            if (prompt.includes(cat)) {
                let catVal = cat.toUpperCase();
                if (cat === 'hotel hr') catVal = 'Hotel HR';
                if (cat === 'mandatory') catVal = 'Mandatory';
                values.push(catVal);
                filters.push(`category = $${values.length}`);
                reportTitle = catVal + ' ' + reportTitle;
                break;
            }
        }
    }

    if (filters.length > 0) {
        query += ' AND ' + filters.join(' AND ');
    }
    
    query += ' LIMIT 100'; // Safety limit

    // Execute
    const result = await pool.query(query, values);
    
    // Simulate AI thinking delay for cool factor
    setTimeout(() => {
        
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

    res.json({
      printDataSOP: sopRes.rows.map(r => ({ topic: r.topic, sessions: parseInt(r.sessions, 10), attendees: parseInt(r.attendees, 10) })),
      printDataOJT: ojtSumRes.rows.map(r => ({ topic: r.topic, assessed: parseInt(r.assessed, 10), passed: parseInt(r.passed, 10) })),
      printDataHR: hrRes.rows.map(r => ({ topic: r.topic, sessions: parseInt(r.sessions, 10), attendees: parseInt(r.attendees, 10) })),
      printDataHours: hoursRes.rows.map(r => ({ category: r.category, hours: parseInt(r.hours, 10) })),

            success: true,
            title: reportTitle,
            count: result.rows.length,
            data: result.rows
        });
    }, 1500);

  } catch (err) {
    if (err.message.includes('relation') && err.message.includes('does not exist')) {
        setTimeout(() => {
            
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

    res.json({
      printDataSOP: sopRes.rows.map(r => ({ topic: r.topic, sessions: parseInt(r.sessions, 10), attendees: parseInt(r.attendees, 10) })),
      printDataOJT: ojtSumRes.rows.map(r => ({ topic: r.topic, assessed: parseInt(r.assessed, 10), passed: parseInt(r.passed, 10) })),
      printDataHR: hrRes.rows.map(r => ({ topic: r.topic, sessions: parseInt(r.sessions, 10), attendees: parseInt(r.attendees, 10) })),
      printDataHours: hoursRes.rows.map(r => ({ category: r.category, hours: parseInt(r.hours, 10) })),

                success: true,
                title: "Simulated Custom AI Report",
                count: 1,
                data: [
                    { "Alert": "Missing Data Table", "Details": "The requested table does not exist in the database yet.", "Error": err.message }
                ]
            });
        }, 1500);
    } else {
        res.status(500).json({ error: err.message });
    }
  }
});

module.exports = router;
