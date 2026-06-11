const fs = require('fs');
const filePath = 'frontend/src/pages/Schedule.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// Remove the unclosed div
content = content.replace('<div className="calendar-section">', '');

// Wait, the style tag I injected looks like:
// <style>{`
//   @media print {
//     .print-calendar-only .print\\:hidden, .print-calendar-only .detailed-list-section { display: none !important; }

content = content.replace('.print-calendar-only .detailed-list-section { display: none !important; }', '.print-calendar-only .mt-12 { display: none !important; }');
content = content.replace('.print-list-only .calendar-section { display: none !important; }', '.print-list-only .mb-8, .print-list-only .grid-cols-7 { display: none !important; }');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed unclosed div and updated print css.');
