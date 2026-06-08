const fs = require('fs');

// 1. UPDATE BACKEND
let audits = fs.readFileSync('backend/routes/audits.js', 'utf8');
const newEndpoint = `
// GET /api/audits/overview
// Audit Result Overview excluding Managers/Directors
router.get('/overview', async (req, res) => {
  const { month, year } = req.query;
  try {
    let joinDateCondition = '';
    let params = [];
    if (month && year) {
      joinDateCondition = \`EXTRACT(MONTH FROM ra.audit_date) = $1 AND EXTRACT(YEAR FROM ra.audit_date) = $2\`;
      params = [month, year];
    } else {
      joinDateCondition = \`EXTRACT(MONTH FROM ra.audit_date) = EXTRACT(MONTH FROM CURRENT_DATE) AND EXTRACT(YEAR FROM ra.audit_date) = EXTRACT(YEAR FROM CURRENT_DATE)\`;
    }

    const query = \`
      SELECT 
        e.emp_no, 
        e.full_name as emp_name, 
        e.department, 
        e.designation,
        COUNT(ra.id) FILTER (WHERE ra.audit_type IN ('Stayover', 'IP Stayover')) as stayover_completed,
        AVG(ra.score) FILTER (WHERE ra.audit_type IN ('Stayover', 'IP Stayover')) as stayover_avg,
        COUNT(ra.id) FILTER (WHERE ra.audit_type IN ('Departure', 'IP Departure')) as departure_completed,
        AVG(ra.score) FILTER (WHERE ra.audit_type IN ('Departure', 'IP Departure')) as departure_avg
      FROM employees e
      LEFT JOIN room_audits ra ON e.emp_no = ra.emp_no AND \${joinDateCondition}
      WHERE e.designation NOT ILIKE '%manager%' 
        AND e.designation NOT ILIKE '%director%'
      GROUP BY e.emp_no, e.full_name, e.department, e.designation
      ORDER BY e.full_name ASC
    \`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching audit overview:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;
`;
audits = audits.replace('module.exports = router;', newEndpoint);
fs.writeFileSync('backend/routes/audits.js', audits, 'utf8');

// 2. UPDATE FRONTEND Settings.jsx
let settings = fs.readFileSync('frontend/src/pages/Settings.jsx', 'utf8');

// Ensure necessary imports are in Settings.jsx if not already
if (!settings.includes('Trophy')) {
  settings = settings.replace('import { Printer, Upload,', 'import { Printer, Upload, Trophy, Star, Medal, Award, Target,');
}

// Replace the placeholder
const oldGeneralTab = `{activeTab === 'general' && (
        <div className="bg-brand-card rounded-2xl p-8 border border-gray-800 shadow-lg text-center text-gray-500 py-24">
          <SettingsIcon className="w-16 h-16 mx-auto mb-4 opacity-20" />
          <h2 className="text-xl font-bold text-gray-400 mb-2">General Preferences</h2>
          <p>Global system settings will be configured here in a future update.</p>
        </div>
      )}`;

const newGeneralTab = `{activeTab === 'general' && <GeneralPreferences />}
      `;
      
