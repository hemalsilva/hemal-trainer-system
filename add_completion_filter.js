const fs = require('fs');
let reports = fs.readFileSync('frontend/src/pages/Reports.jsx', 'utf8');

reports = reports.replace(
  `const [selectedDesignation, setSelectedDesignation] = React.useState('');`,
  `const [selectedDesignation, setSelectedDesignation] = React.useState('');\n  const [completionFilter, setCompletionFilter] = React.useState('all');`
);

const oldFilterLogic = `const uniqueDesignations = [...new Set(overview.map(r => r.designation).filter(Boolean))].sort();
  const filteredOverview = selectedDesignation 
    ? overview.filter(r => r.designation === selectedDesignation) 
    : overview;`;

const newFilterLogic = `const uniqueDesignations = [...new Set(overview.map(r => r.designation).filter(Boolean))].sort();
  let filteredOverview = overview;
  if (selectedDesignation) {
    filteredOverview = filteredOverview.filter(r => r.designation === selectedDesignation);
  }
  if (completionFilter === 'stayover-incomplete') {
    filteredOverview = filteredOverview.filter(r => r.stayover_completed < 20);
  } else if (completionFilter === 'departure-incomplete') {
    filteredOverview = filteredOverview.filter(r => r.departure_completed < 20);
  } else if (completionFilter === 'any-incomplete') {
    filteredOverview = filteredOverview.filter(r => r.stayover_completed < 20 || r.departure_completed < 20);
  } else if (completionFilter === 'fully-completed') {
    filteredOverview = filteredOverview.filter(r => r.stayover_completed >= 20 && r.departure_completed >= 20);
  }`;
reports = reports.replace(oldFilterLogic, newFilterLogic);

const oldHeadingBlock = `<div className="flex items-center justify-between mb-4">
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

const newHeadingBlock = `<div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <h3 className="text-lg font-bold text-blue-200">Employee Audit Scores</h3>
              <div className="flex items-center gap-3">
                <select 
                  value={completionFilter} 
                  onChange={(e) => setCompletionFilter(e.target.value)}
                  className="bg-[#181818] border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-blue-200 focus:border-brand-primary outline-none"
                >
                  <option value="all">All Completion Status</option>
                  <option value="any-incomplete">Any Incomplete</option>
                  <option value="stayover-incomplete">Stayover Incomplete (&lt;20)</option>
                  <option value="departure-incomplete">Departure Incomplete (&lt;20)</option>
                  <option value="fully-completed">Fully Completed (20/20)</option>
                </select>
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
              </div>
            </div>`;

reports = reports.replace(oldHeadingBlock, newHeadingBlock);

fs.writeFileSync('frontend/src/pages/Reports.jsx', reports, 'utf8');
console.log('Successfully added completion filter');
