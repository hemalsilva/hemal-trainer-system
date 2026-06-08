const fs = require('fs');

// 1. BACKEND UPDATE
let auditsRoute = fs.readFileSync('backend/routes/audits.js', 'utf8');
if (!auditsRoute.includes("router.put('/:id'")) {
  const updateCode = `
// PUT /api/audits/:id
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { emp_no, emp_name, audit_type, score, audit_date, room_number } = req.body;
  try {
    const result = await pool.query(
      \`UPDATE room_audits 
       SET emp_no = $1, emp_name = $2, audit_type = $3, score = $4, audit_date = $5, room_number = $6 
       WHERE id = $7 RETURNING *\`,
      [emp_no, emp_name, audit_type, score, audit_date, room_number, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Audit not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating audit:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// DELETE /api/audits/:id
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM room_audits WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Audit not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    console.error('Error deleting audit:', err);
    res.status(500).json({ error: 'Database error' });
  }
});
`;
  auditsRoute = auditsRoute.replace("module.exports = router;", updateCode + "\nmodule.exports = router;");
  fs.writeFileSync('backend/routes/audits.js', auditsRoute, 'utf8');
}


// 2. FRONTEND UPDATE
let auditsCode = fs.readFileSync('frontend/src/pages/Audits.jsx', 'utf8');

// Add icons
if (!auditsCode.includes("Trash2")) {
  auditsCode = auditsCode.replace("from 'lucide-react';", ", PenTool, Trash2 } from 'lucide-react';".replace("} ,", ","));
  auditsCode = auditsCode.replace("Plus}", "Plus, PenTool, Trash2");
}

if (!auditsCode.includes("const [editingAudit, setEditingAudit] = useState(null);")) {
  auditsCode = auditsCode.replace(
    "const [showAddModal, setShowAddModal] = useState(false);",
    "const [showAddModal, setShowAddModal] = useState(false);\n  const [editingAudit, setEditingAudit] = useState(null);\n  const [savingEdit, setSavingEdit] = useState(false);"
  );

  const editDeleteHandlers = `
  const handleDeleteAudit = async (id) => {
    if (!window.confirm('Are you sure you want to delete this audit?')) return;
    try {
      await axios.delete(\`/api/audits/\${id}\`);
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Error deleting audit');
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setSavingEdit(true);
    try {
      await axios.put(\`/api/audits/\${editingAudit.id}\`, editingAudit);
      setEditingAudit(null);
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Error updating audit');
    }
    setSavingEdit(false);
  };
  `;
  auditsCode = auditsCode.replace("const handleAddAudit = async (e) => {", editDeleteHandlers + "\n  const handleAddAudit = async (e) => {");

  // Add Actions column header
  auditsCode = auditsCode.replace(
    "<th className=\"p-4 font-semibold text-right\">Score</th>",
    "<th className=\"p-4 font-semibold text-right\">Score</th>\n                    <th className=\"p-4 font-semibold text-center\">Actions</th>"
  );

  // Add Actions td
  const actionsTd = `
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button onClick={() => setEditingAudit({
                              ...audit, 
                              audit_date: new Date(audit.audit_date).toISOString().split('T')[0]
                            })} className="p-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors">
                              <PenTool className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDeleteAudit(audit.id)} className="p-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
  `;
  auditsCode = auditsCode.replace(
    "</div>\n                        </td>\n                      </tr>",
    "</div>\n                        </td>\n" + actionsTd + "\n                      </tr>"
  );
  
  // Adjust colSpan for empty state
  auditsCode = auditsCode.replace("colSpan=\"5\"", "colSpan=\"6\"");

  // Add Edit Modal at the end
  const editModal = `
      {editingAudit && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
          <div className="bg-brand-card border border-gray-800 rounded-2xl w-full max-w-lg p-6 relative">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-blue-200 flex items-center gap-2">
                <PenTool className="w-6 h-6 text-brand-primary" /> Edit Audit
              </h2>
              <button onClick={() => setEditingAudit(null)} className="text-gray-400 hover:text-blue-200"><X className="w-6 h-6" /></button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Employee No *</label>
                  <input 
                    type="text" required
                    value={editingAudit.emp_no}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditingAudit({...editingAudit, emp_no: val});
                      const emp = employees.find(em => em.emp_no === val);
                      if (emp) {
                        setEditingAudit(prev => ({...prev, emp_name: emp.full_name, emp_no: emp.emp_no}));
                      }
                    }}
                    className="w-full bg-[#1a1a1a] border border-gray-700 rounded-xl p-3 text-blue-200 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Employee Name *</label>
                  <input 
                    type="text" required list="edit-employee-options"
                    value={editingAudit.emp_name}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditingAudit({...editingAudit, emp_name: val});
                      const emp = employees.find(em => em.full_name === val);
                      if (emp) {
                        setEditingAudit(prev => ({...prev, emp_no: emp.emp_no, emp_name: emp.full_name}));
                      }
                    }}
                    className="w-full bg-[#1a1a1a] border border-gray-700 rounded-xl p-3 text-blue-200 outline-none"
                  />
                  <datalist id="edit-employee-options">
                    {employees.map(emp => <option key={emp.emp_no} value={emp.full_name} />)}
                  </datalist>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Audit Type *</label>
                  <select 
                    required value={editingAudit.audit_type}
                    onChange={(e) => setEditingAudit({...editingAudit, audit_type: e.target.value})}
                    className="w-full bg-[#1a1a1a] border border-gray-700 rounded-xl p-3 text-blue-200 outline-none"
                  >
                    {auditTypes.filter(t => t !== 'Team Leader').map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Date *</label>
                  <input 
                    type="date" required value={editingAudit.audit_date}
                    onChange={(e) => setEditingAudit({...editingAudit, audit_date: e.target.value})}
                    className="w-full bg-[#1a1a1a] border border-gray-700 rounded-xl p-3 text-blue-200 outline-none [color-scheme:dark]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Score (out of 100) *</label>
                  <input 
                    type="number" min="0" max="100" required value={editingAudit.score}
                    onChange={(e) => setEditingAudit({...editingAudit, score: e.target.value})}
                    className="w-full bg-[#1a1a1a] border border-gray-700 rounded-xl p-3 text-blue-200 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Room / Area No</label>
                  <input 
                    type="text" value={editingAudit.room_number || ''}
                    onChange={(e) => setEditingAudit({...editingAudit, room_number: e.target.value})}
                    className="w-full bg-[#1a1a1a] border border-gray-700 rounded-xl p-3 text-blue-200 outline-none"
                  />
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setEditingAudit(null)} className="flex-1 px-4 py-3 border border-gray-700 rounded-xl text-gray-400 font-bold hover:text-blue-200 transition-colors">Cancel</button>
                <button type="submit" disabled={savingEdit} className="flex-1 bg-brand-primary hover:bg-brand-primaryHover text-black rounded-xl font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  {savingEdit ? 'Updating...' : 'Update Audit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
  `;

  auditsCode = auditsCode.replace("    </div>\n  );\n}\n", editModal + "    </div>\n  );\n}\n");

  fs.writeFileSync('frontend/src/pages/Audits.jsx', auditsCode, 'utf8');
}

console.log('Applied Edit/Delete for Audits');
