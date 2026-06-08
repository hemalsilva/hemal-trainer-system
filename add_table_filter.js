const fs = require('fs');

let audits = fs.readFileSync('frontend/src/pages/Audits.jsx', 'utf8');

if (!audits.includes('tableFilterType')) {
  // Add state
  audits = audits.replace(
    "const [selectedType, setSelectedType] = useState(null);",
    "const [selectedType, setSelectedType] = useState(null);\n  const [tableFilterType, setTableFilterType] = useState('All');"
  );

  // Update filter logic
  audits = audits.replace(
    "if (selectedType && a.audit_type !== selectedType) return false;\n    return true;",
    "if (selectedType && a.audit_type !== selectedType) return false;\n    if (tableFilterType !== 'All' && a.audit_type !== tableFilterType) return false;\n    return true;"
  );

  // Add the dropdown to the header
  const headerOld = `<div className="p-6 border-b border-gray-800 flex items-center gap-3">\n              <History className="w-5 h-5 text-brand-primary" />\n              <h2 className="text-xl font-bold text-blue-200">Recent Audits</h2>\n            </div>`;
  const headerNew = `<div className="p-6 border-b border-gray-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <History className="w-5 h-5 text-brand-primary" />
                <h2 className="text-xl font-bold text-blue-200">Recent Audits</h2>
              </div>
              <select 
                value={tableFilterType}
                onChange={e => setTableFilterType(e.target.value)}
                className="bg-[#1a1a1a] border border-gray-700 rounded-xl px-3 py-1.5 text-blue-200 text-sm outline-none focus:border-brand-primary"
              >
                <option value="All">All Types</option>
                {auditTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>`;
  audits = audits.replace(headerOld, headerNew);

  fs.writeFileSync('frontend/src/pages/Audits.jsx', audits, 'utf8');
  console.log('Added tableFilterType');
}
