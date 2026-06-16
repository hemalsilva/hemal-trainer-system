
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
      trainingFilter += ` AND DATE(training_date) >= $${trainingParams.length}`;
    }
    if (end) {
      trainingParams.push(end);
      trainingFilter += ` AND DATE(training_date) <= $${trainingParams.length}`;
    }
    if (department) {
      trainingParams.push(department);
      trainingFilter += ` AND department = $${trainingParams.length}`;
    }

    // 1. monthlyHours
    const monthlyHoursRes = await pool.query(`
      SELECT TO_CHAR(t.training_date, 'Mon') as name, 
             COALESCE(SUM(t.duration_minutes * (SELECT COUNT(*) FROM attendance_records a WHERE a.training_id = t.id)) / 60.0, 0) as hours 
      FROM trainings t
      WHERE ${trainingFilter.replace(/\b(?<![a-zA-Z0-9_\.])(department|training_date|category)\b/g, 't.$1')}
      GROUP BY name, EXTRACT(MONTH FROM t.training_date)
      ORDER BY EXTRACT(MONTH FROM t.training_date) ASC
    `, trainingParams);
    
    const colors = ['#3B82F6', '#10B981', '#8B5CF6', '#EC4899', '#F59E0B', '#14B8A6', '#6B7280'];
    
    // 2. departmentHours
    const deptFilter = start || end ? trainingFilter : '1=1'; // If no date, show all time or we keep it filtered
    const deptHoursRes = await pool.query(`
      SELECT t.department as name, 
             COALESCE(SUM(t.duration_minutes * (SELECT COUNT(*) FROM attendance_records a WHERE a.training_id = t.id)) / 60.0, 0) as value 
      FROM trainings t
      WHERE ${deptFilter.replace(/\b(?<![a-zA-Z0-9_\.])(department|training_date|category)\b/g, 't.$1')}
      GROUP BY t.department
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
    if (start) {
       ojtParams.push(start);
       ojtFilter += ` AND DATE(o.assessment_date) >= $${ojtParams.length}`;
    }
    if (end) {
       ojtParams.push(end);
       ojtFilter += ` AND DATE(o.assessment_date) <= $${ojtParams.length}`;
    }
    if (department) {
       // Assuming ojt_records has no department, but we can join employees
       ojtParams.push(department);
       ojtFilter += ` AND e.department = ${ojtParams.length}`;
    }

    const lowOJTRes = await pool.query(`
      SELECT o.emp_name as employee, o.topic, o.rating, TO_CHAR(o.assessment_date, 'YYYY-MM-DD') as date
      FROM ojt_records o
      LEFT JOIN employees e ON o.emp_no = e.emp_no
      WHERE (o.rating < 3 OR o.pass_fail = false) AND ${ojtFilter}
      ORDER BY o.assessment_date DESC
      LIMIT 20
    `, ojtParams);

    // 6. ojtDetails
    const ojtMasterRes = await pool.query(`
      SELECT 
        o.emp_name as employee, 
        COUNT(*) as completed,
        SUM(CASE WHEN o.pass_fail = false THEN 1 ELSE 0 END) as failed,
        ROUND(AVG(o.rating), 1) as avg_rating,
        MAX(o.topic) as last_topic
      FROM ojt_records o
      LEFT JOIN employees e ON o.emp_no = e.emp_no
      WHERE ${ojtFilter}
      GROUP BY o.emp_name
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
      SELECT t.department, t.topic, COUNT(id) as sessions, 
             COALESCE((SELECT COUNT(*) FROM attendance_records a WHERE a.training_id IN (SELECT id FROM trainings t2 WHERE t2.topic = t.topic AND t2.department = t.department)), 0) as attendees 
      FROM trainings t 
      WHERE category ILIKE ANY (ARRAY['%Mandatory%', '%SOP%']) AND t.status IN ('On Going', 'Completed') AND ${trainingFilter.replace(/\b(?<![a-zA-Z0-9_\.])(department|training_date|category)\b/g, 't.$1')}
      GROUP BY t.department, t.topic
      ORDER BY t.department ASC, t.topic ASC
    `, trainingParams);

    const printOJTRes = await pool.query(`
      SELECT e.department, o.topic, COUNT(*) as assessed, SUM(CASE WHEN o.pass_fail = true THEN 1 ELSE 0 END) as passed 
      FROM ojt_records o
      LEFT JOIN employees e ON o.emp_no = e.emp_no
      WHERE ${ojtFilter}
      GROUP BY e.department, o.topic
      ORDER BY e.department ASC, o.topic ASC
    `, ojtParams);

    const printHRRes = await pool.query(`
      SELECT t.department, t.topic, COUNT(id) as sessions, 
             COALESCE((SELECT COUNT(*) FROM attendance_records a WHERE a.training_id IN (SELECT id FROM trainings t2 WHERE t2.topic = t.topic AND t2.department = t.department)), 0) as attendees 
      FROM trainings t 
      WHERE category ILIKE '%Hotel HR%' AND t.status IN ('On Going', 'Completed') AND ${trainingFilter.replace(/\b(?<![a-zA-Z0-9_\.])(department|training_date|category)\b/g, 't.$1')}
      GROUP BY t.department, t.topic
      ORDER BY t.department ASC, t.topic ASC
    `, trainingParams);

    // Hours calculations
    const sopHours = await pool.query(`SELECT COALESCE(SUM(t.duration_minutes * (SELECT COUNT(*) FROM attendance_records a WHERE a.training_id = t.id)) / 60.0, 0) as hours FROM trainings t WHERE category ILIKE ANY (ARRAY['%Mandatory%', '%SOP%']) AND ${trainingFilter.replace(/\b(?<![a-zA-Z0-9_\.])(department|training_date|category)\b/g, 't.$1')}`, trainingParams);
    const hrHours = await pool.query(`SELECT COALESCE(SUM(t.duration_minutes * (SELECT COUNT(*) FROM attendance_records a WHERE a.training_id = t.id)) / 60.0, 0) as hours FROM trainings t WHERE category ILIKE '%Hotel HR%' AND ${trainingFilter.replace(/\b(?<![a-zA-Z0-9_\.])(department|training_date|category)\b/g, 't.$1')}`, trainingParams);
    
    // OJT records (different table) - sum duration from ojt_records
    let ojtRecFilter = '1=1';
    let ojtRecParams = [];
    if (start) { ojtRecParams.push(start); ojtRecFilter += ` AND DATE(assessment_date) >= $${ojtRecParams.length}`; }
    if (end) { ojtRecParams.push(end); ojtRecFilter += ` AND DATE(assessment_date) <= $${ojtRecParams.length}`; }
    const ojtHours = await pool.query(`SELECT COALESCE(SUM(duration_minutes)/60, 0) as hours FROM ojt_records WHERE ${ojtRecFilter}`, ojtRecParams);

    const printDataHours = [
      { category: 'Department wise SOP training hours', hours: parseInt(sopHours.rows[0].hours, 10) },
      { category: 'OJT hours', hours: parseInt(ojtHours.rows[0].hours, 10) },
      { category: 'Hotel HR Training hours', hours: parseInt(hrHours.rows[0].hours, 10) }
    ];

    res.json({
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
        query = 'SELECT employee_name as "Employee Name", topic as "Assessment Topic", TO_CHAR(date, \'YYYY-MM-DD\') as "Date", rating as "Score/5" FROM ojt_records WHERE verdict = \'FAIL\'';
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
        res.json({
            success: true,
            title: reportTitle,
            count: result.rows.length,
            data: result.rows
        });
    }, 1500);

  } catch (err) {
    if (err.message.includes('relation') && err.message.includes('does not exist')) {
        setTimeout(() => {
            res.json({
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


// GET /api/reports/timeline
router.get('/timeline', async (req, res) => {
  try {
    const { month, year } = req.query;
    let filter = '1=1';
    let params = [];
    if (month && year) {
        params.push(parseInt(year, 10));
        params.push(parseInt(month, 10) + 1);
        filter += ` AND EXTRACT(YEAR FROM t.training_date) = $1 AND EXTRACT(MONTH FROM t.training_date) = $2`;
    }

    const standardQuery = `
      SELECT t.training_date as date, 
             COALESCE((t.duration_minutes * (SELECT COUNT(*) FROM attendance_records a WHERE a.training_id = t.id)), 0) as duration,
             'standard' as type
      FROM trainings t
      WHERE ${filter}
    `;
    const stdRes = await pool.query(standardQuery, params);

    let ojtFilter = '1=1';
    if (month && year) {
        ojtFilter += ` AND EXTRACT(YEAR FROM assessment_date) = $1 AND EXTRACT(MONTH FROM assessment_date) = $2`;
    }
    const ojtQuery = `
      SELECT assessment_date as date, 
             duration_minutes as duration,
             'ojt' as type
      FROM ojt_records
      WHERE ${ojtFilter}
    `;
    const ojtRes = await pool.query(ojtQuery, params);

    res.json({
        standard: stdRes.rows,
        ojt: ojtRes.rows
    });
  } catch (err) {
      console.error('Timeline Error:', err);
      res.status(500).json({ error: err.message });
  }
});

module.exports = router;
