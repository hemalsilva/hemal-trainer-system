const fs = require('fs');
const filePath = 'frontend/src/pages/TrainingAttendance.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add duration to initial state
content = content.replace(
  "topic: '', category: 'Mandatory', venue: '', trainer: '', training_date: '', google_form_link: '', department: ''",
  "topic: '', category: 'Mandatory', venue: '', duration: 60, trainer: '', training_date: '', google_form_link: '', department: ''"
);

// 2. Add duration to handleAddSubmit (already there?)
// Wait, I need to check what handleAddSubmit looks like!
