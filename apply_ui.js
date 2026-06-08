const fs = require('fs');

// 1. Fix missing 'General' in DEPARTMENTS globally
const filesToUpdate = [
  'frontend/src/pages/Audits.jsx',
  'frontend/src/pages/Employees.jsx',
  'frontend/src/pages/Feedback.jsx',
  'frontend/src/pages/OJT.jsx',
  'frontend/src/pages/QuizResults.jsx',
  'frontend/src/pages/Schedule.jsx',
  'frontend/src/pages/Settings.jsx',
  'frontend/src/pages/TrainingAttendance.jsx'
];

filesToUpdate.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    // For arrays
    content = content.replace(/'Cinnamon Hotel Academy'(?!,\s*'General')/g, "'Cinnamon Hotel Academy', 'General'");
    // For JSX options
    content = content.replace(
      /<option value="Cinnamon Hotel Academy">Cinnamon Hotel Academy<\/option>(?!\s*<option value="General">)/g,
      '<option value="Cinnamon Hotel Academy">Cinnamon Hotel Academy</option>\n            <option value="General">General</option>'
    );
    fs.writeFileSync(file, content, 'utf8');
  }
});

// 2. Add Position Filter to Employees.jsx
let empCode = fs.readFileSync('frontend/src/pages/Employees.jsx', 'utf8');
if (!empCode.includes("const [selectedPosition")) {
  empCode = empCode.replace("const [selectedDept, setSelectedDept] = useState('All');", 
    "const [selectedDept, setSelectedDept] = useState('All');\n  const [selectedPosition, setSelectedPosition] = useState('All');");
  
  const uniquePosCode = `
  const uniquePositions = [...new Set(employees.map(e => e.designation).filter(Boolean))].sort();
  `;
  empCode = empCode.replace("const handleEdit = (emp) => {", uniquePosCode + "\n  const handleEdit = (emp) => {");

  const matchesPosCode = `
                    const matchesDept = selectedDept === 'All' || deptVal === selectedDept;
                    const matchesPos = selectedPosition === 'All' || emp.designation === selectedPosition;
                    return matchesSearch && matchesDept && matchesPos;`;
  empCode = empCode.replace("const matchesDept = selectedDept === 'All' || deptVal === selectedDept;\n                    return matchesSearch && matchesDept;", matchesPosCode);

  const deptSelect = `<option value="Cinnamon Hotel Academy">Cinnamon Hotel Academy</option>
            <option value="General">General</option>
            </select>`;
  const posSelect = deptSelect + `
          
          <select 
            value={selectedPosition}
            onChange={(e) => setSelectedPosition(e.target.value)}
            className="bg-brand-card border border-gray-800 rounded-lg text-blue-200 px-4 py-2 focus:outline-none focus:border-brand-primary"
          >
            <option value="All">All Positions</option>
            {uniquePositions.map(pos => <option key={pos} value={pos}>{pos}</option>)}
          </select>`;
  empCode = empCode.replace(deptSelect, posSelect);
  fs.writeFileSync('frontend/src/pages/Employees.jsx', empCode, 'utf8');
}

// 3. Add to Dashboard: Department wise Staff Count and total. Active training and OJT by departments.
let dashCode = fs.readFileSync('frontend/src/pages/Dashboard.jsx', 'utf8');
if (!dashCode.includes("const deptStaffCountMap")) {
  const processCode = `
  const deptHoursMap = {};
  const housekeepingHoursMap = {};
  const deptStaffCountMap = {};
  const deptActiveTrainingMap = {};
  const deptOjtMap = {};

  employees.forEach(emp => {
    // ... calculate existing ...
    const total = Number(emp.total_training_hours) || 0;
    const ojt = Number(emp.ojt_hours) || 0;
    const standard = Number(emp.standard_training_hours) || 0;
    
    totalHours += total;
    ojtTotalHours += ojt;
    standardTotalHours += standard;
    
    const dept = emp.department || 'Other';
    deptHoursMap[dept] = (deptHoursMap[dept] || 0) + total;
    deptStaffCountMap[dept] = (deptStaffCountMap[dept] || 0) + 1;

    if (dept === 'Rooms' || dept === 'Housekeeping') {
      const desig = emp.designation || 'Staff';
      housekeepingHoursMap[desig] = (housekeepingHoursMap[desig] || 0) + total;
    }
  });

  // Calculate active trainings by dept
  activeTrainings.forEach(t => {
    const d = t.department || 'Other';
    deptActiveTrainingMap[d] = (deptActiveTrainingMap[d] || 0) + 1;
  });

  // Calculate OJT by dept
  ojtRecords.forEach(r => {
    const d = r.department || 'Other';
    deptOjtMap[d] = (deptOjtMap[d] || 0) + 1;
  });

  const departmentData = Object.keys(deptStaffCountMap).map(key => ({
    name: key,
    hours: deptHoursMap[key] || 0,
    staffCount: deptStaffCountMap[key],
    activeTrainings: deptActiveTrainingMap[key] || 0,
    ojtCount: deptOjtMap[key] || 0
  })).sort((a,b) => b.staffCount - a.staffCount);
`;
  
  // Replace the old map loop
  dashCode = dashCode.replace(/const deptHoursMap = {};\s+const housekeepingHoursMap = {};\s+employees\.forEach\(emp => {[\s\S]*?\}\)\.filter\(d => d\.hours > 0\);/m, processCode);
  
  // Add the UI cards for Department wise stats
  const uiCards = `
        {/* Department Stats */}
        <section className="bg-brand-card rounded-2xl p-6 border border-gray-800">
          <h3 className="text-xl font-bold text-blue-200 mb-6 flex items-center gap-2"><Briefcase className="w-5 h-5 text-brand-primary" /> Department Overview</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-[#181818] border-b border-gray-800 text-xs uppercase tracking-wider text-gray-400 font-semibold">
                  <th className="p-4 rounded-tl-lg">Department</th>
                  <th className="p-4 text-center">Staff Count</th>
                  <th className="p-4 text-center">Active Trainings (This Month)</th>
                  <th className="p-4 text-center">OJT Records</th>
                  <th className="p-4 text-center rounded-tr-lg">Total Training Hours</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50 text-sm">
                {departmentData.map((d, idx) => (
                  <tr key={d.name} className="hover:bg-gray-800/50 transition-colors">
                    <td className="p-4 font-semibold text-blue-200">{d.name}</td>
                    <td className="p-4 text-center text-gray-300 font-mono">{d.staffCount}</td>
                    <td className="p-4 text-center text-gray-300 font-mono">{d.activeTrainings}</td>
                    <td className="p-4 text-center text-gray-300 font-mono">{d.ojtCount}</td>
                    <td className="p-4 text-center text-brand-primary font-mono">{d.hours.toFixed(1)}h</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
`;

  dashCode = dashCode.replace("{/* Birthday & Anniversary Summary */}", uiCards + "\n\n        {/* Birthday & Anniversary Summary */}");
  
  fs.writeFileSync('frontend/src/pages/Dashboard.jsx', dashCode, 'utf8');
}

console.log("Applied UI updates");
