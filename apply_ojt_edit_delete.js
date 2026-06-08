const fs = require('fs');

// 1. BACKEND UPDATE
let ojtRoute = fs.readFileSync('backend/routes/ojt.js', 'utf8');

ojtRoute = ojtRoute.replace(
  "VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)",
  "VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)"
);

if (!ojtRoute.includes("router.put('/:id'")) {
  const updateCode = `
// PUT /api/ojt/:id
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const {
    emp_no, emp_name, department, assessment_date, topic,
    trainer_name, location, assessment_notes, rating, pass_fail, completion_status, duration_minutes
  } = req.body;

  try {
    const result = await pool.query(
      \`UPDATE ojt_records 
       SET emp_no=$1, emp_name=$2, department=$3, assessment_date=$4, topic=$5, 
           trainer_name=$6, location=$7, assessment_notes=$8, rating=$9, pass_fail=$10, completion_status=$11, duration_minutes=$12
       WHERE id = $13 RETURNING *\`,
      [emp_no, emp_name, department, assessment_date, topic, trainer_name, location, assessment_notes, rating, pass_fail, completion_status, duration_minutes || 60, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Record not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating OJT:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/ojt/:id
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM ojt_records WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Record not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    console.error('Error deleting OJT:', err);
    res.status(500).json({ error: err.message });
  }
});
`;
  ojtRoute = ojtRoute.replace("module.exports = router;", updateCode + "\nmodule.exports = router;");
  fs.writeFileSync('backend/routes/ojt.js', ojtRoute, 'utf8');
}


// 2. FRONTEND UPDATE
let ojtCode = fs.readFileSync('frontend/src/pages/OJT.jsx', 'utf8');

// Add icons
if (!ojtCode.includes("Trash2")) {
  ojtCode = ojtCode.replace("from 'lucide-react';", ", Trash2, X } from 'lucide-react';".replace("} ,", ","));
  ojtCode = ojtCode.replace("PenTool}", "PenTool, Trash2, X");
}

if (!ojtCode.includes("const [editingRecord, setEditingRecord] = useState(null);")) {
  ojtCode = ojtCode.replace(
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
  ojtCode = ojtCode.replace("const handleSubmit = async (e) => {", editDeleteHandlers + "\n  const handleSubmit = async (e) => {");

  // Add Actions column header
  ojtCode = ojtCode.replace(
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
  ojtCode = ojtCode.replace(
    "</span>\n                        )}\n                      </td>\n                    </tr>",
    "</span>\n                        )}\n                      </td>\n" + actionsTd + "\n                    </tr>"
  );
  
  // Adjust colSpan for empty states
  ojtCode = ojtCode.replace(/colSpan="6"/g, "colSpan=\"7\"");

  // Add Edit Modal at the end
  const editModal = `
      {editingRecord && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
          <div className="bg-brand-card border border-gray-800 rounded-2xl w-full max-w-lg p-6 relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-blue-200 flex items-center gap-2">
                <PenTool className="w-6 h-6 text-brand-primary" /> Edit OJT Record
              </h2>
              <button onClick={() => setEditingRecord(null)} className="text-gray-400 hover:text-blue-200"><X className="w-6 h-6" /></button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Employee No *</label>
                  <input 
                    type="text" required
                    value={editingRecord.emp_no}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditingRecord({...editingRecord, emp_no: val});
                      const emp = employees.find(em => em.emp_no === val);
                      if (emp) {
                        setEditingRecord(prev => ({...prev, emp_name: emp.full_name, emp_no: emp.emp_no, department: emp.department || 'General'}));
                      }
                    }}
                    className="w-full bg-[#1a1a1a] border border-gray-700 rounded-xl p-3 text-blue-200 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Employee Name *</label>
                  <input 
                    type="text" required list="edit-employee-options"
                    value={editingRecord.emp_name}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditingRecord({...editingRecord, emp_name: val});
                      const emp = employees.find(em => em.full_name === val);
                      if (emp) {
                        setEditingRecord(prev => ({...prev, emp_no: emp.emp_no, emp_name: emp.full_name, department: emp.department || 'General'}));
                      }
                    }}
                    className="w-full bg-[#1a1a1a] border border-gray-700 rounded-xl p-3 text-blue-200 outline-none"
                  />
                  <datalist id="edit-employee-options">
                    {employees.map(emp => <option key={emp.emp_no} value={emp.full_name} />)}
                  </datalist>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Topic *</label>
                <input 
                  type="text" required value={editingRecord.topic}
                  onChange={(e) => setEditingRecord({...editingRecord, topic: e.target.value})}
                  className="w-full bg-[#1a1a1a] border border-gray-700 rounded-xl p-3 text-blue-200 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Trainer *</label>
                  <input 
                    type="text" required value={editingRecord.trainer_name}
                    onChange={(e) => setEditingRecord({...editingRecord, trainer_name: e.target.value})}
                    className="w-full bg-[#1a1a1a] border border-gray-700 rounded-xl p-3 text-blue-200 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Date *</label>
                  <input 
                    type="date" required value={editingRecord.assessment_date}
                    onChange={(e) => setEditingRecord({...editingRecord, assessment_date: e.target.value})}
                    className="w-full bg-[#1a1a1a] border border-gray-700 rounded-xl p-3 text-blue-200 outline-none [color-scheme:dark]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Rating (out of 5) *</label>
                  <input 
                    type="number" min="0" max="5" required value={editingRecord.rating}
                    onChange={(e) => setEditingRecord({...editingRecord, rating: e.target.value})}
                    className="w-full bg-[#1a1a1a] border border-gray-700 rounded-xl p-3 text-blue-200 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Verdict</label>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setEditingRecord({...editingRecord, pass_fail: true})} className={`flex-1 py-3 rounded-xl border ${editingRecord.pass_fail === true ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'border-gray-700 text-gray-400'} flex items-center justify-center gap-2 font-bold`}>Pass</button>
                    <button type="button" onClick={() => setEditingRecord({...editingRecord, pass_fail: false})} className={`flex-1 py-3 rounded-xl border ${editingRecord.pass_fail === false ? 'bg-red-500/20 border-red-500 text-red-400' : 'border-gray-700 text-gray-400'} flex items-center justify-center gap-2 font-bold`}>Fail</button>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setEditingRecord(null)} className="flex-1 px-4 py-3 border border-gray-700 rounded-xl text-gray-400 font-bold hover:text-blue-200 transition-colors">Cancel</button>
                <button type="submit" disabled={savingEdit} className="flex-1 bg-brand-primary hover:bg-brand-primaryHover text-black rounded-xl font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  {savingEdit ? 'Updating...' : 'Update Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
  `;

  ojtCode = ojtCode.replace("    </div>\n  );\n}\n", editModal + "    </div>\n  );\n}\n");

  fs.writeFileSync('frontend/src/pages/OJT.jsx', ojtCode, 'utf8');
}

console.log('Applied Edit/Delete for OJT');
