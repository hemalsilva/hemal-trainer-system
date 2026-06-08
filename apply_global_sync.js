const fs = require('fs');

// --- OJT.JSX ---
let ojt = fs.readFileSync('frontend/src/pages/OJT.jsx', 'utf8');
ojt = ojt.replace(
  "const fetchRecords = async () => {",
  "const fetchRecords = async (isBackground = false) => {"
);
ojt = ojt.replace("setLoading(true);", "if (!isBackground) setLoading(true);");
ojt = ojt.replace("setLoading(false);", "if (!isBackground) setLoading(false);");
ojt = ojt.replace(
  "if (activeTab === 'view') {\n      fetchRecords();\n    }",
  "if (activeTab === 'view') {\n      fetchRecords();\n      const interval = setInterval(() => fetchRecords(true), 5000);\n      return () => clearInterval(interval);\n    }"
);
fs.writeFileSync('frontend/src/pages/OJT.jsx', ojt, 'utf8');

// --- SCHEDULE.JSX ---
let sched = fs.readFileSync('frontend/src/pages/Schedule.jsx', 'utf8');
sched = sched.replace(
  "useEffect(() => { fetchSchedules(); fetchTrainerDaysOff(); }, []);",
  "useEffect(() => { fetchSchedules(); fetchTrainerDaysOff(); const interval = setInterval(() => { fetchSchedules(); fetchTrainerDaysOff(); }, 5000); return () => clearInterval(interval); }, []);"
);
fs.writeFileSync('frontend/src/pages/Schedule.jsx', sched, 'utf8');

// --- TRAININGATTENDANCE.JSX ---
let ta = fs.readFileSync('frontend/src/pages/TrainingAttendance.jsx', 'utf8');
ta = ta.replace(
  "useEffect(() => {\n    fetchTrainings();\n    fetchEmployees();\n  }, []);",
  "useEffect(() => {\n    fetchTrainings();\n    fetchEmployees();\n    const interval = setInterval(() => {\n      axios.get('/api/trainings').then(res => setTrainings(res.data)).catch(console.error);\n      axios.get('/api/employees').then(res => setEmployees(res.data)).catch(console.error);\n    }, 5000);\n    return () => clearInterval(interval);\n  }, []);"
);

// We need to carefully replace fetchAttendanceSummary if it exists
ta = ta.replace(
  "const fetchAttendanceSummary = async () => {",
  "const fetchAttendanceSummary = async (isBackground = false) => {"
);
ta = ta.replace("setLoading(true);", "if (!isBackground) setLoading(true);");
ta = ta.replace("setLoading(false);", "if (!isBackground) setLoading(false);");
ta = ta.replace(
  "showMessage('Error fetching attendance summary', 'error');",
  "if (!isBackground) showMessage('Error fetching attendance summary', 'error');"
);
ta = ta.replace(
  "if (selectedTrainingId) {\n      fetchAttendanceSummary();",
  "if (selectedTrainingId) {\n      fetchAttendanceSummary();\n      const interval = setInterval(() => fetchAttendanceSummary(true), 5000);\n      window.__taInterval = interval;"
);
ta = ta.replace(
  "setGoogleFormLink('');\n    }",
  "setGoogleFormLink('');\n    }\n    return () => { if (window.__taInterval) clearInterval(window.__taInterval); };"
);

fs.writeFileSync('frontend/src/pages/TrainingAttendance.jsx', ta, 'utf8');
console.log('Global Live Sync applied');
