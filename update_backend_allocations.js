const fs = require('fs');
let backendPath = 'backend/routes/trainings.js';
let content = fs.readFileSync(backendPath, 'utf8');

// Add GET /api/trainings/allocations/all
const newRoute = `// Get all allocations across all trainings
router.get('/allocations/all', async (req, res) => {
  try {
    const result = await pool.query('SELECT a.emp_no, t.topic FROM training_allocations a JOIN trainings t ON a.training_id = t.id');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;`;

content = content.replace('module.exports = router;', newRoute);
fs.writeFileSync(backendPath, content, 'utf8');
console.log('Added /allocations/all route.');
