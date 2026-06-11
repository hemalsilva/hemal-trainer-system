const axios = require('axios');

async function test() {
  try {
    const res = await axios.post('http://localhost:5000/api/trainings/1/attendance/bulk', { emp_nos: ['EMP-001'] });
    console.log(res.data);
  } catch (err) {
    console.error('Error:', err.response ? err.response.data : err.message);
  }
}
test();
