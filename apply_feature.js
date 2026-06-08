const fs = require('fs');

// 1. Update OJT.jsx to auto-fill employee name and dept
let ojtCode = fs.readFileSync('frontend/src/pages/OJT.jsx', 'utf8');

if (!ojtCode.includes("const [employees, setEmployees] = useState([]);")) {
  ojtCode = ojtCode.replace(
    "const [loading, setLoading] = useState(false);",
    "const [loading, setLoading] = useState(false);\n  const [employees, setEmployees] = useState([]);"
  );
  
  ojtCode = ojtCode.replace(
    "useEffect(() => {",
    "useEffect(() => {\n    axios.get('/api/employees').then(res => setEmployees(res.data)).catch(console.error);"
  );

  ojtCode = ojtCode.replace(
    "onChange={(e) => setEmpDetails({...empDetails, emp_no: e.target.value})}",
    `onChange={(e) => {
                      const val = e.target.value;
                      setEmpDetails({...empDetails, emp_no: val});
                      const emp = employees.find(em => em.emp_no === val);
                      if (emp) {
                        setEmpDetails(prev => ({...prev, emp_name: emp.full_name, department: emp.department || ''}));
                      }
                    }}`
  );
  fs.writeFileSync('frontend/src/pages/OJT.jsx', ojtCode, 'utf8');
}

// 2. Update Feedback.jsx if needed
let feedbackCode = fs.readFileSync('frontend/src/pages/Feedback.jsx', 'utf8');
if (feedbackCode.includes("emp_no: e.target.value") && !feedbackCode.includes("const emp = employees.find")) {
  if (!feedbackCode.includes("const [employees, setEmployees] = useState([]);")) {
    feedbackCode = feedbackCode.replace(
      "const [loading, setLoading] = useState(false);",
      "const [loading, setLoading] = useState(false);\n  const [employees, setEmployees] = useState([]);"
    );
    feedbackCode = feedbackCode.replace(
      "useEffect(() => {",
      "useEffect(() => {\n    axios.get('/api/employees').then(res => setEmployees(res.data)).catch(console.error);"
    );
  }
  
  feedbackCode = feedbackCode.replace(
    "onChange={(e) => setNewFeedback({...newFeedback, emp_no: e.target.value})}",
    `onChange={(e) => {
                      const val = e.target.value;
                      setNewFeedback({...newFeedback, emp_no: val});
                      const emp = employees.find(em => em.emp_no === val);
                      if (emp) {
                        setNewFeedback(prev => ({...prev, emp_name: emp.full_name}));
                      }
                    }}`
  );
  fs.writeFileSync('frontend/src/pages/Feedback.jsx', feedbackCode, 'utf8');
}


// 3. Update TrainingAttendance.jsx
let attCode = fs.readFileSync('frontend/src/pages/TrainingAttendance.jsx', 'utf8');

