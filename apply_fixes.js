// 1. OJT.jsx Edit Modal and handlers
const fs = require('fs');
let ojt = fs.readFileSync('frontend/src/pages/OJT.jsx', 'utf8');

// Add icons
if (!ojt.includes("Trash2")) {
  ojt = ojt.replace("from 'lucide-react';", ", Trash2, X } from 'lucide-react';".replace("} ,", ","));
  ojt = ojt.replace("PenTool}", "PenTool, Trash2, X");
}

if (!ojt.includes("const [editingRecord, setEditingRecord] = useState(null);")) {
  ojt = ojt.replace(
    "const [records, setRecords] = useState([]);",
    "const [records, setRecords] = useState([]);\n  const [editingRecord, setEditingRecord] = useState(null);\n  const [savingEdit, setSavingEdit] = useState(false);"
  );

  const editDeleteHandlers = `
  const handleDeleteRecord = async (id) => {
    if (!window.confirm('Are you sure you want to delete this OJT record?')) return;
    try {
      await axios.delete(\`/api/ojt/\${id}\`);
      fetchRecords();
    } catch (err) {
      console.error(err);
      alert('Error deleting OJT record');
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setSavingEdit(true);
    try {
      await axios.put(\`/api/ojt/\${editingRecord.id}\`, editingRecord);
      setEditingRecord(null);
      fetchRecords();
    } catch (err) {
      console.error(err);
      alert('Error updating OJT record');
    }
    setSavingEdit(false);
  };
  `;
  ojt = ojt.replace("const handleSubmit = async (e) => {", editDeleteHandlers + "\n  const handleSubmit = async (e) => {");

  // Add Actions column header
  ojt = ojt.replace(
    "<th className=\"p-4 font-semibold text-center\">Verdict</th>",
    "<th className=\"p-4 font-semibold text-center\">Verdict</th>\n                  <th className=\"p-4 font-semibold text-center\">Actions</th>"
  );

  // Add Actions td
  const actionsTd = `
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => setEditingRecord({
                            ...record, 
                            assessment_date: new Date(record.assessment_date).toISOString().split('T')[0]
                          })} className="p-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors">
                            <PenTool className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDeleteRecord(record.id)} className="p-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
  `;
  ojt = ojt.replace(
    "</span>\n                        )}\n                      </td>\n                    </tr>",
    "</span>\n                        )}\n                      </td>\n" + actionsTd + "\n                    </tr>"
  );
  
  // Adjust colSpan for empty states
  ojt = ojt.replace(/colSpan="6"/g, "colSpan=\"7\"");

  // Read modal from file
  const editModal = fs.readFileSync('ojt_modal.txt', 'utf8');
  ojt = ojt.replace("    </div>\n  );\n}\n", editModal + "\n    </div>\n  );\n}\n");

  fs.writeFileSync('frontend/src/pages/OJT.jsx', ojt, 'utf8');
}


// 2. AUDITS interval
let auditsCode = fs.readFileSync('frontend/src/pages/Audits.jsx', 'utf8');
if (!auditsCode.includes('setInterval(fetchAudits, 5000)')) {
  auditsCode = auditsCode.replace(
    "fetchAudits();\n  }, [month, year]);",
    "fetchAudits();\n    const interval = setInterval(fetchAudits, 5000);\n    return () => clearInterval(interval);\n  }, [month, year]);"
  );
  fs.writeFileSync('frontend/src/pages/Audits.jsx', auditsCode, 'utf8');
}


// 3. ATTENDANCE add session modal
let attCode = fs.readFileSync('frontend/src/pages/TrainingAttendance.jsx', 'utf8');
if (!attCode.includes('const [showAddModal')) {
  if (!attCode.includes("Plus")) {
    attCode = attCode.replace("from 'lucide-react';", ", Plus } from 'lucide-react';".replace("} ,", ","));
  }

  attCode = attCode.replace(
    "const [trainings, setTrainings] = useState([]);",
    "const [trainings, setTrainings] = useState([]);\n  const [showAddModal, setShowAddModal] = useState(false);\n  const [formData, setFormData] = useState({ topic: '', category: 'Mandatory', venue: '', duration: 60, trainer: '', training_date: '', department: '' });"
  );

  const addSessionHandler = `
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        training_date: formData.training_date ? new Date(formData.training_date).toISOString() : null,
        venue: formData.venue || 'Main Room',
        trainer: formData.trainer || 'TBD',
        duration: formData.duration || 60,
      };
      await axios.post('/api/trainings', payload);
      setShowAddModal(false);
      setFormData({ topic: '', category: 'Mandatory', venue: '', duration: 60, trainer: '', training_date: '', department: '' });
      fetchTrainings();
      showMessage('Session scheduled successfully!', 'success');
    } catch (err) {
      alert('Error scheduling session: ' + (err?.response?.data?.error || err.message));
    }
  };
  `;
  attCode = attCode.replace("const fetchEmployees = async () => {", addSessionHandler + "\n  const fetchEmployees = async () => {");

  // Add the Plus button next to dropdowns
  const btnCode = `<button onClick={() => setShowAddModal(true)} className="bg-brand-primary text-black px-4 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-brand-primaryHover transition-colors mt-6 whitespace-nowrap"><Plus className="w-5 h-5"/> Add Session</button>`;
  attCode = attCode.replace(
    "</select>\n          </div>\n\n        </div>",
    "</select>\n          </div>\n          " + btnCode + "\n\n        </div>"
  );

  const attModal = fs.readFileSync('att_modal.txt', 'utf8');
  attCode = attCode.replace("    </div>\n  );\n}", attModal + "\n    </div>\n  );\n}");

  fs.writeFileSync('frontend/src/pages/TrainingAttendance.jsx', attCode, 'utf8');
}

console.log('Fixed OJT, Audits interval, and Attendance Add Session');
