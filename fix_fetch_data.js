const fs = require('fs');
let auditsCode = fs.readFileSync('frontend/src/pages/Audits.jsx', 'utf8');

auditsCode = auditsCode.replace(/fetchData\(\)/g, "fetchAudits()");

fs.writeFileSync('frontend/src/pages/Audits.jsx', auditsCode, 'utf8');

console.log('Fixed fetchData to fetchAudits');
