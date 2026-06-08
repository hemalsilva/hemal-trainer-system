const fs = require('fs');

let audits = fs.readFileSync('frontend/src/pages/Audits.jsx', 'utf8');

// 1. Change fetchAudits definition
audits = audits.replace(
  "const fetchAudits = async () => {",
  "const fetchAudits = async (isBackground = false) => {"
);

// 2. Change setLoading(true)
audits = audits.replace(
  "setLoading(true);",
  "if (!isBackground) setLoading(true);"
);

// 3. Change setLoading(false)
audits = audits.replace(
  "setLoading(false);",
  "if (!isBackground) setLoading(false);"
);

// 4. Change setInterval
audits = audits.replace(
  "const interval = setInterval(fetchAudits, 5000);",
  "const interval = setInterval(() => fetchAudits(true), 5000);"
);

fs.writeFileSync('frontend/src/pages/Audits.jsx', audits, 'utf8');
console.log('Fixed Audits live sync flickering');
