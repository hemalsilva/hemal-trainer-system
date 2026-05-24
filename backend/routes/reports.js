const express = require('express');
const router = express.Router();
const pool = require('../config/db');

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

module.exports = router;
