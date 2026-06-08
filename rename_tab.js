const fs = require('fs');
let settings = fs.readFileSync('frontend/src/pages/Settings.jsx', 'utf8');
settings = settings.replace(/General Preferences/g, 'Audit Report');
settings = settings.replace(/'general'/g, "'general'"); // keep the id as general
fs.writeFileSync('frontend/src/pages/Settings.jsx', settings, 'utf8');
console.log('Successfully changed tab name to Audit Report');