if (!attCode.includes("const [manualRows, setManualRows] = useState")) {
  // Add employees state
  attCode = attCode.replace(
    "const [message, setMessage] = useState('');",
    "const [message, setMessage] = useState('');\n  const [employees, setEmployees] = useState([]);\n  const [manualRows, setManualRows] = useState([{ emp_no: '', emp_name: '' }]);\n  const [savingManual, setSavingManual] = useState(false);\n  const rowRefs = useRef([]);"
  );

  attCode = attCode.replace(
    "fetchTrainings();",
    "fetchTrainings();\n    fetchEmployees();"
  );
  
  const fetchCode = `
  const fetchEmployees = async () => {
    try {
      const res = await axios.get('/api/employees');
      setEmployees(res.data);
    } catch (err) {
      console.error(err);
    }
  };
  `;
  attCode = attCode.replace("const fetchTrainings = async () => {", fetchCode + "\n  const fetchTrainings = async () => {");

  // Add the manual functions
  const manualFunctions = `
  const handleManualRowChange = (index, field, value) => {
    const newRows = [...manualRows];
    newRows[index][field] = value;
    
    if (field === 'emp_no') {
      const emp = employees.find(e => e.emp_no === value);
      if (emp) {
        newRows[index].emp_name = emp.full_name;
      }
    }
    setManualRows(newRows);
  };

  const handleManualKeyDown = (e, index) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // Auto add new row on Enter up to 50
      if (index === manualRows.length - 1 && manualRows.length < 50) {
        setManualRows([...manualRows, { emp_no: '', emp_name: '' }]);
        setTimeout(() => {
          if (rowRefs.current[index + 1]) rowRefs.current[index + 1].focus();
        }, 50);
      } else if (index < manualRows.length - 1) {
        if (rowRefs.current[index + 1]) rowRefs.current[index + 1].focus();
      }
    }
  };

  const handleSaveManual = async () => {
    if (!selectedTrainingId) return showMessage('Please select a training session first', 'error');
    const validRows = manualRows.filter(r => r.emp_no);
    if (validRows.length === 0) return showMessage('No valid employee records to save', 'error');

    setSavingManual(true);
    try {
      const emp_nos = validRows.map(r => r.emp_no);
      const res = await axios.post(\`/api/trainings/\${selectedTrainingId}/attendance/bulk\`, { emp_nos });
      showMessage(\`Successfully marked \${res.data.added} employees as attended!\`, 'success');
      fetchAttendanceSummary();
      setManualRows([{ emp_no: '', emp_name: '' }]);
      if (rowRefs.current[0]) rowRefs.current[0].focus();
    } catch (err) {
      console.error(err);
      showMessage('Error saving manual attendance', 'error');
    }
    setSavingManual(false);
  };
  `;
  
  attCode = attCode.replace("const saveGoogleFormLink = async () => {", manualFunctions + "\n  const saveGoogleFormLink = async () => {");

  // Inject UI right below "Select Training Session" grid
  const uiSection = `
      {selectedTrainingId && (
        <div className="bg-brand-card p-6 rounded-2xl border border-gray-800 shadow-xl mb-8 animate-in fade-in slide-in-from-bottom-4">
          <h3 className="text-xl font-bold text-blue-200 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-brand-primary" />
            Fast Manual Entry (Bulk Update)
          </h3>
          <p className="text-sm text-gray-400 mb-4">
            Type Employee No and press Enter to quickly add multiple employees. Up to 50 at once.
          </p>
          
          <div className="space-y-3 mb-6 max-h-[400px] overflow-y-auto pr-2">
            {manualRows.map((row, idx) => (
              <div key={idx} className="flex items-center gap-4 animate-in fade-in slide-in-from-left-4">
                <span className="text-gray-500 font-mono w-6 text-right">{idx + 1}.</span>
                <input 
                  type="text"
                  placeholder="Employee No (e.g. 8000123)"
                  value={row.emp_no}
                  onChange={(e) => handleManualRowChange(idx, 'emp_no', e.target.value)}
                  onKeyDown={(e) => handleManualKeyDown(e, idx)}
                  ref={el => rowRefs.current[idx] = el}
                  className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-blue-200 focus:border-brand-primary outline-none max-w-[250px]"
                />
                <input 
                  type="text"
                  placeholder="Name (Auto-filled)"
                  value={row.emp_name}
                  readOnly
                  className="flex-1 bg-gray-900/50 border border-gray-800 rounded-lg px-4 py-2 text-gray-400 outline-none max-w-[300px] cursor-not-allowed"
                />
              </div>
            ))}
          </div>
          
          <button 
            onClick={handleSaveManual}
            disabled={savingManual || manualRows.filter(r=>r.emp_no).length === 0}
            className="bg-brand-primary hover:bg-brand-primaryHover text-black px-8 py-3 rounded-xl font-bold transition-transform hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 shadow-[0_4px_14px_0_rgba(212,175,55,0.39)] flex items-center gap-2"
          >
            <CheckCircle className="w-5 h-5" />
            {savingManual ? 'Saving...' : \`Save \${manualRows.filter(r=>r.emp_no).length} Records\`}
          </button>
        </div>
      )}
  `;

  // We want to inject it before "Action Tools"
  attCode = attCode.replace("{/* Action Tools */}", uiSection + "\n          {/* Action Tools */}");

  fs.writeFileSync('frontend/src/pages/TrainingAttendance.jsx', attCode, 'utf8');
}

console.log("Done updates");
