const fs = require('fs');
let dashCode = fs.readFileSync('frontend/src/pages/Dashboard.jsx', 'utf8');

dashCode = dashCode.replace(
  "return monthIndex === selectedMonth;\n  });\n  const upcomingAnniversaries = employees.filter(emp => {",
  "return monthIndex === selectedMonth;\n  }).sort((a, b) => new Date(a.date_of_birth).getDate() - new Date(b.date_of_birth).getDate());\n  const upcomingAnniversaries = employees.filter(emp => {"
);

dashCode = dashCode.replace(
  "return monthIndex === selectedMonth;\n  });\n\n  \n  const monthNames =",
  "return monthIndex === selectedMonth;\n  }).sort((a, b) => new Date(a.join_date).getDate() - new Date(b.join_date).getDate());\n\n  \n  const monthNames ="
);

fs.writeFileSync('frontend/src/pages/Dashboard.jsx', dashCode, 'utf8');
