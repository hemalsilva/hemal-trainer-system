const fs = require('fs');
let settings = fs.readFileSync('frontend/src/pages/Settings.jsx', 'utf8');

// Add state for selectedDesignation
const stateInjection = `  const [overview, setOverview] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedDesignation, setSelectedDesignation] = React.useState('');`;
settings = settings.replace(`  const [overview, setOverview] = React.useState([]);\n  const [loading, setLoading] = React.useState(true);`, stateInjection);

// Calculate unique designations
const uniqueDesignations = `  const depWinners = [...overview]
    .filter(e => e.departure_completed >= 20 && e.departure_avg != null)
    .sort((a, b) => parseFloat(b.departure_avg) - parseFloat(a.departure_avg))
    .slice(0, 3);

  const uniqueDesignations = [...new Set(overview.map(r => r.designation).filter(Boolean))].sort();
  const filteredOverview = selectedDesignation 
    ? overview.filter(r => r.designation === selectedDesignation) 
    : overview;`;
settings = settings.replace(`  const depWinners = [...overview]
    .filter(e => e.departure_completed >= 20 && e.departure_avg != null)
    .sort((a, b) => parseFloat(b.departure_avg) - parseFloat(a.departure_avg))
    .slice(0, 3);`, uniqueDesignations);

// Add filter dropdown to the heading
const headingOld = `<h3 className="text-lg font-bold text-blue-200 mb-4">Employee Audit Scores</h3>`;
const headingNew = `<div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-blue-200">Employee Audit Scores</h3>
              <select 
                value={selectedDesignation} 
                onChange={(e) => setSelectedDesignation(e.target.value)}
                className="bg-[#181818] border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-blue-200 focus:border-brand-primary outline-none"
              >
                <option value="">All Designations</option>
                {uniqueDesignations.map(desig => (
                  <option key={desig} value={desig}>{desig}</option>
                ))}
              </select>
            </div>`;
settings = settings.replace(headingOld, headingNew);

// Change mapping from overview to filteredOverview
settings = settings.replace(`{overview.map(row => (`, `{filteredOverview.map(row => (`);

fs.writeFileSync('frontend/src/pages/Settings.jsx', settings, 'utf8');
console.log('Added designation filter');
