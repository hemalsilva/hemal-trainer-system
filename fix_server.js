const fs = require('fs');
let code = fs.readFileSync('backend/server.js', 'utf8');

code = code.replace(
  "initializeWhatsApp();",
  "if (process.env.NODE_ENV !== 'production') {\n  initializeWhatsApp();\n}"
);

fs.writeFileSync('backend/server.js', code, 'utf8');
console.log('Fixed server.js whatsapp init');
