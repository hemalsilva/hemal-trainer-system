
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
       ojtFilter += ` AND e.department = $${ojtParams.length}`;
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


const excel = require('exceljs');

// Helper to get month name
const getMonthName = (monthIndex) => {
  const months = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
  return months[monthIndex - 1] || '';
};

const getOrdinal = (n) => {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};



router.get('/ojt-excel', async (req, res) => {
  try {
    const { month, year } = req.query;
    if (!month || !year) {
      return res.status(400).json({ error: 'Month and year are required' });
    }

    const m = parseInt(month, 10);
    const y = parseInt(year, 10);
    const daysInMonth = new Date(y, m, 0).getDate();
    const monthName = getMonthName(m);
    
    // Fetch all active employees for specific departments
    const empRes = await pool.query(`
      SELECT emp_no, full_name, designation, department, status, gender_identity
      FROM employees 
      WHERE status = 'Active' 
      AND department IN ('Rooms', 'Public Area', 'Flower', 'Laundry')
      ORDER BY full_name ASC
    `);
    const allEmployees = empRes.rows;

    // Fetch trainings for the month
    const trnRes = await pool.query(`
      SELECT t.id, t.topic, t.duration_minutes, t.training_date, 
             t.department, t.trainer_name
      FROM trainings t
      WHERE EXTRACT(MONTH FROM t.training_date) = $1
      AND EXTRACT(YEAR FROM t.training_date) = $2
    `, [m, y]);
    const trainings = trnRes.rows;

    // Fetch attendance for these trainings
    let attendance = [];
    if (trainings.length > 0) {
      const tIds = trainings.map(t => t.id);
      const attRes = await pool.query(`
        SELECT a.training_id, a.emp_no
        FROM attendance_records a
        WHERE a.training_id = ANY($1)
      `, [tIds]);
      attendance = attRes.rows;
    }

    // Fetch OJT records
    const ojtRes = await pool.query(`
      SELECT id, topic, duration_minutes, assessment_date as training_date, 
             department, trainer_name, emp_no
      FROM ojt_records
      WHERE EXTRACT(MONTH FROM assessment_date) = $1
      AND EXTRACT(YEAR FROM assessment_date) = $2
    `, [m, y]);
    const ojtRecords = ojtRes.rows;

    const workbook = new excel.Workbook();
    const departments = ['Rooms', 'Public Area', 'Flower', 'Laundry'];
    let summaryData = [];

    departments.forEach(dept => {
      const deptEmployees = allEmployees.filter(e => e.department === dept);
      const deptTrainings = trainings.filter(t => t.department === dept || t.department === 'General');
      const deptOjts = ojtRecords.filter(o => o.department === dept || o.department === 'General');
      
      const sheet = workbook.addWorksheet(dept);
      
      // Calculate dynamic day columns
      let dayColumns = [];
      for (let d = 1; d <= daysInMonth; d++) {
        const tByDay = deptTrainings.filter(t => new Date(t.training_date).getDate() === d).map(t => ({...t, _type: 'training'}));
        const oByDay = deptOjts.filter(o => new Date(o.training_date).getDate() === d).map(o => ({...o, _type: 'ojt'}));
        const allDay = [...tByDay, ...oByDay];
        
        if (allDay.length === 0) {
          dayColumns.push({ day: d, _type: 'empty' });
        } else {
          allDay.forEach(session => {
             dayColumns.push({ day: d, _type: session._type, data: session });
          });
        }
      }

      const totalCol = 7 + dayColumns.length + 1;

      // Row 1: Month Name
      const r1 = sheet.addRow([monthName]);
      r1.font = { bold: true };
      r1.alignment = { horizontal: 'center' };
      sheet.mergeCells(1, 1, 1, totalCol);

      // Row 2: Title and Trainer header
      const r2 = sheet.addRow([]);
      r2.getCell(1).value = 'Departmental On The Job Training Tracker';
      r2.getCell(1).font = { bold: true };
      r2.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
      r2.height = 25;

      // Row 3: Training Topic header
      const r3 = sheet.addRow([]);
      r3.height = 40;
      
      // NOW merge Rows 2 and 3 for the title area, AFTER they both exist
      sheet.mergeCells(2, 1, 3, 7);
      
      dayColumns.forEach((colDef, idx) => {
        const colNum = 8 + idx;
        let trainer = colDef._type !== 'empty' ? (colDef.data.trainer_name || 'Trainer') : '';
        let topic = colDef._type !== 'empty' ? colDef.data.topic : '';
        
        r2.getCell(colNum).value = trainer;
        r2.getCell(colNum).font = { bold: true };
        r2.getCell(colNum).alignment = { textRotation: 90, vertical: 'bottom', horizontal: 'center' };
        
        r3.getCell(colNum).value = topic;
        r3.getCell(colNum).font = { bold: true };
        r3.getCell(colNum).alignment = { textRotation: 90, vertical: 'bottom', horizontal: 'center', wrapText: true };
      });

      // Row 4: Column Headers
      const headers = ['User/Employee ID', 'Name', 'Gender Identity', 'Employee Status', 'Position Title', 'Division', 'Sub Department'];
      const r4 = sheet.addRow(headers);
      
      dayColumns.forEach((colDef, idx) => {
        const colNum = 8 + idx;
        r4.getCell(colNum).value = getOrdinal(colDef.day);
        r4.getCell(colNum).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };
        r4.getCell(colNum).alignment = { horizontal: 'center', vertical: 'middle' };
      });
      
      // Merge date headers if there are multiple sessions in the same day (Row 4)
      for (let d = 1; d <= daysInMonth; d++) {
        const matches = [];
        dayColumns.forEach((colDef, idx) => {
           if(colDef.day === d) matches.push(8 + idx);
        });
        if(matches.length > 1) {
           sheet.mergeCells(4, matches[0], 4, matches[matches.length - 1]);
        }
      }

      r4.getCell(totalCol).value = 'Total Hours';
      r4.getCell(totalCol).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF00' } };
      r4.font = { bold: true };
      r4.alignment = { horizontal: 'center', vertical: 'middle' };

      sheet.getColumn(1).width = 15;
      sheet.getColumn(2).width = 25;
      sheet.getColumn(3).width = 15;
      sheet.getColumn(4).width = 15;
      sheet.getColumn(5).width = 30;
      sheet.getColumn(6).width = 20;
      sheet.getColumn(7).width = 20;
      dayColumns.forEach((_, idx) => {
        sheet.getColumn(8 + idx).width = 5;
      });
      sheet.getColumn(totalCol).width = 15;

      let totalDeptHours = 0;
      let employeesTrained = new Set();
      let rowIdx = 5;

      deptEmployees.forEach(emp => {
        const rowData = [emp.emp_no, emp.full_name, emp.gender_identity || '', emp.status, emp.designation, 'Housekeeping', dept];
        const r = sheet.addRow(rowData);
        
        let empTotalMins = 0;
        
        dayColumns.forEach((colDef, idx) => {
          const colNum = 8 + idx;
          let mins = 0;
          if (colDef._type === 'training') {
             const attended = attendance.some(a => a.training_id === colDef.data.id && a.emp_no === emp.emp_no);
             if(attended) {
                 mins = colDef.data.duration_minutes || 0;
             }
          } else if (colDef._type === 'ojt') {
             if(colDef.data.emp_no === emp.emp_no) {
                 mins = colDef.data.duration_minutes || 0;
             }
          }
          
          if(mins > 0) {
             r.getCell(colNum).value = mins;
             empTotalMins += mins;
             employeesTrained.add(emp.emp_no);
          }
        });

        totalDeptHours += (empTotalMins / 60);
        
        const startLetter = sheet.getColumn(8).letter;
        const endLetter = sheet.getColumn(7 + dayColumns.length).letter;
        r.getCell(totalCol).value = { formula: `SUM(${startLetter}${rowIdx}:${endLetter}${rowIdx})/60` };
        r.getCell(totalCol).numFmt = '0.0';
        
        rowIdx++;
      });

      // Daily Total Auto-calculate Row
      const dailyTotalRow = sheet.addRow(['Daily Total Hours']);
      dailyTotalRow.font = { bold: true };
      sheet.mergeCells(rowIdx, 1, rowIdx, 7);
      dailyTotalRow.getCell(1).alignment = { horizontal: 'right', vertical: 'middle' };
      
      dayColumns.forEach((_, idx) => {
        const colNum = 8 + idx;
        const colLetter = sheet.getColumn(colNum).letter;
        dailyTotalRow.getCell(colNum).value = { formula: `SUM(${colLetter}5:${colLetter}${rowIdx-1})/60` };
        dailyTotalRow.getCell(colNum).numFmt = '0.0';
      });
      
      const tColLetter = sheet.getColumn(totalCol).letter;
      dailyTotalRow.getCell(totalCol).value = { formula: `SUM(${tColLetter}5:${tColLetter}${rowIdx-1})` };
      dailyTotalRow.getCell(totalCol).numFmt = '0.0';
      dailyTotalRow.getCell(totalCol).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF00' } };
      
      summaryData.push({
        dept,
        totalHours: totalDeptHours.toFixed(1),
        employeesTrained: employeesTrained.size,
        totalEmployees: deptEmployees.length
      });

      // Apply borders
      sheet.eachRow({ includeEmpty: true }, function(row, rowNumber) {
        row.eachCell({ includeEmpty: true }, function(cell, colNumber) {
          if (rowNumber >= 2 && rowNumber <= rowIdx && colNumber <= totalCol) {
             cell.border = {
              top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'}
            };
          }
        });
      });
    });

    const summarySheet = workbook.addWorksheet('Summary');
    summarySheet.columns = [
      { header: 'Sub Department', key: 'dept', width: 25 },
      { header: 'Total Employees', key: 'total', width: 20 },
      { header: 'Employees Trained', key: 'trained', width: 20 },
      { header: 'Total Training Hours', key: 'hours', width: 25 },
    ];
    
    summarySheet.getRow(1).font = { bold: true };
    
    let totalAllHours = 0;
    summaryData.forEach(d => {
      summarySheet.addRow({ dept: d.dept, total: d.totalEmployees, trained: d.employeesTrained, hours: d.totalHours });
      totalAllHours += parseFloat(d.totalHours);
    });

    summarySheet.addRow({});
    const finalRow = summarySheet.addRow({
      dept: 'TOTAL (All Housekeeping)',
      total: summaryData.reduce((acc, cur) => acc + cur.totalEmployees, 0),
      trained: summaryData.reduce((acc, cur) => acc + cur.employeesTrained, 0),
      hours: totalAllHours.toFixed(1)
    });
    finalRow.font = { bold: true };

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=' + `OJT_Tracker_${monthName}_${y}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();

  } catch (err) {
    console.error('Error generating Excel:', err);
    res.status(500).json({ error: 'Failed to generate Excel report', details: err.message, stack: err.stack });
  }
});

module.exports = router;
