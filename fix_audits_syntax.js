const fs = require('fs');

// Fix Audits.jsx
let audits = fs.readFileSync('frontend/src/pages/Audits.jsx', 'utf8');
audits = audits.replace(" , PenTool, Trash2 }", " }");
fs.writeFileSync('frontend/src/pages/Audits.jsx', audits, 'utf8');

console.log('Fixed Audits syntax');
