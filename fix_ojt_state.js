const fs = require('fs');

let ojt = fs.readFileSync('frontend/src/pages/OJT.jsx', 'utf8');

if (!ojt.includes('const [editingRecord')) {
  ojt = ojt.replace(
    "const [employees, setEmployees] = useState([]);",
    "const [employees, setEmployees] = useState([]);\n  const [editingRecord, setEditingRecord] = useState(null);\n  const [savingEdit, setSavingEdit] = useState(false);"
  );
  
  // also fix fetchRecords call inside edit/delete handlers if it was supposed to fetch records
  ojt = ojt.replace(/fetchRecords\(\);/g, "fetchRecords();");

  fs.writeFileSync('frontend/src/pages/OJT.jsx', ojt, 'utf8');
  console.log('Fixed OJT state variables');
} else {
  console.log('editingRecord already exists');
}
