const fs = require('fs');

let reports = fs.readFileSync('frontend/src/pages/Reports.jsx', 'utf8');

// Update fetchEmployees useEffect
const employeesEffectOld = `  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await axios.get('/api/employees');
        setEmployees(res.data);
      } catch (err) {
        console.error('Failed to fetch employees for birthdays:', err);
      }
    };
    fetchEmployees();
  }, []);`;

const employeesEffectNew = `  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await axios.get('/api/employees');
        setEmployees(res.data);
      } catch (err) {
        console.error('Failed to fetch employees for birthdays:', err);
      }
    };
    fetchEmployees();
    const interval = setInterval(fetchEmployees, 5000);
    return () => clearInterval(interval);
  }, []);`;

reports = reports.replace(employeesEffectOld, employeesEffectNew);

// Update fetchAnalytics
const analyticsEffectOld = `  useEffect(() => {
    fetchAnalytics();
  }, []);`;

const analyticsEffectNew = `  useEffect(() => {
    fetchAnalytics();
    
    // Live update interval for analytics
    const interval = setInterval(() => {
      const params = {};
      if (dateRange.start) params.start = dateRange.start;
      if (dateRange.end) params.end = dateRange.end;
      if (selectedDepartment) params.department = selectedDepartment;

      axios.get('/api/reports/analytics', { params })
        .then(res => {
          const data = res.data;
          setMonthlyData(data.monthlyData || []);
          setDeptData(data.deptData || []);
          setAbsentData(data.absentData || []);
          setMissingTopicsData(data.missingTopicsData || []);
          setLowPerformanceOJT(data.lowPerformanceOJT || []);
          setOjtDetails(data.ojtDetails || []);
          setPrintDataSOP(data.printDataSOP || []);
          setPrintDataOJT(data.printDataOJT || []);
          setPrintDataHR(data.printDataHR || []);
          setPrintDataHours(data.printDataHours || []);
        })
        .catch(err => console.error('Background sync failed:', err));
    }, 5000);
    
    return () => clearInterval(interval);
  }, [dateRange.start, dateRange.end, selectedDepartment]);`;

reports = reports.replace(analyticsEffectOld, analyticsEffectNew);

fs.writeFileSync('frontend/src/pages/Reports.jsx', reports, 'utf8');
console.log('Added live updates to Reports');