const generalPrefComponent = `

function GeneralPreferences() {
  const [overview, setOverview] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  
  React.useEffect(() => {
    fetchOverview();
  }, []);
  
  const fetchOverview = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/audits/overview');
      setOverview(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const stWinners = [...overview]
    .filter(e => e.stayover_completed >= 20 && e.stayover_avg != null)
    .sort((a, b) => parseFloat(b.stayover_avg) - parseFloat(a.stayover_avg))
    .slice(0, 3);
    
  const depWinners = [...overview]
    .filter(e => e.departure_completed >= 20 && e.departure_avg != null)
    .sort((a, b) => parseFloat(b.departure_avg) - parseFloat(a.departure_avg))
    .slice(0, 3);

  return (
    <div className="space-y-6">
      <div className="bg-brand-card rounded-2xl p-6 border border-gray-800 shadow-lg">
        <h2 className="text-2xl font-bold text-blue-200 mb-1">Audit Result Overview</h2>
        <p className="text-gray-400 text-sm mb-6">Excludes Managers, Assistant Managers, and Directors. Based on Target: 20 Stayovers / 20 Departures.</p>
        
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Stayover Winners */}
              <div className="bg-[#1a1a1a] rounded-xl p-5 border border-emerald-500/30">
                <h3 className="text-emerald-400 font-bold flex items-center gap-2 mb-4">
                  <span className="p-1.5 bg-emerald-500/20 rounded-lg"><Trophy className="w-5 h-5" /></span>
                  Stayover Top Performers
                </h3>
                {stWinners.length === 0 ? (
                   <p className="text-gray-500 text-sm italic">No employees have completed the minimum 20 Stayovers yet.</p>
                ) : (
                  <div className="space-y-3">
                    {stWinners.map((w, i) => (
                      <div key={w.emp_no} className="flex items-center justify-between bg-gray-900 px-4 py-2.5 rounded-lg border border-gray-800">
                        <div className="flex items-center gap-3">
                           <span className="text-emerald-500 font-black text-lg">#{i+1}</span>
                           <div>
                             <p className="text-blue-200 font-bold">{w.emp_name}</p>
                             <p className="text-gray-500 text-xs">{w.designation}</p>
                           </div>
                        </div>
                        <div className="text-right">
                          <p className="text-emerald-400 font-bold">{parseFloat(w.stayover_avg).toFixed(1)}</p>
                          <p className="text-gray-500 text-[10px] uppercase">{w.stayover_completed} Audits</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Departure Winners */}
              <div className="bg-[#1a1a1a] rounded-xl p-5 border border-purple-500/30">
                <h3 className="text-purple-400 font-bold flex items-center gap-2 mb-4">
                  <span className="p-1.5 bg-purple-500/20 rounded-lg"><Trophy className="w-5 h-5" /></span>
                  Departure Top Performers
                </h3>
                {depWinners.length === 0 ? (
                   <p className="text-gray-500 text-sm italic">No employees have completed the minimum 20 Departures yet.</p>
                ) : (
                  <div className="space-y-3">
                    {depWinners.map((w, i) => (
                      <div key={w.emp_no} className="flex items-center justify-between bg-gray-900 px-4 py-2.5 rounded-lg border border-gray-800">
                        <div className="flex items-center gap-3">
                           <span className="text-purple-500 font-black text-lg">#{i+1}</span>
                           <div>
                             <p className="text-blue-200 font-bold">{w.emp_name}</p>
                             <p className="text-gray-500 text-xs">{w.designation}</p>
                           </div>
                        </div>
                        <div className="text-right">
                          <p className="text-purple-400 font-bold">{parseFloat(w.departure_avg).toFixed(1)}</p>
                          <p className="text-gray-500 text-[10px] uppercase">{w.departure_completed} Audits</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <h3 className="text-lg font-bold text-blue-200 mb-4">Employee Audit Scores</h3>
            <div className="overflow-x-auto rounded-xl border border-gray-800">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#1a1a1a] border-b border-gray-800 text-gray-400 text-xs uppercase tracking-wider">
                    <th className="p-4 font-semibold">Employee</th>
                    <th className="p-4 font-semibold">Designation</th>
                    <th className="p-4 font-semibold text-center border-l border-gray-800">Stayover Audits</th>
                    <th className="p-4 font-semibold text-center text-emerald-400">Stayover Avg</th>
                    <th className="p-4 font-semibold text-center border-l border-gray-800">Departure Audits</th>
                    <th className="p-4 font-semibold text-center text-purple-400">Departure Avg</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800 text-sm">
                  {overview.map(row => (
                    <tr key={row.emp_no} className="hover:bg-[#1a1a1a] transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-blue-200">{row.emp_name}</div>
                        <div className="text-xs text-gray-500">{row.emp_no}</div>
                      </td>
                      <td className="p-4 text-gray-400">{row.designation || 'N/A'}</td>
                      <td className="p-4 text-center border-l border-gray-800">
                        <span className="text-gray-300 font-bold">{row.stayover_completed}</span><span className="text-gray-600"> / 20</span>
                      </td>
                      <td className="p-4 text-center">
                        <span className={\`font-bold \${row.stayover_avg ? 'text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded' : 'text-gray-600'}\`}>
                          {row.stayover_avg ? parseFloat(row.stayover_avg).toFixed(1) : '-'}
                        </span>
                      </td>
                      <td className="p-4 text-center border-l border-gray-800">
                        <span className="text-gray-300 font-bold">{row.departure_completed}</span><span className="text-gray-600"> / 20</span>
                      </td>
                      <td className="p-4 text-center">
                        <span className={\`font-bold \${row.departure_avg ? 'text-purple-400 bg-purple-500/10 px-2 py-1 rounded' : 'text-gray-600'}\`}>
                          {row.departure_avg ? parseFloat(row.departure_avg).toFixed(1) : '-'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

`;

settings = settings.replace(oldGeneralTab, newGeneralTab);

// inject GeneralPreferences before the export default function Settings
const insertIdx = settings.indexOf('export default function Settings');
settings = settings.slice(0, insertIdx) + generalPrefComponent + settings.slice(insertIdx);

fs.writeFileSync('frontend/src/pages/Settings.jsx', settings, 'utf8');

console.log('Successfully added Audit Result Overview to General Preferences');
