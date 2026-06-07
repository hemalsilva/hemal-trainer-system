const fs = require('fs');
let code = fs.readFileSync('frontend/src/main.jsx', 'utf8');
code = code.replace(
  "if (window.location.protocol === 'file:') {\n  axios.defaults.baseURL = 'http://localhost:5000';\n}",
  "if (window.location.protocol === 'file:' || window.location.hostname === 'localhost') {\n  axios.defaults.baseURL = 'http://localhost:5000';\n} else {\n  axios.defaults.baseURL = 'https://hemal-trainer-backend.onrender.com';\n}"
);
fs.writeFileSync('frontend/src/main.jsx', code, 'utf8');
console.log('Fixed main.jsx');
