const fs = require('fs');
const filePath = 'frontend/src/pages/TrainingAttendance.jsx';
let content = fs.readFileSync(filePath, 'utf8');

const oldErr = `      console.error(err);
      showMessage('Error saving manual attendance', 'error');
    }
    setSavingManual(false);`;

const newErr = `      console.error(err);
      const errMsg = err.response?.data?.error || err.message || 'Unknown error';
      showMessage('Error: ' + errMsg, 'error');
    }
    setSavingManual(false);`;

content = content.replace(oldErr, newErr);
fs.writeFileSync(filePath, content, 'utf8');
console.log('Updated TrainingAttendance.jsx error message logging.');
