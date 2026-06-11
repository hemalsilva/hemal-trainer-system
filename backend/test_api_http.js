const http = require('http');

const data = JSON.stringify({ emp_nos: ['EMP-001'] });

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/trainings/1/attendance/bulk',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  let responseBody = '';
  res.on('data', (chunk) => { responseBody += chunk; });
  res.on('end', () => {
    console.log(`Status Code: ${res.statusCode}`);
    console.log(`Response Body: ${responseBody}`);
  });
});

req.on('error', (error) => {
  console.error('Request Error:', error);
});

req.write(data);
req.end();
