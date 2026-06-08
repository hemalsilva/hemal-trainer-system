const fs = require('fs');

// Fix OJT.jsx
let ojt = fs.readFileSync('frontend/src/pages/OJT.jsx', 'utf8');
ojt = ojt.replace("} , Trash2, X }", ", Trash2, X }");
ojt = ojt.replace("PenTool, Trash2, X } from", "PenTool, Trash2, X } from");
ojt = ojt.replace("PenTool } , Trash2", "PenTool, Trash2");
fs.writeFileSync('frontend/src/pages/OJT.jsx', ojt, 'utf8');

// Fix TrainingAttendance.jsx
let att = fs.readFileSync('frontend/src/pages/TrainingAttendance.jsx', 'utf8');
att = att.replace("} , Plus }", ", Plus }");
fs.writeFileSync('frontend/src/pages/TrainingAttendance.jsx', att, 'utf8');

console.log('Fixed syntax errors');
